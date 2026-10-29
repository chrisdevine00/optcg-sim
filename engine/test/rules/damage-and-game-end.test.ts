/** CR 4-6 (damage), 10-1-5 ([Trigger]), 1-2 and 9 (game end, rule processing), 11-1 (loops). */
import { describe, expect, it } from 'vitest';
import { queries, reduce } from '../../src/index.ts';
import { scenario } from '../fixtures/index.ts';
import {
  endTurn,
  force,
  give,
  KAIDO,
  LUFFY,
  noDefence,
  op,
  PUR_1,
  PUR_1B,
  RED_1,
  times,
  types,
  takeDamage,
} from '../support/game.ts';

describe('damage and [Trigger] (CR 4-6, 10-1-5)', () => {
  const hit = (life: string[], hand: string[] = []) => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, life, hand } });
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    noDefence(g);
    return g;
  };

  it('E-D8: an unscripted [Trigger] is not offered; the card goes to hand', () => {
    // OP05-011 has printed [Trigger] text but no script.
    const g = hit(['OP05-011', PUR_1]);
    expect(queries.decision(g.state)).toMatchObject({ kind: 'main', player: 'p1' });
    expect(g.zone('p2', 'hand').map((c) => c.card)).toEqual(['OP05-011']);
  });

  it('CR 4-6-3 / 10-1-5-1: a scripted [Trigger] is offered during damage processing', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, life: [PUR_1B, PUR_1] } });
    give(g, PUR_1B, [{ id: 't', kind: 'trigger', effect: [{ op: 'emit', label: 'trigger' }] }]);
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    noDefence(g);
    expect(queries.decision(g.state)).toMatchObject({ kind: 'trigger', player: 'p2' });
    expect(queries.turn(g.state).battleStep).toBe('damage');
  });

  it('CR 10-1-5-2: declining adds the card to hand unrevealed', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, life: [PUR_1B, PUR_1] } });
    give(g, PUR_1B, [{ id: 't', kind: 'trigger', effect: [] }]);
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    noDefence(g);
    const ev = g.act({ type: 'trigger', activate: false });
    const moved = ev.find((e) => e.type === 'CardMoved')!;
    expect(moved).toMatchObject({ from: 'life', to: 'hand' });
    expect(moved.revealed).toBeUndefined();
    expect(types(ev)).not.toContain('TriggerRevealed');
  });

  it('CR 10-1-5-3: an activated [Trigger] is in no area while it resolves, then is trashed (RL-25)', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, life: [PUR_1B, PUR_1] } });
    give(g, PUR_1B, [{ id: 't', kind: 'trigger', effect: [{ op: 'emit', label: 'resolving' }] }]);
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    noDefence(g);
    const ev = g.act({ type: 'trigger', activate: true });
    const t = types(ev);
    expect(t.indexOf('TriggerRevealed')).toBeLessThan(t.indexOf('EffectResolved'));
    const toResolving = ev.find((e) => e.type === 'CardMoved' && e.to === 'resolving');
    const toTrash = ev.find((e) => e.type === 'CardMoved' && e.from === 'resolving');
    expect(toResolving).toMatchObject({ revealed: true });
    expect(toTrash).toMatchObject({ to: 'trash' });
    expect(ev.indexOf(toResolving!)).toBeLessThan(ev.findIndex((e) => e.type === 'EffectResolved'));
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([PUR_1B]);
    expect(queries.don(g.state, 'p2').rested).toBe(0); // the printed cost is never paid
  });

  it('QA-GR: moving Life by an effect is not damage and offers no [Trigger]', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, life: [PUR_1B] } });
    give(g, PUR_1B, [{ id: 't', kind: 'trigger', effect: [] }]);
    op(g, { op: 'lifeToHand', player: 'p2', n: 1 });
    expect(queries.decision(g.state)!.kind).toBe('main');
    expect(g.zone('p2', 'hand')).toHaveLength(1);
  });

  it('CR 4-6-2 / 4-6-2-2: X-point effect damage moves X Life cards one at a time', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, life: times(3, PUR_1) } });
    const ev = [...op(g, { op: 'damage', player: 'p2', n: 2, by: 'p1' }), ...takeDamage(g)];
    expect(ev.filter((e) => e.type === 'CardMoved' && e.reason === 'damage')).toHaveLength(2);
    expect(g.life('p2')).toBe(1);
  });

  it('RL-22: effect damage at 0 Life defeats; effect damage reaching 0 does not', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, life: [PUR_1] } });
    op(g, { op: 'damage', player: 'p2', n: 1, by: 'p1' });
    takeDamage(g);
    expect(queries.result(g.state)).toBeNull();
    op(g, { op: 'damage', player: 'p2', n: 1, by: 'p1' });
    takeDamage(g);
    expect(queries.result(g.state)).toEqual({ winner: 'p1', reason: 'damage at 0 Life' });
  });

  it('Q-T3 / RL-22 best answer: a 2-point effect at 1 Life defeats on the second point', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, life: [PUR_1] } });
    op(g, { op: 'damage', player: 'p2', n: 2, by: 'p1' });
    takeDamage(g);
    expect(queries.result(g.state)).toEqual({ winner: 'p1', reason: 'damage at 0 Life' });
  });
});

