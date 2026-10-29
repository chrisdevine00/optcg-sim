/**
 * Duration expiry tiers (rules digest item 73; CR 6-2-1, 6-6-1-2, 6-6-1-3, 7-1-5-3/4).
 * Only the battle tier and DON!! power can be produced without card effects; the turn tiers are
 * tracked as todos until effect scripts arrive (M4).
 * Leaders ST01-001 and ST04-001 (5000). OP11-078 Decuplets: vanilla, Counter +2000.
 * OP01-010 Komachiyo: vanilla, 3000 power, Counter +1000.
 */
import { describe, expect, it } from 'vitest';
import { scenario } from '../../fixtures/index.ts';
import { act, attack, endTurn, FILL, fill, L, passBlock, V } from '../helpers.ts';

describe('battle tier (CR 7-1-5-3 / 7-1-5-4)', () => {
  it('CR 7-1-3-1-1 / 7-1-5-3 / 7-1-5-4: a Counter on a card not in the battle still ends with the battle', () => {
    // p2's turn: p2's Leader attacks p1's Leader; p1 counters onto a rested Komachiyo instead.
    const g = scenario({
      turn: 4,
      activePlayer: 'p2',
      firstPlayer: 'p1',
      p1: {
        leader: L.redLuffy,
        characters: [{ card: V.komachiyo, rested: true }],
        hand: [V.ain],
        life: fill(FILL.red, 5),
        deck: fill(FILL.red, 10),
      },
      p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: fill(FILL.purple, 10) },
    });
    const komachiyo = g.find('p1', 'characters', V.komachiyo);
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'counter', card: g.find('p1', 'hand', V.ain), target: komachiyo });
    expect(g.power(komachiyo)).toBe(5000); // 3000 + Ain's +2000
    act(g, { type: 'endCounter' });
    expect(g.power(komachiyo)).toBe(3000);
    expect(g.life('p1')).toBe(4); // the Leader was not boosted: 5000 vs 5000
  });
});

describe('DON!! power is not a duration (CR 6-5-5-2)', () => {
  it('CR 6-5-5-2: the +1000 applies on the owner’s turns only, while the DON!! stay given', () => {
    const g = scenario({
      p1: {
        leader: L.redLuffy,
        costArea: { active: 1, rested: 0 },
        life: fill(FILL.red, 5),
        deck: fill(FILL.red, 10),
      },
      p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: fill(FILL.purple, 10) },
    });
    act(g, { type: 'giveDon', target: g.leader('p1') });
    expect(g.power(g.leader('p1'))).toBe(6000);
    endTurn(g);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

describe('turn tiers (need effects)', () => {
  it.todo(
    'CR 6-6-1-2: "until the end of the turn" effects expire in the End Phase, turn player’s then non-turn player’s (needs M4 effects)',
  );
  it.todo(
    'CR 6-6-1-3: "during this turn" effects expire after the 6-6-1-2 step (needs M4 effects)',
  );
  it.todo(
    'CR 6-6-1-1: [End of Your Turn] effects still see "during this turn" boosts (needs M4 effects)',
  );
  it.todo(
    'CR 6-2-1: "until the start of your next turn" effects end at Refresh step 1, before start-of-turn effects (needs M4 effects)',
  );
  it.todo(
    'CR 6-6-1-2 (2): "until the end of your opponent’s next End Phase" ends in the opponent’s End Phase (needs M4 effects; RL-11)',
  );
});
