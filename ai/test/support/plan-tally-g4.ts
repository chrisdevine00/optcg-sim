/**
 * Game-plan assertions for group 4 (Monkey.D.Luffy EB02-010, Franky OP18-021; M11 Track C), measured
 * over Pirate games like `plan-tally-g3.ts`. Each assertion is the guide's playbook seed with the
 * threshold from `ai/playbooks/<leader>.json`; a tally counts the qualifying situations and how
 * many met the plan. Only the Pirate's own decisions are judged, from the view it had.
 */
import { queries, type Action, type PlayerId, type ProjectedView } from '@optcg/engine';
import { ownTurn, PLAYBOOKS, type AiTier } from '../../src/index.ts';
import type { DecisionRecord } from './match.ts';
import type { Tally } from './plan-tally.ts';

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

export const G4_LEADERS = ['EB02-010', 'OP18-021'] as const;

export const NAMIS = ['EB02-017', 'PRB02-012'];
export const SANJI_PUDDING = 'EB02-035';
export const STAGES = ['OP18-075', 'OP18-076', 'OP18-077', 'OP18-078'];
export const FRANKY_CHAR = 'OP18-034';
export const FRANKY_SEARCHERS = ['OP18-061', 'EB02-017', 'PRB02-012', 'OP18-070'];

interface TurnLog {
  turn: number;
  own: number;
  records: DecisionRecord[];
  /** The AI won during the turn, or its search saw a win in half its samples. */
  won: boolean;
}

const cardOf = (v: ProjectedView, h: string): string | null => {
  for (const p of ['p1', 'p2'] as const)
    for (const z of Object.values(v.zones[p])) {
      const c = z.find((x) => x.handle === h);
      if (c) return c.card;
    }
  return null;
};

export class PlanTallyG4 {
  readonly tallies = new Map<string, Tally>();
  private turns: TurnLog[] = [];

  constructor(
    private readonly ai: PlayerId,
    private readonly tier: AiTier,
    private readonly leader: string,
  ) {}

  private t(seed: number): Tally {
    const key = `${this.leader}#${seed}`;
    let t = this.tallies.get(key);
    if (!t) {
      const a = PLAYBOOKS.get(this.leader)!.assertions.find((x) => x.seed === seed)!;
      t = { leader: this.leader, seed, text: a.text, threshold: a.threshold, hits: 0, total: 0 };
      this.tallies.set(key, t);
    }
    return t;
  }

  private count(seed: number, hit: boolean): void {
    const t = this.t(seed);
    t.total++;
    if (hit) t.hits++;
  }

  observe(d: DecisionRecord): void {
    if (d.player !== this.ai || d.tier !== this.tier) return;
    const turn = d.view.turn.number;
    if (d.view.turn.activePlayer === this.ai && d.view.decision?.kind === 'main') {
      const last = this.turns[this.turns.length - 1];
      if (!last || last.turn !== turn) {
        const first = turn % 2 === 1 ? d.view.turn.activePlayer : other(d.view.turn.activePlayer);
        this.turns.push({ turn, own: ownTurn(turn, first === this.ai), records: [], won: false });
      }
    }
    const cur = this.turns[this.turns.length - 1];
    if (cur && cur.turn === turn) {
      cur.records.push(d);
      const res = queries.result(d.after);
      if (res && 'winner' in res && res.winner === this.ai) cur.won = true;
      if (d.view.decision?.kind === 'main' && (d.value ?? 0) >= 500) cur.won = true;
    }
  }

  /** Turns judged as finishing turns (not held to the plan), and all own turns. */
  get exempt(): { finishing: number; turns: number } {
    return { finishing: this.turns.filter((t) => t.won).length, turns: this.turns.length };
  }

  finish(): Tally[] {
    if (this.leader === 'EB02-010') this.luffy();
    if (this.leader === 'OP18-021') this.franky();
    return [...this.tallies.values()];
  }

