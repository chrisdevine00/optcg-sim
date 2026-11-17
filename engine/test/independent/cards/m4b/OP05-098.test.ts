/**
 * OP05-098 Enel (Leader, Yellow, 5000, 4 Life, {Sky Island}).
 *
 * Card text: "[Opponent's Turn] [Once Per Turn] When your number of Life cards becomes 0, add 1 card from
 * the top of your deck to the top of your Life cards. Then, trash 1 card from your hand."
 *
 * Ruling RL-42 (QA-OP05 OP05-098): it waits until all damage processing ends (CR 8-6-2); the last Life
 * card's [Trigger] is decided first (RL-02) and Enel activates after it; against Double Attack both
 * damage points are processed first, the second does nothing and is not a defeat, then Enel adds a Life
 * card; once per turn, opponent's turn only; trashing from an empty hand does nothing (CR 1-3-2).
 */
import { describe, expect, it } from 'vitest';
import { attack, fill, result, takeDamage } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  activateTrigger,
  BLUE,
  chars,
  choose,
  decider,
  deck,
  finishEmpty,
  hand,
  kind,
  lifeCards,
  mine,
  noDefenceUntilTrigger,
  playCard,
  RED,
  SC,
  settleYes,
  theirs,
  trash,
  VAN,
  YL,
} from './kit-a.ts';

const DAIFUKU = 'OP17-107'; // [Trigger] Play this card
const DECK = [SC.bobbin, SC.opera, ...fill(BLUE, 8)];

function game(life: string[], handCards: string[], p2Chars: string[] = []) {
  return theirs(YL.sky, { life, hand: handCards, deck: DECK }, { characters: p2Chars });
}

/** p2's Leader attacks p1's Leader without defence, up to p1's first decision. */
function hit(g: TestGame, attacker = g.leader('p2'), trigger = false) {
  attack(g, attacker, g.leader('p1'));
  noDefenceUntilTrigger(g);
  // The engine asks about [Trigger] for every Life card taken; decline when the card has none.
  if (!trigger) takeDamage(g);
}

/**
 * The engine asks "use Enel's effect?" although the printed text has no "you may" (DISAGREEMENTS-a A-1).
 * Tests that are about something else say yes to it, so they do not depend on that question.
 */
function acceptIfAsked(g: TestGame) {
  if (kind(g) === 'optional') accept(g);
}

describe('OP05-098 Enel: when your Life becomes 0 on the opponent’s turn, add 1 from the deck to Life, then trash 1', () => {
  it('RL-42: 1 Life, hit: Life 1 (the deck top), the damage card joins the hand, then 1 hand card is trashed', () => {
    const g = game([RED], [VAN.marco, VAN.sai]);
    hit(g);
    acceptIfAsked(g);
    // Hand now holds Marco, Sai and the Life card; Enel's "trash 1" is p1's choice.
    expect(decider(g)).toBe('p1');
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p1', 'hand', VAN.sai)]);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(1);
    expect(lifeCards(g)[0]).toBe(SC.bobbin);
    expect(deck(g)).toHaveLength(9);
    expect(hand(g)).toEqual([RED, VAN.marco].sort());
    expect(trash(g)).toEqual([VAN.sai]);
    expect(result(g)).toBeNull();
  });

  // DISAGREEMENTS-a.md A-1: the engine asks "use this effect?" and lets p1 decline.
  it('CR 8-3-1-4: the effect has no "you may", so it is mandatory: p1 is not asked whether to use it', () => {
    const g = game([RED], [VAN.marco, VAN.sai]);
    hit(g);
    expect(kind(g)).not.toBe('optional');
  });

  it('with an otherwise empty hand, the only card (the one just taken from Life) is trashed', () => {
    const g = game([RED], []);
    hit(g);
    acceptIfAsked(g);
    settleYes(g, 'p1');
    finishEmpty(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([RED]);
    expect(g.life('p1')).toBe(1);
  });

  it('does nothing while Life stays above 0', () => {
    const g = game([RED, RED], [VAN.marco]);
    hit(g);
    expect(kind(g)).toBe('main');
    expect(g.life('p1')).toBe(1);
    expect(deck(g)).toHaveLength(10);
    expect(trash(g)).toEqual([]);
  });

  it('[Once Per Turn]: a second time Life reaches 0 in the same turn adds nothing, and a hit at 0 Life loses', () => {
    const g = game([RED], [VAN.marco], [VAN.marco, VAN.kingdew]);
    hit(g);
    acceptIfAsked(g);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(1);
    // Second hit: Life 1 -> 0, Enel is spent.
    hit(g, g.find('p2', 'characters', VAN.marco));
    expect(kind(g)).toBe('main');
    expect(g.life('p1')).toBe(0);
    expect(result(g)).toBeNull();
    expect(deck(g)).toHaveLength(9);
    // Third hit at 0 Life ends the game.
    hit(g, g.find('p2', 'characters', VAN.kingdew));
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });

  it('RL-02: the last Life card’s [Trigger] is decided first; Enel activates after it', () => {
    const g = game([DAIFUKU], [VAN.marco, VAN.sai]);
    hit(g, undefined, true);
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    acceptIfAsked(g);
    // Daifuku is played; Enel then adds a Life card and p1 trashes 1 card from hand.
    choose(g, [g.find('p1', 'hand', VAN.marco)]);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([DAIFUKU]);
    expect(g.life('p1')).toBe(1);
    expect(lifeCards(g)[0]).toBe(SC.bobbin);
    expect(hand(g)).toEqual([VAN.sai]);
    expect(trash(g)).toEqual([VAN.marco]);
  });

  it('RL-42: Double Attack against 1 Life: both points are processed, no defeat, then Enel adds a Life card', () => {
    const g = game([RED], [VAN.marco], ['OP13-118']);
    hit(g, g.find('p2', 'characters', 'OP13-118'));
    acceptIfAsked(g);
    settleYes(g, 'p1');
    expect(result(g)).toBeNull();
    expect(g.life('p1')).toBe(1);
    expect(lifeCards(g)[0]).toBe(SC.bobbin);
  });

  it('[Opponent’s Turn] only: Life reaching 0 on Enel’s own player’s turn does not add a card', () => {
    const g = mine(YL.sky, { hand: ['EB01-056'], life: [RED], deck: DECK });
    playCard(g, 'EB01-056');
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(0);
    expect(deck(g)).toHaveLength(9);
    expect(result(g)).toBeNull();
  });
});
