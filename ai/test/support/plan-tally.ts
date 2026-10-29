/**
 * Game-plan assertions measured over AI games (ARCHITECTURE §4.6: "strength tests check those
 * assertions statistically"). Each assertion is the guide's playbook seed with the threshold from
 * `ai/playbooks/<leader>.json`. A tally counts qualifying situations and how many met the plan.
 */
import {
  queries,
  type Action,
  type GameState,
  type PlayerId,
  type ProjectedView,
} from '@optcg/engine';
import { ownTurn, type AiTier } from '../../src/index.ts';
import type { DecisionRecord } from './match.ts';

export interface Tally {
  leader: string;
  seed: number;
  text: string;
  threshold: number;
  hits: number;
  total: number;
}

const DON_ADDERS = ['EB04-032', 'OP17-073', 'OP17-074', 'EB04-031'];
const BIG = ['OP17-061', 'OP17-062', 'OP17-063', 'OP17-065', 'ST34-004'];

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

interface TurnLog {
  turn: number;
  own: number;
  first: DecisionRecord;
  records: DecisionRecord[];
  /** The opponent had 2 or more Life at the start of the turn (not a finishing turn). */
  contested: boolean;
  /** The AI won the game during this turn, or its search saw a win in nearly every sample. */
  won: boolean;
}

/** One game's tally for the AI seat `ai` (only the Pirate's decisions are judged). */
export class PlanTally {
  readonly tallies = new Map<string, Tally>();
  private turns: TurnLog[] = [];
  private records: DecisionRecord[] = [];

  constructor(
    private readonly ai: PlayerId,
    private readonly tier: AiTier,
    private readonly leader: string,
  ) {}

  private t(seed: number, text: string, threshold: number): Tally {
    const key = `${this.leader}#${seed}`;
    let t = this.tallies.get(key);
    if (!t) {
      t = { leader: this.leader, seed, text, threshold, hits: 0, total: 0 };
      this.tallies.set(key, t);
    }
    return t;
  }

  observe(d: DecisionRecord): void {
    if (d.player !== this.ai || d.tier !== this.tier) return;
    this.records.push(d);
    const turn = d.view.turn.number;
    if (d.view.turn.activePlayer === this.ai && d.view.decision?.kind === 'main') {
      const last = this.turns[this.turns.length - 1];
      if (!last || last.turn !== turn) {
        const first = turn % 2 === 1 ? d.view.turn.activePlayer : other(d.view.turn.activePlayer);
        this.turns.push({
          turn,
          own: ownTurn(turn, first === this.ai),
          first: d,
          records: [],
          contested: d.view.zones[other(this.ai)].life.length >= 2,
          won: false,
        });
      }
    }
    const cur = this.turns[this.turns.length - 1];
    if (cur && cur.turn === turn) {
      cur.records.push(d);
      const res = queries.result(d.after);
      if (res && 'winner' in res && res.winner === this.ai) cur.won = true;
      // A turn its own search scores as a win in at least half its samples is a finishing turn.
      if (d.view.decision?.kind === 'main' && (d.value ?? 0) >= 500) cur.won = true;
    }
  }

  /** Turns judged as finishing turns (not held to the plan), and all own turns (review M5a-08). */
  get exempt(): { finishing: number; turns: number } {
    return { finishing: this.turns.filter((t) => t.won).length, turns: this.turns.length };
  }

  /** Close the game: judge every assertion over what was observed. */
  finish(): Tally[] {
    if (this.leader === 'OP17-039') this.rocks();
    if (this.leader === 'OP17-058') this.kaido();
    return [...this.tallies.values()];
  }

  private cardOf(s: GameState, handleOrId: string, view: ProjectedView): string | null {
    for (const p of ['p1', 'p2'] as const)
      for (const z of Object.values(view.zones[p])) {
        const c = z.find((x) => x.handle === handleOrId);
        if (c) return c.card;
      }
    void s;
    return null;
  }

  private played(tl: TurnLog, card: string): boolean {
    return tl.records.some(
      (r) => r.action.type === 'playCard' && this.cardOf(r.before, r.action.card, r.view) === card,
    );
  }

