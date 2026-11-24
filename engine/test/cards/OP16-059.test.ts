/** OP16-059 We'll Change This Mission from Sneaky to Flashy!. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  endCounter,
  expectDecision,
  game,
  none,
  passBlock,
  payDon,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
} from './helpers.ts';
import { orderAll } from './helpers-hancock-rosi.ts';
import { defend, ID_3000, ID_6000, ID_8000 } from './helpers-op16g3.ts';

const ID = 'OP16-059';
const deck = [ID_3000, ID_8000, ID_6000, PURPLE, BLUE, BLUE, BLUE];
const start = () =>
  game(
    { leader: PLAIN_BLUE, hand: [ID], deck, costArea: { active: 8, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe("OP16-059 We'll Change This Mission from Sneaky to Flashy!", () => {
  it('[Main] rest 7 DON!!: looks at 5, plays up to 2 {Impel Down} Characters with 6000 power or less', () => {
    const g = start();
    play(g, ID);
    accept(g);
    payDon(g);
    // Only Blugori (3000) and Sphinx (6000) are offered: not Saldeath (8000) and not the vanilla.
    const offered = g.legal().filter((a) => a.type === 'pick');
    expect(offered).toHaveLength(2);
    pick(g, [g.find('p1', 'deck', ID_3000), g.find('p1', 'deck', ID_6000)]);
    orderAll(g);
    const chars = g.zone('p1', 'characters').map((c) => c.card);
    expect(chars.sort()).toEqual([ID_3000, ID_6000].sort());
    expect(g.zone('p1', 'characters').every((c) => !c.rested)).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 8 });
    // The other 3 looked-at cards went to the bottom; the 2 unlooked stay on top.
    const left = g.zone('p1', 'deck').map((c) => c.card);
    expect(left).toHaveLength(5);
    expect(left.slice(0, 2)).toEqual([BLUE, BLUE]);
  });

  it('"up to 2": may play just 1, or none', () => {
    const g = start();
    play(g, ID);
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'deck', ID_6000)]);
    orderAll(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID_6000]);
    const h = start();
    play(h, ID);
    accept(h);
    payDon(h);
    none(h);
    orderAll(h);
    expect(h.zone('p1', 'characters')).toHaveLength(0);
    expect(h.zone('p1', 'deck')).toHaveLength(7);
  });

  it('declining the optional DON!! cost does nothing beyond playing the Event', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'deck')).toHaveLength(7);
    expect(don(g, 'p1')).toMatchObject({ active: 7, rested: 1 });
    expectDecision(g, 'main', 'p1');
  });

  it('[Counter] your Leader gains +3000 power during this battle', () => {
    const g = defend({ leader: PLAIN_BLUE, hand: [ID], costArea: { active: 1, rested: 0 } });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', ID), ability: 'counter' });
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(g.life('p1')).toBe(3);
  });
});
