/**
 * `/tutorial`: the guided tutorial (PROMPT.md "Guided tutorial"; flows F2). Eight steps, each one
 * scenario on the real engine with a scripted opponent; the board is the same board as a game, with
 * the coach hidden, a step card in the decision panel and the legal actions narrowed to the one
 * being taught. Lazy-loaded with the board.
 */
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { Card } from '@optcg/cards';
import type { ProjectedView } from '@optcg/engine';
import { Footer } from '../Footer.tsx';
import { Header } from '../Header.tsx';
import { navigate } from '../router.tsx';
import { Game } from '../play/game/Game.tsx';
import { loadCards } from '../play/setup/decks.ts';
import { loadProfile, saveProfile } from '../play/coach/profile.ts';
import { ST21_MAIN, ST22_MAIN, ST21_LEADER, ST22_LEADER } from './decks.ts';
import { defaultEnv, TutorialRunner } from './runner.ts';
import { SCENARIOS_T } from './steps.ts';
import { download, exportName, minutesWords, timingStore, toCsv, toJson } from './timing.ts';
import { loadProgress, STEP_COUNT, TUTORIAL_LESSONS } from './progress.ts';
import { TUTORIAL_ZONES, type TutorialZone } from './types.ts';
import { CONTENT_META } from './copy.ts';
import { RuleLink } from '../rules/RuleLink.tsx';
import '../play/play.css';
import './tutorial.css';

const ZONE_NAMES: Record<TutorialZone, string> = {
  leader: 'Leader',
  characters: 'Characters',
  stage: 'Stage',
  life: 'Life',
  deck: 'Deck',
  trash: 'Trash',
  donDeck: 'DON!! deck',
  costArea: 'Cost area',
  hand: 'Hand',
};

/** Every card id the eight scenarios and the two decks name. */
function wantedIds(): string[] {
  const ids = new Set<string>([ST21_LEADER, ST22_LEADER, ...ST21_MAIN, ...ST22_MAIN]);
  const placed = (c: unknown): void => {
    if (typeof c === 'string') ids.add(c);
    else if (c && typeof c === 'object' && 'card' in c) ids.add((c as { card: string }).card);
  };
  for (const s of Object.values(SCENARIOS_T))
    for (const side of [s.p1, s.p2]) {
      placed(side.leader);
      for (const list of [side.hand, side.deck, side.life, side.characters, side.trash])
        for (const c of list ?? []) placed(c);
      if (side.stage) placed(side.stage);
    }
  return [...ids];
}

/** Which of the nine zones an element on the board belongs to (mine only), or null. */
export function zoneOf(el: Element | null): TutorialZone | null {
  if (!el) return null;
  const zid = el.closest<HTMLElement>('[data-zid]')?.dataset.zid as TutorialZone | undefined;
  if (zid && TUTORIAL_ZONES.includes(zid)) return zid;
  if (el.closest('.board [data-zone="my-row"] .bc-leader')) return 'leader';
  if (el.closest('.board [data-zone="my-chars"]')) return 'characters';
  if (el.closest('.board [data-zone="hand"]')) return 'hand';
  return null;
}

function reducedMotion(): boolean {
  try {
    return (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.motion === 'reduced'
    );
  } catch {
    return false;
  }
}

export default function TutorialRoute() {
  const [runner, setRunner] = useState<TutorialRunner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Tutorial · OPTCG Sim';
  }, []);

  // Load the cards once, then start a new run (?restart=1) or continue the saved one.
  useEffect(() => {
    let live = true;
    let made: TutorialRunner | null = null;
    loadCards(wantedIds()).then(
      (cards: Map<string, Card>) => {
        if (!live) return;
        const q = new URLSearchParams(window.location.search);
        const resume = q.get('restart') === '1' ? null : loadProgress();
        made = new TutorialRunner({
          cards,
          clock: { now: () => performance.now() },
          store: timingStore(),
          env: defaultEnv({
            reducedMotion: reducedMotion(),
            aiPace: '2x',
            singleKeyShortcuts: true,
            cardAnnouncements: 'standard',
          }),
          resume,
        });
        setRunner(made);
      },
      (e: unknown) => live && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      live = false;
      made?.dispose();
    };
  }, []);

  if (error)
    return (
      <div className="shell">
        <Header />
        <main className="page" id="main">
          <h1>The tutorial could not start</h1>
          <p role="alert">Nothing changed. {error}</p>
        </main>
        <Footer />
      </div>
    );
  if (!runner)
    return (
      <div className="shell">
        <Header />
        <main className="page" id="main" aria-busy="true">
          <h1>Loading the tutorial…</h1>
        </main>
        <Footer />
      </div>
    );
  return <Run runner={runner} />;
}

