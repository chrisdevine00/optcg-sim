/** OP13-024 Gordon. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, expectDecision, option, pick, play, setMost, V } from './helpers.ts';
import { FILM_CHAR, MUSIC_EVENT, mk } from './helpers-op13g1.ts';

const ID = 'OP13-024';

describe('OP13-024 Gordon', () => {
  // Gordon costs 1: after the play 6 DON!! are rested (5 + 1), 4 active.
  const start = (hand: string[]) => mk({ hand: [ID, ...hand], costArea: { active: 5, rested: 5 } });

  it('[On Play]: reveals a {Music} card from hand, then sets up to 2 DON!! active at the end of this turn (not before)', () => {
    const g = start([MUSIC_EVENT, V.c1]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', MUSIC_EVENT)]);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 6 });
    // The revealed card stays in hand.
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain(MUSIC_EVENT);
    g.act({ type: 'endTurn' });
    setMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 6, rested: 4 });
  });

  it('"up to 2": at the End Phase a count is asked; 1 sets one, 0 none (OP14-R2)', () => {
    const g = start([MUSIC_EVENT]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', MUSIC_EVENT)]);
    g.act({ type: 'endTurn' });
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
    const h = start([MUSIC_EVENT]);
    play(h, ID);
    accept(h);
    pick(h, [h.find('p1', 'hand', MUSIC_EVENT)]);
    h.act({ type: 'endTurn' });
    option(h, '0');
    expect(don(h, 'p1')).toMatchObject({ active: 4, rested: 6 });
  });

  it('a {FILM} card qualifies too; a card of neither type is not offered', () => {
    const g = start([FILM_CHAR, V.c1, MUSIC_EVENT]);
    play(g, ID);
    accept(g);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'hand', FILM_CHAR)]);
    g.act({ type: 'endTurn' });
    setMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 6 });
  });

  it('"you may": declining reveals nothing and sets nothing active at end of turn', () => {
    const g = start([MUSIC_EVENT]);
    play(g, ID);
    decline(g);
    g.act({ type: 'endTurn' });
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 6 });
  });

  it('with no {Music} or {FILM} card in hand the cost cannot be paid: nothing happens', () => {
    const g = start([V.c1, V.c2]);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    g.act({ type: 'endTurn' });
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 6 });
  });

  it('sets only as many as are rested ("up to 2"): with 1 rested DON!! only 1 is set active', () => {
    const g = mk({ hand: [ID, MUSIC_EVENT], costArea: { active: 1, rested: 0 }, donDeck: 9 });
    play(g, ID); // pays 1: 1 rested, 0 active
    accept(g);
    pick(g, [g.find('p1', 'hand', MUSIC_EVENT)]);
    g.act({ type: 'endTurn' });
    setMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 0 });
  });
});
