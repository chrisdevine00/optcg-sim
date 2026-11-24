/**
 * EB03-020 There You Are, Sore Loser! (Event, Green, cost 1, {FILM}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +2000 power during this
 * battle. Then, if you have 2 or more {FILM} type Characters, that card gains an additional +2000
 * power during this battle.
 * [Trigger] Set up to 1 of your Characters as active."
 *
 * Rules: CR 7-1-3-1-2 (Event [Counter]), RL-08 ("during this battle"), CR 8-3-3 (conditions are read
 * when the clause resolves), CR 8-4-4-1 ("up to"), CR 10-1-5 ([Trigger]). A Leader is not a Character,
 * so only Characters count toward "2 or more {FILM} type Characters"; rested Characters still count.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  attack,
  BLUE,
  canCounterWith,
  chooseIfAsked,
  choiceCards,
  chr,
  declineTrigger,
  fill,
  hitLeader,
  inst,
  isRestedC,
  kind,
  LA,
  mine,
  need,
  none,
  passBlock,
  passCounter,
  pickInst,
  SA,
  theirs,
  useCounter,
  zoneIds,
} from './kit-eb03a.ts';

const EVENT = 'EB03-020';
/** ST05-001 Shanks: Purple, 5000, 5 Life, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. */
const FILM_LEADER = 'ST05-001';

