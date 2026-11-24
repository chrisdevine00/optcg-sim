/** OP15-058 Enel (Leader). QA-OP15 OP15-058 (RL-40): a 6-card DON!! deck, "second turn or later". */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, game, option, pick, V } from './helpers.ts';
import { ENEL, PLAIN_BLUE } from './helpers-rgl-penel.ts';

const activate = (g: ReturnType<typeof game>) =>
  g.act({ type: 'activate', card: g.leader('p1'), ability: 'enel-surge' });

describe('OP15-058 Enel', () => {
  const start = (turn: number, donDeck = 5, active = 1) =>
    game(
      {
        leader: ENEL,
        characters: [V.c3, V.c1],
        costArea: { active, rested: 0 },
        donDeck,
      },
      { leader: PLAIN_BLUE },
      { turn },
    );

  it('[Activate: Main]: adds 1 active DON!!, then 4 rested, then gives up to 4 rested DON!! to 1 Character', () => {
    const g = start(3);
    activate(g);
    addMost(g, 2);
    expect(don(g, 'p1')).toMatchObject({ deck: 0, active: 2, rested: 4, given: 0 });
    const c3 = g.find('p1', 'characters', V.c3);
    option(g, '4');
    pick(g, [c3]);
    expect(don(g, 'p1')).toMatchObject({ deck: 0, active: 2, rested: 0, given: 4 });
    expect(g.card(c3).don).toBe(4);
    expectDecision(g, 'main', 'p1');
  });

  it('"up to 4": the player may give 2 of the 4, or none (CR 4-8-1, ST01-011 Q&A)', () => {
    const g = start(3);
    activate(g);
    addMost(g, 2);
    const c3 = g.find('p1', 'characters', V.c3);
    option(g, '2');
    pick(g, [c3]);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 2, given: 2 });
    const h = start(3);
    activate(h);
    addMost(h, 2);
    option(h, '0');
    expect(don(h, 'p1')).toMatchObject({ active: 2, rested: 4, given: 0 });
    expectDecision(h, 'main', 'p1');
  });

  it('is Once Per Turn', () => {
    const g = start(3);
    activate(g);
    addMost(g, 2);
    option(g, '4');
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(
      g.isLegal({ type: 'activate', card: g.leader('p1'), ability: 'enel-surge', player: 'p1' }),
    ).toBe(false);
  });

  it('on your first turn it does nothing (the condition fails), but the activation is used', () => {
    const g = start(1);
    activate(g);
    expect(don(g, 'p1')).toMatchObject({ deck: 5, active: 1, rested: 0, given: 0 });
    expectDecision(g, 'main', 'p1');
    expect(
      g.isLegal({ type: 'activate', card: g.leader('p1'), ability: 'enel-surge', player: 'p1' }),
    ).toBe(false);
  });

  it('with fewer DON!! left in the DON!! deck it adds what it can (RL-40: the deck has 6 cards)', () => {
    const g = start(3, 2, 4);
    activate(g);
    addMost(g, 2);
    // 1 active, then the 1 remaining one rested.
    expect(don(g, 'p1')).toMatchObject({ deck: 0, active: 5, rested: 1 });
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 0, given: 1 });
  });

  it('with no Character to give to it still adds the DON!!', () => {
    const g = game(
      { leader: ENEL, costArea: { active: 1, rested: 0 }, donDeck: 5 },
      { leader: PLAIN_BLUE },
    );
    activate(g);
    addMost(g, 2);
    expect(don(g, 'p1')).toMatchObject({ deck: 0, active: 2, rested: 4 });
    expectDecision(g, 'main', 'p1');
  });

  it('may give fewer targets than DON!! only to one Character ("1 of your Characters")', () => {
    const g = start(3);
    activate(g);
    addMost(g, 2);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.max).toBe(1);
  });
});
