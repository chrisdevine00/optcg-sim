/**
 * Helpers for the OP-14 group-D independent card tests (OP14-087 .. OP14-120). Public API, frozen
 * fixtures and the earlier kits only. Every answer helper accepts ONE named kind of prompt and
 * fails on anything else, so a missing or extra "up to" / "you may" prompt is caught. Cards are
 * played with raw actions (`playRaw`), never with a helper that could answer a target choice.
 */
import { describe, expect, it } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { canFinish, choices, donChoices, kind, reachablePickSets } from '../kit.ts';
import {
  activateTrigger,
  atMain,
  BLUE,
  deck,
  hand,
  hitLeader,
  need,
  none,
  offeredIds,
  pickCards,
  settleOrders,
  tail,
  theirs,
  trash,
} from '../op16/kit-op16c.ts';

export * from '../op16/kit-op16c.ts';
export { opponentKOs, block, inst, rested } from '../op16/kit-op16b.ts';

/** Leaders used as scenery. */
export const LD14 = {
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, {Baroque Works}/{The Seven Warlords of the Sea}. Only an [Activate: Main] (DON!! -4). */
  bw: 'ST03-001',
  /** ST09-001 Yamato: Yellow, 5000, 5 Life, {Land of Wano}. No relevant type. */
  neutral: 'ST09-001',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}. Vanilla. */
  luffy: 'ST01-001',
  /** OP07-038 Boa Hancock: Blue, 5000, 5 Life, {Kuja Pirates}/{The Seven Warlords of the Sea}. Only a [Your Turn] draw tied to own-effect removals. */
  kuja: 'OP07-038',
  /** OP06-021 Perona: Green/Black, 5000, 5 Life, {Thriller Bark Pirates}. Only an [Activate: Main]. */
  tb: 'OP06-021',
  /** OP14-079 Crocodile: Black, 5000, 5 Life, {Baroque Works}. [Activate: Main] [Once Per Turn] You may K.O. 1 of your {Baroque Works} Characters: give -10 cost, then may trash 2 from the deck. */
  bwKo: 'OP14-079',
} as const;

/** Scenery cards (stats repeated where a test relies on them). */
export const SC14 = {
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. Plain, no type, no [Trigger]. */
  c2: 'OP01-012',
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
  /** OP01-070 Dracule Mihawk: Blue, cost 9, 9000, no Counter. [On Play] only: never played here. */
  c9: 'OP01-070',
  /** OP17-118 Rocks.D.Xebec: cost 10, 12000, {Rocks Pirates}. */
  c10: 'OP17-118',
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, {Buggy Pirates}. Vanilla: becomes cost 0 under `shrink`. */
  c1: 'OP02-060',
  /** OP17-097 (Black Event, cost 1): [Main] give ALL opposing Characters -1 cost this turn; [Counter] Leader +3000. Makes a cost-1 Character cost 0 (and drops every other cost by 1). */
  shrink: 'OP17-097',
  /** OP17-107 Charlotte Daifuku: Yellow, cost 3, 4000, Counter +2000, {Big Mom Pirates}, "[Trigger] Play this card." (scripted). */
  daifuku3: 'OP17-107',
  /** OP16-113 Boa Marigold: Yellow, cost 5, 5000, Counter +1000, {Kuja Pirates}, a [Trigger] (Leader-gated) and a static Blocker with 2 or less Life. */
  marigold5: 'OP16-113',
  /** OP03-098 Enies Lobby: Black Stage, cost 2, {World Government}. */
  stage2: 'OP03-098',
  /** OP04-096 Corrida Coliseum: Black Stage, cost 1, {Dressrosa}. */
  stage1: 'OP04-096',
} as const;

