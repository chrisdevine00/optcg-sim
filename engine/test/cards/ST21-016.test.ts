/** ST21-016 Gum-Gum Dawn Whip. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  endCounter,
  expectDecision,
  none,
  passBlock,
  pick,
  play,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { BLOCK4000, BLOCK5000, attack, mk, offered, oppTurn } from './helpers-st1821.ts';
import type { TestGame } from '../fixtures/index.ts';

const ID = 'ST21-016';

const blockers = (g: TestGame): string[] =>
  g
    .legal()
    .flatMap((a) => (a.type === 'block' && a.blocker ? [g.card(a.blocker).card] : []))
    .sort();

/** p1 plays the Event with two blockers (4000 and 5000) and a 3000 Character on the other side. */
const start = (): TestGame =>
  mk({ hand: [ID], characters: [BLUE] }, { characters: [BLOCK4000, BLOCK5000, V.c1] });

describe('ST21-016 Gum-Gum Dawn Whip', () => {
  it('[Main]: +1000 power to a Leader or Character this turn', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    // The Leader and the Character are candidates, nothing else.
    expect(offered(g)).toHaveLength(2);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    // Still on the same Main: the second pick (the Blocker lock) is open.
    expectDecision(g, 'choose', 'p1');
  });

  it('then: up to 1 Character with 4000 power or less cannot activate [Blocker] (5000 is not offered)', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.leader('p1')]);
    expect(offered(g).sort()).toEqual(
      [g.find('p2', 'characters', BLOCK4000), g.find('p2', 'characters', V.c1)].sort(),
    );
    pick(g, [g.find('p2', 'characters', BLOCK4000)]);
    attack(g, g.leader('p1'));
    expectDecision(g, 'block', 'p2');
    // Only the 5000 Blocker may still block.
    expect(blockers(g)).toEqual([BLOCK5000]);
    passBlock(g);
    endCounter(g);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('"Then" is not "If you do": the Blocker lock is still given when the +1000 is declined', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    pick(g, [g.find('p2', 'characters', BLOCK4000)]);
    attack(g, g.leader('p1'));
    expect(blockers(g)).toEqual([BLOCK5000]);
  });

  it('without the Event both Blockers may block', () => {
    const g = start();
    attack(g, g.leader('p1'));
    expect(blockers(g)).toEqual([BLOCK4000, BLOCK5000].sort());
  });

  it("[Trigger]: K.O.s up to 1 of the opponent's Characters with 4000 power or less (5000 is not offered)", () => {
    const g = mk(
      { life: [ID, BLUE, BLUE] },
      { characters: [V.c4, V.c2, V.c3], life: [PURPLE, PURPLE, PURPLE] },
      oppTurn,
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    expectDecision(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: true });
    expect(offered(g)).toEqual([g.find('p2', 'characters', V.c2)]);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c4, V.c3]);
  });
});
