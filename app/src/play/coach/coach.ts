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
  isNotImplemented,
  explainLethal,
  guidedCount,
  priorCardIds,
  tier1,
  tier2,
  type CountCheck,
  type Explanation,
  type GameInfo,
  type GuidedCount,
  type HintResult,
  type LethalResult,
  type ThreatResult,
  type Tier1,
} from '@optcg/ai';
import type { Action, PlayerId, ProjectedView } from '@optcg/engine';
import type { GameSession } from '../../session/index.ts';
import type { CoachPort } from '../game/ai-client.ts';
import {
  loadProfile,
  recordLethalProgress,
  saveProfile,
  type AlwaysOn,
  type CoachProfile,
} from './profile.ts';
import {
  NO_HINT,
  firstStepDone,
  nextStage,
  progressFor,
  seenIn,
  stepRefs,
  type HintProgress,
  type HintState,
} from './hint.ts';
import { ledgerOf, type TempoLedger } from './tempo.ts';

/** What the coach needs from its game. */
export interface CoachHost {
  readonly me: PlayerId;
  readonly hotseat: boolean;
  readonly readOnly: boolean;
  /** A lethal puzzle from a review flag (no background checks). */
  readonly puzzle: boolean;
  readonly cards: Map<string, Card>;
  readonly session: GameSession;
  myDecision(): boolean;
  announce(text: string): void;
  /** Re-render. Never calls `Coach.sync`. */
  notify(): void;
  /** The tutorial runs without the coach (M7 WP6). */
  readonly tutorial: boolean;
  /** The player's own main deck (card ids), for the hint; empty when it is not known. */
  readonly ownDeck: readonly string[];
  /** The opponent's name, for "Waiting for <name>'s move". */
  opponentName(): string;
  /** The seat's legal actions now (what `stage` accepts). */
  legalActions(): Action[];
  /** Line one action up for the player to confirm (the controller's `stage`). */
  stage(action: Action | null): boolean;
  /**
   * The coach's worker, started on first use with `init` data (card data the player may see, their
   * own list) and, when the player's own list is known, the game (own deck, both Leaders).
   */
  makePort(init: Card[], game?: GameInfo): CoachPort;
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

/** The opponent's-turn threat check (WP3), keyed to the position like the lethal answer. */
export interface ThreatState {
  key: string | null;
  status: 'idle' | 'checking' | 'ready' | 'failed';
  result: ThreatResult | null;
  /** The background alert asked, not a press of L. */
  auto: boolean;
}
const IDLE_THREAT: ThreatState = { key: null, status: 'idle', result: null, auto: false };

/** A hint search's budget: typical 1.5 to 2.5 s (flows F9). */
export const HINT_BUDGET_MS = 2000;
/** The threat check's cap (WP3's own default, in ms). */
const THREAT_CAP_MS = 1500;

/**
 * Wall-clock caps for the live detector: a search that runs out is "Couldn't finish checking",
 * never "no lethal". The coach's worker is its own, so a long search never delays the AI's turn.
 * The background detector is short, a press longer, "Check again" longer still.
 */
const CAP_MS = { auto: 1500, press: 3000, retry: 8000 } as const;

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
  /** The hint (M7 WP4): asked by H or the button only, never by itself. */
  hint: HintState = NO_HINT;
  /** Bumps when the player asked for the hint (H): focus goes to its result. */
  hintFocus = 0;
  /** The last `hintFocus` the hint section acted on (so a remount never moves focus). */
  hintFocusSeen = 0;
  /** The opponent's-turn threat check. */
  threat: ThreatState = IDLE_THREAT;
  /** Your DON!! split, as it stood in your last turn's view (frozen on theirs, learning-ui §2.9). */
  tempo: { ledger: TempoLedger; turn: number } | null = null;

