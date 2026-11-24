/**
 * OP12-104 Sentomaru (Character, Yellow, cost 4, 5000, Counter +1000, {Navy}/{Egghead}).
 *
 * Card text: no effect text. "[Trigger] K.O. up to 1 of your opponent's Characters with a cost of 4 or
 * less."
 *
 * Rules: CR 10-1-5 ([Trigger]), "cost" is the current cost (Morley under an RA Leader reads 8), CR 4-8-1
 * ("up to" allows 0). A Character activated by [Trigger] whose text does not say "play" goes to the
 * trash after it resolves (CR 10-1-5-3); declining adds it to the hand.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  atMain,
  chars,
  declineTrigger,
  hand,
  hitLeader,
  kind,
  LDR,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  SCN,
  theirs,
  trash,
} from './kit-op12c.ts';

const ID = 'OP12-104';

function hit(oppChars: string[], oppLeader: string = LDR.luffy) {
  const g = theirs(
    LDR.neutral,
    { life: [ID, SCN.c1, SCN.c1, SCN.c1] },
    { characters: oppChars },
    oppLeader,
  );
  hitLeader(g);
  return g;
}

describe('OP12-104 Sentomaru: [Trigger] K.O. up to 1 opposing Character with cost 4 or less', () => {
  it('when the Life card is revealed a Trigger decision is pending', () => {
    const g = hit([SCN.c3]);
    expect(kind(g)).toBe('trigger');
  });

  it('activating offers the opposing Characters with cost 4 or less (4 in, 5 out)', () => {
    const g = hit([SCN.c3, SCN.c4, SCN.c5]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c3, SCN.c4].sort());
  });

  it('the chosen Character is K.O.d, the others stay', () => {
    const g = hit([SCN.c3, SCN.c4]);
    activateTrigger(g);
    pickCards(g, [SCN.c4]);
    expect(trash(g, 'p2')).toEqual([SCN.c4]);
    expect(chars(g, 'p2')).toEqual([SCN.c3]);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = hit([SCN.c3]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(chars(g, 'p2')).toEqual([SCN.c3]);
  });

  it('the current cost is read: an opposing Morley at cost 8 (RA Leader) is not offered', () => {
    const g = hit(['OP12-093', SCN.c3], LDR.ra);
    activateTrigger(g);
    expect(offeredIds(g)).toEqual([SCN.c3]);
  });

  it('after the Trigger resolves Sentomaru is trashed, not added to my hand or played', () => {
    const g = hit([SCN.c3]);
    activateTrigger(g);
    pickCards(g, [SCN.c3]);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
    expect(chars(g)).toEqual([]);
    expect(g.life('p1')).toBe(3);
  });

  it('declining the Trigger adds Sentomaru to my hand and K.O.s nothing', () => {
    const g = hit([SCN.c3]);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(chars(g, 'p2')).toEqual([SCN.c3]);
  });

  it('with no opposing Character in range the Trigger resolves with nothing to choose', () => {
    const g = hit([SCN.c5]);
    activateTrigger(g);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(chars(g, 'p2')).toEqual([SCN.c5]);
    expect(trash(g)).toEqual([ID]);
  });

  it('played from hand it is a vanilla Character: no prompt on play', () => {
    const g = mine(LDR.neutral, { hand: [ID] }, { characters: [SCN.c3] });
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(5000);
    expect(chars(g, 'p2')).toEqual([SCN.c3]);
  });
});
