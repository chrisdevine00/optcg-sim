/**
 * EB02-035 Sanji & Pudding (Character, Purple, cost 5, 7000, Strike/Wisdom, {Straw Hat Crew}/
 * {Big Mom Pirates}).
 *
 * Card text: "[Your Turn] [Once Per Turn] When 2 or more DON!! cards on your field are returned to your
 * DON!! deck, add up to 1 DON!! card from your DON!! deck and set it as active.
 * [On Play] If the number of DON!! cards on your field is equal to or less than the number on your
 * opponent's field, draw 1 card."
 *
 * Rules: CR 3-1-2 (the field includes the cost area; DON!! given to cards stay on the field),
 * CR 8-3-2-4 ([Your Turn]), CR 10-2-13 ([Once Per Turn]), CR 8-3-1-6 (DON!! −N returns DON!!),
 * CR 4-8-1 ("up to"), CR 8-3-3 (text after a failed "if" does not resolve).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, attack, decision } from '../../helpers.ts';
import { canFinish, myTurn, side, theirTurn } from '../kit.ts';
import {
  activateCounter,
  answerCount,
  asksCount,
  BLUE,
  countOptions,
  donOf,
  LW,
  need,
  onField,
  put,
  RED,
  returnDon,
  SW,
  yes,
} from './kit-w5a.ts';

const ID = 'EB02-035';

/** On Play: p1 holds Sanji & Pudding with `mine` DON!! (all active) against `opp` on p2's field. */
function onPlay(o: { mine: number; opp: number; mineGiven?: number; oppGiven?: number }) {
  const given = (n: number | undefined): PlayerSpec['characters'] =>
    n ? [{ card: SW.marco, don: n }] : [];
  return myTurn(
    side(LW.luffy, BLUE, {
      hand: [ID],
      costArea: { active: o.mine, rested: 0 },
      characters: given(o.mineGiven),
    }),
    side(LW.luffy, RED, {
      costArea: { active: o.opp, rested: 0 },
      characters: given(o.oppGiven),
    }),
  );
}

/** My turn with Sanji & Pudding in play, `hand` in hand and `active` active DON!!. */
function onField_(hand: string[], active = 10) {
  return myTurn(
    side(LW.luffy, BLUE, { hand, characters: [ID], costArea: { active, rested: 0 } }),
    side(LW.luffy, RED, { characters: [SW.sai] }),
  );
}

/** Play Gum-Gum Lightning (DON!! -2) and choose nothing to K.O. Stops at whatever follows. */
function lightning(g: ReturnType<typeof onField_>) {
  put(g, SW.lightning);
  yes(g, 'p1');
  returnDon(g, 2, 'costActive');
  need(g, 'choose', 'p1');
  expect(canFinish(g)).toBe(true);
  act(g, { type: 'done' });
}

describe("EB02-035 Sanji & Pudding: [On Play] if my DON!! <= the opponent's, draw 1", () => {
  it('fewer DON!! than the opponent: draws 1 card, and no question is asked', () => {
    const g = onPlay({ mine: 5, opp: 8 });
    const hand = g.zone('p1', 'hand').length;
    put(g, ID);
    expect(decision(g)?.kind).toBe('main');
    // Sanji left the hand, one card was drawn.
    expect(g.zone('p1', 'hand')).toHaveLength(hand - 1 + 1);
  });

  it('equal DON!! (5 and 5, after paying the 5 cost): draws 1; resting DON!! does not take them off the field', () => {
    const g = onPlay({ mine: 5, opp: 5 });
    put(g, ID);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(donOf(g)).toMatchObject({ active: 0, rested: 5 });
  });

  it('one more DON!! than the opponent: no card is drawn (boundary)', () => {
    const g = onPlay({ mine: 6, opp: 5 });
    put(g, ID);
    expect(decision(g)?.kind).toBe('main');
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });

  it('DON!! given to my Characters count on my field: 5 + 1 given against 5 draws nothing', () => {
    const g = onPlay({ mine: 5, opp: 5, mineGiven: 1 });
    expect(onField(g)).toBe(6);
    put(g, ID);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });

  it("DON!! given to the opponent's Characters count on their field: 6 against 5 + 1 given draws 1", () => {
    const g = onPlay({ mine: 6, opp: 5, oppGiven: 1 });
    put(g, ID);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
  });

  it('draws exactly 1 card from the top of the deck', () => {
    const g = onPlay({ mine: 5, opp: 5 });
    const deck = g.zone('p1', 'deck').length;
    put(g, ID);
    expect(g.zone('p1', 'deck')).toHaveLength(deck - 1);
  });
});

