/**
 * OP11-049 Carrot (Blue Character, cost 1, 1000, Counter +1000, {Minks}).
 *
 * Card text: "[On Play] Look at 3 cards from the top of your deck and place them at the top or bottom of
 * the deck in any order. [On Your Opponent's Attack] You may trash this Character: Up to 1 of your
 * Leader gains +1000 power during this battle."
 *
 * Rules: the three looked-at cards go back all on top or all on the bottom, in an order I choose
 * (the pick is a mode "top"/"bottom" and an order decision per card). Trashing Carrot is an optional
 * cost; the boost lasts for the battle.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  C11,
  choices,
  deck,
  fill,
  hand,
  kind,
  L11,
  mine,
  need,
  no,
  none,
  outcomes,
  passBlock,
  passCounter,
  pickInst,
  playCard,
  theirs,
  trash,
  yes,
} from './kit-op11b.ts';

const CARROT = 'OP11-049';
const TOP3 = [C11.c1, C11.c2, C11.c3];
const BELOW = [C11.c4, C11.c5, C11.c6, ...fill(C11.c7, 8)];

function played(deckCards: string[] = [...TOP3, ...BELOW]) {
  const g = mine(L11.mono, { hand: [CARROT], deck: deckCards });
  playCard(g, CARROT);
  return g;
}

/** Answer the mode with `where`, then every order decision with the listed cards in turn. */
function placeAll(
  g: ReturnType<typeof played>,
  where: 'top' | 'bottom',
  order: string[] = [],
): void {
  need(g, 'choose', 'p1');
  act(g, { type: 'pick', choice: { option: where } });
  // The last card of the three is forced, so only the first two are asked.
  for (const card of order.slice(0, -1)) {
    need(g, 'order', 'p1');
    const a = g.legal().find((x) => x.type === 'order' && g.card(x.first).card === card);
    if (!a) throw new Error(`order for ${card} not offered`);
    g.act(a);
  }
  // any remaining forced orders
  while (kind(g) === 'order') g.act(g.legal().find((x) => x.type === 'order')!);
}

describe('OP11-049 Carrot: [On Play] look at 3, place them at the top or bottom in any order', () => {
  it('"top" in a chosen order: the three cards sit on top of the deck in that order', () => {
    const g = played();
    placeAll(g, 'top', [C11.c3, C11.c1, C11.c2]);
    expect(kind(g)).toBe('main');
    expect(deck(g).slice(0, 3)).toEqual([C11.c3, C11.c1, C11.c2]);
    expect(deck(g)[3]).toBe(C11.c4);
    expect(deck(g)).toHaveLength(14);
  });

  it('"bottom": the three go to the bottom and the 4th card becomes the top', () => {
    const g = played();
    placeAll(g, 'bottom', [C11.c2, C11.c3, C11.c1]);
    expect(deck(g)[0]).toBe(C11.c4);
    expect(deck(g).slice(-3)).toEqual([C11.c2, C11.c3, C11.c1]);
    expect(deck(g)).toHaveLength(14);
  });

  it('every order of the three is reachable on top and on the bottom (12 outcomes), and nothing else', () => {
    const g = played();
    const seen = outcomes(g, 'p1', (x) => {
      const d = deck(x);
      return `${d.slice(0, 3).join('|')}#${d.slice(-3).join('|')}#${d.length}`;
    });
    expect(seen.size).toBe(12);
  });

  it('only the top 3 are touched: the cards below keep their order', () => {
    const g = played();
    placeAll(g, 'top');
    expect(deck(g).slice(3)).toEqual(BELOW);
  });

  it('the played Carrot is on the field and nothing is added to the hand', () => {
    const g = played();
    placeAll(g, 'top');
    expect(hand(g)).toEqual([]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([CARROT]);
  });

  it('with only 2 cards left in the deck the look still resolves with those 2', () => {
    const g = played([C11.c1, C11.c2]);
    placeAll(g, 'top', [C11.c2, C11.c1]);
    expect(kind(g)).toBe('main');
    expect(deck(g)).toEqual([C11.c2, C11.c1]);
  });
});

describe("OP11-049 Carrot: [On Your Opponent's Attack] you may trash this: Leader +1000 during this battle", () => {
  function defend(p2attacker = C11.c3) {
    const g = theirs(L11.mono, { characters: [CARROT] }, { characters: [p2attacker] });
    attack(g, at(g, 'p2', 'characters', p2attacker), g.leader('p1'));
    return g;
  }

  it('using it trashes Carrot, the Leader gets +1000 and the 5000 attack no longer connects', () => {
    const g = defend();
    need(g, 'optional', 'p1');
    yes(g);
    if (kind(g) === 'choose') pickInst(g, [g.leader('p1')]);
    expect(trash(g)).toEqual([CARROT]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('declining keeps Carrot and the same attack connects (5000 vs 5000)', () => {
    const g = defend();
    need(g, 'optional', 'p1');
    no(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([CARROT]);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('the boost ends with the battle', () => {
    const g = defend();
    yes(g);
    if (kind(g) === 'choose') pickInst(g, [g.leader('p1')]);
    passBlock(g);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('it is also offered when the attack targets Carrot itself (rested): trashing it ends the attack with no Life lost', () => {
    const g = theirs(
      L11.mono,
      { characters: [{ card: CARROT, rested: true }] },
      { characters: [C11.c3] },
    );
    attack(g, at(g, 'p2', 'characters', C11.c3), at(g, 'p1', 'characters', CARROT));
    need(g, 'optional', 'p1');
    yes(g);
    if (kind(g) === 'choose') pickInst(g, [g.leader('p1')]);
    expect(trash(g)).toEqual([CARROT]);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });
});

void choices;
void none;
