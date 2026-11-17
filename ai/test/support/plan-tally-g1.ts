/**
 * Game-plan assertions measured over AI games, for the group-1 playbooks (Nico Robin OP09-062,
 * Yellow Enel OP05-098, Kalgara OP08-098, Boa Hancock OP14-041). Same shape as `plan-tally.ts`
 * (ARCHITECTURE §4.6): each assertion is the guide's playbook seed with the threshold from
 * `ai/playbooks/<leader>.json`; a tally counts the qualifying situations and how many met the plan.
 * A turn the AI's own search scores as a win in at least half its samples is a finishing turn and
 * is not held to the plan, as in `plan-tally.ts`.
 */
import { queries, type ProjectedView, type PlayerId } from '@optcg/engine';
import { ownTurn, type AiTier } from '../../src/index.ts';
import type { DecisionRecord } from './match.ts';
import { cardMap } from '../support.ts';
import type { Tally } from './plan-tally.ts';

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');
const hasTrigger = (id: string | null) => !!cardMap().get(id ?? '')?.triggerText;

/** Characters with a [Trigger] and 4000 base power in the Big Mom lists (Linlin lifts these to 8000). */
const BIG_MOM_4000 = [
  'OP17-109',
  'OP17-102',
  'OP17-107',
  'OP17-106',
  'OP17-114',
  'OP17-110',
  'OP17-111',
];
const SHANDIAN = [
  'OP15-101',
  'OP08-110',
  'OP15-114',
  'OP12-099',
  'OP12-114',
  'OP08-099',
  'OP15-112',
];
/** Hancock's Life Triggers that play a Character (the guide's engine). */
const LIFE_PLAYERS = ['OP16-113', 'OP14-105', 'OP14-107', 'OP14-114'];

interface TurnLog {
  turn: number;
  own: number;
  first: DecisionRecord;
  records: DecisionRecord[];
  won: boolean;
}

export class PlanTallyG1 {
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

  get exempt(): { finishing: number; turns: number } {
    return { finishing: this.turns.filter((t) => t.won).length, turns: this.turns.length };
  }

  finish(): Tally[] {
    if (this.leader === 'OP09-062') this.robin();
    if (this.leader === 'OP05-098') this.enel();
    if (this.leader === 'OP08-098') this.kalgara();
    if (this.leader === 'OP14-041') this.hancock();
    return [...this.tallies.values()];
  }

  // ---- helpers -------------------------------------------------------------------------------

  private cardIn(view: ProjectedView, handle: string): string {
    for (const p of ['p1', 'p2'] as const)
      for (const z of Object.values(view.zones[p])) {
        const c = z.find((x) => x.handle === handle);
        if (c) return c.card ?? '';
      }
    return '';
  }

  private playedAt(tl: TurnLog, card: string): number {
    return tl.records.findIndex(
      (r) => r.action.type === 'playCard' && this.cardIn(r.view, r.action.card) === card,
    );
  }

  private legalPlay(tl: TurnLog, card: string): boolean {
    return tl.records.some(
      (r) =>
        r.view.decision?.kind === 'main' &&
        r.view.actions.some((a) => a.type === 'playCard' && this.cardIn(r.view, a.card) === card),
    );
  }

  private handOf(tl: TurnLog): string[] {
    return tl.first.view.zones[this.ai].hand.map((c) => c.card ?? '');
  }

  private donOnField(v: ProjectedView): number {
    const d = v.don[this.ai];
    return d.active + d.rested + d.given;
  }

  // ---- Nico Robin ----------------------------------------------------------------------------

