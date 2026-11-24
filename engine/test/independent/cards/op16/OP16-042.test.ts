/**
 * OP16-042 Prisoner of Impel Down (Character, Blue, cost 6, 6000, Counter +2000, {Impel Down}).
 *
 * Card text: "Under the rules of this game, you may have any number of this card in your deck."
 *
 * Rules: CR 5-1-2-3 (at most 4 of a card number), CR 5-1-2-4 (deck-construction effects replace the
 * rules and apply during deck construction), CR 5-1-2-2 (colour), CR 5-1-2 (50 cards), CR 2-8-2.
 * Tested through `deckIssues` (engine/src/deck.ts).
 */
import { describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import { deckIssues } from '@optcg/engine';
import { cards } from '../../../fixtures/index.ts';
import { LDR, mine, SCN, inst, put, backAtMain, don } from './kit-op16b.ts';

const PRISONER = 'OP16-042';
const all = cards();
const times = (n: number, id: string) => Array.from({ length: n }, () => id);
/** OP16-041 Buggy: Blue Leader, Standard-legal. */
const BLUE_LEADER = 'OP16-041';
/** Other Blue Characters of OP-16 (each a different card number), for the rest of a deck. */
const OTHERS = ['OP16-043', 'OP16-044', 'OP16-045', 'OP16-047', 'OP16-048', 'OP16-049', 'OP16-050'];
const codes = (
  main: string[],
  leader = BLUE_LEADER,
  f: 'standard' | 'extra' | 'free' = 'standard',
) =>
  deckIssues({ leader, main }, all, f)
    .filter((i) => i.severity === 'error')
    .map((i) => i.code);
const copiesOf = (main: string[], leader = BLUE_LEADER) =>
  deckIssues({ leader, main }, all, 'standard').find((i) => i.code === 'copies');

describe('OP16-042 Prisoner of Impel Down: any number of copies in a deck (deck building)', () => {
  it('the card is as printed: a Blue Character of cost 6 whose only text is the deck-building clause', () => {
    const c = all(PRISONER) as Card;
    expect(c.category).toBe('Character');
    expect(c.colors).toEqual(['Blue']);
    expect(c.cost).toBe(6);
    expect(c.power).toBe(6000);
    expect(c.types).toEqual(['Impel Down']);
  });

  it('50 copies in a Blue Leader’s deck is a legal Standard deck', () => {
    expect(deckIssues({ leader: BLUE_LEADER, main: times(50, PRISONER) }, all, 'standard')).toEqual(
      [],
    );
  });

  it('boundary: 5 copies (one more than the normal limit of 4) is no "copies" issue; 4 and 49 are not either', () => {
    const rest = OTHERS.flatMap((c) => times(4, c));
    expect(copiesOf([...times(5, PRISONER), ...rest].slice(0, 50))).toBeUndefined();
    expect(copiesOf([...times(4, PRISONER), ...rest].slice(0, 50))).toBeUndefined();
    expect(copiesOf([...times(49, PRISONER), OTHERS[0]!])).toBeUndefined();
  });

  it('also holds in the Extra and free formats', () => {
    const deck = times(50, PRISONER);
    expect(codes(deck, BLUE_LEADER, 'extra')).toEqual([]);
    expect(codes(deck, BLUE_LEADER, 'free')).toEqual([]);
  });

  it('must-not-happen: the exemption is only for this card number: 5 copies of another card is still a "copies" issue naming it', () => {
    const main = [...times(5, 'OP16-044'), ...times(45, PRISONER)];
    const issue = copiesOf(main);
    expect(issue).toMatchObject({ rule: 'CR 5-1-2-3', cards: ['OP16-044'] });
  });

  it('the exemption does not extend to a second card in the same deck: 20 Prisoners and 5 of OP16-045 flags only OP16-045', () => {
    const main = [
      ...times(20, PRISONER),
      ...times(5, 'OP16-045'),
      ...times(25, 'OP16-043').slice(0, 4),
      ...times(21, PRISONER),
    ];
    const issue = copiesOf(main);
    expect(issue?.cards).toEqual(['OP16-045']);
  });

  it('the 50-card size still applies: 51 copies is a size issue and nothing else', () => {
    expect(codes(times(51, PRISONER))).toEqual(['size']);
    expect(codes(times(49, PRISONER))).toEqual(['size']);
  });

  it('the colour rule still applies: a Blue card under a Red Leader is a colour issue', () => {
    expect(codes(times(50, PRISONER), 'ST01-001', 'free')).toContain('color');
  });

  it('in a game it is an ordinary Character: playable for 6 DON!!, 6000 power, no prompt', () => {
    const g = mine(LDR.impel, { hand: [PRISONER], costArea: { active: 6, rested: 0 } });
    put(g, PRISONER);
    expect(backAtMain(g)).toBe(true);
    expect(g.power(inst(g, 'p1', 'characters', PRISONER))).toBe(6000);
    expect(don(g)).toMatchObject({ active: 0, rested: 6 });
    void SCN;
  });
});
