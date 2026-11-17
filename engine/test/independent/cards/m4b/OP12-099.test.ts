/**
 * OP12-099 Kalgara (Character, Yellow, cost 5, 6000, Counter +1000, {Sky Island}/{Shandian Warrior}/{Jaya}).
 *
 * Card text: "[Your Turn] When a card is removed from your or your opponent's Life cards, draw 1 card. Then,
 * you cannot draw cards using your own effects during this turn."
 *
 * Rules: CR 8-3-2-4 ([Your Turn]), CR 8-1-3-1 (an auto effect fires once per occurrence), CR 4-6-3-1
 * (a Life card taken to hand is "removed"); the draw lock covers effects only, not the Draw Phase.
 * Life removed by damage, by Banish and by effects all count ("a card is removed from Life cards").
 */
import { describe, expect, it } from 'vitest';
import { attack, endTurn, fill, noDefence, takeDamage } from '../../helpers.ts';
import {
  accept,
  BLUE,
  choose,
  choices,
  deck,
  hand,
  hitLeader,
  kind,
  mine,
  pickLife,
  playCard,
  RED,
  SC,
  settleYes,
  theirs,
  VAN,
  YL,
  cardOf,
} from './kit-a.ts';

const DECK = [SC.bobbin, SC.opera, SC.anana, ...fill(BLUE, 10)];

function board(extra: object = {}) {
  return mine(
    YL.neutral,
    { characters: ['OP12-099', VAN.marco], deck: DECK, ...extra },
    { life: fill(RED, 4) },
  );
}

describe('OP12-099 Kalgara: [Your Turn] when a Life card is removed, draw 1, then no more own-effect draws this turn', () => {
  it('my Leader hits the opponent: the opponent’s Life card is removed and I draw 1 (plus nothing else)', () => {
    const g = board();
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(3);
    expect(hand(g)).toEqual([SC.bobbin]);
    expect(deck(g)).toHaveLength(12);
  });

  it('only the first removal draws: after Kalgara’s own draw, a second removal this turn draws nothing', () => {
    const g = board();
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    attack(g, g.find('p1', 'characters', VAN.marco), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(2);
    expect(hand(g)).toEqual([SC.bobbin]);
    expect(deck(g)).toHaveLength(12);
  });

  it('after the first draw I cannot draw with my own effects: Flampe’s "draw 1" draws nothing', () => {
    const g = board({ hand: ['EB01-056'] });
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(hand(g)).toEqual(['EB01-056', SC.bobbin].sort());
    playCard(g, 'EB01-056');
    accept(g);
    pickLife(g, 'top');
    settleYes(g, 'p1');
    // Hand: Bobbin and the Life card taken for Flampe's cost; no further draw (neither Flampe's nor Kalgara's).
    expect(hand(g)).toEqual([SC.bobbin, BLUE].sort());
    expect(deck(g)).toHaveLength(12);
  });

  it('my own Life card removed on my turn also draws 1 (Zeus’s cost takes the top Life card)', () => {
    const g = mine(
      YL.neutral,
      { characters: ['OP12-099'], hand: ['OP11-106'], life: [RED, BLUE, BLUE], deck: DECK },
      { characters: [VAN.sunny] },
    );
    playCard(g, 'OP11-106');
    accept(g);
    pickLife(g, 'top');
    if (kind(g) === 'choose') choose(g, [choices(g).find((i) => cardOf(g, i) === VAN.sunny)!]);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(2);
    // Hand: the Life card (RED) plus the one Kalgara drew.
    expect(hand(g)).toEqual([RED, SC.bobbin].sort());
  });

  it('not on the opponent’s turn: when my Life card is removed by damage I only get the Life card', () => {
    const g = theirs(YL.neutral, { characters: ['OP12-099'], life: fill(BLUE, 4), deck: DECK });
    hitLeader(g);
    takeDamage(g);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([BLUE]);
    expect(deck(g)).toHaveLength(13);
  });

  it('the draw lock ends with the turn: Kalgara draws again on my next turn’s first removal', () => {
    const g = board();
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(hand(g)).toEqual([SC.bobbin]);
    endTurn(g);
    endTurn(g);
    // New turn for p1: draw phase drew 1 (normal draw is unaffected); a new removal draws again.
    const before = hand(g).length;
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(hand(g).length).toBe(before + 1 + 0 + 0);
  });
});
