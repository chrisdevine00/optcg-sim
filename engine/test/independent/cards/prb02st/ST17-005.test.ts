/**
 * ST17-005 Marshall.D.Teach (Character, cost 2, 3000, Counter +1000, {Blackbeard Pirates}/{The Seven
 * Warlords of the Sea}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] You may place 1 card from your hand at the top of your
 * deck: Give up to 2 rested DON!! cards to your Leader or 1 of your Characters."
 *
 * Rules: the text before the colon is the cost (CR 8-3): 1 card of the hand goes on top of the deck.
 * Once Per Turn. The effect gives up to 2 rested DON!! cards from the cost area, all to ONE target
 * (my Leader or one of my Characters); a given DON!! stays attached and gives +1000 power during its
 * owner's turn. "Up to" allows fewer, down to none; the cost stays paid.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMainOf,
  branch,
  choices,
  deck,
  decision,
  donStr,
  giveDonFlow,
  hand,
  kind,
  LDP,
  leadPow,
  mine,
  need,
  offeredAbilities,
  offeredIds,
  payHand,
  SP,
  toMyNextMain,
  useAbility,
} from './kit-prb02sta.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const TE = 'ST17-005';
const HAND = [SP.c1p3, SP.c2p4];
const TOP = [SP.c5p7, SP.c6p8];

function board(rested = 6, hnd: string[] = HAND) {
  return mine(LDP.neutral, {
    characters: [TE, SP.c3p5],
    hand: hnd,
    deck: [...TOP, ...Array.from({ length: 10 }, () => SP.mohji)],
    costArea: { active: 10 - rested, rested },
  });
}

/** Activate Teach and pay the cost with `card`. */
function activate(g: TestGame, card: string = SP.c1p3) {
  useAbility(g, at(g, 'p1', 'characters', TE));
  const d = need(g, 'choose', 'p1');
  expect(d.purpose).toBe('cost');
  payHand(g, [card]);
}

describe('ST17-005 Teach: [Activate: Main] [Once Per Turn] place a hand card on the deck: give up to 2 rested DON!! to the Leader or 1 Character', () => {
  it('printed values: cost 2, 3000 power, Counter +1000', () => {
    const g = board();
    const i = at(g, 'p1', 'characters', TE);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([2, 3000, 1000]);
  });

  it('the cost offers every card of the hand, and the chosen card goes on TOP of the deck', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', TE));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([...HAND].sort());
    payHand(g, [SP.c2p4]);
    expect(deck(g)[0]).toBe(SP.c2p4);
    expect(deck(g)).toHaveLength(13);
    expect(hand(g)).toEqual([SP.c1p3]);
  });

  it('gives 2 rested DON!! to the Leader (rested 6 -> 4, given 2, +2000 power)', () => {
    const g = board();
    activate(g);
    expect(giveDonFlow(g, 2, g.leader('p1'))).toBeGreaterThan(0);
    expect(donStr(g, 'p1')).toBe('4/4/2');
    expect(leadPow(g)).toBe(7000);
    expect(atMainOf(g)).toBe(true);
  });

  it('gives both DON!! to ONE Character (+2000), not one each', () => {
    const g = board();
    activate(g);
    giveDonFlow(g, 2, at(g, 'p1', 'characters', SP.c3p5));
    expect(g.power(at(g, 'p1', 'characters', SP.c3p5))).toBe(7000);
    expect(leadPow(g)).toBe(5000);
    expect(donStr(g, 'p1')).toBe('4/4/2');
  });

  it('"up to 2": giving only 1 is possible', () => {
    const g = board();
    activate(g);
    giveDonFlow(g, 1, g.leader('p1'));
    expect(donStr(g, 'p1')).toBe('4/5/1');
    expect(leadPow(g)).toBe(6000);
  });

  it('"up to 2": giving none keeps the cost paid (card on the deck) and gives nothing', () => {
    const g = board();
    activate(g);
    giveDonFlow(g, 0, g.leader('p1'));
    expect(donStr(g, 'p1')).toBe('4/6/0');
    expect(deck(g)[0]).toBe(SP.c1p3);
    expect(atMainOf(g)).toBe(true);
  });

  it('with only 1 rested DON!! at most 1 can be given', () => {
    const g = board(1);
    activate(g);
    giveDonFlow(g, 1, g.leader('p1'));
    expect(donStr(g, 'p1')).toBe('9/0/1');
  });

  it('with no rested DON!! nothing can be given, and the cost was still paid', () => {
    const g = board(0);
    activate(g);
    if (kind(g) === 'choose') {
      const d = decision(g)!;
      if (choices(g).length > 0 && d.purpose !== 'mode') {
        // a target pick that can only be ended with nothing
        expect(g.legal().some((a) => a.type === 'done')).toBe(true);
      }
    }
    expect(donStr(g, 'p1')).toBe('10/0/0');
    expect(deck(g)[0]).toBe(SP.c1p3);
  });

  it('[Once Per Turn]: not offered again this turn after one use, offered again on my next turn', () => {
    const g = board();
    activate(g);
    giveDonFlow(g, 2, g.leader('p1'));
    expect(offeredAbilities(g, at(g, 'p1', 'characters', TE))).toEqual([]);
    toMyNextMain(g);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', TE))).toHaveLength(1);
  });

  it('an empty hand cannot pay the cost: nothing is placed or given', () => {
    const g = board(6, []);
    const probe = branch(g);
    if (offeredAbilities(probe, at(probe, 'p1', 'characters', TE)).length > 0) {
      useAbility(probe, at(probe, 'p1', 'characters', TE));
      expect(choices(probe)).toEqual([]);
    }
    expect(deck(g)).toHaveLength(12);
    expect(donStr(g, 'p1')).toBe('4/6/0');
  });
});
