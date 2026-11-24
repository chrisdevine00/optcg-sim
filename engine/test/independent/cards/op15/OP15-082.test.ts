/**
 * OP15-082 Charlotte Lola (Character, Black, cost 4, 5000, Counter +1000, {Rolling Pirates}).
 *
 * Card text: "[On Play] Trash 3 cards from the top of your deck.
 * [On K.O.] Add up to 1 of your Character cards with a cost of 8 or less from your trash to your hand."
 *
 * Rules: CR 8-1-2 (mandatory), milling goes top of deck to trash, CR 10-2-17 / RD 110 ([On K.O.] after the
 * card is in the trash), CR 8-4-4-1 ("up to"), M6b-Q17 / M4b-2 (a card read from the trash uses its printed
 * values). Scenery: OP12-005 Shiki (cost 8, vanilla), OP01-070 Dracule Mihawk (cost 9, Character),
 * OP17-056 Rocks Pirates (Event), OP09-077 Gum-Gum Lightning.
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from '../../helpers.ts';
import {
  activateTrigger,
  atMain,
  BLUE,
  choices,
  deck,
  hand,
  inst,
  kind,
  LD15,
  mine,
  need,
  noDefenceUntilTrigger,
  none,
  offeredIds,
  opponentKOs,
  pickInst,
  playRaw,
  reachablePickSets,
  RED,
  SCN,
  side,
  theirTurn,
  trash,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const LOLA = 'OP15-082';
const COST8 = SCN.c8;
const COST9 = SCN.c9;
const EVENT = 'OP17-056';
const LIGHTNING = 'OP09-077';

/** p2 K.O.s p1's rested Lola in battle (5000 vs 6000); p1's trash is `trashCards`. */
function koed(trashCards: string[]): TestGame {
  const g = theirTurn(
    side(LD15.moria, BLUE, { characters: [{ card: LOLA, rested: true }], trash: trashCards }),
    side(LD15.neutral, RED, { characters: [SCN.c4] }),
  );
  attack(g, inst(g, 'p2', 'characters', SCN.c4), inst(g, 'p1', 'characters', LOLA));
  passBlock(g);
  passCounter(g);
  return g;
}

describe('OP15-082 Charlotte Lola: [On Play] trash 3 from the deck; [On K.O.] add up to 1 Character (cost 8 or less) from trash', () => {
  it('[On Play]: the top 3 cards of my deck go to the trash, no question asked', () => {
    const g = mine(LD15.moria, {
      hand: [LOLA],
      deck: [SCN.c2, SCN.c3, SCN.c4, SCN.c5, BLUE, BLUE],
    });
    playRaw(g, LOLA);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([SCN.c2, SCN.c3, SCN.c4].sort());
    expect(deck(g)).toEqual([SCN.c5, BLUE, BLUE]);
    expect(hand(g)).toEqual([]);
  });

  it('exactly 3, not 2 or 4', () => {
    const g = mine(LD15.moria, { hand: [LOLA], deck: [SCN.c2, SCN.c3, SCN.c4, SCN.c5, BLUE] });
    playRaw(g, LOLA);
    expect(trash(g)).toHaveLength(3);
    expect(deck(g)[0]).toBe(SCN.c5);
  });

  it('[On K.O.] in battle: a Character with cost 8 (boundary) can be added from the trash', () => {
    const g = koed([COST8, SCN.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(COST8);
    pickInst(g, [inst(g, 'p1', 'trash', COST8)]);
    expect(hand(g)).toEqual([COST8]);
    expect(trash(g)).toEqual([LOLA, SCN.c2].sort());
    expect(kind(g)).toBe('main');
  });

  it('a Character with cost 9 is not offered (boundary)', () => {
    const g = koed([COST9, SCN.c3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(COST9);
    expect(offeredIds(g)).toContain(SCN.c3);
  });

  it('only Character cards: an Event in the trash is not offered', () => {
    const g = koed([EVENT, SCN.c3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(EVENT);
    expect(offeredIds(g)).toContain(SCN.c3);
  });

  it('Lola herself (cost 4, already in the trash) can be added back', () => {
    const g = koed([COST9]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LOLA]);
    pickInst(g, [inst(g, 'p1', 'trash', LOLA)]);
    expect(hand(g)).toEqual([LOLA]);
  });

  it('"up to 1": adding nothing is legal, and never more than one card', () => {
    const g = koed([SCN.c2, SCN.c3, SCN.c4]);
    need(g, 'choose', 'p1');
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    none(g);
    expect(hand(g)).toEqual([]);
  });

  it('with only too-expensive Characters and Events in the trash, nothing but Lola is a candidate', () => {
    const g = koed([COST9, EVENT]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toHaveLength(1);
    none(g);
    expect(hand(g)).toEqual([]);
  });

  it('K.O.’d by an opposing effect: the same [On K.O.] effect', () => {
    const g = theirTurn(
      side(LD15.moria, BLUE, { characters: [LOLA], trash: [SCN.c3] }),
      side(LD15.neutral, RED, { costArea: { active: 10, rested: 0 }, hand: [LIGHTNING] }),
    );
    opponentKOs(g, inst(g, 'p1', 'characters', LOLA));
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'trash', SCN.c3)]);
    expect(hand(g)).toEqual([SCN.c3]);
  });

  it('K.O.\u2019d on my own turn (by the opponent\u2019s [Trigger] OP15-115 Impact Dial): the effect still fires', () => {
    const g = mine(
      LD15.moria,
      { characters: [LOLA], trash: [SCN.c3] },
      { life: ['OP15-115', BLUE, BLUE, BLUE] },
    );
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefenceUntilTrigger(g);
    need(g, 'trigger', 'p2');
    activateTrigger(g);
    need(g, 'choose', 'p2');
    pickInst(g, [inst(g, 'p1', 'characters', LOLA)]);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'trash', SCN.c3)]);
    expect(hand(g)).toEqual([SCN.c3]);
  });

  it('must not: a Lola that is not K.O.\u2019d adds nothing from the trash', () => {
    const g = mine(LD15.moria, { characters: [LOLA], trash: [SCN.c3] });
    expect(hand(g)).toEqual([]);
    expect(kind(g)).toBe('main');
  });
});
