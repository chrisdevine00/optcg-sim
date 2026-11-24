/**
 * OP13-102 Edison (Character, Yellow, cost 3, 2000, Counter +2000, {Scientist}/{Egghead}).
 *
 * Card text: "[Activate: Main] You may trash this Character: If the number of your Life cards is equal
 * to or less than the number of your opponent's Life cards, draw 1 card. Then, rest up to 1 of your
 * opponent's Characters with a cost of 3 or less. [Trigger] Draw 1 card and rest up to 1 of your
 * opponent's Characters with a cost of 3 or less."
 *
 * Rules: CR 8-3-1 (cost: trashing itself), CR 8-3-3 and CR 4-10-1 (a "Then" after a failed "If"
 * does not resolve; official OP14-111/112 Q&A, OPEN-QUESTIONS M4b-5), CR 8-4-4-1 ("up to"),
 * RD 101-102 ([Trigger]). Scenery: Mohji-grade vanilla Characters of cost 3 and 4 on the opposing side.
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  afterOpponentSabo,
  activateTrigger,
  at,
  atMain,
  BLUE,
  chars,
  choices,
  declineTrigger,
  deck,
  doneRaw,
  hand,
  hitLeader,
  kind,
  LD13,
  mine,
  need,
  offered,
  offeredAbilities,
  offeredIds,
  pickRaw,
  reachablePickSets,
  SC15,
  theirs,
  trash,
  useAbility,
} from './kit-op13d.ts';

const ID = 'OP13-102';
const life = (n: number) => Array.from({ length: n }, () => BLUE);

function start(
  o: {
    own?: number;
    opp?: number;
    p2?: (string | { card: string; rested?: boolean })[];
    own1?: string[];
    played?: boolean;
  } = {},
): TestGame {
  return mine(
    LD13.yellow,
    {
      characters: [{ card: ID, playedThisTurn: o.played ?? false }, ...(o.own1 ?? [])],
      life: life(o.own ?? 3),
    },
    { life: life(o.opp ?? 4), characters: o.p2 ?? [SC15.red3, SC15.red4] },
  );
}

const edison = (g: TestGame) => at(g, 'p1', 'characters', ID);

/** Use the ability and say yes to the "may trash this Character" cost. */
function run(g: TestGame): void {
  useAbility(g, edison(g));
  if (offered(g, 'p1')) accept(g);
}

const rested = (g: TestGame, card: string) => g.card(at(g, 'p2', 'characters', card)).rested;

describe('OP13-102 Edison: [Activate: Main] may trash this Character: if my Life <= opponent’s Life, draw 1, then rest up to 1 Character with cost 3 or less', () => {
  it('Life 3 vs 4: trashes itself, draws 1, and rests the chosen Character', () => {
    const g = start();
    const before = deck(g).length;
    run(g);
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p2', 'characters', SC15.red3));
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([BLUE]);
    expect(deck(g)).toHaveLength(before - 1);
    expect(rested(g, SC15.red3)).toBe(true);
  });

  it('boundary: equal Life (4 vs 4) still counts as "equal to or less"', () => {
    const g = start({ own: 4, opp: 4 });
    run(g);
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p2', 'characters', SC15.red3));
    expect(hand(g)).toEqual([BLUE]);
    expect(rested(g, SC15.red3)).toBe(true);
  });

  it('boundary: one Life card more than the opponent (5 vs 4): nothing is drawn, the cost is already paid', () => {
    const g = start({ own: 5, opp: 4 });
    run(g);
    if (kind(g) === 'choose') {
      // Whatever is asked, nothing may be rested (see the next test).
      doneRaw(g);
    }
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  // CR 4-10-1 / 8-3-3: "If <cond>, draw 1 card. Then, rest ..." - when the "if" fails the "Then" does
  // not resolve (OPEN-QUESTIONS M4b-5, closed by the official OP14-111/112 Q&As).
  it('boundary: 5 vs 4 Life: the "Then, rest" part does not resolve either (no target is even offered)', () => {
    const g = start({ own: 5, opp: 4 });
    run(g);
    expect(kind(g)).not.toBe('choose');
    expect(rested(g, SC15.red3)).toBe(false);
  });

  it('Life 0 vs 0 counts as equal', () => {
    const g = start({ own: 0, opp: 0 });
    run(g);
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p2', 'characters', SC15.red3));
    expect(hand(g)).toEqual([BLUE]);
  });

  it('boundary: cost 3 is offered, cost 4 is not', () => {
    const g = start();
    run(g);
    expect(offeredIds(g)).toEqual([SC15.red3]);
  });

  it('activating pays the cost at once: Edison is already in the trash when the target is asked', () => {
    const g = start();
    run(g);
    need(g, 'choose', 'p1');
    expect(trash(g)).toEqual([ID]);
    expect(chars(g)).toEqual([]);
  });

  it('"up to 1": choosing no Character is legal, the card is still drawn, never two are rested', () => {
    const g = start({ p2: [SC15.red3, SC15.red2] });
    run(g);
    need(g, 'choose', 'p1');
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    doneRaw(g);
    expect(hand(g)).toEqual([BLUE]);
    expect(rested(g, SC15.red3)).toBe(false);
    expect(rested(g, SC15.red2)).toBe(false);
  });

  it('only the opponent’s Characters can be rested, not my own', () => {
    const g = start({ own1: [SC15.red2] });
    run(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', SC15.red2));
    expect(offeredIds(g)).toEqual([SC15.red3]);
  });

  it('"a cost of 3 or less" reads the current cost: a cost 3 Character raised to 5 by the opponent’s Sabo is not offered', () => {
    const g = afterOpponentSabo(LD13.yellow, { characters: [ID], life: life(3) }, SC15.red3);
    expect(g.card(at(g, 'p2', 'characters', SC15.red3)).cost).toBe(5);
    run(g);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      doneRaw(g);
    }
    expect(g.card(at(g, 'p2', 'characters', SC15.red3)).rested).toBe(false);
  });

  it('it can be activated the turn it was played', () => {
    const g = start({ played: true });
    expect(offeredAbilities(g, edison(g))).toHaveLength(1);
  });

  it('it is not offered on the opponent’s turn', () => {
    const g = theirs(LD13.yellow, { characters: [ID] }, {});
    expect(offeredAbilities(g, edison(g))).toEqual([]);
  });
});

describe('OP13-102 Edison: [Trigger] draw 1 card and rest up to 1 Character with cost 3 or less', () => {
  const hit = () =>
    theirs(LD13.yellow, { life: [ID, BLUE, BLUE, BLUE] }, { characters: [SC15.red3, SC15.red4] });

  it('activated from the Life: draws 1, rests the chosen Character, Edison goes to the trash, no condition on Life', () => {
    const g = hit();
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC15.red3]);
    pickRaw(g, at(g, 'p2', 'characters', SC15.red3));
    expect(hand(g)).toEqual([BLUE]);
    expect(g.card(at(g, 'p2', 'characters', SC15.red3)).rested).toBe(true);
    expect(trash(g)).toEqual([ID]);
    expect(g.life('p1')).toBe(3);
  });

  it('declined: Edison is added to the hand and nothing is drawn or rested', () => {
    const g = hit();
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(g.card(at(g, 'p2', 'characters', SC15.red3)).rested).toBe(false);
  });
});
