/**
 * Helpers for the OP-15 group-C independent card tests. Public API, frozen fixtures and the
 * earlier kits only. Answer helpers accept ONE named kind of prompt and fail on anything else, so
 * a missing or extra "up to" / "you may" prompt is caught.
 */
import { describe, expect, it } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, attack, passBlock } from '../../helpers.ts';
import {
  accept,
  at,
  atMain,
  BLUE,
  canFinish,
  cardOf,
  choices,
  choose,
  decline,
  decision,
  donChoices,
  hand,
  kind,
  mine,
  need,
  offered,
  payDon,
  theirs,
  trash,
  unusable,
  chars,
  offeredIds,
} from '../op17/kit-op17b.ts';

export * from '../op17/kit-op17b.ts';
export { result, turn, ids } from '../../helpers.ts';

/** Leaders used as scenery. */
export const LD15 = {
  /** OP06-021 Perona: Green/Black, 5000, 4 Life, {Thriller Bark Pirates}. [Activate: Main] only. */
  tbp: 'OP06-021',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. [Activate: Main] only. */
  shc: 'ST01-001',
  /** OP05-098 Enel: Yellow, 5000, 4 Life, {Sky Island}. Only an [Opponent's Turn] effect when Life hits 0. */
  sky: 'OP05-098',
  /** OP15-098 Monkey.D.Luffy: Yellow, 5000, 5 Life, {Straw Hat Crew}/{Sky Island}. */
  skyShc: 'OP15-098',
  /** OP08-098 Kalgara: Yellow, 5000, 5 Life, {Sky Island}/{Shandian Warrior}/{Jaya}. [DON!! x1][When Attacking] only. */
  shandian: 'OP08-098',
  /** ST09-001 Yamato: Yellow, 5000, 5 Life, {Land of Wano}. No type any group-C card looks for. */
  neutral: 'ST09-001',
} as const;

/** Scenery cards with the stats the tests rely on (vanilla unless noted). */
export const SC15 = {
  /** OP06-094 Lola: Black, cost 4, 6000, Counter +1000, {Thriller Bark Pirates}. */
  lola: 'OP06-094',
  /** OP04-007 Sanji: Red, cost 1, 3000, Counter +1000, {Alabasta}/{Straw Hat Crew}. */
  shc1: 'OP04-007',
  /** ST08-011 Monkey.D.Luffy: Black, cost 3, 5000, Counter +1000, {Straw Hat Crew}. */
  shc3: 'ST08-011',
  /** ST14-005 Tony Tony.Chopper: Black, cost 4, 6000, Counter +1000, {Animal}/{Straw Hat Crew}. Named Chopper. */
  chopper4: 'ST14-005',
  /** ST14-010 Brook: Black, cost 5, 7000, Counter +1000, {Straw Hat Crew}. */
  shc5: 'ST14-010',
  /** ST14-013 Roronoa Zoro: Black, cost 6, 8000, Counter +1000, {Straw Hat Crew}. */
  shc6: 'ST14-013',
  /** OP09-067 Jinbe: Purple, cost 7, 9000, Counter +1000, {Fish-Man}/{Straw Hat Crew}. */
  shc7: 'OP09-067',
  /** OP16-086 Sanji: Black, cost 8, 9000, Counter +2000, {Land of Wano}/{Straw Hat Crew}. */
  shc8: 'OP16-086',
  /** OP06-105 Genbo: Yellow, cost 3, 5000, Counter +1000, {Sky Island}/{Shandian Warrior}. */
  sky3: 'OP06-105',
  /** OP05-108 Nola: Yellow, cost 5, 7000, Counter +1000, {Animal}/{Sky Island}. */
  sky5x7: 'OP05-108',
  /** OP12-103 Seto: Yellow, cost 5, 6000, Counter +2000, {Sky Island}/{Shandian Warrior}/{Jaya}. */
  sky5: 'OP12-103',
  /** OP12-114 Wyper: Yellow, cost 6, 7000, Counter +2000, {Sky Island}/{Shandian Warrior}. */
  sky6: 'OP12-114',
  /** OP08-099 Kalgara: Yellow, cost 6, 8000, Counter +1000, {Sky Island}/{Shandian Warrior}/{Jaya}. Named Kalgara. */
  kalgara: 'OP08-099',
  /** OP03-103 Bobbin the Disposer: Yellow, cost 2, 4000, Counter +1000, {Big Mom Pirates}. */
  yellow2: 'OP03-103',
  /** OP03-101 Camie: Yellow, cost 1, 3000, Counter +1000, {Merfolk}. */
  yellow1: 'OP03-101',
  /** EB02-060 Merry Go: Yellow Stage, cost 2, {Straw Hat Crew}. Only an [Activate: Main]. */
  yellowStage2: 'EB02-060',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. */
  red2: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. */
  red3: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. */
  red4: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. */
  red5: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. */
  red6: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. */
  red7: 'OP02-020',
  /** OP01-104 Speed: Purple, cost 2, 3000, "[Trigger] Play this card." */
  speed: 'OP01-104',
  /** OP09-077 Gum-Gum Lightning: Purple Event, cost 2, [Main] DON!! -2: K.O. up to 1 opponent Character with 6000 power or less. */
  lightning: 'OP09-077',
  /** OP17-056 Rocks Pirates: Blue Event, cost 0, [Main] rest 5 DON!!: return up to 1 Character with cost 6 or less to hand. */
  bounce: 'OP17-056',
  /** OP17-046 Gloriosa: Blue Character, cost 4, [On Play] place up to 1 Character with cost 5 or less at the bottom of the owner's deck. */
  gloriosa: 'OP17-046',
} as const;

