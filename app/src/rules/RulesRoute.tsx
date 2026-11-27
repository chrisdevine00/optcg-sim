/**
 * `/rules` (M9 WP5): the rules reference. A search box that is a `combobox` (a text input with a list of
 * results it controls, Up and Down to move through them, Enter to open one, a polite "N results"
 * status), the demos, and every entry by section. Typing a rule number (`7-1-4-1`, `RL-18`, `item 17`)
 * and pressing Enter jumps to it. The two research files are a lazy chunk (`loadRules`).
 */
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Link, navigate, useSearch } from '../router.tsx';
import { DEMOS } from './demos/index.ts';
import { demoEntryId, type RulesData } from './index.ts';
import { entryLabel, useRules } from './RuleEntry.tsx';
import { numberQuery, search } from './search.ts';
import type { RuleEntry } from './types.ts';
import './rules.css';

/** At most this many results are listed; the status says how many there were. */
export const MAX_SHOWN = 40;

/** One line of the status: what was found, in words a screen reader can say. */
export function statusLine(query: string, total: number, shown: number, all: number): string {
  const q = query.trim();
  if (q === '') return `${all} rules. Type a word or a rule number to search them.`;
  if (total === 0)
    return `No rules match “${q}”. Check the spelling, or try a rule number such as 7-1-4-1 or RL-18.`;
  const n = `${total} ${total === 1 ? 'result' : 'results'} for “${q}”`;
  return shown < total ? `${n}, the first ${shown} listed.` : `${n}.`;
}

/** Where Enter goes: the entry's page, or for a CR number its own page. */
export function openPath(query: string, hit: RuleEntry): string {
  const num = numberQuery(query);
  if (num?.cr && hit.cr.includes(num.cr)) return `/rules/cr/${num.cr}`;
  return `/rules/${hit.id}`;
}

const snippet = (e: RuleEntry): string => {
  const t = (e.question ?? e.text).replace(/\s+/g, ' ');
  return t.length > 150 ? t.slice(0, 147).replace(/\s+\S*$/, '') + '…' : t;
};

function Search({ data, initial }: { data: RulesData; initial: string }) {
  const [query, setQuery] = useState(initial);
  const [active, setActive] = useState(-1);
  const [said, setSaid] = useState('');
  const hits = useMemo(() => search(data.index, query), [data, query]);
  const shown = hits.slice(0, MAX_SHOWN);
  const line = statusLine(query, hits.length, shown.length, data.entries.length);
  // The status is said once typing pauses, not on every key.
  useEffect(() => {
    const t = setTimeout(() => setSaid(line), 350);
    return () => clearTimeout(t);
  }, [line]);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && shown.length) {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, shown.length - 1));
    } else if (e.key === 'ArrowUp' && shown.length) {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      const hit = shown[active >= 0 ? active : numberQuery(query) ? 0 : -1];
      if (hit) {
        e.preventDefault();
        navigate(openPath(query, hit.entry));
      }
    } else if (e.key === 'Escape' && query) {
      e.preventDefault();
      setQuery('');
      setActive(-1);
    }
  };
  const change = (v: string) => {
    setQuery(v);
    setActive(-1);
    try {
      const url = new URL(window.location.href);
      if (v.trim()) url.searchParams.set('q', v);
      else url.searchParams.delete('q');
      window.history.replaceState(null, '', url);
    } catch {
      // The address bar is a convenience; the page works without it.
    }
  };
  const open = shown.length > 0;
  return (
    <section aria-labelledby="rules-search-h" className="rules-search">
      <h2 id="rules-search-h" className="sr-only">
        Search the rules
      </h2>
      <label htmlFor="rules-q" className="search-label">
        Search the rules
      </label>
      <input
        id="rules-q"
        className="input"
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls="rules-results"
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `rules-opt-${active}` : undefined}
        aria-describedby="rules-status"
        autoComplete="off"
        spellCheck={false}
        placeholder="A word or a rule number: tie, blocker, 7-1-4-1, RL-18"
        value={query}
        onChange={(e) => change(e.target.value)}
        onKeyDown={onKey}
      />
      <p id="rules-status" role="status" aria-live="polite" className="subtle">
        {said || line}
      </p>
      <ul id="rules-results" role="listbox" aria-label="Search results" hidden={!open}>
        {shown.map((h, i) => (
          <li
            key={h.entry.id}
            id={`rules-opt-${i}`}
            role="option"
            aria-selected={i === active}
            className="rules-opt"
            onClick={() => navigate(openPath(query, h.entry))}
          >
            <span className="rules-opt-title">{h.entry.title}</span>{' '}
            <span className="subtle">({entryLabel(h.entry)})</span>
            <span className="rules-opt-text">{snippet(h.entry)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The page: exported for the tests, which feed it parsed data. */
export function RulesView({ data, initial = '' }: { data: RulesData; initial?: string }) {
  const sections = useMemo(() => {
    const by = new Map<string, RuleEntry[]>();
    for (const e of data.entries) by.set(e.section, [...(by.get(e.section) ?? []), e]);
    return [...by.entries()];
  }, [data]);
  return (
    <>
      <h1 id="page-title" tabIndex={-1}>
        Rules reference
      </h1>
      <p className="rules-intro">
        The rules of the game in our own words, from the Comprehensive Rules{' '}
        {data.crVersion && `v${data.crVersion} `}and the official Q&amp;A, as of {data.asOf.digest}.
        Each entry says where it comes from and how sure we are. If this page and the official text
        differ, the official text wins.
      </p>
      <Search data={data} initial={initial} />
      <section aria-labelledby="rules-demos-h">
        <h2 id="rules-demos-h">Show me</h2>
        <p className="subtle">
          {DEMOS.length} short demos on a real board. Each one lets you do only the moves it
          teaches.
        </p>
        <ul className="rules-demos">
          {DEMOS.map((d) => (
            <li key={d.id}>
              <Link to={`/rules/${d.id}/show?back=${encodeURIComponent(demoEntryId(d))}`}>
                {d.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="rules-browse-h">
        <h2 id="rules-browse-h">Every rule, by section</h2>
        {sections.map(([name, list]) => (
          <details key={name} className="rules-section">
            <summary>
              {name} <span className="subtle">({list.length})</span>
            </summary>
            <ul>
              {list.map((e) => (
                <li key={e.id}>
                  <Link to={`/rules/${e.id}`}>{e.title}</Link>{' '}
                  <span className="subtle">({entryLabel(e)})</span>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </section>
    </>
  );
}

export default function RulesRoute({ path }: { path: string }) {
  const { data, error } = useRules();
  const q = new URLSearchParams(useSearch()).get('q') ?? '';
  useEffect(() => {
    document.title = 'Rules reference · OPTCG Sim';
    if (data) document.getElementById('page-title')?.focus();
  }, [data]);
  return (
    <main className="page rules" id="main" aria-busy={!data && !error} data-path={path}>
      {error && (
        <>
          <h1 id="page-title" tabIndex={-1}>
            The rules could not load
          </h1>
          <p role="alert">Nothing changed. {error}</p>
        </>
      )}
      {!data && !error && (
        <h1 id="page-title" tabIndex={-1}>
          Rules reference
        </h1>
      )}
      {/* A glossary link changes `?q=`: the key starts the search over with the new words. */}
      {data && <RulesView key={q} data={data} initial={q} />}
    </main>
  );
}
