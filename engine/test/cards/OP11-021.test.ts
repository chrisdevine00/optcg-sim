/** OP11-021 Jinbe (Leader). */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { dec, don, expectDecision, none, option, pick, V } from './helpers.ts';
import { canPick, FISH, MERFOLK, mk, drain } from './helpers-op11g1.ts';

const ID = 'OP11-021';
const rest = (card: string) => ({ card, rested: true });
const hand = (n: number) => Array.from({ length: n }, () => V.c1);
const start = (handSize: number, chars: NonNullable<PlayerSpec['characters']>) =>
  mk({
    leader: ID,
    characters: chars,
    hand: hand(handSize),
    costArea: { active: 2, rested: 3 },
  });

describe('OP11-021 Jinbe', () => {
  it('[End of Your Turn]: with 6 cards in hand, sets a {Fish-Man} Character and a DON!! card as active', () => {
    const g = start(6, [rest(FISH.c2), rest(V.c1)]);
    g.act({ type: 'endTurn' });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'characters', FISH.c2))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false); // not {Fish-Man}/{Merfolk}
    pick(g, [g.find('p1', 'characters', FISH.c2)]);
    drain(g);
    expect(g.card(g.find('p1', 'characters', FISH.c2)).rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', V.c1)).rested).toBe(true);
    expect(don(g, 'p1').active).toBe(3);
    expect(don(g, 'p1').rested).toBe(2);
  });

  it('a {Merfolk} Character is eligible too', () => {
    const g = start(0, [rest(MERFOLK.c3)]);
    g.act({ type: 'endTurn' });
    pick(g, [g.find('p1', 'characters', MERFOLK.c3)]);
    expect(g.card(g.find('p1', 'characters', MERFOLK.c3)).rested).toBe(false);
  });

  it('with 7 cards in hand nothing happens (boundary)', () => {
    const g = start(7, [rest(FISH.c2)]);
    g.act({ type: 'endTurn' });
    expect(dec(g)?.kind).toBe('main');
    expect(g.card(g.find('p1', 'characters', FISH.c2)).rested).toBe(true);
    expect(don(g, 'p1').active).toBe(2);
  });

  it('"up to 1": both may be declined', () => {
    const g = start(3, [rest(FISH.c2)]);
    g.act({ type: 'endTurn' });
    none(g); // no Character
    option(g, '0'); // "how many DON!! cards will you set as active (up to 1)?": None
    expect(dec(g)?.kind).toBe('main');
    expect(g.card(g.find('p1', 'characters', FISH.c2)).rested).toBe(true);
    expect(don(g, 'p1').active).toBe(2);
  });

  it('the DON!! step is independent of the Character step (no eligible Character)', () => {
    const g = start(2, [rest(V.c1)]);
    g.act({ type: 'endTurn' });
    drain(g);
    expect(don(g, 'p1').active).toBe(3);
    expect(g.card(g.find('p1', 'characters', V.c1)).rested).toBe(true);
  });
});
