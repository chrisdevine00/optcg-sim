/** OP11-041 Nami (Leader). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  dec,
  decline,
  endCounter,
  expectDecision,
  hand,
  passBlock,
  pick,
  play,
  takeDamage,
  times,
  trash,
  V,
} from './helpers.ts';
import { finishBattle } from './helpers-op14g1.ts';
import { mk } from './helpers-op11g2.ts';

const ID = 'OP11-041';

/** p1 attacks p2's Leader with each of `attackers` in turn and lets every attack through. */
const attackAll = (g: ReturnType<typeof mk>, ...attackers: string[]) => {
  for (const a of attackers) {
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', a), target: g.leader('p2') });
    finishBattle(g);
  }
};

describe('OP11-041 Nami (Leader)', () => {
  it("[Your Turn]: when a card leaves your opponent's Life on your turn and you have 7 or less cards in hand, draw 1", () => {
    const g = mk({ leader: ID, characters: [V.c7], hand: times(7, BLUE), deck: times(5, BLUE) });
    attackAll(g, V.c7);
    expect(g.life('p2')).toBe(2);
    expect(hand(g, 'p1')).toHaveLength(8);
  });

  it('boundary: with 8 cards in hand nothing is drawn', () => {
    const g = mk({ leader: ID, characters: [V.c7], hand: times(8, BLUE), deck: times(5, BLUE) });
    attackAll(g, V.c7);
    expect(g.life('p2')).toBe(2);
    expect(hand(g, 'p1')).toHaveLength(8);
    expect(g.zone('p1', 'deck')).toHaveLength(5);
  });

  it('[Once Per Turn] is spent by the activation, not the draw: 8 cards (the "If" fails), then 7 cards on a second removal still draws nothing', () => {
    // Reading B3A-R1: "This effect can be activated when ... If you have 7 or less cards in your hand, draw 1"
    // has no colon, so the "If" is part of the effect and the use is spent when it fails (as EB04-012, EB03-013).
    const g = mk({
      leader: ID,
      characters: [V.c7, V.c6],
      hand: [V.c1, ...times(7, BLUE)],
      deck: times(5, BLUE),
    });
    attackAll(g, V.c7);
    expect(g.life('p2')).toBe(2);
    expect(hand(g, 'p1')).toHaveLength(8); // failed "If": nothing drawn, use spent
    play(g, V.c1); // 7 cards in hand now
    expect(hand(g, 'p1')).toHaveLength(7);
    attackAll(g, V.c6);
    expect(g.life('p2')).toBe(1);
    expect(hand(g, 'p1')).toHaveLength(7); // the second removal draws nothing
    expect(g.zone('p1', 'deck')).toHaveLength(5);
  });

  it('[Once Per Turn]: a second Life card removed in the same turn draws nothing', () => {
    const g = mk({ leader: ID, characters: [V.c7, V.c6], hand: [], deck: times(5, BLUE) });
    attackAll(g, V.c7, V.c6);
    expect(g.life('p2')).toBe(1);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it("must not fire on your opponent's turn: your own Life removed then draws nothing", () => {
    const g = mk(
      { leader: ID, hand: [], deck: times(5, BLUE) },
      { characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    finishBattle(g);
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toHaveLength(1); // the Life card only
  });

  const underAttack = (p1: object, attackers: string[] = [V.c7]) =>
    mk(
      { leader: { card: ID, don: 1 }, costArea: { active: 5, rested: 0 }, ...p1 },
      { characters: attackers },
      { turn: 4, activePlayer: 'p2' },
    );
  const attack = (g: ReturnType<typeof mk>, c: string) =>
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', c), target: g.leader('p1') });

  it("[DON!! x1][On Your Opponent's Attack]: trash 1 card from hand, this Leader gains +2000 power during this turn", () => {
    const g = underAttack({ hand: [V.c1, V.c2] });
    attack(g, V.c7);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(trash(g, 'p1')).toEqual([V.c2]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    passBlock(g);
    endCounter(g); // 9000 vs 7000: the Leader loses a Life card
    expect(g.power(g.leader('p1'))).toBe(7000); // still +2000 for the rest of the turn
  });

  it('declining the optional trash: nothing is trashed and the power stays 5000', () => {
    const g = underAttack({ hand: [V.c1] });
    attack(g, V.c7);
    decline(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expectDecision(g, 'block', 'p1');
  });

  it('must not fire without a DON!! card given to the Leader: no offer, the attack goes straight to the block step', () => {
    const g = underAttack({ leader: ID, hand: [V.c1] });
    attack(g, V.c7);
    expectDecision(g, 'block', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with an empty hand the cost cannot be paid: the effect cannot be used', () => {
    const g = underAttack({ hand: [] });
    attack(g, V.c7);
    const d = dec(g);
    if (d?.kind === 'optional') {
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      decline(g);
    }
    expectDecision(g, 'block', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Once Per Turn]: a second attack in the same turn is not offered the effect again', () => {
    const g = underAttack({ hand: [V.c1, V.c2, V.c3] }, [V.c7, V.c6]);
    attack(g, V.c7);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c3)]);
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    attack(g, V.c6);
    expectDecision(g, 'block', 'p1');
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(trash(g, 'p1')).toEqual([V.c3]);
  });
});
