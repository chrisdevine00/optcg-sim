/**
 * ST36-005 Eustass"Captain"Kid (Character, Yellow, cost 6, 7000, <Special>, {Kid Pirates}
 * {Supernovas}).
 *
 * Card text: "[On Your Opponent's Attack] [Once Per Turn] You may turn 1 card from the top or bottom of
 * your Life cards face-down: Change the target of the attack to your [Eustass"Captain"Kid] with
 * 5000 base power or more. [Activate: Main] [Once Per Turn] You may turn 1 card from the top or
 * bottom of your Life cards face-up: Give up to 1 rested DON!! card to your Leader."
 *
 * Rules used: asking a card to change into the state it is already in does nothing and counts as
 * not performed (rules digest 10), so a face-up card cannot be turned face-up (cost not payable);
 * only the top and bottom cards are eligible; a face-up Life card is public and a face-down one is
 * hidden; a card's base power is its printed power (M6b-Q86 for the open parts: whether the cost
 * is checked before a target exists, and whether a Kid Leader counts, are not asserted).
 */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import { act, attack, cardIds, decision } from '../../helpers.ts';
import { abilities, accept, canActivate, choices, decline, kind, optionChoices } from '../kit.ts';
import { canAccept, canDone, done, dons, mine7, need, now, S7, theirs7 } from './kit-w7b.ts';

const KID = 'ST36-005';
const A = S7.marco; // OP01-023
const B = S7.sai; // OP01-012
const C = S7.komachiyo; // OP01-010
const ATTACKER = S7.hajrudin; // OP01-018, 6000 power: does not K.O. a 7000 Kid

const up = (card: string) => ({ card, faceUp: true });
const faceStates = (
  g: { zone: (p: 'p1' | 'p2', z: 'life') => { faceUp: boolean }[] },
  who: 'p1' | 'p2' = 'p1',
) => g.zone(who, 'life').map((c) => c.faceUp);

/** If the engine asks which end, answer `end`; if it does not ask, do nothing. */
function endIfAsked(g: ReturnType<typeof mine7>, end: 'top' | 'bottom') {
  if (kind(g) === 'choose' && optionChoices(g).includes(end)) {
    act(g, { type: 'pick', choice: { option: end } });
  }
}

// ---------------------------------------------------------------------------------------------
// [Activate: Main]
// ---------------------------------------------------------------------------------------------

function main(life: (string | { card: string; faceUp: boolean })[], p1 = {}) {
  return mine7(S7.slashSupernova, {
    characters: [KID],
    life,
    costArea: { active: 3, rested: 2 },
    ...p1,
  });
}

function activateMain(g: ReturnType<typeof main>, end: 'top' | 'bottom' = 'top') {
  const kid = g.find('p1', 'characters', KID);
  act(g, { type: 'activate', card: kid, ability: abilities(g, kid)[0]! });
  if (kind(g) === 'optional') accept(g);
  endIfAsked(g, end);
}

/** The "give up to 1 rested DON!! card to your Leader" target: pick the Leader, if asked. */
function giveTo(g: ReturnType<typeof main>) {
  if (kind(g) === 'choose' && choices(g).includes(g.leader('p1'))) {
    act(g, { type: 'pick', choice: g.leader('p1') });
    if (kind(g) === 'choose' && canDone(g)) done(g);
  }
}

