/**
 * The coach's state and its lethal detector (learning-ui §2, §3). It belongs to a game controller
 * and reads only the screen player's own view.
 *
 * Hidden information (the L done criterion): the detector runs in `public` mode only, from
 * `session.searchView(me)`, the player's own view with every hidden card stripped, in a worker that
 * holds only the player's own data and the public archetype prior. Whether it runs, when it runs
 * and what it says are functions of that view, never of the opponent's hidden cards. `actual`
 * mode exists only in review, after the game has ended (`review/`).
 */
import type { Card } from '@optcg/cards';
import {
  checkGuidedCount,
  explainLethal,
  guidedCount,
  priorCardIds,
  tier1,
  tier2,
  type CountCheck,
  type Explanation,
  type GuidedCount,
  type LethalResult,
  type Tier1,
} from '@optcg/ai';
import type { PlayerId, ProjectedView } from '@optcg/engine';
import type { GameSession } from '../../session/index.ts';
import type { LethalPort } from '../game/ai-client.ts';
import {
  loadProfile,
  recordLethalProgress,
  saveProfile,
  type AlwaysOn,
  type CoachProfile,
} from './profile.ts';

/** What the coach needs from its game. */
export interface CoachHost {
  readonly me: PlayerId;
  readonly hotseat: boolean;
  readonly readOnly: boolean;
  readonly cards: Map<string, Card>;
  readonly session: GameSession;
  myDecision(): boolean;
  announce(text: string): void;
  /** Re-render. Never calls `Coach.sync`. */
  notify(): void;
  /** The worker for the detector, started on first use with `init` data. */
  makePort(init: Card[]): LethalPort;
}

export type Tier = 0 | 1 | 2 | 3;

export interface LethalState {
  /** The position the answer belongs to; null when no check applies now. */
  key: string | null;
  status: 'idle' | 'checking' | 'ready' | 'failed';
  result: LethalResult | null;
  /** How far the player has revealed (always-on settings start at 1 or 2). */
  tier: Tier;
  /** The answer came from the background detector, not a press. */
  auto: boolean;
}

export interface GuidedState {
  step: 1 | 2 | 3 | 4;
  hits: string;
  /** Refs of the cards the player says can attack their Leader. */
  picked: string[];
  /** The player's DON!! split in attack order. */
  split: { ref: string; don: number }[];
  check: CountCheck | null;
  data: GuidedCount;
}

const IDLE: LethalState = { key: null, status: 'idle', result: null, tier: 0, auto: false };

/** Wall-clock cap for the live detector: a late answer is "Couldn't finish checking", never "no lethal". */
const CAP_MS = 1500;

/** Card ids a view lets its player identify (all public to that player). */
export function visibleIds(v: ProjectedView): Set<string> {
  const out = new Set<string>();
  for (const p of ['p1', 'p2'] as const)
    for (const z of Object.values(v.zones[p])) for (const c of z) if (c.card) out.add(c.card);
  for (const c of [...v.resolving, ...v.looking]) if (c.card) out.add(c.card);
  for (const id of Object.values(v.known)) out.add(id);
  return out;
}

export class Coach {
  profile: CoachProfile = loadProfile();
  lethal: LethalState = IDLE;
  guided: GuidedState | null = null;
  /** Cards lit by a "Show" button: handles in the screen player's view. */
  shown: { refs: string[]; step: number } | null = null;
  /** The section tab asked for since the last press of a coach key (focus goes to its result). */
  focusSignal = 0;
  /** `tall` was asked for by the player (tier 3, the guided count). */
  wantTall = false;

  private port: LethalPort | null = null;
  private pending: { id: number; key: string; auto: boolean } | null = null;
  private lastSpoken = '';

  constructor(private readonly host: CoachHost) {}

  // -------------------------------------------------------------------------------------------
  // Where the detector applies
  // -------------------------------------------------------------------------------------------

  /** The detector runs against the AI, in the player's own idle Main Phase. */
  get supported(): boolean {
    return !this.host.hotseat && !this.host.readOnly;
  }

