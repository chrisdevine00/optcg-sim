/**
 * OP13-091 St. Marcus Mars (Character, Black, cost 6, 5000, Counter +1000, {Celestial Dragons}/{Five Elders}).
 *
 * Card text: "If you have 7 or more cards in your trash, this Character cannot be removed from the
 * field by your opponent's effects and gains [Blocker]. [On Play] You may trash 1 card from your
 * hand: K.O. up to 1 of your opponent's Characters with a base cost of 5 or less."
 *
 * Rules: CR 8-3-1 (cost), CR 8-3-1-3 (unpayable), CR 8-4-4-1 ("up to"), CR 10-2-1 (K.O.).
 */
import { describe, expect, it } from 'vitest';
import {
  afterOpponentSabo,
  at,
  atMain,
  chars,
  describeFiveEldersShield,
  doneRaw,
  hand,
  kind,
  koAim,
  LD13,
  mine,
  need,
  no,
  offeredIds,
  payHandRaw,
  pickRaw,
  pile,
  playRaw,
  reachablePickSets,
  SC15,
  theirsWith,
  trash,
  unusable,
  yes,
} from './kit-op13d.ts';

const ID = 'OP13-091';
const F1 = SC15.red2;
const F2 = SC15.red3;

describeFiveEldersShield({ id: ID, cost: 6 });

function start(
  o: {
    hand?: string[];
    p2?: (string | { card: string; rested?: boolean })[];
    trashN?: number;
  } = {},
) {
  const g = mine(
    LD13.black,
    { hand: [ID, ...(o.hand ?? [F1, F2])], trash: pile(o.trashN ?? 0, SC15.red4) },
    { characters: o.p2 ?? [SC15.red5, SC15.red6, SC15.red3] },
  );
  playRaw(g, g.find('p1', 'hand', ID));
  return g;
}

describe('OP13-091 St. Marcus Mars: [On Play] trash 1 card: K.O. up to 1 Character with base cost 5 or less', () => {
  it('asks whether to pay; paying 1 card offers exactly the Characters of base cost 5 or less', () => {
    const g = start();
    need(g, 'optional', 'p1');
    yes(g);
    payHandRaw(g, [F1]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC15.red3, SC15.red5].sort());
  });

  it('boundary: a base cost 5 Character (Kingdew) is K.O.’d, the cost 6 one (Thatch) is never offered', () => {
    const g = start();
    yes(g);
    payHandRaw(g, [F1]);
    expect(offeredIds(g)).not.toContain(SC15.red6);
    pickRaw(g, at(g, 'p2', 'characters', SC15.red5));
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([SC15.red3, SC15.red6].sort());
    expect(trash(g, 'p2')).toEqual([SC15.red5]);
    expect(trash(g)).toEqual([F1]);
    expect(hand(g)).toEqual([F2]);
  });

  it('declining the cost: nothing is trashed, nothing is K.O.’d, Marcus stays on the field', () => {
    const g = start();
    no(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([F1, F2].sort());
    expect(chars(g, 'p2')).toHaveLength(3);
    expect(chars(g)).toEqual([ID]);
  });

  it('"up to 1": after paying, choosing nobody is legal; the card stays trashed and nobody is K.O.’d', () => {
    const g = start();
    yes(g);
    payHandRaw(g, [F1]);
    need(g, 'choose', 'p1');
    doneRaw(g);
    expect(chars(g, 'p2')).toHaveLength(3);
    expect(trash(g)).toEqual([F1]);
  });

  it('never more than one Character can be K.O.’d', () => {
    const g = start();
    yes(g);
    payHandRaw(g, [F1]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('CR 8-3-1-3: with an empty hand the cost cannot be paid and nothing is K.O.’d', () => {
    const g = start({ hand: [] });
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toHaveLength(3);
    expect(trash(g)).toEqual([]);
  });

  it('only the opponent’s Characters are candidates', () => {
    const g = mine(
      LD13.black,
      { hand: [ID, F1, F2], characters: [SC15.red3] },
      { characters: [SC15.red4] },
    );
    playRaw(g, g.find('p1', 'hand', ID));
    yes(g);
    payHandRaw(g, [F1]);
    expect(offeredIds(g)).toEqual([SC15.red4]);
  });

  it('with no eligible target the effect still costs the card and nothing else happens', () => {
    const g = start({ p2: [SC15.red6] });
    yes(g);
    payHandRaw(g, [F1]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      doneRaw(g);
    }
    expect(chars(g, 'p2')).toEqual([SC15.red6]);
    expect(trash(g)).toEqual([F1]);
  });

  it('an opposing Character shielded by its own Five Elders effect (7 cards in its owner’s trash) is not K.O.’d', () => {
    const g = mine(
      LD13.black,
      { hand: [ID, F1, F2] },
      { characters: ['OP13-089'], trash: pile(7) },
    );
    playRaw(g, g.find('p1', 'hand', ID));
    yes(g);
    payHandRaw(g, [F1]);
    const warcury = at(g, 'p2', 'characters', 'OP13-089');
    // Either the shielded Character is not offered or it is picked and stays: it must stay.
    if (offeredIds(g).includes('OP13-089')) pickRaw(g, warcury);
    else doneRaw(g);
    expect(chars(g, 'p2')).toEqual(['OP13-089']);
    expect(trash(g, 'p2')).toEqual(pile(7));
  });

  it('Marcus himself is shielded at 7 cards and removable at 6 (opposing K.O. after being played)', () => {
    const g7 = theirsWith(LD13.black, { characters: [ID], trash: pile(7) }, {});
    koAim(g7, at(g7, 'p1', 'characters', ID));
    expect(chars(g7)).toEqual([ID]);
    const g6 = theirsWith(LD13.black, { characters: [ID], trash: pile(6) }, {});
    koAim(g6, at(g6, 'p1', 'characters', ID));
    expect(chars(g6)).toEqual([]);
  });

  it('"base cost": a cost 4 Character whose current cost is 6 (+2 from the opponent’s Sabo) is still a legal target', () => {
    const g = afterOpponentSabo(LD13.black, { hand: [ID, F1, F2] }, SC15.red4);
    expect(g.card(at(g, 'p2', 'characters', SC15.red4)).cost).toBe(6);
    playRaw(g, g.find('p1', 'hand', ID));
    yes(g);
    payHandRaw(g, [F1]);
    expect(offeredIds(g)).toEqual([SC15.red4]);
    pickRaw(g, at(g, 'p2', 'characters', SC15.red4));
    expect(trash(g, 'p2')).toEqual([SC15.red4]);
  });
});
