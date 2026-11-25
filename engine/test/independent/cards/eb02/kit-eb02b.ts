/**
 * Helpers for the EB-02 group-B independent card tests. Public API, frozen fixtures and the earlier
 * kits only. Answer helpers accept exactly one named prompt kind and fail on anything else.
 * Scenery stats are noted next to each constant; tests repeat the ones they rely on.
 */
import { describe, expect, it } from 'vitest';
import { queries, type CardId, type InstanceId, type PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { choices, donChoices, hasEvent, kind, reachablePickSets } from '../kit.ts';
import {
  activateTrigger,
  declineTrigger,
  deck,
  hand,
  hitLeader,
  mine,
  tail,
  theirs,
  trash,
} from '../m4b/kit-a.ts';
import { need, none, offeredAbilities, payHand, pickCards, offeredIds } from '../op17/kit-op17b.ts';

export * from '../eb03/kit-eb03b.ts';

/** Leaders used as scenery. */
export const LE = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. Not multicoloured. */
  luffy: 'ST01-001',
  /** ST03-001 Crocodile: Blue, 5000, {Baroque Works}/{The Seven Warlords of the Sea}. */
  croc: 'ST03-001',
  /** OP09-022 Lim: Green/Purple (multicoloured), {ODYSSEY}. */
  lim: 'OP09-022',
  /** OP02-002 Monkey.D.Garp: Red/Black, {Navy}. Named [Monkey.D.Garp]; has a [Your Turn] effect on being given DON!!. */
  garp: 'OP02-002',
  /** OP06-020 Hody Jones: Green, {Fish-Man}/{New Fish-Man Pirates}. */
  fishMan: 'OP06-020',
  /** OP11-022 Shirahoshi: Green/Yellow, {Merfolk}/{Fish-Man Island}. */
  merfolk: 'OP11-022',
  /** ST05-001 Shanks: Purple, {FILM}/{Four Emperors}/{Red-Haired Pirates}. */
  shanks: 'ST05-001',
  /** OP03-099 Charlotte Katakuri: Yellow, 5000, {Big Mom Pirates}. */
  yellow: 'OP03-099',
} as const;

