/**
 * OP13-002 Portgas.D.Ace (Leader, Blue/Red, 6000, 3 Life, {Whitebeard Pirates}, Special).
 *
 * Card text: "[On Your Opponent's Attack] [Once Per Turn] You may trash 1 card from your hand: Give up
 * to 1 of your opponent's Leader or Character cards −2000 power during this battle."
 * "[DON!! x1] [Once Per Turn] When you take damage or your Character with 6000 base power or more
 * is K.O.'d, draw 1 card."
 *
 * Rules: the attacker wins on equal power (CR 7-1-4-1); [On Your Opponent's Attack] fires whatever
 * the target is (QA-GR); an optional cost paid from the hidden hand is offered even when
 * unpayable, with "use" illegal; "during this battle" ends with the battle; QA-OP13 OP13-002: with a
 * [Trigger] the Life card is revealed and the [Trigger] decided first, the draw comes after it
 * resolves. Double Attack as one or two damages is M6b-Q66 (open): only what both readings share is
 * asserted (a once-per-turn draw happens at most once).
 */
import { describe, expect, it } from 'vitest';
import { act, decision } from '../../helpers.ts';
import {
  activateTrigger,
  at,
  attack,
  chars,
  COST,
  hand,
  kind,
  lifeCards,
  mine,
  need,
  no,
  noDefence,
  noDefenceUntilTrigger,
  none,
  offeredInsts,
  passBlock,
  payHand,
  pickInst,
  takeDamage,
  takeMost,
  theirs,
  trash,
  V13,
  yes,
  type Spec,
} from './kit-w5b.ts';

const ACE = 'OP13-002';
const SHIKI = 'OP12-005';
/** OP11-081 Cognac Mama-Mash: Event with "[Trigger] Add up to 1 DON!! card from your DON!! deck and set it as active." */
const TRIG = 'OP11-081';

/** p2's turn: p1's Ace Leader (with `don` DON!! given) holds `hand`; p2 has 6000 attackers. */
function defend(p1: Spec = {}, p2: Spec = {}, don = 0) {
  return theirs(
    ACE,
    {
      leader: { card: ACE, don },
      hand: [V13.sai, V13.marco],
      life: [V13.mohji, V13.mohji, V13.mohji],
      deck: [V13.kingdew, V13.thatch, V13.mohji, V13.mohji],
      ...p1,
    },
    { characters: [V13.hajrudin, V13.hajrudin], ...p2 },
  );
}

const hajr = (g: ReturnType<typeof defend>, nth = 0) =>
  at(g, 'p2', 'characters', V13.hajrudin, nth);

