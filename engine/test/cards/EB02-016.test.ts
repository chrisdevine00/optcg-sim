/** EB02-016 Chopperman. */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../src/testing.ts';
import {
  ANIMAL2,
  ANIMAL3,
  ANIMAL4,
  C2,
  canPick,
  cardsOf,
  don,
  expectDecision,
  hand,
  mk,
  pick,
  ZOU,
} from './helpers-aeb2g1.ts';
import { none, play } from './helpers.ts';

const ID = 'EB02-016';
const start = (handCards: string[]) => mk({ hand: handCards, costArea: { active: 6, rested: 0 } });

describe('EB02-016 Chopperman', () => {
  it('[On Play]: plays an {Animal} Character with cost 3 or less from the hand for free (cost 3 is the boundary)', () => {
    const g = start([ID, ANIMAL3, ANIMAL2, ANIMAL4, C2, ZOU]);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'hand', ANIMAL2))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', ANIMAL3))).toBe(true); // cost 3
    expect(canPick(g, g.find('p1', 'hand', ANIMAL4))).toBe(false); // cost 4
    expect(canPick(g, g.find('p1', 'hand', C2))).toBe(false); // not {Animal}
    expect(canPick(g, g.find('p1', 'hand', ZOU))).toBe(false); // an {Animal} Stage is not a Character
    pick(g, [g.find('p1', 'hand', ANIMAL3)]);
    expect(cardsOf(g, 'p1', 'characters').sort()).toEqual([ANIMAL3, ID].sort());
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 5 }); // only the 5 of Chopperman
    expect(hand(g, 'p1')).toHaveLength(4);
    expectDecision(g, 'main', 'p1');
  });

  it('"up to 1": may play nothing', () => {
    const g = start([ID, ANIMAL2]);
    play(g, ID);
    none(g);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([ANIMAL2]);
  });

  it('with no eligible card in the hand the pick is asked at max 0', () => {
    const g = start([ID, ANIMAL4]);
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    g.act({ type: 'done' });
    expect(hand(g, 'p1')).toEqual([ANIMAL4]);
  });

  it('is also named [Tony Tony.Chopper] for the rules: a name condition sees it, and not without it', () => {
    const plant = (g: ReturnType<typeof start>, card: string): void => {
      g.state = withAbilities(g.state, card, [
        {
          id: 'chk',
          kind: 'activate',
          when: 'activateMain',
          effect: [
            {
              if: {
                exists: { from: 'characters', owner: 'you', filter: { name: 'Tony Tony.Chopper' } },
              },
              then: [{ do: { draw: 1 } }],
            },
          ],
        } as Ability,
      ]);
    };
    const g = mk({ characters: [ID, C2], deck: [C2, C2] });
    plant(g, C2);
    g.act({ type: 'activate', card: g.find('p1', 'characters', C2), ability: 'chk' });
    expect(hand(g, 'p1')).toHaveLength(1);
    const h = mk({ characters: [C2], deck: [C2, C2] });
    plant(h, C2);
    h.act({ type: 'activate', card: h.find('p1', 'characters', C2), ability: 'chk' });
    expect(hand(h, 'p1')).toHaveLength(0);
  });
});