/** Scenery cards. */
export const SE = {
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, {Buggy Pirates}. */
  mohji: 'OP02-060',
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000. */
  komachiyo: 'OP01-010',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. */
  sai: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. */
  marco: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. */
  hajrudin: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. */
  thatch: 'OP02-007',
  /** ST01-014 Guard Point: Red Event, cost 1 (no script). */
  event1: 'ST01-014',
  /** OP05-021 Revolutionary Army HQ: Red Stage, cost 1 (not a Character). */
  stage1: 'OP05-021',
  /** OP02-084 Blugori: Purple, cost 1, 3000, Counter +1000, {Animal}/{Impel Down}. Vanilla. */
  blugori1: 'OP02-084',
  /** OP02-081 Domino: Purple, cost 2, 2000, Counter +1000, {Impel Down}, [Blocker]. */
  domino2: 'OP02-081',
  /** OP02-088 Sphinx: Purple, cost 4, 6000, Counter +1000, {Animal}/{Impel Down}. Vanilla. */
  sphinx4: 'OP02-088',
  /** EB01-032 Army Wolves: Purple, cost 5, 7000, Counter +1000, {Animal}/{Impel Down}. Vanilla. */
  wolves5: 'EB01-032',
  /** OP02-097 Komille: Black, cost 1, 3000, Counter +1000, {Navy}. Vanilla. */
  komille1: 'OP02-097',
  /** OP02-107 Doberman: Black, cost 2, 4000, Counter +1000, {Navy}. Vanilla. */
  doberman2: 'OP02-107',
  /** OP02-116 Yamakaji: Black, cost 3, 5000, Counter +1000, {Navy}. Vanilla. */
  yamakaji3: 'OP02-116',
  /** ST06-011 Momonga: Black, cost 4, 6000, Counter +1000, {Navy}. Vanilla. */
  momonga4: 'ST06-011',
  /** ST08-010 Monkey.D.Garp: Black, cost 5, 7000, Counter +1000, {Navy}. Vanilla. */
  garp5: 'ST08-010',
  /** OP12-052 Fullbody: Blue, cost 4, 6000, Counter +1000, {Navy}. Vanilla. */
  fullbodyBlue4: 'OP12-052',
  /** ST08-012 Laboon: Black, cost 4, 6000, Counter +1000, {Animal}. Vanilla. */
  laboon: 'ST08-012',
  /** EB03-040 Kalifa: Black, cost 5, 6000, Counter +2000, {CP9}. Vanilla. */
  kalifa5: 'EB03-040',
  /** OP03-084 Jerry: Black, cost 2, 4000, Counter +1000, {CP6}. Vanilla. */
  jerry2: 'OP03-084',
  /** OP03-087 Nero: Black, cost 3, 5000, Counter +1000, {CP9}. Vanilla. */
  nero3: 'OP03-087',
  /** OP07-089 Maha: Black, cost 6, 8000, Counter +1000, {CP0}. Vanilla. */
  maha6: 'OP07-089',
  /** OP13-101 Atlas: Yellow, cost 5, 6000, Counter +2000, {Scientist}/{Egghead}. Vanilla. */
  atlas5: 'OP13-101',
  /** OP13-107 Shaka: Yellow, cost 5, 7000, Counter +1000, {Scientist}/{Egghead}. Vanilla. */
  shaka5: 'OP13-107',
  /** OP13-111 Pythagoras: Yellow, cost 6, 7000, Counter +2000, {Scientist}/{Egghead}. Vanilla. */
  pythagoras6: 'OP13-111',
  /** ST05-015 Dr. Indigo: Purple, cost 2, 4000, Counter +1000, {FILM}/{Scientist}/{Golden Lion Pirates}. Vanilla. */
  indigo2: 'ST05-015',
  /** ST21-013 Vegapunk: Red, cost 1, 3000, Counter +1000, {Scientist}/{Egghead}. Vanilla, named [Vegapunk]. */
  vegapunk1: 'ST21-013',
  /** ST09-011 Monkey.D.Luffy: Yellow, cost 3, 5000, Counter +1000, {Land of Wano}/{Straw Hat Crew}. Vanilla. */
  luffyYellow3: 'ST09-011',
  /** OP15-107 Tony Tony.Chopper: Yellow, cost 4, 6000, Counter +1000, {Animal}/{Straw Hat Crew}/{Sky Island}. Vanilla. */
  chopper4: 'OP15-107',
  /** P-089 Tony Tony.Chopper: Yellow, cost 5, 7000, Counter +1000, {Animal}/{Straw Hat Crew}. Vanilla. */
  chopper5: 'P-089',
  /** OP15-089 Franky: Black, cost 5, 6000, Counter +2000, {Straw Hat Crew}. Vanilla. */
  frankyBlack5: 'OP15-089',
  /** OP05-110 Holly: Yellow, cost 3, 5000, Counter +1000, {Animal}/{Sky Island}. Vanilla. */
  holly3: 'OP05-110',
  /** OP03-102 Sanji: Yellow, cost 2, 3000, Counter +2000, {The Vinsmoke Family}. Only a [DON!! x2] [When Attacking]. */
  sanjiVinsmoke2: 'OP03-102',
  /** OP04-007 Sanji: Red, cost 1, 3000, Counter +1000, {Alabasta}/{Straw Hat Crew}. Vanilla. */
  sanjiRed1: 'OP04-007',
  /** ST01-009 Nefeltari Vivi: Red, cost 2, 4000, Counter +1000, {Alabasta}. Vanilla. */
  vivi2: 'ST01-009',
} as const;

/** The Character `card` of `who` (first copy) as an instance. */
export function ch(g: TestGame, who: PlayerId, card: CardId, nth = 0): InstanceId {
  return g.find(who, 'characters', card, nth);
}

/** Sorted card ids of a zone of `who`. */
export function ids(g: TestGame, who: PlayerId, zone: Parameters<TestGame['zone']>[1]): CardId[] {
  return g
    .zone(who, zone)
    .map((c) => c.card)
    .sort();
}

/**
 * Play `card` from p1's hand with a raw playCard action (never a catch-all `done`), paying with
 * active DON!! when the engine asks which DON!! to use. Stops at the first other prompt.
 */
export function playRaw(g: TestGame, card: CardId): void {
  const who = g.decider;
  act(g, { type: 'playCard', card: g.find(who, 'hand', card) });
  for (let i = 0; i < 20; i++) {
    const d = decision(g);
    if (d?.kind !== 'choose' || d.player !== who || d.purpose !== 'cost') return;
    const pay = donChoices(g).find((o) => o.from === 'costActive');
    if (!pay) return;
    act(g, { type: 'pick', choice: pay });
  }
}

/** Choose the mode whose label matches `re` in the pending mode `choose`. */
export function mode(g: TestGame, re: RegExp): void {
  const d = need(g, 'choose');
  const opt = (d.options ?? []).find((o) => re.test(o.label));
  if (!opt) {
    throw new Error(
      `no option matching ${re}: ${(d.options ?? []).map((o) => o.label).join(' | ')}`,
    );
  }
  act(g, { type: 'pick', choice: { option: opt.id } });
}

