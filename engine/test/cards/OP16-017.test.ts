/** OP16-017 LittleOars Jr. */
import { describe, expect, it } from 'vitest';
import { game, PLAIN_BLUE } from './helpers.ts';
import { BIG10, RED_LEADER, WB8, WB_COST8 } from './helpers-op16g1.ts';

const ID = 'OP16-017';

describe('OP16-017 LittleOars Jr.', () => {
  const power = (
    mine: Parameters<typeof game>[0]['characters'],
    opp: Parameters<typeof game>[1]['characters'] = [],
  ) => {
    const g = game(
      { leader: RED_LEADER, characters: [ID, ...(mine ?? [])] },
      { leader: PLAIN_BLUE, characters: opp },
    );
    return g.power(g.find('p1', 'characters', ID));
  };

  it('[Blocker]', () => {
    const g = game({ leader: RED_LEADER, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('with no Whitebeard Pirates Character of cost 8 or more it gets -4000 power', () => {
    expect(power([])).toBe(4000);
  });

  it('a Whitebeard Pirates Character with a cost of 8 or more removes the penalty', () => {
    expect(power([WB_COST8])).toBe(8000);
  });

  it('threshold: a Whitebeard Pirates Character of cost 7 does not count', () => {
    expect(power([WB8])).toBe(4000);
  });

  it('a cost 8 Character without the Whitebeard type does not count, and neither does one of the opponent', () => {
    expect(power([BIG10])).toBe(4000);
    expect(power([], [WB_COST8])).toBe(4000);
  });
});
