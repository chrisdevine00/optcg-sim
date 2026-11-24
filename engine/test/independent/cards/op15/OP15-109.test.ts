/**
 * OP15-109 Nico Robin (Character, Yellow, cost 7, 7000, Counter +1000, {Straw Hat Crew}/{Sky Island}).
 *
 * Card text: "[On Play] You may add 1 card from the top of your Life cards to your hand: If your Leader has the
 * {Straw Hat Crew} type, add up to 1 card from the top of your deck to the top of your Life cards. Then,
 * play up to 1 {Sky Island} type Character card with a cost of 5 or less from your hand."
 *
 * Rules relied on: CR 8-3-1 / RD 120 (a cost that cannot be paid cannot be paid at all), RD 122 (a "Then"
 * after a failed "If" does not resolve, M4b-5), RD 104 (Life moved outside damage never activates
 * [Trigger]), "up to" may choose nothing, effect plays pay no cost.
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  BLUE,
  chars,
  deck,
  deckTop,
  hand,
  kind,
  LD15,
  lifeCards,
  mayChooseNone,
  mine,
  need,
  no,
  offeredIds,
  pickCards,
  playIt,
  SC15,
  skipChoice,
  unusable,
  yes,
} from './kit-op15c.ts';

const ROBIN = 'OP15-109';
const TOPLIFE = SC15.red2;
const DECKTOP = SC15.red4;

function start(leader: string, o: { life?: string[]; handExtra?: string[] } = {}) {
  const g = mine(leader, {
    hand: [ROBIN, ...(o.handExtra ?? [SC15.sky3, SC15.sky5, SC15.sky6, SC15.red3])],
    life: o.life ?? [TOPLIFE, BLUE, BLUE, BLUE],
    deck: deckTop([DECKTOP, SC15.red5]),
  });
  playIt(g, ROBIN);
  return g;
}

/** Pay the cost and take the deck card into Life, stopping at the play choice. */
function toPlayChoice(g: ReturnType<typeof start>) {
  yes(g, 'p1');
  yes(g, 'p1');
  need(g, 'choose', 'p1');
}

describe('OP15-109 Nico Robin [On Play]', () => {
  it('{Straw Hat Crew} Leader: Life top to hand, deck top to Life top, then play a {Sky Island} Character', () => {
    const g = start(LD15.shc);
    toPlayChoice(g);
    pickCards(g, [SC15.sky5]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([ROBIN, SC15.sky5].sort());
    expect(hand(g)).toEqual([TOPLIFE, SC15.sky3, SC15.sky6, SC15.red3].sort());
    expect(g.life('p1')).toBe(4);
    expect(lifeCards(g)[0]).toBe(DECKTOP);
    expect(deck(g)[0]).toBe(SC15.red5);
  });

  it('the card added to Life is the former top of the deck, and the deck shrinks by exactly 1', () => {
    const g = start(LD15.shc);
    toPlayChoice(g);
    skipChoice(g);
    expect(lifeCards(g)).toEqual([DECKTOP, BLUE, BLUE, BLUE]);
    expect(deck(g)).toHaveLength(11);
  });

  it('boundary: cost 5 and cost 3 {Sky Island} Characters are offered; cost 6 and a non-{Sky Island} are not', () => {
    const g = start(LD15.shc);
    toPlayChoice(g);
    expect(offeredIds(g)).toEqual([SC15.sky3, SC15.sky5].sort());
  });

  it('the played Character is played without paying its cost', () => {
    const g = mine(LD15.shc, {
      hand: [ROBIN, SC15.sky5],
      life: [TOPLIFE, BLUE, BLUE, BLUE],
      deck: deckTop([DECKTOP]),
      costArea: { active: 7, rested: 0 },
    });
    playIt(g, ROBIN);
    toPlayChoice(g);
    pickCards(g, [SC15.sky5]);
    expect(g.life('p1')).toBe(4);
    expect(chars(g)).toEqual([ROBIN, SC15.sky5].sort());
  });

  it('"up to 1": I may play nothing; the Life swap already happened', () => {
    const g = start(LD15.shc);
    toPlayChoice(g);
    expect(mayChooseNone(g)).toBe(true);
    skipChoice(g);
    expect(chars(g)).toEqual([ROBIN]);
    expect(hand(g)).toContain(TOPLIFE);
  });

  it('without a {Straw Hat Crew} Leader the cost is paid, nothing is added to Life and nothing is played', () => {
    const g = start(LD15.sky);
    yes(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toContain(TOPLIFE);
    expect(chars(g)).toEqual([ROBIN]);
    expect(deck(g)).toHaveLength(12);
  });

  it('declining the cost: no Life moves and nothing is played', () => {
    const g = start(LD15.shc);
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.life('p1')).toBe(4);
    expect(chars(g)).toEqual([ROBIN]);
    expect(hand(g)).not.toContain(TOPLIFE);
  });

  it('with 0 Life cards the cost cannot be paid: the effect is not usable', () => {
    const g = start(LD15.shc, { life: [] });
    unusable(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(g.life('p1')).toBe(0);
    expect(chars(g)).toEqual([ROBIN]);
  });

  it('the Life card added to hand is the top one and its [Trigger] does not activate', () => {
    const g = start(LD15.shc, { life: [SC15.speed, BLUE, BLUE, BLUE] });
    toPlayChoice(g);
    skipChoice(g);
    expect(hand(g)).toContain(SC15.speed);
    expect(chars(g)).toEqual([ROBIN]);
  });
});
