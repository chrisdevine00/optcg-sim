/** OP12-118 Jewelry Bonney. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, game, hand, option, play, PLAIN_BLUE, trash, V } from './helpers.ts';
import { RA_LEADER, cardsIn } from './helpers-op12g3.ts';

const ID = 'OP12-118';
const rested = (card: string) => ({ card, rested: true });

/** p1: Bonney in hand (cost 5, so 5 DON!! end up rested) and these rested Characters / Leader. */
const start = (chars: ReturnType<typeof rested>[], leaderRested = false, active = 10) =>
  game(
    {
      leader: leaderRested ? rested(RA_LEADER) : RA_LEADER,
      hand: [ID, V.c1],
      characters: chars,
      costArea: { active, rested: 0 },
      deck: [V.c2, V.c3, V.c4],
    },
    { leader: PLAIN_BLUE },
  );

describe('OP12-118 Jewelry Bonney', () => {
  it('has [Blocker]', () => {
    const g = game({ leader: RA_LEADER, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] with 8 or more rested cards (5 rested DON!! + 3 rested Characters): draws 2, trashes 1, then sets up to 1 DON!! active', () => {
    const g = start([rested(V.c1), rested(V.c2), rested(V.c3)]);
    play(g, ID);
    expect(hand(g, 'p1').sort()).toEqual([V.c1, V.c2, V.c3].sort());
    expectDecision(g, 'choose', 'p1');
    // Trash the card drawn second; hand held V.c1 and drew V.c2, V.c3.
    expect(g.legal().filter((a) => a.type === 'pick').length).toBeGreaterThan(0);
    g.act({ type: 'pick', choice: g.find('p1', 'hand', V.c2) });
    expect(hand(g, 'p1').sort()).toEqual([V.c1, V.c3].sort());
    expect(trash(g, 'p1')).toEqual([V.c2]);
    // "Set up to 1": a count is asked, most first.
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ active: 6, rested: 4 });
    expect(cardsIn(g, 'p1', 'deck')).toEqual([V.c4]);
  });

  it('the Leader and the Stage count as cards too: a rested Leader + 2 rested Characters + 5 DON!! = 8', () => {
    const g = start([rested(V.c1), rested(V.c2)], true);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(3);
  });

  it('boundary: 7 rested cards do nothing (and the "Then" set-active is not run either)', () => {
    const g = start([rested(V.c1), rested(V.c2)]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
  });

  it('Bonney herself is active when played, so she is not counted', () => {
    // 5 rested DON!! + 2 rested Characters + the active Bonney = 7.
    const g = start([rested(V.c1), rested(V.c2)]);
    play(g, ID);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('"up to 1": the DON!! may be left rested', () => {
    const g = start([rested(V.c1), rested(V.c2), rested(V.c3)]);
    play(g, ID);
    g.act({ type: 'pick', choice: g.find('p1', 'hand', V.c2) });
    option(g, '0');
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
  });
});
