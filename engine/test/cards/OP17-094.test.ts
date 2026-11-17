/** OP17-094 Rodo. Self-cost boosts apply only on the field (QA-OP17 OP17-085 / OP17-089 via RL-43). */
import { describe, expect, it } from 'vitest';
import { game, PLAIN_BLUE, PLAIN_PURPLE } from './helpers.ts';
import { ELBAPH, ELBAPH_LEADER } from './helpers-sabo.ts';

describe('OP17-094 Rodo', () => {
  it('with an {Elbaph} Leader it has +12 cost on the field', () => {
    const g = game({ leader: ELBAPH_LEADER, characters: [ELBAPH] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ELBAPH)).cost).toBe(13);
  });

  it('with a Leader of another type it has its printed cost', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [ELBAPH] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ELBAPH)).cost).toBe(1);
  });

  it('the +12 does not apply in hand, trash or deck', () => {
    const g = game(
      { leader: ELBAPH_LEADER, hand: [ELBAPH], trash: [ELBAPH], deck: [ELBAPH] },
      { leader: PLAIN_BLUE },
    );
    expect(g.card(g.find('p1', 'hand', ELBAPH)).cost).toBe(1);
    expect(g.card(g.find('p1', 'trash', ELBAPH)).cost).toBe(1);
  });

  it("an opponent's Rodo checks its own controller's Leader", () => {
    const g = game({ leader: ELBAPH_LEADER }, { leader: PLAIN_BLUE, characters: [ELBAPH] });
    expect(g.card(g.find('p2', 'characters', ELBAPH)).cost).toBe(1);
  });
});
