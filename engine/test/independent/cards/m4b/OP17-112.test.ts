/**
 * OP17-112 Charlotte Linlin (Character, Yellow, cost 10, 12000, no Counter, {The Four Emperors}/{Big Mom Pirates}).
 *
 * Card text: "[Your Turn] The base power of all of your Characters with a [Trigger] and 4000 base power
 * becomes 8000.
 * [On Play] Draw 1 card, then choose one:
 * • Add up to 1 card from the top of your deck to the top of your Life cards.
 * • Add up to 1 card from the top of your opponent's Life cards to the owner's hand."
 *
 * Rules: CR 4-9-2 (base power is the printed or set value; given DON!! and other modifiers add on top),
 * CR 8-3-2-4 ([Your Turn]), CR 8-4-4-1 ("up to" allows 0), CR 8-4-4 (the player picks the mode at
 * resolution), taking a Life card to hand by an effect is not damage so no [Trigger] (RL-22).
 */
import { describe, expect, it } from 'vitest';
import { endTurn, fill } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  BLUE,
  chars,
  count,
  decider,
  deck,
  hand,
  kind,
  lifeCards,
  mine,
  outcomes,
  playCard,
  RED,
  SC,
  VAN,
  YL,
} from './kit-a.ts';

const DAIFUKU = 'OP17-107'; // 4000 power, [Trigger] Play this card
const SPEED = SC.speed; // 3000 power, [Trigger]
const BOBBIN = SC.bobbin; // 4000 power, no [Trigger]

function onPlay(p2Life: string[] = fill(RED, 4)) {
  const g = mine(
    YL.bmp,
    { hand: ['OP17-112'], deck: [SC.bobbin, SC.opera, ...fill(BLUE, 10)] },
    { life: p2Life, hand: [VAN.marco] },
  );
  playCard(g, 'OP17-112');
  return g;
}

/** p1 hand ids, deck size, Life size and top, p2 Life size and hand size. */
const fp = (g: TestGame) =>
  [
    hand(g).join(','),
    deck(g).length,
    g.life('p1'),
    lifeCards(g)[0],
    g.life('p2'),
    count(g, 'p2', 'hand'),
  ].join('/');

describe('OP17-112 Charlotte Linlin: [On Play] draw 1, then choose one', () => {
  it('the player chooses the mode (p1 owes it) and each mode has its documented result after the draw', () => {
    const g = onPlay();
    expect(decider(g)).toBe('p1');
    const reached = outcomes(g, 'p1', fp);
    // Mode 1: drew Bobbin, then Opera went on top of Life (5 Life, deck 10).
    expect(reached.has(`${BOBBIN}/10/5/${SC.opera}/4/1`)).toBe(true);
    // Mode 2: drew Bobbin, opponent's top Life card went to its hand (Life 3, hand 2).
    expect(reached.has(`${BOBBIN}/11/4/${BLUE}/3/2`)).toBe(true);
  });

  it('only one mode applies, and the draw happens in every outcome', () => {
    const g = onPlay();
    const allowed = new Set([
      `${BOBBIN}/10/5/${SC.opera}/4/1`, // mode 1
      `${BOBBIN}/11/4/${BLUE}/3/2`, // mode 2
      `${BOBBIN}/11/4/${BLUE}/4/1`, // either mode with "up to 1" taken as 0
    ]);
    for (const r of outcomes(g, 'p1', fp)) expect(allowed.has(r), r).toBe(true);
  });

  it('"up to 1" in either mode may be taken as 0 (the draw still happens)', () => {
    const g = onPlay();
    expect(outcomes(g, 'p1', fp).has(`${BOBBIN}/11/4/${BLUE}/4/1`)).toBe(true);
  });

  it('mode 2 with an opponent at 0 Life does nothing and nobody loses', () => {
    const g = onPlay([]);
    const reached = outcomes(g, 'p1', fp);
    expect(reached.has(`${BOBBIN}/11/4/${BLUE}/0/1`)).toBe(true);
  });

  it('mode 2 takes a Life card to hand without a [Trigger] decision (it is not damage)', () => {
    const g = onPlay([SC.speed, RED, RED]);
    for (const r of outcomes(g, 'p1', (b) => `${decider(b)}/${kind(b)}/${fp(b)}`)) {
      expect(r.includes('/trigger/')).toBe(false);
    }
    const reached = outcomes(g, 'p1', fp);
    expect(reached.has(`${BOBBIN}/11/4/${BLUE}/2/2`)).toBe(true);
  });
});

describe('OP17-112 Charlotte Linlin: [Your Turn] 4000-base Characters with a [Trigger] have 8000 base power', () => {
  function board(extra: Partial<Parameters<typeof mine>[1]> = {}) {
    return mine(
      YL.bmp,
      { characters: ['OP17-112', DAIFUKU, BOBBIN, SPEED], ...extra },
      { characters: [DAIFUKU] },
    );
  }
  const pw = (g: TestGame, p: 'p1' | 'p2', card: string) => g.power(g.find(p, 'characters', card));

  it('on my turn: the 4000-power [Trigger] Character is 8000; one without [Trigger] or with 3000 is not', () => {
    const g = board();
    expect(pw(g, 'p1', DAIFUKU)).toBe(8000);
    expect(pw(g, 'p1', BOBBIN)).toBe(4000);
    expect(pw(g, 'p1', SPEED)).toBe(3000);
    expect(pw(g, 'p1', 'OP17-112')).toBe(12000);
  });

  it('it changes the BASE power: given DON!! still add 1000 each on top', () => {
    const g = mine(YL.bmp, {
      characters: ['OP17-112', { card: DAIFUKU, don: 2 }],
      costArea: { active: 8, rested: 0 },
    });
    expect(g.power(g.find('p1', 'characters', DAIFUKU))).toBe(10000);
  });

  it('only my Characters: the opponent’s identical Character stays at 4000', () => {
    const g = board();
    expect(pw(g, 'p2', DAIFUKU)).toBe(4000);
  });

  it('on the opponent’s turn it does not apply ([Your Turn])', () => {
    const g = board();
    endTurn(g);
    expect(decider(g)).toBe('p2');
    expect(pw(g, 'p1', DAIFUKU)).toBe(4000);
  });

  it('a Daifuku played after Linlin is also 8000', () => {
    const g = mine(YL.bmp, { characters: ['OP17-112'], hand: [DAIFUKU] });
    playCard(g, DAIFUKU);
    expect(g.power(g.find('p1', 'characters', DAIFUKU))).toBe(8000);
    expect(chars(g)).toContain(DAIFUKU);
  });
});
