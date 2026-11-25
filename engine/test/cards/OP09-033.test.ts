/** OP09-033 Nico Robin. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { expectDecision, passBlock, play, V } from './helpers.ts';
import { koBy, mine, ODYSSEY4, OTHER_LEADER, SHC1 } from './helpers-lfa.ts';

const ID = 'OP09-033';
const rested = (card: string) => ({ card, rested: true });
const chars = (g: ReturnType<typeof mine>) => g.zone('p1', 'characters').map((c) => c.card);
/** p1 plays Robin with these Characters in play. */
const start = (characters: PlayerSpec['characters']) =>
  mine(OTHER_LEADER, { hand: [ID], characters }, {}, 4);

describe('OP09-033 Nico Robin', () => {
  it("[On Play] with 2 or more rested Characters, your {ODYSSEY} and {Straw Hat Crew} Characters cannot be K.O.'d by effects", () => {
    const g = start([rested(V.c1), rested(V.c2), ODYSSEY4, SHC1]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    for (const c of [ODYSSEY4, SHC1, ID]) koBy(g, 'p1', c, 'p2');
    expect(chars(g).sort()).toEqual([V.c1, V.c2, ODYSSEY4, SHC1, ID].sort());
  });

  it('it stops a K.O. by your own effect as well, and Robin herself is covered', () => {
    const g = start([rested(V.c1), rested(V.c2), ODYSSEY4]);
    play(g, ID);
    koBy(g, 'p1', ODYSSEY4, 'p1');
    koBy(g, 'p1', ID, 'p2');
    expect(chars(g)).toContain(ODYSSEY4);
    expect(chars(g)).toContain(ID);
  });

  it('must not protect Characters of other types', () => {
    const g = start([rested(V.c1), rested(V.c2), ODYSSEY4, V.c3]);
    play(g, ID);
    koBy(g, 'p1', V.c3, 'p2');
    koBy(g, 'p1', V.c1, 'p2');
    expect(chars(g)).not.toContain(V.c3);
    expect(chars(g)).not.toContain(V.c1);
  });

  it('boundary: exactly 2 rested Characters is enough, 1 is not (the ability fires and nothing happens)', () => {
    const two = start([rested(V.c1), rested(ODYSSEY4)]);
    play(two, ID);
    koBy(two, 'p1', ODYSSEY4, 'p2');
    expect(chars(two)).toContain(ODYSSEY4);
    const one = start([rested(V.c1), ODYSSEY4]);
    play(one, ID);
    koBy(one, 'p1', ODYSSEY4, 'p2');
    expect(chars(one)).not.toContain(ODYSSEY4);
    // Active Characters do not count either.
    const none = start([V.c1, V.c2, ODYSSEY4]);
    play(none, ID);
    koBy(none, 'p1', ODYSSEY4, 'p2');
    expect(chars(none)).not.toContain(ODYSSEY4);
  });

  it('it is given to the Characters on the field now: one played later is not protected', () => {
    const g = mine(
      OTHER_LEADER,
      { hand: [ID, ODYSSEY4], characters: [rested(V.c1), rested(V.c2)] },
      {},
      8,
    );
    play(g, ID);
    play(g, ODYSSEY4);
    koBy(g, 'p1', ODYSSEY4, 'p2');
    expect(chars(g)).not.toContain(ODYSSEY4);
    expect(chars(g)).toContain(ID);
  });

  it("lasts until the end of your opponent's next turn, and stops a K.O. by effect, not in battle", () => {
    const g = mine(
      OTHER_LEADER,
      { hand: [ID], characters: [rested(V.c1), rested(V.c2), rested(ODYSSEY4)] },
      { characters: [V.c7] },
      4,
    );
    play(g, ID);
    g.act({ type: 'endTurn' });
    // p2's turn: still protected from effects.
    koBy(g, 'p1', ODYSSEY4, 'p2');
    expect(chars(g)).toContain(ODYSSEY4);
    // ... but a battle K.O. goes through.
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', ODYSSEY4),
    });
    passBlock(g);
    g.act({ type: 'endCounter' });
    expect(chars(g)).not.toContain(ODYSSEY4);
  });

  it("after the end of the opponent's next turn it is gone", () => {
    const g = mine(
      OTHER_LEADER,
      {
        hand: [ID],
        characters: [rested(V.c1), rested(V.c2), rested(ODYSSEY4)],
      },
      {},
      4,
    );
    play(g, ID);
    g.act({ type: 'endTurn' }); // p1 -> p2
    g.act({ type: 'endTurn' }); // p2 -> p1
    expectDecision(g, 'main', 'p1');
    koBy(g, 'p1', ODYSSEY4, 'p2');
    expect(chars(g)).not.toContain(ODYSSEY4);
  });
});