describe("OP13-002 Portgas.D.Ace: trash 1 to give −2000 on their attack; with DON!! x1 draw when damaged or a 6000+ Character is K.O.'d", () => {
  it('printed values: Leader power 6000, 3 Life', () => {
    const g = defend();
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.life('p1')).toBe(3);
  });

  it('without using it, a 6000 attacker ties 6000 and wins: the attack connects', () => {
    const g = defend();
    attack(g, hajr(g), g.leader('p1'));
    no(g, 'p1');
    noDefence(g);
    expect(lifeCards(g)).toHaveLength(2);
  });

  it('their attack offers it; trashing 1 gives the attacker −2000 and the 6000 attack no longer beats 6000', () => {
    const g = defend();
    attack(g, hajr(g), g.leader('p1'));
    yes(g, 'p1');
    payHand(g, [V13.sai]);
    need(g, 'choose', 'p1');
    pickInst(g, [hajr(g)]);
    expect(g.power(hajr(g))).toBe(4000);
    expect(trash(g, 'p1')).toEqual([V13.sai]);
    noDefence(g);
    expect(lifeCards(g)).toHaveLength(3);
  });

  it('the target is any opposing Leader or Character, never one of mine', () => {
    const g = defend();
    attack(g, hajr(g), g.leader('p1'));
    yes(g, 'p1');
    payHand(g, [V13.sai]);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([g.leader('p2'), hajr(g, 0), hajr(g, 1)].sort());
    expect(offeredInsts(g)).not.toContain(g.leader('p1'));
  });

  it('"up to 1": the target may be left empty (the cost is paid, no power changes)', () => {
    const g = defend();
    attack(g, hajr(g), g.leader('p1'));
    yes(g, 'p1');
    payHand(g, [V13.sai]);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(hajr(g))).toBe(6000);
  });

  it('"during this battle": the −2000 is gone after the battle', () => {
    const g = defend();
    attack(g, hajr(g), g.leader('p1'));
    yes(g, 'p1');
    payHand(g, [V13.sai]);
    pickInst(g, [hajr(g)]);
    noDefence(g);
    need(g, 'main', 'p2');
    expect(g.power(hajr(g))).toBe(6000);
  });

  it('[Once Per Turn]: a second attack in the same turn does not offer it again', () => {
    const g = defend();
    attack(g, hajr(g, 0), g.leader('p1'));
    yes(g, 'p1');
    payHand(g, [V13.sai]);
    pickInst(g, [hajr(g, 0)]);
    noDefence(g);
    need(g, 'main', 'p2');
    attack(g, hajr(g, 1), g.leader('p1'));
    expect(kind(g)).toBe('block');
    expect(hand(g, 'p1')).toEqual([V13.marco]);
  });

  it('the trash is a cost: with an empty hand it is offered but cannot be used', () => {
    const g = defend({ hand: [] });
    attack(g, hajr(g), g.leader('p1'));
    const d = decision(g);
    expect(d?.kind).toBe('optional');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    act(g, { type: 'optional', accept: false });
    expect(kind(g)).toBe('block');
  });

  it('[DON!! x1]: with 1 DON!! given, taking damage draws 1 card', () => {
    const g = defend({}, {}, 1);
    attack(g, hajr(g), g.leader('p1'));
    no(g, 'p1');
    noDefence(g);
    expect(lifeCards(g)).toHaveLength(2);
    // The Life card (Mohji) is added to the hand by the damage; Kingdew is the draw.
    expect(hand(g, 'p1')).toEqual([V13.sai, V13.marco, V13.mohji, V13.kingdew].sort());
  });

  it('without DON!! given the draw does not happen', () => {
    const g = defend({}, {}, 0);
    attack(g, hajr(g), g.leader('p1'));
    no(g, 'p1');
    noDefence(g);
    expect(lifeCards(g)).toHaveLength(2);
    expect(hand(g, 'p1')).toEqual([V13.sai, V13.marco, V13.mohji].sort());
  });

  it('[Once Per Turn]: two damages in one turn draw only once', () => {
    const g = defend({}, {}, 1);
    attack(g, hajr(g, 0), g.leader('p1'));
    no(g, 'p1');
    noDefence(g);
    need(g, 'main', 'p2');
    attack(g, hajr(g, 1), g.leader('p1'));
    no(g, 'p1');
    passBlock(g);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(lifeCards(g)).toHaveLength(1);
    // 2 in hand + 2 Life cards taken + exactly 1 draw.
    expect(hand(g, 'p1')).toHaveLength(5);
  });

  it('with a [Trigger] on the Life card the Trigger is decided first; the draw comes after it resolves', () => {
    const g = defend(
      { life: [TRIG, V13.mohji, V13.mohji], costArea: { active: 0, rested: 0 } },
      {},
      1,
    );
    attack(g, hajr(g), g.leader('p1'));
    no(g, 'p1');
    noDefenceUntilTrigger(g);
    need(g, 'trigger', 'p1');
    expect(hand(g, 'p1')).toEqual([V13.sai, V13.marco].sort());
    expect(g.eventsOfType('CardDrawn')).toHaveLength(0);
    activateTrigger(g);
    takeMost(g);
    // The Trigger resolved (a DON!! card was added), the Event went to the trash, then Ace drew.
    expect(trash(g, 'p1')).toEqual([TRIG]);
    expect(hand(g, 'p1')).toEqual([V13.sai, V13.marco, V13.kingdew].sort());
  });

  it("[DON!! x1]: a Character with 6000 base power K.O.'d in battle draws 1 card", () => {
    const g = defend(
      { characters: [{ card: V13.hajrudin, rested: true }] },
      { characters: [SHIKI] },
      1,
    );
    attack(g, at(g, 'p2', 'characters', SHIKI), at(g, 'p1', 'characters', V13.hajrudin));
    no(g, 'p1');
    noDefence(g);
    expect(chars(g, 'p1')).toEqual([]);
    expect(hand(g, 'p1')).toContain(V13.kingdew);
    expect(hand(g, 'p1')).toHaveLength(3);
  });

  it("boundary: a Character with 5000 base power K.O.'d draws nothing", () => {
    const g = defend(
      { characters: [{ card: V13.marco, rested: true }] },
      { characters: [SHIKI] },
      1,
    );
    attack(g, at(g, 'p2', 'characters', SHIKI), at(g, 'p1', 'characters', V13.marco));
    no(g, 'p1');
    noDefence(g);
    expect(chars(g, 'p1')).toEqual([]);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it("a 6000-power Character K.O.'d without DON!! x1 on the Leader draws nothing", () => {
    const g = defend(
      { characters: [{ card: V13.hajrudin, rested: true }] },
      { characters: [SHIKI] },
      0,
    );
    attack(g, at(g, 'p2', 'characters', SHIKI), at(g, 'p1', 'characters', V13.hajrudin));
    no(g, 'p1');
    noDefence(g);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it("must not: the opposing Character K.O.'d on my turn draws nothing for me", () => {
    const g = mine(
      { card: ACE, don: 1 },
      { hand: [V13.sai], characters: [SHIKI], costArea: { active: 5, rested: 0 } },
      { characters: [{ card: COST.c6, rested: true }] },
    );
    attack(g, at(g, 'p1', 'characters', SHIKI), at(g, 'p2', 'characters', COST.c6));
    noDefence(g);
    expect(chars(g, 'p2')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([V13.sai]);
  });
});
