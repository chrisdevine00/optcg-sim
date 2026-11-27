/**
 * Settings, minimal (flows F20, M7 WP5): the coach, the tutorial's timing log and the welcome
 * question. Every change applies at once and is spoken politely. Native controls only, so the page
 * is keyboard-complete; nothing here is sent anywhere.
 */
import { useState } from 'react';
import {
  DEFAULT_PROFILE,
  loadProfile,
  saveProfile,
  type AlwaysOn,
  type CoachProfile,
} from '../play/coach/profile.ts';
import type { Verbosity } from '../play/coach/ExplanationView.tsx';
import { KIND_WORDS } from '../play/coach/blunder.ts';
import { clearWelcome, loadWelcome } from '../tutorial/progress.ts';
import {
  download,
  exportName,
  minutesWords,
  timingStore,
  toCsv,
  toJson,
} from '../tutorial/timing.ts';
import type { TutorialTimingLog } from '../tutorial/types.ts';
import { Link } from '../router.tsx';
import { OfflineLine } from '../shell/OfflineLine.tsx';
import { DataSection } from './DataSection.tsx';
import './settings.css';

const VERBOSITY: { v: Verbosity; label: string }[] = [
  { v: 'learner', label: 'Learner: evidence open, “next time” shown' },
  { v: 'standard', label: 'Standard: claim, certainty, line and outcome' },
  { v: 'terse', label: 'Terse: claim and outcome' },
];

const DETECTOR: { v: AlwaysOn; label: string }[] = [
  { v: 0, label: 'Ask me' },
  { v: 1, label: 'Tier 1 always on' },
  { v: 2, label: 'Tier 2 always on' },
];

