/**
 * `/rules/<id>/show` (M9 WP5): "Show me". A demo from the reference on the real board, the tutorial's
 * way: a `GameController` on the engine with `config.tutorial = { allow, … }`, where `allow` is derived
 * from the demo's current step (`allowFor`) and only ever removes engine actions. The opponent, where
 * a demo needs one to act, is the tutorial's scripted Rookie. The coach is hidden. Esc (or the button)
 * goes back to the rule with focus on "Show me". Nothing here is credited to Progress: a lesson is
 * marked read only by the player, on the Learn pages.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Card } from '@optcg/cards';
import type { Action } from '@optcg/engine';
import { Footer } from '../Footer.tsx';
import { Header } from '../Header.tsx';
import { Link, navigate, useSearch } from '../router.tsx';
import { Game } from '../play/game/Game.tsx';
import { GameController, type Speed } from '../play/game/controller.ts';
import { loadCards } from '../play/setup/decks.ts';
import { inertCoachPort } from '../tutorial/runner.ts';
import { ScriptedOpponent } from '../tutorial/scripted.ts';
import { ruleIdOf } from '../routes/m9.ts';
import { LESSONS } from '../learn/lessons.ts';
import { demoEntryId, demoForId, loadRules } from './index.ts';
import { RuleLink } from './RuleLink.tsx';
import { allowFor, demoCardIds, mySteps, scriptFor, stepsDone } from './showme.ts';
import type { DemoStep, RuleDemo } from './types.ts';
import '../play/play.css';
import '../tutorial/tutorial.css';
import './rules.css';

/** One run of a demo: its controller, how many of the player's steps are done, the "not that one" line. */
export class ShowRunner {
  ctl!: GameController;
  /** A bump of this remounts the board (a new run). */
  attempt = 0;
  notice: string | null = null;
  readonly steps: DemoStep[];
  private n = 0;
  private version = 0;
  private listeners = new Set<() => void>();
  private off: (() => void) | null = null;
  private disposed = false;

