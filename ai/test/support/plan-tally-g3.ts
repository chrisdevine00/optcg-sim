/**
 * Game-plan assertions for group 3 (Sabo OP13-004, Purple Enel OP15-058, Rosinante OP12-061),
 * measured over Pirate games like `plan-tally.ts` does for Rocks and Kaido. Each assertion is the
 * guide's playbook seed with the threshold from `ai/playbooks/<leader>.json`; a tally counts the
 * qualifying situations and how many met the plan. Only the Pirate's own decisions are judged, from
 * the view it had.
 */
import { queries, type Action, type PlayerId, type ProjectedView } from '@optcg/engine';
import { ownTurn, PLAYBOOKS, type AiTier } from '../../src/index.ts';
import type { DecisionRecord } from './match.ts';
import type { Tally } from './plan-tally.ts';

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

export const G3_LEADERS = ['OP13-004', 'OP15-058', 'OP12-061'] as const;

const SABO_BODIES = ['OP17-080', 'OP17-087', 'OP17-095', 'OP17-082', 'OP17-083', 'OP17-084'];
const ENEL_ONEDROPS = ['OP15-061', 'OP15-067', 'OP15-066', 'OP12-071'];
const ENEL_DRAWERS = ['OP15-061', 'OP15-067', 'OP15-066'];
const LAWS = ['EB04-038', 'P-093', 'ST10-010', 'P-088'];
const REMOVAL = ['OP16-065', 'OP09-077', 'OP13-076'];

interface TurnLog {
  turn: number;
  own: number;
  records: DecisionRecord[];
  /** Characters on the AI's field when the turn's first Main decision came (not played this turn). */
  start: Set<string>;
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

const viewCard = (v: ProjectedView, h: string) => {
  for (const p of ['p1', 'p2'] as const)
    for (const z of Object.values(v.zones[p])) {
      const c = z.find((x) => x.handle === h);
      if (c) return c;
    }
  return null;
};

/** Does the leader's discount pay for this hand card: it refunds itself or is the only way to play it? */
function pays(
  v: ProjectedView,
  c: { card: string | null; cost: number | null },
  me: PlayerId = v.player,
): boolean {
  const cost = c.cost ?? 0;
  if (!LAWS.includes(c.card ?? '') || cost < 4) return false;
  const total = (p: PlayerId) => v.don[p].active + v.don[p].rested + v.don[p].given;
  const active = v.don[me].active;
  if (active < cost - 1) return false;
  return (
    cost > active ||
    (['P-093', 'EB04-038'].includes(c.card ?? '') && total(me) - 1 <= total(other(me)))
  );
}

export class PlanTallyG3 {
  readonly tallies = new Map<string, Tally>();
  private turns: TurnLog[] = [];
  private records: DecisionRecord[] = [];

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

  /** What went wrong in each miss, for diagnosing a playbook (read by the probes, not asserted). */
  readonly misses: { seed: number; note: string }[] = [];

  private count(seed: number, hit: boolean, note?: () => string): void {
    const t = this.t(seed);
    t.total++;
    if (hit) t.hits++;
    else if (note) this.misses.push({ seed, note: note() });
  }

  /** Shield decisions where accepting loses the game in a quarter of the AI's own samples (not held to the plan). */
  private shieldLoses = new Set<DecisionRecord>();

