/**
 * PRB02-010 Charlotte Pudding (Character, cost 7, 5000, Counter +1000, {Big Mom Pirates}).
 *
 * Card text: "[On Play] DON!! -2: If your Leader has the "Big Mom Pirates" type and your opponent has
 * 6 or more DON!! cards on their field, draw 2 cards. Then, play up to 1 "Big Mom Pirates" type
 * Character card with 6000 to 8000 power from your hand."
 *
 * Rules: "DON!! -2" is a cost (return 2 DON!! cards from the field to the DON!! deck, CR 8-3);
 * the "If" after the colon is an effect condition, so the cost is paid even when the check fails,
 * and the "Then" after a failed "If" does not resolve (M4b-5). "DON!! cards on their field" counts
 * the cost area and DON!! given to the Leader or Characters. The draw comes before the play, so a
 * drawn card can be played. Playing from hand by an effect costs nothing. "Up to 1".
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  canUse,
  decision,
  donStr,
  hand,
  kind,
  LDP,
  mine,
  need,
  no,
  none,
  offeredIds,
  payDon,
  pickCards,
  playRaw,
  SP,
  sorted,
  yes,
  deck,
  BLUE,
} from './kit-prb02sta.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const PU = 'PRB02-010';
const DECK = [SP.c1p3, SP.c2p4, SP.c3p5, SP.c4p6, ...Array.from({ length: 8 }, () => BLUE)];

function board(opts: {
  leader?: string;
  oppActive?: number;
  oppRested?: number;
  oppGiven?: number;
  hnd?: string[];
  top?: string[];
}) {
  const oppActive = opts.oppActive ?? 6;
  const p2: Record<string, unknown> = {
    costArea: { active: oppActive, rested: opts.oppRested ?? 0 },
  };
  if (opts.oppGiven) p2.leader = { card: LDP.neutral, don: opts.oppGiven };
  const g = mine(
    opts.leader ?? LDP.bmp,
    { hand: [PU, ...(opts.hnd ?? [])], deck: opts.top ?? DECK },
    p2,
  );
  playRaw(g, PU);
  return g;
}

/** Accept the "use" question and pay DON!! -2 (any DON!!). */
function useIt(g: TestGame) {
  yes(g, 'p1');
  payDon(g, 2, 'costRested');
}

describe('PRB02-010 Charlotte Pudding: [On Play] DON!! -2: if BMP Leader and opponent has 6+ DON!!, draw 2 then play a BMP 6000-8000 from hand', () => {
  it('printed values: cost 7, 5000 power, Counter +1000', () => {
    const g = mine(LDP.bmp, { characters: [PU] });
    const i = at(g, 'p1', 'characters', PU);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([7, 5000, 1000]);
  });

  it('with a BMP Leader and exactly 6 opposing DON!!: pays DON!! -2, draws 2 and offers BMP Characters with 6000 to 8000 power only', () => {
    const g = board({ hnd: [SP.bmp4, SP.bmp5, SP.bmp6, SP.bmp7, SP.bmp8, SP.bmp9, SP.c5p7] });
    useIt(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.bmp6, SP.bmp7, SP.bmp8].sort());
    expect(hand(g)).toHaveLength(9);
    expect(donStr(g, 'p1')).toBe('3/5/0');
  });

  it('the played card comes from hand onto the field for free, and only 1 is played', () => {
    const g = board({ hnd: [SP.bmp6, SP.bmp8] });
    useIt(g);
    pickCards(g, [SP.bmp8]);
    expect(sorted(g, 'p1', 'characters')).toEqual([PU, SP.bmp8].sort());
    expect(hand(g)).toContain(SP.bmp6);
    expect(donStr(g, 'p1')).toBe('3/5/0');
    expect(kind(g)).toBe('main');
  });

  it('the draw comes before the play: a drawn {Big Mom Pirates} 7000 card can be the one played', () => {
    const g = board({ top: [SP.bmp7, SP.c1p3, ...DECK] });
    useIt(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.bmp7]);
    pickCards(g, [SP.bmp7]);
    expect(sorted(g, 'p1', 'characters')).toEqual([PU, SP.bmp7].sort());
    expect(hand(g)).toEqual([SP.c1p3]);
  });

  it('opponent has only 5 DON!!: the cost is paid anyway, nothing is drawn and nothing is played', () => {
    const g = board({ oppActive: 5, hnd: [SP.bmp8] });
    useIt(g);
    expect(kind(g)).toBe('main');
    expect(donStr(g, 'p1')).toBe('3/5/0');
    expect(hand(g)).toEqual([SP.bmp8]);
    expect(sorted(g, 'p1', 'characters')).toEqual([PU]);
  });

  it("the opponent's DON!! count includes rested ones and DON!! given to their Leader (4 cost area + 2 given = 6)", () => {
    const g = board({ oppActive: 2, oppRested: 2, oppGiven: 2, hnd: [SP.bmp8] });
    useIt(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.bmp8]);
  });

  it('Leader without {Big Mom Pirates}: cost paid, no draw, no play, nothing asked', () => {
    const g = board({ leader: LDP.neutral, hnd: [SP.bmp8] });
    useIt(g);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([SP.bmp8]);
    expect(donStr(g, 'p1')).toBe('3/5/0');
  });

  it('"you may" is not printed but the cost is a choice: declining returns no DON!! and draws nothing', () => {
    const g = board({ hnd: [SP.bmp8] });
    expect(canUse(g)).toBe(true);
    no(g, 'p1');
    expect(donStr(g, 'p1')).toBe('3/7/0');
    expect(hand(g)).toEqual([SP.bmp8]);
    expect(deck(g)).toHaveLength(12);
  });

  it('"up to 1": choosing nothing plays nothing (the 2 cards are still drawn)', () => {
    const g = board({ hnd: [SP.bmp8] });
    useIt(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(sorted(g, 'p1', 'characters')).toEqual([PU]);
    expect(hand(g)).toHaveLength(3);
  });

  it('with no eligible card in hand the 2 cards are drawn and the play finds nothing', () => {
    const g = board({ hnd: [SP.bmp5, SP.bmp9, SP.c5p7] });
    useIt(g);
    // An "up to 1" pick over the hand with a filter is asked even when nothing matches (max 0):
    // a prompt that appeared only when the hand held a match would reveal the hand.
    expect(decision(g)?.kind).toBe('choose');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    expect(hand(g)).toHaveLength(5);
    expect(sorted(g, 'p1', 'characters')).toEqual([PU]);
  });

  it('a non-{Big Mom Pirates} Character with 7000 power is not offered (only the type matches)', () => {
    const g = board({ hnd: [SP.c5p7, SP.bmp7] });
    useIt(g);
    expect(offeredIds(g)).toEqual([SP.bmp7]);
  });
});
