/**
 * OP17-102 Charlotte Oven (Character, Yellow, cost 4, 4000, Counter +1000, {Big Mom Pirates}).
 *
 * Card text: "[On K.O.] Play up to 1 Character card with 4000 power or less other than [Charlotte Oven]
 * from your trash. [Trigger] Play this card."
 *
 * Rules: CR 10-2-17 ([On K.O.] triggers when this card is K.O.'d, battle included), CR 8-4-4-1 ("up to"
 * allows 0), CR 2-1-2 (name match is exact), CR 10-1-5 ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import { attack, fill, noDefence } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  chars,
  chooseCards,
  chooseNone,
  choiceCards,
  declineTrigger,
  hand,
  hitLeader,
  kind,
  RED,
  SC,
  settleYes,
  theirs,
  trash,
  VAN,
  YL,
} from './kit-a.ts';

const EVENT = 'OP07-077';

/** p2's Marco (5000) attacks p1's rested Oven (4000) and wins the battle. */
function koed(trashCards: string[]) {
  const g = theirs(
    YL.bmp,
    { characters: [{ card: 'OP17-102', rested: true }], trash: trashCards },
    { characters: [VAN.marco] },
  );
  attack(g, g.find('p2', 'characters', VAN.marco), g.find('p1', 'characters', 'OP17-102'));
  noDefence(g);
  return g;
}

describe('OP17-102 Charlotte Oven: [On K.O.] play a Character of 4000 power or less from the trash', () => {
  it('candidates: Characters with 4000 power or less, not [Charlotte Oven], not Events', () => {
    const g = koed([SC.bobbin, VAN.marco, BLUE, 'OP17-102', EVENT, SC.opera]);
    expect(kind(g)).toBe('choose');
    // Oven herself is in the trash now too, and the other copy is also excluded by name.
    expect(choiceCards(g).sort()).toEqual([BLUE, SC.bobbin].sort());
  });

  it('plays the chosen card from the trash onto the field', () => {
    const g = koed([SC.bobbin, BLUE]);
    chooseCards(g, [SC.bobbin]);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([SC.bobbin]);
    expect(trash(g)).toEqual([BLUE, 'OP17-102'].sort());
  });

  it('exactly 4000 power qualifies, 5000 does not', () => {
    const g = koed([SC.bobbin, VAN.marco]);
    expect(choiceCards(g)).toEqual([SC.bobbin]);
  });

  it('CR 8-4-4-1: may play nothing', () => {
    const g = koed([SC.bobbin]);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([SC.bobbin, 'OP17-102'].sort());
  });

  it('plays at most one card', () => {
    const g = koed([SC.bobbin, BLUE, SC.anana]);
    chooseCards(g, [BLUE]);
    settleYes(g, 'p1');
    expect(chars(g)).toHaveLength(1);
  });

  it('nothing to play when the trash holds only Oven and a 5000-power Character', () => {
    const g = koed([VAN.marco]);
    if (kind(g) === 'choose') {
      expect(choiceCards(g)).toEqual([]);
      chooseNone(g);
    }
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([]);
  });

  it('does not activate when Oven is not K.O.’d (attacker has lower power than Oven)', () => {
    const g = theirs(
      YL.bmp,
      { characters: [{ card: 'OP17-102', rested: true }], trash: [SC.bobbin] },
      { characters: [VAN.sunny] },
    );
    attack(g, g.find('p2', 'characters', VAN.sunny), g.find('p1', 'characters', 'OP17-102'));
    noDefence(g);
    expect(chars(g)).toEqual(['OP17-102']);
    expect(trash(g)).toEqual([SC.bobbin]);
  });
});

describe('OP17-102 Charlotte Oven: [Trigger] play this card', () => {
  function hit() {
    const g = theirs(YL.bmp, { life: ['OP17-102', ...fill(RED, 3)] });
    hitLeader(g);
    return g;
  }

  it('activating plays Oven from Life', () => {
    const g = hit();
    activateTrigger(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual(['OP17-102']);
    expect(trash(g)).toEqual([]);
  });

  it('declining adds her to hand', () => {
    const g = hit();
    declineTrigger(g);
    expect(hand(g)).toEqual(['OP17-102']);
  });
});
