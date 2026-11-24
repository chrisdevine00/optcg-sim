/** OP15-024 Usopp. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { expectDecision, none, pick, V } from './helpers.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { mk } from './helpers-op15g1.ts';

const ID = 'OP15-024';
/** Cost 8, 10000 power vanilla [Shanks]. */
const COST8 = 'P-016';

const restOne = {
  rest: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
};

describe('OP15-024 Usopp', () => {
  it("[Opponent's Turn]: gains [Blocker] and cannot be rested by your opponent's effects", () => {
    const g = mk({ characters: [ID] }, {}, { turn: 4, activePlayer: 'p2' });
    const usopp = g.find('p1', 'characters', ID);
    expect(g.card(usopp).keywords).toContain('Blocker');
    plantOpponentEffect(g, restOne);
    pick(g, [usopp]);
    expect(g.card(usopp).rested).toBe(false);
  });

  it('it can still block (resting itself as the Blocker rule, not an effect) on the opponent turn', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c4] }, { turn: 4, activePlayer: 'p2' });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
    const usopp = g.find('p1', 'characters', ID);
    expect(g.legal().some((a) => a.type === 'block' && a.blocker === usopp)).toBe(true);
  });

  it('must not apply on your own turn: no [Blocker], and an effect can rest it', () => {
    const g = mk({ characters: [ID] });
    const usopp = g.find('p1', 'characters', ID);
    expect(g.card(usopp).keywords).not.toContain('Blocker');
    g.state = applyOp(g.state, { op: 'rest', card: usopp }).state;
    expect(g.card(usopp).rested).toBe(true);
  });

  const koUsopp = (p2chars: string[]) => {
    const g = mk({ characters: [ID] }, { characters: p2chars }, { turn: 4, activePlayer: 'p2' });
    g.state = applyOp(g.state, { op: 'ko', card: g.find('p1', 'characters', ID), by: 'p2' }).state;
    return g;
  };

  it("[On K.O.]: rests up to 1 of your opponent's Characters with a cost of 7 or less", () => {
    const g = koUsopp([V.c7, V.c4, COST8]);
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3); // Leader, cost 7, cost 4; not cost 8
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(g.card(g.find('p2', 'characters', V.c7)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(false);
  });

  it('[On K.O.]: boundary cost 7 is allowed and cost 8 is not; "up to 1" may rest nothing', () => {
    const g = koUsopp([COST8]);
    expectDecision(g, 'choose', 'p1'); // only the Leader is a candidate: cost 8 is not
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    none(g);
    expect(g.card(g.find('p2', 'characters', COST8)).rested).toBe(false);
    const h = koUsopp([V.c7]);
    none(h);
    expect(h.card(h.find('p2', 'characters', V.c7)).rested).toBe(false);
  });

  it("[On K.O.]: the opponent's Leader is a candidate whatever its cost (reading, M6b-Q48), and rests", () => {
    const g = koUsopp([V.c4, COST8]);
    expectDecision(g, 'choose', 'p1');
    const choices = g.legal().filter((a) => a.type === 'pick');
    // Leader and the cost 4 Character; the cost 8 Character is not a candidate.
    expect(choices).toHaveLength(2);
    pick(g, [g.leader('p2')]);
    expect(g.card(g.leader('p2')).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', COST8)).rested).toBe(false);
  });
});
