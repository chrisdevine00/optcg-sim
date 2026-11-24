/** OP14-045 Kuroobi. */
import { describe, expect, it } from 'vitest';
import { BLUE, hand, pick, play, V } from './helpers.ts';
import {
  canAttack,
  costTrash,
  effectTrash,
  FM_LEADER,
  mine,
  plantAndRun,
} from './helpers-op14g2.ts';
import { koOf } from './helpers-op15g3.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';

const ID = 'OP14-045';

/** Kuroobi is played this turn (so it has no Rush unless something grants it). */
const start = () => {
  const g = mine(
    FM_LEADER,
    { hand: [ID, BLUE, BLUE], characters: [V.c1], costArea: { active: 8, rested: 0 } },
    { hand: [BLUE, BLUE] },
  );
  play(g, ID);
  return g;
};
const kuroobi = (g: ReturnType<typeof start>) => g.find('p1', 'characters', ID);

describe('OP14-045 Kuroobi', () => {
  it('without a trash it has no Rush on the turn it is played', () => {
    const g = start();
    expect(canAttack(g, kuroobi(g), g.leader('p2'))).toBe(false);
  });

  it('a card trashed from your hand by an effect gives it [Rush] this turn', () => {
    const g = start();
    effectTrash(g, V.c1);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(canAttack(g, kuroobi(g), g.leader('p2'))).toBe(true);
  });

  it('a card trashed by the opponent’s effect counts too', () => {
    const g = start();
    g.act({ type: 'endTurn' });
    // On p2's turn, p2 trashes from p1's hand: Rush is granted "during this turn" (p2's turn).
    plantOpponentEffect(g, {
      trashFromHand: { from: 'hand', owner: 'opponent', chooser: 'opponent', pick: { exactly: 1 } },
    });
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('must not fire for a card trashed from the OPPONENT’s hand', () => {
    const g = start();
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
    expect(canAttack(g, kuroobi(g), g.leader('p2'))).toBe(false);
  });

  it('a card trashed as a cost counts: a cost is part of the effect (RD 112, CR 8-1-1, M6b-Q31 decided)', () => {
    const g = start();
    costTrash(g, V.c1);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(canAttack(g, kuroobi(g), g.leader('p2'))).toBe(true);
  });

  it('[On K.O.]: draws 1 card', () => {
    const g = mine(FM_LEADER, { characters: [ID] }, {}, { turn: 4, activePlayer: 'p2' });
    koOf(g, ID);
    expect(hand(g, 'p1')).toHaveLength(1);
  });
});
