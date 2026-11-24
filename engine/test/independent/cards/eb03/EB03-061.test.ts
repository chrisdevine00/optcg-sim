/**
 * EB03-061 Uta (Character, Green, cost 7, 8000, no Counter, {FILM}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] Set up to 1 of your DON!! cards as active. Then, rest
 * up to 1 of your opponent's DON!! cards or Characters with a cost of 4 or less.
 * [End of Your Turn] You may rest 1 of your DON!! cards: Set up to 1 of your {FILM} type
 * Characters as active."
 *
 * Rules: CR 4-8-1 ("up to": "set up to N DON!!" asks a count, the pick may be empty), CR 8-3-1
 * (the "you may" cost of the end-of-turn effect), CR 4-9 (cost), CR 2-4-3 (exact type {FILM}),
 * [Once Per Turn] (CR 10-2-13).
 * Scenery: ST05-007 Gordon (Purple, cost 1, 3000, {FILM}, vanilla).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  accept,
  activate,
  atMain,
  C14,
  canActivate,
  choices,
  costDon,
  decline,
  donChoices,
  donCountOptions,
  donSum,
  kind,
  LB,
  mine,
  need,
  offered,
  offeredIds,
  takeDon,
} from './kit-eb03b.ts';

const ID = 'EB03-061';
const GORDON = 'ST05-007'; // {FILM}, cost 1, vanilla
const MARCO = C14.marco; // not {FILM}
const SAI = C14.sai; // cost 2
const HAJRUDIN = C14.hajrudin; // cost 4
const KINGDEW = C14.kingdew; // cost 5

function start(o: {
  mine?: (string | { card: string; rested: boolean })[];
  p2?: (string | { card: string; rested: boolean })[];
  active?: number;
  rested?: number;
  oppActive?: number;
  oppRested?: number;
}) {
  return mine(
    LB.luffy,
    {
      characters: [ID, ...(o.mine ?? [])],
      costArea: { active: o.active ?? 3, rested: o.rested ?? 4 },
    },
    {
      characters: o.p2 ?? [],
      costArea: { active: o.oppActive ?? 5, rested: o.oppRested ?? 0 },
    },
  );
}

function uta(g: ReturnType<typeof start>) {
  return g.find('p1', 'characters', ID);
}

describe('EB03-061 Uta: [Activate: Main] [Once Per Turn] set up to 1 DON!! active, then rest an opposing DON!! or Character (cost 4 or less); [End of Your Turn] rest 1 DON!!: set a {FILM} Character active', () => {
  it('sets 1 rested DON!! active and rests an opposing Character with cost 4 or less', () => {
    const g = start({ p2: [HAJRUDIN] });
    activate(g, uta(g));
    takeDon(g, 1);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p2', 'characters', HAJRUDIN) });
    expect(atMain(g)).toBe(true);
    expect(donSum(g)).toMatchObject({ active: 4, rested: 3 });
    expect(g.card(g.find('p2', 'characters', HAJRUDIN)).rested).toBe(true);
  });

  it("or rests one of the opponent's active DON!! cards instead", () => {
    const g = start({ p2: [HAJRUDIN] });
    activate(g, uta(g));
    takeDon(g, 1);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: { from: 'costActive' } });
    expect(atMain(g)).toBe(true);
    expect(donSum(g, 'p2')).toMatchObject({ active: 4, rested: 1 });
    expect(g.card(g.find('p2', 'characters', HAJRUDIN)).rested).toBe(false);
  });

  it("the rest offers opposing Characters with cost 4 or less (cost 5 is not offered) and the opponent's DON!!; never my own cards", () => {
    const g = start({ mine: [MARCO], p2: [SAI, HAJRUDIN, KINGDEW] });
    activate(g, uta(g));
    takeDon(g, 1);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HAJRUDIN, SAI].sort());
    expect(donChoices(g).some((d) => d.from === 'costActive')).toBe(true);
    expect(choices(g)).not.toContain(g.find('p1', 'characters', MARCO));
  });

  it('"set up to 1 DON!!": the count asked offers 1 and 0; taking 0 sets nothing active but the rest still happens', () => {
    const g = start({ p2: [SAI] });
    activate(g, uta(g));
    expect(donCountOptions(g)).toEqual(['1', '0']);
    takeDon(g, 0);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p2', 'characters', SAI) });
    expect(donSum(g)).toMatchObject({ active: 3, rested: 4 });
    expect(g.card(g.find('p2', 'characters', SAI)).rested).toBe(true);
  });

  it('"up to 1" on the rest: it may rest nothing', () => {
    const g = start({ p2: [SAI] });
    activate(g, uta(g));
    takeDon(g, 1);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(atMain(g)).toBe(true);
    expect(g.card(g.find('p2', 'characters', SAI)).rested).toBe(false);
    expect(donSum(g, 'p2')).toMatchObject({ active: 5, rested: 0 });
  });

  it('[Once Per Turn]: after one activation the ability is not offered again this turn', () => {
    const g = start({ p2: [SAI] });
    expect(canActivate(g, uta(g))).toBe(true);
    activate(g, uta(g));
    takeDon(g, 1);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(atMain(g)).toBe(true);
    expect(canActivate(g, uta(g))).toBe(false);
  });

  it('[End of Your Turn]: rest 1 DON!!, set a rested {FILM} Character active', () => {
    const g = start({ mine: [{ card: GORDON, rested: true }] });
    expect(g.card(g.find('p1', 'characters', GORDON)).rested).toBe(true);
    act(g, { type: 'endTurn' });
    need(g, 'optional', 'p1');
    accept(g);
    if (donChoices(g).length) costDon(g, 1);
    if (kind(g) === 'choose') {
      act(g, { type: 'pick', choice: g.find('p1', 'characters', GORDON) });
    }
    need(g, 'main', 'p2');
    expect(g.card(g.find('p1', 'characters', GORDON)).rested).toBe(false);
  });

  it('[End of Your Turn] sets only {FILM} Characters: a rested Character of another type stays rested', () => {
    const g = start({
      mine: [
        { card: GORDON, rested: true },
        { card: MARCO, rested: true },
      ],
    });
    act(g, { type: 'endTurn' });
    need(g, 'optional', 'p1');
    accept(g);
    if (donChoices(g).length) costDon(g, 1);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([GORDON, ID].sort());
    act(g, { type: 'pick', choice: g.find('p1', 'characters', GORDON) });
    need(g, 'main', 'p2');
    expect(g.card(g.find('p1', 'characters', MARCO)).rested).toBe(true);
  });

  it('[End of Your Turn] declined: nothing is rested and nothing is set active', () => {
    const g = start({ mine: [{ card: GORDON, rested: true }] });
    const before = donSum(g);
    act(g, { type: 'endTurn' });
    need(g, 'optional', 'p1');
    decline(g);
    need(g, 'main', 'p2');
    expect(g.card(g.find('p1', 'characters', GORDON)).rested).toBe(true);
    // My DON!! were readied by nothing: they stay as they were (the refresh happens on my turn).
    expect(donSum(g).active).toBe(before.active);
  });

  it('[End of Your Turn] with no active DON!! to rest: the cost cannot be paid', () => {
    const g = start({ mine: [{ card: GORDON, rested: true }], active: 0, rested: 7 });
    act(g, { type: 'endTurn' });
    if (kind(g) === 'optional') {
      expect(offered(g, 'p1')).toBe(false);
      decline(g);
    }
    need(g, 'main', 'p2');
    expect(g.card(g.find('p1', 'characters', GORDON)).rested).toBe(true);
  });
});
