/**
 * OP11-084 Kuzan (Character, Black, cost 4, 5000, Counter +1000, {Navy}).
 *
 * Card text: "[On Play] Trash 3 cards from the top of your deck.
 * [When Attacking] Up to 1 of your "Navy" type Leader or Character cards can also attack active
 * Characters during this turn."
 *
 * Rules: CR 8-4-4 ("up to"), RL-17 (the grant does not lift summoning sickness or other attack
 * restrictions), CR 7-1 (attacks), RL-26 (a player whose deck reaches 0 loses: tests keep decks > 3).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  canHit,
  cnt,
  deckSize,
  kind,
  LD11,
  mayChooseNone,
  me,
  need,
  noDefence,
  none,
  offeredIds,
  pickInst,
  playRaw,
  result,
  SC11,
  trash,
} from './kit-op11c.ts';

const ID = 'OP11-084';

describe('OP11-084 Kuzan: trash 3 on play; when attacking a {Navy} Leader/Character may also attack active Characters', () => {
  it('[On Play] trashes the top 3 cards of my deck (in order from the top)', () => {
    const g = me(LD11.navy, { hand: [ID], deck: [SC11.r1, SC11.r2, SC11.r3, SC11.r4, SC11.r5] });
    playRaw(g, ID);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([SC11.r1, SC11.r2, SC11.r3].sort());
    expect(deckSize(g)).toBe(2);
  });

  it('[On Play] with a deck of exactly 4 leaves 1 card and the game goes on', () => {
    const g = me(LD11.navy, { hand: [ID], deck: [SC11.r1, SC11.r2, SC11.r3, SC11.r4] });
    playRaw(g, ID);
    expect(deckSize(g)).toBe(1);
    expect(kind(g)).toBe('main');
  });

  it('RL-26: a deck of exactly 3 is emptied by the [On Play] and I lose', () => {
    const g = me(LD11.navy, { hand: [ID], deck: [SC11.r1, SC11.r2, SC11.r3] });
    playRaw(g, ID);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });

  it('[On Play] is not "up to" and "you may": no prompt, it just trashes 3', () => {
    const g = me(LD11.navy, { hand: [ID], deck: [SC11.r1, SC11.r2, SC11.r3, SC11.r4, SC11.r5] });
    playRaw(g, ID);
    expect(kind(g)).toBe('main');
    expect(cnt(g, 'p1', 'trash')).toBe(3);
  });

  function attacking(o: { leader?: string; mates?: string[] } = {}) {
    const g = me(
      o.leader ?? LD11.navy,
      { characters: [ID, ...(o.mates ?? [SC11.navyB3])] },
      { characters: [SC11.r3, SC11.r2] },
    );
    attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
    return g;
  }

  it('[When Attacking] offers my {Navy} Leader and {Navy} Characters (Kuzan himself too), not other Characters', () => {
    const g = attacking({ mates: [SC11.navyB3, SC11.r4] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([LD11.navy, ID, SC11.navyB3].sort());
  });

  it('printed effect: granting my Leader lets it attack an active Character after this battle', () => {
    const g = attacking();
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    noDefence(g);
    need(g, 'main', 'p1');
    expect(canHit(g, g.leader('p1'), at(g, 'p2', 'characters', SC11.r3))).toBe(true);
  });

  it('granting a {Navy} Character lets it attack an active Character; the others cannot', () => {
    const g = attacking();
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', SC11.navyB3)]);
    noDefence(g);
    const foe = at(g, 'p2', 'characters', SC11.r3);
    expect(canHit(g, at(g, 'p1', 'characters', SC11.navyB3), foe)).toBe(true);
    expect(canHit(g, g.leader('p1'), foe)).toBe(false);
  });

  it('"up to 1": granting nobody leaves active Characters safe', () => {
    const g = attacking();
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    noDefence(g);
    expect(canHit(g, g.leader('p1'), at(g, 'p2', 'characters', SC11.r3))).toBe(false);
    expect(
      canHit(g, at(g, 'p1', 'characters', SC11.navyB3), at(g, 'p2', 'characters', SC11.r3)),
    ).toBe(false);
  });

  it('with a non-{Navy} Leader the Leader is not offered', () => {
    const g = attacking({ leader: LD11.plain });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(LD11.plain);
    expect(offeredIds(g)).toContain(ID);
  });

  it('only 1 target is granted', () => {
    const g = attacking();
    const d = need(g, 'choose', 'p1');
    expect(d.max).toBe(1);
  });

  it('the grant ends with the turn: next turn the Leader cannot attack the active Character', () => {
    const g = attacking();
    pickInst(g, [g.leader('p1')]);
    noDefence(g);
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(canHit(g, g.leader('p1'), at(g, 'p2', 'characters', SC11.r3))).toBe(false);
  });
});
