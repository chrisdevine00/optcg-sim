/**
 * OP14-058 Ocean Current Shoulder Throw (Event, Blue, cost 2, {Fish-Man}/{The Seven Warlords of the Sea}/{The Sun Pirates}).
 *
 * Card text: "[Main] You may rest 3 of your DON!! cards: Play up to 1 {Fish-Man} type Character card
 * with a cost of 3 or less from your hand. Then, return up to 1 Character with 6000 base power to
 * the owner's hand.
 * [Counter] Draw 1 card and your Leader gains +3000 power during this battle."
 *
 * Rules: CR 8-3-1 (cost all or nothing), CR 4-8-1 ("up to"), CR 4-9-2 (base power), CR 2-4-3 (exact
 * type: a {Merfolk} is not a {Fish-Man}), CR 4-10-1 (a "Then" without "If" is not gated).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock } from '../../helpers.ts';
import {
  answerMay,
  atMain,
  BLUE,
  C14,
  canFinish,
  choices,
  chars,
  choose,
  deck,
  don,
  hand,
  inst,
  kind,
  L14,
  mine,
  mustBeUnpayable,
  need,
  offeredIds,
  offeredNow,
  pickCards,
  put,
  settle,
  theirs,
  useCounter,
} from './kit-op14b.ts';

const EVT = 'OP14-058';

function start(o: {
  hand?: string[];
  mine?: (string | { card: string; don: number })[];
  p2?: string[];
  active?: number;
  given?: number;
}) {
  return mine(
    L14.fish,
    {
      hand: [EVT, ...(o.hand ?? [])],
      characters: o.mine ?? [],
      costArea: { active: o.active ?? 10, rested: 0 },
    },
    { characters: o.p2 ?? [] },
  );
}
/** Play the Event and pay the DON!! cost; leaves the play pick pending. */
function pay(g: ReturnType<typeof start>) {
  put(g, EVT);
  answerMay(g, true);
  settle(g, { cost: 'don' });
}

describe('OP14-058 Ocean Current Shoulder Throw: [Main] rest 3 DON!!: play a {Fish-Man} (cost 3 or less), then return a 6000-base Character; [Counter] draw 1, Leader +3000', () => {
  it("[Main] plays a {Fish-Man} Character from hand free of cost, then returns a 6000-base Character to its owner's hand", () => {
    const g = start({ hand: [C14.namule], p2: [C14.hajrudin] });
    pay(g);
    need(g, 'choose', 'p1');
    pickCards(g, [C14.namule]);
    need(g, 'choose', 'p1');
    choose(g, [inst(g, 'p2', 'characters', C14.hajrudin)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([C14.namule]);
    expect(g.zone('p2', 'characters')).toEqual([]);
    expect(hand(g, 'p2').filter((c) => c === C14.hajrudin)).toHaveLength(1);
    expect(don(g)).toMatchObject({ active: 5, rested: 5 });
  });

  it('the play offers {Fish-Man} Characters of cost 3 or less only: not a {Merfolk}, not cost 4, not other types', () => {
    const g = start({
      hand: [C14.namule, C14.jinbe2, C14.camie, C14.praline, C14.jinbe4, C14.marco],
    });
    pay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C14.jinbe2, C14.namule].sort());
  });

  it('the return offers Characters with exactly 6000 base power, from either side: not 5000, not 7000', () => {
    const g = start({
      mine: [C14.sphinx, C14.marco],
      p2: [C14.hajrudin, C14.kingdew, C14.marco],
    });
    pay(g);
    if (kind(g) === 'choose' && choices(g).length === 0) act(g, { type: 'done' });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.hajrudin, C14.sphinx].sort());
  });

  it('"base power": a 5000-base Character with a DON!! given (6000 power) is not offered; a 6000-base one with a DON!! (7000 power) is', () => {
    const g = mine(
      L14.fish,
      {
        hand: [EVT],
        characters: [
          { card: C14.marco, don: 1 },
          { card: C14.hajrudin, don: 1 },
        ],
        costArea: { active: 8, rested: 0 },
      },
      {},
    );
    expect(g.power(inst(g, 'p1', 'characters', C14.marco))).toBe(6000);
    put(g, EVT);
    answerMay(g, true);
    settle(g, { cost: 'don' });
    if (kind(g) === 'choose' && choices(g).length === 0) act(g, { type: 'done' });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.hajrudin]);
  });

  it('"Then" is not gated: with no {Fish-Man} to play the return is still offered (the play pick is asked empty)', () => {
    const g = start({ hand: [C14.marco], p2: [C14.hajrudin] });
    pay(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).toHaveLength(0);
    act(g, { type: 'done' });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.hajrudin]);
  });

  it('"up to 1": may play nothing and may return nothing', () => {
    const g = start({ hand: [C14.namule], p2: [C14.hajrudin] });
    pay(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(chars(g)).toEqual([]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([C14.hajrudin]);
    expect(hand(g)).toEqual([C14.namule]);
  });

  it('returns at most one Character even when two have 6000 base power', () => {
    const g = start({ p2: [C14.hajrudin, C14.sphinx] });
    pay(g);
    if (kind(g) === 'choose' && choices(g).length === 0) act(g, { type: 'done' });
    need(g, 'choose', 'p1');
    choose(g, [inst(g, 'p2', 'characters', C14.hajrudin)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([C14.sphinx]);
  });

  it('declining the optional cost: no play, no return, no DON!! rested beyond the Event cost', () => {
    const g = start({ hand: [C14.namule], p2: [C14.hajrudin] });
    put(g, EVT);
    answerMay(g, false);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([C14.namule]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([C14.hajrudin]);
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
  });

  it('the cost is exactly 3 DON!!: with 2 active left after the Event cost it cannot be paid and nothing happens', () => {
    const g = start({ hand: [C14.namule], p2: [C14.hajrudin], active: 4 });
    put(g, EVT);
    mustBeUnpayable(g);
    expect(hand(g)).toEqual([C14.namule]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([C14.hajrudin]);
  });

  it('exactly 3 active DON!! left after the Event cost is enough (5 active in total)', () => {
    const g = start({ hand: [C14.namule], active: 5 });
    pay(g);
    need(g, 'choose', 'p1');
    pickCards(g, [C14.namule]);
    expect(chars(g)).toEqual([C14.namule]);
    expect(don(g)).toMatchObject({ active: 0, rested: 5 });
  });

  it('[Counter] draws 1 card and the Leader gains +3000 during this battle (8000 holds off a 5000 attack)', () => {
    const g = theirs(
      L14.fish,
      { hand: [EVT], costArea: { active: 2, rested: 0 }, deck: [C14.kingdew, BLUE, BLUE] },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    useCounter(g, inst(g, 'p1', 'hand', EVT), g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(hand(g)).toEqual([C14.kingdew]);
    expect(deck(g)).toHaveLength(2);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
