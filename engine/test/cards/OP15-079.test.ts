/** OP15-079 Absalom. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, PLAIN_PURPLE, V } from './helpers.ts';
import { damageWithP2 } from './helpers-rgl-penel.ts';
import { idsOf, koedInBattle, KUMACY, TBP4 } from './helpers-op15g2.ts';

const ID = 'OP15-079';

describe('OP15-079 Absalom', () => {
  const candidates = (g: ReturnType<typeof koedInBattle>) =>
    g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));

  it('[On K.O.] add up to 1 {Thriller Bark Pirates} card from your trash to your hand', () => {
    const g = koedInBattle(ID, { leader: PLAIN_PURPLE, trash: [KUMACY, V.c1] });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'trash', KUMACY)]);
    expect(hand(g, 'p1')).toEqual([KUMACY]);
    expect(idsOf(g, 'p1', 'trash')).toContain(V.c1);
  });

  it('only {Thriller Bark Pirates} cards are candidates (any category, cost or power); the K.O.d Absalom is in the trash and may itself be chosen', () => {
    const g = koedInBattle(ID, { leader: PLAIN_PURPLE, trash: [KUMACY, V.c1, TBP4] });
    const picks = candidates(g);
    expect(picks).toHaveLength(3);
    expect(picks).not.toContain(g.find('p1', 'trash', V.c1));
    pick(g, [g.find('p1', 'trash', ID)]);
    expect(hand(g, 'p1')).toEqual([ID]);
  });

  it('"up to 1": may add nothing, and never more than 1', () => {
    const g = koedInBattle(ID, { leader: PLAIN_PURPLE, trash: [KUMACY, TBP4] });
    pick(g, [g.find('p1', 'trash', KUMACY)]);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(hand(g, 'p1')).toEqual([KUMACY]);
    const h = koedInBattle(ID, { leader: PLAIN_PURPLE, trash: [KUMACY] });
    none(h);
    expect(hand(h, 'p1')).toEqual([]);
  });

  it('with no {Thriller Bark Pirates} card in the trash but Absalom itself, only Absalom is offered', () => {
    const g = koedInBattle(ID, { leader: PLAIN_PURPLE, trash: [V.c1] });
    expect(candidates(g)).toEqual([g.find('p1', 'trash', ID)]);
  });

  it("[Trigger] activate this card's [On K.O.] effect: add a {Thriller Bark Pirates} card from the trash", () => {
    const g = damageWithP2(ID, { trash: [KUMACY, V.c1] }, [V.c7]);
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(candidates(g)).toEqual([g.find('p1', 'trash', KUMACY)]);
    pick(g, [g.find('p1', 'trash', KUMACY)]);
    expect(hand(g, 'p1')).toEqual([KUMACY]);
  });

  it('declining the [Trigger] adds Absalom to hand and nothing from the trash', () => {
    const g = damageWithP2(ID, { trash: [KUMACY] }, [V.c7]);
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1')).toEqual([ID]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([KUMACY]);
  });
});
