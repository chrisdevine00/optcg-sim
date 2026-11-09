import { describe, expect, it } from 'vitest';
import { SCRIPTS, abilityReadsHiddenZone, type CardScript } from '../src/index.ts';

type Ab = CardScript['abilities'][number];
const sel = (from: unknown) => ({ from, owner: 'you', pick: { exactly: 1 } });
const act = (cost: unknown[], effect: unknown[] = [{ do: { draw: 1 } }]): Ab =>
  ({ id: 'x', kind: 'activate', when: 'activateMain', cost, effect }) as unknown as Ab;

describe('abilityReadsHiddenZone (M4a-17)', () => {
  it('sees a hand cost however the zone is spelled', () => {
    expect(abilityReadsHiddenZone(act([{ trash: sel('hand') }]))).toBe(true);
    expect(abilityReadsHiddenZone(act([{ trash: sel(['hand', 'characters']) }]))).toBe(true);
  });
  it('sees lifeTop, lifeTopOrBottom, deckTop and looked in costs, effects and conditions', () => {
    for (const z of ['lifeTop', 'lifeTopOrBottom', 'deckTop', 'looked']) {
      expect(abilityReadsHiddenZone(act([{ trash: sel(z) }]))).toBe(true);
      expect(
        abilityReadsHiddenZone(
          act([], [{ do: { move: { what: sel([z]), to: { zone: 'trash' } } } }]),
        ),
      ).toBe(true);
      const ab = { ...act([]), conditions: [{ exists: sel(z) }] } as Ab;
      expect(abilityReadsHiddenZone(ab)).toBe(true);
    }
  });
  it('sees a read nested under if, may, forEach and chooseOne', () => {
    const inner = { do: { trashFromHand: sel('hand') } };
    for (const wrap of [
      (s: unknown) => ({ if: { yourTurn: true }, then: [s] }),
      (s: unknown) => ({ may: [s], label: 'a' }),
      (s: unknown) => ({ forEach: 2, do: [s] }),
      (s: unknown) => ({ chooseOne: [[s], []], labels: ['a', 'b'] }),
    ])
      expect(abilityReadsHiddenZone(act([], [wrap(inner)]))).toBe(true);
  });
  it('does not flag public zones or numeric counts', () => {
    expect(abilityReadsHiddenZone(act([{ rest: sel('characters') }]))).toBe(false);
    const ab = { ...act([]), conditions: [{ cmp: [{ hand: 'you' }, '>=', 3] }] } as Ab;
    expect(abilityReadsHiddenZone(ab)).toBe(false);
  });
  it('classifies every shipped ability without throwing', () => {
    for (const s of Object.values(SCRIPTS))
      for (const a of s.abilities) expect(typeof abilityReadsHiddenZone(a)).toBe('boolean');
  });
});