describe('game end (CR 1-2, 9)', () => {
  it('CR 1-2-1-1-2 / 9-2-1-2: drawing the last card loses immediately (RL-26)', () => {
    const g = scenario({
      p1: { leader: LUFFY, deck: [RED_1] },
      p2: { leader: KAIDO, deck: [PUR_1] },
    });
    endTurn(g); // p2 draws its only card at turn 4
    expect(queries.result(g.state)).toEqual({ winner: 'p1', reason: 'deck out' });
    expect(queries.turn(g.state).phase).toBe('draw');
  });

  it('CR 9-1-2 / 1-3-2: "draw 2" with 1 card draws it, then the player loses mid-resolution', () => {
    const g = scenario({ p1: { leader: LUFFY, deck: [RED_1] }, p2: { leader: KAIDO } });
    const ev = op(g, { op: 'draw', player: 'p1', n: 2 });
    expect(ev.filter((e) => e.type === 'CardMoved')).toHaveLength(1);
    expect(queries.result(g.state)).toEqual({ winner: 'p2', reason: 'deck out' });
  });

  it('CR 9-2-1: both players meeting a defeat condition at one check is bothLost (RL-27)', () => {
    const g = scenario({
      p1: { leader: LUFFY, deck: [RED_1] },
      p2: { leader: KAIDO, deck: [PUR_1] },
    });
    op(g, { op: 'millBoth', n: 1 });
    expect(queries.result(g.state)).toEqual({ draw: 'bothLost' });
  });

  it('RL-27 / CR 1-3-10: actions in sequence are checked one by one; the turn player loses first', () => {
    const g = scenario({
      p1: { leader: LUFFY, deck: [RED_1] },
      p2: { leader: KAIDO, deck: [PUR_1] },
    });
    op(g, { op: 'draw', player: 'p1', n: 1 });
    expect(queries.result(g.state)).toEqual({ winner: 'p2', reason: 'deck out' });
  });

  it('CR 1-2-3 / 1-2-4: either player may concede at any time, even while the other decides', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, life: [PUR_1] } });
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    // p2 owes the block decision; p1 concedes anyway.
    const step = reduce(g.state, { type: 'concede', player: 'p1' });
    expect(queries.result(step.state)).toEqual({ winner: 'p2', reason: 'concede' });
    expect(queries.decision(step.state)).toBeNull();
    expect(() => reduce(step.state, { type: 'concede', player: 'p2' })).toThrow();
  });

  it('CR 1-2-5: an effect-driven loss ends the game during resolution, skipping the rest', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, characters: [PUR_1] } });
    const t = g.find('p2', 'characters', PUR_1);
    give(g, LUFFY, [
      {
        id: 'x',
        kind: 'activate',
        when: 'activateMain',
        effect: [
          { op: 'damage', n: 1, player: 'opponent' },
          { op: 'ko', target: t },
        ],
      },
    ]);
    force(g, { type: 'activate', card: g.leader('p1'), ability: 'x', player: 'p1' });
    expect(queries.result(g.state)).toEqual({ winner: 'p1', reason: 'damage at 0 Life' });
    expect(g.card(t).zone).toBe('characters');
  });

  it('CR 11-1-1-1: a mandatory loop nobody can stop is a draw', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO } });
    const ev = op(g, { op: 'loop' });
    expect(types(ev)).toContain('LoopDetected');
    expect(queries.result(g.state)).toEqual({ draw: 'loop' });
  });

  it('CR 1-3-2-2: a count of 0 does nothing', () => {
    const g = scenario({ p1: { leader: LUFFY, deck: [RED_1] }, p2: { leader: KAIDO } });
    const ev = op(g, { op: 'draw', player: 'p1', n: 0 });
    expect(ev.filter((e) => e.type === 'CardMoved')).toHaveLength(0);
    expect(queries.result(g.state)).toBeNull();
  });

  it("a scenario may start with an empty deck; it loses at that player's first draw", () => {
    const g = scenario({ p1: { leader: LUFFY, deck: [RED_1] }, p2: { leader: KAIDO } });
    expect(queries.result(g.state)).toBeNull();
    endTurn(g);
    expect(queries.result(g.state)).toEqual({ winner: 'p1', reason: 'deck out' });
  });
});