  private robin(): void {
    const me = this.ai;
    let puddingChance = false;
    let puddingPaid = false;
    let yamatoSeen = false;
    let reachedT5 = false;
    let linlinByT5 = false;
    for (const tl of this.turns) {
      const v = tl.first.view;
      const leader = v.zones[me].leader[0]!.handle;
      const hand = this.handOf(tl);
      if (tl.own >= 5) reachedT5 = true;
      // 1. The Leader attacks and pitches a Trigger card, from T2.
      if (
        tl.own >= 2 &&
        !tl.won &&
        v.actions.some((a) => a.type === 'attack' && a.attacker === leader) &&
        hand.some(hasTrigger) &&
        v.don[me].deck > 0
      ) {
        const t = this.t(1, 'Leader attacks and pitches a Trigger card from T2', 0.9);
        t.total++;
        const attacked = tl.records.some(
          (r) => r.action.type === 'attack' && r.action.attacker === leader,
        );
        const pitched = tl.records.some(
          (r) =>
            r.view.decision?.kind === 'optional' &&
            r.view.decision.source?.card === 'OP09-062' &&
            r.action.type === 'optional' &&
            r.action.accept,
        );
        if (attacked && pitched) t.hits++;
      }
      // 2. Yamato the first turn it is affordable.
      if (!yamatoSeen && hand.includes('OP17-074') && this.legalPlay(tl, 'OP17-074') && !tl.won) {
        yamatoSeen = true;
        const t = this.t(2, 'Plays Yamato the first turn it is affordable', 0.8);
        t.total++;
        if (this.playedAt(tl, 'OP17-074') >= 0) t.hits++;
      }
      // 3. Pudding by T3, her cost paid (needs another Trigger card to trash).
      if (tl.own <= 3) {
        if (
          !tl.won &&
          hand.includes('OP17-109') &&
          this.legalPlay(tl, 'OP17-109') &&
          hand.filter(hasTrigger).length >= 2
        )
          puddingChance = true;
        const i = this.playedAt(tl, 'OP17-109');
        if (
          i >= 0 &&
          tl.records.some(
            (r) =>
              r.view.decision?.kind === 'optional' &&
              r.view.decision.source?.card === 'OP17-109' &&
              r.action.type === 'optional' &&
              r.action.accept,
          )
        )
          puddingPaid = true;
      }
      // 4. Linlin by T5.
      if (tl.own <= 5 && this.playedAt(tl, 'OP17-112') >= 0) linlinByT5 = true;
      // 5. Two 8000-power Trigger Characters attack on a Linlin turn.
      const field = v.zones[me].characters;
      if (!tl.won && field.some((c) => c.card === 'OP17-112')) {
        const able = new Set(
          tl.records
            .filter((r) => r.view.decision?.kind === 'main')
            .flatMap((r) =>
              r.view.actions.flatMap((a) => {
                if (a.type !== 'attack') return [];
                const c = r.view.zones[me].characters.find((x) => x.handle === a.attacker);
                return c && (c.power ?? 0) >= 8000 && hasTrigger(c.card) ? [c.handle] : [];
              }),
            ),
        );
        if (able.size >= 2) {
          const t = this.t(
            5,
            'Attacks with two 8000-power Trigger Characters on a Linlin turn',
            0.7,
          );
          t.total++;
          const went = new Set(
            tl.records.flatMap((r) =>
              r.action.type === 'attack' && able.has(r.action.attacker) ? [r.action.attacker] : [],
            ),
          );
          if (went.size >= 2) t.hits++;
        }
      }
    }
    if (puddingChance) {
      const t = this.t(3, 'Plays Pudding with her cost paid by T3', 0.8);
      t.total++;
      if (puddingPaid) t.hits++;
    }
    if (reachedT5) {
      const t = this.t(4, 'Casts Linlin by T5 (games that reach T5)', 0.5);
      t.total++;
      if (linlinByT5) t.hits++;
    }
  }

  // ---- Yellow Enel ---------------------------------------------------------------------------

