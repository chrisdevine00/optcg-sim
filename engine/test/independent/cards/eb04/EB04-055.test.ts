/**
 * EB04-055 Bartholomew Kuma (Character, Yellow, cost 4, 5000, Counter +1000, {Revolutionary Army}/{The Seven Warlords of the Sea}).
 *
 * Card text: "[On K.O.] Play up to 1 {Revolutionary Army} type Character card with a cost of 4 or less
 * from your hand."
 * "[Trigger] If your Leader has the {Revolutionary Army} type and you and your opponent have a total
 * of 5 or less Life cards, play this card."
 *
 * Rules: [On K.O.] fires on a battle K.O. The played card comes from the hand, active, free. A
 * [Trigger] resolves after the Life card has left the Life area, so it is not counted.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  chars,
  fill,
  hand,
  isRestedInst,
  kind,
  LB,
  need,
  none,
  offeredIds,
  passBlock,
  pickRaw,
  theirs,
  trash,
  atMain,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-055';
/** EB05-041 Koala: Black, cost 2, 4000, {Revolutionary Army}/{Dressrosa}. */
const KOALA = 'EB05-041';
/** OP09-113 Morley: Yellow, cost 4, 6000, {Giant}/{Revolutionary Army}. */
const MORLEY4 = 'OP09-113';
/** OP12-083 Inazuma: Black, cost 5, 6000, {Revolutionary Army}. */
const INAZUMA5 = 'OP12-083';
const SAI = 'OP01-012'; // Red, cost 2, not Revolutionary Army
const OARS = 'OP02-020'; // Red, cost 7, 9000

describe('EB04-055 Kuma: [On K.O.] play up to 1 {Revolutionary Army} Character (cost 4 or less) from hand', () => {
  function koed(hnd: string[]): TestGame {
    const g = theirs(
      LB.army,
      {
        characters: [{ card: ID, rested: true }],
        hand: hnd,
        life: fill(BLUE, 4),
        deck: fill(BLUE, 10),
      },
      { characters: [OARS] },
    );
    attack(g, at(g, 'p2', 'characters', OARS), at(g, 'p1', 'characters', ID));
    passBlock(g);
    g.act({ type: 'endCounter' });
    return g;
  }

  it('offers {Revolutionary Army} Characters of cost 4 or less only; plays the chosen one active', () => {
    const g = koed([KOALA, MORLEY4, INAZUMA5, SAI]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KOALA, MORLEY4].sort());
    pickRaw(g, g.find('p1', 'hand', MORLEY4));
    expect(chars(g)).toEqual([MORLEY4]);
    expect(isRestedInst(g, at(g, 'p1', 'characters', MORLEY4))).toBe(false);
    expect(hand(g)).toEqual([INAZUMA5, KOALA, SAI].sort());
    expect(trash(g)).toEqual([ID]);
  });

  it('boundary: cost 4 is allowed, cost 5 is not', () => {
    const g = koed([MORLEY4, INAZUMA5]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([MORLEY4]);
  });

  it('"up to 1": may play nothing', () => {
    const g = koed([KOALA]);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([KOALA]);
  });

  it('with nothing qualifying the pick is still asked (the hand is hidden), with no candidates', () => {
    const g = koed([SAI, INAZUMA5]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('plays at most one card', () => {
    const g = koed([KOALA, MORLEY4]);
    pickRaw(g, g.find('p1', 'hand', KOALA));
    expect(chars(g)).toHaveLength(1);
  });
});

describe('EB04-055 Kuma: [Trigger] with a {Revolutionary Army} Leader and a total of 5 or less Life cards, play this card', () => {
  /** p2 attacks p1's Leader; p1's top Life card is Kuma. */
  function revealed(leader: string, myLife: number, oppLife: number): TestGame {
    const g = theirs(
      leader,
      { life: [ID, ...fill(BLUE, myLife - 1)], deck: fill(BLUE, 10) },
      { characters: [OARS], life: fill(BLUE, oppLife) },
    );
    attack(g, at(g, 'p2', 'characters', OARS), g.leader('p1'));
    passBlock(g);
    g.act({ type: 'endCounter' });
    expect(kind(g)).toBe('trigger');
    g.act({ type: 'trigger', activate: true });
    return g;
  }

  it('boundary: 2 Life left for you after the reveal and 3 for the opponent (total 5) plays Kuma', () => {
    const g = revealed(LB.army, 3, 3);
    expect(g.life('p1')).toBe(2);
    expect(chars(g)).toEqual([ID]);
    expect(isRestedInst(g, at(g, 'p1', 'characters', ID))).toBe(false);
  });

  it('boundary: a total of 6 (the opponent has 4) does not play Kuma; it is trashed', () => {
    const g = revealed(LB.army, 3, 4);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('a total of 3 or fewer also qualifies', () => {
    const g = revealed(LB.army, 2, 1);
    expect(chars(g)).toEqual([ID]);
  });

  it('without a {Revolutionary Army} Leader it is not played', () => {
    const g = revealed(LB.neutral, 3, 3);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('declining the Trigger puts the card in hand and plays nothing', () => {
    const g = theirs(
      LB.army,
      { life: [ID, BLUE], deck: fill(BLUE, 10) },
      { characters: [OARS], life: fill(BLUE, 1) },
    );
    attack(g, at(g, 'p2', 'characters', OARS), g.leader('p1'));
    passBlock(g);
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: false });
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([ID]);
  });
});
