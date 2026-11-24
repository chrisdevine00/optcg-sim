/**
 * OP11-062 Charlotte Katakuri (Purple Leader, 5000, 5 Life, {Big Mom Pirates}).
 *
 * Card text: "[When Attacking]/[On Your Opponent's Attack] [Once Per Turn] DON!! -1: Look at 1 card from
 * the top of your opponent's deck. Then, this Leader gains +1000 power during this battle."
 *
 * Rules: DON!! -1 returns one DON!! from my field to my DON!! deck; the look changes nothing; the
 * boost lasts for the battle. Once per turn counts both timings together, and a used or declined
 * activation is tracked separately (only a resolved one uses it up).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  C11,
  canUse,
  donOf,
  fill,
  BLUE,
  deck,
  kind,
  L11,
  mine,
  need,
  no,
  passBlock,
  passCounter,
  payDon,
  theirs,
  unusable,
  yes,
} from './kit-op11b.ts';

const KAT = L11.katakuri62;

/** My turn: the Leader attacks the rested 6000 Character (or the Leader). */
function swing(active = 5, rested = 0) {
  const g = mine(
    KAT,
    { costArea: { active, rested } },
    { characters: [{ card: C11.c4, rested: true }], deck: [C11.c3, C11.c5, ...fill(BLUE, 13)] },
  );
  attack(g, g.leader('p1'), at(g, 'p2', 'characters', C11.c4));
  return g;
}

/** Opponent turn: p2's Characters attack my Leader. */
function defend(attackers: string[] = [C11.c3], active = 5) {
  const g = theirs(KAT, { costArea: { active, rested: 0 } }, { characters: attackers });
  attack(g, at(g, 'p2', 'characters', attackers[0]!), g.leader('p1'));
  return g;
}

describe('OP11-062 Charlotte Katakuri: DON!! -1: look at 1 card of the opponent deck, Leader +1000 this battle', () => {
  it('[When Attacking]: paying DON!! -1 returns 1 DON!!, looks at 1 opposing card and gives +1000', () => {
    const g = swing();
    need(g, 'optional', 'p1');
    yes(g);
    payDon(g, 1);
    const d = donOf(g, 'p1');
    expect(d.active + d.rested).toBe(4);
    expect(d.deck).toBe(6);
    const looks = g.events.filter((e) => e.type === 'CardsLooked');
    expect(looks).toHaveLength(1);
    expect(looks[0]!.owner).toBe('p2');
    expect(looks[0]!.count).toBe(1);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('the +1000 decides the battle: 6000 K.O.s the rested 6000 Character; 5000 would not', () => {
    const g = swing();
    yes(g);
    payDon(g, 1);
    passBlock(g);
    passCounter(g);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([C11.c4]);

    const h = swing();
    need(h, 'optional', 'p1');
    no(h);
    passBlock(h);
    passCounter(h);
    expect(h.zone('p2', 'trash')).toEqual([]);
  });

  it("looking changes nothing: the opponent's deck keeps its size and order", () => {
    const g = swing();
    yes(g);
    payDon(g, 1);
    expect(deck(g, 'p2')).toHaveLength(15);
    expect(deck(g, 'p2').slice(0, 2)).toEqual([C11.c3, C11.c5]);
  });

  it('declining: no DON!! is returned, nothing is looked at and the Leader stays at 5000', () => {
    const g = swing();
    need(g, 'optional', 'p1');
    no(g);
    expect(donOf(g, 'p1').deck).toBe(5);
    expect(g.events.some((e) => e.type === 'CardsLooked')).toBe(false);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(kind(g)).toBe('block');
  });

  it('with no DON!! on my field the cost cannot be paid', () => {
    const g = swing(0, 0);
    unusable(g, 'p1');
    expect(kind(g)).toBe('block');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('DON!! -1 can be paid with a rested DON!! when none is active', () => {
    const g = swing(0, 2);
    expect(canUse(g)).toBe(true);
    yes(g);
    expect(donOf(g, 'p1').rested).toBe(1);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('the boost ends with the battle', () => {
    const g = swing();
    yes(g);
    payDon(g, 1);
    passBlock(g);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

describe("OP11-062 Charlotte Katakuri: [On Your Opponent's Attack] and the shared [Once Per Turn]", () => {
  it("[On Your Opponent's Attack]: +1000 makes my Leader 6000 and the 5000 attack fails", () => {
    const g = defend();
    need(g, 'optional', 'p1');
    yes(g);
    payDon(g, 1);
    expect(g.power(g.leader('p1'))).toBe(6000);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('without it the same 5000 attack connects on my 5000 Leader', () => {
    const g = defend();
    need(g, 'optional', 'p1');
    no(g);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('[Once Per Turn]: used on the first opposing attack, it is not offered on the second', () => {
    const g = defend([C11.c3, C11.c2]);
    yes(g);
    payDon(g, 1);
    passBlock(g);
    passCounter(g);
    attack(g, at(g, 'p2', 'characters', C11.c2), g.leader('p1'));
    expect(canUse(g)).toBe(false);
    expect(kind(g)).toBe('block');
    expect(donOf(g, 'p1').deck).toBe(6);
  });

  it('a declined activation does not use up the [Once Per Turn]: it is offered again on the next attack', () => {
    const g = defend([C11.c3, C11.c2]);
    no(g);
    passBlock(g);
    passCounter(g);
    attack(g, at(g, 'p2', 'characters', C11.c2), g.leader('p1'));
    expect(canUse(g)).toBe(true);
  });

  it('it is also offered when the opponent attacks one of my rested Characters', () => {
    const g = theirs(
      KAT,
      { costArea: { active: 5, rested: 0 }, characters: [{ card: C11.c2, rested: true }] },
      { characters: [C11.c3] },
    );
    attack(g, at(g, 'p2', 'characters', C11.c3), at(g, 'p1', 'characters', C11.c2));
    expect(canUse(g)).toBe(true);
  });
});
