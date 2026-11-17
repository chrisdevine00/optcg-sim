/**
 * Helpers for the M4b group-A independent card tests. Public API, frozen fixtures and `../kit.ts`
 * only. Scenery stats are noted next to each constant; tests repeat the ones they rely on.
 */
import { describe, expect, it } from 'vitest';
import {
  queries,
  type CardId,
  type CardPlacement,
  type InstanceId,
  type PlayerId,
  type PlayerSpec,
} from '@optcg/engine';
import { act, attack, cardIds, decision, fill, noDefence, passBlock, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  BLUE,
  cardOf,
  choiceCards,
  choices,
  choose,
  chooseNone,
  canFinish,
  count,
  decline,
  kind,
  LEAD,
  myTurn,
  offered,
  optionChoices,
  reachablePickSets,
  RED,
  settleYes,
  side,
  skipUnusable,
  theirTurn,
  VAN,
} from '../kit.ts';

/** Leaders (no relevant text unless noted). */
export const YL = {
  /** OP03-099 Charlotte Katakuri: Yellow, 5 Life, {Big Mom Pirates}. Only a [DON!! x1] [When Attacking]. */
  bmp: 'OP03-099',
  /** OP05-098 Enel: Yellow, 4 Life, {Sky Island}. [Opponent's Turn] when Life becomes 0. */
  sky: 'OP05-098',
  /** OP15-098 Monkey.D.Luffy: Yellow, 5 Life, {Straw Hat Crew}/{Sky Island}. */
  skyShc: 'OP15-098',
  /** OP08-098 Kalgara: Yellow, 5 Life, {Sky Island}/{Shandian Warrior}/{Jaya}. */
  shandian: 'OP08-098',
  /** ST09-001 Yamato: Yellow, 5 Life, {Land of Wano}: no type the group-A cards look for. */
  neutral: 'ST09-001',
  /** EB04-001 Jewelry Bonney: Red/Yellow (multicoloured), 4 Life, {Bonney Pirates}/{Egghead}. */
  multi: 'EB04-001',
  /** ST29-001 Monkey.D.Luffy: Yellow, 6 Life, {Straw Hat Crew}/{The Four Emperors}/{Egghead}. */
  shc: 'ST29-001',
  /** OP09-062 Nico Robin: Purple/Yellow, 4 Life, {Straw Hat Crew}, [Banish]. */
  robin: 'OP09-062',
  /** OP16-080 Marshall.D.Teach: Black/Yellow, 4 Life, {Blackbeard Pirates}. */
  teach: 'OP16-080',
  /** ST01-001 Monkey.D.Luffy: Red, 5 Life, {Straw Hat Crew}. Vanilla Leader. */
  redShc: 'ST01-001',
} as const;

