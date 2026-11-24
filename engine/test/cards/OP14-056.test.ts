/** OP14-056 Wadatsumi. */
import { describe, expect, it } from 'vitest';
import { BLUE, pick, V } from './helpers.ts';
import {
  canAttack,
  costTrash,
  effectTrash,
  FM_LEADER,
  mine,
  plantAndRun,
} from './helpers-op14g2.ts';

const ID = 'OP14-056';

const start = () => mine(FM_LEADER, { hand: [BLUE, BLUE], characters: [ID, V.c1] });
const me = (g: ReturnType<typeof start>) => g.find('p1', 'characters', ID);

describe('OP14-056 Wadatsumi', () => {
  it('cannot attack', () => {
    const g = start();
    expect(canAttack(g, me(g), g.leader('p2'))).toBe(false);
    // Another Character of ours can (the restriction is on this card only).
    expect(canAttack(g, g.find('p1', 'characters', V.c1), g.leader('p2'))).toBe(true);
  });

  it('when a card is trashed from your hand by an effect its effect is negated this turn: it can attack', () => {
    const g = start();
    effectTrash(g, V.c1);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(canAttack(g, me(g), g.leader('p2'))).toBe(true);
  });

  it('the negation ends with the turn: it cannot attack next turn', () => {
    const g = start();
    effectTrash(g, V.c1);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(canAttack(g, me(g), g.leader('p2'))).toBe(false);
  });

  it('a cost-trash negates it too (a cost is part of the effect, M6b-Q31 decided)', () => {
    const g = start();
    costTrash(g, V.c1);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(canAttack(g, me(g), g.leader('p2'))).toBe(true);
  });

  it('a card trashed from the opponent’s hand does not negate it', () => {
    const g = mine(FM_LEADER, { characters: [ID, V.c1] }, { hand: [BLUE] });
    plantAndRun(g, V.c1, 'p1', [
      {
        do: {
          trashFromHand: {
            from: 'hand',
            owner: 'opponent',
            chooser: 'opponent',
            pick: { exactly: 1 },
          },
        },
      },
    ]);
    pick(g, [g.find('p2', 'hand', BLUE)]);
    expect(canAttack(g, me(g), g.leader('p2'))).toBe(false);
  });
});
