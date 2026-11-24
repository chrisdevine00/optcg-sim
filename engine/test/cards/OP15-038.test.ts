/** OP15-038 It's an Order! Do Not Defy Me!!! */
import { describe, expect, it } from 'vitest';
import { BLUE, PURPLE, V, endCounter, expectDecision, none, pick, play } from './helpers.ts';
import { choices, mk, rested } from './helpers-w4sa.ts';

const ID = 'OP15-038';
const KRIEG = 'OP15-008';
/** Purple vanilla Character, cost 10, 12000 power. */
const COST10 = 'P-041';

describe("OP15-038 It's an Order! Do Not Defy Me!!!", () => {
  describe('[Main] a rested Character (cost 8 or less, 2+ DON!! given) will not become active', () => {
    // Costs: BLUE 1, V.c7 7, KRIEG 8.
    const start = (chars: unknown[]) => mk({ hand: [ID] }, { characters: chars as never });
    const id = (g: ReturnType<typeof start>, c: string) => g.find('p2', 'characters', c);

    it('offers only rested Characters with 2 or more DON!! and a cost of 8 or less', () => {
      const g = start([
        rested(BLUE, { don: 2 }),
        rested(PURPLE, { don: 1 }),
        { card: V.c1, don: 2 },
        rested(KRIEG, { don: 2 }),
        rested(V.c7, { don: 3 }),
      ]);
      play(g, ID);
      expectDecision(g, 'choose', 'p1');
      expect(choices(g).sort()).toEqual([id(g, BLUE), id(g, KRIEG), id(g, V.c7)].sort());
    });

    it('a cost-10 Character is out; a cost-8 Character is in (the nearest vanilla above 8 is 10)', () => {
      const g = start([rested(COST10, { don: 2 }), rested(KRIEG, { don: 2 })]);
      play(g, ID);
      expect(choices(g)).toEqual([id(g, KRIEG)]);
    });

    it('the chosen Character stays rested through the next Refresh; the others untap', () => {
      const g = start([rested(BLUE, { don: 2 }), rested(V.c7, { don: 2 }), rested(PURPLE)]);
      play(g, ID);
      pick(g, [id(g, BLUE)]);
      g.act({ type: 'endTurn' });
      expect(g.card(id(g, BLUE)).rested).toBe(true);
      expect(g.card(id(g, V.c7)).rested).toBe(false);
      expect(g.card(id(g, PURPLE)).rested).toBe(false);
    });

    it('"up to 1": none may be chosen', () => {
      const g = start([rested(BLUE, { don: 2 })]);
      play(g, ID);
      none(g);
      g.act({ type: 'endTurn' });
      expect(g.card(id(g, BLUE)).rested).toBe(false);
    });
  });

  describe('[Counter] up to 1 of your [Krieg] cards gains +4000', () => {
    it('gives a Krieg Leader +4000 during the battle', () => {
      const g = mk({ leader: 'OP15-001', hand: [ID] }, { characters: [V.c7] });
      g.act({ type: 'endTurn' });
      g.act({
        type: 'attack',
        attacker: g.find('p2', 'characters', V.c7),
        target: g.leader('p1'),
      });
      g.act({ type: 'block', blocker: null });
      expectDecision(g, 'counter', 'p1');
      g.act({ type: 'activate', card: g.find('p1', 'hand', ID), ability: 'counter' });
      expect(choices(g)).toContain(g.leader('p1'));
      pick(g, [g.leader('p1')]);
      endCounter(g);
      // Leader 5000 +4000 beats the 3000 attacker: no Life lost.
      expect(g.zone('p1', 'life')).toHaveLength(3);
    });

    it('offers no card that is not named Krieg', () => {
      const g = mk(
        { leader: 'OP15-001', hand: [ID], characters: [BLUE, KRIEG] },
        { characters: [PURPLE] },
      );
      g.act({ type: 'endTurn' });
      g.act({
        type: 'attack',
        attacker: g.find('p2', 'characters', PURPLE),
        target: g.leader('p1'),
      });
      g.act({ type: 'block', blocker: null });
      g.act({ type: 'activate', card: g.find('p1', 'hand', ID), ability: 'counter' });
      expect(choices(g).sort()).toEqual([g.leader('p1'), g.find('p1', 'characters', KRIEG)].sort());
    });
  });
});
