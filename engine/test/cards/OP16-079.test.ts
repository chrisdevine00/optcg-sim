/** OP16-079 Yamato (Leader, 5000, Life 5). */
import { describe, expect, it } from 'vitest';
import { applyOp, withAbilities, type Ability } from '../../src/testing.ts';
import { BLUE, game, hand, PLAIN_PURPLE, pick, V } from './helpers.ts';

const ID = 'OP16-079';
// {Land of Wano} Characters with no effect: OP01-037 (cost 2, 3000), OP01-043 (cost 3, 5000).
const WANO_A = 'OP01-037';
const WANO_B = 'OP01-043';
const NOT_WANO = V.c2;

const play = (from: 'hand' | 'trash', n = 1): Ability =>
  ({
    id: 'a',
    kind: 'activate',
    when: 'activateMain',
    effect: [
      {
        do: {
          play: {
            what: {
              from,
              owner: 'you',
              filter: { category: ['Character'] },
              pick: { upTo: n },
            },
          },
        },
      },
    ],
  }) as unknown as Ability;

const mk = (ab: Ability = play('trash')) => {
  const g = game(
    {
      leader: ID,
      characters: [BLUE],
      trash: [WANO_A, WANO_B, NOT_WANO],
      hand: [WANO_A],
      costArea: { active: 5, rested: 0 },
    },
    { leader: PLAIN_PURPLE, characters: [V.c5] },
  );
  g.state = withAbilities(g.state, BLUE, [ab]);
  return g;
};
const run = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'a' });
const canAttack = (g: ReturnType<typeof mk>, card: string): boolean =>
  g
    .legal()
    .some(
      (a) =>
        a.type === 'attack' &&
        a.attacker === g.find('p1', 'characters', card) &&
        a.target === g.leader('p2'),
    );

describe('OP16-079 Yamato', () => {
  describe('when a {Land of Wano} Character card is played from your trash, that Character gains [Rush] during this turn', () => {
    it('a {Land of Wano} Character played from the trash by an effect can attack at once', () => {
      const g = mk();
      run(g);
      pick(g, [g.find('p1', 'trash', WANO_B)]);
      expect(canAttack(g, WANO_B)).toBe(true);
      expect(g.card(g.find('p1', 'characters', WANO_B)).keywords).toContain('Rush');
    });

    it('a Character of another type played from the trash gets nothing', () => {
      const g = mk();
      run(g);
      pick(g, [g.find('p1', 'trash', NOT_WANO)]);
      expect(canAttack(g, NOT_WANO)).toBe(false);
    });

    it('a {Land of Wano} Character played from the hand is not "played from your trash"', () => {
      const g = mk(play('hand'));
      run(g);
      pick(g, [g.find('p1', 'hand', WANO_A)]);
      expect(canAttack(g, WANO_A)).toBe(false);
      expect(hand(g, 'p1')).toEqual([]);
    });

    it('two played by one effect each gain it, and only they do', () => {
      const g = mk(play('trash', 3));
      run(g);
      pick(g, [
        g.find('p1', 'trash', WANO_A),
        g.find('p1', 'trash', WANO_B),
        g.find('p1', 'trash', NOT_WANO),
      ]);
      expect(canAttack(g, WANO_A)).toBe(true);
      expect(canAttack(g, WANO_B)).toBe(true);
      expect(canAttack(g, NOT_WANO)).toBe(false);
    });

    it('the Rush is the Leader’s: a negated Character can still attack (official OP16 Q&A)', () => {
      const g = mk();
      run(g);
      pick(g, [g.find('p1', 'trash', WANO_B)]);
      g.state = applyOp(g.state, {
        op: 'modifier',
        mod: {
          kind: 'negate',
          target: g.find('p1', 'characters', WANO_B),
          duration: 'thisTurn' as never,
          controller: 'p2',
        },
      }).state;
      expect(canAttack(g, WANO_B)).toBe(true);
    });
  });
});
