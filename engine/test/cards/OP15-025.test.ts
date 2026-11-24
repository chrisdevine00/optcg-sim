/** OP15-025 Kuro. */
import { describe, expect, it } from 'vitest';
import { BLUE, PURPLE, V, don, expectDecision, none, option, pick, play } from './helpers.ts';
import { choices, mk, rested } from './helpers-w4sa.ts';

const ID = 'OP15-025';

describe('OP15-025 Kuro', () => {
  // BLUE: rested, 1 DON!! (3 after the give). PURPLE: rested, 3. V.c1: active, 3.
  const chars = () => [
    rested(BLUE, { don: 1 }),
    rested(PURPLE, { don: 3 }),
    { card: V.c1, don: 3 },
  ];
  const start = (costArea = { active: 0, rested: 3 }) =>
    mk({ hand: [ID] }, { characters: chars() as never, costArea });
  const id = (g: ReturnType<typeof start>, c: string) => g.find('p2', 'characters', c);

  it('[Blocker] is printed', () => {
    const g = start();
    play(g, ID);
    expect(g.card(g.find('p1', 'characters', ID)).card).toBe(ID);
  });

  describe('[On Play] give up to 2 DON!! from the opponent’s cost area', () => {
    it('asks a count (2 most) and a target, and gives that many', () => {
      const g = start();
      play(g, ID);
      expect(expectDecision(g, 'choose').options!.map((o) => o.id)).toEqual(['2', '1', '0']);
      option(g, '2');
      pick(g, [id(g, BLUE)]);
      expect(g.card(id(g, BLUE)).don).toBe(3);
      expect(don(g, 'p2')).toMatchObject({ rested: 1 });
    });

    it('a count of 0 gives nothing', () => {
      const g = start();
      play(g, ID);
      option(g, '0');
      expect(g.card(id(g, BLUE)).don).toBe(1);
    });

    it('with active and rested DON!! the giver picks the kind', () => {
      const g = start({ active: 1, rested: 2 });
      play(g, ID);
      option(g, '2');
      expectDecision(g, 'choose', 'p1');
      g.act({ type: 'pick', choice: { from: 'costActive' } });
      g.act({ type: 'pick', choice: { from: 'costRested' } });
      pick(g, [id(g, BLUE)]);
      expect(don(g, 'p2')).toMatchObject({ active: 0, rested: 1 });
    });
  });

  describe('then at the end of this turn: a rested Character with 3 or more DON!! given stays rested', () => {
    const toEnd = (g: ReturnType<typeof start>, target: string) => {
      play(g, ID);
      option(g, '2');
      pick(g, [id(g, target)]);
      g.act({ type: 'endTurn' });
    };

    it('offers only rested Characters with 3 or more DON!! (read at the end of the turn)', () => {
      const g = start();
      toEnd(g, BLUE); // BLUE now has 3
      expectDecision(g, 'choose', 'p1');
      expect(choices(g).sort()).toEqual([id(g, BLUE), id(g, PURPLE)].sort());
    });

    it('the chosen Character does not become active in the opponent’s next Refresh; the others do', () => {
      const g = start();
      toEnd(g, BLUE);
      pick(g, [id(g, BLUE)]);
      expect(g.card(id(g, BLUE)).rested).toBe(true);
      expect(g.card(id(g, PURPLE)).rested).toBe(false);
    });

    it('2 DON!! given is one short of the threshold (boundary): only the Character already at 3', () => {
      const g = start();
      play(g, ID);
      option(g, '1');
      pick(g, [id(g, BLUE)]);
      expect(g.card(id(g, BLUE)).don).toBe(2);
      g.act({ type: 'endTurn' });
      expect(choices(g)).toEqual([id(g, PURPLE)]);
    });

    it('"up to 1": none may be chosen, and the Characters untap as usual', () => {
      const g = start();
      toEnd(g, BLUE);
      none(g);
      expect(g.card(id(g, BLUE)).rested).toBe(false);
    });

    it('is not conditional on the give: with a count of 0 the 3-DON!! Character is still a candidate', () => {
      const g = start();
      play(g, ID);
      option(g, '0');
      g.act({ type: 'endTurn' });
      expect(choices(g)).toEqual([id(g, PURPLE)]);
    });
  });
});
