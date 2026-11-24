/** OP13-092 Saint Mjosgard. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, none, pick, play, PLAIN_PURPLE } from './helpers.ts';
import { canPick, mine, MG1, names, rep } from './helpers-op13g4.ts';

const ID = 'OP13-092';
const OTHER_STAGE_1 = 'EB01-011';
const MG_STAGE_7 = 'OP13-099';

const run = (trash: string[], life = 3) =>
  mine({ leader: PLAIN_PURPLE, hand: [ID], trash, life: rep(life, BLUE) });

describe('OP13-092 Saint Mjosgard', () => {
  it('[On Play] with 3 Life: plays a "Mary Geoise" Stage with cost 1 from the trash', () => {
    const g = run([MG1]);
    play(g, ID);
    pick(g, [g.find('p1', 'trash', MG1)]);
    expect(names(g, 'p1', 'stage')).toEqual([MG1]);
    expect(names(g, 'p1', 'trash')).toEqual([]);
  });

  it('with 4 Life nothing is played (the condition is "3 or less")', () => {
    const g = run([MG1], 4);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(names(g, 'p1', 'stage')).toEqual([]);
  });

  it('with 0 Life it still plays', () => {
    const g = run([MG1], 0);
    play(g, ID);
    pick(g, [g.find('p1', 'trash', MG1)]);
    expect(names(g, 'p1', 'stage')).toEqual([MG1]);
  });

  it('only a {Mary Geoise} Stage with a cost of exactly 1 is offered', () => {
    const g = run([OTHER_STAGE_1, MG_STAGE_7, BLUE, MG1]);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'trash', MG1))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', OTHER_STAGE_1))).toBe(false);
    expect(canPick(g, g.find('p1', 'trash', MG_STAGE_7))).toBe(false);
    expect(canPick(g, g.find('p1', 'trash', BLUE))).toBe(false);
    none(g);
    expect(names(g, 'p1', 'stage')).toEqual([]);
  });

  it('with no legal Stage in the trash nothing happens', () => {
    const g = run([OTHER_STAGE_1]);
    play(g, ID);
    if (dec(g)?.kind === 'choose') none(g);
    expect(names(g, 'p1', 'stage')).toEqual([]);
  });
});