/** Labels of the pending mode `choose`. */
export function modeLabels(g: TestGame): string[] {
  return (decision(g)?.options ?? []).map((o) => o.label);
}

/** True when the game waits for `who` at a plain `main` decision. */
export function backAtMainFor(g: TestGame, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return !!d && d.kind === 'main' && d.player === who;
}

/** The pending decision's kind and prompt for failure messages. */
export function where(g: TestGame): string {
  const d = decision(g);
  return d ? `${kind(g)}/${d.purpose}: ${d.prompt}` : 'none';
}

/**
 * Pay an exact-N cost pick with these cards when the engine asks; when the candidates are exactly
 * N it resolves the pick itself and nothing is asked (public information: forced picks are skipped).
 */
export function payIfAsked(g: TestGame, cards: CardId[]): void {
  const d = decision(g);
  if (d?.kind === 'choose' && d.purpose === 'cost') payHand(g, cards);
}

/** Answer every pending `order` decision of the deciding player with the first listed order. */
export function orderFirst(g: TestGame): void {
  for (let i = 0; i < 10 && kind(g) === 'order'; i++) {
    act(
      g,
      g.legal().find((a) => a.type === 'order')!,
    );
  }
}

/**
 * A public-zone "up to" pick with no candidates may be skipped or asked empty: either way nothing is
 * offered. Answers the empty pick when it is asked.
 */
export function skipEmptyPick(g: TestGame): void {
  if (kind(g) === 'choose') {
    expect(choices(g)).toEqual([]);
    act(g, { type: 'done' });
  }
}

/** True when an [Activate: Main] is offered on `card` now. */
export function canUseAbility(g: TestGame, card: InstanceId): boolean {
  return offeredAbilities(g, card).length > 0;
}

/**
 * Pick exactly these instances in the pending multi-target `choose`, in whatever order the engine
 * lists them (canonical order), then confirm with `done` while the same decision is still open.
 */
export function pickSome(g: TestGame, targets: InstanceId[]): void {
  const before = decision(g);
  const left = new Set(targets);
  while (left.size) {
    const a = g
      .legal()
      .find((x) => x.type === 'pick' && typeof x.choice === 'string' && left.has(x.choice));
    if (!a || a.type !== 'pick' || typeof a.choice !== 'string') {
      throw new Error(`Cannot pick ${[...left]}; offered ${choices(g)} (${where(g)})`);
    }
    left.delete(a.choice);
    g.act(a);
  }
  const now = decision(g);
  if (
    now?.kind === 'choose' &&
    now.player === before?.player &&
    now.prompt === before?.prompt &&
    now.purpose === before?.purpose &&
    g.legal().some((x) => x.type === 'done')
  ) {
    g.act({ type: 'done' });
  }
}

/** OP01-027 Round Table: Red Event, cost 4. Only ever looked at in the deck. */
export const EVENT4 = 'OP01-027';
/** OP05-040 Birdcage: Green Stage, cost 5. Only ever looked at in the deck. */
export const STAGE5 = 'OP05-040';

/**
 * The five Music Events with the same printed text: "[Main] Look at 4 cards from the top of your deck;
 * reveal up to 1 card with a cost of 4 or more and add it to your hand. Then, place the rest at the
 * bottom of your deck in any order. [Trigger] Activate this card's [Main] effect." (cost 2).
 */
