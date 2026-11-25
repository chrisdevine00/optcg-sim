/** EB02-060 Merry Go (Yellow Stage). */
import { describe, expect, it } from 'vitest';
import { expectDecision, pick, PURPLE } from './helpers.ts';
import { activate, canActivate, canPick, mk, V, YSHC3 } from './helpers-aeb2g2.ts';

const ID = 'EB02-060';
const staged = (life: (string | { card: string; faceUp: boolean })[] = [PURPLE, V.c2, V.c3]) =>
  mk({ stage: ID, characters: [YSHC3, V.c3], life });

describe('EB02-060 Merry Go', () => {
  it('[Activate: Main] rests the Stage and turns the top Life card face-up; a {Straw Hat Crew} Character gets +1000 power', () => {
    const g = staged();
    activate(g, g.find('p1', 'stage', ID), 'activate');
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
    expect(g.zone('p1', 'life').map((c) => c.faceUp)).toEqual([true, false, false]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'characters', YSHC3))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false);
    pick(g, [g.find('p1', 'characters', YSHC3)]);
    expect(g.power(g.find('p1', 'characters', YSHC3))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
  });

  it("the power lasts through the opponent's next turn and ends after it", () => {
    const g = staged();
    activate(g, g.find('p1', 'stage', ID), 'activate');
    pick(g, [g.find('p1', 'characters', YSHC3)]);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', YSHC3))).toBe(6000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', YSHC3))).toBe(5000);
  });

  it('"up to 1": may choose nobody; the costs are paid anyway', () => {
    const g = staged();
    activate(g, g.find('p1', 'stage', ID), 'activate');
    g.act({ type: 'done' });
    expect(g.power(g.find('p1', 'characters', YSHC3))).toBe(5000);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
  });

  it('must not be offered with no Life cards (the cost cannot be paid)', () => {
    const g = staged([]);
    expect(canActivate(g, g.find('p1', 'stage', ID), 'activate')).toBe(false);
  });

  it('must not be offered while the Stage is rested', () => {
    const g = mk({ stage: { card: ID, rested: true }, characters: [YSHC3], life: [PURPLE] });
    expect(canActivate(g, g.find('p1', 'stage', ID), 'activate')).toBe(false);
  });
});
