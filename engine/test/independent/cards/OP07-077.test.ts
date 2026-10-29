/**
 * OP07-077 We're Going to Claim the One Piece!!! (Event, Purple, cost 1, Land of Wano / The Four Emperors).
 *
 * Card text (cards/data, no override text patch):
 *   effectText: "[Main] If your Leader has the [Animal Kingdom Pirates] or [Big Mom Pirates] type,
 *     look at 5 cards from the top of your deck; reveal up to 1 [Animal Kingdom Pirates] or
 *     [Big Mom Pirates] type card and add it to your hand. Then, place the rest at the bottom of
 *     your deck in any order."
 *   triggerText: "Activate this card's [Main] effect."
 *
 * Reading: the older template writes types in square brackets; they are read as exact type matches
 * ({Animal Kingdom Pirates}, CR 2-4-3), not names.
 * Rules relied on: CR 8-3-3 (failed "if" → nothing), CR 8-4-4-2 (may choose none in a secret area),
 * CR 3-1-7 (owner orders cards placed together), CR 10-2-3-1-1 / RL-25 ([Trigger] may activate [Main]).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, decision, fill, isLegal, passBlock } from '../helpers.ts';
import {
  AKP,
  cardOf,
  choiceCards,
  choices,
  choose,
  chooseNone,
  count,
  LEAD,
  myTurn,
  PURPLE,
  RED,
  settleYes,
  side,
  sortedIds,
  theirTurn,
  VAN,
} from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

const TOP5 = [AKP.king, VAN.gordon, VAN.ultiAkp, VAN.smoothieBigMom, VAN.mohji];
const REST = [VAN.marco, VAN.sai, ...fill(PURPLE, 8)];

function game(leader: string) {
  return myTurn(
    side(leader, PURPLE, {
      hand: [AKP.onePiece],
      costArea: { active: 1, rested: 0 },
      deck: [...TOP5, ...REST],
    }),
    side(LEAD.luffy, RED),
  );
}

/** The offered instance of a looked-at card (the deck cards are not in a public zone meanwhile). */
function offeredCard(g: TestGame, card: string): string {
  const hit = choices(g).find((i) => cardOf(g, i) === card);
  if (!hit) throw new Error(`${card} is not offered; offered: ${choiceCards(g)}`);
  return hit;
}

function deckIds(g: TestGame) {
  return g.zone('p1', 'deck').map((c) => c.card);
}

describe('OP07-077: [Main] look at 5, add up to 1 AKP or Big Mom Pirates card, rest to bottom', () => {
  it('happy path (AKP Leader): candidates are the AKP and Big Mom Pirates cards; the rest go to the bottom', () => {
    const g = game(LEAD.kaido);
    act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.onePiece) });
    expect(choiceCards(g)).toEqual([AKP.king, VAN.ultiAkp, VAN.smoothieBigMom].sort());
    choose(g, [offeredCard(g, AKP.king)]);
    settleYes(g, 'p1');
    expect(sortedIds(g, 'p1', 'hand')).toEqual([AKP.king]);
    expect(count(g, 'p1', 'deck')).toBe(14);
    const deck = deckIds(g);
    expect(deck[0]).toBe(VAN.marco);
    expect(deck.slice(-4).sort()).toEqual(
      [VAN.gordon, VAN.ultiAkp, VAN.smoothieBigMom, VAN.mohji].sort(),
    );
    expect(sortedIds(g, 'p1', 'trash')).toEqual([AKP.onePiece]);
  });

  it('a Big Mom Pirates Leader (OP11-062 Katakuri) also meets the condition', () => {
    const g = game(LEAD.katakuri);
    act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.onePiece) });
    expect(choiceCards(g)).toEqual([AKP.king, VAN.ultiAkp, VAN.smoothieBigMom].sort());
  });

  it('CR 8-4-4-2: may add nothing; all 5 go to the bottom', () => {
    const g = game(LEAD.kaido);
    act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.onePiece) });
    chooseNone(g);
    settleYes(g, 'p1');
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    const deck = deckIds(g);
    expect(deck).toHaveLength(15);
    expect(deck[0]).toBe(VAN.marco);
    expect(deck.slice(-5).sort()).toEqual([...TOP5].sort());
  });

  it('CR 8-3-3: a Leader with neither type (ST05-001 Shanks) → no look, deck unchanged', () => {
    const g = game(LEAD.shanks);
    const card = g.find('p1', 'hand', AKP.onePiece);
    if (isLegal(g, { type: 'playCard', card })) {
      act(g, { type: 'playCard', card });
      settleYes(g, 'p1');
    }
    expect(deckIds(g)).toEqual([...TOP5, ...REST]);
    expect(g.zone('p1', 'hand').map((c) => c.card)).not.toContain(AKP.king);
  });

  it('[Trigger] activates the [Main] on the opponent’s turn: adds the AKP card, then the Event is trashed', () => {
    const g = theirTurn(
      side(LEAD.kaido, PURPLE, {
        life: [AKP.onePiece, ...fill(PURPLE, 3)],
        deck: [AKP.king, VAN.gordon, VAN.mohji, VAN.marco, VAN.sai, ...fill(PURPLE, 5)],
      }),
      side(LEAD.luffy, RED),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(decision(g)).toMatchObject({ kind: 'trigger', player: 'p1' });
    act(g, { type: 'trigger', activate: true });
    expect(choiceCards(g)).toEqual([AKP.king]);
    settleYes(g, 'p1');
    expect(sortedIds(g, 'p1', 'hand')).toEqual([AKP.king]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([AKP.onePiece]);
    expect(g.life('p1')).toBe(3);
  });
});