  private enel(): void {
    for (const r of this.records) {
      const dec = r.view.decision;
      const offered = r.view.actions.some((a) => a.type === 'optional' && a.accept);
      const accepted = r.action.type === 'optional' && r.action.accept;
      // 1. Pudding's cost, when it is on offer (a Trigger card in hand).
      if (dec?.kind === 'optional' && dec.source?.card === 'OP17-109' && offered) {
        const t = this.t(1, 'Pays Pudding’s “trash a Trigger card” cost when it can', 0.85);
        t.total++;
        if (accepted) t.hits++;
      }
      // 3. The rest-2-DON!! cost of Sweet 3 Generals and Smoothie.
      if (
        dec?.kind === 'optional' &&
        (dec.source?.card === 'OP17-114' || dec.source?.card === 'OP17-106') &&
        offered
      ) {
        const t = this.t(3, 'Pays the rest-2-DON!! cost of Sweet 3 Generals or Smoothie', 0.8);
        t.total++;
        if (accepted) t.hits++;
      }
      // 2. Linlin with two 4000-base Trigger Characters on the field.
      if (
        r.action.type === 'playCard' &&
        dec?.kind === 'main' &&
        this.cardIn(r.view, r.action.card) === 'OP17-112'
      ) {
        const n = r.view.zones[this.ai].characters.filter((c) =>
          BIG_MOM_4000.includes(c.card ?? ''),
        ).length;
        const t = this.t(2, 'Plays Linlin with two 4000-base Trigger Characters on the field', 0.6);
        t.total++;
        if (n >= 2) t.hits++;
      }
    }
  }

  // ---- Kalgara -------------------------------------------------------------------------------

  private kalgara(): void {
    const me = this.ai;
    for (const tl of this.turns) {
      const v = tl.first.view;
      const leader = v.zones[me].leader[0]!.handle;
      const hand = this.handOf(tl);
      const don = this.donOnField(v);
      const cost = (id: string) => cardMap().get(id)?.cost ?? 99;
      // 1. The Leader attacks with a DON!! given and uses the free play.
      if (
        tl.own >= 2 &&
        !tl.won &&
        v.actions.some((a) => a.type === 'attack' && a.attacker === leader) &&
        hand.some((c) => SHANDIAN.includes(c) && cost(c) <= don)
      ) {
        const t = this.t(1, 'Leader attacks with a DON!! given and plays a Shandian Warrior', 0.9);
        t.total++;
        const atk = tl.records.find(
          (r) => r.action.type === 'attack' && r.action.attacker === leader,
        );
        const given = (atk?.view.zones[me].leader[0]?.don ?? 0) >= 1;
        const free = tl.records.some(
          (r) =>
            r.view.decision?.source?.card === 'OP08-098' &&
            r.view.decision.kind === 'choose' &&
            r.action.type === 'pick' &&
            typeof r.action.choice === 'string' &&
            SHANDIAN.includes(this.cardIn(r.view, r.action.choice)),
        );
        if (atk && given && free) t.hits++;
      }
      // 3. Upper Yard on the field by the end of T2, when it was in hand on T1 or T2.
      // 4. Sweet 3 Generals before Wyper OP15-114 when both resolve in one turn.
      const sweet = this.playedAt(tl, 'OP17-114');
      const wyperPick = tl.records.findIndex(
        (r) =>
          r.view.decision?.source?.card === 'OP08-098' &&
          r.action.type === 'pick' &&
          typeof r.action.choice === 'string' &&
          this.cardIn(r.view, r.action.choice) === 'OP15-114',
      );
      const wyperHand = this.playedAt(tl, 'OP15-114');
      const wyper = [wyperPick, wyperHand].filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? -1;
      if (sweet >= 0 && wyper >= 0) {
        const t = this.t(4, 'Sweet 3 Generals resolves before Wyper when both do', 0.8);
        t.total++;
        if (sweet < wyper) t.hits++;
      }
      // 5. Kingdom Come only on a turn that wins.
      const kc = this.playedAt(tl, 'EB01-059');
      if (kc >= 0) {
        const t = this.t(5, 'Plays Kingdom Come only on a turn that wins', 1.0);
        t.total++;
        if (tl.won) t.hits++;
      }
    }
    // 3. (per game)
    let yardChance = false;
    let yardOut = false;
    for (const tl of this.turns) {
      if (tl.own > 2) break;
      if (!tl.won && this.handOf(tl).includes('OP05-117')) yardChance = true;
      const last = tl.records[tl.records.length - 1];
      if (last && queries.zone(last.after, me, 'stage').some((c) => c.card === 'OP05-117'))
        yardOut = true;
    }
    if (yardChance) {
      const t = this.t(3, 'Has Upper Yard on the field by the end of T2 when it holds one', 0.6);
      t.total++;
      if (yardOut) t.hits++;
    }
    // 2. The free play is the highest-cost candidate.
    for (const r of this.records) {
      const dec = r.view.decision;
      if (
        dec?.kind !== 'choose' ||
        dec.source?.card !== 'OP08-098' ||
        r.action.type !== 'pick' ||
        typeof r.action.choice !== 'string'
      )
        continue;
      const picks = r.view.actions.filter(
        (a): a is Extract<typeof a, { type: 'pick' }> =>
          a.type === 'pick' && typeof a.choice === 'string',
      );
      if (picks.length < 2) continue;
      const costOf = (h: string) => cardMap().get(this.cardIn(r.view, h))?.cost ?? 0;
      const best = Math.max(...picks.map((a) => costOf(a.choice as string)));
      const t = this.t(2, 'The free play is the highest-cost Shandian Warrior in hand', 0.75);
      t.total++;
      if (costOf(r.action.choice) === best) t.hits++;
    }
  }

