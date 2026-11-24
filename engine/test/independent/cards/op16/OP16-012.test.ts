/**
 * OP16-012 Benn.Beckman (Character, Red, cost 5, 6000, Counter +1000, {Red-Haired Pirates}, Ranged,
 * [Blocker]).
 *
 * Card text: "[Blocker]
 * [On Play] You may rest 1 of your DON!! cards: If your Leader has the {Red-Haired Pirates} type and
 * you have 10 DON!! cards on your field, play up to 1 [Shanks] from your hand."
 *
 * Rules: CR 6-5-5 (DON!! on the field = cost area, active or rested, plus DON!! given to cards),
 * CR 8-3-1 (cost), "play" by an effect pays no cost (CR 8-5-1), "up to 1" (CR 8-4-4-1).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  charIds,
  choose,
  don,
  kw,
  mayChooseNone,
  mine,
  need,
  no,
  none,
  OL,
  OV,
  offeredIds,
  payDon,
  playCard,
  unusable,
  yes,
  hand,
  restedChar,
  trash,
} from './kit-op16a.ts';

const BENN = 'OP16-012';
const SHANKS = 'P-016'; // Red, cost 8, 10000, {FILM}/{The Four Emperors}/{Red-Haired Pirates}, vanilla, named [Shanks]
const YASOPP = 'P-023'; // Red, cost 6, 8000, {FILM}/{Red-Haired Pirates}, named [Yasopp]

function start(o: {
  leader?: string;
  hand?: string[];
  active?: number;
  rested?: number;
  chars?: (string | { card: string; don?: number })[];
}) {
  const g = mine(o.leader ?? OL.shanks, {
    hand: [BENN, ...(o.hand ?? [SHANKS])],
    costArea: { active: o.active ?? 10, rested: o.rested ?? 0 },
    characters: o.chars ?? [],
  });
  playCard(g, BENN);
  return g;
}

describe('OP16-012 Benn.Beckman: [Blocker] and [On Play] rest 1 DON!!: play a [Shanks]', () => {
  it('has [Blocker]', () => {
    const g = mine(OL.shanks, { characters: [BENN] });
    expect(kw(g, at(g, 'p1', 'characters', BENN))).toContain('Blocker');
  });

  it('with a Red-Haired Pirates Leader and 10 DON!! on the field: pays 1 DON!!, plays [Shanks] from hand', () => {
    const g = start({});
    need(g, 'optional', 'p1');
    yes(g);
    payDon(g, 1);
    choose(g, [g.find('p1', 'hand', SHANKS)]);
    expect(charIds(g, 'p1')).toEqual([BENN, SHANKS].sort());
    expect(hand(g)).toEqual([]);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 6 });
    expect(atMain(g)).toBe(true);
  });

  it('the played [Shanks] enters active and paid no cost (cost 8 not paid)', () => {
    const g = start({});
    yes(g);
    payDon(g, 1);
    choose(g, [g.find('p1', 'hand', SHANKS)]);
    expect(restedChar(g, 'p1', SHANKS)).toBe(false);
    expect(don(g, 'p1').active).toBe(4);
  });

  it('only a card named [Shanks] is offered: another {Red-Haired Pirates} card in hand is not', () => {
    const g = start({ hand: [SHANKS, YASOPP] });
    yes(g);
    payDon(g, 1);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SHANKS]);
  });

  it('boundary: with 9 DON!! on the field the condition is false and nothing is played', () => {
    const g = start({ active: 9, rested: 0 });
    need(g, 'optional', 'p1');
    yes(g);
    payDon(g, 1);
    expect(atMain(g)).toBe(true);
    expect(charIds(g, 'p1')).toEqual([BENN]);
    expect(hand(g)).toEqual([SHANKS]);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 6 });
  });

  it('DON!! on the field counts rested DON!! and DON!! given to Characters: 10 in total is enough', () => {
    // 6 active + 2 rested in the cost area, 2 given to a Character: 10 on the field.
    const g = start({ active: 7, rested: 1, chars: [{ card: OV.sai4, don: 2 }] });
    yes(g);
    payDon(g, 1);
    choose(g, [g.find('p1', 'hand', SHANKS)]);
    expect(charIds(g, 'p1')).toEqual([BENN, OV.sai4, SHANKS].sort());
  });

  it('the Leader must have the {Red-Haired Pirates} type: a Straw Hat Crew Leader plays nothing', () => {
    const g = start({ leader: OL.luffy });
    need(g, 'optional', 'p1');
    yes(g);
    payDon(g, 1);
    expect(atMain(g)).toBe(true);
    expect(charIds(g, 'p1')).toEqual([BENN]);
    expect(hand(g)).toEqual([SHANKS]);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 6 });
  });

  it('"up to 1": may play nothing after paying (the DON!! stays rested)', () => {
    const g = start({});
    yes(g);
    payDon(g, 1);
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(charIds(g, 'p1')).toEqual([BENN]);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 6 });
  });

  it('plays only one [Shanks] when two are in hand', () => {
    const g = start({ hand: [SHANKS, SHANKS] });
    yes(g);
    payDon(g, 1);
    choose(g, [g.find('p1', 'hand', SHANKS)]);
    expect(charIds(g, 'p1')).toEqual([BENN, SHANKS].sort());
    expect(hand(g)).toEqual([SHANKS]);
  });

  it('declining plays nothing and rests no extra DON!!', () => {
    const g = start({});
    no(g);
    expect(charIds(g, 'p1')).toEqual([BENN]);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
  });

  it('with no active DON!! left after the play cost the "rest 1 DON!!" cost cannot be paid', () => {
    const g = start({ active: 5, rested: 5 });
    unusable(g, 'p1');
    expect(charIds(g, 'p1')).toEqual([BENN]);
    expect(hand(g)).toEqual([SHANKS]);
    expect(trash(g)).toEqual([]);
  });
});