/** Baroque Works scenery. */
export const BW = {
  /** OP14-095 Mr.9: Black, cost 5, 6000, Counter +2000, {Baroque Works}. Vanilla. */
  mr9: 'OP14-095',
  /** OP09-055 Mr.1(Daz.Bonez): Blue, cost 5, 7000, Counter +1000, {Former Baroque Works}/{Cross Guild}. Vanilla (type merely includes "Baroque Works"). */
  daz: 'OP09-055',
  /** ST30-013 Mr.2.Bon.Kurei(Bentham): Green, cost 4, 6000, Counter +1000, {Impel Down}/{Former Baroque Works}. Same NAME as OP14-091. Vanilla. */
  bentham4: 'ST30-013',
  /** ST08-013 Mr.2.Bon.Kurei: Black, cost 5, 6000, no Counter, {Former Baroque Works}. A different name from OP14-091. */
  mr2c5: 'ST08-013',
  /** OP12-069 Crocodile: Purple, cost 6, 8000, no Counter, {Baroque Works}/{The Seven Warlords of the Sea}. */
  croc6: 'OP12-069',
  /** OP04-060 Crocodile: Purple, cost 8, 9000, no Counter, {Baroque Works}/{The Seven Warlords of the Sea}. */
  croc8: 'OP04-060',
  /** OP04-072 Mr.5: Purple, cost 7, 8000, no Counter, {Baroque Works}. */
  mr5c7: 'OP04-072',
  /** P-147 Miss.Valentine: Black, cost 3, 3000, Counter +1000, {Baroque Works}. Different name from [Miss.Valentine(Mikita)]. */
  valentine: 'P-147',
  /** OP14-087 Miss.Valentine(Mikita): Black, cost 1, 2000, Counter +1000, {Baroque Works}. */
  mikita: 'OP14-087',
  /** OP14-088 Miss.MerryChristmas(Drophy): Black, cost 1, 2000, Counter +2000, {Baroque Works}. */
  drophy: 'OP14-088',
  /** OP14-091 Mr.2.Bon.Kurei(Bentham): Black, cost 4, 5000, Counter +1000, {Baroque Works}. */
  bentham: 'OP14-091',
  /** OP14-093 Mr.4(Babe): Black, cost 4, 5000, Counter +1000, [Blocker], {Baroque Works}. */
  babe: 'OP14-093',
  /** OP14-092 Mr.3(Galdino): Black, cost 4, 6000, no Counter, {Baroque Works}. */
  galdino: 'OP14-092',
} as const;

/** Thriller Bark Pirates scenery. */
export const TB = {
  /** OP06-094 Lola: Black, cost 4, 6000, Counter +1000, {Thriller Bark Pirates}. Vanilla. */
  lola4: 'OP06-094',
  /** ST12-005 Perona: Green, cost 4, 6000, Counter +1000, {Thriller Bark Pirates}/{Muggy Kingdom}. Vanilla. */
  perona4: 'ST12-005',
  /** OP02-054 Gecko Moria: Blue, cost 4, 6000, Counter +1000, {The Seven Warlords of the Sea}/{Thriller Bark Pirates}. Vanilla. */
  moria4: 'OP02-054',
  /** OP14-033 Perona: Green, cost 5, 6000, {Thriller Bark Pirates}/{Muggy Kingdom}. Cost 5: just above the limit. */
  perona5: 'OP14-033',
  /** OP14-101 Oars: Yellow, cost 8, 10000, Counter +1000, {Giant}/{Thriller Bark Pirates}. Vanilla. */
  oars8: 'OP14-101',
  /** OP06-098 Thriller Bark: Black Stage, cost 1, {Thriller Bark Pirates}. */
  stage: 'OP06-098',
  /** EB05-049 Special Hollow: Black Event, cost 1, {Thriller Bark Pirates}. */
  event: 'EB05-049',
  /** OP14-097 Hurry Up and Make Me the Pirate King!: Black Event, cost 1, {The Seven Warlords of the Sea}/{Thriller Bark Pirates}. */
  kingEvent: 'OP14-097',
} as const;