/** Scenery Characters and Events. */
export const SC = {
  /** OP01-104 Speed: Purple, cost 2, 3000, Counter +1000, "[Trigger] Play this card." */
  speed: 'OP01-104',
  /** OP04-113 Rabiyan: Yellow, cost 2, 3000, Counter +1000, {Big Mom Pirates}/{Homies}, "[Trigger] Play this card." */
  rabiyan: 'OP04-113',
  /** OP01-009 Carrot: Red, cost 2, 3000, Counter +1000, "[Trigger] Play this card." */
  carrot: 'OP01-009',
  /** ST07-002 Charlotte Anana: Yellow, cost 1, 3000, Counter +1000, {Big Mom Pirates}, no [Trigger]. */
  anana: 'ST07-002',
  /** OP03-103 Bobbin the Disposer: Yellow, cost 2, 4000 (printed), Counter +1000, {Big Mom Pirates}, no [Trigger]. */
  bobbin: 'OP03-103',
  /** OP03-106 Charlotte Opera: Yellow, cost 4, 6000, {Big Mom Pirates}, no [Trigger]. */
  opera: 'OP03-106',
  /** OP04-107 Charlotte Perospero: Yellow, cost 6, 8000, {Big Mom Pirates}, no [Trigger]. */
  perospero6: 'OP04-107',
  /** EB01-055 Charlotte Compote: Yellow, cost 7, 9000, {Big Mom Pirates}, no [Trigger]. */
  compote: 'EB01-055',
  /** OP06-105 Genbo: Yellow, cost 3, 5000, {Sky Island}/{Shandian Warrior}, vanilla. */
  genbo: 'OP06-105',
  /** OP12-103 Seto: Yellow, cost 5, 6000, Counter +2000, {Sky Island}/{Shandian Warrior}/{Jaya}, vanilla. */
  seto: 'OP12-103',
  /** OP12-114 Wyper: Yellow, cost 6, 7000, {Sky Island}/{Shandian Warrior}, vanilla. */
  wyper6: 'OP12-114',
  /** OP08-099 Kalgara: Yellow, cost 6, 8000, {Sky Island}/{Shandian Warrior}/{Jaya}, vanilla, named [Kalgara]. */
  kalgara6: 'OP08-099',
  /** OP05-110 Holly: Yellow, cost 3, 5000, {Animal}/{Sky Island}, vanilla. */
  holly: 'OP05-110',
  /** OP05-108 Nola: Yellow, cost 5, 7000, {Animal}/{Sky Island}, vanilla. */
  nola: 'OP05-108',
  /** OP02-077 Solitaire: Purple, cost 3, 5000, vanilla, no relevant type. */
  solitaire: VAN.mohji,
  /** OP09-072 Franky: Purple, cost 4, 5000, [Blocker] (the [On Play] only matters when played). */
  blocker: 'OP09-072',
  /** ST01-014 Guard Point: Red Event, cost 1, "[Counter] Up to 1 of your Leader or Character cards gains +3000 power during this battle." */
  guardPoint: 'ST01-014',
  /** OP17-118 Rocks.D.Xebec: cost 10, 12000. */
  xebec: 'OP17-118',
  /** EB01-056 Charlotte Flampe: cost 1, 1000. */
  flampe: 'EB01-056',
  /** OP17-113 Streusen: cost 1, 2000. */
  streusen: 'OP17-113',
  /** OP13-118 Monkey.D.Luffy: Green, cost 6, 7000, [Double Attack]. */
  doubleAttack: 'OP13-118',
  /** OP05-117 Upper Yard: Yellow Stage, cost 1, {Sky Island}. */
  upperYard: 'OP05-117',
} as const;

/** One more filler for hands and Life. */
export const Y_FILL = SC.solitaire;

/**
 * p1's Main Phase (turn 3) with 10 active DON!! in the cost area unless `spec.costArea` says
 * otherwise. `p2` customises the opponent (Leader ST01-001, 4 Life, 15-card deck by default).
 */
export function mine(
  leader: string | CardPlacement,
  spec: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  p2Leader: string = LEAD.luffy,
): TestGame {
  return myTurn(
    { ...side('ST01-001', BLUE, { costArea: { active: 10, rested: 0 }, ...spec }), leader },
    side(p2Leader, RED, p2),
  );
}

/** p2's Main Phase (turn 4); p1 defends. */
export function theirs(
  leader: string,
  spec: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  p2Leader: string = LEAD.luffy,
): TestGame {
  return theirTurn(
    side(leader, BLUE, { costArea: { active: 0, rested: 0 }, ...spec }),
    side(p2Leader, RED, { costArea: { active: 10, rested: 0 }, ...p2 }),
  );
}

export function deck(g: TestGame, p: PlayerId = 'p1'): CardId[] {
  return cardIds(g, p, 'deck');
}
export function hand(g: TestGame, p: PlayerId = 'p1'): CardId[] {
  return cardIds(g, p, 'hand').sort();
}
export function trash(g: TestGame, p: PlayerId = 'p1'): CardId[] {
  return cardIds(g, p, 'trash').sort();
}
export function chars(g: TestGame, p: PlayerId = 'p1'): CardId[] {
  return cardIds(g, p, 'characters').sort();
}
export function lifeCards(g: TestGame, p: PlayerId = 'p1'): CardId[] {
  return cardIds(g, p, 'life');
}

export function inHand(g: TestGame, card: CardId, p: PlayerId = 'p1'): InstanceId {
  return g.find(p, 'hand', card);
}

/** Play a card from p1's hand (paying with active DON!!). */
export function playCard(g: TestGame, card: CardId): void {
  play(g, g.find(g.decider, 'hand', card));
}

/** The offered instance of the looked-at / candidate card `card`. */
export function pickCard(g: TestGame, card: CardId, nth = 0): InstanceId {
  const hits = choices(g).filter((i) => cardOf(g, i) === card);
  const hit = hits[nth];
  if (!hit) throw new Error(`${card} is not offered; offered: ${choiceCards(g)} (${kind(g)})`);
  return hit;
}

