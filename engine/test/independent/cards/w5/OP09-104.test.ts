/**
 * OP09-104 Sabo (Character, Yellow, cost 7, 7000, Counter +1000, Special, {Revolutionary Army}).
 *
 * Card text: "[On Play] Add up to 1 "Revolutionary Army" type Character card from your hand to the top
 * of your Life cards face-up. Then, if you have 2 or more Life cards, add 1 card from the top or
 * bottom of your Life cards to your hand.
 * [Trigger] If your Leader is multicolored, draw 2 cards."
 *
 * (The quoted type is the exact {Revolutionary Army} type; the data prints it with quotes.)
 *
 * Rules: CR 3-10-2-1 (a Life card added face-up), CR 4-8-1 / 8-4-4-2 ("up to" over hidden cards),
 * CR 8-3-3 / 4-10-2 ("if" before "then"), CR 4-6-3 / 10-1-5 ([Trigger] activates only on damage),
 * CR 10-1-5-3 (a [Trigger] card is trashed after it resolves), CR 2-3-5 (multicoloured).
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import { project } from '@optcg/engine';
import { act, decision } from '../../helpers.ts';
import { canFinish, choices, myTurn, side, theirTurn } from '../kit.ts';
import {
  activateTrigger,
  declineTrigger,
  hand,
  hitLeader,
  lifeCards,
  trash,
} from '../m4b/kit-a.ts';
import { BLUE, LW, need, offeredIds, put, RED, SW } from './kit-w5a.ts';

const ID = 'OP09-104';
const [A, B, C] = [SW.c1, SW.sai, SW.kingdew]; // Life cards, top first
/** OP01-104 Speed: a purple Character with "[Trigger] Play this card." */
const SPEED = 'OP01-104';

type Life = NonNullable<PlayerSpec['life']>;

function start(o: { life?: Life; hand?: CardId[]; leader?: string } = {}) {
  return myTurn(
    side(o.leader ?? LW.luffy, BLUE, {
      hand: [ID, ...(o.hand ?? [SW.koala, SW.hack, SW.marco])],
      costArea: { active: 7, rested: 0 },
      life: o.life ?? [A, B, C],
    }),
    side(LW.luffy, RED, {}),
  );
}

/** Pick the top or bottom Life card for the "top or bottom" question. */
function topOrBottom(g: ReturnType<typeof start>, which: 'top' | 'bottom') {
  const d = need(g, 'choose', 'p1');
  expect(d.purpose).toBe('mode');
  act(g, { type: 'pick', choice: { option: which } });
}

/** Pick a card (by card id) at the "up to 1 from hand" question. */
function addFromHand(g: ReturnType<typeof start>, card: CardId) {
  need(g, 'choose', 'p1');
  const i = choices(g).find((c) => g.card(c).card === card);
  if (!i) throw new Error(`${card} is not offered; offered ${offeredIds(g)}`);
  act(g, { type: 'pick', choice: i });
}

