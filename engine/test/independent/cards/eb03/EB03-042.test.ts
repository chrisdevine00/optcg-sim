/**
 * EB03-042 Koala (Character, Black, cost 4, 5000, Counter +1000, {Revolutionary Army}/{Dressrosa}).
 *
 * Card text: "If your Leader has the {Revolutionary Army} type, this Character gains +4 cost.
 * [Opponent's Turn] [On K.O.] Play up to 1 {Revolutionary Army} type Character card with a cost of
 * 6 or less other than [Koala] or up to 1 [Nico Robin] with a cost of 6 or less from your hand or
 * trash."
 *
 * Rules: CR 4-9 (cost modifiers), CR 4-8-1 ("up to"), CR 8-1-3 (timing header [Opponent's Turn] on
 * a trigger: only when the K.O. happens during the opponent's turn), "other than [Koala]" is a
 * name exclusion (any card named Koala), CR 3-7-4 (a played Character enters active).
 * Reading assumed: "up to 1 X or up to 1 Y" plays one card in total.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, noDefence } from '../../helpers.ts';
import {
  atMain,
  canFinish,
  chars,
  hand,
  kind,
  LB,
  mine,
  need,
  noDefenceUntilTrigger,
  offeredIds,
  pickCards,
  theirs,
  trash,
} from './kit-eb03b.ts';

const ID = 'EB03-042';
const HACK6 = 'OP13-090'; // {Fish-Man}/{Revolutionary Army}/{Dressrosa}, cost 6, 7000, vanilla
const INAZUMA5 = 'OP12-083'; // {Revolutionary Army}, cost 5, 6000, vanilla
const SABO7 = 'OP09-104'; // {Revolutionary Army}, cost 7, 7000
const KOALA2 = 'EB05-041'; // named Koala, {Revolutionary Army}/{Dressrosa}, cost 2, vanilla
const ROBIN6 = 'OP10-089'; // [Nico Robin], {Straw Hat Crew}/{Dressrosa}, cost 6, 8000, vanilla
const ROBIN7 = 'OP13-032'; // [Nico Robin], {FILM}/{Straw Hat Crew}, cost 7
const MARCO = 'OP01-023'; // cost 3, no type of interest
const HAJRUDIN = 'OP01-018'; // cost 4, 6000, vanilla

/**
 * My turn: my Leader hits p2's Leader and the top Life card is OP15-115 Impact Dial ([Trigger] K.O.
 * up to 1 of the opponent's Characters with a cost of 4 or less), which p2 activates.
 */
function hitIntoImpactDial(leader: string) {
  const g = mine(
    leader,
    { characters: [ID], hand: [HACK6, INAZUMA5], trash: [ROBIN6] },
    { life: ['OP15-115', 'OP02-060', 'OP02-060', 'OP02-060'] },
  );
  attack(g, g.leader('p1'), g.leader('p2'));
  noDefenceUntilTrigger(g);
  need(g, 'trigger', 'p2');
  act(g, { type: 'trigger', activate: true });
  if (kind(g) === 'choose') {
    const k = g.find('p1', 'characters', ID);
    act(g, { type: 'pick', choice: k });
  }
  return g;
}

/** p2's turn: p2's Leader (5000) attacks the rested Koala (5000 or cost-boosted) and K.O.s it. */
function koOnTheirTurn(o: { hand?: string[]; trash?: string[]; leader?: string }) {
  const g = theirs(o.leader ?? LB.ra, {
    characters: [{ card: ID, rested: true }],
    hand: o.hand ?? [],
    trash: o.trash ?? [],
  });
  const koala = g.find('p1', 'characters', ID);
  attack(g, g.leader('p2'), koala);
  noDefence(g);
  return g;
}

