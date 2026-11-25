/**
 * EB02-019 Roronoa Zoro (Character, Green, cost 4, 5000, Counter +1000, {Straw Hat Crew}/{East Blue}).
 *
 * Card text: "If your opponent has 2 or more Characters, this Character can attack Characters on the
 * turn in which it is played.
 * [On Play] If your Leader has the "Straw Hat Crew" type, rest up to 1 of your opponent's Characters
 * with a cost of 4 or less."
 *
 * Rules: summoning sickness (CR 3-7-4) and [Rush: Character]; only rested Characters can be attacked
 * (CR 7-1-1-2); "up to" (CR 8-4-4-1). Both abilities' "If" have no colon.
 */
import { describe, expect, it } from 'vitest';
import {
  canAttackAnything,
  canFinish,
  canHit,
  choices,
  choose,
  chooseNone,
  E2C,
  E2L,
  kind,
  mine,
  need,
  offers,
  playRaw,
} from './kit-eb02a.ts';

const ZORO = 'EB02-019';
const rested = (card: string) => ({ card, rested: true });

describe('EB02-019 Zoro: can attack Characters the turn he is played if the opponent has 2 or more Characters', () => {
  const sick = { card: ZORO, playedThisTurn: true };

  it('with 2 opposing Characters he can attack a rested one on the turn he is played', () => {
    const g = mine(
      E2L.croc,
      { characters: [sick] },
      { characters: [rested(E2C.kingdew), E2C.marco] },
    );
    const zoro = g.find('p1', 'characters', ZORO);
    expect(canHit(g, zoro, g.find('p2', 'characters', E2C.kingdew))).toBe(true);
  });

  it('but not the Leader (it is "Characters" only, not a full [Rush])', () => {
    const g = mine(
      E2L.croc,
      { characters: [sick] },
      { characters: [rested(E2C.kingdew), E2C.marco] },
    );
    expect(canHit(g, g.find('p1', 'characters', ZORO), g.leader('p2'))).toBe(false);
  });

  it('boundary: with only 1 opposing Character he cannot attack at all on the turn he is played', () => {
    const g = mine(E2L.croc, { characters: [sick] }, { characters: [rested(E2C.kingdew)] });
    expect(canAttackAnything(g, g.find('p1', 'characters', ZORO))).toBe(false);
  });

  it('with no opposing Character he cannot attack either', () => {
    const g = mine(E2L.croc, { characters: [sick] });
    expect(canAttackAnything(g, g.find('p1', 'characters', ZORO))).toBe(false);
  });

  it('both opposing Characters may be rested: the count is of Characters, not of active ones', () => {
    const g = mine(
      E2L.croc,
      { characters: [sick] },
      { characters: [rested(E2C.kingdew), rested(E2C.marco)] },
    );
    const zoro = g.find('p1', 'characters', ZORO);
    expect(canHit(g, zoro, g.find('p2', 'characters', E2C.marco))).toBe(true);
  });

  it('the Characters counted are the opponent’s, not mine', () => {
    const g = mine(
      E2L.croc,
      { characters: [sick, E2C.marco, E2C.sai] },
      { characters: [rested(E2C.kingdew)] },
    );
    expect(canAttackAnything(g, g.find('p1', 'characters', ZORO))).toBe(false);
  });

  it('a Zoro that was not played this turn attacks the Leader as any Character does (control)', () => {
    const g = mine(E2L.croc, { characters: [ZORO] }, { characters: [E2C.kingdew] });
    expect(canHit(g, g.find('p1', 'characters', ZORO), g.leader('p2'))).toBe(true);
  });
});

describe('EB02-019 Zoro: [On Play] with a {Straw Hat Crew} Leader, rest up to 1 opposing Character with cost 4 or less', () => {
  function start(leader: string, oppChars: string[]) {
    const g = mine(leader, { hand: [ZORO] }, { characters: oppChars });
    playRaw(g, ZORO);
    return g;
  }

  it('rests the chosen Character of cost 4', () => {
    const g = start(E2L.shc, [E2C.hajrudin, E2C.kingdew]);
    const hajrudin = g.find('p2', 'characters', E2C.hajrudin);
    expect(offers(g, hajrudin)).toBe(true);
    choose(g, [hajrudin]);
    expect(g.card(hajrudin).rested).toBe(true);
    need(g, 'main', 'p1');
  });

  it('the cost boundary: cost 4 is offered, cost 5 is not', () => {
    const g = start(E2L.shc, [E2C.hajrudin, E2C.kingdew]);
    expect(offers(g, g.find('p2', 'characters', E2C.kingdew))).toBe(false);
  });

  it('"up to 1": may rest nothing', () => {
    const g = start(E2L.shc, [E2C.hajrudin]);
    expect(canFinish(g)).toBe(true);
    chooseNone(g);
    expect(g.card(g.find('p2', 'characters', E2C.hajrudin)).rested).toBe(false);
  });

  it('rests only one Character even when several qualify', () => {
    const g = start(E2L.shc, [E2C.hajrudin, E2C.marco, E2C.sai]);
    choose(g, [g.find('p2', 'characters', E2C.marco)]);
    expect(g.zone('p2', 'characters').filter((c) => c.rested)).toHaveLength(1);
  });

  it('with another Leader nothing is rested and nothing is asked', () => {
    const g = start(E2L.croc, [E2C.hajrudin]);
    expect(kind(g)).toBe('main');
    expect(g.card(g.find('p2', 'characters', E2C.hajrudin)).rested).toBe(false);
  });

  it('only the opponent’s Characters are offered', () => {
    const g = mine(
      E2L.shc,
      { hand: [ZORO], characters: [E2C.sai] },
      { characters: [E2C.hajrudin] },
    );
    playRaw(g, ZORO);
    expect(choices(g).every((i) => g.card(i).owner === 'p2')).toBe(true);
  });

  it('resting a Character with the [On Play] makes it attackable by the new Zoro (2 opposing Characters)', () => {
    const g = start(E2L.shc, [E2C.hajrudin, E2C.kingdew]);
    const hajrudin = g.find('p2', 'characters', E2C.hajrudin);
    choose(g, [hajrudin]);
    expect(canHit(g, g.find('p1', 'characters', ZORO), hajrudin)).toBe(true);
    expect(
      canHit(g, g.find('p1', 'characters', ZORO), g.find('p2', 'characters', E2C.kingdew)),
    ).toBe(false);
  });
});
