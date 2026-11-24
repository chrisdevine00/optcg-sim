/** OP16-071 Benevolent King of the Waves. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  decline,
  don,
  endCounter,
  game,
  hand,
  passBlock,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { NOT_NAVY } from './helpers-op16g3.ts';

const ID = 'OP16-071';

describe('OP16-071 Benevolent King of the Waves', () => {
  const start = () =>
    game(
      { leader: NOT_NAVY, hand: [ID, PURPLE], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );

  it('[On Play] trash 1 card from hand: adds 1 DON!! rested', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    addMost(g);
    expect(trash(g, 'p1')).toEqual([PURPLE]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 4, deck: 6 });
  });

  it('declining the cost keeps the card and adds nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([PURPLE]);
    expect(don(g, 'p1')).toMatchObject({ rested: 3, deck: 7 });
  });

  it('with an empty hand the cost cannot be paid and nothing is added', () => {
    const g = game(
      { leader: NOT_NAVY, hand: [ID], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    if (g.legal().some((a) => a.type === 'optional' && a.accept)) decline(g);
    expect(don(g, 'p1')).toMatchObject({ rested: 3, deck: 7 });
  });

  it('[On K.O.] adds 1 DON!! rested, with no cost', () => {
    const g = game(
      { leader: NOT_NAVY, characters: [{ card: ID, rested: true }] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', ID),
    });
    passBlock(g);
    endCounter(g);
    addMost(g);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 1, deck: 9 });
  });
});