describe("EB03-042 Koala: +4 cost with a {Revolutionary Army} Leader; [Opponent's Turn] [On K.O.] play a cheap {Revolutionary Army} (not Koala) or [Nico Robin] from hand or trash", () => {
  it('with a {Revolutionary Army} Leader Koala has cost 8; with another Leader it keeps cost 4', () => {
    const ra = mine(LB.ra, { characters: [ID] });
    expect(ra.card(ra.find('p1', 'characters', ID)).cost).toBe(8);
    const other = mine(LB.luffy, { characters: [ID] });
    expect(other.card(other.find('p1', 'characters', ID)).cost).toBe(4);
  });

  it("K.O.'d on the opponent's turn: plays a {Revolutionary Army} Character of cost 6 from hand, active", () => {
    const g = koOnTheirTurn({ hand: [HACK6, MARCO] });
    need(g, 'choose', 'p1');
    pickCards(g, [HACK6]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([HACK6]);
    expect(g.card(g.find('p1', 'characters', HACK6)).rested).toBe(false);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([MARCO]);
  });

  it('may also play from the trash', () => {
    const g = koOnTheirTurn({ trash: [INAZUMA5] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([INAZUMA5]);
    pickCards(g, [INAZUMA5]);
    expect(chars(g)).toEqual([INAZUMA5]);
    expect(trash(g)).toEqual([ID]);
  });

  it('candidates: cost 6 or less only, never another card named Koala, and [Nico Robin] of cost 6 or less is included', () => {
    const g = koOnTheirTurn({
      hand: [HACK6, SABO7, KOALA2, ROBIN6, ROBIN7, MARCO, HAJRUDIN],
    });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HACK6, ROBIN6].sort());
  });

  it('"up to 1": may play nothing', () => {
    const g = koOnTheirTurn({ hand: [HACK6] });
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([HACK6]);
  });

  it('plays only one card even when both a {Revolutionary Army} Character and [Nico Robin] qualify', () => {
    const g = koOnTheirTurn({ hand: [HACK6, ROBIN6], trash: [INAZUMA5] });
    need(g, 'choose', 'p1');
    pickCards(g, [ROBIN6]);
    // Either the effect is over, or it offers nothing more that could be played.
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(chars(g)).toEqual([ROBIN6]);
  });

  it('the pick over a hand that holds no candidate is still asked (the prompt must not reveal the hidden hand)', () => {
    const g = koOnTheirTurn({ hand: [MARCO, HAJRUDIN] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([]);
  });

  it("[Opponent's Turn] only: K.O.'d on my own turn (by the opponent's Life [Trigger]) it plays nothing", () => {
    const g = hitIntoImpactDial(LB.luffy);
    // Koala (cost 4 with a non-{Revolutionary Army} Leader) is K.O.'d by OP15-115 on my own turn.
    expect(g.zone('p1', 'characters')).toEqual([]);
    expect(trash(g)).toEqual([ID, ROBIN6].sort());
    expect(atMain(g, 'p1')).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([HACK6, INAZUMA5].sort());
  });

  it('with a {Revolutionary Army} Leader the +4 cost (8) puts Koala out of reach of a "cost of 4 or less" K.O.', () => {
    const g = hitIntoImpactDial(LB.ra);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([ROBIN6]);
  });

  it('the +4 cost applies only with the Leader type: the same Koala with a non-{Revolutionary Army} Leader is still hit and still plays', () => {
    const g = koOnTheirTurn({ leader: LB.luffy, hand: [HACK6] });
    need(g, 'choose', 'p1');
    pickCards(g, [HACK6]);
    expect(chars(g)).toEqual([HACK6]);
  });

  it('with a full Character area the played card needs a free slot: Koala has just left, so the 5th slot is free', () => {
    const g = theirs(LB.ra, {
      characters: [{ card: ID, rested: true }, MARCO, MARCO, MARCO, MARCO],
      hand: [HACK6],
    });
    attack(g, g.leader('p2'), g.find('p1', 'characters', ID));
    noDefence(g);
    need(g, 'choose', 'p1');
    pickCards(g, [HACK6]);
    expect(chars(g).sort()).toEqual([HACK6, MARCO, MARCO, MARCO, MARCO].sort());
  });
});
