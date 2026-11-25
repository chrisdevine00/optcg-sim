/** OP14-053 Vista (Character, cost 3, 4000, [Blocker]). */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../src/testing.ts';
import { game, PLAIN_BLUE, times, V } from './helpers.ts';
import { NEWGATE } from './helpers-w7c2.ts';

const ID = 'OP14-053';

describe('OP14-053 Vista', () => {
  /** `turn` is whose turn it is; the Leader is Newgate (6000); `cards` cards are in p1's hand. */
  const mk = (cards: number, turn: 'p1' | 'p2', leader = NEWGATE) =>
    game(
      { leader, characters: [ID], hand: times(cards, V.c1) },
      { leader: PLAIN_BLUE },
      turn === 'p1' ? {} : { activePlayer: 'p2', turn: 4 },
    );
  const power = (g: ReturnType<typeof mk>) => g.power(g.find('p1', 'characters', ID));

  it('has [Blocker]', () => {
    const g = mk(3, 'p1');
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it("in your opponent's turn with 7 cards in hand, its base power is your Leader's base power", () => {
    expect(power(mk(7, 'p2'))).toBe(6000);
    expect(power(mk(0, 'p2'))).toBe(6000);
  });

  it('boundary: with 8 cards in hand it keeps 4000', () => {
    expect(power(mk(8, 'p2'))).toBe(4000);
  });

  it('in your own turn it keeps 4000 whatever the hand', () => {
    expect(power(mk(3, 'p1'))).toBe(4000);
  });

  it('reads the Leader base power, not its current power', () => {
    const g = mk(3, 'p2', PLAIN_BLUE); // base 5000
    expect(power(g)).toBe(5000);
    // Raise the Leader by a permanent: the Character copies the printed 5000, not the 7000.
    g.state = withAbilities(g.state, PLAIN_BLUE, [
      {
        id: 'p',
        kind: 'permanent',
        apply: [{ power: { target: { from: 'self', owner: 'you' }, amount: 2000 } }],
      } as unknown as Ability,
    ]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(power(g)).toBe(5000);
  });
});
