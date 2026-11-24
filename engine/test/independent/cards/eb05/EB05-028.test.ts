/**
 * EB05-028 Boa Hancock (Character, Blue, cost 4, 5000, Counter +1000, {Kuja Pirates}/{The Seven Warlords
 * of the Sea}/{Impel Down}, Special).
 *
 * Card text: "[On Play] If your opponent has 9 or more cards in their hand, they trash 4 cards from
 * their hand."
 *
 * Rules: CR 8-3-3 (text after a failed "if" does not resolve), CR 10-2-14 (Trash: the owner of the
 * hand chooses), CR 8-4-4-3 (an instruction without a stated chooser is made by the player it
 * applies to).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  BLUE,
  chars,
  choose,
  count,
  decider,
  EL,
  kind,
  mine,
  playCard,
  reachablePickSets,
  RED,
  settleYes,
  trash,
  VAN,
} from './kit-eb05a.ts';

const HANCOCK = 'EB05-028';
/** Nine different cards so that a choice can be told apart. */
const NINE = [
  VAN.sunny,
  VAN.komachiyo,
  VAN.sai,
  VAN.marco,
  VAN.hajrudin,
  VAN.kingdew,
  VAN.thatch,
  VAN.littleOars,
  VAN.shiki8,
];

function played(p2Hand: string[], p1Extra: string[] = []) {
  const g = mine(EL.croc, { hand: [HANCOCK, ...p1Extra], deck: fill(BLUE, 10) }, { hand: p2Hand });
  playCard(g, HANCOCK);
  return g;
}

describe('EB05-028 Boa Hancock: [On Play] if the opponent has 9 or more cards in hand, they trash 4', () => {
  it('9 cards (boundary): the opponent trashes 4 of their choice and keeps 5', () => {
    const g = played(NINE);
    expect(kind(g)).toBe('choose');
    expect(decider(g)).toBe('p2');
    const ids = g.zone('p2', 'hand').map((c) => c.instance);
    choose(g, ids.slice(0, 4));
    settleYes(g, 'p2');
    expect(count(g, 'p2', 'hand')).toBe(5);
    expect(count(g, 'p2', 'trash')).toBe(4);
    expect(
      g
        .zone('p2', 'trash')
        .map((c) => c.instance)
        .sort(),
    ).toEqual(ids.slice(0, 4).sort());
  });

  it('the opponent chooses which cards (not the Hancock player): any 4 are reachable', () => {
    const g = played(NINE);
    const sets = [...reachablePickSets(g)].filter(Boolean);
    expect(sets.length).toBeGreaterThan(1);
    for (const s of sets) expect(s.split('+')).toHaveLength(4);
  });

  it('CR 8-3-3: with 8 cards (one short) nothing happens', () => {
    const g = played(NINE.slice(0, 8));
    settleYes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(count(g, 'p2', 'hand')).toBe(8);
    expect(count(g, 'p2', 'trash')).toBe(0);
  });

  it('with 12 cards they trash exactly 4 and keep 8', () => {
    const g = played([...NINE, RED, RED, RED]);
    const ids = g.zone('p2', 'hand').map((c) => c.instance);
    choose(g, ids.slice(0, 4));
    settleYes(g, 'p2');
    expect(count(g, 'p2', 'hand')).toBe(8);
    expect(count(g, 'p2', 'trash')).toBe(4);
  });

  it('only the opponent’s hand counts: my own big hand does not trigger it', () => {
    const g = played(NINE.slice(0, 3), NINE);
    settleYes(g, 'p1');
    expect(count(g, 'p2', 'hand')).toBe(3);
    expect(count(g, 'p1', 'hand')).toBe(9);
  });

  it('my hand is untouched when the effect resolves', () => {
    const g = played(NINE, [VAN.sunny]);
    const ids = g.zone('p2', 'hand').map((c) => c.instance);
    choose(g, ids.slice(0, 4));
    settleYes(g, 'p2');
    expect(count(g, 'p1', 'hand')).toBe(1);
    expect(trash(g)).toEqual([]);
  });

  it('Hancock stays on the field', () => {
    const g = played(NINE.slice(0, 5));
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([HANCOCK]);
  });

  it('the trashed cards are trashed, not K.O.’d or returned: the opponent’s deck is unchanged', () => {
    const g = played(NINE);
    const ids = g.zone('p2', 'hand').map((c) => c.instance);
    choose(g, ids.slice(0, 4));
    settleYes(g, 'p2');
    expect(count(g, 'p2', 'deck')).toBe(15);
  });
});