  private port: CoachPort | null = null;
  private pending: { id: number; key: string; auto: boolean } | null = null;
  private hintPending: number | null = null;
  private threatPending: number | null = null;
  /** A hint the player stopped may still be running: until then a new request restarts the worker. */
  private abandonedUntil = 0;
  private lastSpoken = '';
  private lastThreatSpoken = '';

  constructor(private readonly host: CoachHost) {}

  // -------------------------------------------------------------------------------------------
  // Where the detector applies
  // -------------------------------------------------------------------------------------------

  /** The detector runs against the AI, in the player's own idle Main Phase. */
  get supported(): boolean {
    return !this.host.hotseat && !this.host.readOnly && !this.host.tutorial;
  }

  /** A hint is for the player's own decisions against the AI (not a puzzle, which is the exercise). */
  get hintSupported(): boolean {
    return this.supported && !this.host.puzzle;
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
    this.refreshTempo();
    this.syncHint();
    this.syncThreat();
    const key = this.positionKey();
    if (key === this.lethal.key) return;
    this.cancelPending();
    this.guided = null;
    this.shown = null;
    this.wantTall = false;
    this.lethal = { ...IDLE, key };
    // A puzzle never checks for you (it is the exercise); the Lethal button still answers a press.
    if (key && this.profile.alwaysOn > 0 && !this.host.puzzle) this.request(true);
    this.host.notify();
  }

  // -------------------------------------------------------------------------------------------
  // Requests
  // -------------------------------------------------------------------------------------------

  private ensurePort(view: ProjectedView): CoachPort {
    if (!this.port) {
      const opp: PlayerId = this.host.me === 'p1' ? 'p2' : 'p1';
      const oppLeader = view.zones[opp].leader[0]?.card ?? '';
      const ownLeader = view.zones[this.host.me].leader[0]?.card ?? '';
      // The public prior for their Leader's archetype, whatever the player can see, and the
      // player's own list: all of it the player's own or public (the AI seat's worker never gets it).
      const init: Card[] = [];
      const seen = new Set<string>();
      const add = (id: string | null | undefined) => {
        const c = id ? this.host.cards.get(id) : undefined;
        if (c && !seen.has(c.id)) {
          seen.add(c.id);
          init.push(c);
        }
      };
      add(oppLeader);
      add(ownLeader);
      for (const id of this.host.ownDeck) add(id);
      const game: GameInfo | undefined =
        ownLeader && oppLeader && this.host.ownDeck.length > 0
          ? {
              tier: 'warlord',
              ownDeck: [...this.host.ownDeck],
              leader: ownLeader,
              opponentLeader: oppLeader,
              budgets: 'ms',
            }
          : undefined;
      this.port = this.host.makePort(init, game);
    }
    return this.port;
  }

  /**
   * The worker for a request now: card data the player's own view shows goes first, and a worker
   * still running a hint the player stopped is restarted (a running request cannot be interrupted).
   */
  private portFor(view: ProjectedView): CoachPort {
    const port = this.ensurePort(view);
    if (this.abandonedUntil > performance.now()) {
      this.abandonedUntil = 0;
      port.restart?.();
    }
    const cards: Card[] = [];
    for (const id of visibleIds(view)) {
      const c = this.host.cards.get(id);
      if (c) cards.push(c);
    }
    for (const c of this.priorCards(view)) cards.push(c);
    port.reveal(cards);
    return port;
  }