describe('OP09-104 Sabo: [On Play] add up to 1 {Revolutionary Army} Character from hand to Life face-up; then with 2+ Life, add top or bottom Life to hand', () => {
  it('adds the chosen Revolutionary Army Character to the TOP of my Life face-up; "bottom" then takes the old bottom card', () => {
    const g = start();
    put(g, ID);
    addFromHand(g, SW.koala);
    topOrBottom(g, 'bottom');
    need(g, 'main', 'p1');
    expect(lifeCards(g)).toEqual([SW.koala, A, B]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(hand(g)).toContain(C);
    expect(hand(g)).not.toContain(SW.koala);
  });

  it('"top" takes the card just added back to my hand: the Life is as it was', () => {
    const g = start();
    put(g, ID);
    addFromHand(g, SW.koala);
    topOrBottom(g, 'top');
    need(g, 'main', 'p1');
    expect(lifeCards(g)).toEqual([A, B, C]);
    expect(hand(g)).toContain(SW.koala);
  });

  it('only {Revolutionary Army} Characters are offered: not a Character of another type', () => {
    const g = start({ hand: [SW.koala, SW.hack, SW.morley, SW.terry, SW.marco, SW.sai] });
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SW.koala, SW.hack, SW.morley, SW.terry].sort());
  });

  it('"up to 1": choosing none adds nothing; with 3 Life the second part still happens (top)', () => {
    const g = start();
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    topOrBottom(g, 'top');
    need(g, 'main', 'p1');
    expect(lifeCards(g)).toEqual([B, C]);
    expect(hand(g)).toContain(A);
  });

  it('with exactly 2 Life cards the second part happens (2 or more): the bottom one goes to hand', () => {
    const g = start({ life: [A, B] });
    put(g, ID);
    act(g, { type: 'done' });
    topOrBottom(g, 'bottom');
    need(g, 'main', 'p1');
    expect(lifeCards(g)).toEqual([A]);
    expect(hand(g)).toContain(B);
  });

  it('with only 1 Life card and nothing added the second part does not happen (boundary): no question, Life stays', () => {
    const g = start({ life: [A] });
    put(g, ID);
    act(g, { type: 'done' });
    need(g, 'main', 'p1');
    expect(lifeCards(g)).toEqual([A]);
  });

  it('1 Life card plus the added card makes 2: the second part happens, and the count is taken after the add', () => {
    const g = start({ life: [A] });
    put(g, ID);
    addFromHand(g, SW.hack);
    topOrBottom(g, 'bottom');
    need(g, 'main', 'p1');
    // Life was [Hack, A]; the bottom card A goes to hand.
    expect(lifeCards(g)).toEqual([SW.hack]);
    expect(hand(g)).toContain(A);
  });

  it('0 Life cards plus the added card makes only 1: the added card stays as my only Life card', () => {
    const g = start({ life: [] });
    put(g, ID);
    addFromHand(g, SW.hack);
    need(g, 'main', 'p1');
    expect(lifeCards(g)).toEqual([SW.hack]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
  });

  it('the pick over my hand is asked even when no card qualifies (no prompt may depend on hidden cards)', () => {
    const g = start({ hand: [SW.marco, SW.sai] });
    put(g, ID);
    const d = decision(g);
    expect(d?.kind).toBe('choose');
    expect(choices(g)).toEqual([]);
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    topOrBottom(g, 'top');
    need(g, 'main', 'p1');
    expect(lifeCards(g)).toEqual([B, C]);
  });

  it('a Life card added to hand by the effect does not activate its [Trigger]', () => {
    const g = start({ life: [SPEED, B, C] });
    put(g, ID);
    act(g, { type: 'done' });
    topOrBottom(g, 'top');
    need(g, 'main', 'p1');
    expect(hand(g)).toContain(SPEED);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('the card from hand is revealed or at least moves face-up: it is public in my Life', () => {
    const g = start();
    put(g, ID);
    addFromHand(g, SW.koala);
    topOrBottom(g, 'bottom');
    expect(g.zone('p1', 'life')[0]!.card).toBe(SW.koala);
  });
});

describe('OP09-104 Sabo: what the opponent can see of the hand pick', () => {
  it('the opponent sees the same decision whether or not my hand holds a Revolutionary Army Character', () => {
    const view = (g: ReturnType<typeof start>) => {
      const v = project(g.state, 'p2');
      return {
        kind: v.decision?.kind,
        player: v.decision?.player,
        purpose: v.decision?.purpose,
        prompt: v.decision?.prompt,
        hand: v.zones.p1.hand.length,
      };
    };
    const withRa = start({ hand: [SW.koala, SW.marco] });
    const without = start({ hand: [SW.sai, SW.marco] });
    put(withRa, ID);
    put(without, ID);
    expect(view(without)).toEqual(view(withRa));
  });
});

describe('OP09-104 Sabo: [Trigger] if my Leader is multicoloured, draw 2', () => {
  /** p2 hits p1's Leader; p1's top Life card is Sabo. */
  function hitWith(leader: string) {
    const g = theirTurn(side(leader, BLUE, { life: [ID, A, B, C] }), side(LW.luffy, RED, {}));
    hitLeader(g);
    return g;
  }

  it('multicoloured Leader (Trafalgar Law, Green/Red): activating the Trigger draws 2 cards, and Sabo is trashed', () => {
    const g = hitWith(LW.law);
    need(g, 'trigger', 'p1');
    const before = hand(g).length;
    activateTrigger(g);
    expect(hand(g)).toHaveLength(before + 2);
    expect(trash(g)).toContain(ID);
    expect(g.zone('p1', 'life')).toHaveLength(3);
  });

  it('another multicoloured Leader (Lim, Green/Purple) draws 2 as well', () => {
    const g = hitWith(LW.lim);
    activateTrigger(g);
    expect(hand(g)).toHaveLength(2);
  });

  it('a single-colour Leader (Luffy, Red): the Trigger draws nothing and Sabo is still trashed', () => {
    const g = hitWith(LW.luffy);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    expect(hand(g)).toHaveLength(0);
    expect(trash(g)).toContain(ID);
  });

  it('not activating the Trigger: Sabo goes to my hand and nothing is drawn', () => {
    const g = hitWith(LW.law);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(trash(g)).not.toContain(ID);
  });
});
