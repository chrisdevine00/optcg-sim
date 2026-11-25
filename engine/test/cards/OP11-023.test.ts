/** OP11-023 Arlong. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, V } from './helpers.ts';
import { damageWithP2, FISH_MAN_LEADER, offered, OTHER_LEADER, rep } from './helpers-lfa.ts';
import { game } from './helpers.ts';

const ID = 'OP11-023';
const rested = (card: string) => ({ card, rested: true });

/** p1 over `leader` with Arlong in hand, `life` Life cards; p2 has `p2` (rested and active cards). */
const board = (
  leader: string,
  life: number,
  p2: Parameters<typeof game>[1] = { leader: 'ST03-001' },
) => {
  const g = game({ leader, hand: [ID], life: rep(life, V.c1) }, p2);
  return { g, cost: () => g.card(g.find('p1', 'hand', ID)).cost };
};
/** An opponent with 5 rested Characters. */
const fiveRested = {
  leader: 'ST03-001',
  characters: [V.c1, V.c2, V.c3, V.c4, V.c5].map(rested),
};

describe('OP11-023 Arlong', () => {
  it('in hand costs 3 less with a {Fish-Man} Leader, 3 or less Life and 5+ rested opposing cards', () => {
    const { cost } = board(FISH_MAN_LEADER, 3, fiveRested);
    expect(cost()).toBe(4);
  });

  it('boundaries: 4 rested cards is not enough, 5 is; 4 Life is too many, 3 is fine', () => {
    const four = board(FISH_MAN_LEADER, 3, {
      leader: 'ST03-001',
      characters: [V.c1, V.c2, V.c3, V.c4].map(rested),
    });
    expect(four.cost()).toBe(7);
    expect(board(FISH_MAN_LEADER, 4, fiveRested).cost()).toBe(7);
    expect(board(FISH_MAN_LEADER, 0, fiveRested).cost()).toBe(4);
  });

  it("the rested cards are the opponent's Leader, Characters, Stage and DON!! (M6b-Q25)", () => {
    const don = board(FISH_MAN_LEADER, 3, {
      leader: 'ST03-001',
      characters: [V.c1, V.c2, V.c3].map(rested),
      costArea: { active: 0, rested: 2 },
    });
    expect(don.cost()).toBe(4);
    const active = board(FISH_MAN_LEADER, 3, {
      leader: 'ST03-001',
      characters: [V.c1, V.c2, V.c3].map(rested),
      costArea: { active: 4, rested: 1 },
    });
    expect(active.cost()).toBe(7);
  });

  it('must not apply without a {Fish-Man} Leader', () => {
    expect(board(OTHER_LEADER, 3, fiveRested).cost()).toBe(7);
  });

  it('your own rested cards do not count', () => {
    const g = game(
      {
        leader: FISH_MAN_LEADER,
        hand: [ID],
        life: rep(3, V.c1),
        characters: [V.c1, V.c2, V.c3, V.c4, V.c5].map(rested),
      },
      { leader: 'ST03-001' },
    );
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(7);
  });

  it('the discount makes it playable with fewer DON!!, and only while in hand', () => {
    const g = game(
      {
        leader: FISH_MAN_LEADER,
        hand: [ID],
        life: rep(3, V.c1),
        costArea: { active: 4, rested: 0 },
      },
      fiveRested,
    );
    expect(g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', ID), player: 'p1' })).toBe(
      true,
    );
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(7);
  });

  describe("[Trigger] rest up to 1 of your opponent's Characters with a cost of 4 or less", () => {
    const hit = () => damageWithP2(ID, {}, [V.c7, V.c4, V.c5, V.c1]);

    it('boundary: cost 4 and cost 1 can be chosen, cost 5 and the cost 7 attacker cannot', () => {
      const g = hit();
      g.act({ type: 'trigger', activate: true });
      expectDecision(g, 'choose', 'p1');
      expect(offered(g).sort()).toEqual(
        [g.find('p2', 'characters', V.c4), g.find('p2', 'characters', V.c1)].sort(),
      );
      pick(g, [g.find('p2', 'characters', V.c4)]);
      expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(true);
      expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
      expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
    });

    it('"up to 1": it can be declined', () => {
      const g = hit();
      g.act({ type: 'trigger', activate: true });
      none(g);
      expect(g.zone('p2', 'characters').filter((c) => c.rested)).toHaveLength(1); // the attacker only
    });

    it('not activating adds Arlong to the hand and rests nothing', () => {
      const g = hit();
      g.act({ type: 'trigger', activate: false });
      expect(hand(g, 'p1')).toContain(ID);
      expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(false);
    });
  });
});
