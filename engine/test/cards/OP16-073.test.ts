/** OP16-073 Borsalino. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  decline,
  don,
  endCounter,
  expectDecision,
  game,
  passBlock,
  payDon,
  play,
  takeDamage,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { NOT_NAVY } from './helpers-op16g3.ts';

const ID = 'OP16-073';

describe('OP16-073 Borsalino', () => {
  it('[On Play] adds 1 active DON!! and 1 additional rested DON!!', () => {
    const g = game(
      { leader: NOT_NAVY, hand: [ID], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    addMost(g, 2);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 8, deck: 1 });
  });

  const endTurn = (active: number) => {
    const g = game(
      {
        leader: NOT_NAVY,
        characters: [{ card: ID, rested: true }],
        costArea: { active, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c7] },
    );
    g.act({ type: 'endTurn' });
    return g;
  };

  it('[End of Your Turn] DON!! -2: sets this Character active and it gains [Blocker]', () => {
    const g = endTurn(3);
    accept(g);
    payDon(g);
    const b = g.find('p1', 'characters', ID);
    expect(g.card(b).rested).toBe(false);
    expect(g.card(b).keywords).toContain('Blocker');
    expect(don(g, 'p1').deck).toBe(9);
  });

  it('the [Blocker] lasts through the opponent turn: it can block their attack', () => {
    const g = endTurn(3);
    accept(g);
    payDon(g);
    // The opponent's turn: their Character attacks the Leader and the Blocker is offered.
    expectDecision(g, 'main', 'p2');
    const b = g.find('p1', 'characters', ID);
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
    expect(g.legal().some((a) => a.type === 'block' && a.blocker === b)).toBe(true);
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    // It ends with the opponent's End Phase.
    g.act({ type: 'endTurn' });
    expect(g.card(b).keywords).not.toContain('Blocker');
  });

  it('declining the DON!! -2 keeps it rested and without [Blocker]', () => {
    const g = endTurn(3);
    decline(g);
    const b = g.find('p1', 'characters', ID);
    expect(g.card(b).rested).toBe(true);
    expect(g.card(b).keywords).not.toContain('Blocker');
    expect(don(g, 'p1').deck).toBe(7);
  });
});