  private mains = (tl: TurnLog) => tl.records.filter((r) => r.view.decision?.kind === 'main');
  private legalPlay = (v: ProjectedView, ids: string[]) =>
    v.actions.some((a) => a.type === 'playCard' && ids.includes(cardOf(v, a.card) ?? ''));
  private legalActivate = (v: ProjectedView, ability: string) =>
    v.actions.some((a) => a.type === 'activate' && a.ability === ability);
  private isPlay = (r: DecisionRecord, ids: string[]) =>
    r.action.type === 'playCard' && ids.includes(cardOf(r.view, r.action.card) ?? '');
  private isActivate = (r: DecisionRecord, ability: string) =>
    r.action.type === 'activate' && r.action.ability === ability;

  // ---------------------------------------------------------------------------------------------
  // Monkey.D.Luffy (Green/Purple)
  // ---------------------------------------------------------------------------------------------
  private luffy(): void {
    for (const tl of this.turns) {
      if (tl.won) continue;
      const mains = this.mains(tl);
      // 1. The Leader's DON!! -2 on every turn from T2 on which it is legal.
      if (tl.own >= 2 && mains.some((r) => this.legalActivate(r.view, 'set-active')))
        this.count(
          1,
          mains.some((r) => this.isActivate(r, 'set-active')),
        );
      // 2. A Nami searcher on T1 or T2.
      if (tl.own <= 2 && mains.length > 0 && this.legalPlay(mains[0]!.view, NAMIS))
        this.count(
          2,
          mains.some((r) => this.isPlay(r, NAMIS)),
        );
      // 3. Sanji & Pudding before the Leader's DON!! -2 when both are legal at one decision.
      const both = mains.find(
        (r) => this.legalPlay(r.view, [SANJI_PUDDING]) && this.legalActivate(r.view, 'set-active'),
      );
      if (both) {
        const play = mains.findIndex((r) => this.isPlay(r, [SANJI_PUDDING]));
        const act = mains.findIndex((r) => this.isActivate(r, 'set-active'));
        this.count(3, act < 0 || (play >= 0 && play < act));
      }
    }
  }

  // ---------------------------------------------------------------------------------------------
  // Franky
  // ---------------------------------------------------------------------------------------------
  private franky(): void {
    for (const tl of this.turns) {
      if (tl.won) continue;
      const mains = this.mains(tl);
      if (mains.length === 0) continue;
      const first = mains[0]!;
      const stageLegal = this.legalActivate(first.view, 'play-stage');
      // 1. The Leader's DON!! -1 plays a Stage on T1 to T3.
      if (tl.own <= 3 && stageLegal)
        this.count(
          1,
          mains.some((r) => this.isActivate(r, 'play-stage')),
        );
      // 2. A Stage before Franky OP18-034: judged where Franky is played with a Stage in hand.
      const frankyAt = mains.findIndex((r) => this.isPlay(r, [FRANKY_CHAR]));
      if (frankyAt >= 0) {
        const r = mains[frankyAt]!;
        const stageInHand = first.view.zones[this.ai].hand.some((h) =>
          STAGES.includes(h.card ?? ''),
        );
        if (stageInHand) {
          const before = mains
            .slice(0, frankyAt)
            .some((x) => this.isPlay(x, STAGES) || this.isActivate(x, 'play-stage'));
          const onField = r.view.zones[this.ai].stage.some((h) => STAGES.includes(h.card ?? ''));
          this.count(2, before || onField);
        }
      }
      // 3. A searcher on T1 or T2 (when the Leader's Stage line is not on offer: one DON!! pays one).
      if (tl.own <= 2 && !stageLegal && this.legalPlay(first.view, FRANKY_SEARCHERS))
        this.count(
          3,
          mains.some((r) => this.isPlay(r, FRANKY_SEARCHERS)),
        );
    }
  }
}

export type { Action };
