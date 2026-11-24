/**
 * EB04-057 Vegapunk (Character, Yellow, cost 2, 0 power, Counter +1000, {Scientist}/{Ohara}).
 *
 * Card text: "If you have 2 or less Life cards, all of your yellow {Scientist} type Characters cannot be
 * removed from the field by your opponent's effects.
 * [DON!! x1] This Character gains [Blocker]."
 *
 * Rules: "cannot be removed from the field by your opponent's effects" stops an opposing K.O.; a
 * battle K.O. is not an effect and is not stopped. "[DON!! x1]" needs 1 or more DON!! given to this
 * Character. The protection covers Characters that are both yellow and {Scientist}, Vegapunk too.
 */
import { describe, expect, it } from 'vitest';
import {
  accept,
  act,
  at,
  attack,
  blockers,
  BLUE,
  chars,
  choices,
  fill,
  kind,
  LB,
  mine,
  none,
  passBlock,
  passCounter,
  payDon,
  playCard,
  theirs,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-057';
const LIGHTNING = 'OP09-077';
/** OP13-101 Atlas: Yellow, cost 5, 6000, {Scientist}/{Egghead}. */
const ATLAS = 'OP13-101';
/** ST21-013 Vegapunk: Red, cost 1, 3000, {Scientist}/{Egghead}. Not yellow. */
const RED_SCIENTIST = 'ST21-013';
/** EB04-056 Pacifista: Yellow, cost 1, 1000, not a {Scientist}. */
const YELLOW_OTHER = 'EB04-056';
const HAJ = 'OP01-018'; // Red, cost 4, 6000

/** p2 plays Gum-Gum Lightning on `target` (a p1 Character, 6000 power or less). */
function tryKO(g: TestGame, card: string): void {
  const inst = at(g, 'p1', 'characters', card);
  playCard(g, LIGHTNING);
  accept(g);
  payDon(g, 2);
  if (kind(g) === 'choose' && choices(g).includes(inst)) {
    act(g, { type: 'pick', choice: inst });
  } else if (kind(g) === 'choose') {
    none(g);
  }
}
function defend(life: number, own: (string | { card: string; don: number })[]): TestGame {
  return theirs(
    LB.egghead,
    {
      characters: own,
      life: fill(BLUE, life),
      deck: fill(BLUE, 10),
      costArea: { active: 3, rested: 0 },
    },
    { hand: [LIGHTNING], characters: [HAJ] },
  );
}

describe('EB04-057 Vegapunk: with 2 or less Life, your yellow {Scientist} Characters cannot be removed by opponent effects', () => {
  it('with 2 Life cards an opposing K.O. effect does not remove Vegapunk himself', () => {
    const g = defend(2, [ID]);
    tryKO(g, ID);
    expect(chars(g)).toEqual([ID]);
  });

  it('it also protects another yellow {Scientist} Character', () => {
    const g = defend(2, [ID, ATLAS]);
    tryKO(g, ATLAS);
    expect(chars(g)).toEqual([ATLAS, ID].sort());
  });

  it('boundary: with 3 Life cards the K.O. works', () => {
    const g = defend(3, [ID, ATLAS]);
    tryKO(g, ATLAS);
    expect(chars(g)).toEqual([ID]);
  });

  it('a non-yellow {Scientist} Character is not protected', () => {
    const g = defend(2, [ID, RED_SCIENTIST]);
    tryKO(g, RED_SCIENTIST);
    expect(chars(g)).toEqual([ID]);
  });

  it('a yellow Character that is not a {Scientist} is not protected', () => {
    const g = defend(2, [ID, YELLOW_OTHER]);
    tryKO(g, YELLOW_OTHER);
    expect(chars(g)).toEqual([ID]);
  });

  it('a K.O. in battle is not an effect and still removes a {Scientist}', () => {
    const g = theirs(
      LB.egghead,
      {
        characters: [{ card: ATLAS, rested: true }, ID],
        life: fill(BLUE, 2),
        deck: fill(BLUE, 10),
      },
      { characters: ['OP02-020'] },
    );
    attack(g, at(g, 'p2', 'characters', 'OP02-020'), at(g, 'p1', 'characters', ATLAS));
    passBlock(g);
    passCounter(g);
    expect(chars(g)).toEqual([ID]);
  });
});

describe('EB04-057 Vegapunk: protection also covers being returned to the hand by an opposing effect', () => {
  const ICE = 'EB04-028'; // Blue Event; [Trigger] return up to 1 Character with a cost of 5 or less to the owner's hand
  const KINGDEW = 'OP02-006';

  /** p1 attacks p2, whose top Life card is Ice Time; p2 activates it and tries to return Atlas. */
  function bounce(myLife: number): TestGame {
    const g = mine(
      LB.egghead,
      { characters: [ID, ATLAS, KINGDEW], life: fill(BLUE, myLife), deck: fill(BLUE, 10) },
      { life: [ICE, BLUE, BLUE, BLUE] },
    );
    attack(g, at(g, 'p1', 'characters', KINGDEW), g.leader('p2'));
    passBlock(g);
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: true });
    const atlas = at(g, 'p1', 'characters', ATLAS);
    if (kind(g) === 'choose' && choices(g).includes(atlas)) {
      act(g, { type: 'pick', choice: atlas });
    } else if (kind(g) === 'choose') {
      none(g);
    }
    return g;
  }

  it('with 2 Life cards Atlas stays on the field', () => {
    const g = bounce(2);
    expect(chars(g)).toEqual([ATLAS, ID, KINGDEW].sort());
  });

  it('boundary: with 3 Life cards Atlas is returned to the hand', () => {
    const g = bounce(3);
    expect(chars(g)).toEqual([ID, KINGDEW].sort());
  });
});

describe('EB04-057 Vegapunk: [DON!! x1] this Character gains [Blocker]', () => {
  function attacked(don: number): TestGame {
    const g = theirs(
      LB.egghead,
      {
        characters: [{ card: ID, don }],
        life: fill(BLUE, 4),
        deck: fill(BLUE, 10),
        costArea: { active: 3, rested: 0 },
      },
      { characters: [HAJ] },
    );
    attack(g, at(g, 'p2', 'characters', HAJ), g.leader('p1'));
    return g;
  }

  it('with 1 DON!! given it has [Blocker] and can block', () => {
    const g = attacked(1);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
  });

  it('with 2 DON!! given it still has [Blocker]', () => {
    const g = attacked(2);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('boundary: with no DON!! given it has no [Blocker]', () => {
    const g = attacked(0);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).not.toContain('Blocker');
    expect(kind(g) === 'block' ? blockers(g) : []).toEqual([]);
  });

  it('the [Blocker] does not depend on the Life count', () => {
    const g = theirs(
      LB.egghead,
      {
        characters: [{ card: ID, don: 1 }],
        life: fill(BLUE, 5),
        deck: fill(BLUE, 10),
        costArea: { active: 3, rested: 0 },
      },
      { characters: [HAJ] },
    );
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });
});
