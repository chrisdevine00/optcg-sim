/** OP09-025 Crocodile. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { endCounter, game, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { ODYSSEY_LEADER } from './helpers-w5c1.ts';

const ID = 'OP09-025';
/** The opponent's turn: their `attacker` (a Leader or a Character) attacks p1's rested Crocodile. */
const battle = (leader: string, attacker: 'leader' | string) => {
  const g = game(
    { leader, characters: [{ card: ID, rested: true }] },
    { leader: PLAIN_BLUE, characters: attacker === 'leader' ? [] : [attacker] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({
    type: 'attack',
    attacker: attacker === 'leader' ? g.leader('p2') : g.find('p2', 'characters', attacker),
    target: g.find('p1', 'characters', ID),
  });
  g.act({ type: 'block', blocker: null });
  endCounter(g);
  return g;
};
const koed = (g: ReturnType<typeof battle>) => g.zone('p1', 'characters').length === 0;

describe('OP09-025 Crocodile', () => {
  it("with an {ODYSSEY} Leader it cannot be K.O.'d in battle by a Leader", () => {
    const g = battle(ODYSSEY_LEADER, 'leader');
    expect(koed(g)).toBe(false);
    expect(g.eventsOfType('KOPrevented').length).toBeGreaterThan(0);
  });

  it('but a Character can K.O. it in battle (the shield is against Leaders only)', () => {
    const g = battle(ODYSSEY_LEADER, V.c6);
    expect(koed(g)).toBe(true);
  });

  it('without an {ODYSSEY} Leader a Leader K.O.s it', () => {
    const g = battle(PLAIN_PURPLE, 'leader');
    expect(koed(g)).toBe(true);
  });

  it('an effect can still K.O. it, whoever the Leader is', () => {
    const g = game({ leader: ODYSSEY_LEADER, characters: [ID] }, { leader: PLAIN_BLUE });
    g.state = applyOp(g.state, { op: 'ko', card: g.find('p1', 'characters', ID), by: 'p2' }).state;
    expect(koed(g as never)).toBe(true);
  });
});
