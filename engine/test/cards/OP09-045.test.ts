/** OP09-045 Cabaji. */
import { describe, expect, it } from 'vitest';
import { passBlock, V } from './helpers.ts';
import { BUGGY, koBy, MOHJI, OTHER_LEADER, theirs } from './helpers-lfa.ts';

const ID = 'OP09-045';
/** [Mohji & Cabaji] (OP12-055) and [Buggy] the cost 6 Character (OP12-049): names near the two. */
const MOHJI_CABAJI = 'OP12-055';
const BUGGY6 = 'OP12-049';

/** p2's turn: p1 has a rested Cabaji and `others`; p2 has a 9000 attacker (and a spare). */
const board = (others: string[] = [], p2: string[] = []) =>
  theirs(
    OTHER_LEADER,
    { characters: [{ card: ID, rested: true }, ...others] },
    {
      characters: [V.c7, ...p2],
    },
  );
const chars = (g: ReturnType<typeof board>) => g.zone('p1', 'characters').map((c) => c.card);
/** p2's 9000 attacker attacks `target` (rested) and nobody blocks or counters. */
const attack = (g: ReturnType<typeof board>, target: string) => {
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', V.c7),
    target: g.find('p1', 'characters', target),
  });
  passBlock(g);
  g.act({ type: 'endCounter' });
};

describe('OP09-045 Cabaji', () => {
  it("with a [Mohji] Character he cannot be K.O.'d in battle", () => {
    const g = board([MOHJI]);
    attack(g, ID);
    expect(chars(g)).toContain(ID);
  });

  it('with a [Buggy] Character he is protected too (either name is enough)', () => {
    for (const buggy of [BUGGY, BUGGY6]) {
      const g = board([buggy]);
      attack(g, ID);
      expect(chars(g), buggy).toContain(ID);
    }
  });

  it("must not apply without one: he is K.O.'d in battle", () => {
    const none = board();
    attack(none, ID);
    expect(chars(none)).not.toContain(ID);
    const others = board([V.c1, V.c3]);
    attack(others, ID);
    expect(chars(others)).not.toContain(ID);
  });

  it("only exact names count: [Mohji & Cabaji] does not, nor a [Mohji] on the opponent's field", () => {
    const g = board([MOHJI_CABAJI]);
    attack(g, ID);
    expect(chars(g)).not.toContain(ID);
    const h = board([], [MOHJI]);
    attack(h, ID);
    expect(chars(h)).not.toContain(ID);
  });

  it('it covers battle only: an effect still K.O.s him even with a [Mohji]', () => {
    const g = board([MOHJI]);
    koBy(g, 'p1', ID, 'p2');
    expect(chars(g)).not.toContain(ID);
    const own = board([MOHJI]);
    koBy(own, 'p1', ID, 'p1');
    expect(chars(own)).not.toContain(ID);
  });

  it("the protection is live: once the [Mohji] is gone he is K.O.'d in battle again", () => {
    const g = board([MOHJI]);
    koBy(g, 'p1', MOHJI, 'p2');
    attack(g, ID);
    expect(chars(g)).not.toContain(ID);
  });

  it("the protected Character is not K.O.'d but the battle still happens (the attacker is not removed)", () => {
    const g = board([MOHJI]);
    attack(g, ID);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c7]);
  });
});