  private rocks(): void {
    const me = this.ai;
    let tenSeen = false;
    for (const tl of this.turns) {
      const v = tl.first.view;
      const leader = v.zones[me].leader[0]!.handle;
      const hand = v.zones[me].hand.map((c) => c.card);
      // 1. Leader attacks every turn from T2 when it can.
      if (
        tl.own >= 2 &&
        !tl.won &&
        v.actions.some((a) => a.type === 'attack' && a.attacker === leader)
      ) {
        const t = this.t(1, 'Leader attacks every turn from T2', 0.9);
        t.total++;
        if (tl.records.some((r) => r.action.type === 'attack' && r.action.attacker === leader))
          t.hits++;
      }
      // 3. OP17-118 on the first turn with 10 DON!! when it is in hand.
      const d = v.don[me];
      if (!tenSeen && d.active + d.rested + d.given >= 10) {
        tenSeen = true;
        const legal = v.actions.some(
          (a) => a.type === 'playCard' && this.cardOf(tl.first.before, a.card, v) === 'OP17-118',
        );
        // A finishing turn is judged by whether it wins, not by the plan.
        if (hand.includes('OP17-118') && legal && tl.contested && !tl.won) {
          const t = this.t(3, 'Plays OP17-118 on the first turn with 10 DON!!', 0.8);
          t.total++;
          if (this.played(tl, 'OP17-118')) t.hits++;
        }
      }
      // 4. No Buckin from hand while OP17-118 is in hand after T3.
      if (tl.own >= 4 && hand.includes('OP08-051') && hand.includes('OP17-118')) {
        const t = this.t(4, 'Does not play Buckin while OP17-118 is in hand after T3', 0.8);
        t.total++;
        if (!this.played(tl, 'OP08-051')) t.hits++;
      }
    }
    for (const r of this.records) {
      const dec = r.view.decision;
      // 2. Pays the reveal cost when holding 2+ cards.
      if (
        dec?.kind === 'optional' &&
        dec.source?.card === 'OP17-039' &&
        dec.source.ability === 'reveal-draw'
      ) {
        if (
          r.view.zones[me].hand.length >= 2 &&
          r.view.actions.some((a) => a.type === 'optional' && a.accept)
        ) {
          const t = this.t(2, 'Pays the reveal cost when holding 2+ cards', 0.9);
          t.total++;
          if (r.action.type === 'optional' && r.action.accept) t.hits++;
        }
      }
      // 5. Stussy's On Play targets the highest-power candidate.
      if (
        dec?.kind === 'choose' &&
        dec.source?.card === 'OP17-054' &&
        dec.source.ability === 'on-play' &&
        r.action.type === 'pick'
      ) {
        const picks = r.view.actions.filter(
          (a): a is Extract<Action, { type: 'pick' }> =>
            a.type === 'pick' && typeof a.choice === 'string',
        );
        if (picks.length > 1) {
          const power = (h: string) => this.powerOf(r.view, h);
          const best = Math.max(...picks.map((a) => power(a.choice as string)));
          const t = this.t(5, "Stussy's On Play targets the highest-power Character", 0.8);
          t.total++;
          if (typeof r.action.choice === 'string' && power(r.action.choice) === best) t.hits++;
        }
      }
    }
  }

  private powerOf(view: ProjectedView, h: string): number {
    for (const p of ['p1', 'p2'] as const)
      for (const z of Object.values(view.zones[p])) {
        const c = z.find((x) => x.handle === h);
        if (c) return c.power ?? 0;
      }
    return 0;
  }

