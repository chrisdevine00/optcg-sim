/**
 * OP16-074 Magellan (Character, Purple, cost 8, 10000, no Counter, {Impel Down}).
 *
 * Card text: "[On Play] If your Leader has the {Impel Down} type, your opponent returns 1 DON!! card
 * from their field to their DON!! deck. [On K.O.] Your opponent returns 4 DON!! cards from their
 * field to their DON!! deck."
 *
 * Rules: when an effect makes a player return DON!!, the OWNER chooses which (rulings.md, QA-OP16
 * OP16-074); "their field" counts the cost area (active or rested) and DON!! given to their Leader
 * or Characters (CR 3-1-2, QA-OP01 OP01-091); DON!! go to the DON!! deck (CR 8-3-1-6). With fewer
 * DON!! than asked, M6b-Q45 (open) is read as "as many as they have"; the tests that depend on it
 * assert only that every DON!! they had is returned and nothing else changes.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  cardIds,
  don,
  fieldDon,
  kind,
  mine,
  need,
  offeredDonFrom,
  passBlock,
  pickDonClass,
  theirs,
  W3C,
  W3L,
} from './kit-w3.ts';

const MAG = 'OP16-074';

type P2 = Parameters<typeof mine>[2];
function played(leader: string, p2: P2) {
  const g = mine(leader, { hand: [MAG] }, p2);
  act(g, { type: 'playCard', card: g.find('p1', 'hand', MAG) });
  return g;
}

describe('OP16-074 Magellan: [On Play] if my Leader is {Impel Down}, the opponent returns 1 DON!!', () => {
  it('the opponent returns exactly 1 DON!! from their field to their DON!! deck', () => {
    const g = played(W3L.impel, { costArea: { active: 3, rested: 4 } });
    need(g, 'choose', 'p2');
    pickDonClass(g, 'costRested');
    expect(atMain(g)).toBe(true);
    expect(don(g, 'p2')).toMatchObject({ active: 3, rested: 3, given: 0, deck: 4 });
    expect(cardIds(g, 'p1', 'characters')).toEqual([MAG]);
  });

  it('the OWNER of the DON!! chooses which one: the opponent is asked, with active and rested on offer', () => {
    const g = played(W3L.impel, { costArea: { active: 3, rested: 4 } });
    need(g, 'choose', 'p2');
    expect(offeredDonFrom(g)).toEqual(['costActive', 'costRested']);
    pickDonClass(g, 'costActive');
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 4, deck: 4 });
  });

  it('DON!! given to their Leader or Characters are "on their field" and may be returned', () => {
    const g = mine(
      W3L.impel,
      { hand: [MAG] },
      { characters: [{ card: W3C.thatch, don: 1 }], costArea: { active: 1, rested: 0 } },
    );
    act(g, { type: 'playCard', card: g.find('p1', 'hand', MAG) });
    need(g, 'choose', 'p2');
    expect(offeredDonFrom(g)).toContain('given');
    const given = g
      .legal()
      .find(
        (a) =>
          a.type === 'pick' &&
          typeof a.choice === 'object' &&
          'from' in a.choice &&
          a.choice.from === 'given',
      );
    g.act(given!);
    expect(g.card(g.find('p2', 'characters', W3C.thatch)).don).toBe(0);
    expect(don(g, 'p2')).toMatchObject({ active: 1, given: 0, deck: 9 });
  });

  it('without an {Impel Down} Leader nothing is returned and nothing is asked', () => {
    const g = played(W3L.kid, { costArea: { active: 3, rested: 4 } });
    expect(atMain(g)).toBe(true);
    expect(don(g, 'p2')).toMatchObject({ active: 3, rested: 4, deck: 3 });
  });

  it('an opponent with no DON!! on their field returns nothing', () => {
    const g = played(W3L.impel, { costArea: { active: 0, rested: 0 } });
    expect(atMain(g)).toBe(true);
    expect(fieldDon(g, 'p2')).toBe(0);
    expect(don(g, 'p2').deck).toBe(10);
  });

  it('my own DON!! are not touched', () => {
    const g = played(W3L.impel, { costArea: { active: 3, rested: 4 } });
    pickDonClass(g, 'costRested');
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 8, deck: 0 });
  });
});

describe('OP16-074 Magellan: [On K.O.] the opponent returns 4 DON!!', () => {
  /** p2's turn: Magellan (rested) is K.O.'d in battle by Shiki (10000 against 10000). */
  function koed(leader: string, p2Don: { active: number; rested: number }) {
    const g = theirs(
      leader,
      { characters: [{ card: MAG, rested: true }] },
      { characters: [W3C.shiki], costArea: p2Don },
    );
    attack(g, g.find('p2', 'characters', W3C.shiki), g.find('p1', 'characters', MAG));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  }

  it('returns exactly 4 DON!!, one choice at a time by their owner', () => {
    const g = koed(W3L.impel, { active: 6, rested: 2 });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    // Picks of unordered DON!! are made in canonical order: active ones first, then rested.
    for (let i = 0; i < 4; i++) {
      need(g, 'choose', 'p2');
      pickDonClass(g, i < 2 ? 'costActive' : 'costRested');
    }
    expect(kind(g)).toBe('main');
    expect(don(g, 'p2')).toMatchObject({ active: 4, rested: 0, given: 0, deck: 6 });
  });

  it('works with any Leader: the {Impel Down} condition belongs to the [On Play] only', () => {
    // Every DON!! is active, so the engine may decide the four picks itself.
    const g = koed(W3L.kid, { active: 5, rested: 0 });
    while (kind(g) === 'choose') pickDonClass(g, 'costActive');
    expect(atMain(g, 'p2')).toBe(true);
    expect(don(g, 'p2')).toMatchObject({ active: 1, deck: 9 });
  });

  it('with only 3 DON!! on their field they return all 3 (as many as they have)', () => {
    const g = koed(W3L.impel, { active: 2, rested: 1 });
    while (kind(g) === 'choose') {
      need(g, 'choose', 'p2');
      pickDonClass(
        g,
        g
          .legal()
          .some(
            (a) =>
              a.type === 'pick' &&
              typeof a.choice === 'object' &&
              'from' in a.choice &&
              a.choice.from === 'costActive',
          )
          ? 'costActive'
          : 'costRested',
      );
    }
    expect(fieldDon(g, 'p2')).toBe(0);
    expect(don(g, 'p2').deck).toBe(10);
  });

  it('the opponent with 4 DON!! on their field returns them all', () => {
    const g = koed(W3L.impel, { active: 0, rested: 4 });
    for (let i = 0; i < 4; i++) {
      if (kind(g) === 'choose') pickDonClass(g, 'costRested');
    }
    expect(don(g, 'p2')).toMatchObject({ active: 0, rested: 0, deck: 10 });
  });

  it('is not an [On Play]: Magellan arriving on my field does not return 4', () => {
    const g = played(W3L.impel, { costArea: { active: 3, rested: 4 } });
    pickDonClass(g, 'costRested');
    expect(fieldDon(g, 'p2')).toBe(6);
  });
});
