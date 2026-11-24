/**
 * OP14-049 Jinbe (Character, Blue, cost 8, 10000, {Fish-Man}/{The Seven Warlords of the Sea}/{The Sun Pirates}).
 *
 * Card text: "When a card is trashed from your hand by an effect, this Character gains [Rush] during
 * this turn. (This card can attack on the turn in which it is played.)
 * [On Play] You may rest 2 of your DON!! cards: Draw 2 cards and return up to 1 Character with a
 * cost of 7 or less to the owner's hand."
 *
 * The hand trash is caused by OP16-093 Bartholomew Kuma ([On Play] Draw 2 cards and trash 2 cards
 * from your hand), an effect that is not a cost (M6b-Q31 leaves costs open).
 *
 * Rules: CR 8-3-1 (cost all or nothing), CR 4-8-1 ("up to"), CR 10-1-1-1 ([Rush]), CR 3-7-4.
 */
import { describe, expect, it } from 'vitest';
import { act, attack } from '../../helpers.ts';
import {
  answerMay,
  atMain,
  BLUE,
  C14,
  canAttackAnything,
  canFinish,
  choose,
  deck,
  don,
  hand,
  inst,
  kw,
  L14,
  mine,
  mustBeUnpayable,
  need,
  noDefence,
  offeredNow,
  put,
  rested,
  settle,
  toMyNextMain,
  trashByKuma,
} from './kit-op14b.ts';

const JIN = 'OP14-049';
const KUMA = 'OP16-093';
const SHIKI8 = 'OP12-005';

function start(p2chars: string[], o: { active?: number; rested?: number; mine?: string[] } = {}) {
  return mine(
    L14.luffy,
    {
      hand: [JIN],
      characters: o.mine ?? [],
      deck: [C14.kingdew, C14.thatch, BLUE, BLUE, BLUE],
      costArea: { active: o.active ?? 10, rested: o.rested ?? 0 },
    },
    { characters: p2chars },
  );
}
function fire(g: ReturnType<typeof start>, target: string | null) {
  put(g, JIN);
  answerMay(g, true);
  settle(g, { cost: 'don', target: target === null ? null : inst(g, 'p2', 'characters', target) });
}

describe('OP14-049 Jinbe: gains [Rush] this turn when a card is trashed from your hand by an effect; [On Play] rest 2 DON!!: draw 2, return a Character (cost 7 or less)', () => {
  it("[On Play] pays 2 DON!!, draws 2 and returns an opposing Character of cost 7 to its owner's hand", () => {
    const g = start([C14.littleOars]);
    fire(g, C14.littleOars);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([C14.kingdew, C14.thatch].sort());
    expect(g.zone('p2', 'characters')).toEqual([]);
    expect(hand(g, 'p2').filter((c) => c === C14.littleOars)).toHaveLength(1);
    expect(don(g)).toMatchObject({ active: 0, rested: 10 });
  });

  it('boundary: cost 7 is offered, cost 8 and cost 10 are not', () => {
    const g = start([C14.littleOars, SHIKI8, C14.xebec]);
    put(g, JIN);
    answerMay(g, true);
    settle(g, { cost: 'don' });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.littleOars]);
  });

  it("any player's Character may be returned: my own Characters are offered too", () => {
    const g = start([C14.marco], { mine: [C14.sai] });
    put(g, JIN);
    answerMay(g, true);
    settle(g, { cost: 'don' });
    need(g, 'choose', 'p1');
    // Jinbe himself has cost 8, so he is not a candidate.
    expect(offeredNow(g)).toEqual([C14.marco, C14.sai].sort());
  });

  it('"up to 1": returning nothing still draws 2', () => {
    const g = start([C14.marco]);
    put(g, JIN);
    answerMay(g, true);
    settle(g, { cost: 'don' });
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(hand(g)).toEqual([C14.kingdew, C14.thatch].sort());
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([C14.marco]);
  });

  it('draws exactly 2 cards', () => {
    const g = start([]);
    put(g, JIN);
    answerMay(g, true);
    settle(g, { cost: 'don', target: null });
    expect(deck(g)).toHaveLength(3);
  });

  it('declining the optional cost: nothing is rested, nothing is drawn or returned', () => {
    const g = start([C14.marco]);
    put(g, JIN);
    answerMay(g, false);
    expect(hand(g)).toEqual([]);
    expect(don(g)).toMatchObject({ active: 2, rested: 8 });
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([C14.marco]);
  });

  it('with only 1 active DON!! left after the cost of 8 the 2-DON!! cost cannot be paid: nothing happens', () => {
    const g = start([C14.marco], { active: 9 });
    put(g, JIN);
    mustBeUnpayable(g);
    expect(hand(g)).toEqual([]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([C14.marco]);
  });

  it('rested DON!! cannot pay it: 8 active + 2 rested leaves 0 active after the play cost', () => {
    const g = start([C14.marco], { active: 8, rested: 2 });
    put(g, JIN);
    mustBeUnpayable(g);
    expect(hand(g)).toEqual([]);
  });

  it('exactly 2 active DON!! left after the play cost is enough (10 active -> 0 active)', () => {
    const g = start([]);
    fire(g, null);
    expect(hand(g)).toHaveLength(2);
    expect(don(g)).toMatchObject({ active: 0, rested: 10 });
  });

  it('[Rush]: with a card trashed from my hand by an effect, a Jinbe played this turn can attack', () => {
    const g = mine(
      L14.luffy,
      {
        hand: [KUMA, C14.sai, C14.marco],
        characters: [{ card: JIN, playedThisTurn: true }],
        deck: [BLUE, BLUE, BLUE, BLUE],
        costArea: { active: 10, rested: 0 },
      },
      {},
    );
    const j = inst(g, 'p1', 'characters', JIN);
    expect(canAttackAnything(g, j)).toBe(false);
    trashByKuma(g, [C14.sai, C14.marco]);
    expect(kw(g, j)).toContain('Rush');
    attack(g, j, g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(3);
    expect(rested(g, j)).toBe(true);
  });

  it('[Rush] lasts this turn only', () => {
    const g = mine(
      L14.luffy,
      {
        hand: [KUMA, C14.sai, C14.marco],
        characters: [{ card: JIN, playedThisTurn: true }],
        deck: [BLUE, BLUE, BLUE, BLUE],
      },
      {},
    );
    trashByKuma(g, [C14.sai, C14.marco]);
    toMyNextMain(g);
    need(g, 'main', 'p1');
    expect(kw(g, inst(g, 'p1', 'characters', JIN))).not.toContain('Rush');
    void choose;
  });
});