/** Choose these cards by card id (each from the offered candidates). */
export function chooseCards(g: TestGame, cards: CardId[]): void {
  const used = new Map<CardId, number>();
  const ids = cards.map((c) => {
    const n = used.get(c) ?? 0;
    used.set(c, n + 1);
    return pickCard(g, c, n);
  });
  choose(g, ids);
}

/** Decline an "up to" or "you may" for which the engine may ask `optional` or `choose` (then `done`). */
export function declineAny(g: TestGame): void {
  if (kind(g) === 'optional') decline(g);
  else if (kind(g) === 'choose' && canFinish(g)) chooseNone(g);
  else throw new Error(`Nothing to decline; decision ${kind(g)} (${decision(g)?.prompt})`);
}

/** Answer remaining optional/order/choose decisions of `player` with the first offered/yes answer. */
export function finish(g: TestGame, player: PlayerId = 'p1'): void {
  settleYes(g, player);
}

/**
 * After a "look at N; reveal up to 1/2 …; rest to bottom" effect has started (the candidate
 * `choose` is pending), check the candidates, choose, and check hand and deck.
 *
 * @param candidates the card ids the effect may offer
 * @param pick the card ids to add (a subset of candidates)
 */
export function checkLook(
  g: TestGame,
  o: { candidates: CardId[]; pick: CardId[]; handBefore?: CardId[]; who?: PlayerId },
): void {
  const who = o.who ?? 'p1';
  if (kind(g) === 'choose') {
    expect(choiceCards(g).sort()).toEqual([...o.candidates].sort());
    if (o.pick.length) chooseCards(g, o.pick);
    else chooseNone(g);
  } else if (o.candidates.length) {
    throw new Error(`Expected a choose decision, got ${kind(g)}`);
  }
  settleYes(g, who);
}

/** The sorted multiset of the last n cards of a pile. */
export function tail(cards: CardId[], n: number): CardId[] {
  return n === 0 ? [] : cards.slice(-n).sort();
}

/** `a` minus one copy of each of `b`. */
export function minus(a: CardId[], b: CardId[]): CardId[] {
  const r = [...a];
  for (const x of b) {
    const i = r.indexOf(x);
    if (i >= 0) r.splice(i, 1);
  }
  return r;
}

/** Cards that moved: [hand p1, deck p1, life p1, trash p1, hand p2, life p2, trash p2] sizes. */
export function sizes(g: TestGame): string {
  return [
    count(g, 'p1', 'hand'),
    count(g, 'p1', 'deck'),
    g.life('p1'),
    count(g, 'p1', 'trash'),
    count(g, 'p2', 'hand'),
    g.life('p2'),
    count(g, 'p2', 'trash'),
  ].join('/');
}

/** DON!! summary of a player. */
export function don(g: TestGame, p: PlayerId = 'p1') {
  return queries.don(g.state, p);
}

/**
 * p2 (the turn player in `g`, built with `theirs`) attacks p1's Leader with its Leader; p1 does
 * not block or counter. Stops at the first decision p1 owes (a `trigger` decision when the Life
 * card has a [Trigger]).
 */
export function hitLeader(g: TestGame, attacker: InstanceId = g.leader('p2')): void {
  attack(g, attacker, g.leader('p1'));
  noDefenceUntilTrigger(g);
}

/** Pass Block and Counter steps without taking the [Trigger] decision. */
export function noDefenceUntilTrigger(g: TestGame): void {
  passBlock(g);
  if (kind(g) === 'counter') act(g, { type: 'endCounter' });
}

/** After a hit: activate the [Trigger] of the Life card (the decision must be pending). */
export function activateTrigger(g: TestGame): void {
  if (kind(g) !== 'trigger') throw new Error(`Expected a trigger decision, got ${kind(g)}`);
  act(g, { type: 'trigger', activate: true });
}

export function declineTrigger(g: TestGame): void {
  if (kind(g) !== 'trigger') throw new Error(`Expected a trigger decision, got ${kind(g)}`);
  act(g, { type: 'trigger', activate: false });
}

/** Finish a battle in which p1 attacked and p2 neither blocks nor counters; take Life cards without [Trigger]. */
export function connect(g: TestGame): void {
  noDefence(g);
}

/** True while `player` owes a decision of `k`. */
export function owes(g: TestGame, player: PlayerId, k?: string): boolean {
  const d = decision(g);
  return !!d && d.player === player && (k === undefined || d.kind === k);
}

/**
 * Pick the top ('top') or bottom ('bottom') card of p1's Life for a "top or bottom of your Life
 * cards" cost or effect. The engine may offer the two positions as named options or the two cards.
 */