// ---------------------------------------------------------------------------------------------
// Playing and answering
// ---------------------------------------------------------------------------------------------

/**
 * Play a card from the deciding player's hand with a raw action, paying DON!! only if the engine
 * asks which class to take. Never answers a target choice (EB05-R4, OP-16 R6).
 */
export function playRaw(g: TestGame, card: InstanceId): void {
  const player = g.decider;
  act(g, { type: 'playCard', card });
  for (let i = 0; i < 20; i++) {
    const d = decision(g);
    if (d?.kind !== 'choose' || d.player !== player || d.purpose !== 'cost') return;
    const pay = donChoices(g).find((o) => o.from === 'costActive');
    if (!pay) return;
    act(g, { type: 'pick', choice: pay });
  }
}

/** Play `card` from p1's hand (see `playRaw`). */
export function playIt(g: TestGame, card: CardId): void {
  playRaw(g, g.find('p1', 'hand', card));
}

/** Pick these cards (by card id) in the pending `choose`, whatever its purpose, then `done` when asked. */
export function pickAny(g: TestGame, cards: CardId[]): void {
  need(g, 'choose');
  const player = g.decider;
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
  if (decision(g)?.player !== player || !canFinish(g)) return;
  const atMax = max !== undefined && cards.length >= max;
  if (!atMax || choices(g).length === 0) act(g, { type: 'done' });
}

/** Choose none at a pending "up to" choose (fails if it does not allow it). */
export function skipChoice(g: TestGame): void {
  need(g, 'choose');
  if (!canFinish(g)) throw new Error('This choose does not allow choosing nothing');
  act(g, { type: 'done' });
}

/**
 * After an effect step that may or may not ask a "choose" whose only candidates are determined
 * (for example "add up to 1 card from the top of your deck to your Life"), take what is offered.
 */
export function takeIfAsked(g: TestGame): void {
  const d = decision(g);
  if (d?.kind !== 'choose') return;
  if (d.purpose === 'mode' && d.options && d.options.length) {
    act(g, { type: 'pick', choice: { option: d.options[0]!.id } });
    return;
  }
  const first = choices(g)[0];
  if (first) choose(g, [first]);
  else if (canFinish(g)) act(g, { type: 'done' });
}

/** Resolve any `order` decision of `who` with the first listed order. */
export function anyOrder(g: TestGame, who: PlayerId = 'p1'): void {
  for (let i = 0; i < 10 && kind(g) === 'order'; i++) {
    need(g, 'order', who);
    const a = g.legal().find((x) => x.type === 'order');
    if (!a) throw new Error('order decision with no legal order');
    g.act(a);
  }
}

