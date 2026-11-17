/** OP17-079 Monkey.D.Luffy (Leader). RL-43, QA-OP17 OP17-079 (two rows). */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, PLAIN_BLUE, V } from './helpers.ts';
import { ELBAPH, ELBAPH_LEADER, GIANT, negate, setCostMod } from './helpers-sabo.ts';

/** P2 (turn 4) attacks P1's Leader; returns the Characters P1 may block with. */
function blockers(
  setup: (g: ReturnType<typeof build>) => void = () => {},
  p1Leader = ELBAPH_LEADER,
) {
  const g = build(p1Leader);
  setup(g);
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  if (g.legal().some((a) => a.type === 'optional')) g.act({ type: 'optional', accept: false });
  expectDecision(g, 'block', 'p1');
  const offered = g.legal().flatMap((a) => (a.type === 'block' && a.blocker ? [a.blocker] : []));
  return { g, offered };
}

function build(p1Leader: string) {
  return game(
    { leader: p1Leader, characters: [GIANT, V.c3, ELBAPH], life: [BLUE, BLUE, BLUE] },
    { leader: PLAIN_BLUE, characters: [V.c7] },
    { turn: 4, activePlayer: 'p2' },
  );
}

describe('OP17-079 Monkey.D.Luffy', () => {
  it('Characters with a cost of 12 or more have [Blocker] (current cost, including modifiers)', () => {
    const { g, offered } = blockers();
    // Giant: 4 + 12 = 16. Rodo: 1 + 12 = 13 (the Leader is Elbaph). The cost 3 Character is not.
    expect(g.card(g.find('p1', 'characters', GIANT)).keywords).toContain('Blocker');
    expect(g.card(g.find('p1', 'characters', V.c3)).keywords).not.toContain('Blocker');
    expect(offered).toContain(g.find('p1', 'characters', GIANT));
    expect(offered).toContain(g.find('p1', 'characters', ELBAPH));
    expect(offered).not.toContain(g.find('p1', 'characters', V.c3));
  });

  it("only your own Characters gain it: an opponent's cost 12 Character is not given [Blocker]", () => {
    const g = game(
      { leader: ELBAPH_LEADER, characters: [V.c3] },
      { leader: PLAIN_BLUE, characters: [GIANT] },
    );
    expect(g.card(g.find('p2', 'characters', GIANT)).keywords).not.toContain('Blocker');
  });

  it('QA-OP17 OP17-079 row 1: negating the Leader removes [Blocker] from the Characters', () => {
    const { offered } = blockers((g) => negate(g, g.leader('p1'), 'p2', 4));
    expect(offered).toEqual([]);
  });

  it("QA-OP17 OP17-079 row 2: negating a Character's own +12 drops it below 12 and it loses [Blocker]", () => {
    const { g, offered } = blockers((x) => negate(x, x.find('p1', 'characters', GIANT), 'p2', 4));
    // Giant is back to its printed cost 4: no Blocker. Rodo's +12 is its own and still applies.
    expect(offered).not.toContain(g.find('p1', 'characters', GIANT));
    expect(offered).toContain(g.find('p1', 'characters', ELBAPH));
  });

  it("QA-OP17 OP17-079 row 2: a Character that reaches cost 12 by another card's effect keeps [Blocker] when its own effects are negated", () => {
    const { g, offered } = blockers((x) => {
      const seven = x.find('p1', 'characters', V.c3);
      setCostMod(x, seven, 9, 'p1', 4);
      negate(x, seven, 'p2', 4);
    });
    expect(offered).toContain(g.find('p1', 'characters', V.c3));
  });

  it("negating Rodo's own +12 (with an {Elbaph} Leader) drops it below 12 and it loses [Blocker]", () => {
    const { g, offered } = blockers((x) => negate(x, x.find('p1', 'characters', ELBAPH), 'p2', 4));
    expect(offered).not.toContain(g.find('p1', 'characters', ELBAPH));
    expect(offered).toContain(g.find('p1', 'characters', GIANT));
  });

  it('blocking with the granted [Blocker] redirects the attack onto that Character', () => {
    const { g } = blockers();
    const giant = g.find('p1', 'characters', GIANT);
    g.act({ type: 'block', blocker: giant });
    expect(g.card(giant).rested).toBe(true);
    expect(g.life('p1')).toBe(3);
  });
});
