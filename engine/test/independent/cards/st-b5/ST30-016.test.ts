/**
 * ST30-016 Can You Still Fight, Luffy?! Of Course!! (Event, Red, cost 1, {Straw Hat Crew}/{Whitebeard Pirates}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +3000 power during this
 * battle. Then, if you have [Portgas.D.Ace] and [Monkey.D.Luffy] Characters with 6000 base power,
 * draw 1 card."
 *
 * Rules: an Event [Counter] costs its DON!! (CR 7-1-3-1-2), "up to 1" allows 0, the boost lasts
 * for this battle (RL-08), the draw is conditional on the Characters named [Portgas.D.Ace] and
 * [Monkey.D.Luffy] (CR 2-1-2: exact names; Leaders are not Characters) each with exactly 6000 base
 * power (RL-49), "Then" clauses run on their own condition (CR 4-10-2).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateCounter,
  BLUE,
  canCounterNow,
  choices,
  deck,
  don,
  hand,
  kind,
  mayChooseNone,
  need,
  none,
  offeredIds,
  passBlock,
  pickInst,
  pw,
  SL,
  theirs,
  trash,
  attack,
} from './kit-stb5a.ts';

const ID = 'ST30-016';
const ACE6 = 'P-119'; // Portgas.D.Ace, Red, cost 4, 6000, vanilla
const LUFFY6 = 'P-022'; // Monkey.D.Luffy, Red, cost 4, 6000, vanilla
const ACE7 = 'OP02-013'; // Portgas.D.Ace, Red, cost 7, 7000
const LUFFY7 = 'OP13-118'; // Monkey.D.Luffy, Green, cost 6, 7000
const ACE_BLUE6 = 'ST22-010'; // Portgas.D.Ace, Blue, cost 5, 6000
const HAJ = 'OP01-018'; // Red, 6000, a different name
const DECK = ['OP01-010', 'OP01-012', ...Array(10).fill(BLUE)];
const ACE_LEADER = 'OP16-001'; // Portgas.D.Ace (Leader), Red, 5000, 5 Life

/** p2's 5000 Leader attacks my 5000 Leader; I am in the Counter Step holding the Event. */
function counterStep(chars: string[], leader: string = SL.luffy, active = 5) {
  const g = theirs(
    leader,
    { characters: chars, hand: [ID], deck: DECK, costArea: { active, rested: 0 } },
    {},
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}
/** Use the Event and boost my Leader. */
function use(g: ReturnType<typeof counterStep>) {
  activateCounter(g, g.find('p1', 'hand', ID));
  need(g, 'choose', 'p1');
  pickInst(g, [g.leader('p1')]);
}

describe('ST30-016: [Counter] +3000 to my Leader or a Character', () => {
  it('gives my Leader +3000 this battle and the attack (5000) fails against 8000', () => {
    const g = counterStep([HAJ]);
    use(g);
    expect(g.power(g.leader('p1'))).toBe(8000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
  });

  it('may boost a Character instead', () => {
    const g = counterStep([HAJ]);
    activateCounter(g, g.find('p1', 'hand', ID));
    pickInst(g, [g.find('p1', 'characters', HAJ)]);
    expect(pw(g, 'p1', HAJ)).toBe(9000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("candidates are my Leader and my Characters, not the opponent's", () => {
    const g = counterStep([HAJ]);
    activateCounter(g, g.find('p1', 'hand', ID));
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(offeredIds(g)).toEqual([HAJ, SL.luffy].sort());
  });

  it('the boost ends with the battle', () => {
    const g = counterStep([HAJ]);
    use(g);
    act(g, { type: 'endCounter' });
    expect(kind(g)).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('costs 1 DON!!, and cannot be used with none active', () => {
    const g = counterStep([HAJ]);
    use(g);
    expect(don(g).rested).toBe(1);
    expect(trash(g)).toEqual([ID]);
    const h = counterStep([HAJ], SL.luffy, 0);
    expect(canCounterNow(h, h.find('p1', 'hand', ID))).toBe(false);
  });
});

describe('ST30-016: then, with [Portgas.D.Ace] and [Monkey.D.Luffy] Characters of 6000 base power, draw 1', () => {
  it('with both (6000 base each) I draw 1 card from the top', () => {
    const g = counterStep([ACE6, LUFFY6]);
    use(g);
    expect(hand(g)).toEqual(['OP01-010']);
    expect(deck(g)).toHaveLength(DECK.length - 1);
  });

  it('with only [Portgas.D.Ace] (6000) there is no draw, but the boost still applies', () => {
    const g = counterStep([ACE6, HAJ]);
    use(g);
    expect(hand(g)).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('with only [Monkey.D.Luffy] (6000) there is no draw', () => {
    const g = counterStep([LUFFY6, HAJ]);
    use(g);
    expect(hand(g)).toEqual([]);
  });

  it('an Ace with 7000 base power does not count', () => {
    const g = counterStep([ACE7, LUFFY6]);
    use(g);
    expect(hand(g)).toEqual([]);
  });

  it('a Luffy with 7000 base power does not count', () => {
    const g = counterStep([ACE6, LUFFY7]);
    use(g);
    expect(hand(g)).toEqual([]);
  });

  it('two Aces and no Luffy: no draw', () => {
    const g = counterStep([ACE6, ACE_BLUE6]);
    use(g);
    expect(hand(g)).toEqual([]);
  });

  it('a Leader named [Portgas.D.Ace] is not a Character: with only Luffy 6000, no draw', () => {
    const g = counterStep([LUFFY6], ACE_LEADER);
    use(g);
    expect(hand(g)).toEqual([]);
  });

  it('the draw does not depend on boosting: choosing nobody still draws with both Characters', () => {
    const g = counterStep([ACE6, LUFFY6]);
    activateCounter(g, g.find('p1', 'hand', ID));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g)).toEqual(['OP01-010']);
  });

  it('draws exactly 1 card (not more) with the condition met', () => {
    const g = counterStep([ACE6, LUFFY6, ACE_BLUE6]);
    use(g);
    expect(hand(g)).toHaveLength(1);
  });
});
