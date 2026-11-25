/** OP09-014 Limejuice. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import {
  attackLeader,
  BLK,
  boost,
  canBlockWith,
  canPick,
  finishBattle,
  mk,
} from './helpers-a09g1.ts';

const ID = 'OP09-014';
/** p1 plays Limejuice, then attacks p2's Leader with V.c4; returns the game at p2's block decision. */
const playThenAttack = (p2chars: string[], choose: (g: ReturnType<typeof mk>) => void) => {
  const g = mk({ hand: [ID], characters: [V.c4] }, { characters: p2chars });
  play(g, ID);
  choose(g);
  attackLeader(g, g.find('p1', 'characters', V.c4));
  expectDecision(g, 'block', 'p2');
  return g;
};

describe('OP09-014 Limejuice', () => {
  it('[On Play]: a [Blocker] Character with 4000 power or less cannot activate [Blocker] this turn', () => {
    const g = playThenAttack([BLK.c2], (h) => {
      expectDecision(h, 'choose', 'p1');
      pick(h, [h.find('p2', 'characters', BLK.c2)]);
    });
    expect(canBlockWith(g, g.find('p2', 'characters', BLK.c2))).toBe(false);
  });

  it('only a [Blocker] Character with 4000 power or less is a candidate (not a bigger Blocker, not a non-Blocker)', () => {
    const g = mk({ hand: [ID] }, { characters: [BLK.c2, BLK.c6, V.c1] });
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', BLK.c2))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', BLK.c6))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
  });

  it('boundary on current power: a Blocker at exactly 4000 qualifies, at 4001 it does not', () => {
    const at4000 = mk({ hand: [ID] }, { characters: [BLK.c2] });
    boost(at4000, at4000.find('p2', 'characters', BLK.c2), 2000);
    play(at4000, ID);
    expect(canPick(at4000, at4000.find('p2', 'characters', BLK.c2))).toBe(true);

    const at4001 = mk({ hand: [ID] }, { characters: [BLK.c2] });
    boost(at4001, at4001.find('p2', 'characters', BLK.c2), 2001);
    play(at4001, ID);
    expectDecision(at4001, 'main', 'p1');
  });

  it('"up to 1": the other Blocker can still block; and choosing nobody locks nothing', () => {
    const g = playThenAttack([BLK.c2, BLK.c2], (h) =>
      pick(h, [h.find('p2', 'characters', BLK.c2, 0)]),
    );
    expect(canBlockWith(g, g.find('p2', 'characters', BLK.c2, 0))).toBe(false);
    expect(canBlockWith(g, g.find('p2', 'characters', BLK.c2, 1))).toBe(true);

    const none1 = playThenAttack([BLK.c2], (h) => none(h));
    expect(canBlockWith(none1, none1.find('p2', 'characters', BLK.c2))).toBe(true);
  });

  it('lasts this turn only: on the next turn the Blocker can block again', () => {
    const g = playThenAttack([BLK.c2], (h) => pick(h, [h.find('p2', 'characters', BLK.c2)]));
    finishBattle(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    attackLeader(g, g.find('p1', 'characters', V.c4));
    expect(canBlockWith(g, g.find('p2', 'characters', BLK.c2))).toBe(true);
  });
});
