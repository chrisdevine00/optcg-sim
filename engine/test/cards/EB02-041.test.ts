/** EB02-041 Merry Go (Purple Stage). */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, pick, play } from './helpers.ts';
import {
  activate,
  canActivate,
  canPick,
  mk,
  OTHER_LEADER,
  SHC_LEADER,
  V,
  YSHC3,
} from './helpers-aeb2g2.ts';

const ID = 'EB02-041';
const don = (n: number) => ({ active: n, rested: 0 });
const staged = (mine: number, theirs: number, extra: Parameters<typeof mk>[0] = {}) =>
  mk(
    { stage: ID, characters: [YSHC3, V.c3], costArea: don(mine), ...extra },
    { costArea: don(theirs) },
  );
const effect = (g: ReturnType<typeof staged>) => {
  activate(g, g.find('p1', 'stage', ID), 'activate');
  return g;
};

describe('EB02-041 Merry Go', () => {
  it('[On Play] with a {Straw Hat Crew} Leader draws 1 card', () => {
    const g = mk({ leader: SHC_LEADER, hand: [ID], deck: [V.c6, V.c7] });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c6]);
  });

  it('[On Play] must not draw with another Leader', () => {
    const g = mk({ leader: OTHER_LEADER, hand: [ID], deck: [V.c6, V.c7] });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('[Activate: Main] with equally many DON!! on both fields: a {Straw Hat Crew} Character gets +2 cost; the Stage is rested', () => {
    const g = effect(staged(3, 3));
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'characters', YSHC3))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false);
    pick(g, [g.find('p1', 'characters', YSHC3)]);
    expect(g.card(g.find('p1', 'characters', YSHC3)).cost).toBe(5);
  });

  it('fewer DON!! than the opponent also works; more (boundary: one more) does nothing but the Stage is still rested', () => {
    const fewer = effect(staged(2, 3));
    expectDecision(fewer, 'choose', 'p1');
    const more = effect(staged(4, 3));
    expectDecision(more, 'main', 'p1');
    expect(more.card(more.find('p1', 'stage', ID)).rested).toBe(true);
    expect(more.card(more.find('p1', 'characters', YSHC3)).cost).toBe(3);
  });

  it('DON!! given to a Character count on the field: 3 in the cost area and 1 given is 4, more than 3', () => {
    const g = effect(
      staged(3, 3, { characters: [{ card: YSHC3, don: 1 }], costArea: { active: 2, rested: 0 } }),
    );
    // 2 in the cost area + 1 given = 3: equal, so it works.
    expectDecision(g, 'choose', 'p1');
    const h = effect(
      staged(3, 3, { characters: [{ card: YSHC3, don: 1 }], costArea: { active: 3, rested: 0 } }),
    );
    expectDecision(h, 'main', 'p1');
  });

  it("the +2 cost lasts through the opponent's next turn and ends after it", () => {
    const g = effect(staged(3, 3));
    pick(g, [g.find('p1', 'characters', YSHC3)]);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', YSHC3)).cost).toBe(5);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', YSHC3)).cost).toBe(3);
  });

  it('is not offered while the Stage is rested', () => {
    const g = mk({ stage: { card: ID, rested: true }, characters: [YSHC3] });
    expect(canActivate(g, g.find('p1', 'stage', ID), 'activate')).toBe(false);
  });
});