/** Kuja / Amazon Lily scenery. */
export const KJ = {
  /** OP08-048 Sweetpea: Blue, cost 4, 6000, Counter +1000, {Amazon Lily}. Vanilla. */
  sweetpea4: 'OP08-048',
  /** OP14-114 Ran: Yellow, cost 4, 5000, Counter +1000, {Kuja Pirates}. Only an [Activate: Main] and a Leader-gated [Trigger]; inert when played. */
  ran4: 'OP14-114',
  /** OP08-046 Shakuyaku: Blue, cost 5, 6000, Counter +1000, {Amazon Lily}. */
  shakuyaku5: 'OP08-046',
  /** OP14-115 Rindo: Yellow, cost 5, 5000, Counter +1000, {Kuja Pirates}. */
  rindo5: 'OP14-115',
  /** OP14-105 Gorgon Sisters: Yellow, cost 6, 5000, Counter +2000, {Kuja Pirates}/{The Seven Warlords of the Sea}. */
  gorgon6: 'OP14-105',
  /** OP16-112 Boa Hancock: Yellow, cost 6, 8000, Counter +1000, {Kuja Pirates}. */
  hancock6: 'OP16-112',
} as const;

/** Play `card` (an instance in hand) with raw actions: pay the play cost only, answer nothing else. */
export function playRaw(g: TestGame, card: InstanceId): void {
  const player = g.decider;
  act(g, { type: 'playCard', card });
  for (let i = 0; i < 20; i++) {
    const d = decision(g);
    if (!d || d.kind !== 'choose' || d.player !== player || d.purpose !== 'cost') return;
    const pay = donChoices(g).find((o) => o.from === 'costActive');
    if (!pay) return;
    act(g, { type: 'pick', choice: pay });
  }
}

/** Play the card with this id from `who`'s hand (raw). */
export function playId(g: TestGame, card: CardId, who: PlayerId = 'p1'): void {
  playRaw(g, g.find(who, 'hand', card));
}

/**
 * p1 plays OP17-097 (in p1's hand): every opposing Character gets -1 cost this turn, so the
 * cost-1 `target` has cost 0. Leaves the game at p1's Main Phase.
 */
export function makeCostZero(g: TestGame, target: InstanceId): void {
  playId(g, SC14.shrink);
  expect(g.card(target).cost).toBe(0);
  expect(atMain(g)).toBe(true);
}

/** A deck: `top` first, then `n` plain filler cards. */
export function deckTop(top: CardId[], n = 10): CardId[] {
  return [...top, ...Array.from({ length: n }, () => BLUE)];
}

/** An empty "up to" choose is either skipped or asked with no candidate; answer it if asked. */
export function skipEmptyChoose(g: TestGame): void {
  if (kind(g) === 'choose') {
    expect(choices(g)).toHaveLength(0);
    if (!canFinish(g)) throw new Error('empty choose without done');
    act(g, { type: 'done' });
  }
}

/**
 * A prompt must never depend on hidden cards: an "up to" pick over a hidden zone (the looked-at deck
 * cards, the hand) is asked even when nothing qualifies (max 0). Fails if it was skipped.
 */
export function askedEmpty(g: TestGame): void {
  need(g, 'choose');
  expect(choices(g)).toHaveLength(0);
  if (!canFinish(g)) throw new Error('empty choose without done');
  act(g, { type: 'done' });
}

/**
 * An optional cost paid from the hidden hand is offered even when it cannot be paid, with "use"
 * illegal (so the opponent cannot tell an empty hand from a held card). Declines it.
 */
export function offeredUnpayable(g: TestGame, who: PlayerId = 'p1'): void {
  need(g, 'optional', who);
  expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
  act(g, { type: 'optional', accept: false });
}

// ---------------------------------------------------------------------------------------------
// Shared: "[Trigger] Play up to 1 {Thriller Bark Pirates} type Character card with a cost of 4 or
// less from your trash rested." (OP14-089, 100, 102, 109, 110, 111, 117)
// ---------------------------------------------------------------------------------------------