describe('ST36-005 Eustass"Captain"Kid: [Activate: Main] turn a top or bottom Life card face-up: give up to 1 rested DON!! to my Leader', () => {
  it('printed values: cost 6, 7000 power', () => {
    const g = main([A, B, C]);
    const k = g.card(g.find('p1', 'characters', KID));
    expect(k.cost).toBe(6);
    expect(k.power).toBe(7000);
  });

  it('top: the top Life card turns face-up and one rested DON!! goes to my Leader (6000 on my turn)', () => {
    const g = main([A, B, C]);
    expect(dons(g)).toMatchObject({ active: 3, rested: 2, given: 0 });
    activateMain(g, 'top');
    giveTo(g);
    expect(kind(g)).toBe('main');
    expect(faceStates(g)).toEqual([true, false, false]);
    expect(dons(g)).toMatchObject({ active: 3, rested: 1, given: 1 });
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('bottom: the bottom Life card turns face-up instead', () => {
    const g = main([A, B, C]);
    activateMain(g, 'bottom');
    giveTo(g);
    expect(faceStates(g)).toEqual([false, false, true]);
  });

  it('the middle Life card is never the one: with 3 Life cards only the ends can turn', () => {
    const g = main([A, B, C]);
    activateMain(g, 'top');
    giveTo(g);
    expect(faceStates(g)[1]).toBe(false);
  });

  it('a face-up top card cannot be turned again: with the top face-up the bottom is used', () => {
    const g = main([up(A), B, C]);
    activateMain(g, 'bottom');
    giveTo(g);
    expect(faceStates(g)).toEqual([true, false, true]);
  });

  it('both ends face-up (only the middle card face-down): the cost cannot be paid, the ability is not offered', () => {
    const g = main([up(A), B, up(C)]);
    expect(canActivate(g, g.find('p1', 'characters', KID))).toBe(false);
  });

  it('every Life card face-up: not offered', () => {
    const g = main([up(A), up(B)]);
    expect(canActivate(g, g.find('p1', 'characters', KID))).toBe(false);
  });

  it('no Life cards: not offered', () => {
    const g = main([]);
    expect(canActivate(g, g.find('p1', 'characters', KID))).toBe(false);
  });

  it('with one face-down Life card it is both ends and can be turned', () => {
    const g = main([A]);
    expect(canActivate(g, g.find('p1', 'characters', KID))).toBe(true);
    activateMain(g);
    giveTo(g);
    expect(faceStates(g)).toEqual([true]);
  });

  it('"up to 1": with no rested DON!! the cost is still paid (the card is turned) and nothing is given', () => {
    const g = main([A, B], { costArea: { active: 5, rested: 0 } });
    activateMain(g, 'top');
    if (kind(g) === 'choose') {
      expect(canDone(g)).toBe(true);
      done(g);
    }
    expect(faceStates(g)).toEqual([true, false]);
    expect(dons(g)).toMatchObject({ active: 5, given: 0 });
  });

  it('"up to 1": I may give nothing; the card is turned and the rested DON!! stay in the cost area', () => {
    const g = main([A, B]);
    activateMain(g, 'top');
    need(g, 'choose', 'p1');
    expect(canDone(g)).toBe(true);
    done(g);
    expect(faceStates(g)).toEqual([true, false]);
    expect(dons(g)).toMatchObject({ rested: 2, given: 0 });
  });

  it('only a rested DON!! is given: the active ones stay active', () => {
    const g = main([A, B]);
    activateMain(g, 'top');
    giveTo(g);
    expect(dons(g).active).toBe(3);
  });

  it('[Once Per Turn]: a second activation in the same turn is not offered', () => {
    const g = main([A, B, C]);
    activateMain(g, 'top');
    giveTo(g);
    expect(canActivate(g, g.find('p1', 'characters', KID))).toBe(false);
  });

  it('a face-up Life card is public: the opponent sees it; a face-down one stays hidden', () => {
    const g = main([A, B, C]);
    activateMain(g, 'top');
    giveTo(g);
    const seen = project(g.state, 'p2').zones.p1.life.map((c) => c.card);
    expect(seen).toEqual([A, null, null]);
  });
});

// ---------------------------------------------------------------------------------------------
// [On Your Opponent's Attack]
// ---------------------------------------------------------------------------------------------

function defend(
  life: (string | { card: string; faceUp: boolean })[],
  p1: Parameters<typeof theirs7>[1] = {},
  p2 = {},
) {
  return theirs7(
    S7.slashSupernova,
    { characters: [KID, { card: A, rested: true }], life, ...p1 },
    { characters: [ATTACKER], ...p2 },
  );
}

type D = ReturnType<typeof defend>;

function attackMarco(g: D, attacker: string = ATTACKER) {
  attack(g, g.find('p2', 'characters', attacker), g.find('p1', 'characters', A));
}

function pay(g: D, end: 'top' | 'bottom' = 'top') {
  need(g, 'optional', 'p1');
  accept(g);
  endIfAsked(g, end);
}

function resolve(g: D) {
  need(g, 'block', 'p1');
  act(g, { type: 'block', blocker: null });
  act(g, { type: 'endCounter' });
  while (decision(g)?.kind === 'trigger') act(g, { type: 'trigger', activate: false });
}

describe('ST36-005 Eustass"Captain"Kid: [On Your Opponent\'s Attack] turn a top or bottom Life card face-down: change the attack to my [Eustass"Captain"Kid] with 5000+ base power', () => {
  it('an attack on another Character: pay by turning a face-up top card face-down; the attack goes to Kid (7000 beats 6000) and the Character is not touched', () => {
    const g = defend([up(A), B, C]);
    attackMarco(g);
    pay(g, 'top');
    resolve(g);
    expect(faceStates(g)).toEqual([false, false, false]);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([A, KID].sort());
    expect(g.life('p1')).toBe(3);
  });

  it('bottom: the bottom card is the one turned face-down', () => {
    const g = defend([up(A), B, up(C)]);
    attackMarco(g);
    pay(g, 'bottom');
    expect(faceStates(g)).toEqual([true, false, false]);
  });

  it('the redirected attack is a battle with Kid: a 7000 attacker K.O.s Kid (7000)', () => {
    const g = defend([up(A), B], {}, { characters: [S7.kingdew] });
    attackMarco(g, S7.kingdew);
    pay(g, 'top');
    resolve(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([A]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([KID]);
  });

  it('declining: nothing is turned and the attack stays on the Character (6000 K.O.s a 5000 Marco)', () => {
    const g = defend([up(A), B]);
    attackMarco(g);
    need(g, 'optional', 'p1');
    decline(g);
    resolve(g);
    expect(faceStates(g)).toEqual([true, false]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([KID]);
  });

  it('with every Life card face-down the cost cannot be paid: "yes" is not legal', () => {
    const g = defend([A, B, C]);
    attackMarco(g);
    if (kind(g) === 'optional') {
      expect(canAccept(g)).toBe(false);
      decline(g);
    }
    need(g, 'block', 'p1');
  });

  it('a face-up card in the middle only does not help: only the ends can be turned', () => {
    const g = defend([A, up(B), C]);
    attackMarco(g);
    if (kind(g) === 'optional') {
      expect(canAccept(g)).toBe(false);
      decline(g);
    }
    need(g, 'block', 'p1');
  });

  it('candidates: another [Eustass"Captain"Kid] with exactly 5000 base power is allowed, one with 4000 is not', () => {
    const g = defend([up(A), B], {
      characters: [KID, { card: A, rested: true }, S7.kid5000, S7.kid4000],
    });
    attackMarco(g);
    need(g, 'optional', 'p1');
    accept(g);
    endIfAsked(g, 'top');
    need(g, 'choose', 'p1');
    const kids = [g.find('p1', 'characters', KID), g.find('p1', 'characters', S7.kid5000)].sort();
    expect(choices(g).sort()).toEqual(kids);
    expect(g.card(g.find('p1', 'characters', S7.kid5000)).power).toBe(5000);
    expect(g.card(g.find('p1', 'characters', S7.kid4000)).power).toBe(4000);
  });

  it('redirect to the other Kid copy: it takes the battle, this Kid does not', () => {
    const g = defend([up(A), B], {
      characters: [KID, { card: A, rested: true }, S7.kid5000],
    });
    attackMarco(g);
    pay(g, 'top');
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'characters', S7.kid5000) });
    resolve(g);
    // 6000 against 5000: the copy is K.O.d, this Kid and Marco stay.
    expect(cardIds(g, 'p1', 'trash')).toEqual([S7.kid5000]);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([A, KID].sort());
  });

  it('an opposing [Eustass"Captain"Kid] is never a candidate (the text says "your")', () => {
    const g = defend([up(A), B], {}, { characters: [ATTACKER, S7.kid6000] });
    attackMarco(g);
    pay(g, 'top');
    // Only this Kid qualifies: no choice is needed, the attack goes to it.
    resolve(g);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([A, KID].sort());
  });

  it('[Once Per Turn]: the second attack of the turn is not offered it again', () => {
    const g = theirs7(
      S7.slashSupernova,
      {
        characters: [KID, { card: A, rested: true }, { card: B, rested: true }],
        life: [up(A), up(B), up(C)],
      },
      { characters: [ATTACKER, S7.komachiyo] },
    );
    attackMarco(g);
    pay(g, 'top');
    resolve(g);
    need(g, 'main', 'p2');
    attack(g, g.find('p2', 'characters', S7.komachiyo), g.find('p1', 'characters', B));
    expect(kind(g), now(g)).toBe('block');
  });

  it("turning a card face-down hides it again: the opponent's view names none of my Life cards afterwards", () => {
    const g = defend([up(A), B]);
    expect(project(g.state, 'p2').zones.p1.life.map((c) => c.card)).toEqual([A, null]);
    attackMarco(g);
    pay(g, 'top');
    expect(project(g.state, 'p2').zones.p1.life.every((c) => c.card === null)).toBe(true);
  });

  it('my own attacks give no question: on my turn attacking does not ask', () => {
    const g = mine7(
      S7.slashSupernova,
      { characters: [KID], life: [up(A), B] },
      { characters: [{ card: S7.sai, rested: true }] },
    );
    attack(g, g.find('p1', 'characters', KID), g.find('p2', 'characters', S7.sai));
    expect(kind(g)).not.toBe('optional');
  });
});
