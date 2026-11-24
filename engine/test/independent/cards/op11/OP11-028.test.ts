/**
 * OP11-028 Lord of the Coast (Character, Green, cost 4, 5000, Counter +1000, {East Blue}/{Neptunian}).
 *
 * Card text: "[On Play] Up to 1 of your opponent's rested Characters will not become active in your
 * opponent's next Refresh Phase.
 * [Trigger] K.O. up to 1 of your opponent's rested Characters with a cost of 3 or less."
 *
 * Rules: the Refresh Phase sets the turn player's rested cards active (CR 6-2-4); a card told not
 * to become active stays rested for that one Refresh Phase only. Only RESTED Characters are
 * candidates for both effects. "Up to 1" may be none. A [Trigger] resolves when the Life card is
 * taken as damage and is optional.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  BLUE,
  chr,
  endEmptyIfAsked,
  fill,
  hitLeader,
  ids,
  L11,
  mine,
  N11,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  theirs,
  activateTrigger,
  declineTrigger,
} from './kit-op11a.ts';

const LORD = 'OP11-028';
const rested = (card: string) => ({ card, rested: true });

function main(p2: (string | { card: string; rested: boolean })[]) {
  return mine(L11.luffy, { hand: [LORD], characters: [N11.navy3] }, { characters: p2 });
}

describe('OP11-028 Lord of the Coast: [On Play] a rested Character does not become active next Refresh', () => {
  it('printed values: cost 4, 5000, Counter +1000', () => {
    const g = main([]);
    const l = at(g, 'p1', 'hand', LORD);
    expect(g.card(l).cost).toBe(4);
    expect(g.power(l)).toBe(5000);
    expect(g.card(l).counter).toBe(1000);
  });

  it('offers only the opposing RESTED Characters', () => {
    const g = main([rested(N11.marco), N11.sai, rested(N11.thatch)]);
    playRaw(g, LORD);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.marco, N11.thatch].sort());
  });

  it('the chosen Character stays rested through the opponent’s next Refresh Phase; the other rested one becomes active', () => {
    const g = main([rested(N11.marco), rested(N11.thatch)]);
    playRaw(g, LORD);
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.card(chr(g, 'p2', N11.marco)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', N11.thatch)).rested).toBe(false);
  });

  it('only the NEXT Refresh Phase: it becomes active again the turn after', () => {
    const g = main([rested(N11.marco)]);
    playRaw(g, LORD);
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.card(chr(g, 'p2', N11.marco)).rested).toBe(false);
  });

  it('"up to 1": choosing no one lets every rested Character become active', () => {
    const g = main([rested(N11.marco)]);
    playRaw(g, LORD);
    need(g, 'choose', 'p1');
    none(g);
    act(g, { type: 'endTurn' });
    expect(g.card(chr(g, 'p2', N11.marco)).rested).toBe(false);
  });

  it('affects only 1 Character even with two rested', () => {
    const g = main([rested(N11.marco), rested(N11.thatch)]);
    playRaw(g, LORD);
    pickInst(g, [chr(g, 'p2', N11.thatch)]);
    act(g, { type: 'endTurn' });
    const stillRested = g.zone('p2', 'characters').filter((c) => c.rested);
    expect(stillRested).toHaveLength(1);
  });

  it('with no rested opposing Character nothing is chosen', () => {
    const g = main([N11.marco]);
    playRaw(g, LORD);
    endEmptyIfAsked(g);
    need(g, 'main', 'p1');
    expect(g.card(chr(g, 'p2', N11.marco)).rested).toBe(false);
  });
});

describe('OP11-028 Lord of the Coast: [Trigger] K.O. a rested Character with cost 3 or less', () => {
  function triggered(p2: (string | { card: string; rested: boolean })[]) {
    const g = theirs(L11.luffy, { life: [LORD, ...fill(BLUE, 3)] }, { characters: p2 });
    hitLeader(g);
    return g;
  }

  it('offers rested Characters with cost 3 or less (boundary) only, and K.O.s the chosen one', () => {
    // Sai cost 2, Marco cost 3, Hajrudin cost 4 (rested); Komachiyo cost 1 is active.
    const g = triggered([rested(N11.sai), rested(N11.marco), rested(N11.hajrudin), N11.komachiyo]);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.sai, N11.marco].sort());
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    expect(ids(g, 'p2', 'characters')).toEqual([N11.hajrudin, N11.komachiyo, N11.sai].sort());
  });

  it('may be declined', () => {
    const g = triggered([rested(N11.sai)]);
    declineTrigger(g);
    expect(ids(g, 'p2', 'characters')).toEqual([N11.sai]);
  });
});