/** A deck of the given top cards (top first) followed by `pad` plain cards. */
export function deckTop(top: CardId[], pad = 10): CardId[] {
  return [...top, ...Array.from({ length: pad }, () => BLUE)];
}

/** n copies of a card. */
export function many(card: CardId, n: number): CardId[] {
  return Array.from({ length: n }, () => card);
}

/** A trash of n plain cards. */
export function junk(n: number): CardId[] {
  return many(SC15.red2, n);
}

// ---------------------------------------------------------------------------------------------
// Removal by the opponent, played by p2 in a game built with `theirs` (p1 defends)
// ---------------------------------------------------------------------------------------------

/** p2 plays OP09-077 Gum-Gum Lightning (DON!! −2) at one of p1's Characters. Stops after the target is chosen. */
export function koEffect(g: TestGame, target: InstanceId): void {
  act(g, { type: 'playCard', card: g.find('p2', 'hand', SC15.lightning) });
  if (offered(g, 'p2')) accept(g);
  payDon(g, 2, 'costRested');
  choose(g, [target]);
}

/** p2 plays OP17-056 Rocks Pirates (rest 5 DON!!): return the target to its owner's hand. */
export function bounceEffect(g: TestGame, target: InstanceId): void {
  act(g, { type: 'playCard', card: g.find('p2', 'hand', SC15.bounce) });
  if (offered(g, 'p2')) accept(g);
  payDon(g, 5);
  choose(g, [target]);
}

/** p2 plays OP17-046 Gloriosa: place the target at the bottom of its owner's deck. */
export function bottomEffect(g: TestGame, target: InstanceId): void {
  act(g, { type: 'playCard', card: g.find('p2', 'hand', SC15.gloriosa) });
  choose(g, [target]);
}

/** p2's Leader attacks p1's rested `target`; p1 neither blocks nor counters. */
export function battleKo(g: TestGame, target: InstanceId): void {
  attack(g, g.leader('p2'), target);
  passBlock(g);
  if (kind(g) === 'counter') act(g, { type: 'endCounter' });
}

/** Both players' removal events in p2's hand, plus a spare Gloriosa. */
export const P2_REMOVAL: CardId[] = [SC15.lightning, SC15.bounce, SC15.gloriosa];

/** p2's Main Phase with removal in hand; p1 defends with the given spec. */
export function theirsWith(
  leader: string,
  p1: Parameters<typeof theirs>[1] = {},
  p2: Parameters<typeof theirs>[2] = {},
): TestGame {
  return theirs(leader, p1, { hand: P2_REMOVAL, ...p2 });
}

// ---------------------------------------------------------------------------------------------
// "If your Character with 7000 base power or less would be removed from the field by your
// opponent's effect, you may <pay> instead" (OP15-090 Perona, OP15-105 Jewelry Bonney)
// ---------------------------------------------------------------------------------------------

/** Where a card instance is now: its zone, or 'gone' when it became a new object in another zone. */
export function zoneOf(g: TestGame, instance: InstanceId): string {
  try {
    return g.card(instance).zone;
  } catch {
    return 'gone';
  }
}

