/** OP16-084 Kouzuki Momonosuke (cost 5). */
import { describe, expect, it } from 'vitest';
import { accept, don, game, pick, play, PLAIN_BLUE, trash } from './helpers.ts';
import { MOMO_6, MOMO_9, WANO_LEADER } from './helpers-op16g3.ts';

const ID = 'OP16-084';
const SHINOBU = 'OP16-087';

/** Shinobu (hand) gives Momonosuke +20 cost this turn: the only way to reach 20 in a test. */
const boosted = (active: number, trashCards: string[]) => {
  const g = game(
    {
      leader: WANO_LEADER,
      hand: [SHINOBU],
      characters: [ID],
      trash: trashCards,
      costArea: { active, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );
  play(g, SHINOBU);
  accept(g);
  pick(g, [g.find('p1', 'characters', ID)]);
  return g;
};
const use = (g: ReturnType<typeof game>) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'recur' });

describe('OP16-084 Kouzuki Momonosuke', () => {
  it('cannot be activated at its printed cost 5 (needs a cost of 20 or more)', () => {
    const g = game(
      {
        leader: WANO_LEADER,
        characters: [ID],
        trash: [MOMO_9],
        costArea: { active: 10, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    expect(
      g.isLegal({
        type: 'activate',
        card: g.find('p1', 'characters', ID),
        ability: 'recur',
        player: 'p1',
      }),
    ).toBe(false);
  });

  it('with cost 25: trash this Character; with 9+ DON!! play the cost 9 [Kouzuki Momonosuke] from the trash', () => {
    const g = boosted(10, [MOMO_9, MOMO_6]);
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(25);
    use(g);
    // Only the cost 9 card is offered; the cost 6 one (same name) is not.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'trash', MOMO_9)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([MOMO_9]);
    expect(trash(g, 'p1')).toContain(ID);
    expect(trash(g, 'p1')).toContain(MOMO_6);
  });

  it('with 8 DON!! the Character is trashed (cost) but nothing is played', () => {
    // 8 DON!! in the cost area in total (Shinobu's cost is paid from them, not added).
    const g = boosted(8, [MOMO_9]);
    expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(8);
    use(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g, 'p1')).toContain(ID);
    expect(trash(g, 'p1')).toContain(MOMO_9);
  });

  it('exactly 9 DON!! on the field is enough', () => {
    const g = boosted(9, [MOMO_9]);
    use(g);
    pick(g, [g.find('p1', 'trash', MOMO_9)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([MOMO_9]);
  });

  it('with no cost 9 card in the trash nothing is played', () => {
    const g = boosted(10, [MOMO_6]);
    use(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});
