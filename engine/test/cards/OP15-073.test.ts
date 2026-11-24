/** OP15-073 Yama. */
import { describe, expect, it } from 'vitest';
import { dec, decline, none, pick, play, V } from './helpers.ts';
import { HEAVENLY, idsOf, KOTORI, mine, OTHER_LEADER, SHURA } from './helpers-op15g2.ts';

const ID = 'OP15-073';
/** OP05-106 Shura: {Vassals} but cost 2. */
const SHURA2 = 'OP05-106';

describe('OP15-073 Yama', () => {
  const start = (handCards: string[]) => mine(OTHER_LEADER, { hand: [ID, ...handCards] });
  const candidates = (g: ReturnType<typeof mine>) =>
    g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));

  it('has printed [Blocker]', () => {
    const g = mine(OTHER_LEADER, { characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] play a [Heavenly Warriors] (cost 1) from your hand', () => {
    const g = start([HEAVENLY, V.c1]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', HEAVENLY)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID, HEAVENLY]);
  });

  it('or a {Vassals} Character with a cost of 1', () => {
    const g = start([SHURA, V.c1]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', SHURA)]);
    decline(g); // the played Shura offers its own [On Play] DON!! -1
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID, SHURA]);
  });

  it('one card in total, from either description (reading, M6b-Q6)', () => {
    const g = start([HEAVENLY, SHURA]);
    play(g, ID);
    expect(candidates(g)).toHaveLength(2);
    pick(g, [g.find('p1', 'hand', SHURA)]);
    // Nothing more is asked of Yama's effect (only Shura's own [On Play] DON!! -1 offer): the other card stays in hand.
    decline(g);
    expect(dec(g)?.kind).toBe('main');
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID, SHURA]);
    expect(idsOf(g, 'p1', 'hand')).toEqual([HEAVENLY]);
  });

  it('not a {Vassals} Character with cost 2, nor another cost 1 Sky Island Character, nor a cost 1 non-Vassals', () => {
    const g = start([SHURA2, KOTORI, V.c1]);
    play(g, ID);
    expect(candidates(g)).toEqual([]);
    if (dec(g)?.kind === 'choose') none(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('"up to 1": may play nothing', () => {
    const g = start([HEAVENLY]);
    play(g, ID);
    none(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(idsOf(g, 'p1', 'hand')).toEqual([HEAVENLY]);
  });
});
