/** OP16-024 Inazuma. */
import { describe, expect, it } from 'vitest';
import {
  endCounter,
  expectDecision,
  game,
  none,
  passBlock,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from './helpers.ts';
import { withAbilities, type Ability } from '../../src/testing.ts';
import { activate, canPick, koBy, plantKo } from './helpers-w3s.ts';

const ID = 'OP16-024';

describe('OP16-024 Inazuma', () => {
  const start = (extra: Partial<Parameters<typeof game>[0]> = {}) =>
    game(
      { leader: PLAIN_PURPLE, characters: [ID], ...extra },
      { leader: PLAIN_BLUE, characters: [PURPLE, V.c1] },
      { turn: 4, activePlayer: 'p2' },
    );

  it('K.O.’d by the opponent’s effect: rest up to 1 of the opponent’s Characters', () => {
    const g = start();
    plantKo(g, PURPLE);
    activate(g, g.find('p2', 'characters', PURPLE), 'k');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.leader('p2'))).toBe(false); // Characters only
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', PURPLE)).rested).toBe(false);
  });

  it('"up to 1": may rest nothing', () => {
    const g = start();
    plantKo(g, PURPLE);
    activate(g, g.find('p2', 'characters', PURPLE), 'k');
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });

  it('K.O.’d in battle: nothing happens', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: ID, rested: true }] },
      { leader: PLAIN_BLUE, characters: [V.c7, V.c1] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', ID),
    });
    passBlock(g);
    endCounter(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expectDecision(g, 'main', 'p2');
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });

  it('K.O.’d by your own effect: nothing happens', () => {
    const g = start();
    koBy(g, 'p1', ID, 'p1');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expectDecision(g, 'main', 'p2');
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });

  it('not K.O.’d (returned to hand by the opponent’s effect): nothing happens', () => {
    const g = start();
    g.state = withAbilities(g.state, PURPLE, [
      {
        id: 'b',
        kind: 'activate',
        when: 'activateMain',
        effect: [
          {
            do: {
              move: {
                what: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } },
                to: { zone: 'hand' },
              },
            },
          },
        ],
      } as Ability,
    ]);
    activate(g, g.find('p2', 'characters', PURPLE), 'b');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([ID]);
    expectDecision(g, 'main', 'p2');
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });
});
