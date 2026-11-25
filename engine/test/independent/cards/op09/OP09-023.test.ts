/**
 * OP09-023 Adio (Character, Green, cost 9, 9000, no Counter, {ODYSSEY}).
 *
 * Card text: "[On Play] If your Leader has the "ODYSSEY" type, set up to 3 of your DON!! cards as
 * active. [On Your Opponent's Attack] [Once Per Turn] You may rest 1 of your DON!! cards: Up to 1 of
 * your Leader or Character cards gains +2000 power during this battle."
 *
 * Scenery Leader: OP09-022 Lim ({ODYSSEY}). The tests do not depend on Lim's own text ("Your
 * Character cards are played rested"). Rules: "set up to N DON!!" asks a count, most first; the
 * "If" has no colon, so it is a condition on the effect; [On Your Opponent's Attack] activates in
 * the Attack Step, before the Block Step and Counter (RL-18); the "You may rest 1 of your DON!!"
 * cost needs an ACTIVE DON!!; [Once Per Turn]; "during this battle" ends with the battle (RL-08);
 * "up to 1" may be 0 (CR 8-4-4-1).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, noDefence, passBlock, passCounter } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  atMain,
  canFinish,
  choices,
  don,
  kind,
  L9,
  mine,
  need,
  no,
  none,
  offered,
  optionChoices,
  pickInst,
  play,
  S9,
  theirs,
  unusable,
  yes,
  type Place,
} from './kit-op09a.ts';

const ADIO = 'OP09-023';

/** My turn: Adio in hand, 10 active DON!! (9 are paid), Leader `leader`. Leaves the first prompt pending. */
function played(leader: string): TestGame {
  const g = mine(leader, { hand: [ADIO] });
  play(g, g.find('p1', 'hand', ADIO));
  return g;
}

/** Answer the pending "how many DON!!" question with `n`. */
function count(g: TestGame, n: number): void {
  need(g, 'choose', 'p1');
  expect(optionChoices(g)).toContain(String(n));
  act(g, { type: 'pick', choice: { option: String(n) } });
}

/** p2's turn: p1 (Leader Lim) has Adio and `own`, `active` active DON!!; p2 attacks with two 6000s. */
function defend(active: number, own: Place[] = []): TestGame {
  return theirs(
    L9.lim,
    { characters: [ADIO, ...own], costArea: { active, rested: 10 - active } },
    { characters: [S9.c4, S9.c4] },
  );
}

function strike(g: TestGame, nth = 0, target?: string): void {
  attack(g, g.find('p2', 'characters', S9.c4, nth), target ?? g.leader('p1'));
}

describe("OP09-023 Adio: [On Play] with an {ODYSSEY} Leader set up to 3 DON!! active; [On Your Opponent's Attack] [Once Per Turn] rest 1 DON!!: +2000", () => {
  it('printed values: cost 9, 9000, no Counter', () => {
    const g = defend(2);
    const a = at(g, 'p1', 'characters', ADIO);
    expect(g.card(a).cost).toBe(9);
    expect(g.power(a)).toBe(9000);
    expect(g.card(a).counter).toBeNull();
  });

  it('[On Play] with an {ODYSSEY} Leader: asks how many (up to 3); 3 sets 3 rested DON!! active', () => {
    const g = played(L9.lim);
    expect(don(g)).toMatchObject({ active: 1, rested: 9 });
    need(g, 'choose', 'p1');
    expect(optionChoices(g).sort()).toEqual(['0', '1', '2', '3']);
    count(g, 3);
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 4, rested: 6 });
  });

  it('"up to 3": I may set fewer (1) or none (0)', () => {
    const one = played(L9.lim);
    count(one, 1);
    expect(don(one)).toMatchObject({ active: 2, rested: 8 });
    const zero = played(L9.lim);
    count(zero, 0);
    expect(don(zero)).toMatchObject({ active: 1, rested: 9 });
  });

  it('the Leader condition: with a Leader that is not {ODYSSEY} nothing is asked and no DON!! changes', () => {
    const g = played(L9.luffy);
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 1, rested: 9 });
  });

  it("[On Your Opponent's Attack]: using it rests 1 DON!!, and my Leader gets +2000 for the battle, so a 6000 attacker no longer connects", () => {
    const g = defend(3);
    strike(g);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(don(g)).toMatchObject({ active: 2 });
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });

  it('control: declining the effect, the same 6000 attack does damage my 5000 Leader', () => {
    const g = defend(3);
    strike(g);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    noDefence(g);
    expect(g.life('p1')).toBe(3);
    expect(don(g)).toMatchObject({ active: 3 });
  });

  it('the +2000 may go to a Character as well: offered are only my Leader and my Characters', () => {
    const g = defend(3, [S9.c2]);
    strike(g);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(choices(g).sort()).toEqual(
      [g.leader('p1'), at(g, 'p1', 'characters', ADIO), at(g, 'p1', 'characters', S9.c2)].sort(),
    );
    expect(canFinish(g)).toBe(true);
    pickInst(g, [at(g, 'p1', 'characters', S9.c2)]);
    expect(g.power(at(g, 'p1', 'characters', S9.c2))).toBe(6000);
  });

  it('"during this battle": the boost is gone when the battle ends', () => {
    const g = defend(3);
    strike(g);
    yes(g, 'p1');
    pickInst(g, [g.leader('p1')]);
    passBlock(g);
    passCounter(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Once Per Turn]: after using it, the opponent’s second attack that turn does not offer it again', () => {
    const g = defend(3);
    strike(g, 0);
    yes(g, 'p1');
    pickInst(g, [g.leader('p1')]);
    noDefence(g);
    strike(g, 1);
    expect(kind(g)).toBe('block');
    expect(don(g)).toMatchObject({ active: 2 });
  });

  it('the cost needs an ACTIVE DON!!: with none active the effect is not usable', () => {
    const g = defend(0);
    strike(g);
    unusable(g, 'p1');
    expect(offered(g, 'p1')).toBe(false);
    expect(kind(g)).toBe('block');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": after paying I may choose nobody (the DON!! stays rested)', () => {
    const g = defend(3);
    strike(g);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    none(g);
    expect(don(g)).toMatchObject({ active: 2 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('must not happen: it does not fire on my own turn when I attack', () => {
    const g = mine(L9.lim, { characters: [ADIO, S9.c3] }, { characters: [] });
    attack(g, at(g, 'p1', 'characters', S9.c3), g.leader('p2'));
    expect(kind(g)).toBe('block');
    expect(g.decider).toBe('p2');
  });
});