describe('EB02-035 Sanji & Pudding: [Your Turn][Once Per Turn] 2+ DON!! returned: add up to 1 DON!! set active', () => {
  it('returning 2 DON!! (Gum-Gum Lightning, DON!! -2) adds 1 DON!! from the deck, active', () => {
    const g = onField_([SW.lightning], 6);
    lightning(g);
    // 6 active: 2 rested for the Event, 2 returned: 2 active + 2 rested; the add is asked.
    expect(asksCount(g)).toBe(true);
    expect(countOptions(g)).toEqual(['1', '0']);
    answerCount(g, 1);
    need(g, 'main', 'p1');
    expect(donOf(g)).toMatchObject({ active: 3, rested: 2, deck: 5 });
  });

  it('"up to 1": adding 0 is allowed', () => {
    const g = onField_([SW.lightning], 6);
    lightning(g);
    answerCount(g, 0);
    need(g, 'main', 'p1');
    expect(donOf(g)).toMatchObject({ active: 2, rested: 2, deck: 6 });
  });

  it('returning only 1 DON!! (Gamma Knife, DON!! -1) does not trigger it: 2 or more is needed', () => {
    const g = onField_([SW.gammaKnife], 6);
    put(g, SW.gammaKnife);
    yes(g, 'p1');
    returnDon(g, 1, 'costActive');
    // The Event's target pick (opposing Character) is "up to 1".
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    need(g, 'main', 'p1');
    expect(donOf(g)).toMatchObject({ active: 3, rested: 2, deck: 5 });
  });

  it('two separate returns of 1 DON!! in one turn do not add up to "2 or more"', () => {
    const g = onField_([SW.gammaKnife, SW.gammaKnife], 8);
    for (let i = 0; i < 2; i++) {
      put(g, SW.gammaKnife);
      yes(g, 'p1');
      returnDon(g, 1, 'costActive');
      need(g, 'choose', 'p1');
      act(g, { type: 'done' });
    }
    need(g, 'main', 'p1');
    // 8 active: two Events rest 2 each, two DON!! are returned: 2 active, 4 rested.
    expect(donOf(g)).toMatchObject({ active: 2, rested: 4, deck: 4 });
  });

  it('[Once Per Turn]: a second return of 2 DON!! in the same turn adds nothing', () => {
    const g = onField_([SW.lightning, SW.lightning], 10);
    lightning(g);
    answerCount(g, 1);
    need(g, 'main', 'p1');
    const afterFirst = donOf(g);
    lightning(g);
    // Used up: no question, back to the Main Phase with only the second Event's cost and return applied.
    need(g, 'main', 'p1');
    const afterSecond = donOf(g);
    expect(afterSecond.deck).toBe(afterFirst.deck + 2);
    expect(onField(g)).toBe(afterFirst.active + afterFirst.rested - 2);
  });

  it("[Your Turn] only: DON!! returned on the opponent's turn add nothing", () => {
    const g = theirTurn(
      side(LW.luffy, BLUE, {
        hand: [SW.giant, BLUE],
        characters: [ID],
        costArea: { active: 6, rested: 0 },
      }),
      side(LW.luffy, RED, { costArea: { active: 5, rested: 0 } }),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    act(g, { type: 'block', blocker: null, player: 'p1' });
    activateCounter(g, g.find('p1', 'hand', SW.giant));
    yes(g, 'p1');
    returnDon(g, 2, 'costActive');
    // "trash 1 card from your hand": pick the filler.
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'hand', BLUE) });
    // The target pick of +4000 is "up to 1".
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    need(g, 'counter', 'p1');
    // 6 active: 1 rested for the Event, 2 returned: 3 active, 1 rested; nothing was added.
    expect(donOf(g)).toMatchObject({ active: 3, rested: 1, deck: 6 });
  });

  it("the opponent's DON!! returns do not count: p2 returning 2 DON!! on their own turn adds nothing for me", () => {
    const g = theirTurn(
      side(LW.luffy, BLUE, { characters: [ID], costArea: { active: 3, rested: 0 } }),
      side(LW.luffy, RED, { hand: [SW.lightning], costArea: { active: 6, rested: 0 } }),
    );
    const before = donOf(g, 'p1');
    put(g, SW.lightning, 'p2');
    yes(g, 'p2');
    returnDon(g, 2, 'costActive', 'p2');
    // Sanji (7000) is not a valid K.O. target, so the pick may not be asked at all.
    if (decision(g)?.kind === 'choose') act(g, { type: 'done', player: 'p2' });
    need(g, 'main', 'p2');
    expect(donOf(g, 'p1')).toEqual(before);
  });

  it('two copies on my field each have their own [Once Per Turn]: each adds 1 DON!! when 2 are returned', () => {
    const g = myTurn(
      side(LW.luffy, BLUE, {
        hand: [SW.lightning],
        characters: [ID, ID],
        costArea: { active: 8, rested: 0 },
      }),
      side(LW.luffy, RED, { characters: [SW.sai] }),
    );
    lightning(g);
    // Two "add up to 1" questions (and possibly an order question between the two effects).
    let asked = 0;
    for (let i = 0; i < 8 && decision(g)?.player === 'p1' && decision(g)?.kind !== 'main'; i++) {
      if (decision(g)?.kind === 'order') {
        g.act(g.legal().find((a) => a.type === 'order')!);
      } else if (asksCount(g)) {
        answerCount(g, 1);
        asked++;
      } else break;
    }
    need(g, 'main', 'p1');
    expect(asked).toBe(2);
    // 8 active: 2 rested for the Event, 2 returned, then 2 added active.
    expect(donOf(g)).toMatchObject({ active: 6, rested: 2, deck: 2 });
  });

  it('it works together with a Leader that has the same kind of trigger (OP09-061): both add', () => {
    const g = myTurn(
      {
        ...side(LW.luffy, BLUE, {
          hand: [SW.lightning],
          characters: [ID],
          costArea: { active: 8, rested: 0 },
        }),
        leader: 'OP09-061',
      },
      side(LW.luffy, RED, { characters: [SW.sai] }),
    );
    lightning(g);
    let asked = 0;
    for (let i = 0; i < 10 && decision(g)?.player === 'p1' && decision(g)?.kind !== 'main'; i++) {
      if (decision(g)?.kind === 'order') {
        g.act(g.legal().find((a) => a.type === 'order')!);
      } else if (asksCount(g)) {
        answerCount(g, 1);
        asked++;
      } else break;
    }
    need(g, 'main', 'p1');
    // Sanji & Pudding: 1 added active. Leader: 1 added active and 1 additional rested.
    expect(asked).toBe(3);
    expect(donOf(g)).toMatchObject({ active: 6, rested: 3, deck: 1 });
  });
});
