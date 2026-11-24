/** OP11-096 Ripper. */
import { describe, expect, it } from 'vitest';
import { expectDecision, V } from './helpers.ts';
import { canBlockWith, mk, NAVY_B1, NAVY_BLUE5 } from './helpers-op11g3.ts';

const ID = 'OP11-096';

describe('OP11-096 Ripper', () => {
  const kw = (chars: string[]) => {
    const g = mk({ characters: [ID, ...chars] });
    return g.card(g.find('p1', 'characters', ID)).keywords;
  };

  it('gains [Blocker] with a black "Navy" Character other than [Ripper]', () => {
    expect(kw([NAVY_B1])).toContain('Blocker');
  });

  it('alone, or with a black non-Navy Character, it has no [Blocker]', () => {
    expect(kw([])).not.toContain('Blocker');
    expect(kw([V.c3])).not.toContain('Blocker');
  });

  it('a non-black "Navy" Character does not count', () => {
    expect(kw([NAVY_BLUE5])).not.toContain('Blocker');
  });

  it('another [Ripper] does not count (other than [Ripper] is by name)', () => {
    expect(kw([ID])).not.toContain('Blocker');
  });

  it('the Leader is not a Character: a black "Navy" Leader alone does not give [Blocker]', () => {
    const g = mk({ leader: 'ST06-001', characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Blocker');
  });

  it('with the condition met it can actually block', () => {
    const g = mk(
      { characters: [ID, NAVY_B1] },
      { characters: [V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
    expect(canBlockWith(g, g.find('p1', 'characters', ID))).toBe(true);
  });
});
