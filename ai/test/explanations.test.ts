/**
 * Explanation snapshots (ARCHITECTURE §4.5, docs/design/explanations.md "How the snapshot tests use
 * these"). Each AI "why" example (E12, E13, E16) is built as a scenario, the Pirate decides from its
 * own view, and the test asserts:
 * 1. the decision is the one the example describes;
 * 2. the Explanation equals the object written in explanations.md (read from the doc itself, so the
 *    copy and the code cannot drift apart);
 * 3. every `figures` value equals the value recomputed from the scenario through the engine;
 * 4. the certainty chip reads as the "AI Why" row of the labels table.
 * Then properties over whole games: every AI explanation is well formed and names no card the
 * player could not see (flows D9).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { SCRIPTS } from '@optcg/cards';
import {
  legalActions,
  project,
  projectForSearch,
  queries,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
  type ProjectedView,
} from '@optcg/engine';
import { certaintyLabel, LESSON, type Explanation } from '../src/index.ts';
import { cardMap, metaDecks } from './support.ts';
import { playMatch } from './support/match.ts';
import { cardOf, lifeOf, listOf, session, start } from './support/scenario.ts';

// Searching tests: CI runners are several times slower than a desktop.
vi.setConfig({ testTimeout: 60_000 });

/** The example's Explanation object, evaluated from its ```ts block in explanations.md. */
function docExample(id: string): Explanation {
  const md = readFileSync(new URL('../../docs/design/explanations.md', import.meta.url), 'utf8');
  const at = md.indexOf(`## ${id}.`);
  const block = /```ts\n([\s\S]*?)```/.exec(md.slice(at))![1]!;
  return new Function(`return (${block});`)() as Explanation;
}

/** The engine action of `player` matching `pred` (the test plays both seats' forced steps). */
function step(s: GameState, pred: (a: Action) => boolean): GameState {
  const a = legalActions(s).find(pred);
  if (!a) throw new Error(`no such action: ${JSON.stringify(legalActions(s))}`);
  return reduce(s, a).state;
}

const ROCKS = 'OP17-039';
const KAIDO = 'OP17-058';
const LUFFY = 'OP13-001';

/** Kaido's biggest Counter across its sourced lists, worked out here from card data and scripts. */
function kaidoBiggestCounter(): number {
  const kaido = metaDecks().filter((d) => d.leader === KAIDO);
  let best = 0;
  for (const d of kaido)
    for (const id of new Set(d.main)) {
      const card = cardMap().get(id)!;
      if (card.category !== 'Event') best = Math.max(best, card.counter ?? 0);
      else
        for (const a of SCRIPTS[id]?.abilities ?? []) {
          if ((a as { when?: unknown }).when !== 'counter') continue;
          const m = JSON.stringify(a).match(/"amount":(\d+)/g) ?? [];
          for (const x of m) best = Math.max(best, Number(x.split(':')[1]));
        }
    }
  return best;
}

function checkCertainty(e: Explanation): void {
  expect(certaintyLabel(e.certainty, 'ai-why')).toBe('Public information only');
}

