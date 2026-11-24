/**
 * Helpers for the OP-13 group-D independent card tests (OP13-089 .. OP13-120). Public API, frozen
 * fixtures and the earlier kits only. Answer helpers accept ONE named kind of prompt and fail on
 * anything else, so a missing or extra "up to" / "you may" prompt is caught. Nothing here sends
 * `done` on its own after a pick (the empty-pick trap, DECISIONS "empty-pick investigation").
 */
import { describe, expect, it } from 'vitest';
import type { CardId, CardPlacement, InstanceId, PlayerId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, attack, blockers, passBlock } from '../../helpers.ts';
import {
  at,
  atMain,
  canFinish,
  cardOf,
  choices,
  decision,
  kind,
  need,
  offered,
  payDon,
  SC15,
  accept,
  theirs,
  mine,
  BLUE,
  RED,
  hand,
  chars,
  trash,
  theirsWith,
  side,
  theirTurn,
  LEAD,
  useAbility,
} from '../op15/kit-op15c.ts';

export * from '../op15/kit-op15c.ts';

/** Leaders used as scenery. */
export const LD13 = {
  /** ST06-001 Sakazuki: Black, 5000, 5 Life, {Navy}. [Activate: Main] only. */
  black: 'ST06-001',
  /** OP13-079 Imu: Black, 5000, 4 Life, no type. Only a deck-building rule. */
  imu: 'OP13-079',
  /** EB04-001 Jewelry Bonney: Red/Yellow (multicolored), 4 Life, {Bonney Pirates}/{Egghead}. Opponent's-turn text only. */
  eggMulti: 'EB04-001',
  /** ST29-001 Monkey.D.Luffy: Yellow (mono), 6 Life, {Straw Hat Crew}/{The Four Emperors}/{Egghead}. [When Attacking] only. */
  eggMono: 'ST29-001',
  /** ST09-001 Yamato: Yellow (mono), 5 Life, {Land of Wano}. No relevant type. */
  yellow: 'ST09-001',
  /** OP13-100 Jewelry Bonney: Yellow, 5 Life, {Bonney Pirates}/{Egghead}. The card under test in OP13-100. */
  bonney: 'OP13-100',
} as const;

/** Scenery cards. */
export const S13 = {
  /** OP13-085 Saint Jalmac: Black, cost 2, 4000, Counter +1000, {Celestial Dragons}, vanilla. */
  jalmac: 'OP13-085',
  /** OP05-097 Mary Geoise: Black Stage, cost 1, {Mary Geoise}. */
  maryGeoise: 'OP05-097',
  /** OP05-117 Upper Yard: Yellow Stage, cost 1, {Sky Island}. */
  upperYard: 'OP05-117',
  /** EB04-010 Lulucia Kingdom: Red Stage, cost 7. Only an [Opponent's Turn] / [On Play] text. */
  stage7: 'EB04-010',
  /** OP06-041 The Ark Noah: Green Stage, cost 6, "[Trigger] Play this card" (its [On Play] only fires when played). */
  stage6: 'OP06-041',
  /** OP01-104 Speed: Purple, cost 2, 3000, [Trigger] Play this card. */
  speed: 'OP01-104',
  /** OP17-107 Charlotte Daifuku: Yellow, cost 3, 4000, vanilla, [Trigger] Play this card (scripted, so it really plays from Life). */
  daifuku: 'OP17-107',
  /** OP13-109 Jewelry Bonney: Yellow, cost 5, 6000, has a [Trigger] (draw 2, trash 1); its static text only matters when removed. */
  bonney5: 'OP13-109',
  /** OP04-111 Hera: Yellow, cost 5, 3000, {Big Mom Pirates}/{Homies}, [Trigger] Play this card; only an [Activate: Main]. */
  hera: 'OP04-111',
  /** OP14-105 Gorgon Sisters: Yellow, cost 6, 5000, [Trigger] (conditional play); only an [Activate: Main]. */
  gorgon: 'OP14-105',
  /** OP06-105 Genbo: Yellow, cost 3, 5000, vanilla, no [Trigger]. */
  genbo: 'OP06-105',
  /** OP02-043 Roronoa Zoro: Green, cost 4, 6000, {FILM}/{Straw Hat Crew}/{Supernovas}, vanilla. */
  zoroSn: 'OP02-043',
  /** OP14-008 Scratchmen Apoo: Red, cost 3, 5000, {On-Air Pirates}/{Supernovas}, vanilla. */
  apooSn: 'OP14-008',
} as const;

