/**
 * OP09-022 Lim (Leader, Green/Purple, 5000, 4 Life, Wisdom, {ODYSSEY}).
 *
 * Card text:
 * "Your Character cards are played rested.
 * [Activate: Main] [Once Per Turn] You may rest 3 of your DON!! cards: Add up to 1 DON!! card from
 * your DON!! deck and rest it, and play up to 1 "ODYSSEY" type Character card with a cost of 5 or
 * less from your hand."
 *
 * Rules: CR 8-3-1 (choosing to activate is choosing to pay the cost), CR 10-2-13 ([Once Per Turn]),
 * CR 4-8-1 ("up to"), a Character played rested stays rested until its owner's Refresh Phase
 * (so it cannot block), CR 2-4-3 ("ODYSSEY" type, exact: the data prints it quoted). Resting
 * DON!! needs active cost-area DON!!. "Add up to N DON!!" asks a count, most first.
 * An "up to" pick over the hand with a filter is asked (max 0 when nothing matches).
 *
 * Scenery (printed): OP09-038 Rob Lucci (ODYSSEY, cost 4, 6000, no text); OP09-028 Sanji (ODYSSEY,
 * cost 5, 6000, [On K.O.]); OP09-026 Sakazuki (ODYSSEY, cost 6, 7000, [On Play] needing 2 rested
 * Characters); OP03-015 Lim (ODYSSEY, cost 3, 2000, [Blocker]); OP09-041 an ODYSSEY Event (cost 1);
 * OP01-023 Marco (not ODYSSEY, cost 3); OP02-020 LittleOars Jr. 9000.
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import { act, attack, blockers, decision, endTurn } from '../../helpers.ts';
import { myTurn, side, theirTurn } from '../kit.ts';
import {
  answerCount,
  asksCount,
  BLUE,
  countOptions,
  donChoices,
  donOf,
  isChoose,
  LW,
  need,
  none,
  offeredAbilities,
  offeredCards,
  ofZone,
  pickCards,
  put,
  RED,
  restedOf,
  SC6,
  useAbility,
} from './kit-w6a.ts';

const ID = 'OP09-022';
const LUCCI = 'OP09-038';
const SANJI5 = 'OP09-028';
const SAKAZUKI6 = 'OP09-026';
const LIM_BLOCKER = 'OP03-015';
const ODYSSEY_EVENT = 'OP09-041';

function start(
  o: {
    hand?: CardId[];
    active?: number;
    rested?: number;
    donDeck?: number;
    chars?: PlayerSpec['characters'];
  } = {},
) {
  return myTurn(
    side(ID, BLUE, {
      hand: o.hand ?? [],
      costArea: { active: o.active ?? 5, rested: o.rested ?? 0 },
      ...(o.donDeck !== undefined ? { donDeck: o.donDeck } : {}),
      characters: o.chars ?? [],
    }),
    side(LW.luffy, RED, { costArea: { active: 3, rested: 0 } }),
  );
}

/** Activate the Leader ability; if the engine asks which DON!! to rest, rest active ones. */
function activate(g: ReturnType<typeof start>) {
  useAbility(g, g.leader('p1'));
  for (let i = 0; i < 6; i++) {
    const d = decision(g);
    if (d?.kind !== 'choose' || d.purpose !== 'cost') break;
    const want = donChoices(g).find((o) => o.from === 'costActive');
    if (!want) break;
    g.act({ type: 'pick', choice: want });
  }
}

