/** OP10-104 Caribou. */
import { describe, expect, it } from 'vitest';
import { passBlock, V } from './helpers.ts';
import { koBy, OTHER_LEADER, SUPERNOVAS_LEADER, rep, theirs } from './helpers-lfa.ts';

const ID = 'OP10-104';
type G = ReturnType<typeof theirs>;
const chars = (g: G) => g.zone('p1', 'characters').map((c) => c.card);

/** p2's turn: p1's rested Caribou (with `don` DON!! given) under `leader`; p2 has `life` Life cards. */
const board = (leader: string, don: number, life: number) =>
  theirs(
    leader,
    { characters: [{ card: ID, rested: true, don }], costArea: { active: 2, rested: 0 } },
    { characters: [V.c7], life: rep(life, V.c1) },
  );
const attack = (g: G) => {
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', V.c7),
    target: g.find('p1', 'characters', ID),
  });
  passBlock(g);
  g.act({ type: 'endCounter' });
};

describe('OP10-104 Caribou', () => {
  it("[DON!! x1] with a {Supernovas} Leader and 3+ opponent Life he cannot be K.O.'d in battle", () => {
    const g = board(SUPERNOVAS_LEADER, 1, 3);
    attack(g);
    expect(chars(g)).toEqual([ID]);
  });

  it('boundary: 4 opponent Life is fine, 2 is not enough', () => {
    const four = board(SUPERNOVAS_LEADER, 1, 4);
    attack(four);
    expect(chars(four)).toEqual([ID]);
    const two = board(SUPERNOVAS_LEADER, 1, 2);
    attack(two);
    expect(chars(two)).toEqual([]);
  });

  it('must not apply without the DON!! given', () => {
    const g = board(SUPERNOVAS_LEADER, 0, 3);
    attack(g);
    expect(chars(g)).toEqual([]);
  });

  it('must not apply with a Leader that is not {Supernovas}', () => {
    const g = board(OTHER_LEADER, 1, 3);
    attack(g);
    expect(chars(g)).toEqual([]);
  });

  it('only a battle K.O. is stopped: an effect still K.O.s him', () => {
    const g = board(SUPERNOVAS_LEADER, 1, 3);
    koBy(g, 'p1', ID, 'p2');
    expect(chars(g)).toEqual([]);
  });
});
