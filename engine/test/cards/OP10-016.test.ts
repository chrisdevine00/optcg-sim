/** OP10-016 Monet. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, option, pick } from './helpers.ts';
import { activate, canPick, mk, offeredAb, rested, V } from './helpers-a10g1.ts';

const ID = 'OP10-016';
const start = (restedDon: number, p1chars: string[] = [], p2chars: string[] = [V.c5]) =>
  mk(
    { characters: [ID, ...p1chars], costArea: { active: 2, rested: restedDon } },
    { characters: p2chars },
  );
const monet = (g: ReturnType<typeof start>) => g.find('p1', 'characters', ID);

describe('OP10-016 Monet', () => {
  it('[Activate: Main]: rests itself, gives up to 2 rested DON!! to your Leader, then -1000 power to an opponent Character', () => {
    const g = start(3);
    activate(g, monet(g), 'give-don');
    expect(g.card(monet(g)).rested).toBe(true);
    addMost(g);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(don(g, 'p1')).toMatchObject({ rested: 1, active: 2 });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(6000);
  });

  it('can give to 1 of your Characters instead of the Leader', () => {
    const g = start(3, [V.c1]);
    activate(g, monet(g), 'give-don');
    option(g, '2');
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(true);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.card(g.find('p1', 'characters', V.c1)).don).toBe(2);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('"up to 2": 1 DON!! can be given; the -1000 still follows', () => {
    const g = start(3);
    activate(g, monet(g), 'give-don');
    option(g, '1');
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(6000);
  });

  it('"Then" is not "If you do": giving none (0) or having no rested DON!! still gives -1000', () => {
    const g = start(3);
    activate(g, monet(g), 'give-don');
    option(g, '0');
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(6000);

    const h = start(0);
    activate(h, monet(h), 'give-don');
    pick(h, [h.find('p2', 'characters', V.c5)]);
    expect(h.power(h.find('p2', 'characters', V.c5))).toBe(6000);
  });

  it('"up to 1" opponent Character: may be declined, and the power returns at end of turn', () => {
    const g = start(1);
    activate(g, monet(g), 'give-don');
    pick(g, [g.leader('p1')]);
    expectDecision(g, 'choose', 'p1');
    g.act({ type: 'done' });
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
    const h = start(1);
    activate(h, monet(h), 'give-don');
    pick(h, [h.leader('p1')]);
    pick(h, [h.find('p2', 'characters', V.c5)]);
    h.act({ type: 'endTurn' });
    expect(h.power(h.find('p2', 'characters', V.c5))).toBe(7000);
  });

  it('is not offered when Monet is already rested (the rest is the cost)', () => {
    const g = mk({ characters: [rested(ID)], costArea: { active: 2, rested: 3 } });
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'give-don')).toBe(false);
  });
});
