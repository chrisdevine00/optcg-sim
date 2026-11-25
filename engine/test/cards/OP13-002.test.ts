/** OP13-002 Portgas.D.Ace (Leader). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  dec,
  decline,
  expectDecision,
  game,
  hand,
  pick,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';
import { buff, koBy } from './helpers-op11g1.ts';
import { finishBattle, offeredPicks } from './helpers-w5c2.ts';

const ID = 'OP13-002';
const leader = (don = 1) => ({ card: ID, don });

/** p2 (turn 4) attacks p1's Leader with its first Character; p1 holds `h`. */
const attacked = (
  p1: { don?: number; hand?: string[]; characters?: string[] } = {},
  p2chars: string[] = [V.c4, V.c3],
) => {
  const g = game(
    {
      leader: leader(p1.don ?? 1),
      hand: p1.hand ?? [V.c1, V.c2],
      life: [V.c2, V.c2, V.c2],
      characters: p1.characters ?? [],
      costArea: { active: 3, rested: 0 },
    },
    { leader: PLAIN_BLUE, characters: p2chars },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', p2chars[0]!),
    target: g.leader('p1'),
  });
  return g;
};

describe('OP13-002 Portgas.D.Ace', () => {
  it("[On Your Opponent's Attack]: trash 1 card, give an opposing Leader or Character -2000 power during this battle", () => {
    const g = attacked({ characters: [V.c1] });
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    // Opposing Leader and Characters only; none of mine.
    expect(offeredPicks(g).sort()).toEqual(
      [g.leader('p2'), g.find('p2', 'characters', V.c4), g.find('p2', 'characters', V.c3)].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(4000);
    finishBattle(g);
    expect(g.life('p1')).toBe(3); // 4000 against a 6000 Leader
    // The -2000 ended with the battle.
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });

  it('"up to 1": only one Character gets -2000', () => {
    const g = attacked();
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    g.act({ type: 'pick', choice: g.find('p2', 'characters', V.c4) });
    expectDecision(g, 'block', 'p1');
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
  });

  it('"up to 1": may pick nothing (the card is still trashed); may be declined outright', () => {
    const g = attacked();
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    g.act({ type: 'done' });
    expect(trash(g, 'p1')).toEqual([V.c2]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);

    const h = attacked();
    decline(h);
    expect(trash(h, 'p1')).toEqual([]);
    expect(hand(h, 'p1')).toEqual([V.c1, V.c2]);
    expectDecision(h, 'block', 'p1');
  });

  it('[Once Per Turn]: not offered again for the second attack of the same turn; not offered with an empty hand', () => {
    const g = attacked({ hand: [V.c1, V.c2, V.c3] });
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    finishBattle(g);
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');

    // With an empty hand the cost cannot be paid: it can only be declined.
    const empty = attacked({ hand: [] });
    expectDecision(empty, 'optional', 'p1');
    expect(empty.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });

  it('[DON!! x1] when you take damage: draw 1 card, once per turn; nothing without a DON!! given', () => {
    const g = attacked({ hand: [V.c1] }, [V.c4, V.c4]);
    decline(g);
    finishBattle(g);
    expect(g.life('p1')).toBe(2);
    // The Life card went to the hand with the damage; the drawn card is the deck top.
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2, BLUE]);
    // A second damage in the same turn draws nothing more.
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c4, 1),
      target: g.leader('p1'),
    });
    expectDecision(g, 'optional', 'p1'); // the trash ability is asked again: declining it spent nothing
    decline(g);
    finishBattle(g);
    expect(g.life('p1')).toBe(1);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2, BLUE, V.c2]);

    const bare = attacked({ hand: [V.c1], don: 0 });
    expectDecision(bare, 'optional', 'p1');
    decline(bare);
    finishBattle(bare);
    expect(bare.life('p1')).toBe(2);
    expect(hand(bare, 'p1')).toEqual([V.c1, V.c2]);
  });

  it("when your Character with 6000 base power or more is K.O.'d: draw 1 (5000 is not enough)", () => {
    const six = game({ leader: leader(), characters: [V.c4, V.c3] }, { leader: PLAIN_BLUE });
    koBy(six, 'p1', V.c3, 'p2');
    expect(hand(six, 'p1')).toEqual([]);
    koBy(six, 'p1', V.c4, 'p2');
    expect(hand(six, 'p1')).toEqual([BLUE]);

    // Base power: a 5000 Character buffed to 6000 does not count, a 6000 one debuffed to 4000 does.
    const buffed = game({ leader: leader(), characters: [V.c3] }, { leader: PLAIN_BLUE });
    buff(buffed, buffed.find('p1', 'characters', V.c3), 1000, 'p1');
    koBy(buffed, 'p1', V.c3, 'p2');
    expect(hand(buffed, 'p1')).toEqual([]);
    const lowered = game({ leader: leader(), characters: [V.c4] }, { leader: PLAIN_BLUE });
    buff(lowered, lowered.find('p1', 'characters', V.c4), -2000, 'p2');
    koBy(lowered, 'p1', V.c4, 'p2');
    expect(hand(lowered, 'p1')).toEqual([BLUE]);
  });

  it("an opponent's Character K.O.'d does not draw, nor does a K.O. without a DON!! given; damage and K.O. share one use", () => {
    const g = game(
      { leader: leader(), characters: [V.c4, V.c4] },
      { leader: PLAIN_BLUE, characters: [V.c4] },
    );
    koBy(g, 'p2', V.c4, 'p1');
    expect(hand(g, 'p1')).toEqual([]);
    koBy(g, 'p1', V.c4, 'p2');
    expect(hand(g, 'p1')).toEqual([BLUE]);
    koBy(g, 'p1', V.c4, 'p2'); // the same turn: used
    expect(hand(g, 'p1')).toEqual([BLUE]);

    const bare = game({ leader: leader(0), characters: [V.c4] }, { leader: PLAIN_BLUE });
    koBy(bare, 'p1', V.c4, 'p2');
    expect(hand(bare, 'p1')).toEqual([]);
    expect(dec(bare)?.kind).toBe('main');
  });

  it("official Q&A (OP14-053 Vista): a Character K.O.'d with its base power set to 6000 counts, read as it was on the field", () => {
    const VISTA = 'OP14-053';
    const mk = (turn: 3 | 4) =>
      game(
        { leader: leader(), characters: [VISTA] },
        { leader: PLAIN_BLUE },
        { turn, activePlayer: turn === 4 ? 'p2' : 'p1' },
      );
    // The opponent's turn, 7 or less cards in hand: Vista's base power becomes the Leader's, 6000.
    const theirs = mk(4);
    expect(theirs.power(theirs.find('p1', 'characters', VISTA))).toBeGreaterThanOrEqual(6000);
    koBy(theirs, 'p1', VISTA, 'p2');
    expect(hand(theirs, 'p1')).toEqual([BLUE]);
    // On its owner's turn Vista keeps its printed base power (below 6000): no draw.
    const mine = mk(3);
    koBy(mine, 'p1', VISTA, 'p2');
    expect(hand(mine, 'p1')).toEqual([]);
  });
});
