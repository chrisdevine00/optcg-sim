/**
 * OP17-031 Yasopp (Character, Green, cost 5, 6000, Counter +1000, {Red-Haired Pirates}).
 *
 * Card text: "[On Play] Draw 1 card and rest up to 1 of your opponent's Characters with a cost of 8
 * or less. [End of Your Turn] Set up to 1 of your Characters with a type including "Red-Haired
 * Pirates" as active."
 *
 * Rules: CR 4-8-1 / 8-4-4-1 ("up to" allows 0), CR 2-4-3-1 (type including: substring), CR 6-6-1-1
 * ([End of Your Turn] runs in the End Phase), CR 2-2-4-1 ("Character" is not the Leader).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  choices,
  deck,
  kind,
  LD,
  mine,
  n,
  need,
  none,
  offeredIds,
  pickCards,
  mayChooseNone,
  playCard,
  SCN,
} from './kit-op17b.ts';

const YASOPP = 'OP17-031';
const FUGAR = 'OP17-026'; // Green, cost 1, 2000, {Red-Haired Pirates Allies}: type includes "Red-Haired Pirates"
const GAB = 'OP09-006'; // Red, cost 5, 7000, {Red-Haired Pirates}, vanilla

function play(opp: string[]) {
  const g = mine(LD.rhp, { hand: [YASOPP] }, { characters: opp });
  playCard(g, YASOPP);
  return g;
}

describe('OP17-031 Yasopp: [On Play] draw 1, rest up to 1 (cost 8 or less); [End of Your Turn] set up 1 {Red-Haired Pirates}', () => {
  it('[On Play]: draws 1 card and rests the chosen opposing Character', () => {
    const g = play([SCN.c4]);
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c4]);
    expect(atMain(g)).toBe(true);
    expect(n(g, 'p1', 'hand')).toBe(1);
    expect(deck(g)).toHaveLength(14);
    expect(g.card(at(g, 'p2', 'characters', SCN.c4)).rested).toBe(true);
  });

  it('[On Play]: a cost-8 Character is offered, a cost-9 Character is not (boundary)', () => {
    const g = play([SCN.c8, SCN.c9]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SCN.c8]);
  });

  it('[On Play]: only opposing Characters are candidates (not my own, not Leaders)', () => {
    const g = mine(LD.rhp, { hand: [YASOPP], characters: [SCN.c2] }, { characters: [SCN.c3] });
    playCard(g, YASOPP);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SCN.c3]);
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('[On Play]: "up to 1" may choose nothing; the draw still happens and nothing is rested', () => {
    const g = play([SCN.c4]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(n(g, 'p1', 'hand')).toBe(1);
    expect(g.card(at(g, 'p2', 'characters', SCN.c4)).rested).toBe(false);
  });

  it('[On Play]: with no legal target the card is still drawn', () => {
    const g = play([SCN.c9]);
    if (kind(g) === 'choose') none(g);
    expect(atMain(g)).toBe(true);
    expect(n(g, 'p1', 'hand')).toBe(1);
    expect(g.card(at(g, 'p2', 'characters', SCN.c9)).rested).toBe(false);
  });

  it('[On Play]: rests only 1 even when several qualify', () => {
    const g = play([SCN.c3, SCN.c4]);
    pickCards(g, [SCN.c3]);
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).rested).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', SCN.c4)).rested).toBe(false);
  });

  it('[End of Your Turn]: sets up a rested {Red-Haired Pirates} Character, including a type that merely includes it', () => {
    const g = mine(LD.rhp, {
      characters: [
        YASOPP,
        { card: FUGAR, rested: true },
        { card: GAB, rested: true },
        { card: SCN.c2, rested: true },
      ],
    });
    act(g, { type: 'endTurn' });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(FUGAR);
    expect(offeredIds(g)).toContain(GAB);
    expect(offeredIds(g)).not.toContain(SCN.c2);
    pickCards(g, [FUGAR]);
    expect(g.card(at(g, 'p1', 'characters', FUGAR)).rested).toBe(false);
    expect(g.card(at(g, 'p1', 'characters', GAB)).rested).toBe(true);
    expect(g.card(at(g, 'p1', 'characters', SCN.c2)).rested).toBe(true);
  });

  it('[End of Your Turn]: "up to 1" may choose nothing', () => {
    const g = mine(LD.rhp, { characters: [YASOPP, { card: GAB, rested: true }] });
    act(g, { type: 'endTurn' });
    need(g, 'choose', 'p1');
    none(g);
    expect(g.card(at(g, 'p1', 'characters', GAB)).rested).toBe(true);
  });

  it('[End of Your Turn]: Characters only: a rested {Red-Haired Pirates} Leader is not a candidate, and no prompt without candidates', () => {
    const g = mine(
      { card: LD.rhp, rested: true },
      { characters: [YASOPP, { card: SCN.c2, rested: true }] },
    );
    act(g, { type: 'endTurn' });
    if (kind(g) === 'choose') {
      expect(choices(g)).not.toContain(g.leader('p1'));
      none(g);
    }
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('[End of Your Turn] belongs to Yasopp: with no Yasopp on the field nothing is asked and nothing is set up', () => {
    const g = mine(LD.rhp, { characters: [{ card: GAB, rested: true }] });
    act(g, { type: 'endTurn' });
    expect(kind(g)).not.toBe('choose');
    expect(g.card(at(g, 'p1', 'characters', GAB)).rested).toBe(true);
  });
});
