/**
 * OP12-112 Baby 5 (Character, Yellow, cost 4, 5000, Counter +2000, {Donquixote Pirates}).
 *
 * Card text: no effect text. "[Trigger] If your Leader is multicolored, draw 2 cards."
 *
 * Rules: CR 8-3-3 (a failed "if" resolves nothing), CR 10-1-5 ([Trigger] is optional; the card is
 * trashed afterwards), CR 2-5 (a multicolored card has two or more colors).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  chars,
  declineTrigger,
  deck,
  hand,
  hitLeader,
  RED,
  SC,
  settleYes,
  theirs,
  trash,
  YL,
} from './kit-a.ts';

function hit(leader: string) {
  const g = theirs(leader, {
    life: ['OP12-112', ...fill(RED, 3)],
    deck: [SC.bobbin, SC.opera, ...fill(BLUE, 10)],
  });
  hitLeader(g);
  return g;
}

describe('OP12-112 Baby 5: [Trigger] if your Leader is multicolored, draw 2', () => {
  it('Red/Yellow Leader (EB04-001): draws 2, Baby 5 goes to trash and is not played', () => {
    const g = hit(YL.multi);
    activateTrigger(g);
    settleYes(g, 'p1');
    expect(hand(g)).toEqual([SC.bobbin, SC.opera].sort());
    expect(deck(g)).toHaveLength(10);
    expect(trash(g)).toEqual(['OP12-112']);
    expect(chars(g)).toEqual([]);
  });

  it('Purple/Yellow Leader (OP09-062) also counts as multicolored', () => {
    const g = hit(YL.robin);
    activateTrigger(g);
    settleYes(g, 'p1');
    expect(hand(g)).toHaveLength(2);
  });

  it('CR 8-3-3: a single-color (Yellow) Leader draws nothing, but the card is still trashed', () => {
    const g = hit(YL.neutral);
    activateTrigger(g);
    settleYes(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(12);
    expect(trash(g)).toEqual(['OP12-112']);
  });

  it('declining the [Trigger] with a multicolored Leader adds Baby 5 to hand and draws nothing', () => {
    const g = hit(YL.multi);
    declineTrigger(g);
    expect(hand(g)).toEqual(['OP12-112']);
    expect(deck(g)).toHaveLength(12);
  });
});