export function describeReplace7000(cfg: {
  id: CardId;
  cost: 'hand' | 'life';
  /** Leader of p1. */
  leader?: string;
}): void {
  const { id, cost } = cfg;
  const leader = cfg.leader ?? LD15.neutral;
  const FODDER = SC15.red3;
  const start = (
    o: {
      chars?: (CardId | { card: CardId; rested: boolean })[];
      hand?: CardId[];
      life?: CardId[];
    } = {},
  ) =>
    theirsWith(
      leader,
      {
        characters: o.chars ?? [id, SC15.lola],
        hand: o.hand ?? (cost === 'hand' ? [FODDER, SC15.red2] : [FODDER]),
        ...(o.life ? { life: o.life } : {}),
      },
      {},
    );
  const lola = (g: TestGame) => at(g, 'p1', 'characters', SC15.lola);
  const payNow = (g: TestGame) => {
    accept(g);
    if (cost === 'hand') pickAny(g, [FODDER]);
  };
  describe(`${id} replacement: may pay (${cost}) instead of a ≤7000-base Character leaving by the opponent's effect`, () => {
    it('a 6000-base Character K.O.’d by an effect: the replacement is offered; paying keeps it on the field', () => {
      const g = start();
      const l = lola(g);
      koEffect(g, l);
      expect(offered(g, 'p1')).toBe(true);
      payNow(g);
      expect(g.card(l).zone).toBe('characters');
      expect(atMain(g, 'p2')).toBe(true);
      if (cost === 'hand') {
        expect(trash(g)).toEqual([FODDER]);
        expect(hand(g)).toEqual([SC15.red2]);
      } else {
        expect(g.life('p1')).toBe(3);
        expect(hand(g)).toEqual([FODDER, BLUE].sort());
      }
    });

    it('"may": declining lets the K.O. happen and pays nothing', () => {
      const g = start();
      const l = lola(g);
      koEffect(g, l);
      need(g, 'optional', 'p1');
      decline(g);
      expect(trash(g)).toEqual([SC15.lola]);
      expect(zoneOf(g, l)).toBe('gone');
      expect(g.life('p1')).toBe(4);
      expect(hand(g)).toEqual(cost === 'hand' ? [FODDER, SC15.red2].sort() : [FODDER]);
    });

    it('the card itself (2000 base power) is covered', () => {
      const g = start();
      const me = at(g, 'p1', 'characters', id);
      koEffect(g, me);
      expect(offered(g, 'p1')).toBe(true);
      payNow(g);
      expect(g.card(me).zone).toBe('characters');
    });

    it('boundary: 7000 base power (cost 5 Kingdew) returned to hand by an effect is covered', () => {
      const g = start({ chars: [id, SC15.red5] });
      const k = at(g, 'p1', 'characters', SC15.red5);
      bounceEffect(g, k);
      expect(offered(g, 'p1')).toBe(true);
      payNow(g);
      expect(g.card(k).zone).toBe('characters');
    });

    it('boundary: 8000 base power (cost 6 Thatch) is not covered: no prompt, it returns to hand', () => {
      const g = start({ chars: [id, SC15.red6] });
      const t = at(g, 'p1', 'characters', SC15.red6);
      bounceEffect(g, t);
      expect(kind(g)).not.toBe('optional');
      expect(hand(g)).toContain(SC15.red6);
      expect(chars(g)).toEqual([id]);
      expect(atMain(g, 'p2')).toBe(true);
    });

    it('placing at the bottom of the deck is also a removal and is covered', () => {
      const g = start();
      const l = lola(g);
      bottomEffect(g, l);
      expect(offered(g, 'p1')).toBe(true);
      payNow(g);
      expect(g.card(l).zone).toBe('characters');
    });

    it(
      cost === 'hand'
        ? 'with an empty hand the replacement cannot be applied: the K.O. happens'
        : 'with no Life cards the replacement cannot be applied: the K.O. happens',
      () => {
        const g = cost === 'hand' ? start({ hand: [] }) : start({ life: [] });
        const l = lola(g);
        koEffect(g, l);
        unusable(g, 'p1');
        expect(trash(g)).toEqual([SC15.lola]);
        expect(chars(g)).toEqual([id]);
        expect(atMain(g, 'p2')).toBe(true);
      },
    );

    it('a battle K.O. is not an effect: no prompt, the Character is K.O.’d', () => {
      const g = start({ chars: [{ card: id, rested: true }, SC15.lola] });
      battleKo(g, at(g, 'p1', 'characters', id));
      expect(kind(g)).not.toBe('optional');
      expect(trash(g)).toEqual([id]);
    });

    it('the opponent’s Characters are not protected when I remove them', () => {
      const g = mine(
        leader,
        { hand: [SC15.lightning], characters: [id] },
        { characters: [SC15.lola] },
      );
      const theirLola = g.find('p2', 'characters', SC15.lola);
      act(g, { type: 'playCard', card: g.find('p1', 'hand', SC15.lightning) });
      if (offered(g, 'p1')) accept(g);
      payDon(g, 2, 'costRested');
      choose(g, [theirLola]);
      expect(kind(g)).not.toBe('optional');
      expect(trash(g, 'p2')).toEqual([SC15.lola]);
      expect(atMain(g, 'p1')).toBe(true);
    });
  });
}
