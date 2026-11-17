/** OP17-102 Charlotte Oven: [On K.O.] play a Character with 4000 power or less other than [Charlotte Oven] from the trash; [Trigger] play this card. */
import { describe, expect, it } from 'vitest';
import {
  endCounter,
  expectDecision,
  game,
  none,
  passBlock,
  pick,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { BMP, BMP6, ENEL, ids, triggerHit } from './helpers-robin.ts';

const OVEN = 'OP17-102';

describe('OP17-102 Charlotte Oven', () => {
  const koed = (trash: string[]) => {
    const g = game(
      { leader: ENEL, characters: [{ card: OVEN, rested: true }], trash },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', OVEN),
    });
    passBlock(g);
    endCounter(g);
    return g;
  };

  it('[On K.O.] plays a Character with 4000 power or less from the trash, not [Charlotte Oven] or a 6000 one', () => {
    const g = koed([BMP6, OVEN, BMP, V.c1]);
    expectDecision(g, 'choose', 'p1');
    // The K.O.'d Oven is in the trash too, but excluded by name; Opera has 6000 power.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'trash', BMP)]);
    expect(ids(g, 'p1', 'characters')).toEqual([BMP]);
    expect(ids(g, 'p1', 'trash')).toContain(OVEN);
  });

  it('[On K.O.] "up to 1": may play nothing', () => {
    const g = koed([BMP]);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('[On K.O.] with no eligible card in the trash nothing is played', () => {
    const g = koed([BMP6, V.c5]);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expectDecision(g, 'main', 'p2');
  });

  it('[Trigger] plays this card', () => {
    const g = triggerHit(OVEN);
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'characters')).toEqual([OVEN]);
    expect(ids(g, 'p1', 'trash')).toEqual([]);
  });
});
