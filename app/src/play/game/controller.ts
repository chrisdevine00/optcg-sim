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
  /**
   * The card ids of the AI's own deck: the only card data its worker receives (review M3-09,
   * ARCHITECTURE §4.3: the AI never sees the human's decklist).
   */
  aiCardIds?: string[];
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

/** The AI worker's `init` payload: its own deck's cards only (review M3-09). */
export function aiInitCards(cards: ReadonlyMap<string, Card>, aiDeck: readonly string[]): Card[] {
  const ids = new Set(aiDeck);
  return [...cards.values()].filter((c) => ids.has(c.id));
}

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
  /** Touch: the reveal stays until "Hide my hand", a commit or a seat change (M3-32). */
  revealSticky = false;
  private gameOverAnnounced = false;
  private curtainSeen: Record<PlayerId, string> = { p1: '', p2: '' };

  // Feedback.
  toast: string | null = null;
  error: string | null = null;
  polite: Announcement = { text: '', seq: 0 };
  assertive: Announcement = { text: '', seq: 0 };
  /** The card the screen's player is playing, while its play asks a question (M3-22). */
  pendingPlay: string | null = null;
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
    this.ai =
      config.mode === 'ai' ? new AiClient(aiInitCards(cards, config.aiCardIds ?? [])) : null;
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

  /**
   * May the screen show the seat's private information now? Against the AI, always. In hotseat,
   * only with no curtain up and the hand not veiled (review M3-01..04): otherwise the other player
   * may be the one looking.
   */
  revealed(): boolean {
    return !this.hotseat || (this.curtainFor === null && !this.handHidden());
  }

  /** The view the screen renders: the seat's own, or only what both players may see. */
  view(): ProjectedView {
    return this.revealed() ? this.session.view(this.me) : this.session.publicView(this.me);
  }

  /**
   * The seat's legal actions, limited while veiled to those that name only cards both players can
   * see (Take the hit, a Blocker, the damage decision), so nothing hidden is lit or listed.
   */
  actions(): Action[] {
    const priv = this.session.view(this.me);
    if (this.revealed()) return priv.actions;
    const pub = this.session.publicView(this.me);
    const visible = new Set<string>();
    for (const p of ['p1', 'p2'] as const)
      for (const z of Object.values(pub.zones[p]))
        for (const c of z) if (c.card !== null) visible.add(c.handle);
    const named = (a: Action) =>
      ['card', 'target', 'attacker', 'blocker'].every((f) => {
        const v = (a as Record<string, unknown>)[f];
        return typeof v !== 'string' || visible.has(v);
      }) &&
      (a.type !== 'pick' || typeof a.choice !== 'string' || visible.has(a.choice));
    // Whether a Life card's [Trigger] can be activated depends on the hidden card.
    return priv.actions.filter((a) => named(a) && !(a.type === 'trigger' && a.activate));
  }

  /** The Life card of a pending damage decision, for its owner while revealed. */
  pendingLifeCard(): string | null {
    return this.revealed() ? this.session.pendingLifeCard(this.me) : null;
  }

  /**
   * A veiled seat's own decision that needs no hidden information: every legal answer names only
   * public cards and its source is public (review M3-35). It can be answered without a reveal.
   */
  veiledAnswerable(): boolean {
    if (this.revealed()) return true;
    const priv = this.session
      .view(this.me)
      .actions.filter((a) => a.type !== 'concede' && !(a.type === 'trigger' && a.activate));
    const pub = this.actions().filter((a) => a.type !== 'concede');
    const d = this.session.view(this.me).decision;
    const srcPublic = !d?.source || this.session.publicView(this.me).decision?.source !== undefined;
    return priv.length === pub.length && srcPublic;
  }

  /** Show the screen seat's hand: the click veil lifts; a held veil becomes a sticky reveal. */
  revealNow(): void {
    if (this.handVeil === 'click') this.showHand();
    else this.setReveal(true, true);
  }

  /** Rewind needs the seat unveiled in hotseat (review M3-04, M3-24). */
  canRewind(): boolean {
    return this.revealed();
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
    const key = `${this.session.version}|${this.me}|${this.hotseat}`;
    if (this.logCache?.key === key) return this.logCache.lines;
    const lines = this.buildLog();
    this.logCache = { key, lines };
    return lines;
  }

  private buildLog(): LogLine[] {
    // Hotseat: both players see the screen, so the log only ever shows what both may see.
    const { moves, events, start } = this.hotseat
      ? this.session.publicLog(this.me)
      : this.session.log(this.me);
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
        // The damage decision is never auto-skipped for a human: it shows which Life card they
        // gained (flows F6.8, review M3-12).
        if (this.config.autoSkip && this.session.view(d).decision?.kind !== 'trigger') {
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
    // Each line is credited to its own actor, in words (review M3-10).
    const spoken = lines.map((l) => this.spoken(l));
    const text = spoken.join(' ');
    if (this.skipping && this.seatOf(actor) === 'ai')
      this.skippedLines.push(...lines.filter((l) => l.kind === 'move').map((l) => this.spoken(l)));
    if (text && !this.skipping) {
      this.say(text);
      if (this.seatOf(actor) === 'ai' && !auto)
        this.activity = lines.filter((l) => l.kind === 'move').at(-1)?.text ?? this.activity;
    }
    this.bump();
  }

  /** A log line as a sentence: "Your turn 5.", "Kaido: Play Queen.", "You: Counter: Sai +1000." */
  spoken(l: LogLine): string {
    const name = (p: PlayerId) =>
      this.hotseat ? this.config.names[p] : p === this.me ? 'You' : this.config.names[p];
    if (l.kind === 'turn') {
      const n = /Turn (\d+)/.exec(l.text)?.[1] ?? '';
      if (!l.actor) return `Turn ${n}.`;
      return this.hotseat || l.actor !== this.me
        ? `${this.config.names[l.actor]}’s turn ${n}.`
        : `Your turn ${n}.`;
    }
    return `${l.actor ? `${name(l.actor)}: ` : ''}${l.text.replace(/\.+$/, '')}.`;
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

  /** An assertive announcement: a decision owed during the opponent's turn (flows F6.1). */
  alert(text: string): void {
    this.assertive = { text, seq: this.assertive.seq + 1 };
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
    // The game is over: no hand stays revealed on the final board (review M3-36).
    if (r && (this.revealHeld || this.revealSticky)) {
      this.revealHeld = false;
      this.revealSticky = false;
    }
    // Its own flag: the region may still hold a defence alert (review M3-28).
    if (r && !this.gameOverAnnounced) {
      this.gameOverAnnounced = true;
      const text =
        'winner' in r
          ? `Game over. ${r.winner === this.me && !this.hotseat ? 'You win' : `${this.config.names[r.winner]} wins`} on turn ${this.session.view('p1').turn.number}.`
          : 'Game over. Draw.';
      this.assertive = { text, seq: this.assertive.seq + 1 };
      // flows F15: then, politely, what can be done next.
      this.say('Rematch, or New game.');
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
    if (this.revealHeld) this.clearAnnouncements();
    this.revealHeld = false;
    this.revealSticky = false;
    this.recap = null;
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

  setReveal(held: boolean, sticky = false): void {
    if (this.handVeil === 'none') return;
    // A sticky (touch) reveal ignores a key or pointer release; only Hide, a commit, blur or a
    // seat change end it.
    if (!held && this.revealSticky) return;
    this.revealSticky = held && sticky;
    if (this.revealHeld === held) {
      this.bump();
      return;
    }
    this.revealHeld = held;
    // What was said while revealed (staging sentences) leaves the live regions with the reveal.
    if (!held) this.clearAnnouncements();
    this.bump();
  }

  /** End any reveal now, sticky included (Hide, blur, commit). */
  endReveal(): void {
    if (!this.revealHeld && !this.revealSticky) return;
    this.revealSticky = false;
    this.revealHeld = false;
    this.clearAnnouncements();
    this.bump();
  }

  private clearAnnouncements(): void {
    this.polite = { text: '', seq: this.polite.seq + 1 };
    this.assertive = { text: '', seq: this.assertive.seq + 1 };
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
    if (action.type === 'playCard') {
      const c = this.session
        .view(this.me)
        .zones[this.me].hand.find((x) => x.handle === action.card);
      this.pendingPlay = c?.card ? (this.cards.get(c.card)?.name ?? null) : null;
    } else if (action.type !== 'pick' && action.type !== 'done') this.pendingPlay = null;
    const r = this.session.apply(this.me, action, intentId);
    if (!r.ok) {
      this.error = `That move couldn’t be applied. Nothing changed. (${r.error ?? 'unknown'})`;
      this.bump();
      return false;
    }
    this.error = null;
    this.recap = null;
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
    // A defence commit ends any reveal, sticky or held, before the next decision draws (M3-32).
    if (this.revealHeld) this.endReveal();
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
      this.say(`Skipped ${lines.length} moves. ${lines.slice(-3).join(' ')}`);
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
    // A rewind ends any reveal (review M3-36).
    this.revealHeld = false;
    this.revealSticky = false;
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
    this.recap = null;
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
      // After a hotseat rewind the decider always gets the curtain, and no veil or reveal state
      // carries over from the undone position (review M3-36).
      if (d) {
        this.seat = d;
        this.curtainFor = d;
        this.handVeil = 'none';
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
