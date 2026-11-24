/**
 * OP13-062 Crocus (Character, Purple, cost 5, 6000, Counter +1000, {Roger Pirates}).
 *
 * Card text: "[On Play] If you have any DON!! cards given, add up to 1 DON!! card from your DON!! deck
 * and set it as active. [When Attacking] Return up to 1 of your opponent's Characters with a base
 * power of 3000 or less to the owner's hand."
 *
 * Rules: E-Q11 (the count of "add up to N DON!!"), CR 4-8-1, CR 4-9-2 ("base" is the printed power,
 * buffs do not count), CR 7-1-1 ([When Attacking] fires for this Character's attack only).
 * Scenery: OP01-010 Komachiyo (3000), OP01-012 Sai (4000), OP01-023 Marco (5000).
 */
import { describe, expect, it } from 'vitest';
import {
  addDon,
  asksCount,
  atMain,
  attack,
  canFinish,
  chars,
  countOptions,
  don,
  hand,
  kind,
  LD13,
  me,
  need,
  none,
  offeredIds,
  passBlock,
  pickInst,
  playRaw,
  S13,
  ch,
  type Placed,
} from './kit-op13c.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import { act } from '../../helpers.ts';

const ID = 'OP13-062';

function play(o: { given?: number; active?: number; mineChars?: Placed } = {}): TestGame {
  return me(
    { card: LD13.plain, don: o.given ?? 1 },
    { hand: [ID], characters: o.mineChars ?? [], costArea: { active: o.active ?? 5, rested: 0 } },
  );
}

/** Crocus on the field (not played this turn), p2 has Komachiyo (3000), Sai (4000), Marco (5000). */
function attacking(theirs: Placed = [S13.c1, S13.c2, S13.c3]): TestGame {
  const g = me(LD13.plain, { characters: [ID] }, { characters: theirs });
  attack(g, ch(g, 'p1', ID), g.leader('p2'));
  return g;
}

describe('OP13-062 Crocus: [On Play] if any DON!! given, add up to 1 DON!! as active', () => {
  it('with DON!! given: asks the count and adds 1 ACTIVE DON!! from the DON!! deck', () => {
    const g = play();
    const before = don(g);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(countOptions(g)).toEqual(['1', '0']);
    addDon(g, 1);
    expect(atMain(g)).toBe(true);
    // Cost 5 rested 5 of the 5 active DON!!; the added DON!! is active.
    expect(don(g)).toMatchObject({
      active: before.active - 5 + 1,
      rested: before.rested + 5,
      deck: before.deck - 1,
    });
  });

  it('with no DON!! given: nothing is added and no count is asked', () => {
    const g = play({ given: 0 });
    const before = don(g);
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
    expect(don(g).deck).toBe(before.deck);
  });

  it('DON!! given to one of my Characters satisfies the condition', () => {
    const g = play({ given: 0, mineChars: [{ card: S13.c3, don: 1 }] });
    playRaw(g, ID);
    expect(asksCount(g)).toBe(true);
  });

  it('"up to 1": choosing 0 adds nothing', () => {
    const g = play();
    const before = don(g);
    playRaw(g, ID);
    addDon(g, 0);
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ deck: before.deck, active: before.active - 5 });
  });

  it('with an empty DON!! deck the count is not asked', () => {
    const g = play({ active: 9 });
    expect(don(g).deck).toBe(0);
    playRaw(g, ID);
    expect(asksCount(g)).toBe(false);
    expect(atMain(g)).toBe(true);
  });
});

describe('OP13-062 Crocus: [When Attacking] return up to 1 opposing Character with base power 3000 or less', () => {
  it('offers only base power 3000 or less (Komachiyo), not 4000 or 5000; the Character goes to its owner’s hand', () => {
    const g = attacking();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.c1]);
    pickInst(g, [ch(g, 'p2', S13.c1)]);
    expect(chars(g, 'p2')).toEqual([S13.c2, S13.c3].sort());
    expect(hand(g, 'p2')).toEqual([S13.c1]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('"base" power: a 3000-base Character with DON!! given is still offered; a 4000-base one with none is not', () => {
    const g = attacking([{ card: S13.c1, don: 2 }, S13.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.c1]);
  });

  it('"up to 1": may return nothing and the attack goes on to the Block Step', () => {
    const g = attacking();
    none(g);
    expect(chars(g, 'p2')).toEqual([S13.c1, S13.c2, S13.c3].sort());
    expect(kind(g)).toBe('block');
  });

  it('with no Character of base power 3000 or less the effect finds nothing and the attack goes on', () => {
    const g = attacking([S13.c2, S13.c3]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      expect(canFinish(g)).toBe(true);
      act(g, { type: 'done' });
    }
    expect(kind(g)).toBe('block');
    expect(chars(g, 'p2')).toEqual([S13.c2, S13.c3].sort());
  });

  it('must not: it fires only for this Character’s attack, not when my Leader attacks', () => {
    const g = me(LD13.plain, { characters: [ID] }, { characters: [S13.c1] });
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(kind(g)).toBe('block');
    passBlock(g);
    expect(chars(g, 'p2')).toEqual([S13.c1]);
  });
});
