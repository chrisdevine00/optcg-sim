/** OP18-036 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, expectDecision, game, hand, trash } from './helpers.ts';
import { PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers-op18-g2.ts';

const ID = 'OP18-036';
const endTurn = (leaderRested: boolean, deck?: string[]) => {
  const g = game(
    {
      leader: { card: PLAIN_PURPLE, rested: leaderRested },
      characters: [ID],
      ...(deck ? { deck } : {}),
    },
    { leader: PLAIN_BLUE },
  );
  g.act({ type: 'endTurn' });
  return g;
};

describe('OP18-036 Monkey.D.Luffy', () => {
  it('[End of Your Turn] trash it: draw 1 and set your Leader as active', () => {
    const g = endTurn(true);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('declining keeps Luffy and draws nothing', () => {
    const g = endTurn(true);
    decline(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('with an active Leader it still draws (setting an active Leader changes nothing)', () => {
    const g = endTurn(false);
    accept(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('only the Leader is set: a rested Character stays rested', () => {
    const g = game(
      {
        leader: { card: PLAIN_PURPLE, rested: true },
        characters: [ID, { card: V.c3, rested: true }],
      },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'endTurn' });
    accept(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', V.c3)).rested).toBe(true);
  });
});