describe('AI "why" snapshots (explanations.md)', () => {
  it('E12: a block', () => {
    let s = start({
      seed: 21,
      turn: 8,
      activePlayer: 'p1',
      firstPlayer: 'p2',
      p1: {
        leader: ROCKS,
        characters: ['OP17-048', 'OP17-045'],
        life: lifeOf(4, 'OP17-050'),
        hand: ['OP17-055', 'OP17-056', 'OP17-049'],
        costArea: { active: 0, rested: 8 },
        decklist: listOf(ROCKS),
      },
      p2: {
        leader: KAIDO,
        characters: ['OP17-074'],
        life: lifeOf(2, 'OP17-073'),
        hand: ['OP17-077', 'OP17-073', 'OP17-062'],
        costArea: { active: 0, rested: 6 },
        decklist: listOf(KAIDO),
      },
    });
    const [shiki, kyo] = queries.zone(s, 'p1', 'characters');
    const kaidoLeader = queries.zone(s, 'p2', 'leader')[0]!;
    // Earlier this turn: Kyo attacked, and Kaido spent its Leader's −2000 on Kyo.
    s = step(
      s,
      (a) =>
        a.type === 'attack' && a.attacker === kyo!.instance && a.target === kaidoLeader.instance,
    );
    s = step(s, (a) => a.type === 'optional' && a.accept);
    while (queries.decision(s)?.kind === 'choose')
      s = step(
        s,
        (a) => a.type === 'pick' && (typeof a.choice !== 'string' || a.choice === kyo!.instance),
      );
    while (queries.battle(s))
      s = step(
        s,
        (a) =>
          (a.type === 'block' && a.blocker === null) ||
          a.type === 'endCounter' ||
          a.type === 'trigger' ||
          a.type === 'done',
      );
    // Now Shiki attacks the AI's Leader; the AI owes the Block decision.
    s = step(
      s,
      (a) =>
        a.type === 'attack' && a.attacker === shiki!.instance && a.target === kaidoLeader.instance,
    );
    // Shiki's own [When Attacking] −3000 is not used in the example.
    while (queries.decision(s)?.kind !== 'block')
      s = step(s, (a) => (a.type === 'optional' ? !a.accept : true));
    const view = projectForSearch(s, 'p2');
    const d = session('p2', s).decide(view, 5);
    const yamato = view.zones.p2.characters[0]!;
    expect(d.action).toMatchObject({ type: 'block', blocker: yamato.handle });
    expect(d.explanation).toEqual(docExample('E12'));
    // Figures from the position.
    const f = d.explanation.evidence.map((e) => e.figures ?? {});
    const shikiPower = queries.card(s, shiki!.instance).power!;
    const leaderPower = queries.card(s, kaidoLeader.instance).power!;
    const stop = shikiPower - leaderPower + 1000;
    expect(f[0]).toEqual({
      aiLife: queries.zone(s, 'p2', 'life').length,
      aiHandSize: queries.zone(s, 'p2', 'hand').length,
    });
    expect(f[1]).toEqual({
      stopNeeded: stop,
      biggestCounter: kaidoBiggestCounter(),
      cardsNeeded: Math.ceil(stop / kaidoBiggestCounter()),
    });
    expect(f[2]).toEqual({ yamatoPower: queries.zone(s, 'p2', 'characters')[0]!.power });
    expect(
      queries
        .usedThisTurn(s)
        .some((u) => u.card === kaidoLeader.instance && u.ability === 'shrink'),
    ).toBe(true);
    checkCertainty(d.explanation);
  });

  it('E13: a counter', () => {
    let s = start({
      seed: 22,
      turn: 9,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: { card: LUFFY, don: 1 },
        characters: ['OP13-027', 'OP14-022'],
        life: lifeOf(3, 'OP14-022'),
        costArea: { active: 0, rested: 8 },
        decklist: metaDecks().find((d) => d.leader === LUFFY)!.main,
      },
      p2: {
        leader: ROCKS,
        life: lifeOf(1, 'OP17-045'),
        // Rocks Pirates and Buckin: enough to stop one of the next two attacks, not both.
        hand: ['OP17-056', 'OP08-051', 'OP17-048'],
        costArea: { active: 2, rested: 6 },
        decklist: listOf(ROCKS),
      },
    });
    const luffy = queries.zone(s, 'p1', 'leader')[0]!;
    const rocks = queries.zone(s, 'p2', 'leader')[0]!;
    s = step(
      s,
      (a) => a.type === 'attack' && a.attacker === luffy.instance && a.target === rocks.instance,
    );
    const ai = session('p2', s);
    // The AI answers every decision of this battle up to its Counter.
    for (let i = 0; i < 6 && queries.decision(s)?.kind !== 'counter'; i++) {
      const v = projectForSearch(s, 'p2');
      const x = ai.decide(v, 9 + i);
      s = reduce(s, fromView(s, 'p2', x.action)).state;
    }
    const view = projectForSearch(s, 'p2');
    const d = ai.decide(view, 13);
    expect(d.action.type).toBe('activate');
    expect(cardOf(view, (d.action as { card: string }).card)).toBe('OP17-056');
    expect(d.explanation).toEqual(docExample('E13'));
    const [sanji, usopp] = queries.zone(s, 'p1', 'characters');
    const leader = queries.card(s, rocks.instance).power!;
    const f = d.explanation.evidence.map((e) => e.figures ?? {});
    expect(f[0]).toEqual({ aiLife: queries.zone(s, 'p2', 'life').length });
    expect(f[1]).toEqual({
      sanjiPower: sanji!.power,
      usoppPower: usopp!.power,
      stopSanji: sanji!.power! - leader + 1000,
      stopUsopp: usopp!.power! - leader + 1000,
    });
    expect(f[2]).toEqual({
      leaderAfter: leader + 2000,
      attackPower: queries.card(s, luffy.instance).power,
    });
    checkCertainty(d.explanation);
  });

  it('E16: the Leader’s ability on your attacker', () => {
    let s = start({
      seed: 23,
      turn: 10,
      activePlayer: 'p1',
      firstPlayer: 'p2',
      p1: {
        leader: LUFFY,
        characters: [{ card: 'OP14-022', don: 1 }],
        life: lifeOf(3, 'OP14-022'),
        costArea: { active: 0, rested: 9 },
        decklist: metaDecks().find((d) => d.leader === LUFFY)!.main,
      },
      p2: {
        leader: KAIDO,
        life: lifeOf(3, 'OP17-073'),
        hand: ['OP17-062', 'OP17-061', 'OP17-073'],
        costArea: { active: 4, rested: 6 },
        donDeck: 0,
        decklist: listOf(KAIDO),
      },
    });
    const usopp = queries.zone(s, 'p1', 'characters')[0]!;
    const kaido = queries.zone(s, 'p2', 'leader')[0]!;
    s = step(
      s,
      (a) => a.type === 'attack' && a.attacker === usopp.instance && a.target === kaido.instance,
    );
    expect(queries.decision(s)?.kind).toBe('optional');
    const view = projectForSearch(s, 'p2');
    const ai = session('p2', s);
    const d = ai.decide(view, 3);
    expect(d.action).toMatchObject({ type: 'optional', accept: true });
    expect(d.explanation).toEqual(docExample('E16'));
    const f = d.explanation.evidence.map((e) => e.figures ?? {});
    const attack = queries.card(s, usopp.instance).power!;
    expect(f[0]).toEqual({
      attackPower: attack,
      defencePower: queries.card(s, kaido.instance).power,
    });
    expect(f[1]).toEqual({ attackAfter: attack - 2000, cardsSpent: 0 });
    expect(f[2]).toEqual({ donReturned: 1 });
    expect(queries.don(s, 'p2').deck).toBe(0);
    checkCertainty(d.explanation);
    // It then shrinks Usopp, the attacker.
    s = reduce(s, fromView(s, 'p2', d.action)).state;
    for (let i = 0; i < 4 && queries.decision(s)?.kind === 'choose'; i++) {
      const v = projectForSearch(s, 'p2');
      const x = ai.decide(v, 4 + i);
      if (x.action.type === 'pick' && typeof x.action.choice === 'string')
        expect(cardOf(v, x.action.choice)).toBe('OP14-022');
      s = reduce(s, fromView(s, 'p2', x.action)).state;
    }
    expect(queries.card(s, usopp.instance).power).toBe(attack - 2000);
  });

  it('the certainty labels follow the table, by context', () => {
    expect(certaintyLabel('any-hand', 'review')).toBe('Holds whatever they held');
    expect(certaintyLabel('needed-hidden-info', 'ai-why')).toBe(
      'Public information only · depends on your hand',
    );
    expect(certaintyLabel('search-incomplete', 'ai-why')).toBe('Best found in its time');
    expect(certaintyLabel('any-hand', 'guide', 'Rocks')).toBe('From the Rocks guide (sourced)');
  });
});

