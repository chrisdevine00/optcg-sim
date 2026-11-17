/**
 * OP17-110 Charlotte Perospero (Character, Yellow, cost 7, 4000, Counter +1000, {Big Mom Pirates}).
 *
 * Card text: "[Your Turn] [On Play] Play up to 1 {Big Mom Pirates} type Character card with a cost of 6
 * or less from your hand. Then, this Character gains [Rush] during this turn.
 * [Trigger] Play this card."
 *
 * Rules: CR 8-3-2-4 ([Your Turn]), CR 8-4-4-1 ("up to" allows 0), CR 10-1-5 ([Trigger]),
 * CR 10-2-8 ([Rush]: may attack the turn it is played). "Then" is a plain sequence: the Rush grant does
 * not depend on the play having happened (only "if you do" would, CR 4-10-1).
 */
import { describe, expect, it } from 'vitest';
import { canAttack, endTurn, fill } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  chars,
  chooseCards,
  chooseNone,
  choiceCards,
  hand,
  hitLeader,
  kind,
  mine,
  playCard,
  RED,
  SC,
  settleYes,
  theirs,
  YL,
  finishEmpty,
} from './kit-a.ts';

function played(handExtra: string[]) {
  const g = mine(YL.bmp, { hand: ['OP17-110', ...handExtra] });
  playCard(g, 'OP17-110');
  return g;
}

const HAND = [SC.opera, SC.compote, SC.genbo, SC.perospero6];

describe('OP17-110 Charlotte Perospero: [Your Turn] [On Play] play a {Big Mom Pirates} Character of cost 6 or less', () => {
  it('candidates: {Big Mom Pirates} Characters in hand with cost 6 or less (6 included, 7 excluded, other types excluded)', () => {
    const g = played(HAND);
    expect(choiceCards(g)).toEqual([SC.opera, SC.perospero6].sort());
  });

  it('the chosen Character enters the field for free; the others stay in hand', () => {
    const g = played(HAND);
    chooseCards(g, [SC.perospero6]);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual(['OP17-110', SC.perospero6].sort());
    expect(hand(g)).toEqual([SC.opera, SC.compote, SC.genbo].sort());
  });

  it('plays at most one', () => {
    const g = played(HAND);
    chooseCards(g, [SC.opera]);
    settleYes(g, 'p1');
    expect(chars(g)).toHaveLength(2);
  });

  it('CR 8-4-4-1: may play nothing', () => {
    const g = played(HAND);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual(['OP17-110']);
    expect(hand(g)).toHaveLength(4);
  });

  it('Perospero gains [Rush] this turn: she can attack the Leader the turn she is played', () => {
    const g = played(HAND);
    chooseCards(g, [SC.opera]);
    settleYes(g, 'p1');
    const self = g.find('p1', 'characters', 'OP17-110');
    expect(g.card(self).keywords).toContain('Rush');
    expect(canAttack(g, self, g.leader('p2'))).toBe(true);
    // The Character played by the effect has no Rush.
    expect(canAttack(g, g.find('p1', 'characters', SC.opera), g.leader('p2'))).toBe(false);
  });

  it('"Then": Rush is granted even when no Character could be played', () => {
    const g = played([SC.compote, SC.genbo]);
    if (kind(g) === 'choose') chooseNone(g);
    settleYes(g, 'p1');
    const self = g.find('p1', 'characters', 'OP17-110');
    expect(g.card(self).keywords).toContain('Rush');
    expect(canAttack(g, self, g.leader('p2'))).toBe(true);
  });

  it('Rush lasts only this turn', () => {
    const g = played([]);
    finishEmpty(g);
    settleYes(g, 'p1');
    expect(g.card(g.find('p1', 'characters', 'OP17-110')).keywords).toContain('Rush');
    endTurn(g);
    endTurn(g);
    expect(g.card(g.find('p1', 'characters', 'OP17-110')).keywords).not.toContain('Rush');
  });
});

describe('OP17-110 Charlotte Perospero: [Trigger] play this card, not [Your Turn]', () => {
  it('played by [Trigger] on the opponent’s turn she enters but the [On Play] does not run', () => {
    const g = theirs(YL.bmp, { life: ['OP17-110', ...fill(RED, 3)] });
    // p1's hand after the hit is just the Life card taken if declined; give a candidate in hand instead.
    hitLeader(g);
    activateTrigger(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual(['OP17-110']);
    expect(g.card(g.find('p1', 'characters', 'OP17-110')).keywords).not.toContain('Rush');
    expect(kind(g)).toBe('main');
  });

  it('with a candidate in hand the Trigger-play still does not offer to play it', () => {
    const g = theirs(YL.bmp, { life: ['OP17-110', ...fill(RED, 3)], hand: [SC.opera, BLUE] });
    hitLeader(g);
    activateTrigger(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual(['OP17-110']);
    expect(hand(g)).toEqual([SC.opera, BLUE].sort());
  });
});
