/**
 * The blunder warning (M7 WP5, learning-ui §2.8). Off by default. When the player has switched it
 * on, the guard asks the coach's worker to score the decision as it starts (priority 3) and again
 * when the player points at or focuses a commit control. At the press it holds the commit only when
 * the answer is ready within 300 ms and names a clear mistake; a late answer commits silently and
 * nothing is shown for that decision, ever. A decision is warned about once ("Commit anyway" commits
 * with no further check). The rules and the values come from the worker's `ScoreTable`
 * (`scoreDecision`, which reads only the player's own view): this file decides when to ask, what to
 * hold and what to say, never what is a mistake.
 */
import { isNotImplemented, warningsOf, type BlunderWarning, type ScoreTable } from '@optcg/ai';
import type { Action, SearchView } from '@optcg/engine';
import type { CoachPort } from '../game/ai-client.ts';

/** How long a press waits for an answer that is not ready yet (learning-ui §2.8, ARCHITECTURE §5). */
export const BLUNDER_WAIT_MS = 300;
/** The worker's search budget for one score request. */
export const BLUNDER_BUDGET_MS = 1500;

/** The decision kinds a warning can apply to (the scorer's own: Main and effect choices). */
const SCORED_KINDS: readonly string[] = ['main', 'choose', 'optional', 'trigger'];

/** Warning kinds in words, for the mute list ("Don't warn me about this"). */
export const KIND_WORDS: Record<string, string> = {
  'missed-lethal': 'giving up a lethal turn',
  'unused-don': 'ending with DON!! unused',
  gap: 'a clearly worse effect choice',
};

export type CommitAnswer = 'go' | 'hold';

/** What the guard needs from the game. */
export interface GuardHost {
  /** The warning is on and this game offers it (not hotseat, a review, a puzzle or the tutorial). */
  enabled(): boolean;
  muted(): readonly string[];
  mute(kind: string): void;
  /** The decision the player owes now, or null. `ownTurn`: it is the player's own turn. */
  decision(): { key: string; kind: string; ownTurn: boolean } | null;
  searchView(): SearchView;
  port(): CoachPort;
  /** The seat's legal actions now. */
  legal(): Action[];
  /** Apply an action past the gate (the controller's `act(..., { skipGate: true })`). */
  commit(action: Action, intentId?: string): void;
  /** Hand the gate to the controller (or take it away). */
  setGate(gate: ((a: Action, intentId?: string) => CommitAnswer) | undefined): void;
  /** Forget the controller's held action. */
  release(): void;
  announce(text: string): void;
  notify(): void;
  /** Timers, replaceable in tests. */
  setTimer?(fn: () => void, ms: number): unknown;
  clearTimer?(h: unknown): void;
}

/** What the decision panel shows while a commit is held. */
export interface BlunderNote {
  action: Action;
  warning: BlunderWarning;
  /** More than one kind applied: the rest, for the mute list. */
  kinds: string[];
}

interface Scored {
  key: string;
  status: 'pending' | 'ready' | 'failed';
  table: ScoreTable | null;
  /** The request, so a new decision can cancel it. */
  id: number | null;
}

interface Deciding {
  action: Action;
  intentId: string | undefined;
  timer: unknown;
}

export class BlunderGuard {
  /** The commit that is held with its note showing (null: nothing is held). */
  note: BlunderNote | null = null;
  private heldIntent: string | undefined;
  private scored: Scored | null = null;
  /** A press is waiting up to 300 ms for the answer. */
  private deciding: Deciding | null = null;
  /** The decision key this guard has already spoken for (warned, or let go): never twice. */
  private spent: string | null = null;
  private port: CoachPort | null = null;
  private gateOn = false;
  /** Answers that arrived after the press had committed, for tests. */
  lateAnswers = 0;
  /** Requests asked, for tests. */
  requests = 0;

  constructor(private readonly host: GuardHost) {}

  private gate = (a: Action, intentId?: string): CommitAnswer => this.press(a, intentId);

  /** Called on every change of the game and of the profile. */
  sync(): void {
    const on = this.host.enabled();
    if (on !== this.gateOn) {
      this.gateOn = on;
      this.host.setGate(on ? this.gate : undefined);
    }
    const d = on ? this.host.decision() : null;
    if (!d || this.scored?.key !== d.key) this.reset();
    if (!d) return;
    // Precompute once, as the decision starts, when a warning could apply to it.
    if (!this.scored && this.worthScoring(d)) this.ask(d.key);
  }

  /** Where the guard stands now, for the panel's hidden marker and for tests. */
  get status(): 'off' | 'idle' | 'pending' | 'ready' | 'failed' {
    if (!this.gateOn) return 'off';
    const d = this.host.decision();
    if (!d || this.scored?.key !== d.key) return 'idle';
    return this.scored.status;
  }

  private worthScoring(d: { kind: string; ownTurn: boolean }): boolean {
    return d.ownTurn && SCORED_KINDS.includes(d.kind);
  }

  /** The player pointed at or focused a commit control: ask again if nothing is running. */
  prime(): void {
    if (!this.host.enabled()) return;
    const d = this.host.decision();
    if (!d || this.scored?.key === d.key || !this.worthScoring(d)) return;
    this.ask(d.key);
  }

