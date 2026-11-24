/**
 * Helpers for the OP-17 group-B independent card tests. Public API, frozen fixtures and the
 * earlier kits only. Every answer helper here accepts ONE named kind of prompt and fails on
 * anything else, so a missing or extra "up to" / "you may" prompt is caught (EB05-R4).
 */
import { describe, expect, it } from 'vitest';
import type { CardId, Decision, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, attack, blockers, decision, passBlock, passCounter } from '../../helpers.ts';
import {
  canFinish,
  cardOf,
  choices,
  choose,
  donChoices,
  hasEvent,
  identOf,
  kind,
  reachablePickSets,
  RED,
  side,
  stillSameDecision,
  theirTurn,
} from '../kit.ts';
import { BLUE, checkLook, deck, hand, minus, tail, trash } from '../m4b/kit-a.ts';

export * from '../m4b/kit-a.ts';
export {
  act,
  attack,
  attackTargets,
  blockers,
  canAttack,
  isLegal,
  cardIds,
  decision,
  endTurn,
  fill,
  noDefence,
  passBlock,
  passCounter,
  play,
  takeDamage,
} from '../../helpers.ts';

/** Leaders used as scenery. None has an effect that fires unless a test makes it. */
export const LD = {
  /** ST05-001 Shanks: Purple, 5000, 5 Life, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. [Activate: Main] only. */
  rhp: 'ST05-001',
  /** ST04-001 Kaido: Purple, 5000, 5 Life, {Animal Kingdom Pirates}/{The Four Emperors}. [Activate: Main] only. */
  akp: 'ST04-001',
  /** OP03-099 Charlotte Katakuri: Yellow, 5000, 5 Life, {Big Mom Pirates}. [DON!! x1][When Attacking] only. */
  bmp: 'OP03-099',
  /** OP17-079 Monkey.D.Luffy: Black, 5000, 5 Life, {Elbaph}. Characters with cost 12+ gain [Blocker]. */
  elbaph: 'OP17-079',
  /** OP17-039 Rocks.D.Xebec: Blue, 5000, 5 Life, {Rocks Pirates}. [When Attacking] only. */
  rocks: 'OP17-039',
  /** ST09-001 Yamato: Yellow, 5000, 5 Life, {Land of Wano}. No relevant type. */
  neutral: 'ST09-001',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. Vanilla. */
  luffy: 'ST01-001',
  /** OP17-099 Charlotte Linlin: Yellow, 5000, 5 Life, {The Four Emperors}/{Big Mom Pirates}. */
  linlin: 'OP17-099',
} as const;

/** Scenery Characters with the stats the tests rely on (no text that fires on play or attack). */
export const SCN = {
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, {Buggy Pirates}. */
  c1: 'OP02-060',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. */
  c2: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. */
  c3: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. */
  c4: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. */
  c5: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. */
  c6: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. */
  c7: 'OP02-020',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000. */
  c8: 'OP12-005',
  /** OP01-070 Dracule Mihawk: Blue, cost 9, 9000, no Counter. [On Play] only. */
  c9: 'OP01-070',
  /** OP17-118 Rocks.D.Xebec: cost 10, 12000, {Rocks Pirates}. */
  c10: 'OP17-118',
} as const;

// ---------------------------------------------------------------------------------------------
// Strict decision helpers
// ---------------------------------------------------------------------------------------------

/** The pending decision, which must be of kind `k` (owed by `who` when given). */
export function need(g: TestGame, k: string, who?: PlayerId): Decision {
  const d = decision(g);
  if (!d) throw new Error(`Expected a ${k} decision, the game has none`);
  if (d.kind !== k || (who && d.player !== who)) {
    throw new Error(
      `Expected ${k}${who ? ' for ' + who : ''}, got ${d.kind} for ${d.player}: ${d.prompt}`,
    );
  }
  return d;
}

/** True when the game waits for a plain Main Phase action of `who` (nothing else is pending). */
export function atMain(g: TestGame, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return !!d && d.kind === 'main' && d.player === who;
}

