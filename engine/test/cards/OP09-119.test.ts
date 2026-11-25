/** OP09-119 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  dec,
  decline,
  don,
  expectDecision,
  game,
  hand,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  play,
} from './helpers.ts';
import { countOptions, payReturn } from './helpers-w5c1.ts';

const ID = 'OP09-119';
const start = (active = 10, donDeck?: number) =>
  game(
    {
      leader: PLAIN_PURPLE,
      hand: [ID],
      costArea: { active, rested: 0 },
      ...(donDeck === undefined ? {} : { donDeck }),
    },
    { leader: PLAIN_BLUE },
  );
const canAttack = (g: ReturnType<typeof start>) =>
  g.isLegal({
    type: 'attack',
    attacker: g.find('p1', 'characters', ID),
    target: g.leader('p2'),
    player: 'p1',
  });

describe('OP09-119 Monkey.D.Luffy', () => {
  it('[On Play] returning DON!! draws 1 card and gives [Rush] this turn', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    payReturn(g, 1);
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Rush');
    expect(canAttack(g)).toBe(true);
    expect(don(g, 'p1').deck).toBe(1);
    expect(dec(g)?.kind).toBe('main');
  });

  it('[Rush] is for this turn only', () => {
    const g = start();
    play(g, ID);
    payReturn(g, 1);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Rush');
  });

  it('declining the cost draws nothing and gives no [Rush]', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toHaveLength(0);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Rush');
    expect(canAttack(g)).toBe(false);
    expect(don(g, 'p1').deck).toBe(0);
  });

  it('boundary: the count runs from 1 to every DON!! on the field (10); more DON!! returned changes nothing else', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(countOptions(g)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
    const all = start();
    play(all, ID);
    payReturn(all, 10);
    expect(don(all, 'p1')).toMatchObject({ active: 0, rested: 0, deck: 10 });
    expect(hand(all, 'p1')).toHaveLength(1);
    expect(all.card(all.find('p1', 'characters', ID)).keywords).toContain('Rush');
  });

  it('draws the top card of the deck, and only that one however many DON!! were returned', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID], deck: ['OP02-060'], costArea: { active: 10, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    payReturn(g, 2);
    expect(hand(g, 'p1')).toEqual(['OP02-060']);
  });
});
