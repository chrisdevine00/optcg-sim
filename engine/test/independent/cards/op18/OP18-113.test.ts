/**
 * OP18-113 Rob Lucci (Yellow Character, cost 8, 10000, no Counter, {CP9}).
 *
 * Card text: "[On Play]/[On K.O.] Trash up to 1 card from the top of your opponent's Life cards.
 *             [Trigger] If your Leader's type includes "CP", draw 1 card and place up to 1
 *             Character with a cost of 8 or less at the bottom of the owner's deck."
 *
 * The trashed Life card is not damage (no [Trigger], not added to the hand). Scenery: OP12-005
 * Shiki (cost 8, 10000, the K.O. attacker / a cost-8 target), OP01-070 Mihawk (cost 9), OP02-006
 * Kingdew; OP03-076 CP Leader.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  cardIds,
  need,
  offeredIds,
  passBlock,
  pickCards,
  play,
  yes,
  decline,
  kind,
  LDR,
  CH,
} from './kit-e.ts';
import { LE, mineE, theirsE, triggerHit, X } from './kit-e.ts';

const L = 'OP18-113';
const MISS = 'OP02-060';
const C8 = 'OP12-005';
const C9 = 'OP01-070';

function played(p2: object = {}) {
  const g = mineE(
    LDR.luffy,
    { hand: [L], costArea: { active: 8, rested: 0 } },
    { life: ['OP18-094', MISS, MISS, MISS], ...p2 },
  );
  play(g, at(g, 'p1', 'hand', L));
  return g;
}

describe('OP18-113 Rob Lucci: [On Play] trash up to 1 card from the top of the opponent’s Life', () => {
  it('trashes the top Life card of the opponent: Life 4 -> 3; it goes to their trash, not their hand; no [Trigger]', () => {
    const g = played();
    yes(g, 'p1');
    expect(g.life('p2')).toBe(3);
    expect(cardIds(g, 'p2', 'trash')).toEqual(['OP18-094']);
    expect(cardIds(g, 'p2', 'hand')).toEqual([]);
    expect(atMain(g, 'p1')).toBe(true);
  });

  it('"up to 1": it can be declined and then no Life is trashed', () => {
    const g = played();
    decline(g);
    expect(g.life('p2')).toBe(4);
  });

  it('only 1 card, even with a big Life total', () => {
    const g = played({ life: Array.from({ length: 5 }, () => MISS) });
    yes(g, 'p1');
    expect(g.life('p2')).toBe(4);
  });

  it('with 0 Life on the opponent’s side nothing happens', () => {
    const g = played({ life: [] });
    expect(kind(g)).toBe('main'); // nothing to trash, so nothing is asked
    expect(g.life('p2')).toBe(0);
    expect(atMain(g, 'p1')).toBe(true);
  });
});

describe('OP18-113 Rob Lucci: [On K.O.] trash up to 1 card from the top of the opponent’s Life', () => {
  function falls(p2life: string[] = [MISS, MISS, MISS, MISS]) {
    const g = theirsE(
      LDR.luffy,
      { characters: [{ card: L, rested: true }] },
      { characters: [C8], life: p2life },
    );
    attack(g, at(g, 'p2', 'characters', C8), at(g, 'p1', 'characters', L));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  }

  it('when K.O.’d in battle (10000 attacker vs 10000), trashes the top card of the opponent’s Life', () => {
    const g = falls();
    expect(cardIds(g, 'p1', 'trash')).toEqual([L]);
    yes(g, 'p1');
    expect(g.life('p2')).toBe(3);
    expect(cardIds(g, 'p2', 'trash')).toEqual([MISS]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('may be declined', () => {
    const g = falls();
    decline(g);
    expect(g.life('p2')).toBe(4);
  });

  it('does not fire when Lucci survives (a 5000 attacker cannot K.O. 10000)', () => {
    const g = theirsE(
      LDR.luffy,
      { characters: [{ card: L, rested: true }] },
      { characters: [CH.kingdew5] },
    );
    attack(g, at(g, 'p2', 'characters', CH.kingdew5), at(g, 'p1', 'characters', L));
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.life('p2')).toBe(4);
    expect(cardIds(g, 'p1', 'characters')).toEqual([L]);
  });
});

describe('OP18-113 Rob Lucci: [Trigger] if your Leader’s type includes "CP", draw 1 and place up to 1 Character cost <= 8 at the bottom of its owner’s deck', () => {
  it('CP Leader: draws, offers cost <= 8 (8 in, 9 out), moves the pick to the bottom of its owner’s deck', () => {
    const g = triggerHit(
      L,
      LE.cp,
      { deck: [X.cp4, MISS, MISS, MISS, MISS] },
      { characters: [C8, C9] },
    );
    act(g, { type: 'trigger', activate: true });
    expect(cardIds(g, 'p1', 'hand')).toEqual([X.cp4]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C8]);
    pickCards(g, [C8]);
    const d = cardIds(g, 'p2', 'deck');
    expect(d[d.length - 1]).toBe(C8);
  });

  it('non-CP Leader: nothing', () => {
    const g = triggerHit(L, LDR.luffy, { deck: [X.cp4, MISS, MISS] }, { characters: [C8] });
    act(g, { type: 'trigger', activate: true });
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([C8]);
  });
});
