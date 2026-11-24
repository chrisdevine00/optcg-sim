/** OP15-070 Fuza. */
import { describe, expect, it } from 'vitest';
import { game, PLAIN_BLUE, V } from './helpers.ts';
import { canBlockWith, DRESSROSA_LEADER, SHURA } from './helpers-op15g2.ts';

const ID = 'OP15-070';

describe('OP15-070 Fuza', () => {
  const board = (turn: number, who: 'p1' | 'p2', extra: string[] = []) =>
    game(
      { leader: DRESSROSA_LEADER, characters: [ID, SHURA, V.c1, ...extra] },
      { leader: PLAIN_BLUE, characters: [] },
      { turn, activePlayer: who },
    );
  const kw = (g: ReturnType<typeof board>, c: string) =>
    g.card(g.find('p1', 'characters', c)).keywords;
  const power = (g: ReturnType<typeof board>, c: string) => g.power(g.find('p1', 'characters', c));

  it('Fuza and your [Shura] cards gain [Unblockable]; other Characters do not', () => {
    const g = board(3, 'p1');
    expect(kw(g, ID)).toContain('Unblockable');
    expect(kw(g, SHURA)).toContain('Unblockable');
    expect(kw(g, V.c1)).not.toContain('Unblockable');
  });

  it('[Unblockable] is real: the opponent Blocker cannot block Fuza', () => {
    const g = game(
      { leader: DRESSROSA_LEADER, characters: [ID] },
      { leader: PLAIN_BLUE, characters: ['ST10-010'] },
    );
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expect(g.legal().some((a) => a.type === 'block' && a.blocker !== null)).toBe(false);
    expect(canBlockWith(g, g.find('p2', 'characters', 'ST10-010'))).toBe(false);
  });

  it('on your own turn the base powers are printed (Fuza 4000, Shura 2000)', () => {
    const g = board(3, 'p1');
    expect(power(g, ID)).toBe(4000);
    expect(power(g, SHURA)).toBe(2000);
  });

  it("[Opponent's Turn] Fuza's and all [Shura] cards' base power become 6000; others unchanged", () => {
    const g = board(4, 'p2', [SHURA]);
    expect(power(g, ID)).toBe(6000);
    const shuras = g.zone('p1', 'characters').filter((c) => c.card === SHURA);
    expect(shuras).toHaveLength(2);
    for (const s of shuras) expect(g.power(s.instance)).toBe(6000);
    expect(power(g, V.c1)).toBe(3000);
  });

  it('on the opponent turn the Unblockable keyword still applies to the group', () => {
    const g = board(4, 'p2');
    expect(kw(g, SHURA)).toContain('Unblockable');
  });
});
