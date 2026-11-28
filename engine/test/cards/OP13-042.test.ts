/** OP13-042 Edward.Newgate. */
import { describe, expect, it } from 'vitest';
import { don, hand, pick, play, trash } from './helpers.ts';
import { canPick, dec, expectDecision, mk, settle, V } from './helpers-op13g2.ts';

const ID = 'OP13-042';

// Edward costs 10: all 10 DON!! are rested afterwards, so every DON!! given is a rested one.
const start = (chars: string[] = [V.c2]) =>
  mk({ hand: [ID, V.c1, V.c3], characters: chars, costArea: { active: 10, rested: 0 } });

describe('OP13-042 Edward.Newgate', () => {
  it('[On Play]: draws 2, trashes 1 from hand (your choice, the drawn cards included)', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(4); // 2 in hand + 2 drawn
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toHaveLength(3);
  });

  it('then gives your Leader and 1 Character 2 rested DON!! each', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expectDecision(g, 'choose', 'p1'); // which Character
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    settle(g); // most first, 2 each
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(g.card(g.find('p1', 'characters', V.c2)).don).toBe(2);
    expect(g.card(g.find('p1', 'characters', ID)).don).toBe(0);
    expect(don(g, 'p1').rested).toBe(6);
  });

  it('"up to 2": a smaller count can be given to each target', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    const d = expectDecision(g, 'choose', 'p1');
    // "Up to 2 ... each" with no target pick: 0 is offered too (OP-18 review R8, E-Q11).
    expect(d.options!.map((o) => o.label)).toEqual(['2 DON!!', '1 DON!!', 'None']);
    g.act({ type: 'pick', choice: { option: d.options![1]!.id } });
    expect(g.card(g.leader('p1')).don).toBe(1);
    const e = expectDecision(g, 'choose', 'p1');
    g.act({ type: 'pick', choice: { option: e.options!.at(-1)!.id } }); // none to the Character
    expect(g.card(g.find('p1', 'characters', V.c2)).don).toBe(0);
  });

  it('with no other Character, Edward himself is the one Character that gets the DON!!', () => {
    const g = start([]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    settle(g);
    expect(g.card(g.find('p1', 'characters', ID)).don).toBe(2);
    expect(g.card(g.leader('p1')).don).toBe(2);
  });

  it('[Blocker]: can block an attack on your Leader', () => {
    const g = mk(
      { characters: [ID], costArea: { active: 0, rested: 0 } },
      { characters: [V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expect(dec(g)?.kind).toBe('block');
    expect(
      g.isLegal({ type: 'block', blocker: g.find('p1', 'characters', ID), player: 'p1' }),
    ).toBe(true);
  });
});
