/**
 * PRB02-018 Portgas.D.Ace (Character, Yellow, cost 5, 7000, no Counter, {Whitebeard Pirates},
 * Special).
 *
 * Card text: "[On Play] If you have a face-up Life card, play up to 1 [Sabo], [Portgas.D.Ace], or
 * [Monkey.D.Luffy] with a cost of 2 from your hand or trash."
 *
 * Rules: a Life card is face-up only when an effect turned it so (CR 3-10-2-1); the colon-less "If"
 * is an effect condition checked as the effect resolves; "play" by an effect puts the card on the
 * field without paying its cost; "up to 1" may be skipped; names are exact ([Sabo] is the name
 * Sabo); the cost is the printed or current cost of the card in hand or trash (2 exactly).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  chars,
  don,
  hand,
  kind,
  LW,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  trash,
  V13,
  type Spec,
} from './kit-w5b.ts';

const ACE5 = 'PRB02-018';
/** ST13-007 Sabo: Yellow, cost 2, 2000, [Activate: Main] only (inert). */
const SABO2 = 'ST13-007';
/** ST13-010 Portgas.D.Ace: Yellow, cost 2, 2000, [Activate: Main] only. */
const ACE2 = 'ST13-010';
/** ST13-014 Monkey.D.Luffy: Yellow, cost 2, 2000, [Activate: Main] only. */
const LUFFY2 = 'ST13-014';
/** ST08-011 Monkey.D.Luffy: Black, cost 3, 5000, vanilla. */
const LUFFY3 = 'ST08-011';
/** P-119 Portgas.D.Ace: Red, cost 4, 6000, vanilla. */
const ACE4 = 'P-119';
/** OP01-012 Sai: Red, cost 2, 4000, vanilla (the right cost, another name). */
const SAI2 = V13.sai;

function board(over: Spec = {}, p2: Spec = {}) {
  return mine(
    LW.luffy,
    {
      hand: [ACE5, SABO2, LUFFY3],
      trash: [ACE2, ACE4, SAI2, V13.marco],
      life: [{ card: V13.mohji, faceUp: true }, V13.mohji, V13.mohji],
      costArea: { active: 10, rested: 0 },
      ...over,
    },
    p2,
  );
}

describe('PRB02-018 Portgas.D.Ace: [On Play] with a face-up Life card, play a cost 2 [Sabo]/[Portgas.D.Ace]/[Monkey.D.Luffy] from hand or trash', () => {
  it('printed values: cost 5, 7000 power, no Counter', () => {
    const g = board();
    expect(g.card(at(g, 'p1', 'hand', ACE5)).cost).toBe(5);
    playRaw(g, ACE5);
    const c = g.card(at(g, 'p1', 'characters', ACE5));
    expect(g.power(c.instance)).toBe(7000);
    expect(c.counter ?? null).toBeNull();
  });

  it('with a face-up Life card it offers exactly the cost 2 Sabo / Ace / Luffy in hand and trash', () => {
    const g = board({ hand: [ACE5, SABO2, LUFFY3, LUFFY2] });
    playRaw(g, ACE5);
    need(g, 'choose', 'p1');
    // Hand: Sabo 2, Luffy 2 (Luffy 3 has the wrong cost). Trash: Ace 2 (Ace 4 and Sai 2 are wrong).
    expect(offeredIds(g)).toEqual([SABO2, LUFFY2, ACE2].sort());
  });

  it('a card from the hand is played onto the field without paying its cost', () => {
    const g = board();
    playRaw(g, ACE5);
    need(g, 'choose', 'p1');
    pickCards(g, [SABO2]);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p1').sort()).toEqual([ACE5, SABO2].sort());
    expect(hand(g)).toEqual([LUFFY3]);
    // Only Ace's own 5 DON!! were paid.
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
  });

  it('a card from the trash is played too, and leaves the trash', () => {
    const g = board();
    playRaw(g, ACE5);
    pickCards(g, [ACE2]);
    expect(chars(g, 'p1').sort()).toEqual([ACE2, ACE5].sort());
    expect(trash(g)).not.toContain(ACE2);
    expect(hand(g)).toEqual([SABO2, LUFFY3].sort());
  });

  it('boundary: cost 3 (Luffy) and cost 4 (Ace) are not offered; neither is a cost 2 card with another name', () => {
    const g = board({ hand: [ACE5, LUFFY3, SAI2], trash: [ACE4, V13.marco] });
    playRaw(g, ACE5);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p1')).toEqual([ACE5]);
  });

  it('"up to 1": may play nothing, and plays only one even when several qualify', () => {
    const g = board();
    playRaw(g, ACE5);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g, 'p1')).toEqual([ACE5]);
    const h = board({ hand: [ACE5, SABO2, LUFFY2] });
    playRaw(h, ACE5);
    pickCards(h, [SABO2]);
    expect(chars(h, 'p1').sort()).toEqual([ACE5, SABO2].sort());
    expect(hand(h)).toEqual([LUFFY2]);
  });

  it('boundary: with every Life card face-down the condition fails and nothing is offered or played', () => {
    const g = board({ life: [V13.mohji, V13.mohji, V13.mohji] });
    playRaw(g, ACE5);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p1')).toEqual([ACE5]);
    expect(hand(g)).toEqual([SABO2, LUFFY3].sort());
    expect(trash(g)).toContain(ACE2);
  });

  it('boundary: one face-up Life card among several is enough', () => {
    const g = board({ life: [V13.mohji, V13.mohji, { card: V13.mohji, faceUp: true }] });
    playRaw(g, ACE5);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(SABO2);
  });

  it('only my own Life counts: a face-up Life card of the opponent does not satisfy the condition', () => {
    const g = board(
      { life: [V13.mohji, V13.mohji, V13.mohji] },
      { life: [{ card: V13.mohji, faceUp: true }, V13.mohji, V13.mohji] },
    );
    playRaw(g, ACE5);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p1')).toEqual([ACE5]);
  });

  it('with no qualifying card anywhere the effect does nothing and the game goes on', () => {
    const g = board({ hand: [ACE5], trash: [V13.marco] });
    playRaw(g, ACE5);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p1')).toEqual([ACE5]);
  });
});
