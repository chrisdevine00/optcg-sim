/** EB05-043 Perona: [On K.O.] K.O. or rest up to 1 of your opponent's Characters with a cost of 6 or less. */
import { describe, expect, it } from 'vitest';
import {
  expectDecision,
  game,
  none,
  option,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { battle } from './helpers-hancock-rosi.ts';

const PERONA = 'EB05-043';

describe('EB05-043 Perona', () => {
  /** p2's 7000 Character K.O.s a rested Perona in battle; p1 owes the [On K.O.] decisions. */
  const koPerona = (extra: string[]) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: PERONA, rested: true }] },
      { leader: PLAIN_BLUE, characters: [V.c7, ...extra] },
      { turn: 4, activePlayer: 'p2' },
    );
    battle(g, g.find('p2', 'characters', V.c7), g.find('p1', 'characters', PERONA));
    return g;
  };

  it('K.O. mode: K.O.s the chosen Character with a cost of 6 or less', () => {
    const g = koPerona([V.c6, V.c4]);
    expectDecision(g, 'choose', 'p1');
    option(g, '0');
    // The cost 7 attacker is not a candidate.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V.c6]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c7, V.c4]);
  });

  it('rest mode: rests the chosen Character instead of K.O.ing it', () => {
    const g = koPerona([V.c6]);
    option(g, '1');
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(true);
    expect(g.zone('p2', 'trash')).toHaveLength(0);
  });

  it('"up to 1": may choose no target after choosing a mode', () => {
    const g = koPerona([V.c6]);
    option(g, '0');
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('does not reach a cost 7 Character (only the attacker, cost 7, is there)', () => {
    const g = koPerona([]);
    // No legal target: the effect finds nothing to K.O. or rest.
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c7]);
    expect(g.card(g.find('p2', 'characters', V.c7)).rested).toBe(true);
  });

  it('does not fire when Perona survives the battle', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: PERONA, rested: true }] },
      { leader: PLAIN_BLUE, characters: [V.c1, V.c6] },
      { turn: 4, activePlayer: 'p2' },
    );
    battle(g, g.find('p2', 'characters', V.c1), g.find('p1', 'characters', PERONA));
    expectDecision(g, 'main', 'p2');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([PERONA]);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(false);
  });
});
