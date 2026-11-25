/** PRB02-005 Monkey.D.Luffy (Character, cost 4, 5000). */
import { describe, expect, it } from 'vitest';
import { internals } from '../../src/testing.ts';
import { dec, don, game, payDon, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';

const ID = 'PRB02-005';
const MULTI = 'OP12-041'; // a Blue/Purple Leader (its abilities are not used here)

const mk = (oppDon = 5, leader: string = MULTI) =>
  game(
    { leader, hand: [ID, V.c4], costArea: { active: 6, rested: 0 } },
    { leader: PLAIN_PURPLE, characters: [V.c2], costArea: { active: oppDon, rested: 0 } },
  );
const playIt = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
const active = (g: ReturnType<typeof mk>) => internals(g.state).active;
/** p1 ends the turn; p2's refresh, draw and DON!! Phase come, then the Main Phase starts. */
const toOppMain = (g: ReturnType<typeof mk>) => {
  g.act({ type: 'endTurn' });
};

describe('PRB02-005 Monkey.D.Luffy', () => {
  describe('[Your Turn] [On Play] if your Leader is multicolored and your opponent has 7 or less DON!!, they rest 1 active DON!! at the start of their next Main Phase', () => {
    it('does nothing when played, and rests 1 active DON!! when their Main Phase starts', () => {
      const g = mk();
      playIt(g);
      expect(don(g, 'p2')).toMatchObject({ active: 5, rested: 0 });
      expect(internals(g.state).delayed).toHaveLength(1);
      toOppMain(g);
      expect(active(g)).toBe('p2');
      // The opponent chooses which active DON!! to rest: one class, one answer.
      expect(dec(g)).toMatchObject({ kind: 'choose', player: 'p2' });
      expect(don(g, 'p2')).toMatchObject({ active: 7, rested: 0 }); // refreshed, 2 added, not yet rested
      payDon(g);
      expect(dec(g)?.kind).toBe('main');
      expect(don(g, 'p2')).toMatchObject({ active: 6, rested: 1 });
      expect(internals(g.state).delayed).toHaveLength(0);
    });

    it('7 DON!! when played counts ("7 or less")', () => {
      const g = mk(7);
      playIt(g);
      expect(internals(g.state).delayed).toHaveLength(1);
    });

    it('8 or more DON!! when played: nothing is set up', () => {
      const g = mk(8);
      playIt(g);
      expect(internals(g.state).delayed).toHaveLength(0);
      toOppMain(g);
      expect(dec(g)?.kind).toBe('main');
      expect(don(g, 'p2').rested).toBe(0);
    });

    it('is read when played: the opponent with 8 or more at the start of their Main Phase still rests one (official PRB02 Q&A)', () => {
      const g = mk(7); // 7 now; 9 after their DON!! Phase
      playIt(g);
      toOppMain(g);
      payDon(g);
      expect(don(g, 'p2')).toMatchObject({ active: 8, rested: 1 });
    });

    it('a Leader that is not multicolored: nothing is set up', () => {
      const g = mk(5, PLAIN_BLUE);
      playIt(g);
      expect(internals(g.state).delayed).toHaveLength(0);
      toOppMain(g);
      expect(dec(g)?.kind).toBe('main');
      expect(don(g, 'p2').rested).toBe(0);
    });

    it('happens once: not at p1’s next Main Phase, nor the opponent’s turn after', () => {
      const g = mk();
      playIt(g);
      toOppMain(g);
      payDon(g);
      g.act({ type: 'endTurn' }); // p2 passes
      expect(dec(g)).toMatchObject({ kind: 'main', player: 'p1' });
      g.act({ type: 'endTurn' });
      expect(dec(g)).toMatchObject({ kind: 'main', player: 'p2' }); // no prompt this time
    });
  });
});
