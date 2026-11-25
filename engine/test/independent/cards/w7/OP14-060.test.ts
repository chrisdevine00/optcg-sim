/**
 * OP14-060 Donquixote Doflamingo (Leader, Purple, 5000 power, 5 Life, <Special>, {Donquixote
 * Pirates}{The Seven Warlords of the Sea}).
 *
 * Card text: "[On Your Opponent's Attack] [Once Per Turn] DON!! −1: Select your Leader or 1 of your
 * {Donquixote Pirates} type Characters. Change the attack target to the selected card."
 *
 * Rules used: [On Your Opponent's Attack] fires when the opponent declares an attack (not on my
 * own attacks); "DON!! −1:" is an activation cost that returns 1 DON!! from the field to the DON!!
 * deck and may be declined; [Once Per Turn] limits it to one use per turn; the new target takes the
 * battle (a Leader battle deals damage to the Life, a Character battle K.O.s by power); the Block
 * Step comes after the target is changed (CR 7-1-1, the effect resolves before the Block Step).
 * Not used: `mine`/`theirs` of the m4b kit (they strip this Leader's ability).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, blockers, cardIds, decision } from '../../helpers.ts';
import { accept, choices, decline, kind } from '../kit.ts';
import { canAccept, dons, mine7, need, now, S7, theirs7 } from './kit-w7b.ts';

const DOFFY = 'OP14-060';
const dq = S7.dq4; // OP10-073 Buffalo: {Donquixote Pirates}, cost 4, 6000
const dq2 = S7.dq3; // OP05-035 Bellamy: {Donquixote Pirates}, cost 3, 5000
const other = S7.marco; // OP01-023 Marco: not a {Donquixote Pirates}, 5000
const ATTACKER = S7.kingdew; // OP02-006 Kingdew, 7000, vanilla

/** p2's turn: p1 Doflamingo with 3 active DON!! and the given Characters; p2 has Kingdew (and more). */
function game(p1: Parameters<typeof theirs7>[1] = {}, p2: Parameters<typeof theirs7>[2] = {}) {
  return theirs7(
    DOFFY,
    { costArea: { active: 3, rested: 0 }, ...p1 },
    { characters: [ATTACKER], ...p2 },
  );
}

/** p2's Kingdew attacks `target` (a card of p1). Stops at the first decision p1 owes. */
function attackTarget(g: ReturnType<typeof game>, target: string) {
  attack(g, g.find('p2', 'characters', ATTACKER), target);
}

function useAbility(g: ReturnType<typeof game>) {
  need(g, 'optional', 'p1');
  accept(g);
}

/** Pick the new target of the attack. */
function redirectTo(g: ReturnType<typeof game>, target: string) {
  // An "exactly 1" pick with a single candidate (only the Leader) is made without a prompt.
  if (kind(g) !== 'choose') {
    expect(choices(g)).toEqual([]);
    expect(target).toBe(g.leader('p1'));
    return;
  }
  act(g, { type: 'pick', choice: target });
}

/** Block step: no block, then the Counter Step ends; Life damage is taken without [Trigger]. */
function resolveBattle(g: ReturnType<typeof game>) {
  need(g, 'block', 'p1');
  act(g, { type: 'block', blocker: null });
  act(g, { type: 'endCounter' });
  while (decision(g)?.kind === 'trigger') act(g, { type: 'trigger', activate: false });
}

