/**
 * OP15-117 Heso!! (Event, Yellow, cost 1, {Sky Island}).
 *
 * Card text: "[Main] Draw 1 card. Then, give up to 1 rested DON!! card to 1 of your {Sky Island} type Leader
 * or Character cards.
 * [Trigger] If your Leader has the {Sky Island} type, draw 2 cards."
 *
 * Rules relied on: CR 2-7-2 (DON!! rested to pay the cost are rested DON!! in the cost area, so one is
 * always available), "give DON!!" moves a rested DON!! from the cost area onto the card (CR 6-5-5-2),
 * RD 122 (a failed condition gates the effect), "up to" may choose nothing, CR 10-1-5 (Trigger).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  atMain,
  BLUE,
  choices,
  deck,
  deckTop,
  declineTrigger,
  don,
  hand,
  hitLeader,
  kind,
  LD15,
  mayChooseNone,
  mine,
  need,
  pickInst,
  playRaw,
  reachablePickSets,
  SC15,
  skipChoice,
  theirs,
} from './kit-op15c.ts';

const HESO = 'OP15-117';

function cast(
  leader: string,
  o: { chars?: string[]; active?: number; rested?: number; handExtra?: string[] } = {},
) {
  const g = mine(leader, {
    hand: [HESO, ...(o.handExtra ?? [])],
    characters: o.chars ?? [SC15.sky3, SC15.red3],
    deck: deckTop([SC15.red4, SC15.red5]),
    costArea: { active: o.active ?? 5, rested: o.rested ?? 0 },
  });
  playRaw(g, g.find('p1', 'hand', HESO));
  return g;
}

describe('OP15-117 Heso!! [Main]', () => {
  it('draws exactly 1 card, then gives 1 rested DON!! to my {Sky Island} Leader', () => {
    const g = cast(LD15.sky);
    expect(hand(g)).toEqual([SC15.red4]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g).given).toBe(1);
    expect(deck(g)).toHaveLength(11);
  });

  it('the given DON!! was the rested one: the cost-area DON!! left are 4 active and 0 rested', () => {
    const g = cast(LD15.sky);
    pickInst(g, [g.leader('p1')]);
    expect(don(g).active).toBe(4);
    expect(don(g).rested).toBe(0);
  });

  it('the DON!! paid for the Event is rested at once, so it can be given even with only 1 active DON!!', () => {
    const g = cast(LD15.sky, { active: 1 });
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(don(g).given).toBe(1);
    expect(don(g).active).toBe(0);
  });

  it('a {Sky Island} Character can receive it', () => {
    const g = cast(LD15.sky);
    const c = at(g, 'p1', 'characters', SC15.sky3);
    pickInst(g, [c]);
    expect(g.card(c).don).toBe(1);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('only my {Sky Island} Leader or Characters are offered, not other Characters', () => {
    const g = cast(LD15.sky);
    need(g, 'choose', 'p1');
    const o = choices(g);
    expect(o).toContain(g.leader('p1'));
    expect(o).toContain(at(g, 'p1', 'characters', SC15.sky3));
    expect(o).not.toContain(at(g, 'p1', 'characters', SC15.red3));
    expect(o).not.toContain(g.leader('p2'));
  });

  it('"up to 1": giving nothing leaves the DON!! rested in the cost area; the draw stays', () => {
    const g = cast(LD15.sky);
    expect(mayChooseNone(g)).toBe(true);
    skipChoice(g);
    expect(don(g).given).toBe(0);
    expect(don(g).rested).toBe(1);
    expect(hand(g)).toEqual([SC15.red4]);
  });

  it('gives to one card only', () => {
    const g = cast(LD15.sky);
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
  });

  it('with no {Sky Island} Leader or Character the card is still drawn and no DON!! is given', () => {
    const g = cast(LD15.neutral, { chars: [SC15.red3] });
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      skipChoice(g);
    }
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC15.red4]);
    expect(don(g).given).toBe(0);
  });

  it('only RESTED DON!! is given: an extra rested DON!! already there is what gets moved first, active ones stay active', () => {
    const g = cast(LD15.sky, { active: 3, rested: 2 });
    pickInst(g, [g.leader('p1')]);
    expect(don(g).given).toBe(1);
    expect(don(g).active).toBe(2);
    expect(don(g).rested).toBe(2);
  });
});

describe('OP15-117 Heso!! [Trigger]', () => {
  const hit = (leader: string) => {
    const g = theirs(
      leader,
      { life: [HESO, BLUE, BLUE, BLUE], deck: deckTop([SC15.red4, SC15.red5, SC15.red6]) },
      {},
    );
    hitLeader(g);
    return g;
  };

  it('with a {Sky Island} Leader: draws exactly 2 cards', () => {
    const g = hit(LD15.sky);
    activateTrigger(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([SC15.red4, SC15.red5].sort());
    expect(deck(g)).toHaveLength(11);
  });

  it('without a {Sky Island} Leader: nothing is drawn', () => {
    const g = hit(LD15.neutral);
    activateTrigger(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(13);
  });

  it('declined: the Life card goes to hand and nothing is drawn', () => {
    const g = hit(LD15.sky);
    declineTrigger(g);
    expect(hand(g)).toEqual([HESO]);
    expect(deck(g)).toHaveLength(13);
  });
});
