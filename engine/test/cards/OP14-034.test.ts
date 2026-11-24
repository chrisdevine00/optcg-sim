/** OP14-034 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { accept, decline, expectDecision, pick, V } from './helpers.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { canPick } from './helpers-w3s.ts';
import { G5, mk, SHC_G3, SHC_G4, SHC_G5, SHC_R4 } from './helpers-op14g1.ts';

const ID = 'OP14-034';
const koOne = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };
const chars = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);

describe('OP14-034 Monkey.D.Luffy', () => {
  const board = [ID, SHC_G4, SHC_G5, SHC_G3, SHC_R4];

  it('[Your Turn]: green {Straw Hat Crew} Characters with a base cost of 4 or more gain +1000 power', () => {
    const g = mk({ characters: board });
    expect(g.power(g.find('p1', 'characters', SHC_G4))).toBe(7000); // cost 4 boundary
    expect(g.power(g.find('p1', 'characters', SHC_G5))).toBe(8000);
  });

  it('must not boost cost 3, a red {Straw Hat Crew}, a green non-{Straw Hat Crew} (second board), nor Luffy himself (cost 3)', () => {
    const g = mk({ characters: board });
    expect(g.power(g.find('p1', 'characters', SHC_G3))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', SHC_R4))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(3000);
    const h = mk({ characters: [ID, G5] });
    expect(h.power(h.find('p1', 'characters', G5))).toBe(7000); // green but not {Straw Hat Crew}
  });

  it("must not apply on the opponent's turn", () => {
    const g = mk({ characters: board }, {}, { turn: 4, activePlayer: 'p2' });
    expect(g.power(g.find('p1', 'characters', SHC_G4))).toBe(6000);
  });

  describe("[Once Per Turn] instead of a {Straw Hat Crew} Character being K.O.'d by the opponent's effect", () => {
    const byOpponent = (target: string) => {
      const g = mk({ characters: [ID, SHC_R4, V.c4] }, {}, { turn: 4, activePlayer: 'p2' });
      plantOpponentEffect(g, koOne);
      pick(g, [g.find('p1', 'characters', target)]);
      return g;
    };

    it('you may rest 1 of your Characters instead: the Character stays, the chosen one is rested', () => {
      const g = byOpponent(SHC_R4);
      expectDecision(g, 'optional', 'p1');
      accept(g);
      expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true);
      pick(g, [g.find('p1', 'characters', V.c4)]);
      expect(chars(g)).toContain(SHC_R4);
      expect(g.card(g.find('p1', 'characters', V.c4)).rested).toBe(true);
      expect(g.card(g.find('p1', 'characters', SHC_R4)).rested).toBe(false);
    });

    it('covers Luffy himself (a {Straw Hat Crew}); may be declined', () => {
      const g = byOpponent(ID);
      accept(g);
      pick(g, [g.find('p1', 'characters', V.c4)]);
      expect(chars(g)).toContain(ID);
      const h = byOpponent(SHC_R4);
      decline(h);
      expect(chars(h)).not.toContain(SHC_R4);
    });

    it('must not cover a Character that is not {Straw Hat Crew}', () => {
      const g = byOpponent(V.c4);
      expectDecision(g, 'main', 'p2');
      expect(chars(g)).not.toContain(V.c4);
    });

    it('must not cover your own effect, nor a bounce (K.O. only)', () => {
      const g = mk({ characters: [ID, SHC_R4] }, {}, { turn: 4, activePlayer: 'p2' });
      g.state = applyOp(g.state, {
        op: 'ko',
        card: g.find('p1', 'characters', SHC_R4),
        by: 'p1',
      }).state;
      expect(chars(g)).not.toContain(SHC_R4);
      const h = mk({ characters: [ID, SHC_R4] }, {}, { turn: 4, activePlayer: 'p2' });
      plantOpponentEffect(h, {
        move: {
          what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
          to: { zone: 'hand' },
        },
      });
      pick(h, [h.find('p1', 'characters', SHC_R4)]);
      expectDecision(h, 'main', 'p2');
      expect(chars(h)).not.toContain(SHC_R4);
    });

    it('Once Per Turn: the second K.O. in the same turn is not replaced', () => {
      const g = mk({ characters: [ID, SHC_R4, SHC_G5, V.c4] }, {}, { turn: 4, activePlayer: 'p2' });
      plantOpponentEffect(g, koOne);
      pick(g, [g.find('p1', 'characters', SHC_R4)]);
      accept(g);
      pick(g, [g.find('p1', 'characters', V.c4)]);
      g.act({ type: 'activate', card: g.leader('p2'), ability: 'planted' });
      pick(g, [g.find('p1', 'characters', SHC_G5)]);
      expectDecision(g, 'main', 'p2');
      expect(chars(g)).not.toContain(SHC_G5);
    });
  });
});