/** Say yes to the one pending `optional` (a "you may" or a cost question). Fails on any other prompt. */
export function yes(g: TestGame, who?: PlayerId): void {
  need(g, 'optional', who);
  act(g, { type: 'optional', accept: true });
}

/** Say no to the one pending `optional`. Fails on any other prompt. */
export function no(g: TestGame, who?: PlayerId): void {
  need(g, 'optional', who);
  act(g, { type: 'optional', accept: false });
}

/**
 * The effect was not usable (its cost cannot be paid): either no prompt is asked, or the
 * "use" question is asked with accept unavailable (DECISIONS 2026-10-29) and is declined.
 * Anything else fails.
 */
export function unusable(g: TestGame, who?: PlayerId): void {
  const d = decision(g);
  if (d?.kind !== 'optional') return;
  if (who && d.player !== who) return;
  if (g.legal().some((a) => a.type === 'optional' && a.accept)) {
    throw new Error(`Cost should not be payable but "use" is offered: ${d.prompt}`);
  }
  act(g, { type: 'optional', accept: false });
}

/** True if the pending decision is an `optional` that can be accepted. */
export function canUse(g: TestGame): boolean {
  const d = decision(g);
  return d?.kind === 'optional' && g.legal().some((a) => a.type === 'optional' && a.accept);
}

/** Card ids offered by the pending `choose`, sorted. */
export function offeredIds(g: TestGame): (CardId | null)[] {
  return choices(g)
    .map((i) => cardOf(g, i))
    .sort();
}

/** The offered instance of `card` (nth copy) in the pending `choose`. */
export function offer(g: TestGame, card: CardId, nth = 0): InstanceId {
  const hit = choices(g).filter((i) => cardOf(g, i) === card)[nth];
  if (!hit) throw new Error(`${card} is not offered; offered ${offeredIds(g)} (${kind(g)})`);
  return hit;
}

/**
 * Pick cards by card id, one at a time, always taking the first listed pick that is still wanted
 * (the engine only lists picks that can start a canonical selection, so later picks appear only
 * after earlier ones). Confirms with `done` as `choose` in kit.ts does, and only for the decision it
 * was answering (never the next, empty pick).
 */
function pickByCardIds(g: TestGame, cards: CardId[]): void {
  const before = identOf(g);
  const max = decision(g)?.max;
  const left = [...cards];
  while (left.length) {
    const a = g
      .legal()
      .find(
        (x) =>
          x.type === 'pick' &&
          typeof x.choice === 'string' &&
          left.includes(cardOf(g, x.choice) as CardId),
      );
    if (!a || a.type !== 'pick' || typeof a.choice !== 'string') {
      throw new Error(`Cannot pick ${left}; offered ${offeredIds(g)} (${kind(g)})`);
    }
    left.splice(left.indexOf(cardOf(g, a.choice) as CardId), 1);
    g.act(a);
  }
  if (!stillSameDecision(g, before, cards.length) || !canFinish(g)) return;
  const atMax = max !== undefined && cards.length >= max;
  if (!atMax || choices(g).length === 0) act(g, { type: 'done' });
}

/** Answer the pending exact-N hand cost (a `choose` with purpose cost) with these cards. */
export function payHand(g: TestGame, cards: CardId[]): void {
  const d = need(g, 'choose');
  expect(d.purpose).toBe('cost');
  pickByCardIds(g, cards);
}

/** Pick targets by card id in the pending non-cost `choose` (then `done` when asked), strictly. */
export function pickCards(g: TestGame, cards: CardId[]): void {
  const d = need(g, 'choose');
  expect(d.purpose).not.toBe('cost');
  pickByCardIds(g, cards);
}

/** Pick these exact instances in the pending `choose`. */
export function pickInst(g: TestGame, ids: InstanceId[]): void {
  need(g, 'choose');
  choose(g, ids);
}

