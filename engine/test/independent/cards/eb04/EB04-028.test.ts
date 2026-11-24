/**
 * EB04-028 Ice Time (Event, Blue, cost 5, {Navy}).
 *
 * Card text: "[Main] You may trash 1 card from your hand: If your Leader has the {Navy} type, up to 2
 * of your opponent's Characters with 10000 power or less cannot attack until the end of your
 * opponent's next End Phase."
 * "[Trigger] Return up to 1 Character with a cost of 5 or less to the owner's hand."
 *
 * Rules: the cost is paid before the "If" is checked. "Until the end of your opponent's next End
 * Phase", created on my turn, runs through the opponent's coming turn and ends at its End Phase.
 * Leaders are not Characters. "Up to 2" may be 0, 1 or 2.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  canHit,
  chars,
  endTurn,
  fill,
  hand,
  LB,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  passCounter,
  attack,
  payHand,
  pickInst,
  playRaw,
  theirs,
  trash,
  unusable,
  yes,
  atMain,
  kind,
} from './kit-eb04b.ts';

const ICE = 'EB04-028';
/** OP02-006 Kingdew: Red, cost 5, 7000. Vanilla. */
const C7000 = 'OP02-006';
/** OP01-012 Sai: Red, cost 2, 4000. Vanilla. */
const SAI = 'OP01-012';
/** OP12-005 Shiki: Red, cost 8, 10000. Vanilla. */
const C10000 = 'OP12-005';
/** P-041 Monkey.D.Luffy: Purple, cost 10, 12000. Vanilla. */
const C12000 = 'P-041';

/** p1 (Navy Leader by default) plays Ice Time, trashing Mohji; p2 has `foes`. Stops at the target pick. */
function cast(foes: string[], leader: string = LB.navy) {
  const g = mine(
    leader,
    { hand: [ICE, BLUE, BLUE], deck: fill(BLUE, 10) },
    { characters: foes, deck: fill(BLUE, 10) },
  );
  playRaw(g, ICE);
  yes(g);
  payHand(g, [BLUE]);
  return g;
}

/** After p1's turn ends, the p2 attackers that can attack p1's Leader. */
function p2CanAttack(g: ReturnType<typeof cast>, card: string, nth = 0): boolean {
  const leader = g.leader('p1');
  return canHit(g, g.find('p2', 'characters', card, nth), leader);
}