  /** Is the player in an idle Main Phase decision (the only time a lethal check means anything)? */
  private positionKey(): string | null {
    if (!this.supported || !this.host.myDecision()) return null;
    const v = this.host.session.view(this.host.me);
    if (v.result || v.battle || v.decision?.kind !== 'main') return null;
    return `${this.host.session.actionCount}|${v.turn.number}`;
  }

  /** Called on every change of the game: keeps the answer tied to the position. */
  sync(): void {
    const key = this.positionKey();
    if (key === this.lethal.key) return;
    this.cancelPending();
    this.guided = null;
    this.shown = null;
    this.wantTall = false;
    this.lethal = { ...IDLE, key };
    if (key && this.profile.alwaysOn > 0) this.request(true);
    this.host.notify();
  }

  // -------------------------------------------------------------------------------------------
  // Requests
  // -------------------------------------------------------------------------------------------

  private ensurePort(view: ProjectedView): LethalPort {
    if (!this.port) {
      const opp: PlayerId = this.host.me === 'p1' ? 'p2' : 'p1';
      const leader = view.zones[opp].leader[0]?.card;
      // The public prior for their Leader's archetype, then whatever the player can see.
      const init: Card[] = [];
      const seen = new Set<string>();
      const add = (id: string | null | undefined) => {
        const c = id ? this.host.cards.get(id) : undefined;
        if (c && !seen.has(c.id)) {
          seen.add(c.id);
          init.push(c);
        }
      };
      add(leader);
      this.port = this.host.makePort(init);
    }
    return this.port;
  }

  private request(auto: boolean): void {
    const key = this.lethal.key;
    if (!key) return;
    const view = this.host.session.view(this.host.me);
    const port = this.ensurePort(view);
    // Card data the player's own view shows, plus the public prior the worker already holds.
    const cards: Card[] = [];
    for (const id of visibleIds(view)) {
      const c = this.host.cards.get(id);
      if (c) cards.push(c);
    }
    for (const c of this.priorCards(view)) cards.push(c);
    port.reveal(cards);
    const r = port.lethal(this.host.session.searchView(this.host.me), {
      priority: auto ? 4 : 2,
      capMs: CAP_MS,
    });
    this.pending = { id: r.id, key, auto };
    this.lethal = { ...this.lethal, status: 'checking', auto };
    r.result.then(
      (a) => {
        if (this.pending?.id !== r.id || this.lethal.key !== key) return;
        this.pending = null;
        const base = this.lethal.tier;
        const tier = (auto ? Math.max(base, this.profile.alwaysOn) : Math.max(1, base)) as Tier;
        this.lethal = { key, status: 'ready', result: a.result, tier, auto: auto && base === 0 };
        this.speakResult(auto);
        this.host.notify();
      },
      (e: unknown) => {
        if (this.pending?.id !== r.id) return;
        this.pending = null;
        if (e instanceof Error && e.message === 'cancelled') return;
        this.lethal = { ...this.lethal, status: 'failed' };
        this.host.notify();
      },
    );
  }

  /** The public archetype prior's cards for their Leader (the sourced lists), where the map has them. */
  private priorCards(view: ProjectedView): Card[] {
    const opp: PlayerId = this.host.me === 'p1' ? 'p2' : 'p1';
    const leader = view.zones[opp].leader[0]?.card;
    if (!leader) return [];
    const out: Card[] = [];
    for (const id of priorCardIds(leader)) {
      const c = this.host.cards.get(id);
      if (c) out.push(c);
    }
    return out;
  }

  private cancelPending(): void {
    if (this.pending) this.port?.cancel(this.pending.id);
    this.pending = null;
  }

  dispose(): void {
    this.cancelPending();
    this.port?.terminate();
    this.port = null;
  }

  // -------------------------------------------------------------------------------------------
  // The tiers (learning-ui §3.1)
  // -------------------------------------------------------------------------------------------

  /** What tier 1 says now, or null while nothing has been revealed or checked. */
  tier1(): Tier1 | null {
    return this.lethal.result ? tier1(this.lethal.result) : null;
  }