/** Choose nothing at a pending "up to" `choose` (it must allow `done`). */
export function none(g: TestGame): void {
  need(g, 'choose');
  if (!canFinish(g)) throw new Error('This choose does not allow choosing nothing');
  act(g, { type: 'done' });
}

/** True if the pending `choose` allows choosing nothing. */
export function mayChooseNone(g: TestGame): boolean {
  return kind(g) === 'choose' && canFinish(g);
}

/** Pay `n` DON!! of a pending DON!! cost pick (from active or rested), strictly. */
export function payDonStrict(
  g: TestGame,
  n: number,
  from: 'costActive' | 'costRested' = 'costActive',
): void {
  for (let i = 0; i < n; i++) {
    need(g, 'choose');
    const want = donChoices(g).find((o) => o.from === from);
    if (!want) throw new Error(`No ${from} DON!! offered`);
    act(g, { type: 'pick', choice: want });
  }
}

/** Number of cards in hand / trash / deck / life, quickly. */
export function n(
  g: TestGame,
  who: PlayerId,
  zone: 'hand' | 'trash' | 'deck' | 'life' | 'characters',
): number {
  return g.zone(who, zone).length;
}

/** First instance of `card` in `who`'s `zone`. */
export function at(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
  card: CardId,
  nth = 0,
): InstanceId {
  return g.find(who, zone, card, nth);
}

/** Keywords of a card instance. */
export function kw(g: TestGame, i: InstanceId): string[] {
  return g.card(i).keywords;
}

/** [Activate: Main] ability ids offered on `card` right now (strict: Main Phase of the deciding player). */
export function offeredAbilities(g: TestGame, card: InstanceId): string[] {
  const d = decision(g);
  if (!d || d.kind !== 'main') return [];
  return [
    ...new Set(
      g.legal().flatMap((a) => (a.type === 'activate' && a.card === card ? [a.ability] : [])),
    ),
  ];
}

/** Activate the single ability offered on `card`; no further prompt is answered. */
export function useAbility(g: TestGame, card: InstanceId): void {
  const [ability, ...more] = offeredAbilities(g, card);
  if (!ability || more.length)
    throw new Error(`Expected exactly one ability on ${card}: ${[ability, ...more]}`);
  act(g, { type: 'activate', card, ability });
}

/** True if `attacker` can legally attack `target` now. */
export function canHit(g: TestGame, attacker: InstanceId, target: InstanceId): boolean {
  return g
    .legal()
    .some((a) => a.type === 'attack' && a.attacker === attacker && a.target === target);
}

/** True if `attacker` has any legal attack now. */
export function canAttackAnything(g: TestGame, attacker: InstanceId): boolean {
  return g.legal().some((a) => a.type === 'attack' && a.attacker === attacker);
}

/** End p1's turn, then p2's turn (p2 does nothing): p1's next Main Phase. */
export function toMyNextMain(g: TestGame): void {
  act(g, { type: 'endTurn' });
  need(g, 'main', 'p2');
  act(g, { type: 'endTurn' });
}

/** Answer pending `order` decisions of `who` with the first listed order, then require the Main Phase. */
export function settleOrders(g: TestGame, who: PlayerId = 'p1'): void {
  for (let i = 0; i < 10 && kind(g) === 'order'; i++) {
    need(g, 'order', who);
    const a = g.legal().find((x) => x.type === 'order');
    if (!a) throw new Error('order decision with no legal order');
    g.act(a);
  }
}

/**
 * Standard tests for "look at n cards from the top of your deck; reveal up to 1 card with a type
 * including "Red-Haired Pirates" and add it to your hand. Then, place the rest at the bottom of
 * your deck in any order." `start(deckTopFirst)` must begin the effect and leave the engine at its
 * first prompt (the candidate `choose`).
 */
