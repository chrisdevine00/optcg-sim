/**
 * Game-plan assertions measured over AI games, group 2 (ST30-001, OP13-001, OP17-079). Same idea as
 * `plan-tally.ts`: each assertion is the guide's playbook seed with the threshold from
 * `ai/playbooks/<leader>.json`; a tally counts qualifying situations and how many met the plan.
 * A turn the AI's own search scores as a win in at least half its samples is a finishing turn and
 * is not judged by the plan (as in `plan-tally.ts`).
 */
import { queries, type PlayerId, type ProjectedView, type ViewCard } from '@optcg/engine';
import { ownTurn, type AiTier } from '../../src/index.ts';
import { cardMap } from '../support.ts';
import type { Tally } from './plan-tally.ts';
import type { DecisionRecord } from './match.ts';

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

const SEARCHERS = ['OP01-016', 'EB02-017', 'EB04-002', 'ST31-005'];
const GIANT_REPLAYS = ['OP17-094', 'OP17-081'];

interface TurnLog {
  turn: number;
  own: number;
  first: DecisionRecord;
  records: DecisionRecord[];
  won: boolean;
}

function find(view: ProjectedView, handle: string): ViewCard | undefined {
  for (const p of ['p1', 'p2'] as const)
    for (const z of Object.values(view.zones[p])) {
      const c = z.find((x) => x.handle === handle);
      if (c) return c;
    }
  return undefined;
}

/** One game's tally for the AI seat `ai` (only the Pirate's decisions are judged). */
export class PlanTallyG2 {
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

