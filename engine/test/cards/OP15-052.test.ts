/** OP15-052 Leo. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  endCounter,
  game,
  passBlock,
  pick,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { DRESSROSA_LEADER, idsOf, plant } from './helpers-op15g2.ts';

const ID = 'OP15-052';

describe('OP15-052 Leo', () => {
  /** p2's turn: p2's planted Leader effect K.O.s p1's Character with this base power. */
  const hit = (victim: string, basePower: number, extra: string[] = []) => {
    const g = game(
      { leader: DRESSROSA_LEADER, characters: [ID, victim, ...extra] },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    plant(g, 'p2', {
      ko: { from: 'characters', owner: 'opponent', filter: { basePower: { eq: basePower } } },
    });
    return g;
  };

  it("a Character with 7000 base power would be K.O.'d by an effect: you may place 1 of your Characters at the bottom of the deck instead", () => {
    const g = hit(V.c5, 7000);
    accept(g);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([V.c5]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([]);
    expect(g.zone('p1', 'deck').at(-1)?.card).toBe(ID);
  });

  it('the Character that would be K.O.d may itself be the one placed at the bottom (it is not K.O.d)', () => {
    const g = hit(V.c5, 7000);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c5)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([]);
    expect(g.zone('p1', 'deck').at(-1)?.card).toBe(V.c5);
  });

  it('declining lets the effect K.O. it as written', () => {
    const g = hit(V.c5, 7000);
    decline(g);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c5]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('8000 base power is above the limit: nothing is offered', () => {
    const g = hit(V.c6, 8000);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c6]);
  });

  it('Leo itself (2000 base) is protected too, by placing another Character', () => {
    const g = game(
      { leader: DRESSROSA_LEADER, characters: [ID, V.c5] },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    plant(g, 'p2', {
      ko: { from: 'characters', owner: 'opponent', filter: { basePower: { eq: 2000 } } },
    });
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c5)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it("a battle K.O. is not an opponent's effect: not replaced", () => {
    const g = game(
      { leader: DRESSROSA_LEADER, characters: [ID, { card: V.c5, rested: true }] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', V.c5),
    });
    passBlock(g);
    endCounter(g);
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c5]);
  });

  it('with no other cost payable it still works from a lone Leo being the only Character', () => {
    const g = game(
      { leader: DRESSROSA_LEADER, characters: [ID] },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    plant(g, 'p2', {
      ko: { from: 'characters', owner: 'opponent', filter: { basePower: { eq: 2000 } } },
    });
    accept(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(g.zone('p1', 'deck').at(-1)?.card).toBe(ID);
  });
});
