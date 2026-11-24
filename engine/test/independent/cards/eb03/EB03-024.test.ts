/**
 * EB03-024 Nefeltari Vivi (Character, Blue, cost 5, 4000, Counter +1000, {Alabasta}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] Play up to 1 {Alabasta} or {Straw Hat Crew} type Character card with a
 * cost of 5 or less from your hand. Then, you cannot play any Character cards on your field during
 * this turn."
 *
 * Rules: CR 10-1-4 ([Blocker]), effect plays pay no cost, CR 8-4-4-1 ("up to"), CR 4-10-2 (a "then"
 * clause after an "up to" that played nothing still resolves; only a failed "If" stops it), "during
 * this turn" ends in the End Phase (CR 6-6-1-3). The restriction bars Character cards only: Events and
 * Stages can still be played.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  canPlayCard,
  chr,
  inst,
  kind,
  LA,
  mine,
  need,
  noDefence,
  none,
  offeredIds,
  pickCards,
  playRaw,
  SA,
  theirs,
  zoneIds,
  donOf,
} from './kit-eb03a.ts';

const VIVI = 'EB03-024';
/** OP05-021 Revolutionary Army HQ: Red Stage, cost 1. */
const STAGE = 'OP05-021';

function play(hand: string[], active = 10) {
  const g = mine(LA.croc, { hand: [VIVI, ...hand], costArea: { active, rested: 0 } });
  playRaw(g, VIVI);
  return g;
}

describe('EB03-024 Nefeltari Vivi: printed values and [Blocker]', () => {
  it('cost 5, 4000, Counter +1000, [Blocker]', () => {
    const g = mine(LA.croc, { characters: [VIVI] });
    const v = chr(g, 'p1', VIVI);
    expect(g.card(v).cost).toBe(5);
    expect(g.power(v)).toBe(4000);
    expect(g.card(v).counter).toBe(1000);
    expect(g.card(v).keywords).toContain('Blocker');
  });

  it('blocks an attack on my Leader', () => {
    const g = theirs(LA.croc, { characters: [VIVI] }, { characters: [SA.sai] });
    attack(g, chr(g, 'p2', SA.sai), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([chr(g, 'p1', VIVI)]);
    act(g, { type: 'block', blocker: chr(g, 'p1', VIVI) });
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });
});

describe('EB03-024 Nefeltari Vivi: [On Play] play up to 1 {Alabasta}/{Straw Hat Crew} Character with cost 5 or less from hand', () => {
  it('offers {Alabasta} and {Straw Hat Crew} Characters with cost 5 or less (5 allowed, 6 not), nothing else', () => {
    const g = play([
      SA.cobra5,
      SA.viviChar,
      SA.frankyShc5,
      SA.chakaPell6,
      SA.sanGorou6,
      SA.marco,
      SA.guardPoint,
    ]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SA.cobra5, SA.frankyShc5, SA.viviChar].sort());
  });

  it('plays the chosen Character from hand without paying its cost (active)', () => {
    const g = play([SA.cobra5, SA.viviChar]);
    const before = donOf(g, 'p1');
    pickCards(g, [SA.cobra5]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SA.cobra5, VIVI].sort());
    expect(g.card(chr(g, 'p1', SA.cobra5)).rested).toBe(false);
    expect(donOf(g, 'p1')).toEqual(before);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SA.viviChar]);
  });

  it('a {Straw Hat Crew} Character can be played too', () => {
    const g = play([SA.frankyShc5]);
    pickCards(g, [SA.frankyShc5]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SA.frankyShc5, VIVI].sort());
  });

  it('plays at most 1 even with several candidates', () => {
    const g = play([SA.cobra5, SA.viviChar, SA.frankyShc5]);
    pickCards(g, [SA.cobra5]);
    expect(zoneIds(g, 'p1', 'characters')).toHaveLength(2);
  });

  it('"up to 1": may play nothing', () => {
    const g = play([SA.cobra5]);
    need(g, 'choose', 'p1');
    none(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([VIVI]);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SA.cobra5]);
  });
});

describe('EB03-024 Nefeltari Vivi: Then, you cannot play any Character cards during this turn', () => {
  it('after her [On Play], a Character card in hand cannot be played even with DON!! to spare', () => {
    const g = play([SA.cobra5, SA.marco, SA.sai]);
    pickCards(g, [SA.cobra5]);
    need(g, 'main', 'p1');
    expect(donOf(g, 'p1').active).toBeGreaterThanOrEqual(5);
    expect(canPlayCard(g, inst(g, 'p1', 'hand', SA.marco))).toBe(false);
    expect(canPlayCard(g, inst(g, 'p1', 'hand', SA.sai))).toBe(false);
  });

  it('the restriction applies even when nothing was played ("up to 1" chosen as none)', () => {
    const g = play([SA.cobra5, SA.marco]);
    need(g, 'choose', 'p1');
    none(g);
    expect(canPlayCard(g, inst(g, 'p1', 'hand', SA.marco))).toBe(false);
  });

  it('the restriction applies when no card qualified at all', () => {
    const g = play([SA.marco, SA.sai]);
    if (kind(g) === 'choose') none(g);
    need(g, 'main', 'p1');
    expect(canPlayCard(g, inst(g, 'p1', 'hand', SA.marco))).toBe(false);
  });

  it('only Character cards are barred: a Stage can still be played', () => {
    const g = play([SA.cobra5, STAGE]);
    pickCards(g, [SA.cobra5]);
    expect(canPlayCard(g, inst(g, 'p1', 'hand', STAGE))).toBe(true);
  });

  it('before her [On Play] other Characters could be played (the bar starts when it resolves)', () => {
    const g = mine(LA.croc, { hand: [VIVI, SA.marco] });
    expect(canPlayCard(g, inst(g, 'p1', 'hand', SA.marco))).toBe(true);
  });

  it('it lasts this turn only: on my next turn a Character can be played again', () => {
    const g = play([SA.cobra5, SA.marco]);
    pickCards(g, [SA.cobra5]);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(canPlayCard(g, inst(g, 'p1', 'hand', SA.marco))).toBe(true);
  });
});
