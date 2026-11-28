/** OP18-065 Saint Gunko (Purple Character). */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, none, payDon, pick, play, trash, V } from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { CD4, mine, SHAMROCK } from './helpers-op18-g3.ts';

const ID = 'OP18-065';
const start = (trashCards = [CD4, V.c5, SHAMROCK], active = 10) =>
  mine({ hand: [ID], trash: trashCards, costArea: { active, rested: 0 } }, {});

describe('OP18-065 Saint Gunko (Purple Character)', () => {
  it('[On Play] DON!! −1: play up to 1 {Celestial Dragons} Character with 6000 power or less from your trash', () => {
    const g = start();
    play(g, ID);
    accept(g);
    payDon(g);
    expect(candidates(g)).toEqual([g.find('p1', 'trash', CD4)]); // not the other type, not 9000 power
    pick(g, [g.find('p1', 'trash', CD4)]);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([CD4, ID].sort());
    expect(trash(g, 'p1').sort()).toEqual([V.c5, SHAMROCK].sort());
    expect(don(g, 'p1').deck).toBe(1);
  });

  it('"up to 1": may play nothing, the DON!! is still returned', () => {
    const g = start();
    play(g, ID);
    accept(g);
    payDon(g);
    none(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(don(g, 'p1').deck).toBe(1);
  });

  it('declining the DON!! −1 plays nothing from the trash', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(don(g, 'p1').deck).toBe(0);
  });

  it('has [Blocker]: it can be declared as a blocker', () => {
    const g = mine({ characters: [ID] }, { characters: [V.c5] });
    g.act({ type: 'endTurn' });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c5), target: g.leader('p1') });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
  });
});