function when(log: TutorialTimingLog): string {
  const d = new Date(log.startedAt);
  return Number.isNaN(d.getTime())
    ? log.startedAt
    : d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function SettingsRoute() {
  const [store] = useState(timingStore);
  const [profile, setProfile] = useState<CoachProfile>(loadProfile);
  const [runs, setRuns] = useState<TutorialTimingLog[]>(() => store.load());
  const [welcomeAsked, setWelcomeAsked] = useState(() => loadWelcome() !== null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [said, setSaid] = useState('');

  const change = (patch: Partial<CoachProfile>, words: string) => {
    const next = { ...loadProfile(), ...patch };
    saveProfile(next);
    setProfile(next);
    setSaid(words);
  };

  const exportRun = (log: TutorialTimingLog, ext: 'json' | 'csv') => {
    download(
      exportName(log, ext),
      ext === 'json' ? toJson(log) : toCsv(log),
      ext === 'json' ? 'application/json' : 'text/csv',
    );
    setSaid(`Exported ${ext.toUpperCase()} for the run of ${when(log)}.`);
  };

  const deleteRun = (log: TutorialTimingLog) => {
    const rest = store.load().filter((r) => r.runId !== log.runId);
    store.save(rest);
    setRuns(rest);
    setConfirming(null);
    setSaid(`Deleted the run of ${when(log)}.`);
  };

  return (
    <main className="page settings" id="main">
      <h1>Settings</h1>
      <p className="lede">
        Stored in this browser only. Changes apply at once and to the next game you start.
      </p>
      <OfflineLine />

      <section aria-labelledby="set-coach">
        <h2 id="set-coach">Coach</h2>
        <p className="subtle">
          The coach never speaks, opens or takes focus unless you ask. These are the things you can
          switch on.
        </p>
        <div className="set-row">
          <label htmlFor="set-verbosity">Coach verbosity</label>
          <select
            id="set-verbosity"
            value={profile.verbosity}
            onChange={(e) =>
              change(
                { verbosity: e.target.value as Verbosity },
                `Coach verbosity: ${e.target.value}.`,
              )
            }
          >
            {VERBOSITY.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="set-row">
          <label htmlFor="set-detector">Lethal detector</label>
          <select
            id="set-detector"
            value={profile.alwaysOn}
            onChange={(e) => {
              const v = Number(e.target.value) as AlwaysOn;
              change({ alwaysOn: v }, `Lethal detector: ${DETECTOR[v]!.label}.`);
            }}
          >
            {DETECTOR.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Check
          id="set-blunder"
          checked={profile.blunder}
          label="Blunder warning"
          hint="Before you commit a clear mistake, such as giving up a lethal turn, the commit control asks you to confirm. Off by default."
          onChange={(c) => change({ blunder: c }, `Blunder warning: ${c ? 'on' : 'off'}.`)}
        />
        <Check
          id="set-donmath"
          checked={profile.donMath}
          label="DON!! math on the board"
          hint="Small “+4000 to stop” tags on legal targets while you give DON!! or pick an attacker."
          onChange={(c) => change({ donMath: c }, `DON!! math on the board: ${c ? 'on' : 'off'}.`)}
        />
        <Check
          id="set-alerts"
          checked={profile.alerts}
          label="Threat alerts"
          hint="A badge and a polite line when their board threatens lethal on their turn."
          onChange={(c) => change({ alerts: c }, `Threat alerts: ${c ? 'on' : 'off'}.`)}
        />
        <h3 id="set-muted">Warnings you muted</h3>
        {profile.muted.length === 0 ? (
          <p className="subtle">None. “Don’t warn me about this” on a warning adds it here.</p>
        ) : (
          <ul className="set-list" aria-labelledby="set-muted">
            {profile.muted.map((k) => (
              <li key={k}>
                <span>{KIND_WORDS[k] ?? k}</span>
                <button
                  type="button"
                  className="btn small"
                  onClick={() =>
                    change(
                      { muted: profile.muted.filter((m) => m !== k) },
                      `Warnings about ${KIND_WORDS[k] ?? k} are back on.`,
                    )
                  }
                >
                  Warn me again<span className="sr-only"> about {KIND_WORDS[k] ?? k}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p>
          <button
            type="button"
            className="btn small"
            onClick={() => {
              const fresh = { ...DEFAULT_PROFILE, muted: [] };
              saveProfile(fresh);
              setProfile(fresh);
              setSaid('Coach settings are back to their defaults.');
            }}
          >
            Reset the coach to its defaults
          </button>
        </p>
      </section>

      <section aria-labelledby="set-timing">
        <h2 id="set-timing">Tutorial timing</h2>
        <p className="subtle">
          The tutorial keeps the time you spent on each step, on this device only, for the last 20
          runs. Nothing is sent anywhere. Export a run to share it by hand.
        </p>
        {runs.length === 0 ? (
          <p>No tutorial runs are stored.</p>
        ) : (
          <ul className="set-list" aria-label="Tutorial runs">
            {[...runs].reverse().map((r) => {
              const done = r.steps.filter((s) => s.completedMs !== null).length;
              return (
                <li key={r.runId}>
                  <span>
                    {when(r)}: {done} of {r.steps.length} steps, {minutesWords(r.totalActiveMs)}{' '}
                    active{r.completedMs === null ? ', not finished' : ''}
                  </span>
                  <span className="set-btns">
                    <button
                      type="button"
                      className="btn small"
                      onClick={() => exportRun(r, 'json')}
                    >
                      Export JSON<span className="sr-only"> for {when(r)}</span>
                    </button>
                    <button type="button" className="btn small" onClick={() => exportRun(r, 'csv')}>
                      Export CSV<span className="sr-only"> for {when(r)}</span>
                    </button>
                    {confirming === r.runId ? (
                      <>
                        <button type="button" className="btn small" onClick={() => deleteRun(r)}>
                          Delete for good<span className="sr-only">: {when(r)}</span>
                        </button>
                        <button
                          type="button"
                          className="btn small"
                          onClick={() => setConfirming(null)}
                        >
                          Keep it
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => setConfirming(r.runId)}
                      >
                        Delete<span className="sr-only"> the run of {when(r)}</span>
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <DataSection say={setSaid} onChanged={() => setRuns(timingStore().load())} />

      <section aria-labelledby="set-welcome">
        <h2 id="set-welcome">Welcome</h2>
        <p>
          <button
            type="button"
            className="btn"
            aria-disabled={!welcomeAsked || undefined}
            onClick={() => {
              if (!welcomeAsked) return;
              clearWelcome();
              setWelcomeAsked(false);
              setSaid('The welcome question will show on the home page again.');
            }}
          >
            Show the welcome question
          </button>
        </p>
        {!welcomeAsked && (
          <p className="subtle">It will show on the home page the next time you open it.</p>
        )}
      </section>

      <section aria-labelledby="set-about">
        <h2 id="set-about">About</h2>
        <p>
          <Link to="/about">About OPTCG Sim: version, credits, licences and privacy</Link>
        </p>
      </section>

      <p className="sr-only" role="status" aria-live="polite" data-testid="settings-status">
        {said}
      </p>
    </main>
  );
}

function Check({
  id,
  checked,
  label,
  hint,
  onChange,
}: {
  id: string;
  checked: boolean;
  label: string;
  hint: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="set-row set-check">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        aria-describedby={`${id}-hint`}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div>
        <label htmlFor={id}>{label}</label>
        <p className="subtle" id={`${id}-hint`}>
          {hint}
        </p>
      </div>
    </div>
  );
}