  private kaido(): void {
    const me = this.ai;
    let donByT3 = false;
    let bigByT5 = false;
    // Judged only in games where the play was legal on a contested turn in time (vs Rookie many
    // games are decided before then).
    let donChance = false;
    let bigChance = false;
    const legalPlay = (tl: TurnLog, ids: string[]) =>
      tl.records.some(
        (r) =>
          r.view.decision?.kind === 'main' &&
          r.view.actions.some(
            (a) =>
              a.type === 'playCard' && ids.includes(this.cardOf(r.before, a.card, r.view) ?? ''),
          ),
      );
    for (const tl of this.turns) {
      if (tl.own <= 3) {
        if (tl.contested && !tl.won && legalPlay(tl, DON_ADDERS)) donChance = true;
        if (DON_ADDERS.some((c) => this.played(tl, c))) donByT3 = true;
      }
      if (tl.own <= 5) {
        if (tl.contested && !tl.won && legalPlay(tl, BIG)) bigChance = true;
        if (BIG.some((c) => this.played(tl, c))) bigByT5 = true;
      }
      // 4. Ulti & Page One after the Leader's −2000, when a 5000-power target exists.
      for (let i = 0; i < tl.records.length; i++) {
        const r = tl.records[i]!;
        if (
          r.action.type !== 'playCard' ||
          this.cardOf(r.before, r.action.card, r.view) !== 'OP17-060'
        )
          continue;
        const opp = r.view.zones[other(me)].characters;
        if (!opp.some((c) => (c.power ?? 0) > 3000 && (c.power ?? 0) <= 5000)) continue;
        const t = this.t(4, 'Ulti & Page One after the Leader attack with the −2000', 0.8);
        t.total++;
        const leader = r.view.zones[me].leader[0]!.handle;
        if (
          tl.records
            .slice(0, i)
            .some((x) => x.action.type === 'attack' && x.action.attacker === leader)
        )
          t.hits++;
      }
    }
    if (donChance) {
      const t = this.t(3, 'A DON!!-adding Character by T3', 0.8);
      t.total++;
      if (donByT3) t.hits++;
    }
    if (bigChance) {
      const t = this.t(5, 'A 9- or 10-cost Character by T5', 0.6);
      t.total++;
      if (bigByT5) t.hits++;
    }
    for (let i = 0; i < this.records.length; i++) {
      const r = this.records[i]!;
      const dec = r.view.decision;
      if (
        dec?.kind !== 'optional' ||
        dec.source?.card !== 'OP17-058' ||
        dec.source.ability !== 'shrink'
      )
        continue;
      if (r.view.turn.activePlayer === me || !r.view.battle) continue;
      const b = r.view.battle;
      const attacker = r.view.zones[other(me)].characters.find((c) => c.handle === b.attacker);
      const target = [...r.view.zones[me].leader, ...r.view.zones[me].characters].find(
        (c) => c.handle === b.target,
      );
      const accepted = r.action.type === 'optional' && r.action.accept;
      // 1. On a Character attacker, when −2000 changes the result.
      if (attacker && target && r.view.actions.some((a) => a.type === 'optional' && a.accept)) {
        const ap = attacker.power ?? 0;
        const dp = target.power ?? 0;
        if (ap >= dp && ap - 2000 < dp) {
          const t = this.t(
            1,
            "Uses the Leader's −2000 on a Character attacker when it changes the result",
            0.8,
          );
          t.total++;
          if (accepted) t.hits++;
        }
      }
      // 2. Each activation on their turn lowers the Counter needed by 1000 or more.
      if (accepted && attacker && target) {
        const pick = this.records
          .slice(i + 1, i + 6)
          .find((x) => x.action.type === 'pick' && typeof x.action.choice === 'string');
        const t = this.t(2, 'Each −2000 on their turn cuts the Counter needed by 1000+', 0.8);
        t.total++;
        const need = (attacker.power ?? 0) - (target.power ?? 0) + 1000;
        if (
          pick &&
          pick.action.type === 'pick' &&
          pick.action.choice === b.attacker &&
          need >= 1000
        )
          t.hits++;
      }
    }
    void queries;
  }
}

/** Merge per-game tallies. */
export function mergeTallies(all: Tally[]): Tally[] {
  const m = new Map<string, Tally>();
  for (const t of all) {
    const k = `${t.leader}#${t.seed}`;
    const cur = m.get(k);
    if (cur) {
      cur.hits += t.hits;
      cur.total += t.total;
    } else m.set(k, { ...t });
  }
  return [...m.values()].sort((a, b) => a.leader.localeCompare(b.leader) || a.seed - b.seed);
}