export function describeLook(cfg: {
  id: string;
  n: number;
  start: (deckCards: CardId[]) => TestGame;
  /** Two matching cards. */
  match: [CardId, CardId];
  /** A card whose type only includes the name ("Red-Haired Pirates Allies"). */
  substr: CardId;
  /** A non-matching card. */
  miss: CardId;
}): void {
  const { id, n, start, match, substr, miss } = cfg;
  const beyond = match[0];
  const pad = Array.from({ length: n - 3 }, () => miss);
  const top = (): CardId[] => [match[0], miss, match[1], ...pad];
  const rest = (): CardId[] => [beyond, ...Array.from({ length: 8 }, () => BLUE)];
  const begin = (t: CardId[]) => start([...t, ...rest()]);
  const total = n + 9;
  const finish = (g: TestGame) => {
    settleOrders(g);
    expect(atMain(g)).toBe(true);
  };
  describe(`${id} look at ${n}, add up to 1 {Red-Haired Pirates}, rest to the bottom`, () => {
    it('offers exactly the matching cards of the top; the pick goes to hand, the rest to the bottom', () => {
      const g = begin(top());
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toEqual([...match].sort());
      pickCards(g, [match[1]]);
      finish(g);
      expect(hand(g)).toEqual([match[1]]);
      expect(n_(g)).toBe(total - 1);
      expect(deck(g)[0]).toBe(beyond);
      expect(tail(deck(g), n - 1)).toEqual(minus(top(), [match[1]]).sort());
    });

    it('the chosen card is revealed (CR 11-2-1) and the others are not', () => {
      const g = begin(top());
      pickCards(g, [match[1]]);
      finish(g);
      expect(hasEvent(g, 'CardRevealed', { card: match[1] })).toBe(true);
      expect(hasEvent(g, 'CardRevealed', { card: miss })).toBe(false);
    });

    it('"up to": may add nothing; all looked-at cards go to the bottom', () => {
      const g = begin(top());
      need(g, 'choose');
      none(g);
      finish(g);
      expect(hand(g)).toEqual([]);
      expect(deck(g)).toHaveLength(total);
      expect(deck(g)[0]).toBe(beyond);
      expect(tail(deck(g), n)).toEqual([...top()].sort());
    });

    it('adds at most one card even when two qualify', () => {
      const sets = reachablePickSets(begin(top()));
      expect(sets.has('')).toBe(true);
      expect(sets.has(match[0])).toBe(true);
      expect(sets.has(match[1])).toBe(true);
      for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    });

    it(`only the top ${n} are looked at: a match in position ${n + 1} is not offered`, () => {
      const g = begin(Array.from({ length: n }, () => miss));
      checkLookNone(g);
      expect(deck(g)[0]).toBe(beyond);
    });

    it('"type including": a type that merely contains "Red-Haired Pirates" qualifies; a non-matching type does not', () => {
      const g = begin([substr, miss, ...Array.from({ length: n - 2 }, () => miss)]);
      need(g, 'choose');
      expect(offeredIds(g)).toEqual([substr]);
      pickCards(g, [substr]);
      finish(g);
      expect(hand(g)).toEqual([substr]);
    });

    it('with no matching card in the top, the cards still go to the bottom and nothing is added', () => {
      const g = begin(Array.from({ length: n }, () => miss));
      checkLookNone(g);
      expect(deck(g)).toHaveLength(total);
      expect(tail(deck(g), n)).toEqual(Array.from({ length: n }, () => miss).sort());
    });

    it('the looked-at cards leave the top: the next draw is the card that was below them', () => {
      const g = begin(top());
      need(g, 'choose');
      none(g);
      finish(g);
      expect(deck(g)[0]).toBe(beyond);
      expect(deck(g).slice(0, 9)).toEqual(rest());
    });
  });
}

function n_(g: TestGame): number {
  return deck(g).length;
}

/** The candidate prompt may be asked empty or skipped; either way the effect then ends at Main. */
function checkLookNone(g: TestGame): void {
  if (kind(g) === 'choose') {
    expect(choices(g)).toHaveLength(0);
    if (!canFinish(g)) throw new Error('empty choose without done');
    act(g, { type: 'done' });
  }
  settleOrders(g);
  if (!atMain(g)) throw new Error(`Expected Main, got ${kind(g)}`);
}