describe('OP09-022 Lim: Characters are played rested; [Activate: Main][Once Per Turn] rest 3 DON!!: add 1 rested DON!! and play an ODYSSEY Character (cost 5-) from hand', () => {
  it('printed effect: rests 3 DON!!, adds 1 DON!! rested, plays the ODYSSEY Character (rested)', () => {
    const g = start({ hand: [LUCCI], active: 5 });
    activate(g);
    expect(donOf(g)).toMatchObject({ active: 2, rested: 3, deck: 5 });
    expect(asksCount(g)).toBe(true);
    answerCount(g, 1);
    expect(donOf(g)).toMatchObject({ active: 2, rested: 4, deck: 4 });
    need(g, 'choose', 'p1');
    expect(offeredCards(g)).toEqual([LUCCI]);
    pickCards(g, [LUCCI]);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'characters')).toEqual([LUCCI]);
    expect(restedOf(g, 'p1', LUCCI)).toEqual([true]);
    expect(ofZone(g, 'p1', 'hand')).toEqual([]);
  });

  it('static: a Character played from hand by paying its cost enters rested', () => {
    const g = myTurn(
      side(ID, BLUE, { hand: [SC6.c5k], costArea: { active: 3, rested: 0 } }),
      side(LW.luffy, RED),
    );
    put(g, SC6.c5k);
    expect(restedOf(g, 'p1', SC6.c5k)).toEqual([true]);
  });

  it("static: it applies to the opponent's turn too, only for my Characters: the opponent's Characters enter active", () => {
    const g = theirTurn(
      side(ID, BLUE),
      side(LW.luffy, RED, { hand: [SC6.c5k], costArea: { active: 3, rested: 0 } }),
    );
    put(g, SC6.c5k, 'p2');
    expect(restedOf(g, 'p2', SC6.c5k)).toEqual([false]);
  });

  it('cost: needs 3 active DON!!; with only 2 active (and more rested) the ability is not offered', () => {
    const g = start({ hand: [LUCCI], active: 2, rested: 5 });
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
    const h = start({ hand: [LUCCI], active: 3, rested: 0 });
    expect(offeredAbilities(h, h.leader('p1'))).toHaveLength(1);
  });

  it('[Once Per Turn]: after one use it is not offered again this turn, though 3 active DON!! remain', () => {
    const g = start({ hand: [LUCCI, SANJI5], active: 8 });
    activate(g);
    answerCount(g, 1);
    pickCards(g, [LUCCI]);
    expect(donOf(g).active).toBe(5);
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
  });

  it('hand filter: cost 4 and cost 5 ODYSSEY Characters are offered; cost 6, non-ODYSSEY and an ODYSSEY Event are not', () => {
    const g = start({ hand: [LUCCI, SANJI5, SAKAZUKI6, SC6.c5k, ODYSSEY_EVENT] });
    activate(g);
    answerCount(g, 1);
    need(g, 'choose', 'p1');
    expect(offeredCards(g)).toEqual([LUCCI, SANJI5].sort());
  });

  it('"add up to 1": the count offered is 1 or 0; 0 adds no DON!! but the Character is still played', () => {
    const g = start({ hand: [LUCCI], active: 5 });
    activate(g);
    expect(countOptions(g)).toEqual(['1', '0']);
    answerCount(g, 0);
    expect(donOf(g)).toMatchObject({ active: 2, rested: 3, deck: 5 });
    pickCards(g, [LUCCI]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([LUCCI]);
  });

  it('with an empty DON!! deck nothing is added and the Character is still played', () => {
    const g = start({ hand: [LUCCI], active: 10, donDeck: 0 });
    activate(g);
    if (asksCount(g)) answerCount(g, 0);
    expect(donOf(g)).toMatchObject({ active: 7, rested: 3, deck: 0 });
    need(g, 'choose', 'p1');
    pickCards(g, [LUCCI]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([LUCCI]);
  });

  it('"up to 1": the Character may be skipped; the DON!! cost is paid and the added DON!! stays', () => {
    const g = start({ hand: [LUCCI], active: 5 });
    activate(g);
    answerCount(g, 1);
    need(g, 'choose', 'p1');
    none(g);
    expect(decision(g)?.kind).toBe('main');
    expect(donOf(g)).toMatchObject({ active: 2, rested: 4, deck: 4 });
    expect(ofZone(g, 'p1', 'hand')).toEqual([LUCCI]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
  });

  it('nothing in hand qualifies: the pick is still asked (empty), and the DON!! part has happened', () => {
    const g = start({ hand: [SAKAZUKI6], active: 5 });
    activate(g);
    answerCount(g, 1);
    expect(isChoose(g)).toBe(true);
    expect(offeredCards(g)).toEqual([]);
    expect(decision(g)?.max).toBe(0);
    none(g);
    expect(donOf(g)).toMatchObject({ rested: 4 });
  });

  it("a Character played rested by the effect cannot block on the opponent's turn", () => {
    const g = start({ hand: [LIM_BLOCKER], active: 5 });
    activate(g);
    answerCount(g, 1);
    pickCards(g, [LIM_BLOCKER]);
    expect(restedOf(g, 'p1', LIM_BLOCKER)).toEqual([true]);
    endTurn(g);
    need(g, 'main', 'p2');
    // p2 has no Characters in this scenario: attack with the Leader.
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
    act(g, { type: 'block', blocker: null, player: 'p1' });
  });
});
