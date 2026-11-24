/** OP14-024 Kin'emon. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, none, option, pick, play, setMost, V } from './helpers.ts';
import { canPick, koBy } from './helpers-w3s.ts';
import { mk, restedCard } from './helpers-op14g1.ts';

const ID = 'OP14-024';

describe("OP14-024 Kin'emon", () => {
  const played = (restedDon = 6) =>
    mk({ hand: [ID, V.c1], costArea: { active: 4, rested: restedDon } });

  it('[On Play]: sets up to 3 DON!! as active', () => {
    const g = played();
    play(g, ID); // pays 4: 0 active, 10 rested
    setMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 7 });
  });

  it('"up to 3": a count is asked, most first; 1 sets one, 0 none, the restriction still applies (OP14-R2)', () => {
    const g = played();
    play(g, ID);
    expect(expectDecision(g, 'choose', 'p1').options!.map((o) => o.id)).toEqual([
      '3',
      '2',
      '1',
      '0',
    ]);
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 9 });
    expect(g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', V.c1), player: 'p1' })).toBe(
      false,
    );
    const h = played();
    play(h, ID);
    option(h, '0');
    expect(don(h, 'p1')).toMatchObject({ active: 0, rested: 10 });
  });

  it('with fewer than 3 rested DON!! sets what there is', () => {
    const g = played(0); // 4 active DON!!, all paid: 4 rested
    play(g, ID);
    setMost(g);
    expect(don(g, 'p1').active).toBe(3);
    const h = mk({ hand: [ID], costArea: { active: 4, rested: 0 } });
    play(h, ID);
    setMost(h);
    expect(don(h, 'p1')).toMatchObject({ active: 3, rested: 1 });
  });

  it('then you cannot play Character cards this turn', () => {
    const g = played();
    play(g, ID);
    setMost(g);
    expect(g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', V.c1), player: 'p1' })).toBe(
      false,
    );
  });

  it('the restriction ends with the turn: Characters can be played next turn', () => {
    const g = played();
    play(g, ID);
    setMost(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', V.c1), player: 'p1' })).toBe(
      true,
    );
  });

  it("[On K.O.]: rests up to 1 of the opponent's cards (Leader, Character or Stage)", () => {
    const g = mk({ characters: [ID] }, { characters: [V.c2], stage: 'OP02-070' });
    koBy(g, 'p1', ID, 'p2');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p2'))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.find('p2', 'stage', 'OP02-070'))).toBe(true);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(true);
    expect(g.card(g.leader('p2')).rested).toBe(false);
  });

  it('[On K.O.] "up to 1": may rest nothing; an already rested card is not a candidate', () => {
    const g = mk({ characters: [ID] }, { characters: [restedCard(V.c2)] });
    koBy(g, 'p1', ID, 'p2');
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
    none(g);
    expect(g.card(g.leader('p2')).rested).toBe(false);
  });
});
