/** OP18-074 Can You Please Sail on the Ship I Made?! */
import { describe, expect, it } from 'vitest';
import { don, game, hand, pick, PLAIN_BLUE, trash, V } from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { PLAIN_PURPLE, STAGE2, STAGE5, STAGE6 } from './helpers-op18.ts';

const ID = 'OP18-074';
const step = (stage: string | null) =>
  counterStep({
    leader: PLAIN_PURPLE,
    hand: [ID],
    ...(stage ? { stage } : {}),
    costArea: { active: 1, rested: 0 },
  });

describe('OP18-074 Can You Please Sail on the Ship I Made?!', () => {
  it('[Counter] with a Stage of cost 5 or more: +4000 to your Leader for the battle', () => {
    const g = step(STAGE5);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('a cost 6 Stage counts ("5 or more")', () => {
    const g = step(STAGE6);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('without such a Stage the Event resolves and does nothing', () => {
    const g = step(STAGE2);
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('[Trigger] DON!! −1: add up to 2 Stage cards from your trash to your hand', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        life: [ID],
        trash: [STAGE5, STAGE6, STAGE2],
        costArea: { active: 0, rested: 2 },
      },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: true });
    if (g.legal().some((a) => a.type === 'optional')) g.act({ type: 'optional', accept: true });
    // Pay with a rested DON!! if asked.
    while (
      g.legal().some((a) => a.type === 'pick' && typeof a.choice === 'object' && 'from' in a.choice)
    )
      g.act(g.legal().find((a) => a.type === 'pick')!);
    pick(g, [g.find('p1', 'trash', STAGE5), g.find('p1', 'trash', STAGE6)]);
    expect(hand(g, 'p1').sort()).toEqual([STAGE5, STAGE6].sort());
    expect(don(g, 'p1').deck).toBe(9);
  });
});
