/** OP18-085 Cerberus. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, option, pick } from './helpers.ts';
import { activate, candidates } from './helpers-a10g1.ts';
import { mine, SHAMROCK } from './helpers-op18-g3.ts';

const ID = 'OP18-085';
const SK = 'OP18-083'; // a {Holy Knights of God} Character that is not [Saint Shamrock]

const start = (chars: string[] = [ID, SHAMROCK, SK]) => mine({ characters: chars }, {});
const act = (g: ReturnType<typeof start>) =>
  activate(g, g.find('p1', 'characters', ID), 'activate');

describe('OP18-085 Cerberus', () => {
  it.each([
    ['Rush', 0],
    ['Banish', 1],
    ['Unblockable', 2],
  ])('returns itself to the hand: a [Saint Shamrock] gains [%s] during this turn', (keyword, i) => {
    const g = start();
    act(g);
    expect(hand(g, 'p1')).toEqual([ID]);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options).toHaveLength(3);
    option(g, d.options![i]!.id);
    pick(g, [g.find('p1', 'characters', SHAMROCK)]);
    expect(g.card(g.find('p1', 'characters', SHAMROCK)).keywords).toContain(keyword);
    expect(g.card(g.find('p1', 'characters', SK)).keywords).not.toContain(keyword);
  });

  it('only a [Saint Shamrock] is a candidate; "up to 1" allows none', () => {
    const g = start();
    act(g);
    option(g, expectDecision(g, 'choose').options![0]!.id);
    expect(candidates(g)).toEqual([g.find('p1', 'characters', SHAMROCK)]);
    none(g);
    expect(g.card(g.find('p1', 'characters', SHAMROCK)).keywords).not.toContain('Rush');
  });

  it('the grant lasts this turn only', () => {
    const g = start();
    act(g);
    option(g, expectDecision(g, 'choose').options![0]!.id);
    pick(g, [g.find('p1', 'characters', SHAMROCK)]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', SHAMROCK)).keywords).not.toContain('Rush');
  });

  it('with no [Saint Shamrock] the cost is still paid and nothing is asked', () => {
    const g = start([ID, SK]);
    act(g);
    expect(hand(g, 'p1')).toEqual([ID]);
    expect(dec(g)?.kind).toBe('main');
  });
});
