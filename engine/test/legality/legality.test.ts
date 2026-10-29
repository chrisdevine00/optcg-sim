/** legalActions, whyNot, preview and autoSkip (ARCHITECTURE §2.1, §2.3). */
import { describe, expect, it } from 'vitest';
import {
  autoSkip,
  legalActions,
  preview,
  previewFromView,
  project,
  queries,
  reduce,
  whyNot,
} from '../../src/index.ts';
import { internals } from '../../src/testing.ts';
import { scenario } from '../fixtures/index.ts';
import {
  BLOCKER,
  KAIDO,
  LUFFY,
  PUR_1,
  RED_1,
  RED_5,
  STAGE_PUR,
  startedGame,
  times,
} from '../support/game.ts';

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

describe('autoSkip (ARCHITECTURE §2.3, flows.md decision 4, M2-02)', () => {
  const vsAi = { observedByOtherHuman: false };
  const hotseat = { observedByOtherHuman: true };
  const counterWindow = (hand: string[]) => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, life: [PUR_1], hand } });
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    g.act({ type: 'block', blocker: null });
    return g;
  };

  it('skips an empty Block window in either mode: its options are public', () => {
    const g = scenario({
      p1: { leader: LUFFY },
      p2: { leader: KAIDO, life: [PUR_1], hand: [PUR_1] },
    });
    expect(autoSkip(g.state, vsAi)).toBeNull();
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    expect(autoSkip(g.state, hotseat)).toEqual({ type: 'block', blocker: null, player: 'p2' });
    const h = scenario({
      p1: { leader: LUFFY },
      p2: { leader: KAIDO, characters: [BLOCKER], life: [PUR_1] },
    });
    h.act({ type: 'attack', attacker: h.leader('p1'), target: h.leader('p2') });
    expect(autoSkip(h.state, vsAi)).toBeNull();
  });

  it('M2-02: with another human watching, the Counter window never skips while the hand holds cards', () => {
    const withCounter = counterWindow([PUR_1]);
    const noCounter = counterWindow([STAGE_PUR]);
    // The attacker cannot tell the two positions apart...
    expect(JSON.stringify(project(withCounter.state, 'p1'))).toBe(
      JSON.stringify(project(noCounter.state, 'p1')),
    );
    // ...so whether the game pauses must not differ either.
    expect(autoSkip(withCounter.state, hotseat)).toBeNull();
    expect(autoSkip(noCounter.state, hotseat)).toBeNull();
    // Against the AI nobody else watches, so the empty window may skip.
    expect(autoSkip(noCounter.state, vsAi)).toEqual({ type: 'endCounter', player: 'p2' });
    expect(autoSkip(withCounter.state, vsAi)).toBeNull();
    // An empty hand is public (CR 3-1-4): it may skip in either mode.
    expect(autoSkip(counterWindow([]).state, hotseat)).toEqual({
      type: 'endCounter',
      player: 'p2',
    });
  });

  it('M2-19: with another human watching, a forced pick among hidden cards never skips', () => {
    const g = scenario({ p1: { leader: LUFFY, hand: [RED_1] }, p2: { leader: KAIDO } });
    const card = g.find('p1', 'hand', RED_1);
    const forced = (extra: Record<string, unknown>) => {
      const s = internals(g.state);
      return {
        ...s,
        decision: {
          kind: 'choose' as const,
          player: 'p1' as const,
          prompt: 'Choose 1 card from your hand.',
          min: 1,
          max: 1,
          candidates: [card],
          picked: [],
          purpose: 'effect' as const,
          ...extra,
        },
      } as unknown as typeof g.state;
    };
    const pick = { type: 'pick', choice: card, player: 'p1' };
    // A filtered search of the hand: the watcher must not learn that exactly one card matched.
    expect(autoSkip(forced({ secret: true }), hotseat)).toBeNull();
    expect(autoSkip(forced({ secret: true }), vsAi)).toEqual(pick);
    // The whole hand with exactly one card: hand size is public, so the count forces the pick.
    expect(autoSkip(forced({ secret: true, publicCount: true }), hotseat)).toEqual(pick);
    // A candidate the watcher cannot see, even without the flag, blocks the skip.
    expect(autoSkip(forced({}), hotseat)).toBeNull();
    // A hidden search with no match leaves only `done`; still not skipped while watched.
    const none = forced({ secret: true, candidates: [], min: 0 });
    expect(autoSkip(none, hotseat)).toBeNull();
    expect(autoSkip(none, vsAi)).toEqual({ type: 'done', player: 'p1' });
  });

  it('M2-01: a damage decision with no [Trigger] skips only when no other human watches', () => {
    const g = counterWindow([]);
    g.act({ type: 'endCounter' });
    expect(queries.decision(g.state)!.kind).toBe('trigger');
    expect(autoSkip(g.state, hotseat)).toBeNull();
    expect(autoSkip(g.state, vsAi)).toEqual({ type: 'trigger', activate: false, player: 'p2' });
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

  it('M2-04: previewFromView takes and returns handles only', () => {
    const g = scenario({
      p1: { leader: LUFFY, characters: [RED_5] },
      p2: {
        leader: KAIDO,
        characters: [{ card: PUR_1, rested: true }],
        life: [{ card: PUR_1, faceUp: true }],
      },
    });
    const v = project(g.state, 'p1');
    const attack = v.actions.find(
      (a) => a.type === 'attack' && a.target === v.zones.p2.characters[0]!.handle,
    )!;
    const p = previewFromView(g.state, 'p1', attack);
    expect(p.ko).toEqual([v.zones.p2.characters[0]!.handle]);
    const ids = Object.keys(internals(g.state).cards);
    for (const id of ids) expect(JSON.stringify(p)).not.toContain(id);
    const hit = v.actions.find(
      (a) => a.type === 'attack' && a.target === v.zones.p2.leader[0]!.handle,
    )!;
    const q = previewFromView(g.state, 'p1', hit);
    expect(q.cards[v.zones.p2.life[0]!.handle]).toEqual({ zone: 'hand' });
    expect(JSON.stringify(q)).not.toMatch(/"\$[a-z0-9]{7}"/);
  });

  it('throws for an illegal action, like reduce', () => {
    const g = startedGame(5);
    expect(() => preview(g.state, { type: 'endTurn', player: 'p2' })).toThrow();
    expect(() => reduce(g.state, { type: 'endTurn', player: 'p2' })).toThrow();
    expect(queries.decision(g.state)!.player).toBe('p1');
  });
});