describe("OP14-060 Donquixote Doflamingo: [On Your Opponent's Attack] [Once Per Turn] DON!! −1: change the attack target to my Leader or one of my {Donquixote Pirates} Characters", () => {
  it('printed values: Leader, 5000 power, 5 Life', () => {
    const g = mine7(DOFFY, { life: undefined });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.card(g.leader('p1')).card).toBe(DOFFY);
  });

  it('an attack on one of my Characters: the ability is offered when it is declared', () => {
    const g = game({ characters: [{ card: other, rested: true }] });
    attackTarget(g, g.find('p1', 'characters', other));
    need(g, 'optional', 'p1');
    expect(canAccept(g)).toBe(true);
  });

  it('redirect to my Leader: the Leader takes the battle (a Life card is lost) and the Character is not touched', () => {
    const g = game({ characters: [{ card: other, rested: true }] });
    attackTarget(g, g.find('p1', 'characters', other));
    useAbility(g);
    redirectTo(g, g.leader('p1'));
    resolveBattle(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([other]);
    expect(g.life('p1')).toBe(3);
  });

  it('redirect to a {Donquixote Pirates} Character, rested or active: that Character takes the battle and is K.O.d by 7000 power', () => {
    const g = game({
      characters: [{ card: other, rested: true }, { card: dq, rested: true }, dq2],
    });
    attackTarget(g, g.find('p1', 'characters', other));
    useAbility(g);
    expect(choices(g)).toContain(g.find('p1', 'characters', dq));
    expect(choices(g)).toContain(g.find('p1', 'characters', dq2));
    redirectTo(g, g.find('p1', 'characters', dq));
    resolveBattle(g);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([other, dq2].sort());
    expect(cardIds(g, 'p1', 'trash')).toEqual([dq]);
    expect(g.life('p1')).toBe(4);
  });

  it('the candidates are the Leader and the {Donquixote Pirates} Characters only: a Character of another type is not offered', () => {
    const g = game({
      characters: [
        { card: other, rested: true },
        { card: dq, rested: true },
      ],
    });
    attackTarget(g, g.find('p1', 'characters', other));
    useAbility(g);
    expect(choices(g).sort()).toEqual([g.leader('p1'), g.find('p1', 'characters', dq)].sort());
  });

  it('the cost: 1 DON!! goes back to the DON!! deck', () => {
    const g = game({ characters: [{ card: other, rested: true }] });
    expect(dons(g)).toMatchObject({ active: 3, deck: 7 });
    attackTarget(g, g.find('p1', 'characters', other));
    useAbility(g);
    expect(dons(g)).toMatchObject({ active: 2, deck: 8 });
  });

  it('declining: the attack stays on the original target (the Character is K.O.d), the DON!! are kept', () => {
    const g = game({ characters: [{ card: other, rested: true }] });
    attackTarget(g, g.find('p1', 'characters', other));
    need(g, 'optional', 'p1');
    decline(g);
    resolveBattle(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(dons(g)).toMatchObject({ active: 3, deck: 7 });
  });

  it('an attack on my Leader may be redirected to a {Donquixote Pirates} Character', () => {
    const g = game({ characters: [dq] });
    attackTarget(g, g.leader('p1'));
    useAbility(g);
    redirectTo(g, g.find('p1', 'characters', dq));
    resolveBattle(g);
    expect(g.life('p1')).toBe(4);
    expect(cardIds(g, 'p1', 'trash')).toEqual([dq]);
  });

  it('choosing the Leader when the Leader is already the target changes nothing: the Leader is hit', () => {
    const g = game();
    attackTarget(g, g.leader('p1'));
    useAbility(g);
    redirectTo(g, g.leader('p1'));
    resolveBattle(g);
    expect(g.life('p1')).toBe(3);
  });

  it('no DON!! on the field: the cost cannot be paid, accepting is not legal (the attack simply goes on)', () => {
    const g = game({
      costArea: { active: 0, rested: 0 },
      characters: [{ card: other, rested: true }],
    });
    attackTarget(g, g.find('p1', 'characters', other));
    if (kind(g) === 'optional') {
      expect(canAccept(g)).toBe(false);
      decline(g);
    }
    need(g, 'block', 'p1');
  });

  it('rested DON!! can pay the −1 too (DON!! −1 takes it from the cost area, active or rested)', () => {
    const g = game({
      costArea: { active: 0, rested: 2 },
      characters: [{ card: other, rested: true }],
    });
    attackTarget(g, g.find('p1', 'characters', other));
    need(g, 'optional', 'p1');
    expect(canAccept(g)).toBe(true);
    accept(g);
    expect(dons(g)).toMatchObject({ rested: 1, deck: 9 });
  });

  it('[Once Per Turn]: a second attack in the same turn does not offer it again', () => {
    const g = game(
      {
        characters: [
          { card: other, rested: true },
          { card: S7.sai, rested: true },
        ],
      },
      { characters: [ATTACKER, S7.hajrudin] },
    );
    attackTarget(g, g.find('p1', 'characters', other));
    useAbility(g);
    redirectTo(g, g.leader('p1'));
    resolveBattle(g);
    need(g, 'main', 'p2');
    attack(g, g.find('p2', 'characters', S7.hajrudin), g.find('p1', 'characters', S7.sai));
    expect(kind(g), now(g)).toBe('block');
  });

  it('a declined use does not spend it: the second attack of the turn offers it again', () => {
    const g = game(
      {
        characters: [
          { card: other, rested: true },
          { card: S7.sai, rested: true },
        ],
      },
      { characters: [ATTACKER, S7.hajrudin] },
    );
    attackTarget(g, g.find('p1', 'characters', other));
    need(g, 'optional', 'p1');
    decline(g);
    resolveBattle(g);
    attack(g, g.find('p2', 'characters', S7.hajrudin), g.find('p1', 'characters', S7.sai));
    need(g, 'optional', 'p1');
  });

  it('the Block Step comes after the change: a [Blocker] of mine can block the redirected attack', () => {
    const g = game({ characters: [{ card: other, rested: true }, S7.blocker] });
    attackTarget(g, g.find('p1', 'characters', other));
    useAbility(g);
    redirectTo(g, g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toContain(g.find('p1', 'characters', S7.blocker));
  });

  it('my own attacks do not trigger it: on my turn, attacking gives me no question', () => {
    const g = mine7(
      DOFFY,
      { characters: [S7.marco] },
      { characters: [{ card: S7.sai, rested: true }] },
    );
    attack(g, g.find('p1', 'characters', S7.marco), g.find('p2', 'characters', S7.sai));
    expect(kind(g)).not.toBe('optional');
  });
});
