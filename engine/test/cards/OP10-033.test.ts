/** OP10-033 Nami. */
import { describe, expect, it } from 'vitest';
import { dec, don, game, play, PLAIN_BLUE, V } from './helpers.ts';
import { BM_LEADER, NOT_ODYSSEY, ODYSSEY } from './helpers-w5c2.ts';

const ID = 'OP10-033';
const rested = (card: string) => ({ card, rested: true });

/** p1 plays Nami with `chars` on the field; p2 has 1 active and 3 rested DON!!. */
const mk = (chars: unknown[], p2rested = 3) =>
  game(
    {
      leader: BM_LEADER,
      hand: [ID],
      characters: chars as never,
      costArea: { active: 3, rested: 0 },
    },
    { leader: PLAIN_BLUE, costArea: { active: 1, rested: p2rested } },
  );
/** Play Nami, end the turn: p2 goes through its Refresh, Draw and DON!! Phases to its Main Phase. */
const throughRefresh = (g: ReturnType<typeof mk>) => {
  play(g, ID);
  expect(dec(g)?.kind).toBe('main'); // nothing is asked
  g.act({ type: 'endTurn' });
};

describe('OP10-033 Nami', () => {
  it("[On Play] with 2 rested {ODYSSEY} Characters: 1 of the opponent's rested DON!! stays rested in their next Refresh Phase", () => {
    const g = mk([rested(ODYSSEY), rested(ODYSSEY)]);
    throughRefresh(g);
    // 1 active + 3 rested: one stays rested, two refresh, then the DON!! Phase adds 2 active.
    expect(don(g, 'p2')).toMatchObject({ rested: 1, active: 1 + 2 + 2 });
  });

  it('with only 1 rested {ODYSSEY} Character (2 is the boundary) nothing is held', () => {
    const g = mk([rested(ODYSSEY), ODYSSEY]);
    throughRefresh(g);
    expect(don(g, 'p2')).toMatchObject({ rested: 0, active: 1 + 3 + 2 });
  });

  it('active {ODYSSEY} Characters and rested Characters of other types do not count; Nami does not count herself', () => {
    const active = mk([ODYSSEY, ODYSSEY]);
    throughRefresh(active);
    expect(don(active, 'p2').rested).toBe(0);
    const other = mk([rested(ODYSSEY), rested(NOT_ODYSSEY)]);
    throughRefresh(other);
    expect(don(other, 'p2').rested).toBe(0);
    // One rested {ODYSSEY} plus Nami (played active) is still one.
    const self = mk([rested(ODYSSEY)]);
    throughRefresh(self);
    expect(don(self, 'p2').rested).toBe(0);
  });

  it('holds back at most 1, and nothing when the opponent has no rested DON!!', () => {
    const none = mk([rested(ODYSSEY), rested(ODYSSEY)], 0);
    throughRefresh(none);
    expect(don(none, 'p2')).toMatchObject({ rested: 0, active: 1 + 2 });
    const many = mk([rested(ODYSSEY), rested(ODYSSEY)], 6);
    throughRefresh(many);
    expect(don(many, 'p2').rested).toBe(1);
  });

  it('lasts one Refresh Phase only, and the Leader and Characters still refresh', () => {
    const g = game(
      {
        leader: BM_LEADER,
        hand: [ID],
        characters: [rested(ODYSSEY), rested(ODYSSEY)],
        costArea: { active: 3, rested: 0 },
      },
      {
        leader: { card: PLAIN_BLUE, rested: true },
        characters: [rested(V.c1)],
        costArea: { active: 1, rested: 3 },
      },
    );
    throughRefresh(g);
    expect(g.card(g.leader('p2')).rested).toBe(false);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
    expect(don(g, 'p2').rested).toBe(1);
    // p2 ends its turn, p1 ends the next: p2's following Refresh is normal.
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(don(g, 'p2').rested).toBe(0);
  });
});
