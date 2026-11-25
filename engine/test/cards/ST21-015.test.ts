/** ST21-015 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import { dec, endCounter, expectDecision, hand, none, passBlock, pick, V } from './helpers.ts';
import { RED6000, RED7000, RSHC_5, ZORO_OTHER, mk, offered, oppTurn } from './helpers-st1821.ts';
import type { TestGame } from '../fixtures/index.ts';

const ID = 'ST21-015';
/** A red Event with no script (cost 2). */
const RED_EVENT = 'EB02-008';

describe('ST21-015 Roronoa Zoro', () => {
  it('[DON!! x2]: gains [Rush] (can attack the turn it is played) only with 2 or more DON!! given', () => {
    const g = mk({
      characters: [{ card: ID, don: 2, playedThisTurn: true }],
      costArea: { active: 3, rested: 0 },
    });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Rush');
    expect(
      g.isLegal({
        type: 'attack',
        attacker: g.find('p1', 'characters', ID),
        target: g.leader('p2'),
        player: 'p1',
      }),
    ).toBe(true);
  });

  it('boundary: 1 DON!! given: no Rush, and it cannot attack the turn it is played', () => {
    const g = mk({
      characters: [{ card: ID, don: 1, playedThisTurn: true }],
      costArea: { active: 3, rested: 0 },
    });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Rush');
    expect(
      g.isLegal({
        type: 'attack',
        attacker: g.find('p1', 'characters', ID),
        target: g.leader('p2'),
        player: 'p1',
      }),
    ).toBe(false);
  });

  /** p2's V.c4 (6000) attacks p1's rested Zoro (5000, no DON!!); p1 holds `hand`. */
  const koZoro = (handCards: string[]): TestGame => {
    const g = mk(
      { characters: [{ card: ID, rested: true }], hand: handCards },
      { characters: [V.c4] },
      oppTurn,
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c4),
      target: g.find('p1', 'characters', ID),
    });
    passBlock(g);
    endCounter(g);
    return g;
  };

  it('[On K.O.] (no DON!! needed): plays a red Character with 6000 power or less from hand (7000, other colors, Events and [Roronoa Zoro] are not offered)', () => {
    const g = koZoro([RED6000, RED7000, RSHC_5, ZORO_OTHER, V.c1, RED_EVENT]);
    expectDecision(g, 'choose', 'p1');
    // Red 6000 (Dice, cost 4) and red 6000 Usopp are offered; 7000, the other [Roronoa Zoro], purple and the Event are not.
    expect(offered(g).sort()).toEqual(
      [g.find('p1', 'hand', RED6000), g.find('p1', 'hand', RSHC_5)].sort(),
    );
    pick(g, [g.find('p1', 'hand', RED6000)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([RED6000]);
    expect(hand(g, 'p1')).not.toContain(RED6000);
  });

  it('"up to 1": may play nothing', () => {
    const g = koZoro([RED6000]);
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g, 'p1')).toEqual([RED6000]);
  });

  it('with only excluded cards in hand (a 7000 red, another [Roronoa Zoro]) nothing is played', () => {
    const g = koZoro([RED7000, ZORO_OTHER]);
    // The hand is hidden, so the "up to" pick is still asked, at a maximum of 0 (no hand-based gate).
    const d = dec(g);
    if (d?.kind === 'choose') {
      expect(d.max ?? 0).toBe(0);
      expect(offered(g)).toEqual([]);
      none(g);
    }
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g, 'p1')).toEqual([RED7000, ZORO_OTHER]);
  });
});
