/**
 * OP10-102 Emporio.Ivankov (Character, Yellow, cost 5, 6000, Counter +1000, {Revolutionary Army}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] Up to 3 of your "Revolutionary Army" type Characters
 * gain +1000 power during this turn. Then, add 1 card from the top of your Life cards to your
 * hand."
 *
 * Rules: "up to 3" allows 0 to 3; [Once Per Turn] (CR 10-2-13); adding a Life card to the hand is
 * not damage (no [Trigger]); "during this turn" ends with the turn.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  chr,
  choices,
  endTurn,
  fill,
  hand,
  LD10,
  mine,
  need,
  none,
  offeredAbility,
  offeredIds,
  pickInst,
  rawActivate,
  RED,
  SC10,
  SC14,
  zoneIds,
} from './kit-op10c.ts';

const ID = 'OP10-102';
const RA = [SC10.dr2, SC10.ra4, SC10.ra5, 'OP05-012']; // Koala 4000, Morley 6000, Inazuma 6000, Hack 5000

function game(chars: string[] = [], life = 4) {
  return mine(LD10.plain, {
    characters: [ID, ...chars],
    life: [SC14.c3, ...fill(BLUE, Math.max(0, life - 1))].slice(0, life),
  });
}

const ivankov = (g: ReturnType<typeof game>) => at(g, 'p1', 'characters', ID);

describe('OP10-102 Ivankov [Activate: Main] [Once Per Turn] up to 3 {Revolutionary Army} +1000; then Life to hand', () => {
  it('gives +1000 to the chosen {Revolutionary Army} Characters, then adds the top Life card to hand', () => {
    const g = game([SC10.ra4, SC10.ra5]);
    rawActivate(g, ivankov(g));
    pickInst(g, [chr(g, 'p1', SC10.ra4), chr(g, 'p1', SC10.ra5)]);
    need(g, 'main', 'p1');
    expect(g.power(chr(g, 'p1', SC10.ra4))).toBe(7000);
    expect(g.power(chr(g, 'p1', SC10.ra5))).toBe(7000);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([SC14.c3]);
  });

  it('Ivankov is a {Revolutionary Army} Character himself and can be chosen', () => {
    const g = game([]);
    rawActivate(g, ivankov(g));
    expect(offeredIds(g)).toEqual([ID]);
    pickInst(g, [ivankov(g)]);
    expect(g.power(ivankov(g))).toBe(7000);
  });

  it('only {Revolutionary Army} Characters are offered', () => {
    const g = game([SC10.ra4, SC14.c1, SC10.bbp4]);
    rawActivate(g, ivankov(g));
    expect(offeredIds(g)).toEqual([ID, SC10.ra4].sort());
  });

  it('"up to 3": with 4 {Revolutionary Army} Characters at most 3 can be chosen', () => {
    const g = game([SC10.dr2, SC10.ra4, SC10.ra5]);
    rawActivate(g, ivankov(g));
    expect(choices(g)).toHaveLength(4);
    pickInst(g, [chr(g, 'p1', SC10.dr2), chr(g, 'p1', SC10.ra4), chr(g, 'p1', SC10.ra5)]);
    need(g, 'main', 'p1');
    expect(g.power(ivankov(g))).toBe(6000);
    expect(g.power(chr(g, 'p1', SC10.dr2))).toBe(5000);
  });

  it('may choose none: the Life card is still added to the hand', () => {
    const g = game([SC10.ra4]);
    rawActivate(g, ivankov(g));
    none(g);
    need(g, 'main', 'p1');
    expect(g.power(chr(g, 'p1', SC10.ra4))).toBe(6000);
    expect(hand(g)).toEqual([SC14.c3]);
    expect(g.life('p1')).toBe(3);
  });

  it('may choose just 1', () => {
    const g = game([SC10.ra4, SC10.ra5]);
    rawActivate(g, ivankov(g));
    pickInst(g, [chr(g, 'p1', SC10.ra4)]);
    expect(g.power(chr(g, 'p1', SC10.ra4))).toBe(7000);
    expect(g.power(chr(g, 'p1', SC10.ra5))).toBe(6000);
  });

  it('with 0 Life the boost still applies and nothing is added to the hand', () => {
    const g = mine(LD10.plain, { characters: [ID, SC10.ra4], life: [] });
    rawActivate(g, ivankov(g));
    pickInst(g, [chr(g, 'p1', SC10.ra4)]);
    need(g, 'main', 'p1');
    expect(g.power(chr(g, 'p1', SC10.ra4))).toBe(7000);
    expect(hand(g)).toEqual([]);
    expect(g.life('p1')).toBe(0);
  });

  it('[Once Per Turn]: not offered a second time', () => {
    const g = game([SC10.ra4]);
    rawActivate(g, ivankov(g));
    none(g);
    expect(offeredAbility(g, ivankov(g))).toBe(false);
  });

  it('the +1000 ends with the turn', () => {
    const g = game([SC10.ra4]);
    rawActivate(g, ivankov(g));
    pickInst(g, [chr(g, 'p1', SC10.ra4)]);
    endTurn(g);
    expect(g.power(chr(g, 'p1', SC10.ra4))).toBe(6000);
  });

  it('the Life card goes to hand without a [Trigger] decision, even if it has one', () => {
    const g = mine(LD10.plain, { characters: [ID], life: ['OP01-104', BLUE, BLUE] }); // Speed has a [Trigger]
    rawActivate(g, ivankov(g));
    none(g);
    need(g, 'main', 'p1');
    expect(hand(g)).toEqual(['OP01-104']);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([ID]);
    void RA;
    void RED;
  });
});
