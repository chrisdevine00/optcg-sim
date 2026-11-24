/** OP11-022 Shirahoshi (Leader). */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, none, pick, V } from './helpers.ts';
import {
  activate,
  canHit,
  canPick,
  FMI5,
  MEGALO,
  MERFOLK,
  mk,
  NEPT6,
  offeredAb,
} from './helpers-op11g1.ts';

const ID = 'OP11-022';
const hand = [NEPT6, MEGALO, MERFOLK.c1, FMI5, V.c1];
const start = (extra: Parameters<typeof mk>[0] = {}, p2: Parameters<typeof mk>[1] = {}) =>
  mk(
    {
      leader: ID,
      hand,
      life: [V.c1, V.c2, V.c3],
      costArea: { active: 6, rested: 0 },
      ...extra,
    },
    p2,
  );

describe('OP11-022 Shirahoshi', () => {
  it('this Leader cannot attack', () => {
    const g = start({}, { characters: [{ card: V.c1, rested: true }] });
    expect(canHit(g, g.leader('p1'), g.leader('p2'))).toBe(false);
    expect(canHit(g, g.leader('p1'), g.find('p2', 'characters', V.c1))).toBe(false);
  });

  it('[Activate: Main] [Once Per Turn]: rests 1 DON!!, turns the top Life face-up, plays a {Neptunian} Character with cost <= DON!! on field', () => {
    const g = start();
    activate(g, g.leader('p1'), 'play');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', NEPT6))).toBe(true); // cost 6 = 6 DON!! on the field
    expect(canPick(g, g.find('p1', 'hand', MEGALO))).toBe(true); // [Megalo], cost 3
    expect(canPick(g, g.find('p1', 'hand', MERFOLK.c1))).toBe(false); // not Neptunian
    expect(canPick(g, g.find('p1', 'hand', FMI5))).toBe(false);
    pick(g, [g.find('p1', 'hand', NEPT6)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([NEPT6]);
    expect(don(g, 'p1').rested).toBe(1);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.zone('p1', 'life')[1]!.faceUp).toBeFalsy();
    expect(offeredAb(g, g.leader('p1'), 'play')).toBe(false); // once per turn
  });

  it('the cost cap is the DON!! on your field: 5 DON!! excludes the cost 6 Neptunian but keeps [Megalo]', () => {
    const g = start({ costArea: { active: 5, rested: 0 } });
    activate(g, g.leader('p1'), 'play');
    expect(canPick(g, g.find('p1', 'hand', NEPT6))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', MEGALO))).toBe(true);
  });

  it('given DON!! count: a DON!! given to the Leader still counts on the field', () => {
    const g = start({ leader: { card: ID, don: 1 }, costArea: { active: 5, rested: 0 } });
    activate(g, g.leader('p1'), 'play');
    expect(canPick(g, g.find('p1', 'hand', NEPT6))).toBe(true); // 5 + 1 given = 6
  });

  it('"up to 1": may play nothing, but the cost is still paid', () => {
    const g = start();
    activate(g, g.leader('p1'), 'play');
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(don(g, 'p1').rested).toBe(1);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
  });

  it('cannot be activated without Life cards or without an active DON!!', () => {
    const none1 = start({ life: [] });
    expect(offeredAb(none1, none1.leader('p1'), 'play')).toBe(false);
    const noDon = start({ costArea: { active: 0, rested: 6 } });
    expect(offeredAb(noDon, noDon.leader('p1'), 'play')).toBe(false);
    expect(dec(noDon)?.kind).toBe('main');
  });
});