export function describeMusic(cfg: { id: CardId; name: string }): void {
  const { id, name } = cfg;
  /** Cards below the top 4. */
  const BELOW = [SE.kingdew, ...Array.from({ length: 8 }, () => SE.mohji)];
  const TOP = [SE.hajrudin, SE.marco, SE.kingdew, SE.mohji];
  const begin = (top: CardId[], extra: { active?: number } = {}) => {
    const g = mine(LE.luffy, {
      hand: [id],
      deck: [...top, ...BELOW],
      costArea: { active: extra.active ?? 10, rested: 0 },
    });
    playRaw(g, id);
    return g;
  };
  const settle = (g: TestGame) => {
    orderFirstAll(g);
  };
  describe(`${id} ${name}: [Main] look at 4, reveal up to 1 card with cost 4 or more, rest to the bottom`, () => {
    it('is a cost 2 Event: playing it rests 2 DON!! and the Event goes to the trash', () => {
      const g = begin(TOP);
      expect(g.card(g.find('p1', 'trash', id)).cost).toBe(2);
      expect(donOnCost(g).rested).toBe(2);
      need(g, 'choose', 'p1');
      none(g);
      settle(g);
      expect(trash(g)).toEqual([id]);
      expect(hand(g)).toEqual([]);
    });

    it('offers exactly the cards with cost 4 or more among the top 4 (boundary 4 yes, 3 no)', () => {
      const g = begin(TOP);
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toEqual([SE.hajrudin, SE.kingdew].sort());
    });

    it('the chosen card goes to the hand, the other 3 to the bottom, the 5th card is on top', () => {
      const g = begin(TOP);
      pickCards(g, [SE.hajrudin]);
      settle(g);
      expect(hand(g)).toEqual([SE.hajrudin]);
      expect(deck(g)[0]).toBe(SE.kingdew);
      expect(deck(g)).toHaveLength(12);
      expect(tail(deck(g), 3)).toEqual([SE.marco, SE.kingdew, SE.mohji].sort());
    });

    it('the chosen card is revealed (CR 11-2-1) and the others are not', () => {
      const g = begin(TOP);
      pickCards(g, [SE.hajrudin]);
      settle(g);
      expect(hasEvent(g, 'CardRevealed', { card: SE.hajrudin })).toBe(true);
      expect(hasEvent(g, 'CardRevealed', { card: SE.marco })).toBe(false);
    });

    it('"up to 1": may add nothing; all 4 looked-at cards go to the bottom', () => {
      const g = begin(TOP);
      none(g);
      settle(g);
      expect(hand(g)).toEqual([]);
      expect(deck(g)).toHaveLength(13);
      expect(deck(g)[0]).toBe(SE.kingdew);
      expect(tail(deck(g), 4)).toEqual([...TOP].sort());
    });

    it('adds at most 1 card even when two qualify', () => {
      const sets = reachablePickSets(begin(TOP));
      expect(sets.has('')).toBe(true);
      expect(sets.has(SE.hajrudin)).toBe(true);
      expect(sets.has(SE.kingdew)).toBe(true);
      for (const x of sets) expect(x.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    });

    it('only the top 4 are looked at: a qualifying card in 5th place is not offered', () => {
      const g = begin([SE.mohji, SE.marco, SE.sai, SE.komachiyo]);
      expect(offeredIds(g)).toEqual([]);
      none(g);
      settle(g);
      expect(hand(g)).toEqual([]);
      expect(deck(g)[0]).toBe(SE.kingdew);
    });

    it('any card type with cost 4 or more qualifies: an Event and a Stage are offered', () => {
      const g = begin([EVENT4, STAGE5, SE.marco, SE.mohji]);
      expect(offeredIds(g)).toEqual([EVENT4, STAGE5].sort());
      pickCards(g, [STAGE5]);
      settle(g);
      expect(hand(g)).toEqual([STAGE5]);
    });

    it('with no card of cost 4 or more the 4 cards go to the bottom and nothing is added', () => {
      const top = [SE.mohji, SE.marco, SE.sai, SE.komachiyo];
      const g = begin(top);
      expect(offeredIds(g)).toEqual([]);
      none(g);
      settle(g);
      expect(hand(g)).toEqual([]);
      expect(tail(deck(g), 4)).toEqual([...top].sort());
    });
  });

  describe(`${id} ${name}: [Trigger] activate this card's [Main] effect`, () => {
    const hit = () => {
      const g = theirs(LE.luffy, {
        life: [id, SE.mohji, SE.mohji, SE.mohji],
        deck: [...TOP, ...BELOW],
      });
      hitLeader(g);
      need(g, 'trigger', 'p1');
      return g;
    };

    it('activating runs the look-at-4 effect for free', () => {
      const g = hit();
      activateTrigger(g);
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toEqual([SE.hajrudin, SE.kingdew].sort());
      pickCards(g, [SE.kingdew]);
      settle(g);
      expect(hand(g)).toEqual([SE.kingdew]);
      expect(tail(deck(g), 3)).toEqual([SE.hajrudin, SE.marco, SE.mohji].sort());
      expect(trash(g)).toEqual([id]);
    });

    it('declining the [Trigger] adds the Event to the hand and looks at nothing', () => {
      const g = hit();
      declineTrigger(g);
      expect(hand(g)).toEqual([id]);
      expect(deck(g)).toHaveLength(13);
      expect(deck(g)[0]).toBe(SE.hajrudin);
    });
  });
}

function donOnCost(g: TestGame) {
  return queries.don(g.state, 'p1');
}

/** Answer every pending `order` decision of p1 with the first listed order. */
function orderFirstAll(g: TestGame): void {
  orderFirst(g);
}

void expect;
