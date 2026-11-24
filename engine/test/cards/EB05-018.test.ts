/** EB05-018 Rebecca. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, play, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';

const ID = 'EB05-018';

const start = (opp: Parameters<typeof game>[1]['characters']) =>
  game(
    { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 1, rested: 0 } },
    { leader: PLAIN_BLUE, characters: opp },
  );

describe('EB05-018 Rebecca', () => {
  it("[On Play]: the chosen rested Character (cost 6 or less) does not become active in your opponent's next Refresh Phase", () => {
    const g = start([
      { card: V.c6, rested: true },
      { card: V.c5, rested: true },
    ]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    g.act({ type: 'endTurn' });
    // Opponent's turn: the chosen one stayed rested, the other became active.
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });

  it('only the next Refresh Phase is skipped: the Character becomes active the turn after', () => {
    const g = start([{ card: V.c6, rested: true }]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(false);
  });

  it('only rested Characters with a cost of 6 or less are candidates', () => {
    const g = start([{ card: V.c7, rested: true }, V.c2, { card: V.c3, rested: true }]);
    play(g, ID);
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks.map((a) => (a.type === 'pick' ? a.choice : null))).toEqual([
      g.find('p2', 'characters', V.c3),
    ]);
    none(g);
  });

  it('"up to": it may choose nothing, and with no candidate nothing is asked', () => {
    const g = start([{ card: V.c6, rested: true }]);
    play(g, ID);
    none(g);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(false);
    const h = start([V.c6]);
    play(h, ID);
    expectDecision(h, 'main', 'p1');
  });
});