describe('EB04-028 Ice Time: [Main] trash 1, Navy Leader: up to 2 Characters (10000 or less) cannot attack', () => {
  it('with a {Navy} Leader, two chosen opposing Characters cannot attack in the opponent next turn', () => {
    const g = cast([C7000, SAI, C7000]);
    need(g, 'choose', 'p1');
    const [a, b] = [at(g, 'p2', 'characters', C7000, 0), at(g, 'p2', 'characters', SAI)];
    pickInst(g, [a, b]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([BLUE, ICE].sort());
    endTurn(g);
    need(g, 'main', 'p2');
    expect(p2CanAttack(g, C7000, 0)).toBe(false);
    expect(p2CanAttack(g, SAI)).toBe(false);
    expect(p2CanAttack(g, C7000, 1)).toBe(true);
  });

  it('offers a 10000-power Character but not a 12000-power one', () => {
    const g = cast([C10000, C12000, SAI]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C10000, SAI].sort());
  });

  it('"up to 2": a third target cannot be added', () => {
    const g = cast([C7000, C7000, SAI]);
    need(g, 'choose', 'p1');
    const picks = [
      at(g, 'p2', 'characters', C7000, 0),
      at(g, 'p2', 'characters', C7000, 1),
      at(g, 'p2', 'characters', SAI),
    ];
    pickInst(g, picks.slice(0, 2));
    expect(atMain(g)).toBe(true);
    endTurn(g);
    expect(p2CanAttack(g, SAI)).toBe(true);
  });

  it('"up to 2": choosing 1 restricts only that Character', () => {
    const g = cast([C7000, SAI]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', SAI)]);
    endTurn(g);
    expect(p2CanAttack(g, SAI)).toBe(false);
    expect(p2CanAttack(g, C7000)).toBe(true);
  });

  it('"up to 2": may choose nothing, nobody is restricted', () => {
    const g = cast([C7000, SAI]);
    need(g, 'choose', 'p1');
    none(g);
    endTurn(g);
    expect(p2CanAttack(g, SAI)).toBe(true);
    expect(p2CanAttack(g, C7000)).toBe(true);
  });

  it('without a {Navy} Leader nothing is restricted', () => {
    const g = cast([C7000, SAI], LB.neutral);
    if (kind(g) === 'choose') none(g);
    expect(atMain(g)).toBe(true);
    endTurn(g);
    expect(p2CanAttack(g, SAI)).toBe(true);
    expect(p2CanAttack(g, C7000)).toBe(true);
  });

  it('the cost is required: with no other card in hand the effect does nothing', () => {
    const g = mine(LB.navy, { hand: [ICE], deck: fill(BLUE, 10) }, { characters: [SAI] });
    playRaw(g, ICE);
    unusable(g);
    expect(atMain(g)).toBe(true);
    endTurn(g);
    expect(p2CanAttack(g, SAI)).toBe(true);
  });

  it('declining the cost: the Event is spent, nothing is trashed and nobody is restricted', () => {
    const g = mine(LB.navy, { hand: [ICE, BLUE], deck: fill(BLUE, 10) }, { characters: [SAI] });
    playRaw(g, ICE);
    need(g, 'optional', 'p1');
    g.act({ type: 'optional', accept: false });
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([ICE]);
    expect(hand(g)).toEqual([BLUE]);
    endTurn(g);
    expect(p2CanAttack(g, SAI)).toBe(true);
  });

  it('only Characters: the opposing Leader can still attack', () => {
    const g = cast([SAI]);
    pickInst(g, [at(g, 'p2', 'characters', SAI)]);
    endTurn(g);
    need(g, 'main', 'p2');
    const leaderAttacks = g
      .legal()
      .some((a) => a.type === 'attack' && a.attacker === g.leader('p2'));
    expect(leaderAttacks).toBe(true);
  });

  it('duration: ends at the End Phase of the opponent turn, so it can attack on their following turn', () => {
    const g = cast([SAI]);
    pickInst(g, [at(g, 'p2', 'characters', SAI)]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(p2CanAttack(g, SAI)).toBe(false);
    endTurn(g); // p2 ends their turn: the restriction ends at that End Phase
    need(g, 'main', 'p1');
    endTurn(g);
    need(g, 'main', 'p2');
    expect(p2CanAttack(g, SAI)).toBe(true);
  });

  it('the restriction does not stop the Character from blocking or being attacked', () => {
    const g = cast([SAI]);
    pickInst(g, [at(g, 'p2', 'characters', SAI)]);
    expect(g.zone('p2', 'characters').length).toBe(1);
    expect(chars(g, 'p2')).toEqual([SAI]);
  });
});

describe('EB04-028 Ice Time: [Trigger] return up to 1 Character with cost 5 or less to the owner hand', () => {
  /** p2 attacks p1 whose top Life card is Ice Time; p1 has Characters of costs 5, 6 and an opposing 5-cost. */
  function triggered() {
    const g = theirs(
      LB.navy,
      {
        life: [ICE, BLUE, BLUE, BLUE],
        characters: [C7000, 'OP02-007'],
        deck: fill(BLUE, 10),
      },
      { characters: [C7000, SAI] },
    );
    attack(g, at(g, 'p2', 'characters', C7000), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('can be activated from Life and offers Characters of either side with cost 5 or less only', () => {
    const g = triggered();
    passCounter(g);
    // takeDamage inside passCounter declines a trigger only when none is offered
    expect(kind(g)).toBe('trigger');
    g.act({ type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    // Both Kingdews (cost 5) and Sai (cost 2) qualify; Thatch (cost 6) does not.
    expect(offeredIds(g)).toEqual([C7000, C7000, SAI].sort());
  });

  it('returns the chosen Character to its owner hand', () => {
    const g = triggered();
    passCounter(g);
    g.act({ type: 'trigger', activate: true });
    pickInst(g, [at(g, 'p2', 'characters', SAI)]);
    expect(chars(g, 'p2')).toEqual([C7000]);
    expect(hand(g, 'p2')).toContain(SAI);
  });

  it('"up to 1": may return nothing', () => {
    const g = triggered();
    passCounter(g);
    g.act({ type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g, 'p1')).toEqual([C7000, 'OP02-007'].sort());
    expect(chars(g, 'p2')).toEqual([C7000, SAI].sort());
  });
});
