/** OP18-115 Ten Finger Pistol. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { canPick } from './helpers-w3s.ts';
import { COST8, CP_L, trig, zoneOf } from './helpers-op18-g4.ts';

const ID = 'OP18-115';
const main = (oppChars: string[]) =>
  game(
    { leader: CP_L, hand: [ID], costArea: { active: 4, rested: 0 } },
    { leader: PLAIN_BLUE, characters: oppChars },
  );

describe('OP18-115 Ten Finger Pistol', () => {
  it('[Main] K.O.s an opposing Character with a cost of 5 or less (6 is not a target)', () => {
    const g = main([V.c5, V.c6]);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(zoneOf(g, 'p2', 'trash')).toEqual([V.c5]);
    expect(zoneOf(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('"up to 1": may K.O. nothing; your own Characters are not targets', () => {
    const g = game(
      { leader: CP_L, hand: [ID], characters: [V.c2], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c3] },
    );
    play(g, ID);
    expect(candidates(g)).toEqual([g.find('p2', 'characters', V.c3)]);
    none(g);
    expect(zoneOf(g, 'p2', 'characters')).toEqual([V.c3]);
  });

  it('[Main] needs no {CP} Leader', () => {
    const g = game(
      { leader: 'ST04-001', hand: [ID], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c4] },
    );
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(zoneOf(g, 'p2', 'trash')).toEqual([V.c4]);
  });

  it("[Trigger] with a {CP} Leader: draw 1, then place a Character with a cost of 7 or less at the bottom of its owner's deck", () => {
    const g = trig(ID, { deck: [BLUE, V.c1] }, [V.c7, COST8]);
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([BLUE]);
    // the attacker is a cost 7 Character too: cost 8 is the one that is not offered
    expect(candidates(g)).not.toContain(g.find('p2', 'characters', COST8));
    expect(candidates(g)).toHaveLength(2);
    pick(g, [g.find('p2', 'characters', V.c7, 1)]);
    expect(zoneOf(g, 'p2', 'deck').at(-1)).toBe(V.c7);
  });

  it('[Trigger] without a {CP} Leader nothing happens', () => {
    const g = trig(ID, { leader: 'ST04-001', deck: [BLUE, V.c1] }, [V.c2]);
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'main', 'p2');
    expect(hand(g, 'p1')).toEqual([]);
  });
});
