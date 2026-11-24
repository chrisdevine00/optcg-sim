/** OP15-083 Spoil. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, play, trash, V } from './helpers.ts';
import { canActivate, idsOf, mine, OTHER_LEADER, rep } from './helpers-op15g2.ts';

const ID = 'OP15-083';

describe('OP15-083 Spoil', () => {
  it('[On Play] trash 3 cards from the top of your deck', () => {
    const g = mine(OTHER_LEADER, { hand: [ID], deck: [V.c1, V.c2, V.c3, V.c4] });
    play(g, ID);
    expect(trash(g, 'p1').sort()).toEqual([V.c1, V.c2, V.c3].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(1);
  });

  const field = (others: number, active = 2, rested = 3) =>
    mine(OTHER_LEADER, { characters: [ID, V.c2], trash: rep(others, V.c1) }, {}, active, rested);
  const run = (g: ReturnType<typeof field>) =>
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'give' });

  it('[Activate: Main] trash this Character: with 15 cards in the trash (Spoil included) give 1 rested DON!! to a Leader or Character', () => {
    const g = field(14);
    run(g);
    expect(idsOf(g, 'p1', 'trash')).toContain(ID);
    expectDecision(g, 'choose', 'p1');
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks).toHaveLength(2); // the Leader and the other Character
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(g.card(g.find('p1', 'characters', V.c2)).don).toBe(1);
  });

  it('the DON!! given is a rested one (rested cost-area DON!! goes down by 1)', () => {
    const g = field(14);
    run(g);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('with 14 cards in the trash (13 plus Spoil) the cost is paid but nothing is given', () => {
    const g = field(13);
    run(g);
    expect(idsOf(g, 'p1', 'trash')).toHaveLength(14);
    expect(dec(g)?.kind).toBe('main');
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(g.card(g.find('p1', 'characters', V.c2)).don).toBe(0);
  });

  it('with no rested DON!! there is nothing to give', () => {
    const g = field(14, 5, 0);
    run(g);
    if (dec(g)?.kind === 'choose') none(g);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(g.card(g.find('p1', 'characters', V.c2)).don).toBe(0);
  });

  it('[Activate: Main] has no Once Per Turn limit or cost beyond trashing itself: it is offered when on the field', () => {
    const g = field(14);
    expect(canActivate(g, g.find('p1', 'characters', ID), 'give')).toBe(true);
  });
});
