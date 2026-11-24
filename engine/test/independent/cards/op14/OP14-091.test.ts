/**
 * OP14-091 Mr.2.Bon.Kurei(Bentham) (Character, Black, cost 4, 5000, Counter +1000, {Baroque Works}).
 *
 * Card text: "[On K.O.] Play up to 1 Character card with a type including "Baroque Works" and a cost of
 * 5 or less other than [Mr.2.Bon.Kurei.(Bentham)] from your hand or trash."
 *
 * Rules: CR 10-2-17 ([On K.O.] resolves from the trash, so the K.O.'d card is in the trash), CR
 * 8-4-4 ("up to"). The printed exclusion has a stray "." in the name; the card's name is
 * "Mr.2.Bon.Kurei(Bentham)", and the test reads the exclusion as "a card of the same name".
 */
import { describe, expect, it } from 'vitest';
import {
  askedEmpty,
  at,
  atMain,
  BW,
  chars,
  hand,
  LD14,
  need,
  none,
  offeredIds,
  pickCards,
  reachablePickSets,
  SC14,
  theirs,
  theyKo,
  trash,
  BLUE,
  deckTop,
} from './kit-op14d.ts';

const ID = 'OP14-091';

function koed(o: { hand?: string[]; trash?: string[] } = {}) {
  const g = theirs(
    LD14.bw,
    {
      characters: [{ card: ID, rested: true }],
      hand: o.hand ?? [],
      trash: o.trash ?? [],
      deck: deckTop([]),
    },
    {},
  );
  theyKo(g, at(g, 'p1', 'characters', ID));
  return g;
}

describe('OP14-091 Mr.2.Bon.Kurei(Bentham): [On K.O.] play a Baroque Works Character with cost 5 or less from hand or trash', () => {
  it('offers Baroque Works Characters of cost 5 or less from BOTH the hand and the trash', () => {
    const g = koed({ hand: [BW.mr9, SC14.c2], trash: [BW.valentine, BW.croc6] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BW.mr9, BW.valentine].sort());
  });

  it('cost boundary: cost 5 is offered, cost 6 is not', () => {
    const g = koed({ hand: [BW.croc6], trash: [BW.mr9] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BW.mr9]);
  });

  it('"type including": {Former Baroque Works} Characters qualify; a different name with a similar look is allowed', () => {
    const g = koed({ hand: [BW.daz, BW.mr2c5] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BW.daz, BW.mr2c5].sort());
  });

  it('"other than" by name: the K.O.d Bentham itself (now in the trash) and another Bentham in hand or trash are not offered', () => {
    const g = koed({ hand: [BW.bentham4], trash: [BW.bentham, BW.mr9] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BW.mr9]);
  });

  it('a card from the hand enters play ACTIVE and leaves the hand', () => {
    const g = koed({ hand: [BW.mr9], trash: [BW.valentine] });
    pickCards(g, [BW.mr9]);
    expect(atMain(g, 'p2')).toBe(true);
    const c = g.zone('p1', 'characters');
    expect(c.map((x) => x.card)).toEqual([BW.mr9]);
    expect(c[0]!.rested).toBe(false);
    expect(hand(g)).toEqual([]);
  });

  it('a card from the trash enters play and leaves the trash', () => {
    const g = koed({ hand: [BW.mr9], trash: [BW.valentine] });
    pickCards(g, [BW.valentine]);
    expect(chars(g)).toEqual([BW.valentine]);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([BW.mr9]);
  });

  it('"up to 1": may play nothing; at most one is ever played', () => {
    const g = koed({ hand: [BW.mr9], trash: [BW.valentine] });
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    none(g);
    expect(chars(g)).toEqual([]);
  });

  it('only Baroque Works Characters: a plain Character and an Event of the type are not offered; with none nothing happens', () => {
    const g = koed({ hand: [SC14.c2, 'OP14-099'], trash: [SC14.c4] });
    // The hand is hidden, so the pick is asked (empty, max 0) even though nothing qualifies.
    askedEmpty(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([]);
  });

  it('a Character with its own [On Play] has it fire when played this way (Mikita looks at 4)', () => {
    const g = theirs(
      LD14.bw,
      {
        characters: [{ card: ID, rested: true }],
        trash: [BW.mikita],
        deck: [BW.mr9, SC14.c2, SC14.c2, SC14.c2, BLUE, BLUE],
      },
      {},
    );
    theyKo(g, at(g, 'p1', 'characters', ID));
    pickCards(g, [BW.mikita]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BW.mr9]);
  });
});
