/** EB05-020 My name is Shirahoshi!!. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  expectDecision,
  game,
  hand,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  trash,
} from './helpers.ts';

const ID = 'EB05-020';
/** OP11-022 Shirahoshi Leader. */
const SHIRAHOSHI = 'OP11-022';

const start = (leader: string | { card: string; rested: boolean } = SHIRAHOSHI) =>
  game({ leader, hand: [ID], costArea: { active: 1, rested: 0 } }, { leader: PLAIN_BLUE });

describe('EB05-020 My name is Shirahoshi!!', () => {
  it('[Main]: you may rest your Leader [Shirahoshi]: draw 2 cards', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(trash(g, 'p1')).toEqual([ID]);
    expectDecision(g, 'main', 'p1');
  });

  it('declining the optional cost draws nothing and leaves the Leader active', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('cannot be paid with an already rested [Shirahoshi] Leader: nothing is drawn', () => {
    const g = start({ card: SHIRAHOSHI, rested: true });
    play(g, ID);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('cannot be paid with a Leader that is not named [Shirahoshi]', () => {
    const g = start(PLAIN_PURPLE);
    play(g, ID);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(hand(g, 'p1')).toEqual([]);
    expectDecision(g, 'main', 'p1');
  });
});
