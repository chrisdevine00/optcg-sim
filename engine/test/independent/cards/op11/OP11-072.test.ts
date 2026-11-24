/**
 * OP11-072 Charlotte Mont-d'or (Character, Purple, cost 3, 4000, Counter +2000, {Big Mom Pirates}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] DON!! −1, You may rest this Character: Your opponent
 * places 2 cards from their trash at the bottom of their deck in any order. Then, add 1 card from
 * the top of your Life cards to your hand."
 *
 * Rules: CR 8-3-1 (costs; "DON!! −N" returns N DON!! from the field to the DON!! deck, RL-23 counts
 * given DON!!), CR 10-2 ([Once Per Turn]), CR 1-3-2 (do as much as possible). The opponent chooses
 * which of their own trash cards go (E-Q5 style: the owner of the cards, here "your opponent places").
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  cnt,
  deckBottom,
  deckSize,
  donField,
  hand,
  kind,
  LD11,
  lifeCards,
  many,
  me,
  need,
  offeredAbilities,
  orderFirst,
  pickInst,
  SC11,
  trash,
  useAbility,
  zoneIds,
} from './kit-op11c.ts';
import { queries } from '@optcg/engine';

const ID = 'OP11-072';
const DECK_ID = SC11.r4;

function base(o: { trash2?: string[]; life?: string[]; active?: number; rested?: boolean } = {}) {
  return me(
    LD11.plain,
    {
      characters: [{ card: ID, rested: o.rested ?? false }],
      life: o.life ?? [SC11.r1, SC11.r2, SC11.r3, SC11.r5],
      costArea: { active: o.active ?? 10, rested: 0 },
    },
    { trash: o.trash2 ?? [SC11.r1, SC11.r2, SC11.r3], deck: many(DECK_ID, 5) },
  );
}

describe('OP11-072 Charlotte Mont-d’or: opponent bottoms 2 trash cards, then I take a Life card', () => {
  it('printed effect: opponent bottoms 2 chosen trash cards, my top Life card goes to my hand', () => {
    const g = base();
    useAbility(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p2');
    const t = zoneIds(g, 'p2', 'trash');
    pickInst(g, [t[0]!, t[1]!]);
    if (kind(g) === 'order') orderFirst(g, 'p2');
    expect(cnt(g, 'p2', 'trash')).toBe(1);
    expect(deckSize(g, 'p2')).toBe(7);
    expect(deckBottom(g, 'p2', 2).sort()).toEqual([SC11.r1, SC11.r2].sort());
    expect(hand(g)).toContain(SC11.r1);
    expect(lifeCards(g)).toEqual([SC11.r2, SC11.r3, SC11.r5]);
    expect(kind(g)).toBe('main');
  });

  it('the opponent (not me) chooses which 2 of 3 trash cards are placed', () => {
    const g = base({ trash2: [SC11.r1, SC11.r2, SC11.r3] });
    useAbility(g, at(g, 'p1', 'characters', ID));
    const d = need(g, 'choose', 'p2');
    expect(d.min).toBe(2);
    expect(d.max).toBe(2);
    const t = zoneIds(g, 'p2', 'trash');
    // They pick the 2nd and 3rd; the 1st (top) stays in the trash.
    pickInst(g, [t[1]!, t[2]!]);
    if (kind(g) === 'order') orderFirst(g, 'p2');
    expect(trash(g, 'p2')).toEqual([SC11.r1]);
  });

  it('cost: DON!! −1 returns one DON!! to the DON!! deck and the Character is rested', () => {
    const g = base();
    const before = queries.don(g.state, 'p1');
    useAbility(g, at(g, 'p1', 'characters', ID));
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
    expect(donField(g)).toBe(9);
    expect(queries.don(g.state, 'p1').deck).toBe(before.deck + 1);
  });

  it('exactly 1 card in the opponent’s trash: that one is placed, and the Life card is still added', () => {
    const g = base({ trash2: [SC11.r2] });
    useAbility(g, at(g, 'p1', 'characters', ID));
    // Either nothing is asked (forced) or a 1-card pick is; no `order` is needed for one card.
    if (kind(g) === 'choose') pickInst(g, zoneIds(g, 'p2', 'trash'));
    expect(cnt(g, 'p2', 'trash')).toBe(0);
    expect(deckBottom(g, 'p2', 1)).toEqual([SC11.r2]);
    expect(hand(g)).toContain(SC11.r1);
    expect(lifeCards(g)).toHaveLength(3);
  });

  it('empty opponent trash: nothing is placed, no prompt for the opponent, my Life card is still added', () => {
    const g = base({ trash2: [] });
    useAbility(g, at(g, 'p1', 'characters', ID));
    expect(kind(g)).toBe('main');
    expect(deckSize(g, 'p2')).toBe(5);
    expect(hand(g)).toContain(SC11.r1);
    expect(lifeCards(g)).toHaveLength(3);
  });

  it('only the top Life card is added, and it comes from my own Life', () => {
    const g = base({ life: [SC11.r7, SC11.r2, SC11.r3, SC11.r5] });
    useAbility(g, at(g, 'p1', 'characters', ID));
    const t = zoneIds(g, 'p2', 'trash');
    pickInst(g, [t[0]!, t[1]!]);
    if (kind(g) === 'order') orderFirst(g, 'p2');
    expect(hand(g).filter((c) => c === SC11.r7)).toHaveLength(1);
    expect(lifeCards(g)).toEqual([SC11.r2, SC11.r3, SC11.r5]);
    expect(lifeCards(g, 'p2')).toHaveLength(4);
  });

  it('with no Life cards nothing is added and nothing breaks', () => {
    const g = base({ life: [] });
    useAbility(g, at(g, 'p1', 'characters', ID));
    const t = zoneIds(g, 'p2', 'trash');
    pickInst(g, [t[0]!, t[1]!]);
    if (kind(g) === 'order') orderFirst(g, 'p2');
    expect(cnt(g, 'p1', 'life')).toBe(0);
    expect(deckBottom(g, 'p2', 2)).toHaveLength(2);
    expect(kind(g)).toBe('main');
  });

  it('cannot be activated while rested (the rest is part of the cost)', () => {
    const g = base({ rested: true });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('cannot be activated with no DON!! on my field (DON!! −1 is unpayable)', () => {
    const g = base({ active: 0 });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('a DON!! given to my Leader counts as a DON!! on my field: the cost can be paid from it', () => {
    const g = me(
      { card: LD11.plain, don: 1 },
      { characters: [ID], life: [SC11.r1, SC11.r2, SC11.r3], costArea: { active: 0, rested: 0 } },
      { trash: [SC11.r1, SC11.r2], deck: many(DECK_ID, 5) },
    );
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual(['activate']);
    useAbility(g, at(g, 'p1', 'characters', ID));
    // A single DON!! class may be paid on its own; otherwise it is asked once.
    if (kind(g) === 'choose' && g.decider === 'p1') {
      const pick = g.legal().find((a) => a.type === 'pick');
      if (pick) g.act(pick);
    }
    expect(donField(g)).toBe(0);
  });

  it('two copies each have their own [Once Per Turn]: using one leaves the other usable', () => {
    const g = me(
      LD11.plain,
      { characters: [ID, ID], life: [SC11.r1, SC11.r2, SC11.r3, SC11.r5] },
      { trash: [SC11.r1, SC11.r2, SC11.r3, SC11.r5], deck: many(DECK_ID, 5) },
    );
    const first = at(g, 'p1', 'characters', ID, 0);
    const second = at(g, 'p1', 'characters', ID, 1);
    useAbility(g, first);
    const t = zoneIds(g, 'p2', 'trash');
    pickInst(g, [t[0]!, t[1]!]);
    if (kind(g) === 'order') orderFirst(g, 'p2');
    expect(offeredAbilities(g, first)).toEqual([]);
    expect(offeredAbilities(g, second)).toEqual(['activate']);
  });
});