  // ---- Boa Hancock ---------------------------------------------------------------------------

  private hancock(): void {
    const me = this.ai;
    for (const tl of this.turns) {
      // 1. Ends the turn with a DON!! given to the Leader, from T2.
      const end = tl.records.find((r) => r.action.type === 'endTurn');
      if (tl.own >= 2 && !tl.won && end) {
        const t = this.t(1, 'Ends each turn from T2 with a DON!! given to the Leader', 0.8);
        t.total++;
        if ((end.view.zones[me].leader[0]?.don ?? 0) >= 1) t.hits++;
      }
    }
    for (const r of this.records) {
      const dec = r.view.decision;
      // 2. Every Life Trigger that plays a Character is activated.
      // The Trigger decision carries no source: the prompt names the card ("the [Trigger] of X").
      const named = LIFE_PLAYERS.some((id) =>
        dec?.prompt.includes(`[Trigger] of ${cardMap().get(id)?.name}`),
      );
      if (
        dec?.kind === 'trigger' &&
        named &&
        r.view.actions.some((a) => a.type === 'trigger' && a.activate)
      ) {
        const t = this.t(2, 'Activates a Life Trigger that plays a Character', 0.95);
        t.total++;
        if (r.action.type === 'trigger' && r.action.activate) t.hits++;
      }
      // 3. Shakuyaku from hand only when they have 3 or less Life.
      if (
        r.action.type === 'playCard' &&
        dec?.kind === 'main' &&
        this.cardIn(r.view, r.action.card) === 'OP14-107'
      ) {
        const t = this.t(3, 'Plays Shakuyaku only when they have 3 or less Life', 0.8);
        t.total++;
        if (r.view.zones[other(me)].life.length <= 3) t.hits++;
      }
    }
    // 4. Hiyori puts a Trigger card on top of the Life when one is in hand.
    for (let i = 0; i < this.records.length; i++) {
      const r = this.records[i]!;
      if (
        r.action.type !== 'playCard' ||
        r.view.decision?.kind !== 'main' ||
        this.cardIn(r.view, r.action.card) !== 'OP06-106'
      )
        continue;
      const played = r.action.card;
      const handAfter = r.view.zones[me].hand.filter((c) => c.handle !== played);
      if (!handAfter.some((c) => hasTrigger(c.card))) continue;
      const t = this.t(4, 'Hiyori puts a Trigger card on top of the Life', 0.8);
      t.total++;
      const pick = this.records
        .slice(i + 1, i + 6)
        .find(
          (x) =>
            x.view.decision?.source?.card === 'OP06-106' &&
            x.action.type === 'pick' &&
            typeof x.action.choice === 'string' &&
            x.view.zones[me].hand.some((c) => c.handle === (x.action as { choice: string }).choice),
        );
      if (
        pick &&
        pick.action.type === 'pick' &&
        typeof pick.action.choice === 'string' &&
        hasTrigger(this.cardIn(pick.view, pick.action.choice))
      )
        t.hits++;
    }
  }
}