  /**
   * `ranked` is the search's ranking of this decision's moves, when it ran one (the `debug` hook of
   * the session, read in `onDecision`): a shield that loses the game in the AI's own rollouts is
   * not a shield the plan can ask for, like a finishing turn.
   */
  observe(d: DecisionRecord, ranked?: { actions: Action[]; mean: number }[] | null): void {
    if (d.player !== this.ai || d.tier !== this.tier) return;
    this.records.push(d);
    const accept = ranked?.find(
      (r) => r.actions[0]?.type === 'optional' && (r.actions[0] as { accept?: boolean }).accept,
    );
    if (d.view.decision?.source?.ability === 'law-shield' && accept && accept.mean < -200)
      this.shieldLoses.add(d);
    const turn = d.view.turn.number;
    if (d.view.turn.activePlayer === this.ai && d.view.decision?.kind === 'main') {
      const last = this.turns[this.turns.length - 1];
      if (!last || last.turn !== turn) {
        const first = turn % 2 === 1 ? d.view.turn.activePlayer : other(d.view.turn.activePlayer);
        this.turns.push({
          turn,
          own: ownTurn(turn, first === this.ai),
          records: [],
          start: new Set(d.view.zones[this.ai].characters.map((c) => c.handle)),
          won: false,
        });
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
    if (this.leader === 'OP13-004') this.sabo();
    if (this.leader === 'OP15-058') this.enel();
    if (this.leader === 'OP12-061') this.rosinante();
    return [...this.tallies.values()];
  }

  private isPlay = (r: DecisionRecord, ids: string[]) =>
    r.action.type === 'playCard' && ids.includes(cardOf(r.view, r.action.card) ?? '');

  private attacks = (r: DecisionRecord) => r.view.actions.filter((a) => a.type === 'attack');

  // ---------------------------------------------------------------------------------------------
  // Sabo
  // ---------------------------------------------------------------------------------------------
  private sabo(): void {
    const me = this.ai;
    const big = (v: ProjectedView) => v.zones[me].characters.some((c) => (c.cost ?? 0) >= 12);
    // 1. A cost-12+ Character by T4, in games that reach the AI's fourth turn.
    if (this.turns.some((t) => t.own >= 4)) {
      const hit = this.turns.some(
        (t) => t.own <= 4 && t.records.some((r) => this.isPlay(r, ['OP17-089', 'OP17-119'])),
      );
      this.count(1, hit);
    }
    for (const tl of this.turns) {
      if (tl.won) continue;
      const mains = tl.records.filter((r) => r.view.decision?.kind === 'main');
      const leaderH = mains[0]?.view.zones[me].leader[0]?.handle;
      const leaderAttackAt = mains.findIndex(
        (r) => r.action.type === 'attack' && r.action.attacker === leaderH,
      );
      // 2. DON!! to Sabo with a cost-12 Character out and three or more attackers.
      const q2 = mains.findIndex((r) => {
        const attackers = new Set(this.attacks(r).map((a) => (a as { attacker: string }).attacker));
        return (
          big(r.view) &&
          attackers.size >= 3 &&
          r.view.actions.some((a) => a.type === 'giveDon' && a.target === leaderH)
        );
      });
      if (q2 >= 0) {
        const gave = mains.findIndex(
          (r) => r.action.type === 'giveDon' && r.action.target === leaderH,
        );
        this.count(2, gave >= 0 && (leaderAttackAt < 0 || gave < leaderAttackAt));
      }
      // 3. Loki as the enabler when no cost-12 Character is out and 6+ DON!! are active.
      const q3 = mains.find(
        (r) =>
          !big(r.view) &&
          r.view.don[me].active >= 6 &&
          r.view.actions.some(
            (a) => a.type === 'playCard' && cardOf(r.view, a.card) === 'OP17-119',
          ),
      );
      if (q3)
        this.count(
          3,
          mains.some((r) => this.isPlay(r, ['OP17-119'])),
        );
      // 4. Every eligible 2-cost Elbaph body attacks on turns a cost-12 Character is out.
      const q4 = mains.find(
        (r) =>
          big(r.view) &&
          this.attacks(r).some((a) =>
            SABO_BODIES.includes(cardOf(r.view, (a as { attacker: string }).attacker) ?? ''),
          ),
      );
      if (q4) {
        const eligible = new Set(
          this.attacks(q4)
            .map((a) => (a as { attacker: string }).attacker)
            .filter((h) => SABO_BODIES.includes(cardOf(q4.view, h) ?? '')),
        );
        const went = new Set(
          mains
            .filter((r) => r.action.type === 'attack')
            .map((r) => (r.action as { attacker: string }).attacker),
        );
        this.count(
          4,
          [...eligible].every((h) => went.has(h)),
        );
      }
    }
  }

  // ---------------------------------------------------------------------------------------------
  // Enel
  // ---------------------------------------------------------------------------------------------
  private enel(): void {
    const me = this.ai;
    for (const tl of this.turns) {
      const mains = tl.records.filter((r) => r.view.decision?.kind === 'main');
      const first = mains[0];
      if (!first) continue;
      // 1. The leader's surge on every turn from T2 when it is legal (finishing turns excepted).
      const surge = (a: Action) => a.type === 'activate' && a.ability === 'enel-surge';
      if (tl.own >= 2 && !tl.won && first.view.actions.some(surge))
        this.count(
          1,
          mains.some((r) => surge(r.action)),
        );
      // 3. A 1-cost Character on T1.
      if (
        tl.own === 1 &&
        first.view.actions.some(
          (a) => a.type === 'playCard' && ENEL_ONEDROPS.includes(cardOf(first.view, a.card) ?? ''),
        )
      )
        this.count(
          3,
          mains.some((r) => this.isPlay(r, ENEL_ONEDROPS)),
        );
      // 5. The finisher attacks every turn after the one it was played, while active.
      const enel = first.view.zones[me].characters.find(
        (c) => c.card === 'OP15-118' && !c.rested && tl.start.has(c.handle),
      );
      if (
        enel &&
        !tl.won &&
        first.view.actions.some((a) => a.type === 'attack' && a.attacker === enel.handle)
      )
        this.count(
          5,
          mains.some((r) => r.action.type === 'attack' && r.action.attacker === enel.handle),
        );
    }
    for (const [i, r] of this.records.entries()) {
      const dec = r.view.decision;
      // 4. The DON!! -1 draw on Ohm, Shura and Satori.
      if (
        dec?.kind === 'optional' &&
        dec.source &&
        ENEL_DRAWERS.includes(dec.source.card) &&
        dec.source.ability === 'on-play' &&
        r.view.actions.some((a) => a.type === 'optional' && a.accept)
      )
        this.count(4, r.action.type === 'optional' && r.action.accept);
      // 2. The surge's DON!! go to a Character that attacks in the same turn.
      if (dec?.kind === 'choose' && dec.source?.card === 'OP15-058' && r.action.type === 'pick') {
        const tl = this.turns.find((x) => x.turn === r.view.turn.number);
        const picks = r.view.actions.filter(
          (a): a is Extract<Action, { type: 'pick' }> =>
            a.type === 'pick' && typeof a.choice === 'string',
        );
        // The DON!! count choice has object options; the Character choice has handles.
        const chosen = r.action.choice;
        if (!tl || picks.length === 0 || typeof chosen !== 'string') continue;
        const canAttack = (h: string) => {
          const c = viewCard(r.view, h);
          return !!c && !c.rested && (tl.start.has(h) || c.keywords.includes('Rush'));
        };
        if (!picks.some((a) => canAttack(a.choice as string))) continue;
        const later = this.records
          .slice(i + 1)
          .filter((x) => x.view.turn.number === r.view.turn.number);
        this.count(
          2,
          later.some((x) => x.action.type === 'attack' && x.action.attacker === chosen),
          () => {
            const c = viewCard(r.view, chosen)!;
            const opp = r.view.zones[other(me)];
            return `T${r.view.turn.number} gave to ${c.card} power ${c.power} don ${c.don}; opp leader ${opp.leader[0]?.power}, hand ${opp.hand.length}, chars ${opp.characters.map((x) => `${x.card}:${x.power}${x.rested ? 'r' : ''}`).join(',')}; later: ${later.map((x) => x.action.type).join(',')}`;
          },
        );
      }
    }
  }

  // ---------------------------------------------------------------------------------------------
  // Rosinante
  // ---------------------------------------------------------------------------------------------
  private rosinante(): void {
    const me = this.ai;
    const discount = (a: Action) => a.type === 'activate' && a.ability === 'law-discount';
    // 2. A Law on the field by the end of T3, in games that reach the AI's third turn.
    if (this.turns.some((t) => t.own >= 3))
      this.count(
        2,
        this.turns.some((t) => t.own <= 3 && t.records.some((r) => this.isPlay(r, LAWS))),
      );
    for (const tl of this.turns) {
      let armed = false;
      for (const r of tl.records) {
        if (r.view.decision?.kind !== 'main') continue;
        if (discount(r.action)) {
          armed = true;
          // A discount no hand Law needed is a miss (it costs a DON!!).
          if (!r.view.zones[me].hand.some((h) => pays(r.view, h)))
            this.count(
              1,
              false,
              () =>
                `T${r.view.turn.number} needless discount; don ${JSON.stringify(r.view.don)} hand ${r.view.zones[me].hand.map((h) => h.card + ':' + h.cost)}`,
            );
        }
        if (!this.isPlay(r, LAWS)) continue;
        const card = r.action.type === 'playCard' ? viewCard(r.view, r.action.card) : null;
        if ((card?.cost ?? 0) < 4) continue;
        // 1. The discount first when it pays; no discount when it does not.
        if (r.view.actions.some(discount))
          this.count(
            1,
            !(card && pays(r.view, card)),
            () =>
              `T${r.view.turn.number} ${card?.card} played without discount though it pays; don ${JSON.stringify(r.view.don)}`,
          );
        else if (armed) armed = false;
        // 5. P-093 and EB04-038: own DON!! at or below the opponent's when played.
        if (card && ['P-093', 'EB04-038'].includes(card.card ?? '')) {
          const sum = (p: PlayerId) => {
            const d = r.view.don[p];
            return d.active + d.rested + d.given;
          };
          // Judged when the leader's DON!! -1 could level the count (the turn began at most one
          // above the opponent's): a DON!!-cycling opponent (Enel) can sit out of reach.
          const first = tl.records.find((x) => x.view.decision?.kind === 'main')!;
          const start = first.view.don[me];
          if (start.active + start.rested + start.given - 1 > sum(other(me))) continue;
          this.count(
            5,
            sum(me) <= sum(other(me)),
            () =>
              `T${r.view.turn.number} ${card.card} own ${sum(me)} opp ${sum(other(me))} discount ${armed ? 'armed' : 'no'} legal ${r.view.actions.some(discount)}`,
          );
        }
      }
    }
    for (const r of this.records) {
      const dec = r.view.decision;
      // 3. The leader's shield while Life is 2 or more (unless the search sees it lose the game).
      if (
        dec?.kind === 'optional' &&
        dec.source?.ability === 'law-shield' &&
        !this.shieldLoses.has(r) &&
        r.view.zones[me].life.length >= 2 &&
        r.view.actions.some((a) => a.type === 'optional' && a.accept)
      )
        this.count(
          3,
          r.action.type === 'optional' && r.action.accept,
          () =>
            `T${r.view.turn.number} shield declined, life ${r.view.zones[me].life.length} hand ${r.view.zones[me].hand.length}; battle ${JSON.stringify(r.view.turn)}`,
        );
      // 4. Removal on real threats: the target costs more than 2.
      if (
        dec?.kind === 'choose' &&
        dec.source &&
        REMOVAL.includes(dec.source.card) &&
        r.action.type === 'pick' &&
        typeof r.action.choice === 'string'
      ) {
        const c = viewCard(r.view, r.action.choice);
        if (c && r.view.zones[other(me)].characters.some((x) => x.handle === c.handle))
          this.count(
            4,
            (c.cost ?? 0) > 2,
            () =>
              `T${r.view.turn.number} ${dec.source!.card} on ${c.card} cost ${c.cost}; opp chars ${r.view.zones[other(me)].characters.map((x) => x.card + ':' + x.cost).join(',')}`,
          );
      }
    }
  }
}
