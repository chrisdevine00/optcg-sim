/**
 * OP14-076 Ever White (Event, Purple, cost 1, {Donquixote Pirates}/{The Seven Warlords of the Sea}).
 *
 * Card text: "[Main] You may rest 2 of your DON!! cards: If your Leader has the {Donquixote Pirates}
 * type, add up to 1 DON!! card from your DON!! deck and rest it.
 * [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: CR 8-3-1-4 (a "may" cost can be declined, then nothing happens; an unpayable cost cannot be
 * paid), the "If" is checked at resolution after the cost, "add up to N DON!!" asks a count, "during
 * this battle" ends at the end of the battle (RL-08), a Counter may boost a card not in the battle.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateCounter,
  addDon,
  at,
  attack,
  backToMain,
  canCounterNow,
  chr,
  countOptions,
  donOf14,
  kind,
  LD14,
  mine,
  need,
  no,
  onField,
  passBlock,
  payDon,
  playRaw,
  SC14,
  theirs,
  trash,
  unusable,
  yes,
  asksCount,
  offeredAbilities,
} from './kit-op14c.ts';

const ID = 'OP14-076';

/** p1's Main Phase with Ever White in hand and `active` active DON!!. */
function main(o: { leader?: string; active?: number } = {}) {
  return mine(o.leader ?? LD14.dp, {
    hand: [ID],
    costArea: { active: o.active ?? 6, rested: 0 },
  });
}

/** Play the Event, accept the optional cost and rest 2 active DON!!; stops at the next prompt. */
function pay(g: ReturnType<typeof main>) {
  playRaw(g, ID);
  yes(g, 'p1');
  payDon(g, 2, 'costActive');
}

describe('OP14-076 Ever White [Main] may rest 2 DON!!: add 1 rested DON!!', () => {
  it('costs 1; resting 2 more DON!! and answering the count adds 1 RESTED DON!! from the DON!! deck', () => {
    const g = main();
    pay(g);
    expect(countOptions(g).sort()).toEqual(['0', '1']);
    addDon(g, 1);
    backToMain(g, 'p1');
    // 6 active: 1 for the Event, 2 rested for the cost; the new DON!! is rested.
    expect(donOf14(g)).toMatchObject({ active: 3, rested: 4, deck: 3 });
    expect(trash(g)).toEqual([ID]);
  });

  it('"up to": adding none adds nothing but the cost stays paid', () => {
    const g = main();
    pay(g);
    addDon(g, 0);
    expect(donOf14(g)).toMatchObject({ active: 3, rested: 3, deck: 4 });
  });

  it('"you may": declining the cost leaves only the Event’s own cost paid', () => {
    const g = main();
    playRaw(g, ID);
    no(g, 'p1');
    backToMain(g, 'p1');
    expect(donOf14(g)).toMatchObject({ active: 5, rested: 1, deck: 4 });
    expect(trash(g)).toEqual([ID]);
  });

  it('the Leader must have {Donquixote Pirates}: with another Leader the cost is paid and nothing is added', () => {
    const g = main({ leader: LD14.plain });
    pay(g);
    if (asksCount(g)) addDon(g, 0);
    backToMain(g, 'p1');
    expect(onField(g)).toBe(6);
    expect(donOf14(g)).toMatchObject({ active: 3, rested: 3, deck: 4 });
  });

  it('only DON!! that are still active can be rested for the cost: with 2 active DON!! after paying the Event, it cannot be paid', () => {
    const g = main({ active: 2 });
    playRaw(g, ID);
    // Event cost 1 leaves 1 active DON!!: resting 2 is impossible.
    unusable(g, 'p1');
    backToMain(g, 'p1');
    expect(onField(g)).toBe(2);
    expect(trash(g)).toEqual([ID]);
  });

  it('with exactly 3 active DON!! (1 for the Event + 2 for the cost) it can be paid', () => {
    const g = main({ active: 3 });
    pay(g);
    addDon(g, 1);
    expect(donOf14(g)).toMatchObject({ active: 0, rested: 4 });
  });

  it('with an empty DON!! deck nothing is added', () => {
    const g = main({ active: 10 });
    pay(g);
    if (asksCount(g)) addDon(g, 0);
    backToMain(g, 'p1');
    expect(onField(g)).toBe(10);
    expect(donOf14(g).deck).toBe(0);
  });

  it('it cannot be used as a [Counter] on my own turn, and its [Main] is not offered in a Counter Step', () => {
    const g = main();
    expect(canCounterNow(g, at(g, 'p1', 'hand', ID))).toBe(false);
    expect(offeredAbilities(g, at(g, 'p1', 'hand', ID))).toEqual([]);
  });
});

describe('OP14-076 Ever White [Counter] my Leader gains +3000 power during this battle', () => {
  /** p2's 5000 Leader attacks my 5000 Leader; I do not block and reach the Counter Step. */
  function defend(o: { target?: 'leader' | 'char' } = {}) {
    const g = theirs(
      LD14.dp,
      {
        hand: [ID],
        characters: [{ card: SC14.c2, rested: true }],
        costArea: { active: 4, rested: 0 },
      },
      {},
    );
    const target = o.target === 'char' ? chr(g, 'p1', SC14.c2) : g.leader('p1');
    attack(g, g.leader('p2'), target);
    passBlock(g);
    need(g, 'counter', 'p1');
    return g;
  }

  it('is usable in the Counter Step; the Leader goes to 8000 for the battle and the attack fails', () => {
    const g = defend();
    expect(g.power(g.leader('p1'))).toBe(5000);
    activateCounter(g, at(g, 'p1', 'hand', ID));
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(kind(g)).toBe('counter');
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([ID]);
  });

  it('the boost ends with the battle: the Leader is 5000 again afterwards', () => {
    const g = defend();
    activateCounter(g, at(g, 'p1', 'hand', ID));
    act(g, { type: 'endCounter' });
    backToMain(g, 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('it boosts the Leader even when a Character is the one attacked (the Character is not helped)', () => {
    const g = defend({ target: 'char' });
    activateCounter(g, at(g, 'p1', 'hand', ID));
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(g.power(chr(g, 'p1', SC14.c2))).toBe(4000);
    act(g, { type: 'endCounter' });
    expect(trash(g)).toContain(SC14.c2);
  });

  it('it costs 1 DON!! and needs no choice (no target prompt)', () => {
    const g = defend();
    activateCounter(g, at(g, 'p1', 'hand', ID));
    expect(kind(g)).toBe('counter');
    expect(donOf14(g)).toMatchObject({ active: 3, rested: 1 });
  });
});