void checkLook;

/**
 * "[On Your Opponent's Attack] [Once Per Turn] You may trash 1 card from your hand: Up to 1 of
 * your Leader or Characters gains +N power during this battle." on a [Blocker] Character
 * (OP17-064 King +2000, OP17-072 Black Maria +1000). The defender has the Character in play.
 */
export function describeHandBoostBlocker(cfg: { id: CardId; boost: number }): void {
  const { id, boost } = cfg;
  const FODDER = SCN.c2;
  const defend = (o: { hand?: CardId[]; chars?: CardId[]; p2chars?: CardId[] } = {}) => {
    const g = theirTurn(
      side(LD.akp, BLUE, {
        characters: [id, ...(o.chars ?? [])],
        hand: o.hand ?? [FODDER],
      }),
      side(LD.luffy, RED, {
        costArea: { active: 10, rested: 0 },
        characters: o.p2chars ?? [SCN.c3],
      }),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    return g;
  };
  describe(`${id} [Blocker]; [On Your Opponent's Attack] [Once Per Turn] trash 1: +${boost}`, () => {
    it('has [Blocker] and can block once the attack trigger is declined', () => {
      const g = defend();
      expect(g.card(at(g, 'p1', 'characters', id)).keywords).toContain('Blocker');
      need(g, 'optional', 'p1');
      no(g);
      expect(blockers(g)).toEqual([at(g, 'p1', 'characters', id)]);
    });

    it(`trashing 1 card gives my Leader +${boost} during this battle, and the boost decides it`, () => {
      const g = defend({ hand: [BLUE, FODDER] });
      need(g, 'optional', 'p1');
      yes(g);
      payHand(g, [FODDER]);
      need(g, 'choose');
      pickInst(g, [g.leader('p1')]);
      expect(g.power(g.leader('p1'))).toBe(5000 + boost);
      expect(trash(g)).toEqual([FODDER]);
      expect(hand(g)).toEqual([BLUE]);
      passBlock(g);
      passCounter(g);
      expect(g.life('p1')).toBe(4);
    });

    it('without the boost the same attack connects (5000 vs 5000)', () => {
      const g = defend();
      no(g);
      passBlock(g);
      passCounter(g);
      expect(g.life('p1')).toBe(3);
    });

    it('the boost may go to one of my Characters instead', () => {
      const g = defend({ chars: [SCN.c4] });
      yes(g);
      payHand(g, [FODDER]);
      pickCards(g, [SCN.c4]);
      expect(g.power(at(g, 'p1', 'characters', SCN.c4))).toBe(6000 + boost);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it("only my own Leader or Characters are candidates (not the opponent's)", () => {
      const g = defend({ chars: [SCN.c4], p2chars: [SCN.c3] });
      yes(g);
      payHand(g, [FODDER]);
      need(g, 'choose');
      expect(choices(g)).toContain(g.leader('p1'));
      expect(choices(g)).not.toContain(g.leader('p2'));
      expect(offeredIds(g)).toContain(SCN.c4);
      expect(offeredIds(g)).not.toContain(SCN.c3);
    });

    it('declining: nothing trashed, no boost', () => {
      const g = defend();
      no(g);
      expect(hand(g)).toEqual([FODDER]);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('CR 8-3-1-3: with an empty hand the cost cannot be paid', () => {
      const g = defend({ hand: [] });
      unusable(g, 'p1');
      expect(kind(g)).toBe('block');
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('"up to 1": after trashing, the target may be skipped; the card stays trashed', () => {
      const g = defend();
      yes(g);
      payHand(g, [FODDER]);
      need(g, 'choose');
      expect(mayChooseNone(g)).toBe(true);
      none(g);
      expect(g.power(g.leader('p1'))).toBe(5000);
      expect(trash(g)).toEqual([FODDER]);
    });

    it('the boost ends with the battle', () => {
      const g = defend({ hand: [FODDER] });
      yes(g);
      payHand(g, [FODDER]);
      pickInst(g, [g.leader('p1')]);
      passBlock(g);
      passCounter(g);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('[Once Per Turn]: used on the first attack, not offered on the second', () => {
      const g = defend({ hand: [FODDER, SCN.c3] });
      yes(g);
      payHand(g, [FODDER]);
      pickInst(g, [g.leader('p1')]);
      passBlock(g);
      passCounter(g);
      attack(g, g.find('p2', 'characters', SCN.c3), g.leader('p1'));
      expect(canUse(g)).toBe(false);
      unusable(g, 'p1');
      expect(kind(g)).toBe('block');
    });

    it('[Once Per Turn] is spent only when it resolves: declined on the first attack, available on the second', () => {
      const g = defend({ hand: [FODDER, SCN.c3] });
      no(g);
      passBlock(g);
      passCounter(g);
      attack(g, g.find('p2', 'characters', SCN.c3), g.leader('p1'));
      expect(canUse(g)).toBe(true);
    });

    it('is offered when one of my rested Characters is attacked', () => {
      const g = theirTurn(
        side(LD.akp, BLUE, { characters: [id, { card: SCN.c4, rested: true }], hand: [FODDER] }),
        side(LD.luffy, RED, { characters: [SCN.c3] }),
      );
      attack(g, g.find('p2', 'characters', SCN.c3), g.find('p1', 'characters', SCN.c4));
      expect(canUse(g)).toBe(true);
    });
  });
}

/** The Counter-Step action that uses `event` from hand, if any. */
export function counterAction(g: TestGame, event: InstanceId) {
  return g.legal().find((a) => (a.type === 'activate' || a.type === 'counter') && a.card === event);
}

/** True if the Event in hand can be activated as a [Counter] now. */
export function canCounterNow(g: TestGame, event: InstanceId): boolean {
  return kind(g) === 'counter' && counterAction(g, event) !== undefined;
}

/** Activate the Event's [Counter]; no further prompt is answered. */
export function activateCounter(g: TestGame, event: InstanceId): void {
  const a = counterAction(g, event);
  if (!a) throw new Error(`${cardOf(g, event)} cannot be used as a Counter now (${kind(g)})`);
  g.act(a);
}

/** Pay a pending "rest N of your cards" cost with these cards and `donN` active DON!!. */
export function restCost(g: TestGame, cards: InstanceId[], donN = 0): void {
  const d = need(g, 'choose');
  expect(d.purpose).toBe('cost');
  pickInOrder(g, cards, donN, 'costActive');
}

/**
 * Pick exactly these card instances and `donN` DON!! of class `from` in an exact-N `choose`.
 * The engine lists legal picks in its canonical order and only the earliest candidates can start a
 * selection, so each step takes the first listed pick that is wanted. Throws if a wanted item is
 * never offered. Confirms with `done` only if the same decision (not the next one) stays open for a lower minimum.
 */
export function pickInOrder(
  g: TestGame,
  cards: InstanceId[],
  donN = 0,
  from: 'costActive' | 'costRested' = 'costActive',
): void {
  const before = identOf(g);
  const total = cards.length + donN;
  const want = new Set(cards);
  let don_ = donN;
  while (want.size || don_) {
    const pick = g.legal().find((a) => {
      if (a.type !== 'pick') return false;
      if (typeof a.choice === 'string') return want.has(a.choice);
      return don_ > 0 && 'from' in a.choice && a.choice.from === from;
    });
    if (!pick || pick.type !== 'pick') {
      throw new Error(
        `Cannot continue the pick: still want ${[...want].map((c) => cardOf(g, c))} + ${don_} DON!!`,
      );
    }
    if (typeof pick.choice === 'string') want.delete(pick.choice);
    else don_--;
    g.act(pick);
  }
  if (
    stillSameDecision(g, before, total) &&
    kind(g) === 'choose' &&
    canFinish(g) &&
    choices(g).length === 0 &&
    donChoices(g).length === 0
  ) {
    act(g, { type: 'done' });
  }
}
