/** legalActions, whyNot, preview and autoSkip (ARCHITECTURE §2.1, §2.3). */
import { describe, expect, it } from 'vitest';
import { autoSkip, legalActions, preview, queries, reduce, whyNot } from '../../src/index.ts';
import { internals } from '../../src/testing.ts';
import { scenario } from '../fixtures/index.ts';
import { BLOCKER, KAIDO, LUFFY, PUR_1, RED_1, RED_5, startedGame, times } from '../support/game.ts';

describe('choose decisions: canonical order and completability (ADR 0003)', () => {
  it('a choice offers only candidates, in canonical order; an exact-1 pick completes it', () => {
    const g = scenario({
      p1: {
        leader: LUFFY,
        characters: times(5, RED_1),
        hand: [RED_1],
        costArea: { active: 1, rested: 0 },
      },
      p2: { leader: KAIDO },
    });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', RED_1) });
    const picks = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(picks).toEqual(
      g
        .zone('p1', 'characters')
        .map((c) => c.instance)
        .sort(),
    );
    expect(g.legal().some((a) => a.type === 'done')).toBe(false); // min 1 not met
    expect(whyNot(g.state, 'p1', { type: 'done' })).toMatchObject({ text: 'Choose 1 more.' });
  });

  it('picks after the first must follow candidate order, and only while completable', () => {
    const g = scenario({
      p1: {
        leader: LUFFY,
        characters: times(5, RED_1),
        hand: [RED_1],
        costArea: { active: 1, rested: 0 },
      },
      p2: { leader: KAIDO },
    });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', RED_1) });
    // Turn the pending choice into "exactly 3 of 5" to exercise the general rules.
    const s = internals(g.state);
    const dec = { ...s.decision!, min: 3, max: 3 };
    const st = { ...s, decision: dec } as never;
    const cands = dec.candidates as string[];
    const first = legalActions(st)
      .filter((a) => a.type === 'pick')
      .map((a) => (a as { choice: string }).choice);
    expect(first).toEqual(cands.slice(0, 3)); // the 4th and 5th cannot start a set of 3
    const after = { ...s, decision: { ...dec, picked: [cands[1]!] } } as never;
    const next = legalActions(after)
      .filter((a) => a.type === 'pick')
      .map((a) => (a as { choice: string }).choice);
    expect(next).toEqual([cands[2], cands[3]]);
    expect(whyNot(after, 'p1', { type: 'pick', choice: cands[0]! })!.text).toMatch(/listed order/);
  });
});

describe('whyNot', () => {
  it('returns null for every listed action and a reason for illegal ones', () => {
    const g = startedGame(5);
    for (const a of g.legal()) {
      const { player, ...intent } = a;
      expect(whyNot(g.state, player, intent)).toBeNull();
    }
    expect(whyNot(g.state, 'p2', { type: 'endTurn' })!.text).toMatch(/opponent is deciding/);
    expect(whyNot(g.state, 'p1', { type: 'block', blocker: null })).toMatchObject({
      rule: 'CR 7-1-2',
    });
    expect(whyNot(g.state, 'p1', { type: 'giveDon', target: g.leader('p2') })).toMatchObject({
      rule: 'CR 6-5-5-1',
    });
  });

  it('RL-35: DON!! go to the Leader or a Character only, never a Stage', () => {
    const g = scenario({
      p1: {
        leader: LUFFY,
        characters: [RED_1],
        stage: 'OP03-020',
        costArea: { active: 1, rested: 0 },
      },
      p2: { leader: KAIDO },
    });
    const targets = g
      .legal()
      .filter((a) => a.type === 'giveDon')
      .map((a) => (a.type === 'giveDon' ? a.target : ''));
    expect(targets).toEqual([g.leader('p1'), g.find('p1', 'characters', RED_1)]);
    expect(
      whyNot(g.state, 'p1', { type: 'giveDon', target: g.zone('p1', 'stage')[0]!.instance }),
    ).toMatchObject({ rule: 'CR 6-5-5-1' });
  });
});

describe('autoSkip (ARCHITECTURE §2.3)', () => {
  it('reports an empty Block or Counter window, and nothing when there is a real choice', () => {
    const g = scenario({
      p1: { leader: LUFFY },
      p2: { leader: KAIDO, life: [PUR_1], hand: [PUR_1] },
    });
    expect(autoSkip(g.state)).toBeNull();
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    expect(autoSkip(g.state)).toEqual({ type: 'block', blocker: null, player: 'p2' });
    g.act({ type: 'block', blocker: null });
    expect(autoSkip(g.state)).toBeNull(); // p2 holds a Counter
    const h = scenario({
      p1: { leader: LUFFY },
      p2: { leader: KAIDO, characters: [BLOCKER], life: [PUR_1] },
    });
    h.act({ type: 'attack', attacker: h.leader('p1'), target: h.leader('p2') });
    expect(autoSkip(h.state)).toBeNull();
    h.act({ type: 'block', blocker: null });
    expect(autoSkip(h.state)).toEqual({ type: 'endCounter', player: 'p2' });
  });
});

describe('preview', () => {
  it("shows an unanswered attack's outcome without changing the state", () => {
    const g = scenario({
      p1: { leader: LUFFY, characters: [RED_5] },
      p2: { leader: KAIDO, characters: [{ card: PUR_1, rested: true }], life: [PUR_1, PUR_1] },
    });
    const t = g.find('p2', 'characters', PUR_1);
    const before = JSON.stringify(g.state);
    const p = preview(g.state, {
      type: 'attack',
      attacker: g.find('p1', 'characters', RED_5),
      target: t,
      player: 'p1',
    });
    expect(p.ko).toEqual([t]);
    expect(p.cards[t]).toMatchObject({ zone: 'trash' });
    expect(p.gameOver).toBe(false);
    expect(JSON.stringify(g.state)).toBe(before);
    const q = preview(g.state, {
      type: 'attack',
      attacker: g.leader('p1'),
      target: g.leader('p2'),
      player: 'p1',
    });
    expect(q.life).toEqual({ p1: 0, p2: 1 });
  });

  it('shows DON!! power and a lethal hit', () => {
    const g = scenario({
      p1: { leader: LUFFY, costArea: { active: 1, rested: 0 } },
      p2: { leader: KAIDO },
    });
    const p = preview(g.state, { type: 'giveDon', target: g.leader('p1'), player: 'p1' });
    expect(p.cards[g.leader('p1')]).toEqual({ power: 6000 });
    const q = preview(g.state, {
      type: 'attack',
      attacker: g.leader('p1'),
      target: g.leader('p2'),
      player: 'p1',
    });
    expect(q.gameOver).toBe(true);
  });

  it('throws for an illegal action, like reduce', () => {
    const g = startedGame(5);
    expect(() => preview(g.state, { type: 'endTurn', player: 'p2' })).toThrow();
    expect(() => reduce(g.state, { type: 'endTurn', player: 'p2' })).toThrow();
    expect(queries.decision(g.state)!.player).toBe('p1');
  });
});