// ---------------------------------------------------------------------------------------------
// Strict raw answers
// ---------------------------------------------------------------------------------------------

/** Pick these cards (by card id) in the pending exact-N hand cost, with raw picks only. Never sends `done`. */
export function payHandRaw(g: TestGame, cards: CardId[]): void {
  const d = need(g, 'choose');
  expect(d.purpose).toBe('cost');
  pickSet(g, cards);
}

/** Pick one offered instance whose card id is `card`, with a raw pick. */
export function pickRawCard(g: TestGame, card: CardId, nth = 0): InstanceId {
  const hit = choices(g).filter((i) => cardOf(g, i) === card)[nth];
  if (!hit) {
    throw new Error(
      `${card} is not offered; offered ${choices(g).map((i) => cardOf(g, i))} (${kind(g)}: ${decision(g)?.prompt})`,
    );
  }
  act(g, { type: 'pick', choice: hit });
  return hit;
}

/** Pick this instance with a raw pick (it must be offered). */
export function pickRaw(g: TestGame, instance: InstanceId): void {
  if (!choices(g).includes(instance)) {
    throw new Error(`${instance} (${cardOf(g, instance)}) is not offered (${decision(g)?.prompt})`);
  }
  act(g, { type: 'pick', choice: instance });
}

/**
 * Pick these cards (by card id) in one pending multi-pick, with raw picks only and never `done`.
 * The engine lists only the picks that can start a canonical selection (instance order), so each
 * step takes the first listed pick that is still wanted; throws if none is.
 */
export function pickSet(g: TestGame, cards: CardId[]): void {
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
      throw new Error(
        `Cannot pick ${left}; offered ${choices(g).map((i) => cardOf(g, i))} (${kind(g)}: ${decision(g)?.prompt})`,
      );
    }
    left.splice(left.indexOf(cardOf(g, a.choice) as CardId), 1);
    g.act(a);
  }
}

/** Raw `done` at a pending `choose` that allows it. */
export function doneRaw(g: TestGame): void {
  need(g, 'choose');
  if (!canFinish(g)) throw new Error('This choose does not allow done');
  act(g, { type: 'done' });
}

/** Number of candidates the pending `choose` offers. */
export function offeredCount(g: TestGame): number {
  return choices(g).length;
}

/** Answer a pending "how many DON!! will you give" count (option ids are the counts). */
export function giveCount(g: TestGame, n: number): void {
  const d = need(g, 'choose');
  expect(d.purpose).toBe('mode');
  act(g, { type: 'pick', choice: { option: String(n) } });
}

/** The face-up flags of a player's Life cards, top first. */
export function lifeFaces(g: TestGame, who: PlayerId = 'p1'): boolean[] {
  return g.zone(who, 'life').map((c) => c.faceUp);
}

/** Take cost, if the engine asks the whole effect as one optional "use" question, accepting it. */
export function maybeAccept(g: TestGame, who: PlayerId): void {
  if (offered(g, who)) accept(g);
}

// ---------------------------------------------------------------------------------------------
// Opposing removal that does not assume the target is offered (a protected Character may be
// filtered out of the target pick or picked and left alone; both end the same way)
// ---------------------------------------------------------------------------------------------