export function describeTbTrigger(id: CardId, isCharacter = true): void {
  const start = (trashCards: CardId[], p2Trash: CardId[] = []) => {
    const g = theirs(
      LD14.neutral,
      { life: [id, BLUE, BLUE, BLUE], trash: trashCards, deck: deckTop([]) },
      { trash: p2Trash },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  };
  const POOL = [TB.lola4, TB.perona4, TB.moria4, TB.perona5, TB.oars8, TB.stage, TB.event, SC14.c2];
  describe(`${id} [Trigger] play up to 1 {Thriller Bark Pirates} Character with cost 4 or less from the trash, rested`, () => {
    it('offers exactly the {Thriller Bark Pirates} Characters of cost 4 or less in my trash', () => {
      const g = start(POOL);
      activateTrigger(g);
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toEqual([TB.lola4, TB.moria4, TB.perona4].sort());
    });

    it('cost boundary: cost 4 qualifies, cost 5 and cost 8 do not (nothing to pick, nothing played)', () => {
      const g = start([TB.perona5, TB.oars8]);
      activateTrigger(g);
      skipEmptyChoose(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(trash(g)).toEqual([TB.oars8, TB.perona5, id].sort());
    });

    it('only Characters: a {Thriller Bark Pirates} Stage and Event, and a non-{Thriller Bark Pirates} Character, are not offered', () => {
      const g = start([TB.stage, TB.event, SC14.c2, TB.lola4]);
      activateTrigger(g);
      expect(offeredIds(g)).toEqual([TB.lola4]);
    });

    it('the chosen Character enters play RESTED and leaves the trash', () => {
      const g = start(POOL);
      activateTrigger(g);
      pickCards(g, [TB.lola4]);
      expect(atMain(g, 'p2')).toBe(true);
      const c = g.zone('p1', 'characters');
      expect(c.map((x) => x.card)).toEqual([TB.lola4]);
      expect(c[0]!.rested).toBe(true);
      expect(trash(g)).not.toContain(TB.lola4);
    });

    it('"up to 1": may choose nothing; the trash keeps every card and the [Trigger] card is trashed', () => {
      const g = start(POOL);
      activateTrigger(g);
      none(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(trash(g)).toEqual([...POOL, id].sort());
    });

    it('at most 1 Character is played even when several qualify', () => {
      const g = start(POOL);
      activateTrigger(g);
      const sets = reachablePickSets(g);
      expect(sets.has('')).toBe(true);
      for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    });

    it("only my own trash: the opponent's {Thriller Bark Pirates} Characters are never offered", () => {
      const g = start([TB.lola4], [TB.moria4, TB.perona4]);
      activateTrigger(g);
      expect(offeredIds(g)).toEqual([TB.lola4]);
    });

    it('declining the [Trigger]: the card goes to my hand, nothing is played', () => {
      const g = start(POOL);
      act(g, { type: 'trigger', activate: false });
      expect(hand(g)).toContain(id);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(trash(g)).toEqual([...POOL].sort());
    });

    if (isCharacter) {
      it('the [Trigger] card itself is in no area while it resolves: not a candidate, trashed afterwards', () => {
        const g = start([TB.lola4]);
        activateTrigger(g);
        expect(offeredIds(g)).not.toContain(id);
        none(g);
        expect(trash(g)).toContain(id);
        expect(g.zone('p1', 'characters')).toHaveLength(0);
      });
    } else {
      it('the Event is trashed after its [Trigger] resolves', () => {
        const g = start([TB.lola4]);
        activateTrigger(g);
        pickCards(g, [TB.lola4]);
        expect(trash(g)).toEqual([id]);
      });
    }
  });
}

// ---------------------------------------------------------------------------------------------
// Shared: "look at N cards; reveal up to 1 <filter> and add it to your hand; then <rest>."
// ---------------------------------------------------------------------------------------------

export interface LookCfg {
  id: CardId;
  n: number;
  /** Who is at Main when the effect has finished. */
  main: PlayerId;
  /** What happens to the rest. */
  rest: 'trash' | 'bottom';
  /** Begin the effect with p1's deck = `deckTopFirst`; leaves the game at its first prompt. */
  start: (deckTopFirst: CardId[]) => TestGame;
  /** Two cards that satisfy the filter. match[0] is also placed below the looked-at cards. */
  match: [CardId, CardId];
  /** A card that satisfies the filter only through a multi-valued type (type "including"). */
  multi?: CardId;
  /** A card that satisfies the filter but is excluded by name ("other than [itself]"). */
  excluded?: CardId;
  /** A card of a different name that is allowed (guards against prefix/substring name matching). */
  similar?: CardId;
  /** A card that does not satisfy the filter. */
  miss: CardId;
}

export function describeLook(cfg: LookCfg): void {
  const { id, n, main, start, match, multi, excluded, similar, miss } = cfg;
  const pad = (k: number): CardId[] => Array.from({ length: k }, () => miss);
  const below: CardId[] = [match[0], ...Array.from({ length: 8 }, () => BLUE)];
  const begin = (top: CardId[]) => start([...top, ...below]);
  const total = n + below.length;
  const finish = (g: TestGame) => {
    if (cfg.rest === 'bottom') settleOrders(g, 'p1');
    expect(atMain(g, main)).toBe(true);
  };
  const emptyLook = (g: TestGame) => askedEmpty(g);
  describe(`${id} look at ${n}, add up to 1, ${cfg.rest === 'trash' ? 'trash' : 'bottom'} the rest`, () => {
    it('offers exactly the matching cards among the top; the pick goes to hand, the rest leave the deck top', () => {
      const top = [match[0], miss, match[1], ...pad(n - 3)];
      const g = begin(top);
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toEqual([...match].sort());
      pickCards(g, [match[1]]);
      finish(g);
      expect(hand(g, 'p1')).toContain(match[1]);
      const left = [...top];
      left.splice(left.indexOf(match[1]), 1);
      expect(deck(g)[0]).toBe(match[0]);
      if (cfg.rest === 'trash') {
        expect(deck(g)).toHaveLength(total - n);
        for (const c of left) expect(trash(g)).toContain(c);
      } else {
        expect(deck(g)).toHaveLength(total - 1);
        expect(tail(deck(g), n - 1)).toEqual([...left].sort());
      }
    });

    it('"up to 1": adding nothing is allowed; every looked-at card still leaves the top', () => {
      const top = [match[0], miss, match[1], ...pad(n - 3)];
      const g = begin(top);
      need(g, 'choose', 'p1');
      none(g);
      finish(g);
      expect(deck(g)[0]).toBe(match[0]);
      if (cfg.rest === 'trash') {
        expect(deck(g)).toHaveLength(total - n);
        expect(trash(g).filter((c) => c === match[1])).toHaveLength(1);
      } else {
        expect(deck(g)).toHaveLength(total);
        expect(tail(deck(g), n)).toEqual([...top].sort());
      }
    });

    it('adds at most one card even when two qualify', () => {
      const g = begin([match[0], miss, match[1], ...pad(n - 3)]);
      const sets = reachablePickSets(g);
      expect(sets.has('')).toBe(true);
      expect(sets.has(match[0])).toBe(true);
      expect(sets.has(match[1])).toBe(true);
      for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    });

    it(`only the top ${n} are looked at: a match in position ${n + 1} is neither offered nor moved`, () => {
      const g = begin(pad(n));
      emptyLook(g);
      finish(g);
      expect(deck(g)[0]).toBe(match[0]);
      expect(hand(g, 'p1')).not.toContain(match[0]);
    });

    it('the added card is revealed (CR 11-2-1); the cards that are not added are not', () => {
      const g = begin([match[0], miss, match[1], ...pad(n - 3)]);
      pickCards(g, [match[1]]);
      finish(g);
      expect(g.events.some((e) => e.type === 'CardRevealed' && e.card === match[1])).toBe(true);
      expect(g.events.some((e) => e.type === 'CardRevealed' && e.card === miss)).toBe(false);
    });

    if (multi) {
      it('"type including": a card whose list of types merely contains the type qualifies', () => {
        const g = begin([multi, miss, ...pad(n - 2)]);
        need(g, 'choose', 'p1');
        expect(offeredIds(g)).toEqual([multi]);
      });
    }

    if (excluded) {
      it('"other than [itself]": a copy of the same name is not offered, though its type matches', () => {
        const g = begin([excluded, match[1], ...pad(n - 2)]);
        need(g, 'choose', 'p1');
        expect(offeredIds(g)).toEqual([match[1]]);
      });
    }

    if (similar) {
      it('the exclusion is by exact name: a card with a similar but different name is offered', () => {
        const g = begin([similar, ...pad(n - 1)]);
        need(g, 'choose', 'p1');
        expect(offeredIds(g)).toEqual([similar]);
      });
    }
  });
}

void it;
