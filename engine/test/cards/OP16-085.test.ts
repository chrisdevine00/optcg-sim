/** OP16-085 Kouzuki Momonosuke (cost 9). */
import { describe, expect, it } from 'vitest';
import { game, none, pick, play, PLAIN_BLUE, PURPLE, trash } from './helpers.ts';
import { MOMO_6, NOT_NAVY, WANO_1, WANO_5, WANO_8 } from './helpers-op16g3.ts';

const ID = 'OP16-085';
const start = (cards: string[]) =>
  game(
    { leader: NOT_NAVY, hand: [ID], trash: cards, costArea: { active: 9, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('OP16-085 Kouzuki Momonosuke', () => {
  it('has [Blocker]', () => {
    const g = start([]);
    play(g, ID);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] plays a {Land of Wano} Character with a cost of 6 or less other than [Kouzuki Momonosuke] from the trash', () => {
    const g = start([WANO_5, WANO_8, MOMO_6, PURPLE]);
    play(g, ID);
    // Only Kawamatsu (cost 5): not Sanji (8), not the cost 6 [Kouzuki Momonosuke], not the vanilla.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'trash', WANO_5)]);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([ID, WANO_5].sort());
    expect(trash(g, 'p1').sort()).toEqual([WANO_8, MOMO_6, PURPLE].sort());
  });

  it('the cost 6 limit is inclusive (a cost 6 card other than the named one would qualify) and cost 1 qualifies', () => {
    const g = start([WANO_1]);
    play(g, ID);
    pick(g, [g.find('p1', 'trash', WANO_1)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(WANO_1);
  });

  it('"up to 1": may play nothing, and with no match nothing is played', () => {
    const g = start([WANO_5]);
    play(g, ID);
    none(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    const h = start([MOMO_6, WANO_8]);
    play(h, ID);
    expect(h.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });
});