function underAttack(
  leader: string,
  chars: (string | { card: string; rested?: boolean })[] = [],
  active = 3,
) {
  const g = theirs(
    leader,
    { hand: [EVENT], characters: chars, costArea: { active, rested: 0 }, life: fill(BLUE, 4) },
    {},
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}

/** Use the Counter on `target`; returns the target's power afterwards (still during the battle). */
function boost(g: ReturnType<typeof underAttack>, target: string): number | null {
  useCounter(g, inst(g, 'p1', 'hand', EVENT), target);
  chooseIfAsked(g, [target]);
  return g.power(target);
}

describe('EB03-020: [Counter] +2000 power during this battle (+2000 more with 2 or more {FILM} Characters)', () => {
  it('printed values: Event, cost 1', () => {
    const g = mine(LA.croc, { hand: [EVENT] });
    expect(g.card(inst(g, 'p1', 'hand', EVENT)).cost).toBe(1);
  });

  it('with no {FILM} Character: the Leader gains +2000 only (5000 -> 7000)', () => {
    const g = underAttack(LA.croc);
    expect(canCounterWith(g, inst(g, 'p1', 'hand', EVENT))).toBe(true);
    expect(boost(g, g.leader('p1'))).toBe(7000);
  });

  it('with exactly 1 {FILM} Character: still +2000', () => {
    const g = underAttack(LA.croc, [SA.gordonFilm, SA.marco]);
    expect(boost(g, g.leader('p1'))).toBe(7000);
  });

  it('boundary: with exactly 2 {FILM} Characters: +4000 in total (5000 -> 9000)', () => {
    const g = underAttack(LA.croc, [SA.gordonFilm, SA.zoroFilm]);
    expect(boost(g, g.leader('p1'))).toBe(9000);
  });

  it('with 3 {FILM} Characters the bonus is still +4000, not more', () => {
    const g = underAttack(LA.croc, [SA.gordonFilm, SA.zoroFilm, SA.usoppFilm]);
    expect(boost(g, g.leader('p1'))).toBe(9000);
  });

  it('non-{FILM} Characters do not count (1 {FILM} + 3 others: +2000)', () => {
    const g = underAttack(LA.croc, [SA.gordonFilm, SA.marco, SA.sai, SA.kingdew]);
    expect(boost(g, g.leader('p1'))).toBe(7000);
  });

  it('a {FILM} Leader is not a Character: Shanks + 1 {FILM} Character gives +2000 only', () => {
    const g = underAttack(FILM_LEADER, [SA.gordonFilm]);
    expect(boost(g, g.leader('p1'))).toBe(7000);
  });

  it('rested {FILM} Characters still count (2 rested {FILM}: +4000)', () => {
    const g = underAttack(LA.croc, [
      { card: SA.gordonFilm, rested: true },
      { card: SA.zoroFilm, rested: true },
    ]);
    expect(boost(g, g.leader('p1'))).toBe(9000);
  });

  it('"that card": a Character target gets the additional +2000 too (Marco 5000 -> 9000)', () => {
    const g = underAttack(LA.croc, [SA.gordonFilm, SA.zoroFilm, SA.marco]);
    const marco = chr(g, 'p1', SA.marco);
    expect(boost(g, marco)).toBe(9000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the 9000 Leader beats the 5000 attack: no Life is lost', () => {
    const g = underAttack(LA.croc, [SA.gordonFilm, SA.zoroFilm]);
    boost(g, g.leader('p1'));
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('"up to 1": may boost nobody', () => {
    const g = underAttack(LA.croc, [SA.gordonFilm, SA.zoroFilm]);
    useCounter(g, inst(g, 'p1', 'hand', EVENT), g.leader('p1'));
    if (kind(g) === 'choose') none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the boost lasts during the battle only', () => {
    const g = underAttack(LA.croc, [SA.gordonFilm, SA.zoroFilm]);
    boost(g, g.leader('p1'));
    act(g, { type: 'endCounter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with 0 active DON!! the Event cannot be used (cost 1)', () => {
    const g = underAttack(LA.croc, [], 0);
    expect(canCounterWith(g, inst(g, 'p1', 'hand', EVENT))).toBe(false);
  });
});

describe('EB03-020: [Trigger] set up to 1 of your Characters as active', () => {
  /** p2's Leader hits p1's Leader; the Event is p1's top Life card. */
  function hit(chars: (string | { card: string; rested?: boolean })[]) {
    const g = theirs(
      LA.croc,
      { life: [EVENT, BLUE, BLUE, BLUE], characters: chars, deck: fill(BLUE, 10) },
      {},
    );
    hitLeader(g);
    return g;
  }

  it('sets the chosen rested Character active', () => {
    const g = hit([
      { card: SA.marco, rested: true },
      { card: SA.sai, rested: true },
    ]);
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p1', SA.marco)]);
    expect(isRestedC(g, 'p1', SA.marco)).toBe(false);
    expect(isRestedC(g, 'p1', SA.sai)).toBe(true);
  });

  it('sets only 1 Character active even with several rested', () => {
    const g = hit([
      { card: SA.marco, rested: true },
      { card: SA.sai, rested: true },
      { card: SA.kingdew, rested: true },
    ]);
    activateTrigger(g);
    pickInst(g, [chr(g, 'p1', SA.sai)]);
    const rested = [SA.marco, SA.sai, SA.kingdew].filter((c) => isRestedC(g, 'p1', c));
    expect(rested).toHaveLength(2);
  });

  it('"up to 1": may choose nobody', () => {
    const g = hit([{ card: SA.marco, rested: true }]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(isRestedC(g, 'p1', SA.marco)).toBe(true);
  });

  it('offers my Characters only, never the Leader', () => {
    const g = hit([{ card: SA.marco, rested: true }]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).not.toContain(LA.croc);
    expect(choiceCards(g)).toContain(SA.marco);
  });

  it('with no Character the [Trigger] does nothing and the game goes on', () => {
    const g = hit([]);
    activateTrigger(g);
    if (kind(g) === 'choose') none(g);
    expect(kind(g)).toBe('main');
  });

  it('the Event card goes to the trash after the [Trigger], and to hand if declined', () => {
    const g = hit([{ card: SA.marco, rested: true }]);
    activateTrigger(g);
    if (kind(g) === 'choose') none(g);
    expect(zoneIds(g, 'p1', 'trash')).toContain(EVENT);
    const h = hit([{ card: SA.marco, rested: true }]);
    declineTrigger(h);
    expect(zoneIds(h, 'p1', 'hand')).toContain(EVENT);
    expect(isRestedC(h, 'p1', SA.marco)).toBe(true);
  });
});
