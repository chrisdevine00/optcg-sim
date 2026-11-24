/**
 * OP15-063 Gedatsu (Character, Purple, cost 1, 2000, Counter +1000, {Sky Island}/{Vassals}).
 *
 * Card text: "[On Play] DON!! -1: Draw 1 card.
 * [On K.O.] If you have 6 or less DON!! cards on your field, K.O. up to 1 of your opponent's Characters
 * with 2000 power or less."
 *
 * Rules: CR 8-3-1-4 + ruling on ST04-016 (DON!! -1 may be declined; then nothing happens), CR 8-3-1-3
 * (unpayable cost), CR 8-3-1-6 (DON!! returns to the DON!! deck), CR 4-5-3 (draw X), CR 10-2-17 / RD 110
 * ([On K.O.]), CR 8-3-3 (condition at resolution), CR 8-4-4-1 ("up to").
 * Scenery: OP13-009 Curly.Dadan (cost 1, 2000, inert alone), OP02-060 Mohji (3000), OP09-077 Lightning.
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from '../../helpers.ts';
import {
  accept,
  answerMay,
  atMain,
  BAT,
  BLUE,
  choices,
  deck,
  donDeckSize,
  donOnField,
  hand,
  inst,
  kind,
  LD15,
  mine,
  need,
  no,
  none,
  offeredIds,
  opponentKOs,
  payDon,
  pickInst,
  playRaw,
  reachablePickSets,
  RED,
  SCN,
  side,
  theirTurn,
  yes,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const GEDATSU = 'OP15-063';
const LIGHTNING = 'OP09-077';
const DRAW = [SCN.c2, SCN.c3, BLUE, BLUE];

function played(donActive: number): TestGame {
  return mine(LD15.purple, {
    hand: [GEDATSU],
    deck: DRAW,
    costArea: { active: donActive, rested: 0 },
  });
}

/** p2 K.O.s p1's rested Gedatsu in battle; p1 has `donActive` DON!!; p2 has the listed Characters. */
function koed(donActive: number, p2chars: string[]): TestGame {
  const g = theirTurn(
    side(LD15.purple, BLUE, {
      characters: [{ card: GEDATSU, rested: true }],
      costArea: { active: donActive, rested: 0 },
    }),
    side(LD15.neutral, RED, { characters: [SCN.c3, ...p2chars] }),
  );
  attack(g, inst(g, 'p2', 'characters', SCN.c3), inst(g, 'p1', 'characters', GEDATSU));
  passBlock(g);
  passCounter(g);
  return g;
}

describe('OP15-063 Gedatsu: [On Play] DON!! -1: draw 1; [On K.O.] with 6 or less DON!!, K.O. an opposing Character with 2000 power or less', () => {
  it('[On Play]: pay DON!! -1 and draw 1 card', () => {
    const g = played(3);
    const donBefore = donOnField(g);
    const deckBefore = donDeckSize(g);
    playRaw(g, GEDATSU);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payDon(g, 1);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCN.c2]);
    expect(deck(g)).toHaveLength(3);
    // the card cost 1 (rested), then 1 DON!! went back to the DON!! deck
    expect(donOnField(g)).toBe(donBefore - 1);
    expect(donDeckSize(g)).toBe(deckBefore + 1);
  });

  it('declining the DON!! -1: nothing is returned and nothing is drawn', () => {
    const g = played(3);
    playRaw(g, GEDATSU);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(4);
    expect(donOnField(g)).toBe(3);
  });

  it('CR 8-3-1-3: with 1 active DON!! the card is played with it and the DON!! -1 has nothing left to return', () => {
    const g = played(1);
    playRaw(g, GEDATSU);
    // the only DON!! on the field was rested to pay the cost; DON!! -1 can still take a rested one
    const asked = kind(g) === 'optional';
    if (asked) {
      const canUse = answerMay(g, true);
      if (canUse) payDon(g, 1, 'costRested');
    }
    expect(atMain(g)).toBe(true);
    expect(hand(g).length).toBeLessThanOrEqual(1);
  });

  it('draws exactly 1 card, not 2', () => {
    const g = played(4);
    playRaw(g, GEDATSU);
    accept(g);
    payDon(g, 1);
    expect(hand(g)).toHaveLength(1);
    expect(deck(g)).toHaveLength(3);
  });

  it('[On K.O.] with 6 DON!! on my field (boundary): K.O.s an opposing Character with exactly 2000 power', () => {
    const g = koed(6, [BAT.dadan2000, SCN.c1]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BAT.dadan2000]);
    pickInst(g, [inst(g, 'p2', 'characters', BAT.dadan2000)]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([BAT.dadan2000]);
    expect(
      g
        .zone('p2', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([SCN.c1, SCN.c3].sort());
  });

  it('[On K.O.] with 7 DON!! on my field: no K.O.', () => {
    const g = koed(7, [BAT.dadan2000]);
    expect(kind(g)).toBe('main');
    expect(
      g
        .zone('p2', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([BAT.dadan2000, SCN.c3].sort());
    expect(g.zone('p2', 'trash')).toHaveLength(0);
  });

  it('3000 power is too much: only Characters with 2000 power or less are candidates', () => {
    const g = koed(3, [SCN.c1, SCN.c4]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(g.zone('p2', 'trash')).toHaveLength(0);
  });

  it('"up to 1": may K.O. nobody, and never more than one', () => {
    const g = koed(3, [BAT.dadan2000, BAT.dadan2000]);
    need(g, 'choose', 'p1');
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('[On K.O.] also fires when an opposing effect K.O.s it', () => {
    const g = theirTurn(
      side(LD15.purple, BLUE, { characters: [GEDATSU], costArea: { active: 3, rested: 0 } }),
      side(LD15.neutral, RED, {
        costArea: { active: 10, rested: 0 },
        hand: [LIGHTNING],
        characters: [BAT.dadan2000],
      }),
    );
    opponentKOs(g, inst(g, 'p1', 'characters', GEDATSU));
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p2', 'characters', BAT.dadan2000)]);
    expect(
      g
        .zone('p2', 'trash')
        .map((c) => c.card)
        .sort(),
    ).toEqual([BAT.dadan2000, LIGHTNING].sort());
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it('must not: my own Characters are never candidates for the K.O.', () => {
    const g = theirTurn(
      side(LD15.purple, BLUE, {
        characters: [{ card: GEDATSU, rested: true }, BAT.dadan2000],
        costArea: { active: 3, rested: 0 },
      }),
      side(LD15.neutral, RED, { characters: [SCN.c3, BAT.dadan2000] }),
    );
    attack(g, inst(g, 'p2', 'characters', SCN.c3), inst(g, 'p1', 'characters', GEDATSU));
    passBlock(g);
    passCounter(g);
    need(g, 'choose', 'p1');
    expect(choices(g).every((c) => g.card(c).owner === 'p2')).toBe(true);
  });
});