  private count(seed: number, text: string, threshold: number, hit: boolean): void {
    const t = this.t(seed, text, threshold);
    t.total++;
    if (hit) t.hits++;
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

  finish(): Tally[] {
    if (this.leader === 'ST30-001') this.luffyAce();
    if (this.leader === 'OP13-001') this.luffyRedGreen();
    if (this.leader === 'OP17-079') this.luffyBlack();
    return [...this.tallies.values()];
  }

  /** The card behind a handle of this record's view. */
  private card(r: DecisionRecord, handle: string): string | null {
    return find(r.view, handle)?.card ?? null;
  }

  private playedCard(r: DecisionRecord): string | null {
    return r.action.type === 'playCard' ? this.card(r, r.action.card) : null;
  }

  private played(tl: TurnLog, card: string): boolean {
    return tl.records.some((r) => this.playedCard(r) === card);
  }

  private hand(tl: TurnLog): string[] {
    return tl.first.view.zones[this.ai].hand.map((c) => c.card ?? '');
  }

  /** Is playing one of `ids` legal at the turn's first decision? */
  private canPlay(tl: TurnLog, ids: string[]): boolean {
    return tl.first.view.actions.some(
      (a) => a.type === 'playCard' && ids.includes(this.card(tl.first, a.card) ?? ''),
    );
  }

  private luffyAce(): void {
    const me = this.ai;
    const foe = other(me);
    const cards = cardMap();
    for (const tl of this.turns) {
      if (tl.won) continue;
      // 1. A 1-cost searcher or Thousand Sunny on T1 when holding one.
      if (tl.own === 1 && this.canPlay(tl, SEARCHERS))
        this.count(
          1,
          'Plays a 1-cost searcher or Thousand Sunny on T1',
          0.9,
          SEARCHERS.some((c) => this.played(tl, c)),
        );
      // 2. Sanji on T3 when a free target is in hand.
      if (tl.own === 3 && this.canPlay(tl, ['ST31-001'])) {
        const targets = this.hand(tl).filter((c) => {
          const card = cards.get(c);
          return (
            card?.category === 'Character' &&
            c !== 'ST31-001' &&
            (card.cost ?? 9) <= 5 &&
            (card.types ?? []).includes('Straw Hat Crew')
          );
        });
        if (targets.length > 0)
          this.count(2, 'Plays Sanji into a free Luffy on T3', 0.8, this.played(tl, 'ST31-001'));
      }
      for (let i = 0; i < tl.records.length; i++) {
        const r = tl.records[i]!;
        const v = r.view;
        const leader = v.zones[me].leader[0]!;
        // 3. Every spare DON!! on a T2–T4 Leader attack.
        if (
          tl.own >= 2 &&
          tl.own <= 4 &&
          r.action.type === 'attack' &&
          r.action.attacker === leader.handle
        ) {
          const active = v.don[me].active;
          const reserve = v.zones[me].hand
            .map((c) => cards.get(c.card ?? ''))
            .filter((c) => c?.category === 'Event' && c.counter)
            .map((c) => c!.cost ?? 0)
            .filter((c) => c <= active);
          const held = reserve.length ? Math.min(...reserve) : 0;
          // DON!! the rest of the turn spends: on plays, and on gifts to a later attacker.
          const later = tl.records.slice(i + 1).reduce((n, x) => {
            if (x.action.type === 'giveDon') return n + 1;
            if (x.action.type !== 'playCard') return n;
            return n + (find(x.view, x.action.card)?.cost ?? 0);
          }, 0);
          this.count(
            3,
            'Gives every spare DON!! to the Leader before a T2–T4 attack',
            0.8,
            active - held - later <= 0,
          );
        }
        const id = this.playedCard(r);
        if (!id) continue;
        const card = cards.get(id);
        // 4. Never a Character with 7000+ base power.
        if (card?.category === 'Character')
          this.count(
            4,
            'Never plays a Character with 7000+ base power',
            1.0,
            (card.power ?? 0) < 7000,
          );
        // 5. I Know You're Strong only against a rested Character with cost 7 or less.
        if (id === 'OP13-040')
          this.count(
            5,
            "Casts I Know You're Strong's [Main] only against a rested Character, cost 7 or less",
            1.0,
            v.zones[foe].characters.some((c) => c.rested && (c.cost ?? 99) <= 7),
          );
        // 6. Demon Aura only against an active Character or active DON!!, before the Leader attacks.
        if (id === 'OP12-037')
          this.count(
            6,
            "Casts Demon Aura's [Main] only against active cards, before the Leader attacks",
            1.0,
            !leader.rested &&
              (v.zones[foe].characters.some((c) => !c.rested) || v.don[foe].active > 0),
          );
      }
    }
  }

  private luffyRedGreen(): void {
    const me = this.ai;
    for (const tl of this.turns) {
      if (tl.won) continue;
      // 5. A searcher on T1.
      if (tl.own === 1 && this.canPlay(tl, SEARCHERS))
        this.count(
          5,
          'Plays a searcher (Nami, Bonney or Thousand Sunny) on T1',
          0.9,
          SEARCHERS.some((c) => this.played(tl, c)),
        );
      const end = tl.records.find((r) => r.action.type === 'endTurn');
      if (end) {
        // 1. A DON!! on the Leader at the end of every turn from T2.
        if (tl.own >= 2)
          this.count(
            1,
            'Ends every turn from T2 with a DON!! given to the Leader',
            0.9,
            (end.view.zones[me].leader[0]?.don ?? 0) >= 1,
          );
        // 3. 1 to 5 active DON!! when the turn ends (after its end-of-turn effects), from T3.
        if (tl.own >= 3) {
          const last = tl.records[tl.records.length - 1]!;
          const active = queries.don(last.after, me).active;
          this.count(
            3,
            'Ends each turn from T3 with 1 to 5 active DON!!',
            0.8,
            active >= 1 && active <= 5,
          );
        }
      }
      // 2. Sanji before Luffy OP13-118 when both are played.
      const sanji = tl.records.findIndex((r) => this.playedCard(r) === 'OP13-027');
      const luffy = tl.records.findIndex((r) => this.playedCard(r) === 'OP13-118');
      if (sanji >= 0 && luffy >= 0)
        this.count(2, 'Plays Sanji before Luffy OP13-118 when it plays both', 1.0, sanji < luffy);
    }
    // 4. At a Counter decision where Charlestone is playable and the Leader's DON!! rest already
    // leaves the defender above the attacker, it is not played.
    for (const r of this.records) {
      const v = r.view;
      if (v.decision?.kind !== 'counter' || !v.battle) continue;
      const charlestone = v.actions.filter(
        (a) =>
          (a.type === 'counter' || a.type === 'activate') && this.card(r, a.card) === 'OP05-038',
      );
      if (charlestone.length === 0) continue;
      const attacker = find(v, v.battle.attacker);
      const target = find(v, v.battle.target);
      if (!attacker || !target || (attacker.power ?? 0) >= (target.power ?? 0)) continue;
      const used =
        (r.action.type === 'counter' || r.action.type === 'activate') &&
        this.card(r, r.action.card) === 'OP05-038';
      this.count(
        4,
        "Does not also play Charlestone when the Leader's DON!! rest alone beats the attacker",
        0.8,
        !used,
      );
    }
  }

  private luffyBlack(): void {
    const me = this.ai;
    // Costs are read from the engine state (the view shows printed costs).
    const big = (r: DecisionRecord) =>
      queries.zone(r.before, me, 'characters').filter((c) => (c.cost ?? 0) >= 12).length;
    let t1Giant = false;
    for (const tl of this.turns) {
      if (tl.won) continue;
      if (tl.own <= 2 && this.hand(tl).some((c) => GIANT_REPLAYS.includes(c))) t1Giant = true;
      // 1. A cost-12+ Character by the end of T2 (judged in games that held a Giant by then).
      if (tl.own === 2 && t1Giant) {
        const last = tl.records[tl.records.length - 1]!;
        const n = queries
          .zone(last.after, me, 'characters')
          .filter((c) => (c.cost ?? 0) >= 12).length;
        this.count(1, 'Has a cost-12+ Character on the field by the end of T2', 0.7, n >= 1);
      }
      // 4. Two or more cost-12+ Characters at the end of each turn from T4.
      if (tl.own >= 4) {
        const last = tl.records[tl.records.length - 1]!;
        const n = queries
          .zone(last.after, me, 'characters')
          .filter((c) => (c.cost ?? 0) >= 12).length;
        this.count(4, 'Keeps two or more cost-12+ Characters on the field from T4', 0.6, n >= 2);
      }
      // 2. Luffy OP17-093 only with a cost-12+ Character out, and he attacks that turn.
      for (let i = 0; i < tl.records.length; i++) {
        const r = tl.records[i]!;
        if (this.playedCard(r) !== 'OP17-093') continue;
        const attacked = tl.records
          .slice(i + 1)
          .some(
            (x) => x.action.type === 'attack' && this.card(x, x.action.attacker) === 'OP17-093',
          );
        this.count(
          2,
          'Plays Luffy OP17-093 only with a cost-12+ Character out, and attacks with him',
          0.8,
          big(r) >= 1 && attacked,
        );
      }
    }
    // 3. Luffy's On Play replays a Rodo or Gerd when one is in the trash.
    for (const r of this.records) {
      const dec = r.view.decision;
      if (dec?.kind !== 'choose' || dec.source?.card !== 'OP17-093' || r.action.type !== 'pick')
        continue;
      const options = r.view.actions.flatMap((a) =>
        a.type === 'pick' && typeof a.choice === 'string' ? [this.card(r, a.choice)] : [],
      );
      if (!options.some((c) => c && GIANT_REPLAYS.includes(c))) continue;
      const chosen = typeof r.action.choice === 'string' ? this.card(r, r.action.choice) : null;
      this.count(
        3,
        "Uses Luffy's On Play to replay a Rodo or Gerd from the trash",
        0.8,
        !!chosen && GIANT_REPLAYS.includes(chosen),
      );
    }
  }
}
