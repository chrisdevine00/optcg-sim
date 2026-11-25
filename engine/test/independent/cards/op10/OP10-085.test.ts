/**
 * OP10-085 Jesus Burgess (Character, Black, cost 5, 6000, no Counter, {Blackbeard Pirates}/
 * {Dressrosa}).
 *
 * Card text: "[DON!! x1] If you have 8 or more cards in your trash, this Character gains [Rush]."
 *
 * Rules: [DON!! xN] needs at least N DON!! given to this card (CR 10-2-?; more is fine); [Rush]
 * lets a Character attack the turn it is played (CR 10-1-1) but only Characters of RL-17 /
 * CR 6-5-6 for the first turn; the trash counts the owner's trash only.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  BLUE,
  canAttack,
  fill,
  kw,
  LD10,
  mine,
  need,
  play,
  rawActivate,
  SC14,
  theirs,
} from './kit-op10c.ts';

const ID = 'OP10-085';

function field(o: { don: number; trash: number; p2trash?: number }) {
  const g = mine(
    LD10.plain,
    {
      characters: [{ card: ID, don: o.don }],
      costArea: { active: 3, rested: 0 },
      trash: fill(BLUE, o.trash),
    },
    { trash: fill(BLUE, o.p2trash ?? 0) },
  );
  return g;
}

const has = (g: ReturnType<typeof field>) => kw(g, g.find('p1', 'characters', ID)).includes('Rush');

describe('OP10-085 Jesus Burgess [DON!! x1] 8+ trash: gains [Rush]', () => {
  it('with 1 DON!! attached and 8 cards in the trash, it has [Rush]', () => {
    expect(has(field({ don: 1, trash: 8 }))).toBe(true);
  });

  it('boundary: 7 cards in the trash is not enough', () => {
    expect(has(field({ don: 1, trash: 7 }))).toBe(false);
  });

  it('boundary: 9 cards is fine', () => {
    expect(has(field({ don: 1, trash: 9 }))).toBe(true);
  });

  it('without a DON!! attached it has no [Rush], however big the trash', () => {
    expect(has(field({ don: 0, trash: 12 }))).toBe(false);
  });

  it('"x1" means at least 1: with 2 DON!! attached it still has [Rush]', () => {
    expect(has(field({ don: 2, trash: 8 }))).toBe(true);
  });

  it("only your own trash counts, not the opponent's", () => {
    expect(has(field({ don: 1, trash: 3, p2trash: 10 }))).toBe(false);
  });

  it('cards of any kind count: 4 Characters and 4 Events make 8', () => {
    const g = mine(LD10.plain, {
      characters: [{ card: ID, don: 1 }],
      costArea: { active: 3, rested: 0 },
      trash: [...Array(4).fill(SC14.c1), ...Array(4).fill('ST01-014')],
    });
    expect(g.zone('p1', 'trash')).toHaveLength(8);
    expect(has(g)).toBe(true);
  });

  it('it applies as soon as the trash reaches 8: Foxy trashing itself as a cost moves 7 to 8', () => {
    const g = mine(LD10.plain, {
      characters: [{ card: ID, don: 1 }, 'OP10-075'],
      costArea: { active: 3, rested: 0 },
      trash: fill(BLUE, 7),
    });
    expect(has(g)).toBe(false);
    rawActivate(g, g.find('p1', 'characters', 'OP10-075'));
    need(g, 'main', 'p1');
    expect(g.zone('p1', 'trash')).toHaveLength(8);
    expect(has(g)).toBe(true);
  });

  it('played this turn with a DON!! given and 8 in the trash, it can attack the Leader (Rush)', () => {
    const g = mine(LD10.plain, {
      hand: [ID],
      costArea: { active: 6, rested: 0 },
      trash: fill(BLUE, 8),
    });
    play(g, g.find('p1', 'hand', ID));
    const b = g.find('p1', 'characters', ID);
    act(g, { type: 'giveDon', target: b });
    expect(canAttack(g, b, g.leader('p2'))).toBe(true);
  });

  it('must not: with only 7 in the trash, a Burgess played this turn cannot attack', () => {
    const g = mine(LD10.plain, {
      hand: [ID],
      costArea: { active: 6, rested: 0 },
      trash: fill(BLUE, 7),
    });
    play(g, g.find('p1', 'hand', ID));
    const b = g.find('p1', 'characters', ID);
    act(g, { type: 'giveDon', target: b });
    expect(canAttack(g, b, g.leader('p2'))).toBe(false);
  });

  it("the condition is one of the owner: on the opponent's turn the DON!! given still counts for [DON!! x1]", () => {
    const g = theirs(LD10.plain, { characters: [{ card: ID, don: 1 }], trash: fill(BLUE, 8) }, {});
    expect(has(g as never)).toBe(true);
  });
});
