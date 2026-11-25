/** OP10-094 Ryuma. */
import { describe, expect, it } from 'vitest';
import { mk, OTHER_LEADER } from './helpers-a10g3.ts';

const ID = 'OP10-094';
const start = (don: number) => mk({ characters: [{ card: ID, don }] }, {}, OTHER_LEADER, 5);
const keywords = (g: ReturnType<typeof start>) => g.card(g.find('p1', 'characters', ID)).keywords;

describe('OP10-094 Ryuma', () => {
  it('[DON!! x1] gains [Double Attack]', () => {
    expect(keywords(start(1))).toContain('Double Attack');
  });

  it('with 2 DON!! given it still has it', () => {
    expect(keywords(start(2))).toContain('Double Attack');
  });

  it('must not have [Double Attack] without a DON!! card given', () => {
    expect(keywords(start(0))).not.toContain('Double Attack');
  });

  it('has no other keyword (no printed [Rush] or [Blocker])', () => {
    expect(keywords(start(1))).not.toContain('Rush');
    expect(keywords(start(1))).not.toContain('Blocker');
  });
});
