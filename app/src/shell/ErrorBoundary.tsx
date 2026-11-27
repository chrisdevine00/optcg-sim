/**
 * M10 WP6: the error boundary. App.tsx mounts one around the shell and one around every route; a
 * page that throws while rendering shows the failure page in its place while the header, footer and
 * the saved data are untouched (this file never imports the store). A route change resets it, so
 * leaving a broken page by the header's links works.
 *
 * Two failure pages: the general one ("Something went wrong on this page": Reload, Go home, Copy
 * details) and, for a lazy chunk that an update removed (`ChunkError.ts`), "The app was updated" with
 * one Reload. The details text holds the release, build id, route and the error's name and first
 * line: no stack, no store data.
 */
import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { loadVersion, type VersionInfo } from '../about/version.ts';
import { usePath } from '../router.tsx';
import '../styles/about.css';
import { isChunkError } from './ChunkError.ts';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Which part of the app this boundary guards ("shell" or a route name); shown in the details. */
  scope?: string;
}

/** What "Copy details" puts on the clipboard. The message is cut at its first line and 300 characters. */
export function detailsText(d: {
  version: VersionInfo | null;
  route: string;
  scope: string;
  error: Error;
}): string {
  const first = (d.error.message.split('\n')[0] ?? '').slice(0, 300);
  return [
    `OPTCG Sim ${d.version?.release || 'unknown release'} (build ${d.version?.build || 'unknown'})`,
    `Route: ${d.route}`,
    `Where: ${d.scope}`,
    `Error: ${d.error.name}: ${first}`,
  ].join('\n');
}

const toError = (e: unknown): Error =>
  e instanceof Error ? e : new Error(typeof e === 'string' ? e : 'Unknown error');

interface State {
  error: Error | null;
  /** The route the state belongs to: a different one clears the error. */
  key: string;
}

export class Boundary extends Component<ErrorBoundaryProps & { resetKey: string }, State> {
  override state: State = { error: null, key: this.props.resetKey };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error: toError(error) };
  }

  static getDerivedStateFromProps(
    props: { resetKey: string },
    state: State,
  ): Partial<State> | null {
    return props.resetKey === state.key ? null : { error: null, key: props.resetKey };
  }

  override componentDidCatch(error: unknown): void {
    // Once per failure; React reports the component stack itself in development.
    console.error(`[optcg] ${this.props.scope ?? 'app'} failed to render:`, error);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return <Failure error={error} route={this.props.resetKey} scope={this.props.scope ?? 'app'} />;
  }
}

/** The boundary as App mounts it: it learns the route so a route change resets it. */
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <Boundary {...props} resetKey={usePath()} />;
}

export function Failure({ error, route, scope }: { error: Error; route: string; scope: string }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const chunk = isChunkError(error);
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [said, setSaid] = useState('');
  const [manual, setManual] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.title = (chunk ? 'The app was updated' : 'Something went wrong') + ' - OPTCG Sim';
    heading.current?.focus();
    let live = true;
    // Loaded now, so the Copy button can write at once, inside the click (Safari insists on that).
    void loadVersion().then((v) => {
      if (live) setVersion(v);
    });
    return () => {
      live = false;
    };
  }, [chunk]);

  const text = detailsText({ version, route, scope, error });
  const copy = () => {
    const clip = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
    const fallback = () => {
      setManual(true);
      setSaid('Select the details below and copy them.');
      setTimeout(() => area.current?.select(), 0);
    };
    if (!clip) return fallback();
    clip.writeText(text).then(() => setSaid('Details copied.'), fallback);
  };

  if (chunk) {
    return (
      <main className="page failure" id="main" aria-labelledby="page-title">
        <h1 id="page-title" tabIndex={-1} ref={heading}>
          The app was updated
        </h1>
        <p>Reload to get the new version.</p>
        <p className="failure-actions">
          <button type="button" className="btn primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </p>
      </main>
    );
  }
  return (
    <main className="page failure" id="main" aria-labelledby="page-title">
      <h1 id="page-title" tabIndex={-1} ref={heading}>
        Something went wrong on this page
      </h1>
      <p>Your saved games and decks are not affected.</p>
      <p className="failure-actions">
        <button type="button" className="btn primary" onClick={() => window.location.reload()}>
          Reload
        </button>
        <a className="btn" href={import.meta.env.BASE_URL}>
          Go home
        </a>
        <button type="button" className="btn" onClick={copy}>
          Copy details
        </button>
      </p>
      {manual && (
        <>
          <label htmlFor="failure-details" className="subtle">
            Details to send with a report
          </label>
          <textarea
            id="failure-details"
            className="failure-details"
            ref={area}
            readOnly
            value={text}
          />
        </>
      )}
      <p className="sr-only" role="status" aria-live="polite" data-testid="failure-status">
        {said}
      </p>
      {said && (
        <p className="subtle" aria-hidden="true">
          {said}
        </p>
      )}
    </main>
  );
}
