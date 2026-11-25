/**
 * OP10-045 Cavendish (Character, Blue, cost 4, 6000, no Counter, {Beautiful Pirates}/{Dressrosa}).
 *
 * Card text: "[When Attacking] [Once Per Turn] Draw 2 cards and trash 1 card from your hand."
 *
 * Rules: CR 8-1-1 and 8-1-2 (an exact count is not "up to": the trash is mandatory), CR 10-2-... [When
 * Attacking] fires when the attack is declared, "[Once Per Turn]" renews every turn, drawing and
 * trashing are one effect ("and"), CR 3-7 (the trashed card goes to its owner's trash).
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../../../src/testing.ts';
import { act, attack, endTurn, noDefence } from '../../helpers.ts';
import {
  atMain,
  C10,
  canFinish,
  deck,
  expectMain,
  hand,
  inst,
  kind,
  L10,
  mine,
  need,
  offeredNow,
  pickRaw,
  playRaw,
  trash,
} from './kit-op10b.ts';

const CAV = 'OP10-045';
const TOP = [C10.thatch, C10.kingdew, C10.sai, C10.gordon, C10.mohji, C10.hajrudin4];

function board(handCards: string[] = [C10.marco], p2: Parameters<typeof mine>[2] = {}) {
  return mine(L10.luffy, { hand: handCards, deck: TOP, characters: [CAV] }, p2);
}
const swing = (g: ReturnType<typeof board>) =>
  attack(g, inst(g, 'p1', 'characters', CAV), g.leader('p2'));

describe('OP10-045 Cavendish: [When Attacking] [Once Per Turn] draw 2, trash 1 from hand', () => {
  it('declaring the attack draws 2 cards from the top of the deck, then asks for 1 card to trash', () => {
    const g = board();
    swing(g);
    need(g, 'choose', 'p1');
    expect(hand(g)).toEqual([C10.marco, C10.thatch, C10.kingdew].sort());
    expect(deck(g)[0]).toBe(C10.sai);
  });

  it('the trash pick offers every card in hand, the two drawn cards included', () => {
    const g = board();
    swing(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.marco, C10.thatch, C10.kingdew].sort());
  });

  it('the trash is exactly 1: it cannot be skipped and a second card cannot be picked', () => {
    const g = board();
    swing(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(false);
    pickRaw(g, g.find('p1', 'hand', C10.thatch));
    expect(kind(g)).not.toBe('choose');
    expect(trash(g)).toEqual([C10.thatch]);
    expect(hand(g)).toEqual([C10.marco, C10.kingdew].sort());
  });

  it('a card already in hand may be the one trashed; the drawn cards stay', () => {
    const g = board();
    swing(g);
    need(g, 'choose', 'p1');
    pickRaw(g, g.find('p1', 'hand', C10.marco));
    expect(trash(g)).toEqual([C10.marco]);
    expect(hand(g)).toEqual([C10.thatch, C10.kingdew].sort());
  });

  it('with an empty hand it still draws 2 and trashes 1: the hand ends with 1 card', () => {
    const g = board([]);
    swing(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.kingdew, C10.thatch].sort());
    pickRaw(g, g.find('p1', 'hand', C10.thatch));
    expect(hand(g)).toEqual([C10.kingdew]);
    expect(trash(g)).toEqual([C10.thatch]);
  });

  it('after the trash the battle goes on: the opponent has the Block Step', () => {
    const g = board();
    swing(g);
    pickRaw(g, g.find('p1', 'hand', C10.thatch));
    const d = need(g, 'block');
    expect(d.player).toBe('p2');
  });

  it('it fires when attacking an opposing Character as well', () => {
    const g = board([C10.marco], { characters: [{ card: C10.mohji, rested: true }] });
    attack(g, inst(g, 'p1', 'characters', CAV), inst(g, 'p2', 'characters', C10.mohji));
    need(g, 'choose', 'p1');
    expect(hand(g)).toHaveLength(3);
  });

  it('it is not an [On Play]: playing Cavendish draws nothing', () => {
    const g = mine(L10.luffy, { hand: [CAV, C10.marco], deck: TOP });
    playRaw(g, CAV);
    expectMain(g);
    expect(hand(g)).toEqual([C10.marco]);
    expect(deck(g)).toHaveLength(6);
  });

  it('B3B-R8: [Once Per Turn] holds within a turn: set active again, a second attack draws nothing', () => {
    const g = board();
    swing(g);
    pickRaw(g, g.find('p1', 'hand', C10.thatch));
    noDefence(g);
    expect(atMain(g)).toBe(true);
    const cav = inst(g, 'p1', 'characters', CAV);
    const leader = g.leader('p1');
    g.state = withAbilities(g.state, g.card(leader).card, [
      {
        id: 'planted',
        kind: 'activate',
        when: 'activateMain',
        effect: [{ do: { setActive: { from: 'characters', owner: 'you', pick: { upTo: 1 } } } }],
      } as unknown as Ability,
    ]);
    act(g, { type: 'activate', card: leader, ability: 'planted' });
    pickRaw(g, cav);
    expect(g.card(cav).rested).toBe(false);
    const before = hand(g).length;
    swing(g);
    expect(kind(g)).not.toBe('choose');
    expect(hand(g)).toHaveLength(before);
  });

  it('[Once Per Turn] renews: on my next turn the next attack draws 2 and trashes 1 again', () => {
    const g = board();
    swing(g);
    pickRaw(g, g.find('p1', 'hand', C10.thatch));
    noDefence(g);
    expect(atMain(g)).toBe(true);
    endTurn(g);
    need(g, 'main', 'p2');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    const before = hand(g).length;
    swing(g);
    need(g, 'choose', 'p1');
    // the turn's own draw happened already; the effect adds 2 more cards
    expect(hand(g).length).toBe(before + 2);
    pickRaw(g, g.zone('p1', 'hand')[0]!.instance);
    expect(hand(g).length).toBe(before + 1);
  });
});