  tier2() {
    return this.lethal.result ? tier2(this.lethal.result) : null;
  }

  explanation(): Explanation | null {
    return this.lethal.result ? explainLethal(this.lethal.result, this.host.cards, 'coach') : null;
  }

  private speakResult(auto: boolean): void {
    const r = this.lethal.result;
    if (!r) return;
    const t = this.lethal.tier;
    const text = t >= 2 ? tier2(r).sr : t === 1 ? tier1(r).sr : '';
    if (!text) return;
    // The background detector speaks only when its answer changes (learning-ui §2.2: polite).
    if (auto && text === this.lastSpoken) return;
    this.lastSpoken = text;
    this.host.announce(text);
  }

  /**
   * The Lethal button or L: the first press shows tier 1, each further press the next tier. The
   * panel opens on the Lethal section and focus goes to its result.
   */
  press(): void {
    if (!this.supported) {
      this.host.announce(
        this.host.readOnly
          ? 'Lethal check: not available on a restored position.'
          : 'Lethal check: available when you play the AI.',
      );
      return;
    }
    if (!this.lethal.key) {
      this.host.announce('Lethal check: available in your Main Phase.');
      return;
    }
    this.profile = { ...this.profile, expanded: true, tab: 'lethal' };
    saveProfile(this.profile);
    this.focusSignal++;
    const { status, result, tier } = this.lethal;
    if (status === 'idle' || status === 'failed') {
      this.lethal = { ...this.lethal, tier: 1, auto: false };
      this.request(false);
      this.progress('tier1');
    } else if (status === 'checking') {
      this.lethal = { ...this.lethal, tier: Math.max(1, tier) as Tier, auto: false };
    } else if (result) {
      const next = (tier >= 3 ? 3 : tier + 1) as Tier;
      this.lethal = { ...this.lethal, tier: next, auto: false };
      if (next === 3) this.wantTall = true;
      this.speakTier(next);
    }
    this.host.notify();
  }

  private speakTier(t: Tier): void {
    const r = this.lethal.result;
    if (!r) return;
    if (t === 1) this.host.announce(tier1(r).sr);
    else if (t === 2) {
      this.host.announce(tier2(r).sr);
      this.progress('tier2');
    } else if (t === 3) {
      const ex = explainLethal(r, this.host.cards, 'coach');
      this.host.announce(`${ex.claim} ${ex.outcome}`);
      this.progress('tier3');
    }
  }

  /** "Show the line" (from the guided count or tier 2): reveals tier 3. */
  showLine(): void {
    if (this.lethal.status !== 'ready') return;
    this.guided = null;
    this.profile = { ...this.profile, expanded: true, tab: 'lethal' };
    this.lethal = { ...this.lethal, tier: 3, auto: false };
    this.wantTall = true;
    this.focusSignal++;
    this.speakTier(3);
    this.host.notify();
  }

  /** Check again after "Couldn't finish checking". */
  retry(): void {
    if (!this.lethal.key) return;
    this.cancelPending();
    this.lethal = { ...this.lethal, status: 'idle', result: null };
    this.request(false);
    this.host.notify();
  }

  private progress(step: 'tier1' | 'tier2' | 'count' | 'tier3'): void {
    const turn = this.host.session.view(this.host.me).turn.number;
    recordLethalProgress(this.host.session.seed, turn, step);
  }

  // -------------------------------------------------------------------------------------------
  // Panel state (remembered per profile)
  // -------------------------------------------------------------------------------------------

  setProfile(p: Partial<CoachProfile>): void {
    this.profile = { ...this.profile, ...p };
    saveProfile(this.profile);
    if (p.alwaysOn !== undefined) {
      // A new always-on level takes effect on this position at once.
      if (p.alwaysOn > 0 && this.lethal.key && this.lethal.status === 'idle') this.request(true);
      if (p.alwaysOn > 0 && this.lethal.result)
        this.lethal = {
          ...this.lethal,
          tier: Math.max(this.lethal.tier, p.alwaysOn) as Tier,
        };
    }
    this.host.notify();
  }

