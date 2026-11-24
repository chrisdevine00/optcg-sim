/** EB03-045 Perona. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, expectDecision, none, pick, play, times, V } from './helpers.ts';
import { canPick, cardsIn, mk, TBP2, TBP4 } from './helpers-eb03g2.ts';

const ID = 'EB03-045';
const trash10 = [TBP2, TBP4, V.c1, ...times(7, BLUE)]; // 10 cards
const trash9 = [TBP2, TBP4, V.c1, ...times(6, BLUE)];

describe('EB03-045 Perona', () => {
  it('[On Play]: gives 1 rested DON!! to your Leader or a Character; with 10+ trash cards plays a cost 2 or less {Thriller Bark Pirates} Character from the trash rested', () => {
    const g = mk({ hand: [ID], characters: [V.c1], trash: trash10 });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'trash', TBP2))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', TBP4))).toBe(false); // cost 4
    expect(canPick(g, g.find('p1', 'trash', V.c1))).toBe(false); // wrong type
    pick(g, [g.find('p1', 'trash', TBP2)]);
    const c = g.zone('p1', 'characters').find((x) => x.card === TBP2)!;
    expect(c.rested).toBe(true);
    expect(cardsIn(g, 'p1', 'trash')).toHaveLength(9);
  });

  it('boundary: 9 cards in the trash play nothing, and ask nothing', () => {
    const g = mk({ hand: [ID], trash: trash9 });
    play(g, ID);
    pick(g, [g.leader('p1')]);
    expect(dec(g)?.kind).toBe('main');
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('the DON!! may be given to a Character instead (Perona herself is a legal target)', () => {
    const g = mk({ hand: [ID], characters: [V.c1], trash: trash9 });
    play(g, ID);
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.card(g.find('p1', 'characters', V.c1)).don).toBe(1);
    expect(g.card(g.find('p1', 'characters', V.c1)).rested).toBe(false); // the Character is not rested, only the DON!!
  });

  it('"up to 1": may play nothing from the trash', () => {
    const g = mk({ hand: [ID], trash: trash10 });
    play(g, ID);
    pick(g, [g.leader('p1')]);
    none(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    expect(dec(g)?.kind).toBe('main');
  });

  it('the Then-clause is independent of the give: the trash count is read after it', () => {
    // Perona herself is not in the trash, so her own play does not change the count.
    const g = mk({ hand: [ID], trash: trash10 });
    play(g, ID);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.card(g.find('p1', 'characters', ID)).don).toBe(1);
    expect(canPick(g, g.find('p1', 'trash', TBP2))).toBe(true);
  });

  it('is a [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });
});
