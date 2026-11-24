/**
 * OP14-081 Spider Mice (Character, Black, cost 1, 1000, Counter +1000, {Thriller Bark Pirates}).
 *
 * Card text: "[On Play] Trash 3 cards from the top of your deck.
 * [On K.O.] K.O. up to 1 of your opponent's Characters with a base cost of 1."
 *
 * Rules: trashing from the top is mandatory and public (CR 8-1), a player whose deck reaches 0 cards
 * loses at once (RL-26), "base cost" ignores modifiers (cost effects change the current cost only),
 * "up to 1" may be skipped.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  backToMain,
  BLUE,
  chars,
  chr,
  deck,
  koGame,
  LD14,
  mayChooseNone,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  playRaw,
  result,
  SC14,
  trash,
  kind,
  decision,
} from './kit-op14c.ts';

const ID = 'OP14-081';
const RAGE = 'OP17-097'; // Black Event, cost 1; [Main] give all of your opponent's Characters −1 cost during this turn
const MORIA = 'OP14-080'; // Leader; [Activate: Main] may K.O. one of my {Thriller Bark Pirates} Characters: ...

describe('OP14-081 Spider Mice [On Play] trash 3 cards from the top of my deck', () => {
  it('trashes exactly the top 3, in order, with no question', () => {
    const g = mine(LD14.tbp, {
      hand: [ID],
      deck: [SC14.c1, SC14.c2, SC14.c3, SC14.c4, ...Array.from({ length: 8 }, () => BLUE)],
      costArea: { active: 3, rested: 0 },
    });
    playRaw(g, ID);
    backToMain(g, 'p1');
    expect(trash(g)).toEqual([SC14.c1, SC14.c2, SC14.c3].sort());
    expect(deck(g)).toHaveLength(9);
    expect(deck(g)[0]).toBe(SC14.c4);
    expect(chars(g)).toEqual([ID]);
  });

  it('a deck of 4 keeps 1 card and the game goes on', () => {
    const g = mine(LD14.tbp, {
      hand: [ID],
      deck: [SC14.c1, SC14.c2, SC14.c3, SC14.c4],
      costArea: { active: 3, rested: 0 },
    });
    playRaw(g, ID);
    expect(result(g)).toBeNull();
    expect(deck(g)).toEqual([SC14.c4]);
  });

  it('a deck of exactly 3 is emptied by it: its owner loses at once (RL-26)', () => {
    const g = mine(LD14.tbp, {
      hand: [ID],
      deck: [SC14.c1, SC14.c2, SC14.c3],
      costArea: { active: 3, rested: 0 },
    });
    playRaw(g, ID);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });
});

describe('OP14-081 Spider Mice [On K.O.] K.O. up to 1 Character with a base cost of 1', () => {
  it('offers opposing Characters with base cost 1 only, and K.O.s the chosen one', () => {
    const g = koGame(ID, { p2chars: [SC14.c1, SC14.c2, SC14.c3] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.c1]);
    pickInst(g, [chr(g, 'p2', SC14.c1)]);
    backToMain(g, 'p2');
    expect(chars(g, 'p2')).toEqual([SC14.c2, SC14.c3].sort());
    expect(trash(g, 'p2')).toEqual([SC14.c1]);
  });

  it('boundary: base cost 2 is not a target (nothing is offered)', () => {
    const g = koGame(ID, { p2chars: [SC14.c2] });
    // With no candidate the engine may skip the question or ask it empty.
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    backToMain(g, 'p2');
    expect(chars(g, 'p2')).toEqual([SC14.c2]);
  });

  it('"up to 1": may K.O. nothing; with two candidates at most one is K.O.d', () => {
    const g = koGame(ID, { p2chars: [SC14.c1, SC14.zero1] });
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    expect(offeredIds(g)).toEqual([SC14.c1, SC14.zero1].sort());
    pickInst(g, [chr(g, 'p2', SC14.c1)]);
    backToMain(g, 'p2');
    expect(chars(g, 'p2')).toEqual([SC14.zero1]);
  });

  it('only opposing Characters: my own cost-1 Character is never offered', () => {
    const g = koGame(ID, { p1chars: [SC14.navy1], p2chars: [SC14.c1] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.c1]);
  });

  it('must not fire on play: playing it K.O.s nothing', () => {
    const g = mine(
      LD14.tbp,
      { hand: [ID], costArea: { active: 3, rested: 0 } },
      { characters: [SC14.c1] },
    );
    playRaw(g, ID);
    backToMain(g, 'p1');
    expect(chars(g, 'p2')).toEqual([SC14.c1]);
  });

  /** My turn: the Event gives all their Characters −1 cost, then Moria's cost K.O.s Spider Mice. */
  function reduceThenKo(p2card: string) {
    const g = mine(
      MORIA,
      { hand: [RAGE], characters: [ID], costArea: { active: 3, rested: 0 } },
      { characters: [p2card] },
    );
    playRaw(g, RAGE);
    backToMain(g, 'p1');
    const [ability] = offeredAbilities(g, g.leader('p1'));
    act(g, { type: 'activate', card: g.leader('p1'), ability: ability! });
    if (kind(g) === 'choose' && decision(g)?.purpose === 'cost') {
      pickInst(g, [at(g, 'p1', 'characters', ID)]);
    }
    return g;
  }

  it('BASE cost, not current: a base-1 Character whose cost is reduced to 0 is still a target', () => {
    const g = reduceThenKo(SC14.c1);
    expect(g.card(chr(g, 'p2', SC14.c1)).cost ?? 0).toBeLessThanOrEqual(0);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.c1]);
  });

  it('BASE cost, not current: a base-2 Character reduced to cost 1 is NOT a target', () => {
    const g = reduceThenKo(SC14.c2);
    expect(g.card(chr(g, 'p2', SC14.c2)).cost).toBe(1);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(chars(g, 'p2')).toEqual([SC14.c2]);
  });
});