/** Pick `target` if the pending `choose` offers it, else end the pick if it allows that. */
function aimOrSkip(g: TestGame, target: InstanceId): void {
  if (kind(g) !== 'choose') return;
  if (choices(g).includes(target)) {
    act(g, { type: 'pick', choice: target });
  } else if (canFinish(g)) {
    act(g, { type: 'done' });
  }
}

/** p2 plays OP09-077 Gum-Gum Lightning (DON!! -2) aiming at `target`. Ends when the effect is over. */
export function koAim(g: TestGame, target: InstanceId): void {
  act(g, { type: 'playCard', card: g.find('p2', 'hand', SC15.lightning) });
  maybeAccept(g, 'p2');
  payDon(g, 2, 'costRested');
  aimOrSkip(g, target);
}

/** p2 plays OP17-056 Rocks Pirates (rest 5 DON!!): return cost <= 6 to hand, aiming at `target`. */
export function bounceAim(g: TestGame, target: InstanceId): void {
  act(g, { type: 'playCard', card: g.find('p2', 'hand', SC15.bounce) });
  maybeAccept(g, 'p2');
  payDon(g, 5);
  aimOrSkip(g, target);
}

/** p2 plays OP17-046 Gloriosa: place a cost <= 5 Character at the bottom of its owner's deck. */
export function bottomAim(g: TestGame, target: InstanceId): void {
  act(g, { type: 'playCard', card: g.find('p2', 'hand', SC15.gloriosa) });
  aimOrSkip(g, target);
}

/** p2 attacks p1's rested `target` with its Leader; p1 neither blocks nor counters. Stops at the next real decision. */
export function hitRested(g: TestGame, target: InstanceId): void {
  attack(g, g.leader('p2'), target);
  passBlock(g);
  if (kind(g) === 'counter') act(g, { type: 'endCounter' });
}

/** Total number of cards p1 owns in these zones (conservation checks). */
export function total(g: TestGame, who: PlayerId = 'p1'): number {
  return (['hand', 'deck', 'trash', 'life', 'characters'] as const).reduce(
    (n, z) => n + g.zone(who, z).length,
    0,
  );
}

/** A deck whose first cards are `top` followed by `pad` plain cards (top first). */
export function deckWith(top: CardId[], pad = 12): CardId[] {
  return [...top, ...Array.from({ length: pad }, () => BLUE)];
}

/** A trash of exactly n plain cards (0 = empty). */
export function pile(n: number, card: CardId = SC15.red2): CardId[] {
  return Array.from({ length: n }, () => card);
}

/** Keywords of a card instance. */
export function keywordsOf(g: TestGame, instance: InstanceId): string[] {
  return g.card(instance).keywords;
}

/** True if the engine's legal actions let `who` play this card from hand right now. */
export function canPlayFromHand(g: TestGame, card: InstanceId): boolean {
  return g.legal().some((a) => a.type === 'playCard' && a.card === card);
}

// ---------------------------------------------------------------------------------------------
// "If you have 7 or more cards in your trash, this Character cannot be removed from the field by
// your opponent's effects and gains [Blocker]." (OP13-089, OP13-091)
// ---------------------------------------------------------------------------------------------