function Run({ runner }: { runner: TutorialRunner }) {
  useSyncExternalStore(runner.subscribe, runner.getVersion);

  // Timing: inputs (pointer or keyboard) and the tab's visibility (usability-plan §7.1).
  useEffect(() => {
    const down = () => runner.input('pointer');
    const key = () => runner.input('keyboard');
    const vis = () => runner.setVisible(document.visibilityState !== 'hidden');
    const hide = () => runner.tracker.save();
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key, true);
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('pagehide', hide);
    vis();
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('keydown', key, true);
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('pagehide', hide);
    };
  }, [runner]);

  // Step 1 counts the zones the player focuses or clicks.
  useEffect(() => {
    const seen = (e: Event) => {
      const z = zoneOf(e.target instanceof Element ? e.target : null);
      if (z) runner.visitZone(z);
    };
    document.addEventListener('focusin', seen);
    document.addEventListener('click', seen);
    return () => {
      document.removeEventListener('focusin', seen);
      document.removeEventListener('click', seen);
    };
  }, [runner]);

  const leave = () => {
    runner.leave();
    navigate('/');
  };

  if (runner.phase === 'complete') return <Completion runner={runner} />;
  return (
    <Game
      key={`${runner.step.id}:${runner.attempt}`}
      ctl={runner.ctl}
      onNewGame={leave}
      onRematch={leave}
      onHome={leave}
      tutorialSlot={<StepCard runner={runner} onLeave={leave} />}
    />
  );
}

/** Light the cards and zones the step names; the visited zones of step 1 turn to a quiet tick. */
function useLit(runner: TutorialRunner, view: ProjectedView) {
  useEffect(() => {
    const board = document.querySelector('.board');
    if (!board || runner.phase !== 'playing') return;
    const lit: Element[] = [];
    const me = view.player;
    const opp = me === 'p1' ? 'p2' : 'p1';
    for (const l of runner.step.lit ?? []) {
      if ('zone' in l) {
        if (runner.visited.has(l.zone)) continue;
        const sel: Record<TutorialZone, string> = {
          leader: '[data-zone="my-row"].bc-leader',
          characters: '[data-zone="my-chars"][data-item]',
          stage: '[data-zid="stage"]',
          life: '[data-zid="life"]',
          deck: '[data-zid="deck"]',
          trash: '[data-zid="trash"]',
          donDeck: '[data-zid="donDeck"]',
          costArea: '[data-zid="costArea"] .rowbtn',
          hand: '[data-zone="hand"][data-item]',
        };
        lit.push(...board.querySelectorAll(sel[l.zone]));
      } else {
        const seat = l.side === 'me' ? me : opp;
        const handle = Object.values(view.zones[seat])
          .flat()
          .find((c) => c.card === l.card)?.handle;
        const el = handle ? board.querySelector(`[data-handle="${handle}"]`) : null;
        if (el) lit.push(el);
      }
    }
    for (const el of lit) el.setAttribute('data-tutorial-lit', '');
    return () => {
      for (const el of lit) el.removeAttribute('data-tutorial-lit');
    };
  });
}

/** The step's rule as a link to the reference, which opens in a new tab so the step is not lost. */
export function TutorialRule({ rule, onOpen }: { rule: string; onOpen?: () => void }) {
  const cr = /^CR (\d[\d-]*)$/.exec(rule)?.[1];
  if (!cr) return <>Rule: {rule}</>;
  return (
    <RuleLink cr={cr} onOpen={onOpen}>
      Rule: {rule}
    </RuleLink>
  );
}

