/** OP16-058 The Prisoners Are Rioting!!. */
import { describe, expect, it } from 'vitest';
import {
  endCounter,
  expectDecision,
  game,
  passBlock,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { BUGGY_LEADER, defend, PRISONER } from './helpers-op16g3.ts';

const ID = 'OP16-058';
const start = (active: number, rested = 0) =>
  game(
    {
      leader: PLAIN_BLUE,
      hand: [ID],
      characters: [PRISONER, V.c4],
      costArea: { active, rested },
    },
    { leader: PLAIN_BLUE },
  );

describe('OP16-058 The Prisoners Are Rioting!!', () => {
  it('[Main] with 10 DON!! on your field, [Prisoner of Impel Down] base power becomes 7000 this turn', () => {
    const g = start(10);
    play(g, ID);
    expect(g.power(g.find('p1', 'characters', PRISONER))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', V.c4))).toBe(6000); // other cards unchanged
  });

  it('rested DON!! count: 9 active + 1 rested still makes 10 on the field', () => {
    const g = start(9, 1);
    play(g, ID);
    expect(g.power(g.find('p1', 'characters', PRISONER))).toBe(7000);
  });

  it('with 9 DON!! the Event is played but the power stays 6000', () => {
    const g = start(9);
    play(g, ID);
    expect(g.power(g.find('p1', 'characters', PRISONER))).toBe(6000);
    expectDecision(g, 'main', 'p1');
  });

  it('[Counter] up to 1 of your [Buggy] gains +4000 power during this battle', () => {
    const g = defend({ leader: BUGGY_LEADER, hand: [ID], costArea: { active: 1, rested: 0 } });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', ID), ability: 'counter' });
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    endCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('[Counter] cannot target a card that is not a [Buggy]', () => {
    const g = defend({ leader: PLAIN_BLUE, hand: [ID], costArea: { active: 1, rested: 0 } });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', ID), ability: 'counter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
