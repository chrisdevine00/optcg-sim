/**
 * EB05-007 Monet (Character, Red, cost 2, 1000, Counter +2000, {Donquixote Pirates}/{Punk Hazard}).
 *
 * Card text: "[On Play] You may reveal a total of 3 Event or {Punk Hazard} type cards from your hand:
 * Draw 1 card.
 * [End of Your Turn] This Character gains +5000 power until the end of your opponent's next End Phase."
 *
 * Rules: CR 8-3-1-3/-4 (costs), CR 11-2-2, CR 6-6-1-1 ([End of Your Turn]), RL-11 ("until the end of
 * your opponent's next End Phase").
 */
import { describe, expect, it } from 'vitest';
import { endTurn, fill } from '../../helpers.ts';
import {
  accept,
  BLUE,
  choose,
  decline,
  deck,
  EC,
  EL,
  EV,
  hand,
  inHand,
  mine,
  offered,
  playCard,
  reachablePickSets,
  settleYes,
  skipUnusable,
  VAN,
} from './kit-eb05a.ts';

const MONET = 'EB05-007';
/** OP01-081 Mocha: Blue, cost 3, 5000, {Punk Hazard}. Vanilla. */
const MOCHA_BLUE = 'OP01-081';
/** OP10-013 Nami: Red, cost 5, 7000, {Straw Hat Crew}/{Punk Hazard}. Vanilla. */
const NAMI_PH = 'OP10-013';

function played(inHandCards: string[]) {
  const g = mine(EL.croc, { hand: [MONET, ...inHandCards], deck: fill(BLUE, 12) });
  playCard(g, MONET);
  return g;
}

describe('EB05-007 Monet: [On Play] reveal 3 Event or {Punk Hazard} cards: draw 1', () => {
  it('3 mixed cards (Event, Event, Punk Hazard) can be revealed to draw 1 card', () => {
    const g = played([EV.redA, EV.redB, EC.mocha]);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    choose(g, [inHand(g, EV.redA), inHand(g, EV.redB), inHand(g, EC.mocha)]);
    settleYes(g, 'p1');
    expect(hand(g)).toEqual([BLUE, EV.redA, EV.redB, EC.mocha].sort());
    expect(deck(g)).toHaveLength(11);
  });

  it('3 {Punk Hazard} Characters also qualify (no Event needed)', () => {
    const g = played([EC.mocha, MOCHA_BLUE, NAMI_PH]);
    accept(g);
    choose(g, [inHand(g, EC.mocha), inHand(g, MOCHA_BLUE), inHand(g, NAMI_PH)]);
    settleYes(g, 'p1');
    expect(deck(g)).toHaveLength(11);
  });

  it('CR 8-3-1-3: with only 2 qualifying cards (and others that do not) the cost cannot be paid', () => {
    const g = played([EV.redA, EC.mocha, VAN.mohji, EC.fullbody]);
    skipUnusable(g, 'p1');
    expect(deck(g)).toHaveLength(12);
    expect(hand(g)).toEqual([EV.redA, EC.mocha, VAN.mohji, EC.fullbody].sort());
  });

  it('CR 8-3-1-4: declining the cost draws nothing; Monet is still played', () => {
    const g = played([EV.redA, EV.redB, EC.mocha]);
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(deck(g)).toHaveLength(12);
    expect(hand(g)).toHaveLength(3);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([MONET]);
  });

  it('only qualifying cards may be revealed; exactly 3 (never 4) are revealed', () => {
    const g = played([EV.redA, EV.redB, EC.mocha, NAMI_PH, VAN.mohji]);
    accept(g);
    const sets = [...reachablePickSets(g)].filter(Boolean);
    expect(sets.length).toBeGreaterThan(0);
    for (const s of sets) {
      const cards = s.split('+');
      expect(cards).toHaveLength(3);
      expect(cards).not.toContain(VAN.mohji);
    }
  });

  it('draws exactly 1 card', () => {
    const g = played([EV.redA, EV.redB, EC.mocha]);
    accept(g);
    choose(g, [inHand(g, EV.redA), inHand(g, EV.redB), inHand(g, EC.mocha)]);
    settleYes(g, 'p1');
    expect(deck(g)).toHaveLength(11);
    expect(hand(g)).toContain(BLUE);
    expect(hand(g).filter((c) => c === BLUE)).toHaveLength(1);
  });
});

describe('EB05-007 Monet: [End of Your Turn] +5000 until the end of the opponent’s next End Phase', () => {
  const monetPower = (g: ReturnType<typeof played>) => g.power(g.find('p1', 'characters', MONET));
  function onField() {
    return mine(EL.croc, { characters: [MONET] });
  }

  it('is 1000 during my Main Phase, +5000 once my turn has ended', () => {
    const g = onField();
    expect(monetPower(g)).toBe(1000);
    endTurn(g);
    expect(monetPower(g)).toBe(6000);
  });

  it('stays +5000 through the opponent’s whole turn and ends at the end of their End Phase', () => {
    const g = onField();
    endTurn(g);
    expect(monetPower(g)).toBe(6000);
    endTurn(g);
    expect(monetPower(g)).toBe(1000);
  });

  it('the bonus does not stack across turns: the next End of Your Turn gives a fresh +5000', () => {
    const g = onField();
    endTurn(g);
    endTurn(g);
    expect(monetPower(g)).toBe(1000);
    endTurn(g);
    expect(monetPower(g)).toBe(6000);
  });

  it('does not happen at the end of the OPPONENT’s turn alone: Monet is 1000 in the opponent’s Main Phase before any End of Your Turn', () => {
    const g = onField();
    expect(monetPower(g)).toBe(1000);
  });

  it('a Monet played this turn also gains the bonus at the end of this turn', () => {
    const g = played([]);
    decline(g);
    expect(monetPower(g)).toBe(1000);
    endTurn(g);
    expect(monetPower(g)).toBe(6000);
  });
});