  constructor(
    readonly demo: RuleDemo,
    private readonly cards: Map<string, Card>,
    private readonly speed: Speed = 2,
  ) {
    this.steps = mySteps(demo);
    this.begin();
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getVersion = () => this.version;
  private bump(): void {
    this.version++;
    for (const fn of this.listeners) fn();
  }

  /** How many of the player's steps are played. */
  get done(): number {
    return this.n;
  }
  get finished(): boolean {
    return this.n >= this.steps.length;
  }
  get current() {
    return this.steps[this.n] ?? null;
  }

  private blocked(): void {
    const s = this.current;
    this.notice = s ? `Not that one. This demo is showing: ${s.desc}.` : null;
    if (this.notice) this.ctl.announce(this.notice);
    this.bump();
  }

  private begin(): void {
    this.off?.();
    this.ctl?.dispose();
    this.n = 0;
    this.notice = null;
    this.attempt++;
    const allow = allowFor(this.demo, () => this.n);
    this.ctl = new GameController(
      this.cards,
      { scenario: this.demo.scenario },
      {
        mode: 'ai',
        human: 'p1',
        names: { p1: 'You', p2: 'Opponent' },
        tier: 'rookie',
        autoSkip: true,
        alwaysSkip: false,
        speed: this.speed,
        aiCardIds: [],
        aiDeck: [],
        aiPort: () => new ScriptedOpponent(scriptFor(this.demo)),
        coachPort: inertCoachPort,
        tutorial: {
          allow: (a: Action, v) => allow(a, v),
          onBlocked: () => this.blocked(),
          onStray: () => this.blocked(),
        },
      },
    );
    this.off = this.ctl.subscribe(() => this.sync());
    this.ctl.start();
    this.ctl.announce(this.spoken());
    this.bump();
  }

  /** After every change of the game: count the player's steps, and say the next one. */
  private sync(): void {
    if (this.disposed) return;
    const n = stepsDone(this.ctl.session.exportRecord(), 'p1');
    if (n === this.n) return;
    this.n = n;
    this.notice = null;
    this.ctl.announce(
      this.finished
        ? `${this.demo.say[1]} Press Back to the rule, or Run it again.`
        : `Next: ${this.current!.desc}.`,
    );
    this.bump();
  }

  spoken(): string {
    return `Show me: ${this.demo.title}. ${this.demo.say[0]} Do this: ${this.current?.desc ?? ''}.`;
  }

  restart(): void {
    this.begin();
  }

  dispose(): void {
    this.disposed = true;
    this.off?.();
    this.ctl?.dispose();
  }
}

/** Where "Back to the rule" goes: the page the player came from, else the demo's own rule. */
export const backPath = (demo: RuleDemo, back: string | null): string =>
  `/rules/${back && /^[\w/.-]+$/.test(back) ? back : demoEntryId(demo)}?from=show`;

export default function ShowMe({ path }: { path: string }) {
  const id = ruleIdOf(path);
  const back = new URLSearchParams(useSearch()).get('back');
  const [state, setState] = useState<{ runner: ShowRunner } | { error: string } | null>(null);

  useEffect(() => {
    document.title = 'Show me · Rules · OPTCG Sim';
  }, []);

  // The runner is made here, in the effect, and disposed by its cleanup (StrictMode runs it twice).
  useEffect(() => {
    let live = true;
    let made: ShowRunner | null = null;
    (async () => {
      const data = await loadRules();
      const demo = demoForId(data, id);
      if (!demo) return { error: `There is no demo for “${id}”.` };
      const cards = await loadCards(demoCardIds(demo));
      if (!live) return { error: '' };
      made = new ShowRunner(demo, cards);
      return { runner: made };
    })().then(
      (s) => live && setState(s),
      (e: unknown) => live && setState({ error: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      live = false;
      made?.dispose();
    };
  }, [id]);

  if (state && 'error' in state)
    return (
      <div className="shell">
        <Header />
        <main className="page" id="main">
          <h1 id="page-title" tabIndex={-1}>
            No demo to show
          </h1>
          <p role="alert">{state.error}</p>
          <p>
            <Link to="/rules">Back to the rules reference</Link>
          </p>
        </main>
        <Footer />
      </div>
    );
  if (!state)
    return (
      <div className="shell">
        <Header />
        <main className="page" id="main" aria-busy="true" data-path={path}>
          <h1 id="page-title" tabIndex={-1}>
            Loading the demo…
          </h1>
        </main>
        <Footer />
      </div>
    );
  return <Run key={state.runner.demo.id} runner={state.runner} back={back} />;
}

function Run({ runner, back }: { runner: ShowRunner; back: string | null }) {
  useSyncExternalStore(runner.subscribe, runner.getVersion);
  const demo = runner.demo;
  const leave = () => navigate(backPath(demo, back));

  // Esc goes back to the rule, unless something on the board is using it (a dialog, a menu).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (document.querySelector('[role="dialog"], [role="menu"], dialog[open]')) return;
      e.preventDefault();
      navigate(backPath(demo, back));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [demo, back]);

  return (
    <Game
      key={`${demo.id}:${runner.attempt}`}
      ctl={runner.ctl}
      onNewGame={leave}
      onRematch={leave}
      onHome={leave}
      tutorialSlot={<ShowCard runner={runner} onLeave={leave} />}
    />
  );
}

export function ShowCard({ runner, onLeave }: { runner: ShowRunner; onLeave: () => void }) {
  useSyncExternalStore(runner.subscribe, runner.getVersion);
  const { demo } = runner;
  const textRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const finished = runner.finished;
  const lesson = LESSONS.find((l) => l.code === demo.lesson);

  // Focus lands on the card's text when a run starts, and on "Back to the rule" when it is done.
  useEffect(() => {
    const t = setTimeout(() => (finished ? backRef : textRef).current?.focus(), 150);
    return () => clearTimeout(t);
  }, [runner.attempt, finished]);

  return (
    <section
      className="tut-card show-card"
      aria-label="Show me"
      data-testid="show-card"
      data-demo={demo.id}
    >
      <div
        id="show-text"
        className="tut-text"
        ref={textRef}
        tabIndex={-1}
        role="group"
        aria-labelledby="show-title"
      >
        <h3 id="show-title">Show me: {demo.title}</h3>
        <p className="tut-intro">{demo.say[0]}</p>
        {finished ? (
          <p className="tut-notice good" data-testid="show-done">
            {demo.say[1]}
          </p>
        ) : (
          <p className="tut-prompt">
            <b>Do this:</b> {runner.current!.desc}.{' '}
            <span className="tut-keys">Tab or the arrow keys find it; Enter confirms.</span>
          </p>
        )}
      </div>
      <ol className="show-steps" aria-label="Steps">
        {runner.steps.map((s, i) => (
          <li key={i} data-state={i < runner.done ? 'done' : i === runner.done ? 'now' : 'next'}>
            {i < runner.done ? '✓ ' : i === runner.done ? '▶ ' : '○ '}
            {s.desc}
            <span className="sr-only">
              {i < runner.done ? ', done' : i === runner.done ? ', now' : ', not yet'}
            </span>
          </li>
        ))}
      </ol>
      {!finished && runner.notice && (
        <p className="tut-notice" data-testid="show-notice">
          {runner.notice}
        </p>
      )}
      <p className="tut-rule">
        Rule:{' '}
        {demo.rules
          .filter((r) => !r.startsWith('item/'))
          .map((r, i) => (
            <span key={r}>
              {i > 0 && ', '}
              <RuleLink cr={r}>CR {r}</RuleLink>
            </span>
          ))}
        {demo.rulings?.map((r) => (
          <span key={r}>
            {', '}
            <a
              className="rule-link"
              href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/rules/${r}`}
              target="_blank"
              rel="noopener"
            >
              {r}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </span>
        ))}
      </p>
      {finished && lesson && (
        <p className="subtle">
          This belongs to{' '}
          <Link to={`/learn/${lesson.id}`}>
            {lesson.code} · {lesson.title}
          </Link>
          .
        </p>
      )}
      <div className="tut-actions">
        <button
          type="button"
          className={finished ? 'btn small primary' : 'btn small'}
          ref={backRef}
          onClick={onLeave}
        >
          Back to the rule <kbd aria-hidden="true">Esc</kbd>
        </button>
        <button type="button" className="btn small" onClick={() => runner.restart()}>
          Run it again
        </button>
      </div>
    </section>
  );
}