export function describeFiveEldersShield(cfg: { id: CardId; cost: number }): void {
  const { id, cost } = cfg;
  const start = (trashN: number, p2Trash = 0, rested = false) =>
    theirsWith(
      LD13.black,
      { characters: [rested ? { card: id, rested: true } : id], trash: pile(trashN), hand: [] },
      { trash: pile(p2Trash) },
    );
  const me = (g: TestGame) => at(g, 'p1', 'characters', id);
  describe(`${id} shield: 7 or more cards in my trash`, () => {
    it('boundary: it has [Blocker] with 7 cards in the trash, not with 6', () => {
      const g7 = start(7);
      expect(keywordsOf(g7, me(g7))).toContain('Blocker');
      const g6 = start(6);
      expect(keywordsOf(g6, me(g6))).not.toContain('Blocker');
    });

    it('7 cards: an opposing K.O. effect does not remove it', () => {
      const g = start(7);
      koAim(g, me(g));
      expect(chars(g)).toEqual([id]);
      expect(trash(g)).toEqual(pile(7));
      expect(atMain(g, 'p2')).toBe(true);
    });

    it('6 cards: the same K.O. effect removes it', () => {
      const g = start(6);
      koAim(g, me(g));
      expect(chars(g)).toEqual([]);
      expect(trash(g)).toEqual([...pile(6), id].sort());
    });

    it('7 cards: returning it to the hand is also blocked', () => {
      const g = start(7);
      bounceAim(g, me(g));
      expect(chars(g)).toEqual([id]);
      expect(hand(g)).toEqual([]);
    });

    it('6 cards: the same return-to-hand works', () => {
      const g = start(6);
      bounceAim(g, me(g));
      expect(chars(g)).toEqual([]);
      expect(hand(g)).toEqual([id]);
    });

    if (cost <= 5) {
      it('7 cards: placing it at the bottom of the deck is also blocked', () => {
        const g = start(7);
        bottomAim(g, me(g));
        expect(chars(g)).toEqual([id]);
        expect(g.zone('p1', 'deck').at(-1)?.card).not.toBe(id);
      });
    }

    it('7 cards: a battle K.O. is not an effect and still removes it', () => {
      const g = start(7, 0, true);
      hitRested(g, me(g));
      expect(chars(g)).toEqual([]);
      expect(trash(g)).toContain(id);
    });

    it('7 cards: my own effect can still remove it (only the opponent is shut out)', () => {
      const g = mine(LD13.black, {
        characters: [id],
        trash: pile(7),
        hand: [SC15.bounce],
      });
      act(g, { type: 'playCard', card: g.find('p1', 'hand', SC15.bounce) });
      maybeAccept(g, 'p1');
      payDon(g, 5);
      pickRaw(g, me(g));
      expect(chars(g)).toEqual([]);
      expect(hand(g)).toEqual([id]);
    });

    it('only my own trash counts: my 6 cards with 7 in the opponent trash give no protection', () => {
      const g = start(6, 7);
      koAim(g, me(g));
      expect(chars(g)).toEqual([]);
    });

    it('7 cards: it can block, and it is the only legal blocker', () => {
      const g = start(7);
      attack(g, g.leader('p2'), g.leader('p1'));
      expect(blockers(g)).toEqual([me(g)]);
    });
  });
}

/** Like `theirs` but the defending Leader may be a placement (for example with given DON!!). */
export function theirsP(
  leader: CardId | CardPlacement,
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
): TestGame {
  return theirTurn(
    { ...side(LD13.yellow, BLUE, { costArea: { active: 0, rested: 0 }, ...p1 }), leader },
    side(LEAD.luffy, RED, { costArea: { active: 10, rested: 0 }, ...p2 }),
  );
}

/**
 * A position at p1's Main Phase in which p2 gave `boosted` +2 cost with OP13-120 Sabo on p2's own
 * turn ("until the end of your opponent's next turn": it holds through p1's turn). The opposing
 * `boosted` Character then has a current cost 2 above its base cost, so base-cost and current-cost
 * filters tell apart. p2 also has Sabo (base cost 6). `p1` is the spec for p1 (DON!! refresh at its turn).
 */
export function afterOpponentSabo(
  leader: string,
  p1: Partial<PlayerSpec>,
  boosted: CardId,
): TestGame {
  const g = theirs(
    leader,
    { costArea: { active: 0, rested: 8 }, ...p1 },
    {
      characters: ['OP13-120', boosted],
    },
  );
  useAbility(g, g.find('p2', 'characters', 'OP13-120'));
  pickRaw(g, g.find('p2', 'characters', boosted));
  if (kind(g) === 'choose') {
    const c = choices(g);
    if (c.length) pickRaw(g, c[0]!);
    else doneRaw(g);
  }
  act(g, { type: 'endTurn' });
  need(g, 'main', 'p1');
  return g;
}
