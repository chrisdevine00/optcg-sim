/**
 * OP18-093 Sleeptids (Black Character, cost 9, 3000, Counter +2000, {Elbaph}, [Blocker]).
 *
 * Card text: "Under the rules of this game, you may have any number of this card in your deck.
 *             [Blocker]"
 *
 * Rules: CR 5-1-2-3 (at most 4 copies), CR 5-1-2-4 (a deck-construction effect replaces the rule),
 * CR 5-1-2 (50 cards), CR 10-1-4 [Blocker]. Deck building is tested through `deckIssues`.
 */
import { describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import { deckIssues } from '@optcg/engine';
import { cards } from '../../../fixtures/index.ts';
import { at, attack, blockers, cardIds, need, passCounter, LDR, CH, act, RED } from './kit-e.ts';
import { theirsE, X } from './kit-e.ts';

const SLEEP = X.sleeptids;
const all = cards();
const times = (n: number, id: string) => Array.from({ length: n }, () => id);
/** OP17-079 Monkey.D.Luffy: Black Leader, Standard-legal. */
const BLACK_LEADER = 'OP17-079';
/** Other Black Characters of OP-17 (different card numbers), for the rest of a deck. */
const OTHERS = [
  'OP17-080',
  'OP17-081',
  'OP17-082',
  'OP17-083',
  'OP17-084',
  'OP17-085',
  'OP17-086',
  'OP17-087',
];
const codes = (
  main: string[],
  leader = BLACK_LEADER,
  f: 'standard' | 'extra' | 'free' = 'standard',
) =>
  deckIssues({ leader, main }, all, f)
    .filter((i) => i.severity === 'error')
    .map((i) => i.code);
const copiesIssue = (main: string[]) =>
  deckIssues({ leader: BLACK_LEADER, main }, all, 'standard').find((i) => i.code === 'copies');

describe('OP18-093 Sleeptids: any number of copies in a deck', () => {
  it('is as printed: Black Character, cost 9, 3000, Counter +2000, [Blocker]', () => {
    const c = all(SLEEP) as Card;
    expect(c.category).toBe('Character');
    expect(c.colors).toEqual(['Black']);
    expect([c.cost, c.power, c.counter]).toEqual([9, 3000, 2000]);
    expect(c.keywords).toContain('Blocker');
  });

  it('50 copies under a Black Leader is a legal Standard deck', () => {
    expect(deckIssues({ leader: BLACK_LEADER, main: times(50, SLEEP) }, all, 'standard')).toEqual(
      [],
    );
  });

  it('boundary: 5 copies (one more than the normal 4) is no "copies" issue; 4 and 49 are not either', () => {
    const rest = OTHERS.flatMap((c) => times(4, c));
    expect(copiesIssue([...times(5, SLEEP), ...rest].slice(0, 50))).toBeUndefined();
    expect(copiesIssue([...times(4, SLEEP), ...rest].slice(0, 50))).toBeUndefined();
    expect(copiesIssue([...times(49, SLEEP), OTHERS[0]!])).toBeUndefined();
  });

  it('must not happen: the exemption is for this card number only (5 copies of another card still flag it)', () => {
    const issue = copiesIssue([...times(5, OTHERS[0]!), ...times(45, SLEEP)]);
    expect(issue).toMatchObject({ rule: 'CR 5-1-2-3', cards: [OTHERS[0]] });
  });

  it('the 50-card size rule still applies (51 copies is a size issue only)', () => {
    expect(codes(times(51, SLEEP))).toEqual(['size']);
  });

  it('the colour rule still applies: under a Red Leader it is a colour issue', () => {
    expect(codes(times(50, SLEEP), 'ST01-001', 'free')).toContain('color');
  });
});

describe('OP18-093 Sleeptids: [Blocker]', () => {
  it('can be rested to become the new target of an attack on the Leader, and takes the hit', () => {
    const g = theirsE(LDR.luffy, { characters: [SLEEP] }, { characters: [CH.kingdew5] });
    attack(g, at(g, 'p2', 'characters', CH.kingdew5), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', SLEEP)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', SLEEP) });
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(cardIds(g, 'p1', 'trash')).toEqual([SLEEP]);
  });

  it('a rested Sleeptids cannot block', () => {
    const g = theirsE(
      LDR.luffy,
      { characters: [{ card: SLEEP, rested: true }] },
      { characters: [CH.kingdew5] },
    );
    attack(g, at(g, 'p2', 'characters', CH.kingdew5), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  void RED;
});
