/** OP15-078 Mamaragan. QA-OP15 OP15-078. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  don,
  BLUE,
  expectDecision,
  game,
  hand,
  KAIDO,
  passBlock,
  payDon,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';

describe('OP15-078 Mamaragan', () => {
  it('[Main] DON!! −2: draw 1, then rest a 5000-or-less Character; usable with no target', () => {
    const g = game(
      { leader: KAIDO, hand: ['OP15-078'], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c3] },
    );
    play(g, 'OP15-078');
    accept(g); // DON!! −X on an Event is optional (CR 8-3-1-4, QA-ST01–04 ST04-016)
    payDon(g);
    expect(hand(g, 'p1')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
    const none = game(
      { leader: KAIDO, hand: ['OP15-078'], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(none, 'OP15-078');
    accept(none);
    payDon(none);
    expectDecision(none, 'main', 'p1');
  });

  const counter = (active: number) => {
    const g = game(
      {
        leader: KAIDO,
        hand: ['OP15-078'],
        costArea: { active, rested: 0 },
        deck: [BLUE, BLUE, BLUE],
      },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    if (g.legal().some((a) => a.type === 'optional')) g.act({ type: 'optional', accept: false });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP15-078'), ability: 'counter' });
    pick(g, [g.leader('p1')]);
    return g;
  };

  it('[Counter]: +1000; draws only with 6 or less DON!! on the field (CR 4-10-2)', () => {
    const six = counter(6);
    expect(six.power(six.leader('p1'))).toBe(6000);
    expect(hand(six, 'p1')).toEqual([BLUE]);
    const seven = counter(7);
    expect(seven.power(seven.leader('p1'))).toBe(6000);
    expect(hand(seven, 'p1')).toEqual([]);
  });

  it('M4a-08: the [Main] DON!! −2 may be declined; no draw', () => {
    const g = game(
      { leader: KAIDO, hand: ['OP15-078'], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP15-078');
    g.act({ type: 'optional', accept: false });
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('M4a-08: with no DON!! on the field it can still be played (cost 0), and "use" is unavailable', () => {
    const g = game({ leader: KAIDO, hand: ['OP15-078'] }, { leader: PLAIN_BLUE });
    play(g, 'OP15-078');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    g.act({ type: 'optional', accept: false });
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual(['OP15-078']);
  });
});
