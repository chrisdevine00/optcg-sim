/** OP09-084 Catarina Devon. */
import { describe, expect, it } from 'vitest';
import {
  activate,
  BB_LEADER,
  canActivate,
  dec,
  expectDecision,
  mk,
  option,
  OTHER_LEADER,
} from './helpers-a09g3.ts';

const ID = 'OP09-084';
const start = (p1: object = {}) => mk({ leader: BB_LEADER, characters: [ID], ...p1 });

const keywords = (g: ReturnType<typeof start>) => g.card(g.find('p1', 'characters', ID)).keywords;

describe('OP09-084 Catarina Devon', () => {
  it.each([
    ['Double Attack', 0],
    ['Banish', 1],
    ['Blocker', 2],
  ])('with a {Blackbeard Pirates} Leader, gains [%s] when chosen', (kw, idx) => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options).toHaveLength(3);
    option(g, d.options![idx]!.id);
    expect(keywords(g)).toContain(kw);
    for (const other of ['Double Attack', 'Banish', 'Blocker'].filter((k) => k !== kw))
      expect(keywords(g)).not.toContain(other);
  });

  it('the keyword lasts through the end of the opponent next turn, and no longer', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    option(g, dec(g)!.options![2]!.id);
    g.act({ type: 'endTurn' }); // p2's turn
    expectDecision(g, 'main', 'p2');
    expect(keywords(g)).toContain('Blocker');
    g.act({ type: 'endTurn' }); // back to p1
    expectDecision(g, 'main', 'p1');
    expect(keywords(g)).not.toContain('Blocker');
  });

  it('[Once Per Turn]: not offered a second time', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    option(g, dec(g)!.options![0]!.id);
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('must not grant a keyword without a {Blackbeard Pirates} Leader (effect condition: the activation is spent)', () => {
    const g = start({ leader: OTHER_LEADER });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'main', 'p1');
    expect(keywords(g)).toEqual([]);
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });
});
