/**
 * OP18-112 Yamakaji (Yellow Character, cost 7, 7000, Counter +2000, {Vice Admiral}/{Navy}, [Blocker]).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it
 *             the new target of the attack.)"
 *
 * Rules: CR 10-1-4 (Blocker): only an active Character can block; blocking rests it; the battle is
 * then fought between the attacker and the blocker. [Unblockable] attackers cannot be blocked.
 * Scenery: OP02-006 Kingdew (7000), OP02-007 Thatch (8000), OP01-023 Marco (5000), OP18-098
 * Onigumo ([Unblockable]).
 */
import { describe, expect, it } from 'vitest';
import { act, at, attack, blockers, cardIds, kw, need, passCounter, LDR, CH } from './kit-e.ts';
import { theirsE } from './kit-e.ts';

const Y = 'OP18-112';

function defend(attacker: string, p1: object = {}) {
  const g = theirsE(LDR.luffy, { characters: [Y], ...p1 }, { characters: [attacker] });
  attack(g, at(g, 'p2', 'characters', attacker), g.leader('p1'));
  return g;
}

describe('OP18-112 Yamakaji: [Blocker]', () => {
  it('printed: keyword Blocker, 7000, cost 7', () => {
    const g = defend(CH.marco3);
    expect(kw(g, at(g, 'p1', 'characters', Y))).toContain('Blocker');
    expect(g.card(at(g, 'p1', 'characters', Y)).power).toBe(7000);
  });

  it('is offered against an attack on the Leader; blocking rests it and redirects the attack', () => {
    const g = defend(CH.marco3);
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', Y)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', Y) });
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.card(at(g, 'p1', 'characters', Y)).rested).toBe(true);
    expect(cardIds(g, 'p1', 'trash')).toEqual([]); // 5000 does not beat 7000; an attacker is never K.O.'d in a battle that it loses
    expect(cardIds(g, 'p2', 'trash')).toEqual([]);
  });

  it('boundary: against an equal-power 7000 attacker the attacker wins the tie: the blocker is K.O.’d', () => {
    const g = defend(CH.kingdew5);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', Y) });
    passCounter(g);
    expect(cardIds(g, 'p1', 'trash')).toEqual([Y]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([]);
  });

  it('an 8000 attacker K.O.s it and the Leader takes no damage', () => {
    const g = defend(CH.thatch6);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', Y) });
    passCounter(g);
    expect(cardIds(g, 'p1', 'trash')).toEqual([Y]);
    expect(g.life('p1')).toBe(4);
  });

  it('a rested Yamakaji cannot block', () => {
    const g = theirsE(
      LDR.luffy,
      { characters: [{ card: Y, rested: true }] },
      { characters: [CH.marco3] },
    );
    attack(g, at(g, 'p2', 'characters', CH.marco3), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('must not block an [Unblockable] attacker (Onigumo)', () => {
    const g = defend('OP18-098');
    expect(blockers(g)).toEqual([]);
  });

  it('the block is optional: declining takes the damage', () => {
    const g = defend(CH.marco3);
    act(g, { type: 'block', blocker: null });
    passCounter(g);
    expect(g.life('p1')).toBe(3);
    expect(g.card(at(g, 'p1', 'characters', Y)).rested).toBe(false);
  });
});
