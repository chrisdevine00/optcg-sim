/** OP15-028 Meowban Brothers. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, game, none, pick, play, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import { canPick, EAST_BLUE_SLASH_LEADER } from './helpers-w3s.ts';

const ID = 'OP15-028';

describe('OP15-028 Meowban Brothers', () => {
  const start = (leader: string, active: number, rested: number, chars: string[] = [PURPLE]) =>
    game(
      { leader, hand: [ID], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE, characters: chars, costArea: { active, rested } },
    );

  it('[On Play] with an {East Blue} Leader: give up to 1 DON!! (active) from the opponent’s cost area to their Character', () => {
    const g = start(EAST_BLUE_SLASH_LEADER, 2, 0);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p2'))).toBe(false); // Characters only
    pick(g, [g.find('p2', 'characters', PURPLE)]);
    expect(g.card(g.find('p2', 'characters', PURPLE)).don).toBe(1);
    expect(don(g, 'p2')).toMatchObject({ active: 1, rested: 0, given: 1 });
  });

  it('rested DON!! can be given too', () => {
    const g = start(EAST_BLUE_SLASH_LEADER, 0, 2);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', PURPLE)]);
    expect(don(g, 'p2')).toMatchObject({ active: 0, rested: 1, given: 1 });
  });

  it('with both kinds the giver chooses which kind', () => {
    const g = start(EAST_BLUE_SLASH_LEADER, 1, 1);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    const kinds = g.legal().flatMap((a) => (a.type === 'pick' ? [a.choice] : []));
    expect(kinds).toContainEqual({ from: 'costActive' });
    expect(kinds).toContainEqual({ from: 'costRested' });
    g.act({ type: 'pick', choice: { from: 'costRested' } });
    pick(g, [g.find('p2', 'characters', PURPLE)]);
    expect(don(g, 'p2')).toMatchObject({ active: 1, rested: 0, given: 1 });
  });

  it('"up to 1": nothing needs to be given', () => {
    const g = start(EAST_BLUE_SLASH_LEADER, 2, 0, [PURPLE, V.c1]);
    play(g, ID);
    none(g);
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 0, given: 0 });
  });

  it('without an {East Blue} Leader nothing is given', () => {
    const g = start(PLAIN_BLUE, 2, 2);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 2, given: 0 });
  });

  it('with no opposing Character or no DON!! nothing is asked', () => {
    const a = start(EAST_BLUE_SLASH_LEADER, 2, 2, []);
    play(a, ID);
    expectDecision(a, 'main', 'p1');
    expect(don(a, 'p2').given).toBe(0);
    const b = start(EAST_BLUE_SLASH_LEADER, 0, 0);
    play(b, ID);
    expectDecision(b, 'main', 'p1');
  });
});