export function pickLife(g: TestGame, which: 'top' | 'bottom', who: PlayerId = 'p1'): void {
  const life = g.zone(who, 'life');
  const target = which === 'top' ? life[0] : life[life.length - 1];
  // With a single Life card there is nothing to choose: the engine may resolve the pick itself.
  const opts = optionChoices(g);
  if (opts.length) {
    const id = opts.find((o) => o.toLowerCase().includes(which));
    if (!id) throw new Error(`No ${which} option among ${opts}`);
    act(g, { type: 'pick', choice: { option: id } });
    return;
  }
  const offeredIds = choices(g);
  if (target && offeredIds.includes(target.instance)) {
    choose(g, [target.instance]);
  } else if (life.length <= 1) {
    return;
  } else {
    throw new Error(`Cannot pick ${which} Life card; offered ${choiceCards(g)} (${kind(g)})`);
  }
}

/** Play an Event and, if the engine asks about its "you may" cost, answer. */
export function playEvent(g: TestGame, card: CardId, use = true): void {
  const player = g.decider;
  play(g, g.find(player, 'hand', card));
  skipUnusable(g, player);
  if (offered(g, player)) (use ? accept : decline)(g);
}

export * from '../kit.ts';

/**
 * The engine asks a `choose` with min = max = 0 when an instruction has nothing to act on (for
 * example "your opponent trashes 1 card" with an empty hand): a forced `done`. Answer any such
 * empty decision, whoever owes it.
 */
export function finishEmpty(g: TestGame): void {
  for (let i = 0; i < 5; i++) {
    const d = decision(g);
    if (d?.kind === 'choose' && d.max === 0 && canFinish(g)) act(g, { type: 'done' });
    else return;
  }
}

// ---------------------------------------------------------------------------------------------
// "Look at N; reveal up to 1 X and add it to your hand; place the rest at the bottom" family
// ---------------------------------------------------------------------------------------------

/**
 * Standard tests for an [On Play] "look at n cards; reveal up to 1 `match`; add it to hand; rest to
 * the bottom in any order". `match` / `miss` are card ids that do / do not satisfy the filter.
 */
export function describeLookAdd(cfg: {
  id: string;
  title: string;
  n: number;
  leader?: string;
  match: [CardId, CardId];
  miss: CardId;
  /** Card in position n+1 that would match (must not be offered). */
  beyond: CardId;
}): void {
  const { id, n, match, miss, beyond } = cfg;
  const leader = cfg.leader ?? YL.neutral;
  const top = (): CardId[] => [match[0], miss, match[1], ...fill(miss, n - 3)];
  const rest = (): CardId[] => [beyond, ...fill(BLUE, 8)];
  const start = (t: CardId[]) => {
    const g = mine(leader, { hand: [id], deck: [...t, ...rest()] });
    playCard(g, id);
    return g;
  };
  const total = n + 9;
  describe(`${id} ${cfg.title}: look at ${n}, add up to 1, rest to the bottom`, () => {
    it('offers exactly the matching cards of the top; the pick goes to hand, the rest to the bottom', () => {
      const g = start(top());
      checkLook(g, { candidates: [...match], pick: [match[1]] });
      expect(hand(g)).toEqual([match[1]]);
      expect(deck(g)).toHaveLength(total - 1);
      expect(deck(g)[0]).toBe(beyond);
      expect(tail(deck(g), n - 1)).toEqual(minus(top(), [match[1]]).sort());
    });
    it('CR 8-4-4-2: may add nothing; all looked-at cards go to the bottom', () => {
      const g = start(top());
      checkLook(g, { candidates: [...match], pick: [] });
      expect(hand(g)).toEqual([]);
      expect(deck(g)).toHaveLength(total);
      expect(deck(g)[0]).toBe(beyond);
      expect(tail(deck(g), n)).toEqual([...top()].sort());
    });
    it('adds at most one card even when two qualify', () => {
      const sets = reachablePickSets(start(top()));
      expect(sets.has('')).toBe(true);
      expect(sets.has(match[0])).toBe(true);
      expect(sets.has(match[1])).toBe(true);
      for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    });
    it(`only the top ${n} are looked at: a match in position ${n + 1} is not offered`, () => {
      const g = start(fill(miss, n));
      checkLook(g, { candidates: [], pick: [] });
      expect(hand(g)).toEqual([]);
      expect(deck(g)[0]).toBe(beyond);
    });
  });
}
