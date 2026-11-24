/** OP16-070 Donquixote Rosinante. */
import { describe, expect, it } from 'vitest';
import { accept, addMost, decline, don, game, payDon, play, PLAIN_BLUE } from './helpers.ts';
import { NAVY_LEADER, NOT_NAVY } from './helpers-op16g3.ts';

const ID = 'OP16-070';
const start = (leader: string, active = 4) =>
  game({ leader, hand: [ID], costArea: { active, rested: 0 } }, { leader: PLAIN_BLUE });

describe('OP16-070 Rosinante', () => {
  it('has [Blocker]', () => {
    const g = start(NAVY_LEADER);
    play(g, ID);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] rest 2 DON!!: with a {Navy} Leader adds 1 DON!! rested', () => {
    const g = start(NAVY_LEADER);
    play(g, ID);
    accept(g);
    payDon(g);
    addMost(g);
    // 4 active: 2 paid for the card, 2 rested for the cost, 1 added rested.
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 5, deck: 5 });
  });

  it('with another Leader type the cost is paid and nothing is added', () => {
    const g = start(NOT_NAVY);
    play(g, ID);
    accept(g);
    payDon(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 4, deck: 6 });
  });

  it('declining the cost adds nothing and keeps the DON!! active', () => {
    const g = start(NAVY_LEADER);
    play(g, ID);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 2, deck: 6 });
  });

  it('with only 1 active DON!! left after the card is played, the cost cannot be paid', () => {
    const g = start(NAVY_LEADER, 3);
    play(g, ID);
    if (g.legal().some((a) => a.type === 'optional' && a.accept)) decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 2, deck: 7 });
  });
});
