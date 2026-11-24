/** ST32-003 Dracule Mihawk. */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../src/testing.ts';
import {
  BLUE,
  endCounter,
  expectDecision,
  game,
  hand,
  none,
  passBlock,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import {
  activate,
  canPick,
  EAST_BLUE_SLASH_LEADER,
  PERONA,
  SLASH_2,
  SLASH_5,
  SLASH_6,
  STRIKE_3,
} from './helpers-w3s.ts';

const ID = 'ST32-003';

describe('ST32-003 Dracule Mihawk', () => {
  describe('[Your Turn] when this Character becomes rested: draw 1 and trash 1', () => {
    const start = (opts: { turn?: 3 | 4; rested?: boolean } = {}) =>
      game(
        {
          leader: PLAIN_PURPLE,
          characters: [{ card: ID, rested: opts.rested ?? false }],
          hand: [V.c1],
          deck: [V.c2, V.c3],
        },
        { leader: PLAIN_BLUE, characters: [PURPLE] },
        opts.turn === 4 ? { turn: 4, activePlayer: 'p2' } : {},
      );
    /** A planted [Activate: Main] on `card` that rests one of the opponent's Characters. */
    const plantRest = (g: ReturnType<typeof start>, card: string) => {
      g.state = withAbilities(g.state, card, [
        {
          id: 'r',
          kind: 'activate',
          when: 'activateMain',
          effect: [
            { do: { rest: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } } },
          ],
        } as Ability,
      ]);
    };

    it('resting by attacking on your turn: draw 1, then trash 1 card from your hand (your choice)', () => {
      const g = start();
      g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
      expectDecision(g, 'choose', 'p1');
      expect(hand(g, 'p1').sort()).toEqual([V.c1, V.c2].sort()); // the draw came first
      expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(true);
      expect(canPick(g, g.find('p1', 'hand', V.c2))).toBe(true);
      pick(g, [g.find('p1', 'hand', V.c2)]);
      expect(hand(g, 'p1')).toEqual([V.c1]);
      expect(trash(g, 'p1')).toEqual([V.c2]);
      expectDecision(g, 'block', 'p2');
    });

    it('also when your own effect rests it', () => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [ID, BLUE], hand: [V.c1], deck: [V.c2, V.c3] },
        { leader: PLAIN_BLUE },
      );
      g.state = withAbilities(g.state, BLUE, [
        {
          id: 'r',
          kind: 'activate',
          when: 'activateMain',
          effect: [
            {
              do: {
                rest: { from: 'characters', owner: 'you', filter: { name: 'Dracule Mihawk' } },
              },
            },
          ],
        } as Ability,
      ]);
      activate(g, g.find('p1', 'characters', BLUE), 'r');
      expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(hand(g, 'p1')).toEqual([V.c2]);
    });

    it('on the opponent’s turn it does not trigger (rested by their effect)', () => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [ID], hand: [V.c1], deck: [V.c2, V.c3] },
        { leader: PLAIN_BLUE, characters: [PURPLE] },
        { turn: 4, activePlayer: 'p2' },
      );
      plantRest(g, PURPLE);
      activate(g, g.find('p2', 'characters', PURPLE), 'r');
      expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
      expectDecision(g, 'main', 'p2');
      expect(hand(g, 'p1')).toEqual([V.c1]);
    });

    it('an already rested Mihawk does not become rested again', () => {
      const g = game(
        {
          leader: PLAIN_PURPLE,
          characters: [{ card: ID, rested: true }, BLUE],
          hand: [V.c1],
          deck: [V.c2],
        },
        { leader: PLAIN_BLUE },
      );
      g.state = withAbilities(g.state, BLUE, [
        {
          id: 'r',
          kind: 'activate',
          when: 'activateMain',
          effect: [
            {
              do: {
                rest: { from: 'characters', owner: 'you', filter: { name: 'Dracule Mihawk' } },
              },
            },
          ],
        } as Ability,
      ]);
      activate(g, g.find('p1', 'characters', BLUE), 'r');
      expectDecision(g, 'main', 'p1');
      expect(hand(g, 'p1')).toEqual([V.c1]);
    });

    it('it is not optional: the draw and the trash both happen', () => {
      const g = start();
      g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
      expect(() => none(g)).toThrow(); // "done" is not legal: exactly 1 must be trashed
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(trash(g, 'p1')).toEqual([V.c1]);
      passBlock(g);
      endCounter(g);
    });
  });

  describe('[On Play] with a <Slash> Leader: play a cost 5 or less [Perona] or <Slash> Character from hand', () => {
    const start = (leader: string, handCards: string[]) =>
      game(
        { leader, hand: [ID, ...handCards], costArea: { active: 10, rested: 0 } },
        { leader: PLAIN_BLUE },
      );

    it('offers [Perona] and <Slash> Characters with a cost of 5 or less, not a cost 6 <Slash> or another attribute', () => {
      const g = start(EAST_BLUE_SLASH_LEADER, [PERONA, SLASH_5, SLASH_6, STRIKE_3, SLASH_2]);
      play(g, ID);
      expectDecision(g, 'choose', 'p1');
      for (const c of [PERONA, SLASH_5, SLASH_2])
        expect(canPick(g, g.find('p1', 'hand', c))).toBe(true);
      for (const c of [SLASH_6, STRIKE_3]) expect(canPick(g, g.find('p1', 'hand', c))).toBe(false);
      pick(g, [g.find('p1', 'hand', SLASH_5)]);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID, SLASH_5]);
    });

    it('[Perona] is played even though it is not <Slash>', () => {
      const g = start(EAST_BLUE_SLASH_LEADER, [PERONA]);
      play(g, ID);
      pick(g, [g.find('p1', 'hand', PERONA)]);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(PERONA);
    });

    it('"up to 1": may play nothing', () => {
      const g = start(EAST_BLUE_SLASH_LEADER, [SLASH_5]);
      play(g, ID);
      none(g);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
      expect(hand(g, 'p1')).toEqual([SLASH_5]);
    });

    it('without a <Slash> Leader nothing is played', () => {
      const g = start(PLAIN_BLUE, [SLASH_5, PERONA]);
      play(g, ID);
      expectDecision(g, 'main', 'p1');
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    });

    it('no leak (ADR 0005): with no eligible card but a non-empty hand the pick is asked at max 0', () => {
      const g = start(EAST_BLUE_SLASH_LEADER, [SLASH_6, STRIKE_3]);
      play(g, ID);
      expect(expectDecision(g, 'choose', 'p1')).toMatchObject({ min: 0, max: 0 });
      expect(canPick(g, g.find('p1', 'hand', SLASH_6))).toBe(false);
      none(g);
      expectDecision(g, 'main', 'p1');
    });

    it('an empty hand (a public fact) asks nothing', () => {
      const g = start(EAST_BLUE_SLASH_LEADER, []);
      play(g, ID);
      expectDecision(g, 'main', 'p1');
    });
  });
});
