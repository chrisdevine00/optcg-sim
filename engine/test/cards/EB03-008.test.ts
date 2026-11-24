/** EB03-008 Hibari. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, V } from './helpers.ts';
import {
  activate,
  canHit,
  canPick,
  finishBattle,
  mk,
  offeredAb,
  SWORD7,
  SWORD_LEADER,
} from './helpers-w4sb.ts';

const ID = 'EB03-008';
const play = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });

describe('EB03-008 Hibari', () => {
  it('[On Play]: a {SWORD} Character can also attack active Characters this turn', () => {
    const g = mk({ hand: [ID], characters: [SWORD7] }, { characters: [V.c1] });
    const sword = g.find('p1', 'characters', SWORD7);
    expect(canHit(g, sword, g.find('p2', 'characters', V.c1))).toBe(false);
    play(g);
    pick(g, [sword]);
    expect(canHit(g, sword, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canHit(g, sword, g.leader('p2'))).toBe(true);
  });

  it('can select a {SWORD} Leader, and only {SWORD} cards', () => {
    const g = mk(
      { hand: [ID], leader: SWORD_LEADER, characters: [SWORD7, V.c4] },
      { characters: [V.c1] },
    );
    play(g);
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', SWORD7))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c4))).toBe(false);
    pick(g, [g.leader('p1')]);
    expect(canHit(g, g.leader('p1'), g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canHit(g, g.find('p1', 'characters', SWORD7), g.find('p2', 'characters', V.c1))).toBe(
      false,
    );
  });

  it('"up to 1": choosing nothing grants nothing', () => {
    const g = mk({ hand: [ID], characters: [SWORD7] }, { characters: [V.c1] });
    play(g);
    none(g);
    expect(canHit(g, g.find('p1', 'characters', SWORD7), g.find('p2', 'characters', V.c1))).toBe(
      false,
    );
  });

  it('the grant does not let Hibari attack the turn she is played (RL-17)', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c1] });
    play(g);
    pick(g, [g.find('p1', 'characters', ID)]); // she is a {SWORD} Character too
    expect(canHit(g, g.find('p1', 'characters', ID), g.find('p2', 'characters', V.c1))).toBe(false);
  });

  it('[When Attacking]: grants the same, so a {SWORD} Character can attack an active Character after', () => {
    const g = mk({ characters: [ID, SWORD7] }, { characters: [V.c1] });
    const sword = g.find('p1', 'characters', SWORD7);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    pick(g, [sword]);
    finishBattle(g);
    expect(canHit(g, sword, g.find('p2', 'characters', V.c1))).toBe(true);
  });

  it('[Activate: Main] [Once Per Turn]: gives up to 1 opposing Character -1000 power this turn', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c4, V.c1] });
    activate(g, g.find('p1', 'characters', ID), 'shrink');
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(5000);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'shrink')).toBe(false);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });

  it('[Activate: Main]: "up to 1" may choose nothing, and only your opponent’s Characters are offered', () => {
    const g = mk({ characters: [ID, V.c2] }, { characters: [V.c4] });
    activate(g, g.find('p1', 'characters', ID), 'shrink');
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
    expectDecision(g, 'main', 'p1');
    expect(dec(g)?.kind).toBe('main');
  });
});
