/**
 * RL-18 Blocker timing relative to attack triggers and Counter.
 * rulings.md RL-18 (CR 7-1-1-3, 7-1-2-1..7-1-2-3, 7-1-3-1, 10-1-4-1, 10-2-16-1).
 *
 * The parts without card effects: the Block Step comes before the Counter Step and does not come
 * back; a rested [Blocker] is not offered; a Blocker can then be countered.
 * Cards: OP09-072 Franky (Purple, 5000, [Blocker], on the field from the start);
 * OP02-084 Blugori (vanilla, Counter +1000); OP02-006 Kingdew (vanilla, 7000).
 */
import { describe, expect, it } from 'vitest';
import { scenario } from '../../fixtures/index.ts';
import { act, attack, blockers, decision, FILL, fill, isLegal, K, L, V } from '../helpers.ts';

function g0(frankyRested: boolean) {
  return scenario({
    p1: {
      leader: L.redLuffy,
      characters: [V.kingdew],
      life: fill(FILL.red, 5),
      deck: fill(FILL.red, 10),
    },
    p2: {
      leader: L.purpleKaido,
      characters: [{ card: K.blockerFranky, rested: frankyRested }],
      hand: [V.blugori],
      life: fill(FILL.purple, 5),
      deck: fill(FILL.purple, 10),
    },
  });
}

describe('RL-18: Block Step then Counter Step', () => {
  it('RL-18: the block decision comes before the counter decision, and is not offered again', () => {
    const g = g0(false);
    attack(g, g.find('p1', 'characters', V.kingdew), g.leader('p2'));
    expect(decision(g)).toMatchObject({ kind: 'block', player: 'p2' });
    act(g, { type: 'block', blocker: null });
    expect(decision(g)).toMatchObject({ kind: 'counter', player: 'p2' });
    // The Blocker is still active, but the Block Step is over.
    const franky = g.find('p2', 'characters', K.blockerFranky);
    expect(isLegal(g, { type: 'block', blocker: franky })).toBe(false);
  });

  it('RL-18: a rested [Blocker] is not offered', () => {
    const g = g0(true);
    attack(g, g.find('p1', 'characters', V.kingdew), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('RL-18 (QA-GR "[Blocker] … use a Counter"): a Blocker can be countered', () => {
    const g = g0(false);
    const franky = g.find('p2', 'characters', K.blockerFranky);
    attack(g, g.find('p1', 'characters', V.kingdew), g.leader('p2'));
    act(g, { type: 'block', blocker: franky });
    act(g, { type: 'counter', card: g.find('p2', 'hand', V.blugori), target: franky });
    expect(g.power(franky)).toBe(6000);
    act(g, { type: 'endCounter' });
    // 7000 ≥ 6000: Franky is still K.O.'d.
    expect(
      g
        .zone('p2', 'trash')
        .map((c) => c.card)
        .sort(),
    ).toEqual([K.blockerFranky, V.blugori].sort());
  });

  it.todo(
    'RL-18: [When Attacking] → [On Your Opponent’s Attack] → block → counter (needs M4 effects)',
  );
  it.todo(
    'RL-18 (QA-OP01 OP01-057, QA-OP04 OP04-035): a Blocker set active by a [Counter] Event cannot block in that battle (needs M4 effects)',
  );
  it.todo(
    'RL-18 (QA-OP13 OP13-001): [On Your Opponent’s Attack] is decided before any Counter (needs M4 effects)',
  );
});
