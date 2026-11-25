/**
 * OP11-073 Charlotte Linlin (Character, Purple, cost 10, 12000, no Counter, {The Four Emperors}/
 * {Big Mom Pirates}).
 *
 * Card text: "If your Leader has the "Big Mom Pirates" type, this Character gains [Rush]."
 * "[On Your Opponent's Attack] [Once Per Turn] DON!! −5: Choose a cost and reveal 1 card from the
 * top of your opponent's deck. If the revealed card has the chosen cost, up to 1 of your Leader
 * gains +2000 power during this turn."
 *
 * Rules: [Rush] lets a Character attack the turn it is played (CR 10-1-1); an auto effect with a
 * cost asks first and its DON!! −5 is paid on "use" (DECISIONS 2026-10-29); [On Your Opponent's
 * Attack] fires whatever the target is (QA-GR); "during this turn" lasts to the end of the
 * opponent's turn when it is created there; the attacker wins on equal power.
 */
import { describe, expect, it } from 'vitest';
import { act, decision } from '../../helpers.ts';
import {
  at,
  atMain,
  attack,
  canHit,
  chooseCost,
  COST,
  deckWith,
  don,
  kind,
  kw,
  LW,
  mine,
  need,
  no,
  noDefence,
  none,
  offeredInsts,
  pickInst,
  playRaw,
  lifeCards,
  theirs,
  V13,
  yes,
  askingCost,
  passBlock,
  takeDamage,
} from './kit-w5b.ts';

const LINLIN = 'OP11-073';

/** p2's turn: p1 has Linlin and the given DON!!; p2 has two 6000 attackers and a known deck top. */
function defend(top: string, active = 10, rested = 0, leader: string = LW.bmp) {
  return theirs(
    leader,
    { characters: [LINLIN], costArea: { active, rested } },
    { characters: [V13.hajrudin, V13.hajrudin], deck: deckWith(top) },
  );
}

const hit = (g: ReturnType<typeof defend>, nth = 0, target = g.leader('p1')) =>
  attack(g, at(g, 'p2', 'characters', V13.hajrudin, nth), target);

describe('OP11-073 Charlotte Linlin: [Rush] with a Big Mom Pirates Leader; DON!! −5 on their attack, choose a cost, Leader +2000', () => {
  it('printed values: cost 10, 12000 power, no Counter', () => {
    const g = defend(COST.c3);
    const c = g.card(at(g, 'p1', 'characters', LINLIN));
    expect(c.cost).toBe(10);
    expect(g.power(c.instance)).toBe(12000);
    expect(c.counter ?? null).toBeNull();
  });

  it('with a {Big Mom Pirates} Leader it has [Rush]: played this turn, it can attack at once', () => {
    const g = mine(LW.bmp, { hand: [LINLIN] }, {});
    playRaw(g, LINLIN);
    expect(atMain(g)).toBe(true);
    const l = at(g, 'p1', 'characters', LINLIN);
    expect(kw(g, l)).toContain('Rush');
    expect(canHit(g, l, g.leader('p2'))).toBe(true);
  });

  it('with any other Leader it has no [Rush] and cannot attack the turn it is played', () => {
    for (const leader of [LW.luffy, LW.shanks]) {
      const g = mine(leader, { hand: [LINLIN] }, {});
      playRaw(g, LINLIN);
      const l = at(g, 'p1', 'characters', LINLIN);
      expect(kw(g, l)).not.toContain('Rush');
      expect(canHit(g, l, g.leader('p2'))).toBe(false);
    }
  });

  it('their attack offers the effect; on a match my Leader has 7000 and a 6000 attacker is stopped', () => {
    const g = defend(COST.c3);
    hit(g);
    yes(g, 'p1');
    chooseCost(g, 3);
    // "up to 1 of your Leader": the only candidate is my Leader.
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([g.leader('p1')]);
    pickInst(g, [g.leader('p1')]);
    expect(kind(g)).toBe('block');
    expect(g.power(g.leader('p1'))).toBe(7000);
    noDefence(g);
    expect(lifeCards(g)).toHaveLength(4);
  });

  it('"up to 1": on a match I may choose no Leader and then nothing is boosted', () => {
    const g = defend(COST.c3);
    hit(g);
    yes(g, 'p1');
    chooseCost(g, 3);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    noDefence(g);
    expect(lifeCards(g)).toHaveLength(3);
  });

  it('DON!! −5 is paid on use: five DON!! go back to the DON!! deck', () => {
    const g = defend(COST.c3);
    hit(g);
    yes(g, 'p1');
    expect(don(g, 'p1')).toMatchObject({ active: 5, deck: 5 });
    expect(askingCost(g)).toBe(true);
  });

  it('a miss: the DON!! are still gone, the Leader stays at 5000 and the 6000 attack connects', () => {
    const g = defend(COST.c3);
    hit(g);
    yes(g, 'p1');
    chooseCost(g, 5);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(don(g, 'p1').deck).toBe(5);
    noDefence(g);
    expect(lifeCards(g)).toHaveLength(3);
  });

  it('may be declined: no DON!! returned, no number asked', () => {
    const g = defend(COST.c3);
    hit(g);
    no(g, 'p1');
    expect(askingCost(g)).toBe(false);
    expect(don(g, 'p1')).toMatchObject({ active: 10, deck: 0 });
    expect(kind(g)).toBe('block');
  });

  it('with fewer than 5 DON!! on my field the effect cannot be used', () => {
    const g = defend(COST.c3, 4, 0);
    hit(g);
    const d = decision(g);
    if (d?.kind === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      act(g, { type: 'optional', accept: false });
    }
    expect(askingCost(g)).toBe(false);
    expect(don(g, 'p1').deck).toBe(6);
  });

  it('exactly 5 DON!! is enough', () => {
    const g = defend(COST.c3, 5, 0);
    hit(g);
    yes(g, 'p1');
    chooseCost(g, 3);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 0, deck: 10 });
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('fires whatever is attacked: an attack on my rested Character offers it too', () => {
    const g = theirs(
      LW.bmp,
      {
        characters: [LINLIN, { card: V13.marco, rested: true }],
        costArea: { active: 10, rested: 0 },
      },
      { characters: [V13.hajrudin], deck: deckWith(COST.c3) },
    );
    attack(g, at(g, 'p2', 'characters', V13.hajrudin), at(g, 'p1', 'characters', V13.marco));
    need(g, 'optional', 'p1');
  });

  it('[Once Per Turn]: a second attack in the same turn does not offer it again, and the +2000 is still there', () => {
    const g = defend(COST.c3);
    hit(g, 0);
    yes(g, 'p1');
    chooseCost(g, 3);
    pickInst(g, [g.leader('p1')]);
    noDefence(g);
    need(g, 'main', 'p2');
    expect(don(g, 'p1').active).toBe(5);
    hit(g, 1);
    // Not offered again although 5 DON!! are left.
    expect(kind(g)).toBe('block');
    expect(g.power(g.leader('p1'))).toBe(7000);
    passBlock(g);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(lifeCards(g)).toHaveLength(4);
  });

  it('"during this turn": the +2000 is gone on my own turn', () => {
    const g = defend(COST.c3);
    hit(g);
    yes(g, 'p1');
    chooseCost(g, 3);
    pickInst(g, [g.leader('p1')]);
    noDefence(g);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
