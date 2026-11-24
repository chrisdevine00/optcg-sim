/**
 * OP14-010 Basil Hawkins (Character, cost 1, 2000, Counter +1000, {Hawkins Pirates}/{Supernovas}).
 *
 * Card text: "[On K.O.] Look at 5 cards from the top of your deck; play up to 1 {Supernovas} type
 * Character card with 2000 power or less other than [Basil Hawkins]. Then, place the rest at the
 * bottom of your deck in any order."
 *
 * Rules: [On K.O.] (CR 10-2-17) fires when this Character is K.O.'d by battle or by an effect. Only
 * Character cards can be played; the power filter reads the printed power. A card played this way
 * is placed active. "Up to 1" may be none. The rest go to the bottom in any order (an `order`
 * decision may be asked and is answered with the first listed order).
 */
import { describe, expect, it } from 'vitest';
import {
  attack,
  at,
  BLUE,
  chars,
  deck,
  fill,
  kind,
  LD14,
  need,
  none,
  offeredIds,
  opponentKOs,
  passBlock,
  passCounter,
  pickInst,
  S14,
  settleOrders,
  sorted,
  tail,
  theirs,
  trash,
} from './kit-op14a.ts';

const HAWK = 'OP14-010';
/** OP01-039 Killer: Supernovas Character, 2000 power. */
const KILLER2 = S14.killer2;
/** OP14-005 Killer: Supernovas Character, 1000 power. */
const KILLER1 = 'OP14-005';
/** ST16-005 Monkey.D.Luffy: green Supernovas Character, cost 2, 3000 power. */
const LUFFY3000 = 'ST16-005';
/** OP14-018 Time for the Counterattack: Event with the Supernovas type. */
const SN_EVENT = 'OP14-018';

/** p2 attacks the rested Hawkins with a 5000 Character; p1's deck top is `top`. */
function koedInBattle(top: string[]) {
  const g = theirs(
    LD14.croc,
    {
      characters: [{ card: HAWK, rested: true }],
      deck: [...top, ...fill(BLUE, 12)],
    },
    { characters: [S14.marco] },
  );
  attack(g, at(g, 'p2', 'characters', S14.marco), at(g, 'p1', 'characters', HAWK));
  passBlock(g);
  passCounter(g);
  return g;
}

const FIVE = [KILLER2, KILLER1, S14.zoroSn, S14.dadan, HAWK];

describe('OP14-010 Basil Hawkins: [On K.O.] look at 5, play up to 1 {Supernovas} Character with 2000 power or less', () => {
  it('offers exactly the Supernovas Characters with 2000 or less among the 5, excluding Basil Hawkins and others', () => {
    const g = koedInBattle(FIVE);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KILLER1, KILLER2].sort());
  });

  it('plays the chosen card active and puts the other four at the bottom of the deck', () => {
    const g = koedInBattle(FIVE);
    pickInst(g, [g.find('p1', 'deck', KILLER2)]);
    settleOrders(g, 'p1');
    expect(chars(g)).toEqual([KILLER2]);
    expect(g.card(at(g, 'p1', 'characters', KILLER2)).rested).toBe(false);
    expect(deck(g)).toHaveLength(16);
    expect(tail(deck(g), 4)).toEqual([KILLER1, S14.zoroSn, S14.dadan, HAWK].sort());
    expect(deck(g)[0]).toBe(BLUE);
  });

  it('Basil Hawkins himself is in the trash (K.O.d), not on the field', () => {
    const g = koedInBattle(FIVE);
    pickInst(g, [g.find('p1', 'deck', KILLER1)]);
    settleOrders(g, 'p1');
    expect(trash(g)).toEqual([HAWK]);
    expect(chars(g)).toEqual([KILLER1]);
  });

  it('"up to 1": may play nothing; all 5 looked-at cards go to the bottom', () => {
    const g = koedInBattle(FIVE);
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(deck(g)).toHaveLength(17);
    expect(tail(deck(g), 5)).toEqual([...FIVE].sort());
    expect(deck(g)[0]).toBe(BLUE);
  });

  it('plays at most 1 even when two cards qualify', () => {
    const g = koedInBattle(FIVE);
    pickInst(g, [g.find('p1', 'deck', KILLER2)]);
    settleOrders(g, 'p1');
    expect(chars(g)).toHaveLength(1);
  });

  it('only the top 5 are looked at: a qualifying card in 6th place is not offered', () => {
    const g = koedInBattle([S14.dadan, S14.dadan, S14.dadan, S14.zoroSn, S14.dadan, KILLER2]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    settleOrders(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(deck(g)[0]).toBe(KILLER2);
  });

  it('boundary: a Supernovas Character with 3000 power is not offered; an Event with the type is not either', () => {
    const g = koedInBattle([LUFFY3000, SN_EVENT, KILLER2, S14.dadan, S14.dadan]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KILLER2]);
  });

  it('with no qualifying card in the top 5 nothing is played and all 5 go to the bottom', () => {
    const top = [LUFFY3000, S14.zoroSn, S14.dadan, S14.kingdew, HAWK];
    const g = koedInBattle(top);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    settleOrders(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(tail(deck(g), 5)).toEqual([...top].sort());
  });

  it('fires when K.O.d by an opponent effect too (Gum-Gum Lightning)', () => {
    const g = theirs(
      LD14.croc,
      { characters: [HAWK], deck: [...FIVE, ...fill(BLUE, 12)] },
      { hand: ['OP09-077'], characters: [S14.dadan] },
    );
    opponentKOs(g, at(g, 'p1', 'characters', HAWK));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KILLER1, KILLER2].sort());
    pickInst(g, [g.find('p1', 'deck', KILLER1)]);
    settleOrders(g, 'p1');
    expect(chars(g)).toEqual([KILLER1]);
  });

  it('does not fire while Hawkins is merely rested or on the field', () => {
    const g = theirs(
      LD14.croc,
      { characters: [{ card: HAWK, rested: true }], deck: [...FIVE, ...fill(BLUE, 12)] },
      { characters: [S14.dadan] },
    );
    expect(sorted(g, 'p1', 'deck')).toHaveLength(17);
    expect(kind(g)).toBe('main');
  });
});
