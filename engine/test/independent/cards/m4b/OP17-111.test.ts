/**
 * OP17-111 Charlotte Mont-d'or (Character, Yellow, cost 3, 4000, Counter +1000, {Big Mom Pirates}).
 *
 * Card text: "[On Play] You may reveal 2 cards with a [Trigger] from your hand: K.O. up to 2 of your
 * opponent's Characters with a cost of 1 or less. [Trigger] Play this card."
 *
 * Rules: CR 8-3-1-3 (a cost that cannot be paid cannot be paid), CR 8-3-1-4 ("may" costs may be skipped),
 * CR 8-4-4-1 ("up to" allows 0), CR 2-11-2 (cards with a [Trigger]); revealing does not move cards.
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  accept,
  activateTrigger,
  BLUE,
  chars,
  choiceCards,
  chooseCards,
  chooseNone,
  decline,
  declineTrigger,
  hand,
  hitLeader,
  kind,
  mine,
  offered,
  payWith,
  playCard,
  RED,
  reachablePickSets,
  SC,
  settleYes,
  skipUnusable,
  theirs,
  trash,
  VAN,
  YL,
} from './kit-a.ts';

const EVENT_TRIG = 'OP07-077';
const OPP = [VAN.sunny, VAN.sunny, SC.flampe, VAN.sai];

function played(handExtra: string[], opp: string[] = OPP) {
  const g = mine(YL.bmp, { hand: ['OP17-111', ...handExtra] }, { characters: opp });
  playCard(g, 'OP17-111');
  return g;
}

function revealTwo(g: ReturnType<typeof played>) {
  accept(g);
  payWith(g, [g.find('p1', 'hand', SC.speed), g.find('p1', 'hand', SC.rabiyan)]);
}

describe("OP17-111 Charlotte Mont-d'or: [On Play] reveal 2 [Trigger] cards to K.O. up to 2 cost-1-or-less Characters", () => {
  it('revealing 2 [Trigger] cards: K.O. two Characters of cost 1; cost 2 is not a candidate; the revealed cards stay in hand', () => {
    const g = played([SC.speed, SC.rabiyan, BLUE]);
    expect(offered(g, 'p1')).toBe(true);
    revealTwo(g);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g).sort()).toEqual([VAN.sunny, VAN.sunny, SC.flampe].sort());
    chooseCards(g, [VAN.sunny, SC.flampe]);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toEqual([VAN.sai, VAN.sunny].sort());
    expect(trash(g, 'p2')).toEqual([VAN.sunny, SC.flampe].sort());
    expect(hand(g)).toEqual([SC.speed, SC.rabiyan, BLUE].sort());
    expect(trash(g)).toEqual([]);
  });

  it('the two cards are revealed (CardRevealed events), not discarded', () => {
    const g = played([SC.speed, SC.rabiyan, BLUE]);
    revealTwo(g);
    for (const card of [SC.speed, SC.rabiyan]) {
      expect(g.events.some((e) => e.type === 'CardRevealed' && e.card === card)).toBe(true);
    }
    expect(hand(g)).toEqual([SC.speed, SC.rabiyan, BLUE].sort());
  });

  it('only cards with a [Trigger] can be revealed (a Trigger Event counts, a vanilla does not)', () => {
    const g = played([SC.speed, SC.rabiyan, EVENT_TRIG, BLUE]);
    accept(g);
    // Picks of an unordered pair come in canonical order, so read the reachable pairs, not the first offer.
    const members = new Set(
      [...reachablePickSets(g, 2)].flatMap((s) => s.split('+').filter(Boolean)),
    );
    expect([...members].sort()).toEqual([SC.speed, SC.rabiyan, EVENT_TRIG].sort());
    for (const s of reachablePickSets(g, 2)) expect(s.split('+').length).toBe(2);
  });

  it('"up to 2": choosing 1 target is allowed, and no more than 2 can be K.O.’d', () => {
    const g = played([SC.speed, SC.rabiyan]);
    revealTwo(g);
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    }
    chooseCards(g, [SC.flampe]);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toHaveLength(3);
  });

  it('may K.O. nobody after paying', () => {
    const g = played([SC.speed, SC.rabiyan]);
    revealTwo(g);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toHaveLength(4);
  });

  it('CR 8-3-1-3: with only 1 card with a [Trigger] in hand, the cost cannot be paid', () => {
    const g = played([SC.speed, BLUE, BLUE]);
    skipUnusable(g, 'p1');
    expect(chars(g, 'p2')).toHaveLength(4);
    expect(kind(g)).toBe('main');
  });

  it('CR 8-3-1-4: declining the cost K.O.s nothing', () => {
    const g = played([SC.speed, SC.rabiyan]);
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(chars(g, 'p2')).toHaveLength(4);
    expect(hand(g)).toEqual([SC.speed, SC.rabiyan].sort());
  });

  it('with no cost-1-or-less Characters on the other side, nothing is K.O.’d and nothing breaks', () => {
    const g = played([SC.speed, SC.rabiyan], [VAN.sai, VAN.marco]);
    revealTwo(g);
    if (kind(g) === 'choose') chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toHaveLength(2);
  });
});

describe("OP17-111 Charlotte Mont-d'or: [Trigger] play this card", () => {
  function hit() {
    const g = theirs(YL.bmp, { life: ['OP17-111', ...fill(RED, 3)] });
    hitLeader(g);
    return g;
  }
  it('activating plays her; declining adds her to hand', () => {
    const g = hit();
    activateTrigger(g);
    // Her [On Play] is not [Your Turn]-gated, but with no [Trigger] cards in hand its cost cannot be paid.
    skipUnusable(g, 'p1');
    settleYes(g, 'p1');
    expect(chars(g)).toEqual(['OP17-111']);
    const h = hit();
    declineTrigger(h);
    expect(hand(h)).toEqual(['OP17-111']);
  });
});
