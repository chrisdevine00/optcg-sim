/** EB05-040 You Need Me, Don't You?!!♡ */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  expectDecision,
  game,
  hand,
  passBlock,
  pick,
  play,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';
import { DONQ_LEADER } from './helpers-eb05g2.ts';

const YOU_NEED_ME = 'EB05-040';
const start = (leader: string, costArea: { active: number; rested: number }) =>
  game({ leader, hand: [YOU_NEED_ME], costArea }, { leader: PLAIN_BLUE });

describe("EB05-040 You Need Me, Don't You?!!♡", () => {
  it('[Main] may return 1 active DON!! to the DON!! deck: with a {Donquixote Pirates} Leader, draw 3 and trash 1', () => {
    const g = start(DONQ_LEADER, { active: 1, rested: 0 });
    play(g, YOU_NEED_ME);
    accept(g);
    expectDecision(g, 'choose', 'p1');
    expect(don(g, 'p1')).toMatchObject({ active: 0, deck: 10 });
    expect(hand(g, 'p1')).toHaveLength(3);
    pick(g, [g.zone('p1', 'hand')[0]!.instance]);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(trash(g, 'p1')).toHaveLength(2); // the Event and the discard
  });

  it('only an ACTIVE DON!! can be returned: with only rested DON!! the cost cannot be paid', () => {
    const g = start(DONQ_LEADER, { active: 0, rested: 2 });
    play(g, YOU_NEED_ME);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(hand(g, 'p1')).toHaveLength(0);
    expect(don(g, 'p1')).toMatchObject({ rested: 2 });
  });

  it('declining the cost: nothing is drawn and the DON!! stays', () => {
    const g = start(DONQ_LEADER, { active: 1, rested: 0 });
    play(g, YOU_NEED_ME);
    decline(g);
    expect(hand(g, 'p1')).toHaveLength(0);
    expect(don(g, 'p1')).toMatchObject({ active: 1 });
  });

  it('without a {Donquixote Pirates} Leader the DON!! is returned but nothing is drawn', () => {
    const g = start(PLAIN_BLUE, { active: 1, rested: 0 });
    play(g, YOU_NEED_ME);
    accept(g);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p1')).toMatchObject({ active: 0, deck: 10 });
    expect(hand(g, 'p1')).toHaveLength(0);
  });

  it('[Counter] your Leader gains +2000 power during this battle', () => {
    const g = game(
      { leader: PLAIN_BLUE, hand: [YOU_NEED_ME] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    const base = g.power(g.leader('p1'))!;
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', YOU_NEED_ME), ability: 'counter' });
    expect(g.power(g.leader('p1'))).toBe(base + 2000);
    expectDecision(g, 'counter');
  });
});
