/**
 * OP03-008 Buggy (Character, Red, cost 1, 3000, Slash, {Buggy Pirates}).
 *
 * Card text: "This Character cannot be K.O.'d in battle by "Slash" attribute cards.
 * [On Play] Look at 5 cards from the top of your deck; reveal up to 1 red Event and add it to your
 * hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: CR 2-5-6 / 2-5-4 (attributes, a card may have several), CR 10-2-1-3 ("cannot be K.O.'d in
 * battle" does not stop K.O. by an effect), CR 7-1-4-1-2 (battle K.O.), CR 11-3 (look at the top),
 * CR 11-2-1 (revealing a card that moves between secret areas), CR 4-8-1 ("up to").
 */
import { describe, expect, it } from 'vitest';
import { project, type CardId } from '@optcg/engine';
import { act, attack, passBlock, passCounter } from '../../helpers.ts';
import { canFinish, choices, hasEvent, myTurn, side } from '../kit.ts';
import { deck, hand, tail } from '../m4b/kit-a.ts';
import {
  BLUE,
  LW,
  need,
  offeredIds,
  pickCards,
  put,
  RED,
  returnDon,
  settleOrders,
  SW,
  yes,
} from './kit-w5a.ts';

const ID = 'OP03-008';
const RED_EV = SW.redEvent;
const RED_EV2 = SW.redEvent2;
/** Non-red Events: Blue (EB01-028) and Purple (OP05-077). */
const BLUE_EV = SW.blueEvent;
const PURPLE_EV = SW.gammaKnife;
const FILLER = BLUE;

function look(top: CardId[]) {
  return myTurn(
    side(LW.luffy, BLUE, {
      hand: [ID],
      costArea: { active: 1, rested: 0 },
      deck: [...top, ...Array.from({ length: 10 }, () => FILLER)],
    }),
    side(LW.luffy, RED, {}),
  );
}

describe('OP03-008 Buggy: [On Play] look at 5; reveal up to 1 red Event, add it to hand; rest to the bottom', () => {
  it('offers exactly the red Events among the top 5: not a red Character, not a blue or purple Event', () => {
    const g = look([PURPLE_EV, RED_EV, SW.marco, BLUE_EV, RED_EV2]);
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([RED_EV, RED_EV2].sort());
  });

  it('the chosen Event goes to my hand (revealed) and the other 4 go to the bottom; the card below the top 5 is now on top', () => {
    const g = look([PURPLE_EV, RED_EV, SW.marco, BLUE_EV, RED_EV2]);
    put(g, ID);
    pickCards(g, [RED_EV]);
    settleOrders(g);
    need(g, 'main', 'p1');
    expect(hand(g)).toEqual([RED_EV]);
    expect(deck(g)).toHaveLength(14);
    expect(deck(g)[0]).toBe(FILLER);
    expect(tail(deck(g), 4)).toEqual([PURPLE_EV, SW.marco, BLUE_EV, RED_EV2].sort());
    expect(hasEvent(g, 'CardRevealed', { card: RED_EV })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: PURPLE_EV })).toBe(false);
  });

  it('"up to 1": choosing nothing adds nothing and all 5 cards go to the bottom', () => {
    const top = [RED_EV, SW.marco, BLUE_EV, PURPLE_EV, RED_EV2];
    const g = look(top);
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    settleOrders(g);
    need(g, 'main', 'p1');
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(deck(g)[0]).toBe(FILLER);
    expect(tail(deck(g), 5)).toEqual([...top].sort());
  });

  it('at most 1 card is added, even with two red Events in the top 5', () => {
    const g = look([RED_EV, RED_EV2, SW.marco, BLUE_EV, PURPLE_EV]);
    put(g, ID);
    pickCards(g, [RED_EV]);
    settleOrders(g);
    need(g, 'main', 'p1');
    expect(hand(g)).toHaveLength(1);
    expect(deck(g)).toHaveLength(14);
  });

  it('only the top 5 are looked at: a red Event in 6th place is not offered', () => {
    const g = look([SW.marco, BLUE_EV, PURPLE_EV, SW.sai, SW.c1, RED_EV]);
    put(g, ID);
    // Nothing qualifies: the pick is skipped or asked empty.
    if (g.decider === 'p1' && choices(g).length === 0 && canFinish(g)) act(g, { type: 'done' });
    else expect(choices(g)).toEqual([]);
    settleOrders(g);
    need(g, 'main', 'p1');
    expect(hand(g)).toEqual([]);
    // The 6th card is the new top of the deck.
    expect(deck(g)[0]).toBe(RED_EV);
  });

  it('with no red Event in the top 5 all 5 go to the bottom and nothing is added', () => {
    const top = [SW.marco, BLUE_EV, PURPLE_EV, SW.sai, SW.c1];
    const g = look(top);
    put(g, ID);
    if (choices(g).length === 0 && canFinish(g)) act(g, { type: 'done' });
    settleOrders(g);
    need(g, 'main', 'p1');
    expect(hand(g)).toEqual([]);
    expect(tail(deck(g), 5)).toEqual([...top].sort());
  });
});

