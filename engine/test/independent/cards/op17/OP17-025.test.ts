/**
 * OP17-025 Building Snake (Character, Green, cost 4, 5000, Counter +1000, {Red-Haired Pirates}, Slash).
 *
 * Card text: "[On K.O.] K.O. up to 1 of your opponent's rested Characters with a cost of 6 or less.
 * [Activate: Main] [Once Per Turn] Give up to 1 rested DON!! card to your [Shanks] Leader."
 *
 * Rules: CR 10-2-17 ([On K.O.]), CR 8-4-4-1 ("up to"), CR 10-2-13 ([Once Per Turn]), CR 6-5-5-2 (given
 * DON!! add +1000 on their owner's turn), CR 8-3-3 (no [Shanks] Leader: nothing to give to), RL-17
 * (rested Characters).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  abilities,
  activate,
  attack,
  BLUE,
  canActivate,
  charsOf,
  choiceCards,
  choices,
  kind,
  choose,
  chooseNone,
  don,
  expectMain,
  LD,
  lp,
  mine,
  noDefence,
  opponentKOs,
  reachablePickSets,
  SC2,
  settleYes,
  theirs,
  trash,
  WB,
} from './kit-op17a.ts';

const SNAKE = 'OP17-025';

/** p2 attacks my rested Snake with a Kingdew and wins; the Kingdew is rested afterwards. */
function snakeDies(opp: (string | { card: string; rested: boolean })[]) {
  const g = theirs(
    LD.shanks,
    { characters: [{ card: SNAKE, rested: true }], life: fill(BLUE, 4) },
    { characters: [WB.kingdew, ...opp] },
  );
  attack(g, g.find('p2', 'characters', WB.kingdew), g.find('p1', 'characters', SNAKE));
  noDefence(g);
  return g;
}

describe('OP17-025 Building Snake: [On K.O.] K.O. up to 1 opposing rested Character with a cost of 6 or less', () => {
  it('K.O.’d in battle: the attacker (now rested, cost 5) and other rested cost-6-or-less Characters are candidates; the choice K.O.s', () => {
    const g = snakeDies([{ card: WB.thatch, rested: true }]);
    expect(choiceCards(g)).toEqual([WB.kingdew, WB.thatch].sort());
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    expectMain(g, 'p2');
    expect(charsOf(g, 'p2')).toEqual([WB.kingdew]);
    expect(trash(g, 'p2')).toEqual([WB.thatch]);
  });

  it('boundary: cost 6 is a candidate (Thatch), cost 7 (Urashima) is not', () => {
    const g = snakeDies([
      { card: WB.thatch, rested: true },
      { card: SC2.urashima, rested: true },
    ]);
    expect(choiceCards(g)).toEqual([WB.kingdew, WB.thatch].sort());
  });

  it('only RESTED Characters: an active cost-4 Character is not a candidate', () => {
    const g = snakeDies([WB.jil]);
    expect(choiceCards(g)).toEqual([WB.kingdew]);
  });

  it('CR 8-4-4-1 "up to 1": may K.O. nobody', () => {
    const g = snakeDies([{ card: WB.thatch, rested: true }]);
    chooseNone(g);
    expect(charsOf(g, 'p2')).toEqual([WB.kingdew, WB.thatch].sort());
  });

  it('at most one Character is K.O.’d', () => {
    const g = snakeDies([{ card: WB.thatch, rested: true }]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('K.O.’d by an opponent’s effect (not battle) it works the same', () => {
    const g = theirs(
      LD.shanks,
      { characters: [SNAKE], life: fill(BLUE, 4) },
      { hand: [SC2.lightning], characters: [{ card: WB.thatch, rested: true }] },
    );
    opponentKOs(g, g.find('p1', 'characters', SNAKE));
    expect(choiceCards(g)).toEqual([WB.thatch]);
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    expect(charsOf(g, 'p2')).toEqual([]);
  });

  it('with no rested cost-6-or-less Character nothing is asked', () => {
    const g = theirs(
      LD.shanks,
      { characters: [SNAKE], life: fill(BLUE, 4) },
      { hand: [SC2.lightning], characters: [WB.thatch] },
    );
    opponentKOs(g, g.find('p1', 'characters', SNAKE));
    settleYes(g, 'p1');
    expectMain(g, 'p2');
    expect(charsOf(g, 'p2')).toEqual([WB.thatch]);
  });
});

describe('OP17-025 Building Snake: [Activate: Main] [Once Per Turn] give up to 1 rested DON!! to your [Shanks] Leader', () => {
  const setup = (leader: string, costArea = { active: 8, rested: 2 }) =>
    mine(leader, { characters: [SNAKE], costArea });
  const snake = (g: ReturnType<typeof setup>) => g.find('p1', 'characters', SNAKE);

  it('a [Shanks] Leader receives 1 rested DON!! (+1000 on my turn)', () => {
    const g = setup(LD.shanks);
    activate(g, snake(g));
    choose(g, [g.leader('p1')]);
    expectMain(g);
    expect(don(g)).toMatchObject({ rested: 1, given: 1, active: 8 });
    expect(lp(g, 'p1')).toBe(6000);
  });

  it('any Leader named [Shanks] counts (ST05-001)', () => {
    const g = setup(LD.shanksP);
    activate(g, snake(g));
    choose(g, [g.leader('p1')]);
    expect(don(g)).toMatchObject({ given: 1 });
  });

  it('CR 8-4-4-1 "up to 1": the Leader need not be chosen', () => {
    const g = setup(LD.shanks);
    activate(g, snake(g));
    chooseNone(g);
    expect(don(g)).toMatchObject({ rested: 2, given: 0 });
  });

  it('the DON!! given is a RESTED one: with only active DON!! nothing is given', () => {
    const g = setup(LD.shanks, { active: 10, rested: 0 });
    if (abilities(g, snake(g)).length) {
      activate(g, snake(g));
      if (kind(g) === 'choose') chooseNone(g);
    }
    expectMain(g);
    expect(don(g)).toMatchObject({ active: 10, given: 0 });
    expect(lp(g, 'p1')).toBe(5000);
  });

  it('CR 8-3-3: a Leader that is not [Shanks] receives nothing', () => {
    const g = setup(LD.luffy);
    if (abilities(g, snake(g)).length) {
      activate(g, snake(g));
      if (kind(g) === 'choose') chooseNone(g);
    }
    expectMain(g);
    expect(don(g)).toMatchObject({ rested: 2, given: 0 });
  });

  it('only the Leader is a candidate: not a Character', () => {
    const g = mine(LD.shanks, { characters: [SNAKE, WB.jil], costArea: { active: 8, rested: 2 } });
    activate(g, snake(g));
    expect(choices(g)).toEqual([g.leader('p1')]);
  });

  it('CR 10-2-13: [Once Per Turn]: a second activation in the same turn is not offered', () => {
    const g = setup(LD.shanks);
    activate(g, snake(g));
    choose(g, [g.leader('p1')]);
    expect(canActivate(g, snake(g))).toBe(false);
    expect(don(g)).toMatchObject({ given: 1 });
  });
});