  private request(auto: boolean, capMs: number = auto ? CAP_MS.auto : CAP_MS.press): void {
    const key = this.lethal.key;
    if (!key) return;
    const view = this.host.session.view(this.host.me);
    // Card data the player's own view shows, plus the public prior the worker already holds.
    const port = this.portFor(view);
    const r = port.lethal(this.host.session.searchView(this.host.me), {
      priority: auto ? 4 : 2,
      capMs,
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
    this.cancelHint();
    this.cancelThreat();
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

  /** The polite tier 1 line carries the Trigger caveat when it applies (review L-04). */
  private t1Speech(r: LethalResult): string {
    const t = tier1(r);
    return t.triggerNote && !t.sr.includes('Trigger') ? `${t.sr} ${t.triggerNote}` : t.sr;
  }

  private speakResult(auto: boolean): void {
    const r = this.lethal.result;
    if (!r) return;
    const t = this.lethal.tier;
    const text = t >= 2 ? tier2(r).sr : t === 1 ? this.t1Speech(r) : '';
    if (!text) return;
    // The background detector speaks only when its answer changes (learning-ui §2.2: polite).
    if (auto && text === this.lastSpoken) return;
    this.lastSpoken = text;
    this.host.announce(text);
  }

  /**
   * The Lethal button or L: the first press shows tier 1, each further press the next tier. The
   * panel opens on the Lethal section. Tiers 1 and 2 are spoken politely and focus stays where it
   * is, so `L` can be pressed again (under NVDA, `L` in the coach is "next list": L-SR16). Focus
   * goes to the result only at tier 3, the ordered line (learning-ui §2.1).
   */
  press(panelBusy = false): void {
    if (!this.supported) {
      this.host.announce(
        this.host.readOnly
          ? 'Lethal check: not available on a restored position.'
          : 'Lethal check: available when you play the AI.',
      );
      return;
    }
    if (!this.lethal.key) {
      if (this.threat.key) {
        this.pressThreat();
        return;
      }
      this.host.announce(
        'Lethal check: available in your Main Phase, or when their Main Phase starts.',
      );
      return;
    }
    this.profile = { ...this.profile, expanded: true, tab: 'lethal' };
    saveProfile(this.profile);
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
      if (next === 3) {
        this.wantTall = true;
        // The player asked for the line: it is the one result worth moving focus to (L-SR16).
        this.focusSignal++;
      }
      // L-SR10: past the last tier, say so once, ahead of the line again.
      this.speakTier(next, panelBusy, tier >= 3);
    }
    this.host.notify();
  }

  private speakTier(t: Tier, panelBusy = false, again = false): void {
    const r = this.lethal.result;
    if (!r) return;
    if (t === 1) this.host.announce(this.t1Speech(r));
    else if (t === 2) {
      this.host.announce(tier2(r).sr);
      this.progress('tier2');
    } else if (t === 3) {
      const ex = explainLethal(r, this.host.cards, 'coach');
      // L-SR2: while a decision panel is tall the coach is its strip; say where the line is.
      this.host.announce(
        `${again ? 'That is everything the coach has for this turn. ' : ''}${ex.claim} ${ex.outcome}${
          panelBusy
            ? ' The numbered line is in the coach, which opens when this decision is done.'
            : ''
        }`,
      );
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
    this.request(false, CAP_MS.retry);
    this.host.notify();
  }

  private progress(step: 'tier1' | 'tier2' | 'count' | 'tier3'): void {
    const turn = this.host.session.view(this.host.me).turn.number;
    recordLethalProgress(this.host.session.seed, turn, step);
  }

  // -------------------------------------------------------------------------------------------
  // The hint (learning-ui §2.4, flows F9): only on a press, from the player's own search view
  // -------------------------------------------------------------------------------------------

  /** H or the Hint button. At a decision you owe it asks the coach's worker; on their move it waits. */
  askHint(): void {
    if (!this.hintSupported) {
      this.host.announce(
        this.host.hotseat
          ? 'Hint: not available in a two-player game.'
          : 'Hint: not available here.',
      );
      return;
    }
    const v = this.host.session.view(this.host.me);
    this.profile = { ...this.profile, expanded: true, tab: 'hint' };
    saveProfile(this.profile);
    this.wantTall = false;
    this.hintFocus++;
    if (v.result) {
      this.host.announce('Hint: the game is over.');
      this.host.notify();
      return;
    }
    this.cancelHint();
    if (!this.host.myDecision()) {
      this.hint = { ...NO_HINT, status: 'waiting', turn: v.turn.number };
      this.host.announce(`Hint: waiting for ${this.host.opponentName()}’s move.`);
      this.host.notify();
      return;
    }
    this.startHint();
  }

  private startHint(): void {
    const view = this.host.session.view(this.host.me);
    const port = this.portFor(view);
    const r = port.hint(this.host.session.searchView(this.host.me), { budgetMs: HINT_BUDGET_MS });
    this.hintPending = r.id;
    this.hint = { ...NO_HINT, status: 'thinking', turn: view.turn.number, seen: seenIn(view) };
    this.host.announce('Hint: thinking.');
    this.host.notify();
    r.result.then(
      (a) => {
        if (this.hintPending !== r.id) return;
        this.hintPending = null;
        if (isNotImplemented(a.result)) {
          this.hint = { ...this.hint, status: 'failed' };
        } else {
          this.hint = { ...this.hint, status: 'ready', result: a.result };
          this.speakHint(a.result);
        }
        this.host.notify();
      },
      (e: unknown) => {
        if (this.hintPending !== r.id) return;
        this.hintPending = null;
        if (e instanceof Error && e.message === 'cancelled') return;
        this.hint = { ...this.hint, status: 'failed' };
        this.host.notify();
      },
    );
  }

  private speakHint(r: HintResult): void {
    const first = r.line[0]?.text;
    const n = r.line.length;
    this.host.announce(
      `Hint ready: ${r.explanation.claim}${n > 0 ? ` ${n} ${n === 1 ? 'step' : 'steps'}.` : ''}${first ? ` Step 1: ${first}` : ''}`,
    );
  }

  private cancelHint(): void {
    if (this.hintPending !== null) {
      this.port?.cancel(this.hintPending);
      // The worker may be mid-search: the next request restarts it rather than wait behind it.
      this.abandonedUntil = performance.now() + HINT_BUDGET_MS;
    }
    this.hintPending = null;
  }

  /** Esc: stop a running hint or put a finished one away (the player's own call, so it speaks). */
  discardHint(): boolean {
    if (this.hint.status === 'idle') return false;
    const was = this.hint.status;
    this.cancelHint();
    this.hint = NO_HINT;
    this.host.stage(null);
    this.host.announce(was === 'thinking' ? 'Hint stopped.' : 'Hint cleared.');
    this.host.notify();
    return true;
  }

  /** Where the player is in the hint's line, and whether they have left it. */
  hintProgress(): HintProgress {
    return progressFor(this.hint);
  }

  /** The player acts on the board: read against the hint (called before the engine applies it). */
  noteAction(a: Action): void {
    const h = this.hint;
    if (h.status === 'thinking') {
      // The position moved on while the search ran: its answer would describe an old board.
      this.cancelHint();
      this.hint = NO_HINT;
    } else if (h.status === 'ready') {
      this.hint = {
        ...h,
        taken: [...h.taken, a],
        seen: { ...h.seen, ...seenIn(this.host.session.view(this.host.me)) },
      };
    }
  }

  /** The engine refused the action `noteAction` just saw. */
  unnoteAction(): void {
    const h = this.hint;
    if (h.status === 'ready' && h.taken.length > 0)
      this.hint = { ...h, taken: h.taken.slice(0, -1) };
  }

  /** "Do step 1": line the hint's next action up; the player still commits it. */
  stageNext(): boolean {
    const h = this.hint;
    const next =
      h.status === 'ready' && h.result
        ? nextStage(h.result.viewActions, h.taken, this.host.legalActions())
        : null;
    if (!next || !this.host.stage(next)) {
      this.host.announce('Can’t line that up: the board has changed. Press H to ask again.');
      return false;
    }
    return true;
  }

  /** True once per press of H: the section that is showing takes the focus (a remount never does). */
  takeHintFocus(): boolean {
    if (this.hintFocus === 0 || this.hintFocusSeen === this.hintFocus) return false;
    this.hintFocusSeen = this.hintFocus;
    return true;
  }

  /** "Show" on a hint step: light its cards on the board and say what it is. */
  showHint(step: number): void {
    const r = this.hint.result;
    const m = r?.line[step];
    if (!m) return;
    this.shown = { refs: stepRefs(m, this.host.session.view(this.host.me)), step };
    this.host.announce(`Step ${step + 1}: ${m.text}`);
    this.host.notify();
  }

  /** Is anything of the hint's first step left to do (does Do step 1 have something to stage)? */
  firstStepLeft(): boolean {
    const h = this.hint;
    return h.status === 'ready' && !!h.result && !firstStepDone(h.result.viewActions, h.taken);
  }

  private syncHint(): void {
    const h = this.hint;
    if (h.status === 'idle') return;
    const v = this.host.session.view(this.host.me);
    if (h.status === 'waiting') {
      if (v.result) {
        this.hint = NO_HINT;
        this.host.notify();
      } else if (this.host.myDecision()) this.startHint();
      return;
    }
    // A new turn, or the end of the game: a hint is for the turn it was asked in.
    if (v.result || v.turn.number !== h.turn) {
      this.cancelHint();
      this.hint = NO_HINT;
      this.host.notify();
    }
  }

  // -------------------------------------------------------------------------------------------
  // Their turn: does their board threaten lethal (WP3). Their hand is never counted.
  // -------------------------------------------------------------------------------------------

  /** Their Main Phase, between battles: the only time the threat check means something. */
  private threatKey(): string | null {
    if (!this.supported) return null;
    const v = this.host.session.view(this.host.me);
    const opp: PlayerId = this.host.me === 'p1' ? 'p2' : 'p1';
    if (v.result || v.battle || v.decision?.kind !== 'main' || v.decision.player !== opp)
      return null;
    return `${this.host.session.actionCount}|${v.turn.number}|threat`;
  }

  private syncThreat(): void {
    const key = this.threatKey();
    if (key === this.threat.key) return;
    this.cancelThreat();
    this.threat = { ...IDLE_THREAT, key };
    // The background alert is the player's own setting; otherwise nothing runs until L.
    if (key && this.profile.alerts) this.requestThreat(true);
    this.host.notify();
  }

  private requestThreat(auto: boolean): void {
    const key = this.threat.key;
    if (!key) return;
    const view = this.host.session.view(this.host.me);
    const port = this.portFor(view);
    const own = this.host.ownDeck;
    const r = port.threat(this.host.session.searchView(this.host.me), {
      capMs: THREAT_CAP_MS,
      ...(own.length > 0 ? { ownDeck: [...own] } : {}),
      priority: auto ? 4 : 2,
    });
    this.threatPending = r.id;
    this.threat = { ...this.threat, status: 'checking', auto };
    r.result.then(
      (a) => {
        if (this.threatPending !== r.id || this.threat.key !== key) return;
        this.threatPending = null;
        if (isNotImplemented(a.result)) this.threat = { ...this.threat, status: 'failed' };
        else {
          this.threat = { key, status: 'ready', result: a.result, auto };
          this.speakThreat(auto);
        }
        this.host.notify();
      },
      (e: unknown) => {
        if (this.threatPending !== r.id) return;
        this.threatPending = null;
        if (e instanceof Error && e.message === 'cancelled') return;
        this.threat = { ...this.threat, status: 'failed' };
        this.host.notify();
      },
    );
  }

  /** The polite line for a threat. Their hand is never counted, and it says so. */
  threatSpeech(r: ThreatResult): string {
    const tail = 'This does not count the cards in their hand.';
    if (r.status === 'unknown') return `Their threat: not fully checked. ${tail}`;
    if (r.status === 'refuted') return `Their board does not threaten lethal. ${tail}`;
    const stop = r.mustStop
      ? ` You must stop ${r.mustStop.stop} of their ${r.mustStop.of} attacks.`
      : '';
    return `Their board threatens lethal.${stop} ${tail}`;
  }

  private speakThreat(auto: boolean): void {
    const r = this.threat.result;
    if (!r) return;
    // An alert speaks only for a threat, and only when the line changes (learning-ui §2.2: polite).
    if (auto && r.status !== 'proven') return;
    const text = this.threatSpeech(r);
    if (auto && text === this.lastThreatSpoken) return;
    this.lastThreatSpoken = text;
    this.host.announce(text);
  }

  private pressThreat(): void {
    this.profile = { ...this.profile, expanded: true, tab: 'lethal' };
    saveProfile(this.profile);
    const { status, result } = this.threat;
    if (status === 'idle' || status === 'failed') this.requestThreat(false);
    else if (status === 'ready' && result) {
      this.focusSignal++;
      this.host.announce(this.threatSpeech(result));
    }
    this.host.notify();
  }

  /** "Check again" on their turn (after a cap was hit or a failure). */
  retryThreat(): void {
    if (!this.threat.key) return;
    this.cancelThreat();
    this.threat = { ...this.threat, status: 'idle', result: null };
    this.requestThreat(false);
    this.host.notify();
  }

  private cancelThreat(): void {
    if (this.threatPending !== null) this.port?.cancel(this.threatPending);
    this.threatPending = null;
  }

  // -------------------------------------------------------------------------------------------
  // Tempo (learning-ui §2.9): this turn's DON!!, frozen while it is their turn
  // -------------------------------------------------------------------------------------------

  private refreshTempo(): void {
    if (!this.supported) return;
    const v = this.host.session.view(this.host.me);
    if (v.result || v.turn.activePlayer !== this.host.me) return;
    this.tempo = { ledger: ledgerOf(v, this.host.cards), turn: v.turn.number };
  }

  // -------------------------------------------------------------------------------------------
  // Panel state (remembered per profile)
  // -------------------------------------------------------------------------------------------

  setProfile(p: Partial<CoachProfile>): void {
    this.profile = { ...this.profile, ...p };
    saveProfile(this.profile);
    if (p.alerts === true && this.threat.key && this.threat.status === 'idle')
      this.requestThreat(true);
    if (p.alerts === false && this.threat.auto && this.threat.status === 'checking') {
      this.cancelThreat();
      this.threat = { ...this.threat, status: 'idle', auto: false };
    }
    if (p.alwaysOn !== undefined) {
      // A new always-on level takes effect on this position at once.
      if (p.alwaysOn > 0 && !this.host.puzzle && this.lethal.key && this.lethal.status === 'idle')
        this.request(true);
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
    // L-SR22: C and the chevron change nothing a reader can hear; say what happened, politely.
    this.host.announce(this.profile.expanded ? 'Coach open.' : 'Coach closed.');
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
    this.focusSignal++;
    this.guided = { step: 1, hits: '', picked: [], split: [], check: null, data };
    this.progress('count');
    this.host.announce('Count it with me. Question 1: how many hits do you need?');
    this.host.notify();
  }

  endGuided(): void {
    this.guided = null;
    this.wantTall = false;
    // The button that held focus is gone: the section's result takes it (review L-07).
    this.focusSignal++;
    this.host.notify();
  }

  guide(patch: Partial<GuidedState>): void {
    if (!this.guided) return;
    if (patch.step !== undefined && patch.step !== this.guided.step) this.focusSignal++;
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
    // Only the question being asked is graded aloud (L-SR13): the others are not answered yet.
    const say = (name: string, c: { correct: boolean; reason: string }) =>
      `${name}: ${c.correct ? 'right' : 'not quite'}. ${c.reason}`;
    const line =
      g.step === 1
        ? say('Hits', check.hits)
        : g.step === 2
          ? say('Attackers', check.attackers)
          : g.step === 4
            ? say('Split', check.split)
            : 'Nothing to check on this question. Press Next.';
    this.host.announce(line);
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