describe('OP03-008 Buggy: what the opponent can see of the look at 5', () => {
  /** What p2 sees of a decision owed by p1: its kind, owner, purpose and the card counts of every zone. */
  function seenByOpponent(g: ReturnType<typeof look>) {
    const v = project(g.state, 'p2');
    return {
      kind: v.decision?.kind,
      player: v.decision?.player,
      purpose: v.decision?.purpose,
      prompt: v.decision?.prompt,
      counts: Object.fromEntries(
        (['p1', 'p2'] as const).map((p) => [
          p,
          Object.fromEntries(Object.entries(v.zones[p]).map(([z, cs]) => [z, cs.length])),
        ]),
      ),
      cards: v.zones.p1.deck.map((c) => c.card),
    };
  }

  it('the opponent sees the same thing whether or not the top 5 hold a red Event (no prompt depends on the hidden cards)', () => {
    const withEvent = look([SW.marco, RED_EV, BLUE_EV, PURPLE_EV, SW.sai]);
    const without = look([SW.marco, SW.c1, BLUE_EV, PURPLE_EV, SW.sai]);
    put(withEvent, ID);
    put(without, ID);
    expect(seenByOpponent(without)).toEqual(seenByOpponent(withEvent));
  });
});

describe('OP03-008 Buggy: cannot be K.O.\'d in battle by "Slash" attribute cards', () => {
  /** p2's Buggy is rested; p1 attacks it with `attacker`, a Character (or the Leader with `leader`). */
  function strike(attacker: CardId, o: { leader?: string } = {}) {
    const g = myTurn(
      side(o.leader ?? LW.luffy, BLUE, { characters: [attacker] }),
      side(LW.luffy, RED, { characters: [{ card: ID, rested: true }] }),
    );
    const buggy = g.find('p2', 'characters', ID);
    attack(g, g.find('p1', 'characters', attacker), buggy);
    passBlock(g);
    passCounter(g);
    return { g, buggy };
  }

  it('a Slash Character (Sai, 4000 against 3000) wins the battle but does not K.O. Buggy', () => {
    const { g } = strike(SW.sai);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(g.zone('p2', 'trash')).toHaveLength(0);
  });

  it('a Character with several attributes, one of them Slash (Slash/Wisdom), cannot K.O. Buggy either', () => {
    const { g } = strike('OP12-055');
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('a Slash Leader cannot K.O. Buggy (Leaders are cards with the attribute too)', () => {
    const g = myTurn(
      side(LW.slashLeader, BLUE, {}),
      side(LW.luffy, RED, { characters: [{ card: ID, rested: true }] }),
    );
    attack(g, g.leader('p1'), g.find('p2', 'characters', ID));
    passBlock(g);
    passCounter(g);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('a non-Slash Character (Strike, 3000 against 3000) K.O.s Buggy: the protection is only against Slash', () => {
    const { g } = strike(SW.c1);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toContain(ID);
  });

  it('a non-Slash Leader (Strike) K.O.s Buggy too', () => {
    const g = myTurn(
      side(LW.luffy, BLUE, {}),
      side(LW.luffy, RED, { characters: [{ card: ID, rested: true }] }),
    );
    attack(g, g.leader('p1'), g.find('p2', 'characters', ID));
    passBlock(g);
    passCounter(g);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it('only battle is covered: a K.O. by an Event effect (Gum-Gum Lightning) still K.O.s Buggy', () => {
    const g = myTurn(
      side(LW.luffy, BLUE, { hand: [SW.lightning], costArea: { active: 4, rested: 0 } }),
      side(LW.luffy, RED, { characters: [{ card: ID, rested: true }] }),
    );
    put(g, SW.lightning);
    yes(g, 'p1');
    returnDon(g, 2, 'costActive');
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p2', 'characters', ID) });
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toContain(ID);
  });

  it('Buggy as the attacker is not protected by it: a Slash Character defending does not matter, Buggy only fails the power check', () => {
    // Buggy (3000) attacks a rested Slash Sai (4000): Buggy loses nothing and Sai is not K.O.'d.
    const g = myTurn(
      side(LW.luffy, BLUE, { characters: [ID] }),
      side(LW.luffy, RED, { characters: [{ card: SW.sai, rested: true }] }),
    );
    attack(g, g.find('p1', 'characters', ID), g.find('p2', 'characters', SW.sai));
    passBlock(g);
    passCounter(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });
});
