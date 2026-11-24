/**
 * EB05-022 Octopako (Character, Blue, cost 1, 2000, Counter +1000, {Fish-Man}/{Fish-Man Island}, Wisdom).
 *
 * Card text: "[On K.O.] Draw 2 cards."
 *
 * Rules: CR 10-2-17 ([On K.O.]), RD 109 (trash is not a K.O.), RD 78 (the Character-limit trash is
 * not a K.O.), RD 110 (only for the card that was K.O.'d itself), CR 4-5-3 (draw X).
 */
import { describe, expect, it } from 'vitest';
import { attack, fill, noDefence } from '../../helpers.ts';
import {
  BLUE,
  chars,
  choices,
  choose,
  count,
  deck,
  EL,
  hand,
  kind,
  mine,
  playCard,
  settleYes,
  theirs,
  trash,
  VAN,
} from './kit-eb05a.ts';

const OCTOPAKO = 'EB05-022';
/** OP14-005 Killer: Red, cost 1, 1000. Loses to Octopako (2000). */
const KILLER = 'OP14-005';

function koed(attacker: string = VAN.sai, inHandCards: string[] = []) {
  const g = theirs(
    EL.croc,
    { characters: [{ card: OCTOPAKO, rested: true }], deck: fill(BLUE, 10), hand: inHandCards },
    { characters: [attacker] },
  );
  attack(g, g.find('p2', 'characters', attacker), g.find('p1', 'characters', OCTOPAKO));
  noDefence(g);
  settleYes(g, 'p1');
  return g;
}

describe('EB05-022 Octopako: [On K.O.] draw 2 cards', () => {
  it('K.O.’d in battle: its owner draws 2 cards', () => {
    const g = koed();
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([OCTOPAKO]);
    expect(hand(g)).toEqual([BLUE, BLUE]);
    expect(deck(g)).toHaveLength(8);
  });

  it('exactly 2 cards are drawn, not 1 or 3', () => {
    const g = koed(VAN.sai, [VAN.marco]);
    expect(count(g, 'p1', 'hand')).toBe(3);
  });

  it('the opponent draws nothing', () => {
    const g = koed();
    expect(count(g, 'p2', 'hand')).toBe(0);
    expect(deck(g, 'p2')).toHaveLength(15);
  });

  it('when Octopako wins or survives the battle nothing is drawn', () => {
    const g = theirs(
      EL.croc,
      { characters: [{ card: OCTOPAKO, rested: true }], deck: fill(BLUE, 10) },
      { characters: [KILLER] },
    );
    attack(g, g.find('p2', 'characters', KILLER), g.find('p1', 'characters', OCTOPAKO));
    noDefence(g);
    expect(chars(g)).toEqual([OCTOPAKO]);
    expect(hand(g)).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('boundary: an attacker with exactly 2000 power (equal) K.O.s Octopako and she draws', () => {
    const g = koed('OP14-003');
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([BLUE, BLUE]);
  });

  it('RD 78: trashed by the 5-Character limit when I play a 6th Character, it is not a K.O. and draws nothing', () => {
    const g = mine(EL.croc, {
      hand: [VAN.sunny],
      characters: [OCTOPAKO, VAN.sai, VAN.marco, VAN.komachiyo, VAN.hajrudin],
      deck: fill(BLUE, 10),
    });
    playCard(g, VAN.sunny);
    if (kind(g) === 'choose') {
      choose(g, [g.find('p1', 'characters', OCTOPAKO)]);
      settleYes(g, 'p1');
    }
    expect(trash(g)).toEqual([OCTOPAKO]);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(10);
    expect(choices(g)).toEqual([]);
  });

  it('a fresh Octopako on the field has no effect on play (no draw when played)', () => {
    const g = mine(EL.croc, { hand: [OCTOPAKO], deck: fill(BLUE, 10) });
    playCard(g, OCTOPAKO);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(10);
  });
});
