/**
 * RL-23 DON!! to the cost area versus DON!! to the DON!! deck.
 * rulings.md RL-23 (CR 3-1-6-1, 6-2-3, 6-2-4, 6-5-5-4, 8-3-1-6, 10-2-10-1).
 *
 * Case (a) without effects: the Character K with 2 given DON!! leaves the field by losing a battle
 * instead of by a scripted K.O. effect; CR 6-5-5-4 covers any move to another area.
 * K = p2's rested OP02-080 Dobon (vanilla, 4000); attacker p1's OP02-006 Kingdew (vanilla, 7000).
 */
import { describe, expect, it } from 'vitest';
import { scenario } from '../../fixtures/index.ts';
import { attack, don, endTurn, FILL, fill, L, noDefence, V } from '../helpers.ts';

describe('RL-23: where DON!! go', () => {
  it('RL-23 (a): DON!! under a K.O.’d Character go to its owner’s cost area rested; the DON!! deck is unchanged', () => {
    const g = scenario({
      p1: {
        leader: L.redLuffy,
        characters: [V.kingdew],
        life: fill(FILL.red, 5),
        deck: fill(FILL.red, 10),
      },
      p2: {
        leader: L.purpleKaido,
        characters: [{ card: V.dobon, rested: true, don: 2 }],
        costArea: { active: 3, rested: 1 },
        donDeck: 4,
        life: fill(FILL.purple, 5),
        deck: fill(FILL.purple, 10),
      },
    });
    attack(g, g.find('p1', 'characters', V.kingdew), g.find('p2', 'characters', V.dobon));
    noDefence(g);
    expect(don(g, 'p2')).toEqual({ deck: 4, active: 3, rested: 3, given: 0 });
  });

  it('RL-23: at Refresh, given DON!! return to the cost area (rested, then set active), never to the DON!! deck', () => {
    const g = scenario({
      p1: {
        leader: { card: L.redLuffy, don: 2 },
        costArea: { active: 0, rested: 1 },
        donDeck: 7,
        life: fill(FILL.red, 5),
        deck: fill(FILL.red, 10),
      },
      p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: fill(FILL.purple, 10) },
    });
    endTurn(g);
    endTurn(g);
    // 2 returned + 1 already there, all active; then 2 more from the DON!! deck.
    expect(don(g, 'p1')).toEqual({ deck: 5, active: 5, rested: 0, given: 0 });
  });

  it.todo(
    'RL-23 (b): DON!! −2 may pick a given DON!! and a rested cost-area DON!!; DON!! deck +2 (needs M4 effects)',
  );
  it.todo(
    'RL-23 (c) QA-OP16 OP16-074: when an opponent’s effect makes you return DON!!, you choose which (needs M4 effects)',
  );
  it.todo(
    'RL-23 (QA-OP09 OP09-061): "2 or more DON!! returned" needs one simultaneous return (needs M4 effects)',
  );
});
