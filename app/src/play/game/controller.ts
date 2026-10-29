/**
 * The turn loop (ARCHITECTURE §5, board.md §5, flows F7, F11, F13, F21). It owns the session, the AI
 * worker, pacing, auto-skip, hotseat seats and the live region. Components read views from it and
 * send view actions to it; it never decides legality.
 */
import type { Card } from '@optcg/cards';
import type { AiTier } from '@optcg/ai';
import type { Action, PlayerId, ProjectedView } from '@optcg/engine';
import { GameSession, newIntentId, type Move, type Start } from '../../session/index.ts';
import { AiClient } from './ai-client.ts';
import { describeMove, other, type LogLine, type Names } from './text.ts';

export type Speed = 'step' | 0.5 | 1 | 2 | 4;
export const SPEEDS: Speed[] = ['step', 0.5, 1, 2, 4];
export const speedLabel = (s: Speed) => (s === 'step' ? 'Step' : `${s}×`);

export interface GameConfig {
  mode: 'ai' | 'hotseat';
  /** The human's side against the AI. */
  human: PlayerId;
  names: Record<PlayerId, string>;
  tier: AiTier;
  /** Auto-skip empty windows (default on; off is "Always ask me", flows G5). */
  autoSkip: boolean;
  /** "Always skip to my decisions" (board.md §5.3). */
  alwaysSkip: boolean;
  speed: Speed;
  /** Start with AI playback paused (K), e.g. to read the board first. */
  startPaused?: boolean;
}

export interface Announcement {
  text: string;
  seq: number;
}

/** Pacing at 1× (board.md §5.2, tokens.css). */
const T = {
  highlight: 120,
  move: 240,
  dwell: 400,
  dwellAttack: 600,
  damage: 360,
  considering: 600,
  autoStep: 400,
  thinkingAfter: 300,
};

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

class Cancelled extends Error {}

export class GameController {
  readonly session: GameSession;
  readonly cards: Map<string, Card>;
  readonly config: GameConfig;
  private ai: AiClient | null;
  private listeners = new Set<() => void>();
  version = 0;
  private gen = 0;
  private pumping = false;
  private disposed = false;
  private aiRequest: number | null = null;
  private wake: (() => void) | null = null;

  // Pacing and AI state (board.md §5).
  speed: Speed;
  paused = false;
  skipping = false;
  thinking = false;
  /** The AI is taking its uniform "considering" beat before a defensive decision (flows G5). */
  considering: string | null = null;
  /** Waiting for "Next move" at Step pace. */
  stepWaiting = false;
  /** The opponent's acting card, in the screen's handles, with a word ("playing", "attacking"). */
  highlight: { handle: string; word: string } | null = null;
  activity = '';
  /** What happened while skipping (flows F21 step 4). */
  recap: string[] | null = null;
  private skippedLines: string[] = [];

  // Hotseat (flows F13b).
  private seat: PlayerId;
  curtainFor: PlayerId | null = null;
  handVeil: 'none' | 'hold' | 'click' = 'none';
  revealHeld = false;
  private curtainSeen: Record<PlayerId, string> = { p1: '', p2: '' };

  // Feedback.
  toast: string | null = null;
  error: string | null = null;
  polite: Announcement = { text: '', seq: 0 };
  assertive: Announcement = { text: '', seq: 0 };
  /** Bumps when focus should move to the decision panel (accessibility §3.2). */
  focusDecision = 0;
  private lastDecisionKey = '';

  constructor(cards: Map<string, Card>, start: Start, config: GameConfig) {
    this.cards = cards;
    this.config = config;
    this.speed = config.speed;
    const seats: Record<PlayerId, 'human' | 'ai'> =
      config.mode === 'hotseat'
        ? { p1: 'human', p2: 'human' }
        : ({ [config.human]: 'human', [other(config.human)]: 'ai' } as Record<
            PlayerId,
            'human' | 'ai'
          >);
    this.session = new GameSession((id) => cards.get(id), start, seats);
    this.seat = config.mode === 'hotseat' ? (this.session.decider() ?? 'p1') : config.human;
    this.ai = config.mode === 'ai' ? new AiClient([...cards.values()]) : null;
    if (config.mode === 'hotseat') {
      this.curtainFor = this.seat;
      this.curtainSeen[this.seat] = this.turnKey();
    }
    if (config.alwaysSkip) this.skipping = true;
    if (config.startPaused) this.paused = true;
  }

