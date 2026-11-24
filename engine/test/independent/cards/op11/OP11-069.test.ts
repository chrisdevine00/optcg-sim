/**
 * OP11-069 Charlotte Brulee (Purple Character, cost 3, 4000, Counter +1000, {Big Mom Pirates}).
 *
 * Card text: "[On Play] You may add 1 card from the top of your Life cards to your hand: If your Leader
 * has the {Big Mom Pirates} type, add up to 1 DON!! card from your DON!! deck and set it as active."
 *
 * Rules: the Life card is an optional cost (it needs a Life card); it goes to the hand without its
 * [Trigger] (CR 10-2-?). The cost is paid whatever the Leader is; the "If" is checked afterwards.
 * "Add up to 1 DON!!" asks a count (E-Q11); the DON!! comes in active (CR 6-1?).
 */
import { describe, expect, it } from 'vitest';
import {
  answerIfAsked,
  BLUE,
  C11,
  deck,
  donCountOptions,
  donOf,
  E11,
  fill,
  hand,
  kind,
  L11,
  lifeCards,
  mine,
  need,
  no,
  playCard,
  takeDon,
  trash,
  unusable,
  yes,
} from './kit-op11b.ts';

const BRULEE = 'OP11-069';
const LIFE = [C11.c3, C11.c4, BLUE, BLUE];

function play(leader: string, life: string[] = LIFE, active = 5) {
  const g = mine(leader, { hand: [BRULEE], life, costArea: { active, rested: 0 } });
  playCard(g, BRULEE);
  return g;
}

describe('OP11-069 Charlotte Brulee: [On Play] you may add the top Life card to hand: with a {Big Mom Pirates} Leader, add 1 active DON!!', () => {
  it('with a {Big Mom Pirates} Leader: the top Life card goes to hand and 1 DON!! is added active', () => {
    const g = play(L11.bmp);
    need(g, 'optional', 'p1');
    yes(g);
    takeDon(g, 1);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([C11.c3]);
    expect(lifeCards(g)).toEqual([C11.c4, BLUE, BLUE]);
    const d = donOf(g, 'p1');
    expect(d.deck).toBe(4);
    expect(d.rested).toBe(3);
    expect(d.active).toBe(3);
  });

  it('the DON!! count question offers 1 and 0 ("up to 1")', () => {
    const g = play(L11.bmp);
    yes(g);
    expect(donCountOptions(g).sort()).toEqual(['0', '1']);
  });

  it('answering 0 adds no DON!!, but the Life card was already paid', () => {
    const g = play(L11.bmp);
    yes(g);
    takeDon(g, 0);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([C11.c3]);
    expect(donOf(g, 'p1').deck).toBe(5);
    expect(kind(g)).toBe('main');
  });

  it('declining the cost: no Life card moves and no DON!! is added', () => {
    const g = play(L11.bmp);
    need(g, 'optional', 'p1');
    no(g);
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([]);
    expect(donOf(g, 'p1').deck).toBe(5);
    expect(kind(g)).toBe('main');
  });

  it('without a {Big Mom Pirates} Leader the cost is still paid, but no DON!! is added', () => {
    const g = play(L11.mono);
    yes(g);
    expect(kind(g)).toBe('main');
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([C11.c3]);
    expect(donOf(g, 'p1').deck).toBe(5);
  });

  it('with no Life cards the cost cannot be paid', () => {
    const g = play(L11.bmp, []);
    unusable(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(donOf(g, 'p1').deck).toBe(5);
    expect(hand(g)).toEqual([]);
  });

  it('with an empty DON!! deck the Life card is added and no DON!! comes', () => {
    const g = play(L11.bmp, LIFE, 10);
    yes(g);
    if (kind(g) === 'choose') takeDon(g, 0);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([C11.c3]);
    expect(donOf(g, 'p1').deck).toBe(0);
    expect(kind(g)).toBe('main');
  });

  it('a Life card with a [Trigger] added to the hand by this cost does not activate it', () => {
    const g = play(L11.bmp, [E11.poseidon37, C11.c4, BLUE, BLUE]);
    yes(g);
    takeDon(g, 1);
    expect(hand(g)).toEqual([E11.poseidon37]);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
  });

  it('only 1 Life card is taken', () => {
    const g = play(L11.bmp, fill(BLUE, 5));
    yes(g);
    takeDon(g, 1);
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toHaveLength(1);
  });
});

void answerIfAsked;
