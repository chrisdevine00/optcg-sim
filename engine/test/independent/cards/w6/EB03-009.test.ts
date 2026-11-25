/**
 * EB03-009 Makino (Character, Red, cost 1, 0 power, Counter +2000, Wisdom, {Windmill Village}).
 *
 * Card text: "[Activate: Main] You may rest this Character: Up to 1 of your Characters with no base
 * effect gains +2000 power during this turn."
 *
 * Rules: CR 8-3-1 (a cost before the colon; choosing to activate is choosing to pay it), CR 4-8-1
 * ("up to"), M6b-Q29 (keyword-only text is no base effect), CR 8-1-3-2 ("during this turn" ends at
 * the end of the turn). Makino has a base effect herself, so she is not a legal target.
 *
 * Scenery (printed): OP01-023 Marco 5000 vanilla, OP01-018 Hajrudin 6000 vanilla, OP02-012 Blenheim
 * (keyword-only [Blocker]), OP01-080 Zala ([On K.O.]).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { attack, canAttack, decision, noDefence } from '../../helpers.ts';
import { myTurn, side } from '../kit.ts';
import {
  BLUE,
  LW,
  mayEnd,
  need,
  none,
  offeredAbilities,
  offeredCards,
  ofZone,
  pickCards,
  RED,
  SC6,
  toMyNextMain,
  useAbility,
} from './kit-w6a.ts';

const ID = 'EB03-009';

function start(mine: PlayerSpec['characters'], theirs: PlayerSpec['characters'] = []) {
  return myTurn(
    side(LW.luffy, BLUE, { characters: mine }),
    side(LW.luffy, RED, { characters: theirs, costArea: { active: 3, rested: 0 } }),
  );
}

describe('EB03-009 Makino: [Activate: Main] rest this Character: up to 1 Character with no base effect gains +2000 power this turn', () => {
  it('rests Makino and gives +2000 to a vanilla Character', () => {
    const g = start([ID, SC6.c5k]);
    const makino = g.find('p1', 'characters', ID);
    const marco = g.find('p1', 'characters', SC6.c5k);
    useAbility(g, makino);
    expect(g.card(makino).rested).toBe(true);
    need(g, 'choose', 'p1');
    pickCards(g, [SC6.c5k]);
    expect(decision(g)?.kind).toBe('main');
    expect(g.power(marco)).toBe(7000);
  });

  it('targets: vanilla and keyword-only Characters are offered; Makino herself, a Character with a base effect and the Leader are not', () => {
    const g = start([ID, SC6.c5k, SC6.blenheim, SC6.zala, SC6.raizo]);
    useAbility(g, g.find('p1', 'characters', ID));
    need(g, 'choose', 'p1');
    expect(offeredCards(g)).toEqual([SC6.c5k, SC6.blenheim].sort());
  });

  it("only my own Characters can be chosen, never the opponent's", () => {
    const g = start([ID, SC6.c5k], [SC6.c4k]);
    useAbility(g, g.find('p1', 'characters', ID));
    expect(offeredCards(g)).toEqual([SC6.c5k]);
  });

  it('"up to 1": the pick can end with nothing; Makino is rested anyway and no power changes', () => {
    const g = start([ID, SC6.c5k]);
    const makino = g.find('p1', 'characters', ID);
    useAbility(g, makino);
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    expect(decision(g)?.max).toBe(1);
    none(g);
    expect(g.card(makino).rested).toBe(true);
    expect(g.power(g.find('p1', 'characters', SC6.c5k))).toBe(5000);
  });

  it('a rested Makino cannot be activated (the rest is the cost)', () => {
    const g = start([{ card: ID, rested: true }, SC6.c5k]);
    expect(offeredAbilities(g, g.find('p1', 'characters', ID))).toEqual([]);
  });

  it('can be activated the turn she was played (resting is the cost; there is no attack involved)', () => {
    const g = start([{ card: ID, playedThisTurn: true }, SC6.c5k]);
    expect(offeredAbilities(g, g.find('p1', 'characters', ID))).toHaveLength(1);
  });

  it('with no legal target the cost is still paid and nothing else happens', () => {
    const g = start([ID, SC6.zala]);
    const makino = g.find('p1', 'characters', ID);
    useAbility(g, makino);
    // The only other Character has a base effect: either no pick is asked or an empty one.
    if (decision(g)?.kind === 'choose') none(g);
    expect(decision(g)?.kind).toBe('main');
    expect(g.card(makino).rested).toBe(true);
    expect(g.power(g.find('p1', 'characters', SC6.zala))).toBe(4000);
  });

  it('two Makino stack: +2000 each on the same Character', () => {
    const g = start([ID, ID, SC6.c5k]);
    useAbility(g, g.find('p1', 'characters', ID, 0));
    pickCards(g, [SC6.c5k]);
    useAbility(g, g.find('p1', 'characters', ID, 1));
    pickCards(g, [SC6.c5k]);
    expect(g.power(g.find('p1', 'characters', SC6.c5k))).toBe(9000);
  });

  it('the bonus is real in battle: a 5000 Marco with +2000 K.O.s a rested 6000 Character', () => {
    const g = start([ID, SC6.c5k], [{ card: SC6.c6k, rested: true }]);
    const hajrudin = g.find('p2', 'characters', SC6.c6k);
    useAbility(g, g.find('p1', 'characters', ID));
    pickCards(g, [SC6.c5k]);
    const marco = g.find('p1', 'characters', SC6.c5k);
    expect(canAttack(g, marco, hajrudin)).toBe(true);
    attack(g, marco, hajrudin);
    noDefence(g);
    expect(ofZone(g, 'p2', 'characters')).toEqual([]);
    expect(ofZone(g, 'p2', 'trash')).toEqual([SC6.c6k]);
  });

  it('the bonus lasts this turn only', () => {
    const g = start([ID, SC6.c5k]);
    const marco = g.find('p1', 'characters', SC6.c5k);
    useAbility(g, g.find('p1', 'characters', ID));
    pickCards(g, [SC6.c5k]);
    expect(g.power(marco)).toBe(7000);
    toMyNextMain(g);
    expect(g.power(marco)).toBe(5000);
  });

  it('Makino has 0 power and a Counter value of +2000 in hand', () => {
    const g = myTurn(side(LW.luffy, BLUE, { hand: [ID], characters: [ID] }), side(LW.luffy, RED));
    expect(g.power(g.find('p1', 'characters', ID))).toBe(0);
    expect(g.card(g.find('p1', 'hand', ID)).counter).toBe(2000);
  });
});