  // -------------------------------------------------------------------------------------------
  // Subscription
  // -------------------------------------------------------------------------------------------

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    const off = this.session.subscribe(fn);
    return () => {
      this.listeners.delete(fn);
      off();
    };
  };
  getVersion = () => this.version * 100000 + this.session.version;

  private bump(): void {
    this.version++;
    for (const fn of this.listeners) fn();
  }

  dispose(): void {
    this.disposed = true;
    this.gen++;
    this.ai?.terminate();
    this.wake?.();
  }

  // -------------------------------------------------------------------------------------------
  // Reading
  // -------------------------------------------------------------------------------------------

  get hotseat(): boolean {
    return this.config.mode === 'hotseat';
  }

  /** The player the screen belongs to right now. */
  get me(): PlayerId {
    return this.seat;
  }

  seatOf(p: PlayerId): 'human' | 'ai' {
    return this.hotseat || p === this.config.human ? 'human' : 'ai';
  }

  view(): ProjectedView {
    return this.session.view(this.me);
  }

  names(): Names {
    return { me: this.me, player: this.config.names, hotseat: this.hotseat };
  }

  /** True when the screen's player owes the current decision and may act on it now. */
  myDecision(): boolean {
    const d = this.session.decider();
    return d === this.me && this.seatOf(d) === 'human' && this.curtainFor === null;
  }

  /** The log as lines, from the screen player's projected events (board.md §3.11). */
  private logCache: { key: string; lines: LogLine[] } | null = null;
  logLines(): LogLine[] {
    const key = `${this.session.version}|${this.me}`;
    if (this.logCache?.key === key) return this.logCache.lines;
    const lines = this.buildLog();
    this.logCache = { key, lines };
    return lines;
  }

  private buildLog(): LogLine[] {
    const { moves, events, start } = this.session.log(this.me);
    const ctx = { cards: this.cards, names: this.names(), life: this.session.initialLife() };
    const out: LogLine[] = [];
    out.push(...describeMove(start, 'p1', ctx, 0, false).filter((l) => l.kind === 'turn'));
    for (const m of moves) {
      const ev = events.slice(m.start, m.end).flat();
      out.push(...describeMove(ev, m.player, ctx, m.start, m.auto));
    }
    return out;
  }

  private scale(): number {
    if (this.skipping) return 0;
    return this.speed === 'step' ? 1 : 1 / this.speed;
  }

  private turnKey(): string {
    const t = this.session.view('p1').turn;
    return t.phase === 'setup' ? 'setup' : `t${t.number}`;
  }

  // -------------------------------------------------------------------------------------------
  // Waiting (cancellable by a rewind, a new game or Skip)
  // -------------------------------------------------------------------------------------------

  private async wait(ms: number, opts: { attackOnHuman?: boolean; dwell?: boolean } = {}) {
    const g = this.gen;
    let t = ms * this.scale();
    if (opts.dwell && reducedMotion()) t *= 2;
    if (opts.attackOnHuman && this.speed === 4 && !this.skipping) t = Math.max(t, 240);
    if (t > 0) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(done, t);
        function done() {
          clearTimeout(timer);
          resolve();
        }
        this.wake = done;
      });
      this.wake = null;
    }
    if (g !== this.gen || this.disposed) throw new Cancelled();
  }

  private async gate(): Promise<void> {
    // Pause (K) and Step pace hold the AI between moves; Skip releases them.
    while ((this.paused || this.stepWaiting) && !this.skipping) {
      const g = this.gen;
      await new Promise<void>((resolve) => (this.wake = resolve));
      this.wake = null;
      if (g !== this.gen || this.disposed) throw new Cancelled();
    }
  }

  // -------------------------------------------------------------------------------------------
  // The loop
  // -------------------------------------------------------------------------------------------

  start(): void {
    void this.pump();
  }

  private async pump(): Promise<void> {
    if (this.pumping || this.disposed) return;
    this.pumping = true;
    const g = this.gen;
    try {
      for (let guard = 0; guard < 10000; guard++) {
        if (g !== this.gen || this.disposed) return;
        const d = this.session.decider();
        if (!d) {
          this.finish();
          return;
        }
        if (this.seatOf(d) === 'ai') {
          // "Always skip to my decisions" presses Skip for every AI turn (board.md §5.3).
          if (
            this.config.alwaysSkip &&
            !this.skipping &&
            this.session.view(d).decision?.kind === 'main'
          ) {
            this.skipping = true;
            this.skippedLines = [];
          }
          await this.aiStep(d);
          continue;
        }
        if (this.config.autoSkip) {
          const before = this.session.actionCount;
          const a = this.session.autoSkip(this.hotseat);
          if (a) {
            this.afterApply(before, d, true);
            const v = this.session.view(d);
            // Each skipped battle window holds briefly so the stepper can be followed (flows F7).
            if (this.seatOf(other(d)) === 'ai' || v.turn.battleStep) await this.wait(T.autoStep);
            if (this.battleEndedSince(before))
              await this.wait(T.damage + T.dwellAttack, { dwell: true });
            continue;
          }
        }
        // The human owes a real decision: Skip stops here (UX-R3).
        this.stopSkipping('decision');
        this.updateSeat(d);
        this.announceDecision(d);
        this.bump();
        return;
      }
    } catch (e) {
      if (!(e instanceof Cancelled)) {
        this.error = e instanceof Error ? e.message : String(e);
        this.bump();
      }
    } finally {
      if (g === this.gen) this.pumping = false;
    }
  }

  private battleEndedSince(index: number): boolean {
    return this.session.eventTypesFrom(index).includes('BattleEnded');
  }

  private async aiStep(d: PlayerId): Promise<void> {
    const view = this.session.view(d);
    const kind = view.decision?.kind ?? 'main';
    const options = view.actions.filter((a) => a.type !== 'concede');
    const beat = kind !== 'main';
    await this.gate();
    if (beat && !this.skipping) {
      // The uniform considering beat (flows G5): the same time whether or not it had options.
      this.considering = kind;
      this.bump();
      await this.wait(T.considering);
      this.considering = null;
    }
    let action: Action;
    if (options.length === 1) action = options[0]!;
    else {
      const timer = setTimeout(() => {
        this.thinking = true;
        this.activity = `${this.config.names[d]} is thinking…`;
        this.bump();
      }, T.thinkingAfter);
      const seed = (this.session.seed * 2654435761 + this.session.actionCount * 40503) >>> 0;
      const req = this.ai!.decide(view, this.config.tier, seed);
      this.aiRequest = req.id;
      try {
        action = (await req.result).action;
      } catch (e) {
        clearTimeout(timer);
        if (e instanceof Error && e.message === 'cancelled') throw new Cancelled();
        throw e;
      } finally {
        clearTimeout(timer);
        this.aiRequest = null;
        this.thinking = false;
      }
    }
    if (this.disposed) throw new Cancelled();
    // Highlight the acting card (board.md §5.1) where the screen can see it.
    const src =
      action.type === 'attack'
        ? action.attacker
        : action.type === 'giveDon'
          ? action.target
          : action.type === 'block' && action.blocker
            ? action.blocker
            : null;
    if (src && !this.skipping) {
      const h = this.session.translate(d, src, this.me);
      if (h) {
        this.highlight = {
          handle: h,
          word:
            action.type === 'attack'
              ? 'attacking'
              : action.type === 'block'
                ? 'blocking'
                : 'getting DON!!',
        };
        this.bump();
        await this.wait(T.highlight);
      }
    }
    const before = this.session.actionCount;
    const r = this.session.apply(d, action, action.intentId ?? newIntentId());
    this.highlight = null;
    if (!r.ok) throw new Error(r.error ?? 'The AI chose an action the engine refused.');
    this.afterApply(before, d, false);
    const attackOnHuman = action.type === 'attack';
    if (kind === 'main') {
      if (action.type === 'attack') await this.wait(T.move, { attackOnHuman });
      else if (action.type !== 'endTurn') await this.wait(T.move + T.dwell, { dwell: true });
      else await this.wait(300);
    }
    if (this.battleEndedSince(before)) await this.wait(T.damage + T.dwellAttack, { dwell: true });
    if (this.speed === 'step' && !this.skipping && kind === 'main') {
      this.stepWaiting = true;
      this.bump();
    }
  }

  /** Log, announce and record what the last action(s) did (accessibility §9.3). */
  private afterApply(before: number, actor: PlayerId, auto: boolean): void {
    const lines = this.linesSince(before);
    const text = lines.map((l) => l.text).join('. ');
    if (this.skipping && this.seatOf(actor) === 'ai')
      this.skippedLines.push(...lines.filter((l) => l.kind === 'move').map((l) => l.text));
    if (text && !this.skipping) {
      const who =
        this.seatOf(actor) === 'ai' || (this.hotseat && actor !== this.me)
          ? `${this.config.names[actor]}: `
          : '';
      this.say(auto ? text : who + text);
      if (this.seatOf(actor) === 'ai' && !auto)
        this.activity = lines.filter((l) => l.kind === 'move').at(-1)?.text ?? this.activity;
    }
    this.bump();
  }

  private linesSince(index: number): LogLine[] {
    return this.logLines().filter((l) => l.index >= index && (l.kind === 'move' || l.index > 0));
  }

  private say(text: string): void {
    this.polite = { text, seq: this.polite.seq + 1 };
  }

  /** A polite announcement from the UI (whyNot reasons, the status summary, speed changes). */
  announce(text: string): void {
    this.say(text);
    this.bump();
  }

  private announceDecision(d: PlayerId): void {
    const v = this.session.view(d);
    const key = `${this.session.actionCount}:${v.decision?.kind}`;
    if (key === this.lastDecisionKey) return;
    this.lastDecisionKey = key;
    const kind = v.decision?.kind;
    if (kind && kind !== 'main') this.focusDecision++;
  }

  private finish(): void {
    const r = this.session.view('p1').result;
    if (r && this.assertive.text === '') {
      const text =
        'winner' in r
          ? `Game over. ${r.winner === this.me && !this.hotseat ? 'You win' : `${this.config.names[r.winner]} wins`} on turn ${this.session.view('p1').turn.number}.`
          : 'Game over. Draw.';
      this.assertive = { text, seq: this.assertive.seq + 1 };
      this.stopSkipping('end');
      this.focusDecision++;
    }
    this.bump();
  }

  // -------------------------------------------------------------------------------------------
  // Hotseat seats (flows F13b)
  // -------------------------------------------------------------------------------------------

  private updateSeat(d: PlayerId): void {
    if (!this.hotseat || d === this.seat) return;
    const v = this.session.view(d);
    const defending = v.turn.battleStep !== null && d !== v.turn.activePlayer;
    const key = this.turnKey();
    this.seat = d;
    this.revealHeld = false;
    if (defending) this.handVeil = 'hold';
    else if (this.curtainSeen[d] === key) this.handVeil = 'click';
    else {
      this.handVeil = 'none';
      this.curtainFor = d;
      this.curtainSeen[d] = key;
    }
  }

  liftCurtain(): void {
    this.curtainFor = null;
    this.focusDecision++;
    this.bump();
  }

  setReveal(held: boolean): void {
    if (this.handVeil === 'none' || this.revealHeld === held) return;
    this.revealHeld = held;
    this.bump();
  }

  showHand(): void {
    if (this.handVeil !== 'click') return;
    this.handVeil = 'none';
    this.bump();
  }

  /** The bottom hand is hidden from whoever else is looking (hotseat). */
  handHidden(): boolean {
    if (!this.hotseat) return false;
    if (this.handVeil === 'hold') return !this.revealHeld;
    return this.handVeil === 'click';
  }

  // -------------------------------------------------------------------------------------------
  // Human actions
  // -------------------------------------------------------------------------------------------

  /** Apply one view action for the screen's player. */
  act(action: Action, intentId?: string): boolean {
    if (!this.myDecision()) return false;
    const before = this.session.actionCount;
    const r = this.session.apply(this.me, action, intentId);
    if (!r.ok) {
      this.error = `That move couldn’t be applied. Nothing changed. (${r.error ?? 'unknown'})`;
      this.bump();
      return false;
    }
    this.error = null;
    if (this.hotseat && this.handVeil === 'click') this.handVeil = 'none';
    this.afterApply(before, this.me, false);
    void this.pump();
    return true;
  }

  /**
   * Send a staged sequence in order (flows F6 step 5–6), re-reading the view after each action. It
   * pauses, leaving the rest unsent, if the decision changes in a way the player could not predict.
   */
  actSequence(
    actions: Action[],
    intentId = newIntentId(),
  ): { sent: number; paused: string | null } {
    const me = this.me;
    let sent = 0;
    const before = this.session.actionCount;
    for (const a of actions) {
      const v = this.session.view(me);
      if (v.decision?.player !== me) break;
      const want =
        a.type === 'block'
          ? 'block'
          : a.type === 'counter' || a.type === 'endCounter'
            ? 'counter'
            : null;
      if (want && v.decision.kind !== want) {
        // The engine skipped a window or asked something new.
        if (v.decision.kind === 'counter' && want === 'block') continue;
        break;
      }
      const r = this.session.apply(me, a, intentId);
      if (!r.ok) {
        this.error = `That move couldn’t be applied. Nothing changed. (${r.error ?? 'unknown'})`;
        break;
      }
      sent++;
    }
    this.afterApply(before, me, false);
    void this.pump();
    return {
      sent,
      paused: sent < actions.length ? 'Something changed. Check the battle and finish.' : null,
    };
  }

  // -------------------------------------------------------------------------------------------
  // Pacing controls (board.md §5.3)
  // -------------------------------------------------------------------------------------------

  setSpeed(s: Speed): void {
    this.speed = s;
    if (s !== 'step') this.stepWaiting = false;
    this.wake?.();
    this.bump();
  }

  nextMove(): void {
    if (!this.stepWaiting) return;
    this.stepWaiting = false;
    this.wake?.();
    this.bump();
  }

  togglePause(): void {
    this.paused = !this.paused;
    if (!this.paused) this.wake?.();
    this.say(this.paused ? 'Paused.' : 'Resumed.');
    this.bump();
  }

  /** Skip to my decision (flows F21 step 4): never decides for the player. */
  skip(): void {
    if (this.skipping || this.hotseat) return;
    this.skipping = true;
    this.skippedLines = [];
    this.recap = null;
    this.wake?.();
    this.bump();
  }

  private stopSkipping(why: 'decision' | 'end'): void {
    if (!this.skipping) return;
    const lines = this.skippedLines;
    this.skippedLines = [];
    this.skipping = false;
    this.paused = false;
    this.stepWaiting = false;
    if (lines.length) {
      this.recap = lines.slice(-6);
      this.say(`Skipped ${lines.length} moves. ${lines.slice(-3).join('. ')}`);
    } else this.recap = why === 'decision' ? null : this.recap;
  }

  dismissRecap(): void {
    this.recap = null;
    this.bump();
  }

  // -------------------------------------------------------------------------------------------
  // Rewind (flows F11)
  // -------------------------------------------------------------------------------------------

  private restart(): void {
    this.gen++;
    this.pumping = false;
    if (this.aiRequest !== null) this.ai?.cancel(this.aiRequest);
    this.aiRequest = null;
    this.wake?.();
    this.highlight = null;
    this.considering = null;
    this.thinking = false;
    this.stepWaiting = false;
    this.skipping = false;
    this.lastDecisionKey = '';
  }

  private humans(): PlayerId[] {
    return this.hotseat ? ['p1', 'p2'] : [this.config.human];
  }

  private rewound(m: Move | null, label: string): boolean {
    if (!m) {
      this.toast = 'Nothing to rewind.';
      this.bump();
      return false;
    }
    const first = this.session.exportRecord().rewinds.length === 1;
    this.toast = `Back to: before ${label}.${first ? ' Same shuffle: rewinding won’t change your draws.' : ''}`;
    this.say(`Rewound. ${this.toast}`);
    if (this.hotseat) {
      const d = this.session.decider();
      if (d && d !== this.seat) {
        this.seat = d;
        this.curtainFor = d;
        this.curtainSeen[d] = this.turnKey();
      }
    }
    this.restart();
    this.bump();
    void this.pump();
    return true;
  }

  rewindMove(): boolean {
    this.restart();
    const lines = this.logLines();
    const m = this.session.rewindMove(this.humans());
    return this.rewound(m, m ? moveText(lines, m) : '');
  }

  backToMyLastDecision(): boolean {
    this.restart();
    const lines = this.logLines();
    const m = this.session.backToLastDecision(this.me);
    return this.rewound(m, m ? moveText(lines, m) : '');
  }

  rewindTo(index: number): boolean {
    this.restart();
    const lines = this.logLines();
    const ok = this.session.rewindTo(index);
    const m: Move | null = ok
      ? { start: index, end: index + 1, player: this.me, intentId: '', auto: false }
      : null;
    return this.rewound(m, m ? moveText(lines, m) : '');
  }

  forward(): void {
    this.restart();
    if (this.session.forward()) this.toast = 'Forward one move.';
    this.bump();
    void this.pump();
  }

  clearToast(): void {
    this.toast = null;
    this.bump();
  }

  concede(): void {
    const me = this.me;
    this.restart();
    this.session.apply(me, { type: 'concede', player: me });
    this.bump();
    void this.pump();
  }
}

function moveText(lines: LogLine[], m: Move): string {
  const l = lines.find((x) => x.kind === 'move' && x.index === m.start);
  return l ? l.text.charAt(0).toLowerCase() + l.text.slice(1) : 'that move';
}
