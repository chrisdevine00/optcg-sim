/**
 * EB02-052 Enel (Character, Yellow, cost 10, 11000, no Counter, {Sky Island}).
 *
 * Card text: "If your Leader has the {Sky Island} type, this Character gains [Rush].
 * [When Attacking] You may trash 1 card from your hand: If you have 1 or less Life cards, add up to 1
 * card from the top of your deck to the top of your Life cards. Then, this Character gains +1000 power
 * during this turn."
 *
 * Rules: CR 10-2-8 ([Rush]), CR 8-3-1-3/-4 (costs), CR 8-3-3 (a failed "if" resolves nothing),
 * CR 8-4-4-1 ("up to" allows 0), RL-09 ("during this turn").
 * Reading of "If ..., A. Then, B.": text after a failed "if" does not resolve (CR 8-3-3), so the +1000 is
 * skipped when the Life condition fails (the text is two sentences, so this reading is open to doubt).
 */
import { describe, expect, it } from 'vitest';
import { attack, canAttack, endTurn, fill, noDefence } from '../../helpers.ts';
import {
  accept,
  BLUE,
  declineAny,
  decline,
  deck,
  hand,
  kind,
  lifeCards,
  mine,
  offered,
  payWith,
  playCard,
  RED,
  SC,
  settleYes,
  skipUnusable,
  trash,
  YL,
} from './kit-a.ts';

const ENEL = 'EB02-052';

function attacking(
  life: string[],
  handCards: string[] = [BLUE, SC.bobbin],
  leader: string = YL.sky,
) {
  const g = mine(leader, {
    characters: [ENEL],
    hand: handCards,
    life,
    deck: [SC.opera, ...fill(BLUE, 10)],
  });
  attack(g, g.find('p1', 'characters', ENEL), g.leader('p2'));
  return g;
}
const power = (g: ReturnType<typeof attacking>) => g.power(g.find('p1', 'characters', ENEL));

describe('EB02-052 Enel: [Rush] if your Leader has {Sky Island}', () => {
  it('with a {Sky Island} Leader it can attack the turn it is played', () => {
    const g = mine(YL.sky, { hand: [ENEL] });
    playCard(g, ENEL);
    const enel = g.find('p1', 'characters', ENEL);
    expect(g.card(enel).keywords).toContain('Rush');
    expect(canAttack(g, enel, g.leader('p2'))).toBe(true);
  });

  it('with a Leader of another type it has no [Rush]', () => {
    const g = mine(YL.neutral, { hand: [ENEL] });
    playCard(g, ENEL);
    const enel = g.find('p1', 'characters', ENEL);
    expect(g.card(enel).keywords).not.toContain('Rush');
    expect(canAttack(g, enel, g.leader('p2'))).toBe(false);
  });
});

describe('EB02-052 Enel: [When Attacking] trash 1 card: with 1 or less Life add to Life, then +1000', () => {
  it('1 Life: the deck top goes on top of Life and Enel gets +1000 (12000); the trashed card is in the trash', () => {
    const g = attacking([RED]);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payWith(g, [g.find('p1', 'hand', SC.bobbin)]);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(2);
    expect(lifeCards(g)[0]).toBe(SC.opera);
    expect(deck(g)).toHaveLength(10);
    expect(trash(g)).toEqual([SC.bobbin]);
    expect(power(g)).toBe(12000);
  });

  it('0 Life also meets "1 or less"', () => {
    const g = attacking([]);
    accept(g);
    payWith(g, [g.find('p1', 'hand', BLUE)]);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(1);
    expect(power(g)).toBe(12000);
  });

  it('CR 8-3-3: with 2 Life the Life card is not added (the card was still trashed as the cost)', () => {
    const g = attacking([RED, RED]);
    accept(g);
    payWith(g, [g.find('p1', 'hand', BLUE)]);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(2);
    expect(deck(g)).toHaveLength(11);
    expect(trash(g)).toEqual([BLUE]);
  });

  it('CR 8-3-3: with 2 Life the "Then, +1000" does not resolve either (power stays 11000)', () => {
    const g = attacking([RED, RED]);
    accept(g);
    payWith(g, [g.find('p1', 'hand', BLUE)]);
    settleYes(g, 'p1');
    expect(power(g)).toBe(11000);
  });

  it('CR 8-4-4-1: "up to 1": after paying, may add no Life card (+1000 aside)', () => {
    const g = attacking([RED]);
    accept(g);
    payWith(g, [g.find('p1', 'hand', BLUE)]);
    declineAny(g);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(1);
    expect(deck(g)).toHaveLength(11);
  });

  it('CR 8-3-1-4: declining the cost does nothing: no trash, no Life, no power', () => {
    const g = attacking([RED]);
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(hand(g)).toHaveLength(2);
    expect(g.life('p1')).toBe(1);
    expect(power(g)).toBe(11000);
  });

  it('CR 8-3-1-3: with an empty hand the cost cannot be paid', () => {
    const g = attacking([RED], []);
    skipUnusable(g, 'p1');
    expect(g.life('p1')).toBe(1);
    expect(power(g)).toBe(11000);
  });

  it('the +1000 lasts for this turn only', () => {
    const g = attacking([RED]);
    accept(g);
    payWith(g, [g.find('p1', 'hand', BLUE)]);
    settleYes(g, 'p1');
    noDefence(g);
    expect(power(g)).toBe(12000);
    endTurn(g);
    expect(power(g)).toBe(11000);
    expect(kind(g)).toBe('main');
  });
});
