/** OP04-083 Sabo. */
import { describe, expect, it } from 'vitest';
import {
  expectDecision,
  game,
  passBlock,
  endCounter,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { idsOf, NAVY_LEADER, P2000_A, P2000_B } from './helpers-stg2.ts';

const ID = 'OP04-083';
const HACK = 'ST35-001'; // [On Play] K.O. up to 1 of your opponent's Characters with 2000 base power or less

/** p1 plays Sabo (6 DON!!): p1 holds the two cards drawn, trashes those two. */
const sabo = (p1Chars: (string | { card: string; rested: boolean })[] = [P2000_A]) => {
  const g = game(
    {
      leader: NAVY_LEADER,
      hand: [ID, P2000_B],
      deck: [V.c1, V.c2, V.c3, V.c3, V.c3, V.c3],
      characters: p1Chars,
      costArea: { active: 6, rested: 0 },
    },
    {
      leader: PLAIN_BLUE,
      characters: [V.c6],
      hand: [HACK, HACK],
      costArea: { active: 8, rested: 0 },
    },
  );
  play(g, ID);
  pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
  expectDecision(g, 'main', 'p1');
  return g;
};

describe('OP04-083 Sabo', () => {
  it('has [Blocker]; [On Play] draws 2 and trashes 2 cards from hand', () => {
    const g = sabo();
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
    expect(idsOf(g, 'p1', 'trash').sort()).toEqual([V.c1, V.c2].sort());
    expect(idsOf(g, 'p1', 'hand')).toEqual([P2000_B]);
  });

  it("your Characters cannot be K.O.'d by the opponent's effects during their turn", () => {
    const g = sabo();
    g.act({ type: 'endTurn' });
    play(g, HACK);
    pick(g, [g.find('p1', 'characters', P2000_A)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([P2000_A, ID]);
    expectDecision(g, 'main', 'p2');
  });

  it('battle K.O. still works (protection is against effects only)', () => {
    const g = sabo([{ card: P2000_A, rested: true }]);
    g.act({ type: 'endTurn' });
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c6),
      target: g.find('p1', 'characters', P2000_A),
    });
    passBlock(g);
    endCounter(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(idsOf(g, 'p1', 'trash')).toContain(P2000_A);
  });

  it('a Character played after Sabo resolved is not covered', () => {
    const g = sabo();
    play(g, P2000_B);
    g.act({ type: 'endTurn' });
    play(g, HACK);
    pick(g, [g.find('p1', 'characters', P2000_B)]);
    expect(idsOf(g, 'p1', 'characters').sort()).toEqual([P2000_A, ID].sort());
    expect(idsOf(g, 'p1', 'trash')).toContain(P2000_B);
  });

  it("it lasts until the start of your next turn: on the opponent's following turn effects K.O. again", () => {
    const g = sabo();
    g.act({ type: 'endTurn' }); // p2's turn: protected
    play(g, HACK);
    pick(g, [g.find('p1', 'characters', P2000_A)]);
    expect(idsOf(g, 'p1', 'characters')).toContain(P2000_A);
    g.act({ type: 'endTurn' }); // p1's turn: the protection has ended
    g.act({ type: 'endTurn' }); // p2's next turn
    play(g, HACK);
    pick(g, [g.find('p1', 'characters', P2000_A)]);
    expect(idsOf(g, 'p1', 'characters')).not.toContain(P2000_A);
    expect(idsOf(g, 'p1', 'trash')).toContain(P2000_A);
  });
});
