/**
 * OP15-112 Raki (Character, Yellow, cost 4, 4000, Counter +1000, {Sky Island}/{Shandian Warrior}, [Blocker]).
 *
 * Card text: "[Blocker] ... [On Play] Play up to 1 {Shandian Warrior} type Character card with a cost of 3 or
 * less from your hand."
 *
 * Rules: CR 8-4-4-1 ("up to" allows 0), CR 10-1-4 ([Blocker]), CR 3-7-4 (a Character played this turn
 * cannot attack).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, blockers, noDefence } from '../../helpers.ts';
import {
  chars,
  chooseCards,
  chooseNone,
  choiceCards,
  hand,
  kind,
  mine,
  playCard,
  SC,
  settleYes,
  theirs,
  YL,
} from './kit-a.ts';

const HAND = [SC.genbo, SC.seto, SC.bobbin, SC.wyper6]; // Shandian 3, Shandian 5, not Shandian 2, Shandian 6

function played(handCards: string[] = HAND) {
  const g = mine(YL.shandian, { hand: ['OP15-112', ...handCards] });
  playCard(g, 'OP15-112');
  return g;
}

describe('OP15-112 Raki: [On Play] play a {Shandian Warrior} Character of cost 3 or less from hand', () => {
  it('candidates: only {Shandian Warrior} Characters with cost 3 or less (3 qualifies; 5 and 6 and non-Shandian do not)', () => {
    const g = played();
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g)).toEqual([SC.genbo]);
  });

  it('plays the chosen Character from hand for free', () => {
    const g = played();
    chooseCards(g, [SC.genbo]);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual(['OP15-112', SC.genbo].sort());
    expect(hand(g)).toEqual([SC.seto, SC.bobbin, SC.wyper6].sort());
  });

  it('CR 8-4-4-1: may play nothing', () => {
    const g = played();
    chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual(['OP15-112']);
    expect(hand(g)).toHaveLength(4);
  });

  it('with only too-expensive or off-type cards in hand nothing can be played', () => {
    const g = played([SC.seto, SC.bobbin]);
    if (kind(g) === 'choose') {
      expect(choiceCards(g)).toEqual([]);
      chooseNone(g);
    }
    settleYes(g, 'p1');
    expect(chars(g)).toEqual(['OP15-112']);
  });
});

describe('OP15-112 Raki: [Blocker]', () => {
  it('has [Blocker]: it can be declared as the blocker against an attack on the Leader', () => {
    const g = theirs(YL.shandian, { characters: ['OP15-112'] });
    attack(g, g.leader('p2'), g.leader('p1'));
    const raki = g.find('p1', 'characters', 'OP15-112');
    expect(g.card(raki).keywords).toContain('Blocker');
    expect(blockers(g)).toEqual([raki]);
    act(g, { type: 'block', blocker: raki });
    expect(g.card(raki).rested).toBe(true);
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });
});