/** The engine action behind view action `v` of player `p` (views list actions in engine order). */
function fromView(s: GameState, p: PlayerId, v: Action): Action {
  const list = legalActions(s);
  const strip = ({ intentId: _i, ...x }: Action) => JSON.stringify(x);
  const i = project(s, p).actions.findIndex((a) => strip(a) === strip(v));
  if (i < 0) throw new Error(`not a listed action: ${strip(v)}`);
  return list[i]!;
}

describe('AI explanations over whole games', () => {
  const SLUGS = new Set(Object.keys(LESSON));
  const curriculum = readFileSync(
    new URL('../../docs/content/curriculum.md', import.meta.url),
    'utf8',
  );
  const all = cardMap();

  it('are well formed, cite a concept and a lesson that exist, and name no card the player could not see (flows D9)', () => {
    const decks = metaDecks();
    const rocks = decks.find((d) => d.leader === ROCKS)!;
    const kaido = decks.find((d) => d.leader === KAIDO)!;
    let checked = 0;
    for (let g = 0; g < 2; g++) {
      playMatch({
        seed: 40 + g,
        decks: g === 0 ? { p1: rocks, p2: kaido } : { p1: kaido, p2: rocks },
        tiers: { p1: 'pirate', p2: 'pirate' },
        onDecision: (d) => {
          const e = d.explanation;
          expect(e.claim.length).toBeGreaterThan(0);
          expect(e.claim.split(/\s+/).length, e.claim).toBeLessThanOrEqual(14);
          expect(e.claim).not.toMatch(/!$/);
          expect(SLUGS.has(e.conceptId), e.conceptId).toBe(true);
          expect(curriculum.includes(e.lessonId), e.lessonId).toBe(true);
          const text = [
            e.claim,
            e.outcome,
            ...e.evidence.map((x) => x.text),
            ...(e.line ?? []).map((m) => m.text),
          ].join(' ');
          // Effect labels quote types and names from public card text ("Rocks Pirates", [Kaido]).
          const named = text.replace(/"[^"]*"|\[[^\]]*\]|\{[^}]*\}/g, '');
          // Copy rules: the real minus sign, DON!! spelled out.
          expect(text).not.toMatch(/(^|\s)-\d/);
          expect(text).not.toMatch(/DON!(?!!)/);
          // D9: every card named is one the other player can see once the move is made.
          const opp = d.player === 'p1' ? 'p2' : 'p1';
          const visible = new Set<string>();
          for (const g2 of [d.before, d.after]) {
            const v = project(g2, opp);
            for (const p of ['p1', 'p2'] as const)
              for (const z of Object.values(v.zones[p]))
                for (const c of z) if (c.card) visible.add(c.card);
            for (const c of (v as ProjectedView).resolving) if (c.card) visible.add(c.card);
          }
          for (const c of queries.zone(d.after, d.player, 'trash')) visible.add(c.card);
          // A hidden card's name may be shared by a visible card (Kaido the Leader, Kaido the
          // Character): only names no visible card carries can leak.
          const visibleNames = new Set([...visible].map((id) => all.get(id)!.name));
          const hidden = [
            ...queries.zone(d.before, d.player, 'hand'),
            ...queries.zone(d.before, d.player, 'deck'),
            ...queries.zone(d.before, d.player, 'life'),
          ].map((c) => c.card);
          for (const id of new Set(hidden)) {
            if (visible.has(id) || visibleNames.has(all.get(id)!.name)) continue;
            const name = all.get(id)!.name;
            const re = new RegExp(
              `(^|[^A-Za-z])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z])`,
            );
            expect(re.test(named), `${name} (${id}) is hidden but named in: ${text}`).toBe(false);
          }
          checked++;
        },
      });
    }
    expect(checked).toBeGreaterThan(100);
  }, 120_000);
});
