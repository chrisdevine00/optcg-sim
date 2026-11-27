/**
 * About (M10 WP6): what the app is, the unofficial notice, the build's version line, credits, the
 * third-party licences file, the privacy statement and how to report a problem. One `<main>`, one
 * `<h1>` that takes focus on route change. The page reads `version.json` once, lazily (no store).
 */
import { useEffect, useState } from 'react';
import { Link } from '../router.tsx';
import { staleness } from '../meta/stale.ts';
import { CREDITS, LICENCE_LINE, NOTICE, PRIVACY, REPORT_URL } from './credits.ts';
import { dayWords, loadVersion, type VersionInfo } from './version.ts';
import '../styles/about.css';

export default function AboutRoute() {
  // undefined: still loading; null: no version.json (dev server, or offline before the first load).
  const [version, setVersion] = useState<VersionInfo | null | undefined>(undefined);
  useEffect(() => {
    document.title = 'About · OPTCG Sim';
    document.getElementById('page-title')?.focus();
    let live = true;
    void loadVersion().then((v) => {
      if (live) setVersion(v);
    });
    return () => {
      live = false;
    };
  }, []);
  return <AboutView version={version} today={new Date()} />;
}

/** The page's content for a given version and date: a pure function of its props (tested without a DOM). */
export function AboutView({
  version,
  today,
}: {
  version: VersionInfo | null | undefined;
  today: Date;
}) {
  const base = import.meta.env.BASE_URL;
  const lists = version?.metaAsOf ? staleness([{ date: version.metaAsOf }], today) : null;
  return (
    <main className="page about" id="main" aria-labelledby="page-title">
      <h1 id="page-title" tabIndex={-1}>
        About
      </h1>

      <section aria-labelledby="about-what">
        <h2 id="about-what">About</h2>
        <p>
          OPTCG Sim is a practice simulator for the One Piece Card Game and a strategy teacher. Play
          full games against an AI that runs real tournament decks, learn from a coach and a
          post-game review, practise with drills, and build decks. It runs in your browser.
        </p>
        <p className="subtle">{LICENCE_LINE}.</p>
      </section>

      <section aria-labelledby="about-notice">
        <h2 id="about-notice">Unofficial notice</h2>
        <p data-testid="about-notice">{NOTICE}</p>
      </section>

      <section aria-labelledby="about-version">
        <h2 id="about-version">Version</h2>
        {version === undefined ? (
          <p role="status">Reading the version…</p>
        ) : version === null ? (
          <p>Version details could not be loaded. They need a connection the first time.</p>
        ) : (
          <>
            <dl className="about-facts" data-testid="about-version">
              <div>
                <dt>Release</dt>
                <dd>{version.release || 'not set'}</dd>
              </div>
              <div>
                <dt>Build</dt>
                <dd>{version.build}</dd>
              </div>
              <div>
                <dt>Built</dt>
                <dd>{dayWords(version.builtAt)}</dd>
              </div>
              <div>
                <dt>Cards through</dt>
                <dd>
                  {version.cardsThrough}, {version.cardCount.toLocaleString('en-GB')} cards
                </dd>
              </div>
              <div>
                <dt>Tournament lists as of</dt>
                <dd>{dayWords(version.metaAsOf)}</dd>
              </div>
              <div>
                <dt>Rules engine</dt>
                <dd>{version.engine}</dd>
              </div>
            </dl>
            {lists?.stale && (
              <p className="about-warn" data-testid="about-stale">
                <strong>Out of date.</strong> The tournament lists are out of date: they were last
                updated on {dayWords(version.metaAsOf)}.
              </p>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="about-credits">
        <h2 id="about-credits">Credits</h2>
        <p>
          This app stands on other people’s work. Each source is named with what it gives us and the
          terms we have on record for it.
        </p>
        <dl className="about-credits">
          {CREDITS.map((c) => (
            <div key={c.id}>
              <dt>
                <a href={c.url} target="_blank" rel="noopener noreferrer">
                  {c.name}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </dt>
              <dd>
                {c.role} <span className="subtle">{c.terms}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="about-licences">
        <h2 id="about-licences">Third-party licences</h2>
        <p>
          The software this app ships is open source. Every package’s licence is listed in{' '}
          <a href={`${base}third-party.txt`} target="_blank" rel="noopener noreferrer">
            third-party.txt<span className="sr-only"> (plain text, opens in a new tab)</span>
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="about-data">
        <h2 id="about-data">Your data</h2>
        <ul>
          {PRIVACY.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p>
          To remove everything, use <Link to="/settings">Settings</Link>, then the Data section.
        </p>
      </section>

      <section aria-labelledby="about-report">
        <h2 id="about-report">Report a problem</h2>
        <p>
          <a href={REPORT_URL} target="_blank" rel="noopener noreferrer">
            Open an issue on GitHub<span className="sr-only"> (opens in a new tab)</span>
          </a>{' '}
          and include the version details above. If something broke on a page, its error page has a
          “Copy details” button that gathers them; it never includes your games or decks.
        </p>
      </section>
    </main>
  );
}