  toggle(): void {
    this.setProfile({ expanded: !this.profile.expanded });
  }

  setAlwaysOn(level: AlwaysOn): void {
    this.setProfile({ alwaysOn: level });
  }

  // -------------------------------------------------------------------------------------------
  // "Count it with me" (learning-ui §3.2)
  // -------------------------------------------------------------------------------------------

  startGuided(): void {
    const r = this.lethal.result;
    const data = r ? guidedCount(r) : null;
    if (!data) return;
    this.profile = { ...this.profile, expanded: true, tab: 'lethal' };
    this.wantTall = true;
    this.guided = { step: 1, hits: '', picked: [], split: [], check: null, data };
    this.progress('count');
    this.host.announce('Count it with me. Question 1: how many hits do you need?');
    this.host.notify();
  }

  endGuided(): void {
    this.guided = null;
    this.wantTall = false;
    this.host.notify();
  }

  guide(patch: Partial<GuidedState>): void {
    if (!this.guided) return;
    this.guided = {
      ...this.guided,
      ...patch,
      check: patch.check === undefined ? null : patch.check,
    };
    this.host.notify();
  }

  /** "Check my count": each answer marked, with the reason for anything wrong. */
  checkCount(): CountCheck | null {
    const g = this.guided;
    if (!g) return null;
    const n = Number.parseInt(g.hits, 10);
    const check = checkGuidedCount(g.data, {
      ...(Number.isFinite(n) ? { hits: n } : {}),
      attackers: g.picked,
      split: g.split,
    });
    this.guided = { ...g, check };
    const parts = [
      `Hits: ${check.hits.correct ? 'right' : 'not quite'}. ${check.hits.reason}`,
      `Attackers: ${check.attackers.correct ? 'right' : 'not quite'}. ${check.attackers.reason}`,
      `Split: ${check.split.correct ? 'right' : 'not quite'}. ${check.split.reason}`,
    ];
    this.host.announce(parts.join(' '));
    this.host.notify();
    return check;
  }

  // -------------------------------------------------------------------------------------------
  // "Show" (lights a line step's cards on the board)
  // -------------------------------------------------------------------------------------------

  show(step: number): void {
    const r = this.lethal.result;
    if (!r) return;
    const refs = lineRefs(r, this.host.session.view(this.host.me))[step] ?? [];
    this.shown = { refs, step };
    const text = r.line ? this.explanation()?.line?.[step]?.text : null;
    if (text) this.host.announce(`Step ${step + 1}: ${text}`);
    this.host.notify();
  }

  /** Light cards directly (Study: the restored board's line). */
  lightRefs(refs: string[], step: number): void {
    this.shown = { refs, step };
    this.host.notify();
  }

  clearShown(): void {
    if (!this.shown) return;
    this.shown = null;
    this.host.notify();
  }
}

/**
 * The cards (handles in `view`) each numbered step of the tier-3 line touches, in the same order as
 * `explainLethal`'s moves: the DON!! gives come first as one step, then each play, activation and
 * attack.
 */
export function lineRefs(r: LethalResult, view: ProjectedView): string[][] {
  const line = r.line ?? [];
  const opp: PlayerId = view.player === 'p1' ? 'p2' : 'p1';
  const oppLeader = view.zones[opp].leader[0]?.handle;
  const oppByCard = (id: string): string | undefined =>
    view.zones[opp].characters.find((c) => c.card === id)?.handle;
  const out: string[][] = [];
  const attacks = line.filter((s) => s.kind === 'attack');
  const gives = attacks.filter((s) => s.kind === 'attack' && s.don > 0);
  if (gives.length > 0) out.push(gives.map((s) => s.ref));
  for (const s of line) {
    if (s.kind === 'attack') {
      const target = s.target === 'leader' ? oppLeader : oppByCard(s.target);
      out.push([s.ref, ...(target ? [target] : [])]);
    } else if (s.kind === 'play' || s.kind === 'activate') out.push([s.ref]);
    else if ((s.kind === 'use' || s.kind === 'choose') && s.card) out.push([]);
  }
  return out;
}