function StepCard({ runner, onLeave }: { runner: TutorialRunner; onLeave: () => void }) {
  useSyncExternalStore(runner.subscribe, runner.getVersion);
  // The numbers in the words come from the board, so the card follows the game too.
  useSyncExternalStore(runner.ctl.subscribe, runner.ctl.getVersion);
  const view = runner.ctl.view();
  const step = runner.step;
  const textRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  useLit(runner, view);

  // Focus lands on the step text when a step starts (and on "Read again"), after the board mounts.
  const focusKey = `${runner.focusSignal}:${runner.readSignal}`;
  useEffect(() => {
    const t = setTimeout(() => textRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, [focusKey]);
  // When the step is done, "Next" takes focus so Enter goes on (flows F2 step 1).
  const done = runner.phase === 'done';
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => nextRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [done, runner.attempt]);

  // The "Not yet…" line clears when the player's next action is accepted.
  const actions = runner.ctl.session.actionCount;
  useEffect(() => {
    runner.settle(actions);
  });

  const keys = runner.keys();
  const visiting = !!step.visit;
  return (
    <section
      className="tut-card"
      aria-label="Tutorial"
      data-testid="tutorial-card"
      data-step={step.id}
    >
      <div
        id="tutorial-text"
        className="tut-text"
        ref={textRef}
        tabIndex={-1}
        role="group"
        aria-labelledby="tut-title"
      >
        <h3 id="tut-title">
          Step {runner.index + 1} of {STEP_COUNT}: {step.title}
        </h3>
        <p className="tut-intro">{runner.text('intro')}</p>
        {done ? (
          <p className="tut-notice good" data-testid="tutorial-done">
            {runner.text('done')}
          </p>
        ) : (
          <p className="tut-prompt">
            <b>Do this:</b> {runner.text('prompt')} <span className="tut-keys">{keys}</span>
          </p>
        )}
      </div>
      {visiting && (
        <ul className="tut-zones" aria-label="Zones visited">
          {TUTORIAL_ZONES.map((z) => (
            <li key={z} data-visited={runner.visited.has(z) ? '' : undefined}>
              {runner.visited.has(z) ? '✓ ' : '○ '}
              {ZONE_NAMES[z]}
              <span className="sr-only">{runner.visited.has(z) ? ', visited' : ', not yet'}</span>
            </li>
          ))}
        </ul>
      )}
      {!done && visiting && runner.lastZone && (
        <p className="tut-notice good" data-testid="tutorial-zone-line">
          {runner.zoneLine()}
        </p>
      )}
      {!done && runner.notice && (
        <p className="tut-notice" data-testid="tutorial-notice">
          {runner.notice}
        </p>
      )}
      {runner.rule() && (
        <p className="tut-rule">
          <TutorialRule rule={runner.rule()} onOpen={() => runner.explained()} />
        </p>
      )}
      <div className="tut-actions">
        <button type="button" className="btn small" onClick={() => runner.readAgain()}>
          Read again
        </button>
        <button
          type="button"
          className="btn small"
          disabled={runner.index === 0}
          onClick={() => runner.back()}
        >
          Back
        </button>
        <span className="grow" />
        {done && (
          <button
            type="button"
            className="btn small primary"
            ref={nextRef}
            data-testid="tutorial-next"
            onClick={() => runner.next()}
          >
            {runner.isLast ? 'Finish' : 'Next'} <kbd aria-hidden="true">Enter</kbd>
          </button>
        )}
        <button type="button" className="btn small" onClick={onLeave}>
          Leave tutorial
        </button>
      </div>
    </section>
  );
}

function Completion({ runner }: { runner: TutorialRunner }) {
  const log = useMemo(() => runner.tracker.snapshot(), [runner]);
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    document.title = 'Tutorial complete · OPTCG Sim';
    first.current?.focus();
  }, []);
  const play = () => {
    runner.dispose();
    const p = loadProfile();
    saveProfile({ ...p, firstGame: true });
    navigate('/play?preset=first');
  };
  const home = () => {
    runner.dispose();
    const p = loadProfile();
    if (p.firstGame === undefined) saveProfile({ ...p, firstGame: false });
    navigate('/');
  };
  return (
    <div className="shell">
      <Header />
      <main className="page tut-done" id="main">
        <h1 tabIndex={-1}>Tutorial complete in {minutesWords(log.totalActiveMs)}</h1>
        <p role="status">
          You have the basics: the zones, DON!! and power, attacking, defending, Triggers, your
          Leader’s ability and how a game is won. The next game uses the same two decks.
        </p>
        <p className="lessons">
          Lessons {TUTORIAL_LESSONS[0]} to {TUTORIAL_LESSONS.at(-1)} are marked done on this device.
        </p>
        <p className="row">
          <button type="button" className="btn primary big" ref={first} onClick={play}>
            Play your first full game
          </button>
          <button type="button" className="btn big" onClick={home}>
            Back to Home
          </button>
        </p>
        <p className="muted small">
          How long each step took stays on this device. Export it to send to the person running the
          session:{' '}
          <button
            type="button"
            className="btn small"
            onClick={() => download(exportName(log, 'json'), toJson(log), 'application/json')}
          >
            Export JSON
          </button>{' '}
          <button
            type="button"
            className="btn small"
            onClick={() => download(exportName(log, 'csv'), toCsv(log), 'text/csv')}
          >
            Export CSV
          </button>
        </p>
        <p className="muted small">Words as of {CONTENT_META.asOf}.</p>
      </main>
      <Footer />
    </div>
  );
}
