/**
 * OP16-057 Captain Buggy's Our Savior!! (Event, Blue, cost 1, {Impel Down}).
 *
 * Card text: "[Counter] If you have 2 or more [Prisoner of Impel Down] cards, up to 1 of your Leader or
 * Character cards gains +4000 power during this battle. [Trigger] Draw 2 cards and trash 1 card from
 * your hand."
 *
 * Rules: CR 3-1-2-1 ("you have" refers to the field), CR 2-1-2 (exact names), CR 8-3-3 (failed "if"),
 * CR 7-1-3-1-2 (Event [Counter] in the Counter Step only), CR 7-1-5-3 (battle duration), CR 8-4-4-1
 * ("up to"), CR 10-1-5 ([Trigger]), CR 10-2-14 (Trash).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock, takeDamage } from '../../helpers.ts';
import {
  activateTrigger,
  at,
  BLUE,
  canCounterWith,
  chooseIfAsked,
  deck,
  fill,
  hand,
  hitLeader,
  ID,
  inst,
  kind,
  LDR,
  mine,
  need,
  pickInst,
  SCN,
  theirs,
  trash,
  useCounter,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const EVT = 'OP16-057';
const PRISONER = 'OP16-042';

/** p2's Leader attacks my Leader (5000 v 5000); I stop in the Counter Step with the Event in hand. */
function defend(own: string[], opts: { hand?: string[]; p2?: string[] } = {}): TestGame {
  const g = theirs(
    LDR.luffy,
    { characters: own, hand: opts.hand ?? [EVT], costArea: { active: 1, rested: 0 } },
    { characters: opts.p2 ?? [] },
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}
function counterOn(g: TestGame, target: string) {
  useCounter(g, inst(g, 'p1', 'hand', EVT), target);
  chooseIfAsked(g, [target]);
}
function finish(g: TestGame) {
  act(g, { type: 'endCounter' });
  takeDamage(g);
}

describe("OP16-057 Captain Buggy's Our Savior!!: [Counter] with 2+ [Prisoner of Impel Down], +4000 to a Leader or Character; [Trigger] draw 2, trash 1", () => {
  it('with 2 [Prisoner of Impel Down] on my field: my Leader gains +4000 (9000) and the 5000 attack fails', () => {
    const g = defend([PRISONER, PRISONER]);
    counterOn(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(9000);
    finish(g);
    expect(g.life('p1')).toBe(4);
  });

  it('boundary: with only 1 [Prisoner of Impel Down] the boost does not happen and the attack connects', () => {
    const g = defend([PRISONER]);
    if (canCounterWith(g, inst(g, 'p1', 'hand', EVT))) counterOn(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(5000);
    finish(g);
    expect(g.life('p1')).toBe(3);
  });

  it('with no [Prisoner of Impel Down] at all there is no boost', () => {
    const g = defend([ID.blugori, ID.sphinx]);
    if (canCounterWith(g, inst(g, 'p1', 'hand', EVT))) counterOn(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 3-1-2-1: Prisoners in my hand do not count: 1 on the field and 2 in hand is still not enough', () => {
    const g = defend([PRISONER], { hand: [EVT, PRISONER, PRISONER] });
    if (canCounterWith(g, inst(g, 'p1', 'hand', EVT))) counterOn(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the boost may go to a Character instead: a rested Prisoner (6000) attacked by 7000 survives at 10000', () => {
    const g = theirs(
      LDR.luffy,
      {
        characters: [{ card: PRISONER, rested: true }, PRISONER],
        hand: [EVT],
        costArea: { active: 1, rested: 0 },
      },
      { characters: [SCN.c5] },
    );
    attack(g, inst(g, 'p2', 'characters', SCN.c5), at(g, 'p1', 'characters', PRISONER, 0));
    passBlock(g);
    const target = at(g, 'p1', 'characters', PRISONER, 0);
    counterOn(g, target);
    expect(g.power(target)).toBe(10000);
    finish(g);
    expect(g.zone('p1', 'characters')).toHaveLength(2);
  });

  it('"up to 1": only the chosen card gets +4000 (the Leader is not boosted when a Character is)', () => {
    const g = defend([PRISONER, PRISONER]);
    const target = at(g, 'p1', 'characters', PRISONER, 0);
    counterOn(g, target);
    expect(g.power(target)).toBe(10000);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(at(g, 'p1', 'characters', PRISONER, 1))).toBe(6000);
  });

  it('the boost lasts during this battle only: the Leader is back to 5000 afterwards', () => {
    const g = defend([PRISONER, PRISONER]);
    counterOn(g, g.leader('p1'));
    finish(g);
    expect(kind(g)).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the Event costs 1 DON!! and goes to the trash', () => {
    const g = defend([PRISONER, PRISONER]);
    counterOn(g, g.leader('p1'));
    expect(trash(g)).toEqual([EVT]);
    expect(hand(g)).toEqual([]);
  });

  it('it has no [Main]: it cannot be played in my Main Phase', () => {
    const g = mine(LDR.luffy, { hand: [EVT], characters: [PRISONER, PRISONER] });
    expect(
      g.legal().some((a) => a.type === 'playCard' && a.card === inst(g, 'p1', 'hand', EVT)),
    ).toBe(false);
  });

  it('[Trigger]: draws 2 cards and then trashes 1 card from my hand', () => {
    const g = theirs(
      LDR.luffy,
      {
        life: [EVT, SCN.c1, SCN.c1, SCN.c1],
        hand: [SCN.c2],
        deck: [SCN.c7, SCN.c8, ...fill(BLUE, 8)],
      },
      { characters: [SCN.c3] },
    );
    hitLeader(g, inst(g, 'p2', 'characters', SCN.c3));
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(deck(g)).toHaveLength(8);
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
    pickInst(g, [inst(g, 'p1', 'hand', SCN.c2)]);
    expect(hand(g)).toEqual([SCN.c7, SCN.c8].sort());
    expect(trash(g)).toContain(SCN.c2);
    expect(trash(g)).toContain(EVT);
  });

  it('CR 3-1-2-1: only my own [Prisoner of Impel Down] count: 1 of mine and 1 of the opponent\u2019s is not 2', () => {
    const g = defend([PRISONER], { p2: [PRISONER] });
    if (canCounterWith(g, inst(g, 'p1', 'hand', EVT))) counterOn(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
