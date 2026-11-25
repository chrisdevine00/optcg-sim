/** EB04-023 Chaka & Pell. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, game, hand, PLAIN_PURPLE } from './helpers.ts';
import { ALABASTA_LEADER, atMain, canAccept } from './helpers-w7c1.ts';

const ID = 'EB04-023';

describe('EB04-023 Chaka & Pell', () => {
  const mk = (p1: object = {}) =>
    game(
      {
        leader: ALABASTA_LEADER,
        hand: [ID],
        costArea: { active: 8, rested: 0 },
        ...p1,
      },
      { leader: PLAIN_PURPLE },
    );
  const play = (g: ReturnType<typeof mk>) =>
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });

  it('has [Double Attack]', () => {
    const g = mk();
    play(g);
    accept(g);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Double Attack');
  });

  it('[On Play]: you may give your active Leader -5000 power during this turn: draw 2 cards', () => {
    const g = mk();
    const before = hand(g, 'p1').length;
    play(g);
    expect(dec(g)?.kind).toBe('optional');
    accept(g);
    expect(g.power(g.leader('p1'))).toBe(0);
    expect(hand(g, 'p1')).toHaveLength(before - 1 + 2);
    expect(atMain(g)).toBe(true);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('declining draws nothing and keeps the Leader power', () => {
    const g = mk();
    const before = hand(g, 'p1').length;
    play(g);
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g, 'p1')).toHaveLength(before - 1);
  });

  it('must not be offered with a rested Leader', () => {
    const g = mk({ leader: { card: ALABASTA_LEADER, rested: true } });
    play(g);
    expect(canAccept(g)).toBe(false);
    expect(atMain(g)).toBe(true);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('any active Leader qualifies: no type is asked', () => {
    const g = mk({ leader: PLAIN_PURPLE });
    play(g);
    accept(g);
    expect(g.power(g.leader('p1'))).toBe(0);
  });
});
