/** OP10-070 Trebol. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { expectDecision, play, V } from './helpers.ts';
import { koBy, mine, OTHER_LEADER, POWER0, POWER1000, POWER2000 } from './helpers-lfa.ts';

const ID = 'OP10-070';
const chars = (g: ReturnType<typeof mine>) => g.zone('p1', 'characters').map((c) => c.card);
/** p1 plays Trebol (4 active DON!!) next to `others`. */
const start = (others: PlayerSpec['characters'], extra = {}) => {
  const g = mine(OTHER_LEADER, { hand: [ID], characters: others, ...extra }, {}, 4);
  play(g, ID);
  expectDecision(g, 'main', 'p1');
  return g;
};

describe('OP10-070 Trebol', () => {
  it("[On Play] your Characters with 1000 base power or less cannot be K.O.'d by your opponent's effects", () => {
    const g = start([POWER1000, POWER0]);
    koBy(g, 'p1', POWER1000, 'p2');
    koBy(g, 'p1', POWER0, 'p2');
    expect(chars(g).sort()).toEqual([POWER1000, POWER0, ID].sort());
  });

  it('boundary: 2000 base power is not covered, and neither is Trebol himself (5000)', () => {
    const g = start([POWER2000, V.c3]);
    koBy(g, 'p1', POWER2000, 'p2');
    koBy(g, 'p1', ID, 'p2');
    expect(chars(g)).toEqual([V.c3]);
  });

  it('it reads BASE power: a 1000-base Character with a DON!! given is still covered', () => {
    const g = mine(
      OTHER_LEADER,
      { hand: [ID], characters: [{ card: POWER1000, don: 1 }], costArea: { active: 4, rested: 0 } },
      {},
    );
    play(g, ID);
    expect(g.power(g.find('p1', 'characters', POWER1000))).toBe(2000);
    koBy(g, 'p1', POWER1000, 'p2');
    expect(chars(g)).toContain(POWER1000);
  });

  it("must not stop your own effect (only your opponent's)", () => {
    const g = start([POWER1000]);
    koBy(g, 'p1', POWER1000, 'p1');
    expect(chars(g)).not.toContain(POWER1000);
  });

  it('it is given to the Characters on the field now, not to one played later', () => {
    const g = mine(OTHER_LEADER, { hand: [ID, POWER0], characters: [POWER1000] }, {}, 5);
    play(g, ID);
    play(g, POWER0);
    koBy(g, 'p1', POWER0, 'p2');
    koBy(g, 'p1', POWER1000, 'p2');
    expect(chars(g)).not.toContain(POWER0);
    expect(chars(g)).toContain(POWER1000);
  });

  it("lasts through the opponent's next turn and then ends", () => {
    const g = start([POWER1000]);
    g.act({ type: 'endTurn' });
    koBy(g, 'p1', POWER1000, 'p2');
    expect(chars(g)).toContain(POWER1000);
    g.act({ type: 'endTurn' });
    expectDecision(g, 'main', 'p1');
    koBy(g, 'p1', POWER1000, 'p2');
    expect(chars(g)).not.toContain(POWER1000);
  });

  it('has [Blocker]', () => {
    const g = mine(OTHER_LEADER, { characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });
});
