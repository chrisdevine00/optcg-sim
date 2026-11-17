/**
 * OP17-106 Charlotte Smoothie (Character, Yellow, cost 5, 4000, Counter +1000, {Big Mom Pirates}).
 *
 * Card text: "[Your Turn] [On Play] You may rest 2 of your DON!! cards: Add up to 1 card from the top
 * of your deck to the top of your Life cards. Then, your opponent trashes 1 card from their hand.
 * [Trigger] Play this card."
 *
 * Rules: CR 8-3-2-4 ([Your Turn] is a condition: the turn player only), CR 8-3-1-3/-4 (costs),
 * CR 8-3-1-5 (resting DON!! = resting active cost-area DON!!), CR 1-3-2 (an impossible instruction
 * does nothing), CR 10-1-5 ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  accept,
  activateTrigger,
  BLUE,
  chars,
  choose,
  count,
  decider,
  decline,
  deck,
  don,
  finishEmpty,
  hand,
  hitLeader,
  kind,
  lifeCards,
  mine,
  offered,
  playCard,
  RED,
  SC,
  settleYes,
  skipUnusable,
  theirs,
  trash,
  VAN,
  YL,
} from './kit-a.ts';

function played(active: number, p2Hand: string[]) {
  const g = mine(
    YL.bmp,
    {
      hand: ['OP17-106'],
      costArea: { active, rested: 0 },
      life: fill(RED, 3),
      deck: [SC.bobbin, ...fill(BLUE, 10)],
    },
    { hand: p2Hand },
  );
  playCard(g, 'OP17-106');
  return g;
}

describe('OP17-106 Charlotte Smoothie: [Your Turn] [On Play] rest 2 DON!!, add to Life, opponent trashes 1', () => {
  it('paying: top of deck goes on top of Life, 2 DON!! rest, then the OPPONENT chooses and trashes 1 card', () => {
    const g = played(7, [VAN.marco, VAN.sai]);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(4);
    expect(lifeCards(g)[0]).toBe(SC.bobbin);
    expect(deck(g)).toHaveLength(10);
    expect(don(g)).toMatchObject({ active: 0, rested: 7 });
    // Now the opponent owes the trash choice.
    expect(decider(g)).toBe('p2');
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p2', 'hand', VAN.sai)]);
    expect(hand(g, 'p2')).toEqual([VAN.marco]);
    expect(trash(g, 'p2')).toEqual([VAN.sai]);
  });

  it('declining the cost: no DON!! rested, no Life added, the opponent keeps their hand', () => {
    const g = played(7, [VAN.marco, VAN.sai]);
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(don(g)).toMatchObject({ active: 2, rested: 5 });
    expect(g.life('p1')).toBe(3);
    expect(count(g, 'p2', 'hand')).toBe(2);
    expect(kind(g)).toBe('main');
  });

  it('CR 8-3-1-3: with only 1 active DON!! left after paying 5, the cost cannot be paid', () => {
    const g = played(6, [VAN.marco]);
    skipUnusable(g, 'p1');
    expect(g.life('p1')).toBe(3);
    expect(count(g, 'p2', 'hand')).toBe(1);
  });

  it('an opponent with an empty hand trashes nothing, and the Life card is still added', () => {
    const g = played(7, []);
    accept(g);
    settleYes(g, 'p1');
    finishEmpty(g);
    expect(g.life('p1')).toBe(4);
    expect(kind(g)).toBe('main');
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('an opponent with exactly 1 card must trash it', () => {
    const g = played(7, [VAN.marco]);
    accept(g);
    settleYes(g, 'p1');
    if (kind(g) === 'choose') choose(g, [g.find('p2', 'hand', VAN.marco)]);
    expect(hand(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([VAN.marco]);
  });
});

describe('OP17-106 Charlotte Smoothie: [Trigger] play this card, but it is not [Your Turn]', () => {
  function hit() {
    const g = theirs(
      YL.bmp,
      {
        life: ['OP17-106', ...fill(RED, 3)],
        costArea: { active: 2, rested: 0 },
        deck: [SC.bobbin, ...fill(BLUE, 10)],
      },
      { hand: [VAN.marco, VAN.sai] },
    );
    hitLeader(g);
    return g;
  }

  it('played by [Trigger] on the opponent’s turn she enters, but [On Play] does not activate', () => {
    const g = hit();
    activateTrigger(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual(['OP17-106']);
    // No Life added, DON!! not rested, opponent's hand untouched, the turn goes on with p2.
    expect(g.life('p1')).toBe(3);
    expect(don(g)).toMatchObject({ active: 2, rested: 0 });
    expect(count(g, 'p2', 'hand')).toBe(2);
    expect(kind(g)).toBe('main');
    expect(decider(g)).toBe('p2');
  });
});
