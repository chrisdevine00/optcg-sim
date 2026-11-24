/** OP16-012 Benn.Beckman. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, game, hand, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { canAccept, idsIn, RED_LEADER, SHANKS_LEADER, SHANKS_V } from './helpers-op16g1.ts';

const ID = 'OP16-012';
/** Purple Leader of type {Red-Haired Pirates}: SHANKS_LEADER. */

describe('OP16-012 Benn.Beckman', () => {
  /** Benn costs 5; `active` DON!! in the cost area and `given` DON!! on a Character make the DON!! on the field. */
  const start = (leader: string, active: number, given = 0) =>
    game(
      {
        leader,
        hand: [ID, SHANKS_V],
        characters: given ? [{ card: V.c1, don: given }] : [],
        costArea: { active, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );

  it('[Blocker]', () => {
    const g = game({ leader: RED_LEADER, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play]: rest 1 DON!!: with a {Red-Haired Pirates} Leader and 10 DON!! on your field, play up to 1 [Shanks] from your hand', () => {
    const g = start(SHANKS_LEADER, 10);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', SHANKS_V)]);
    expect(idsIn(g, 'p1', 'characters')).toEqual([ID, SHANKS_V]);
    expect(hand(g, 'p1')).toEqual([]);
    // Played for free: 5 for Benn plus 1 rested for the cost.
    expect(don(g, 'p1').rested).toBe(6);
  });

  it('threshold: 9 DON!! on your field is not enough (the cost is paid, nothing is played)', () => {
    const g = start(SHANKS_LEADER, 9);
    play(g, ID);
    accept(g);
    expect(idsIn(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([SHANKS_V]);
  });

  it('DON!! given to a Character count toward the 10', () => {
    const g = start(SHANKS_LEADER, 8, 2);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', SHANKS_V)]);
    expect(idsIn(g, 'p1', 'characters')).toEqual([V.c1, ID, SHANKS_V]);
  });

  it('a Leader without the {Red-Haired Pirates} type plays nothing', () => {
    const g = start(RED_LEADER, 10);
    play(g, ID);
    accept(g);
    expect(idsIn(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('"up to 1": the [Shanks] may be left in hand; declining the cost does nothing', () => {
    const g = start(SHANKS_LEADER, 10);
    play(g, ID);
    accept(g);
    none(g);
    expect(hand(g, 'p1')).toEqual([SHANKS_V]);
    const g2 = start(SHANKS_LEADER, 10);
    play(g2, ID);
    decline(g2);
    expect(hand(g2, 'p1')).toEqual([SHANKS_V]);
    expect(canAccept(g2)).toBe(false);
  });
});
