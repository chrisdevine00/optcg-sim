/** OP18-078 Mini-Merry. */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { don, game, pick, PLAIN_BLUE } from './helpers.ts';
import { stageOnPlay } from './helpers-op18-stage.ts';
import { PLAIN_PURPLE, SHC2, SHC3, SHC4, SHC5 } from './helpers-op18.ts';

const ID = 'OP18-078';
const board = (rested: number, chars = [SHC2, SHC3, SHC4, SHC5]) =>
  game(
    { leader: PLAIN_PURPLE, stage: ID, characters: chars, costArea: { active: 0, rested } },
    { leader: PLAIN_BLUE },
  );
const given = (g: ReturnType<typeof board>, id: string) => queries.card(g.state, id).don ?? 0;

describe('OP18-078 Mini-Merry', () => {
  it('[On Play] draws 1, then adds up to 1 rested DON!!', () => stageOnPlay(ID));

  it('rest it: give up to 4 of your Leader or Characters 1 rested DON!! each', () => {
    const g = board(5);
    g.act({ type: 'activate', card: g.find('p1', 'stage', ID), ability: 'give-don' });
    const four = [g.leader('p1'), ...[SHC2, SHC3, SHC4].map((c) => g.find('p1', 'characters', c))];
    pick(g, four);
    for (const id of four) expect(given(g, id)).toBe(1);
    expect(given(g, g.find('p1', 'characters', SHC5))).toBe(0);
    expect(don(g, 'p1').rested).toBe(1);
  });

  it('with fewer rested DON!! than cards, only that many get one', () => {
    const g = board(2);
    g.act({ type: 'activate', card: g.find('p1', 'stage', ID), ability: 'give-don' });
    const two = [g.leader('p1'), g.find('p1', 'characters', SHC2)];
    pick(g, two);
    expect(two.map((id) => given(g, id))).toEqual([1, 1]);
    expect(don(g, 'p1').rested).toBe(0);
  });
});
