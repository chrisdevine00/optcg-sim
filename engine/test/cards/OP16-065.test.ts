/** OP16-065 Sakazuki. effect-dsl.md §6.5. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  expectDecision,
  game,
  payDon,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { ROSI } from './helpers-hancock-rosi.ts';

describe('OP16-065 Sakazuki', () => {
  describe('[On Play] DON!! −1', () => {
    const start = () => {
      const g = game(
        { leader: ROSI, hand: ['OP16-065'], costArea: { active: 7, rested: 0 } },
        { leader: PLAIN_BLUE, characters: [V.c7] },
      );
      play(g, 'OP16-065');
      return g;
    };

    it('gives −6000 power that lasts through the opponent next End Phase', () => {
      const g = start();
      accept(g);
      payDon(g);
      expect(don(g, 'p1').deck).toBe(4);
      const target = g.find('p2', 'characters', V.c7);
      pick(g, [target]);
      expect(g.power(target)).toBe(3000);
      g.act({ type: 'endTurn' });
      // Still −6000 during the opponent's own turn.
      expect(g.power(target)).toBe(3000);
      g.act({ type: 'endTurn' });
      expect(g.power(target)).toBe(9000);
    });

    it('may be declined: nothing is returned and no power is changed', () => {
      const g = start();
      decline(g);
      expect(don(g, 'p1').deck).toBe(3);
      expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
      expectDecision(g, 'main', 'p1');
    });
  });

  describe('[Activate: Main] ramp', () => {
    const board = (leader: string, active: number, donDeck?: number) =>
      game(
        {
          leader,
          characters: ['OP16-065'],
          costArea: { active, rested: 0 },
          ...(donDeck === undefined ? {} : { donDeck }),
        },
        { leader: PLAIN_BLUE },
      );
    const ramp = (g: ReturnType<typeof board>) =>
      g.act({ type: 'activate', card: g.find('p1', 'characters', 'OP16-065'), ability: 'ramp' });

    it('rests 1 DON!! and adds up to 2 active DON!! with a {Navy} Leader, once per turn', () => {
      const g = board(ROSI, 2);
      ramp(g);
      payDon(g);
      expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 1, deck: 6 });
      expect(g.legal().some((a) => a.type === 'activate' && a.ability === 'ramp')).toBe(false);
    });

    it('adds only what the DON!! deck holds ("up to")', () => {
      const g = board(ROSI, 9, 1);
      ramp(g);
      payDon(g);
      expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1, deck: 0 });
    });

    it('with a Leader that is not {Navy} the cost is paid and nothing is added', () => {
      const g = board('ST03-001', 2);
      ramp(g);
      payDon(g);
      expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1, deck: 8 });
    });

    it('is not offered with no active DON!! to rest', () => {
      const g = board(ROSI, 0);
      expect(g.legal().some((a) => a.type === 'activate' && a.ability === 'ramp')).toBe(false);
    });
  });
});
