/**
 * EB03-032 Charlotte Flampe (Character, Purple, cost 1, 2000, Counter +1000, {Big Mom Pirates}).
 *
 * Card text: "[Your Turn] [On Play] Up to 1 of your [Charlotte Katakuri] cards gains +2000 power during
 * this turn."
 *
 * Rules: CR 8-4-4-1 ("up to"), "your [Charlotte Katakuri] cards" are my cards on the field named
 * Charlotte Katakuri (the Leader and Characters), "during this turn" ends in the End Phase
 * (CR 6-6-1-3), [Your Turn] limits the effect to my own turn.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  chr,
  choiceCards,
  kind,
  LA,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  reachablePickSets,
  SA,
  zoneIds,
} from './kit-eb03a.ts';

const FLAMPE = 'EB03-032';
/** OP03-099 Charlotte Katakuri: Yellow Leader, 5000, 5 Life, {Big Mom Pirates}. */
const KATAKURI_LEADER_2 = 'OP03-099';
/** OP08-065 Charlotte Smoothie: Purple, cost 7, 9000, {Big Mom Pirates}. A different name. */
const SMOOTHIE = 'OP08-065';

function play(leader: string, chars: string[] = []) {
  const g = mine(leader, { hand: [FLAMPE], characters: chars });
  playRaw(g, FLAMPE);
  return g;
}

describe('EB03-032 Charlotte Flampe: printed values', () => {
  it('cost 1, 2000, Counter +1000', () => {
    const g = mine(LA.katakuri, { characters: [FLAMPE] });
    const f = chr(g, 'p1', FLAMPE);
    expect(g.card(f).cost).toBe(1);
    expect(g.power(f)).toBe(2000);
    expect(g.card(f).counter).toBe(1000);
  });
});

describe('EB03-032 Charlotte Flampe: [Your Turn] [On Play] up to 1 of your [Charlotte Katakuri] cards gains +2000 power during this turn', () => {
  it('a [Charlotte Katakuri] Leader gains +2000 (5000 -> 7000)', () => {
    const g = play(LA.katakuri);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(kind(g)).toBe('main');
  });

  it('a [Charlotte Katakuri] Character gains +2000 (6000 -> 8000)', () => {
    const g = play(LA.croc, [SA.katakuriChar]);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p1', SA.katakuriChar)]);
    expect(g.power(chr(g, 'p1', SA.katakuriChar))).toBe(8000);
  });

  it('offers exactly my cards named Charlotte Katakuri: the Leader and the Character, not other {Big Mom Pirates} cards, not Flampe', () => {
    const g = play(LA.katakuri, [SA.katakuriChar, SMOOTHIE]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LA.katakuri, SA.katakuriChar].sort());
    expect(choiceCards(g)).not.toContain(FLAMPE);
    expect(choiceCards(g)).not.toContain(SMOOTHIE);
  });

  it('only the chosen card gains the power', () => {
    const g = play(LA.katakuri, [SA.katakuriChar]);
    pickInst(g, [chr(g, 'p1', SA.katakuriChar)]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(chr(g, 'p1', SA.katakuriChar))).toBe(8000);
  });

  it('another Katakuri Leader card (OP03-099) is a legal target too', () => {
    const g = play(KATAKURI_LEADER_2);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('"up to 1": may choose nobody', () => {
    const g = play(LA.katakuri, [SA.katakuriChar]);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(chr(g, 'p1', SA.katakuriChar))).toBe(6000);
  });

  it('boosts at most 1 card even with two candidates', () => {
    const g = play(LA.katakuri, [SA.katakuriChar]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('with no [Charlotte Katakuri] card nothing is boosted and nothing stays pending', () => {
    const g = play(LA.croc, [SMOOTHIE]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(kind(g)).toBe('main');
    expect(g.power(chr(g, 'p1', SMOOTHIE))).toBe(9000);
    expect(g.power(chr(g, 'p1', FLAMPE))).toBe(2000);
  });

  it('only cards on the field count: a Katakuri in hand is not offered', () => {
    const g = mine(LA.croc, { hand: [FLAMPE, SA.katakuriChar] });
    playRaw(g, FLAMPE);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SA.katakuriChar]);
  });

  it('the bonus lasts for the turn (still there after another action) and is gone on the next turn', () => {
    const g = play(LA.katakuri);
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
