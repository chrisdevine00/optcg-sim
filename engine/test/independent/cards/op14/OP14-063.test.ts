/**
 * OP14-063 Sugar (Character, Purple, cost 4, 1000, Counter +1000, {Donquixote Pirates}).
 *
 * Card text: "[On Play] Add up to 1 DON!! card from your DON!! deck and set it as active.
 * [On K.O.] If your opponent has 6 or more DON!! cards on their field, play up to 1
 * {Donquixote Pirates} type Character card with a cost of 5 or less from your hand."
 *
 * Rules: "add up to N DON!!" asks a count (E-Q11); a DON!! on the field counts in the cost area
 * (active or rested) and given to a Leader or Character; an "up to" pick from the hand is asked
 * even when nothing matches (a prompt must not depend on hidden cards), while a public condition
 * that fails asks nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  addDon,
  asksCount,
  at,
  backToMain,
  chars,
  countOptions,
  donOf14,
  hand,
  koGame,
  LD14,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  onField,
  pickInst,
  playRaw,
  SC14,
} from './kit-op14c.ts';

const ID = 'OP14-063';

/** p1 plays Sugar (cost 4) with 8 active DON!! (DON!! deck 2). */
function playSugar(active = 8) {
  const g = mine(LD14.dp, { hand: [ID], costArea: { active, rested: 0 } });
  playRaw(g, ID);
  return g;
}

describe('OP14-063 Sugar [On Play] add up to 1 DON!! active', () => {
  it('asks how many (up to 1): 1 or none', () => {
    const g = playSugar();
    expect(countOptions(g).sort()).toEqual(['0', '1']);
  });

  it('adding 1: the new DON!! is ACTIVE, taken from the DON!! deck', () => {
    const g = playSugar();
    // After paying the cost of 4: 4 active, 4 rested, DON!! deck 2.
    expect(donOf14(g)).toMatchObject({ active: 4, rested: 4, deck: 2 });
    addDon(g, 1);
    backToMain(g, 'p1');
    expect(donOf14(g)).toMatchObject({ active: 5, rested: 4, deck: 1 });
    expect(chars(g)).toEqual([ID]);
  });

  it('"up to": adding none changes nothing', () => {
    const g = playSugar();
    addDon(g, 0);
    backToMain(g, 'p1');
    expect(donOf14(g)).toMatchObject({ active: 4, rested: 4, deck: 2 });
  });

  it('with an empty DON!! deck nothing is added and the play still completes', () => {
    const g = playSugar(10);
    if (asksCount(g)) addDon(g, 0);
    backToMain(g, 'p1');
    expect(onField(g)).toBe(10);
    expect(donOf14(g).deck).toBe(0);
    expect(chars(g)).toEqual([ID]);
  });

  it('the added DON!! can pay for another card this turn (it is active)', () => {
    const g = mine(LD14.dp, { hand: [ID, SC14.c2], costArea: { active: 5, rested: 0 } });
    playRaw(g, ID);
    addDon(g, 1);
    backToMain(g, 'p1');
    // 5 - 4 = 1 active, plus the added active DON!! = 2: enough for the cost-2 Character.
    expect(donOf14(g).active).toBe(2);
    playRaw(g, SC14.c2);
    expect(chars(g)).toEqual([ID, SC14.c2].sort());
  });
});

describe('OP14-063 Sugar [On K.O.] opponent has 6+ DON!!: play a {Donquixote Pirates} cost 5 or less', () => {
  const six = { costArea: { active: 4, rested: 2 } };

  it('with exactly 6 DON!! on their field: offers {Donquixote Pirates} Characters of cost 5 or less only', () => {
    const g = koGame(ID, {
      p2: six,
      p1: { hand: [SC14.dp5, SC14.dp6, SC14.c3, SC14.dp2] },
    });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.dp5, SC14.dp2].sort());
  });

  it('playing the chosen card puts it on the field, active, from the hand', () => {
    const g = koGame(ID, { p2: six, p1: { hand: [SC14.dp5, SC14.c3] } });
    pickInst(g, [at(g, 'p1', 'hand', SC14.dp5)]);
    backToMain(g, 'p2');
    expect(chars(g)).toEqual([SC14.dp5]);
    expect(hand(g)).toEqual([SC14.c3]);
    expect(g.card(at(g, 'p1', 'characters', SC14.dp5)).rested).toBe(false);
  });

  it('boundary: with only 5 DON!! on their field nothing is asked and nothing is played', () => {
    const g = koGame(ID, {
      p2: { costArea: { active: 3, rested: 2 } },
      p1: { hand: [SC14.dp5] },
    });
    backToMain(g, 'p2');
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([SC14.dp5]);
  });

  it('DON!! given to their Leader and Characters, and rested ones, count towards the 6', () => {
    const g = koGame(ID, {
      p2: { costArea: { active: 2, rested: 2 } },
      p2chars: [{ card: SC14.c3, don: 2 }],
      p1: { hand: [SC14.dp2] },
    });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.dp2]);
  });

  it('only THEIR DON!! counts: my own 6+ DON!! do not satisfy the condition', () => {
    const g = koGame(ID, {
      p1: { hand: [SC14.dp2], costArea: { active: 6, rested: 0 } },
      p2: { costArea: { active: 3, rested: 2 } },
    });
    backToMain(g, 'p2');
    expect(chars(g)).toEqual([]);
  });

  it('"up to 1": nothing may be played', () => {
    const g = koGame(ID, { p2: six, p1: { hand: [SC14.dp2] } });
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    backToMain(g, 'p2');
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([SC14.dp2]);
  });

  it('the prompt does not depend on the hidden hand: with no match the "up to" pick is still asked, empty', () => {
    const g = koGame(ID, { p2: six, p1: { hand: [SC14.c3, SC14.dp6] } });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    backToMain(g, 'p2');
    expect(chars(g)).toEqual([]);
  });

  it('plays at most one card even when several qualify', () => {
    const g = koGame(ID, { p2: six, p1: { hand: [SC14.dp5, SC14.dp2, SC14.dp3] } });
    pickInst(g, [at(g, 'p1', 'hand', SC14.dp5)]);
    backToMain(g, 'p2');
    expect(chars(g)).toEqual([SC14.dp5]);
    expect(hand(g)).toEqual([SC14.dp2, SC14.dp3].sort());
  });
});