  private ask(key: string): void {
    const port = this.host.port();
    this.port = port;
    this.requests++;
    const r = port.score(this.host.searchView(), { budgetMs: BLUNDER_BUDGET_MS });
    const s: Scored = { key, status: 'pending', table: null, id: r.id };
    this.scored = s;
    r.result.then(
      (a) => {
        if (this.scored !== s) return;
        s.id = null;
        if (isNotImplemented(a.result)) s.status = 'failed';
        else {
          s.status = 'ready';
          s.table = a.result;
        }
        this.arrived();
      },
      () => {
        if (this.scored !== s) return;
        s.id = null;
        s.status = 'failed';
        this.arrived();
      },
    );
  }

  /** The warnings that apply to this action now (the table's, minus the kinds the player muted). */
  private warningsFor(action: Action): BlunderWarning[] {
    const t = this.scored?.table;
    if (!t) return [];
    const muted = new Set(this.host.muted());
    return warningsOf(t, action).filter((w) => !muted.has(w.kind));
  }

  /** The press (the controller's `commitGate`). */
  private press(action: Action, intentId?: string): CommitAnswer {
    const d = this.host.decision();
    if (!d || !this.host.enabled() || this.spent === d.key) return 'go';
    // A second press while the first still waits: the first stands.
    if (this.deciding) return 'hold';
    const s = this.scored;
    if (!s || s.key !== d.key) return 'go';
    if (s.status === 'ready') return this.hold(action, intentId, d.key) ? 'hold' : 'go';
    if (s.status === 'failed') return 'go';
    // Pending: wait up to 300 ms for it. If it is late the press commits silently.
    const timer = (this.host.setTimer ?? ((f, ms) => setTimeout(f, ms)))(() => {
      const wait = this.deciding;
      if (!wait) return;
      this.deciding = null;
      this.spent = d.key;
      this.lateAnswers++;
      this.host.commit(wait.action, wait.intentId);
    }, BLUNDER_WAIT_MS);
    this.deciding = { action, intentId, timer };
    return 'hold';
  }

  /** A pending score came back: if a press is waiting on it, decide now. */
  private arrived(): void {
    const w = this.deciding;
    const d = this.host.decision();
    if (!w || !d || this.scored?.key !== d.key) {
      this.host.notify();
      return;
    }
    (this.host.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>)))(w.timer);
    this.deciding = null;
    if (this.hold(w.action, w.intentId, d.key)) {
      this.host.notify();
      return;
    }
    this.spent = d.key;
    this.host.commit(w.action, w.intentId);
  }

  /** Show the note and keep the action held; false when no warning applies. */
  private hold(action: Action, intentId: string | undefined, key: string): boolean {
    const ws = this.warningsFor(action);
    if (ws.length === 0) return false;
    const first = ws[0]!;
    this.spent = key;
    this.heldIntent = intentId;
    this.note = { action, warning: first, kinds: [...new Set(ws.map((w) => w.kind))] };
    this.host.announce(`Warning: ${first.explanation.claim} ${this.betterWords(first)}`.trim());
    return true;
  }

  /** "Commit anyway": the action goes through, with no further check. */
  commitAnyway(): void {
    const n = this.note;
    if (!n) return;
    const intent = this.heldIntent;
    this.note = null;
    this.heldIntent = undefined;
    this.host.commit(n.action, intent);
  }

  /** "Use the better choice": the better action instead, if it is still legal. */
  useBetter(): boolean {
    const n = this.note;
    const b = n?.warning.better;
    if (!n || !b) return false;
    const k = JSON.stringify(b);
    const legal = this.host.legal().find((a) => JSON.stringify(a) === k);
    if (!legal) return false;
    this.note = null;
    this.heldIntent = undefined;
    this.host.release();
    this.host.commit(legal);
    return true;
  }

  /** "Don't warn me about this": mute the kind. The action stays uncommitted; pressing again goes. */
  muteKind(): void {
    const n = this.note;
    if (!n) return;
    this.host.mute(n.warning.kind);
    this.note = null;
    this.heldIntent = undefined;
    this.host.release();
    this.host.announce(
      `Won’t warn you about ${KIND_WORDS[n.warning.kind] ?? n.warning.kind} again.`,
    );
    this.host.notify();
  }

  private betterWords(w: BlunderWarning): string {
    return w.better
      ? 'The coach has a better move. Choose it, or press Commit anyway.'
      : 'Press Commit anyway to go ahead.';
  }

  /** A new decision, or the warning was switched off: forget everything about the old one. */
  private reset(): void {
    if (this.scored?.id != null) this.port?.cancel(this.scored.id);
    this.scored = null;
    if (this.deciding) {
      (this.host.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>)))(
        this.deciding.timer,
      );
      this.deciding = null;
    }
    this.spent = null;
    if (this.note) {
      this.note = null;
      this.heldIntent = undefined;
      this.host.release();
    }
  }

  dispose(): void {
    this.reset();
    this.host.setGate(undefined);
    this.gateOn = false;
  }
}
