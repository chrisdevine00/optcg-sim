/** OP10-085 Jesus Burgess. */
import { describe, expect, it } from 'vitest';
import { canAttack, mk, OTHER_LEADER, rep, V } from './helpers-a10g3.ts';

const ID = 'OP10-085';
const start = (don: number, trashed: number, playedThisTurn = false) =>
  mk(
    { characters: [{ card: ID, don, playedThisTurn }], trash: rep(trashed, V.c1) },
    {},
    OTHER_LEADER,
    5,
  );
const keywords = (g: ReturnType<typeof start>) => g.card(g.find('p1', 'characters', ID)).keywords;

describe('OP10-085 Jesus Burgess', () => {
  it('[DON!! x1] with 8 or more cards in your trash it gains [Rush]', () => {
    expect(keywords(start(1, 8))).toContain('Rush');
  });

  it('more of both still counts (2 DON!!, 12 cards)', () => {
    expect(keywords(start(2, 12))).toContain('Rush');
  });

  it('must not gain [Rush] with 7 cards in the trash (boundary)', () => {
    expect(keywords(start(1, 7))).not.toContain('Rush');
  });

  it('must not gain [Rush] without a DON!! card given', () => {
    expect(keywords(start(0, 10))).not.toContain('Rush');
  });

  it('the [Rush] lets it attack the turn it is played, only while the condition holds', () => {
    const on = start(1, 8, true);
    expect(canAttack(on, on.find('p1', 'characters', ID), on.leader('p2'))).toBe(true);
    const off = start(1, 7, true);
    expect(canAttack(off, off.find('p1', 'characters', ID), off.leader('p2'))).toBe(false);
  });
});
