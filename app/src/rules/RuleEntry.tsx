/**
 * `/rules/<id>` (M9 WP5): one rule. `item/17` is a digest item, `RL-18` a ruling (question, answer,
 * confidence, sources) and `cr/7-1-4-1` a Comprehensive Rules number, which lists the entries that
 * cite it. Every page says where it comes from and how sure it is; "Show me" opens the demo.
 */
import { useEffect, useState } from 'react';
import { Link, useSearch } from '../router.tsx';
import { DEMOS } from './demos/index.ts';
import {
  demosFor,
  linkTerms,
  loadRules,
  resolveRule,
  type GlossaryTerm,
  type RulesData,
} from './index.ts';
import { rulePath } from './RuleLink.tsx';
import type { RuleDemo, RuleEntry } from './types.ts';
import { ruleIdOf } from '../routes/m9.ts';
import { LESSONS } from '../learn/lessons.ts';
import './rules.css';

/** The rules data, loaded once in its lazy chunk. */
export function useRules(): { data: RulesData | null; error: string | null } {
  const [state, setState] = useState<{ data: RulesData | null; error: string | null }>({
    data: null,
    error: null,
  });
  useEffect(() => {
    let live = true;
    loadRules().then(
      (data) => live && setState({ data, error: null }),
      (e: unknown) =>
        live && setState({ data: null, error: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      live = false;
    };
  }, []);
  return state;
}

const LIST_LINE = /^(?:[-•]\s+|\d+\.\s+)/;

/** A paragraph with its glossary terms linked to the search. */
function Linked({ text, glossary }: { text: string; glossary: readonly GlossaryTerm[] }) {
  return (
    <>
      {linkTerms(text, glossary).map((p, i) =>
        typeof p === 'string' ? (
          p
        ) : (
          <Link key={i} to={`/rules?q=${encodeURIComponent(p.term)}`} className="term">
            {p.text}
          </Link>
        ),
      )}
    </>
  );
}

/** An entry's text as paragraphs and lists, in our words. */
export function RuleText({ text, glossary }: { text: string; glossary: readonly GlossaryTerm[] }) {
  const blocks: ({ p: string } | { items: string[]; ordered: boolean })[] = [];
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    if (LIST_LINE.test(line)) {
      const last = blocks[blocks.length - 1];
      const ordered = /^\d/.test(line);
      const item = line.replace(LIST_LINE, '');
      if (last && 'items' in last && last.ordered === ordered) last.items.push(item);
      else blocks.push({ items: [item], ordered });
    } else blocks.push({ p: line });
  }
  return (
    <>
      {blocks.map((b, i) =>
        'p' in b ? (
          <p key={i}>
            <Linked text={b.p} glossary={glossary} />
          </p>
        ) : b.ordered ? (
          <ol key={i}>
            {b.items.map((t, j) => (
              <li key={j}>
                <Linked text={t} glossary={glossary} />
              </li>
            ))}
          </ol>
        ) : (
          <ul key={i}>
            {b.items.map((t, j) => (
              <li key={j}>
                <Linked text={t} glossary={glossary} />
              </li>
            ))}
          </ul>
        ),
      )}
    </>
  );
}

const CONFIDENCE_WORDS: Record<NonNullable<RuleEntry['confidence']>, string> = {
  'official explicit': 'A rule or an official Q&A answers this exact question.',
  'official by inference':
    'No source answers this directly, but the rules and similar official rulings decide it with no competing reading.',
  unresolved:
    'Official sources are silent or disagree here. The answer given is our best reading and is marked as one.',
};

export const crLabel = (cr: string): string =>
  cr.startsWith('item/') ? `item ${cr.slice(5)}` : `CR ${cr}`;
export const crHref = (cr: string): string =>
  cr.startsWith('item/') ? `/rules/${cr}` : rulePath(cr);

/** Where an entry's rule numbers lead: the Comprehensive Rules page, or another digest item. */
function Cites({ cr }: { cr: string[] }) {
  if (cr.length === 0) return null;
  return (
    <p className="rule-cites">
      <b>Rule numbers:</b>{' '}
      {cr.map((c, i) => (
        <span key={c}>
          {i > 0 && ', '}
          <Link to={crHref(c)}>{crLabel(c)}</Link>
        </span>
      ))}
    </p>
  );
}

export const entryLabel = (e: RuleEntry): string =>
  e.kind === 'ruling' ? e.id : `Item ${e.id.slice(5)}`;

/** Entries that cite one of the same rule numbers, most overlap first. */
function related(data: RulesData, entry: RuleEntry, max = 5): RuleEntry[] {
  return data.entries
    .filter((e) => e !== entry)
    .map((e) => ({ e, n: e.cr.filter((c) => entry.cr.includes(c)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, max)
    .map((x) => x.e);
}

export const lessonOfDemo = (d: RuleDemo) => LESSONS.find((l) => l.code === d.lesson);

function ShowMeLink({ demos, back }: { demos: RuleDemo[]; back: string }) {
  const from = new URLSearchParams(useSearch()).get('from');
  // Esc on the demo's board comes back here with focus on "Show me" (flows G2).
  useEffect(() => {
    if (from === 'show') document.getElementById('rule-show-link')?.focus();
  }, [from]);
  if (demos.length === 0) return null;
  return (
    <div className="rule-show">
      {demos.map((d, i) => (
        <p key={d.id}>
          <Link
            id={i === 0 ? 'rule-show-link' : undefined}
            to={`/rules/${d.id}/show?back=${encodeURIComponent(back)}`}
            className="btn primary"
          >
            Show me<span className="sr-only">: {d.title}</span>
          </Link>{' '}
          <span className="subtle">{d.goal}</span>
        </p>
      ))}
    </div>
  );
}

/** One entry's page. Exported for the tests, which feed it parsed data. */
export function EntryView({ data, entry }: { data: RulesData; entry: RuleEntry }) {
  const demos = demosFor(entry);
  const rel = related(data, entry);
  const ruling = entry.kind === 'ruling';
  return (
    <article className="rule-entry">
      <p className="subtle rule-kicker">
        {ruling ? `Ruling ${entry.id}` : `Digest item ${entry.id.slice(5)} of 137`} ·{' '}
        {entry.section}
      </p>
      <h1 id="page-title" tabIndex={-1}>
        {entry.title}
      </h1>
      {entry.question && (
        <section aria-labelledby="rule-q">
          <h2 id="rule-q">The question</h2>
          <p>{entry.question}</p>
        </section>
      )}
      <section aria-labelledby="rule-a">
        <h2 id="rule-a">{ruling ? 'The answer' : 'The rule'}</h2>
        <RuleText text={entry.text} glossary={data.glossary} />
      </section>
      <ShowMeLink demos={demos} back={entry.id} />
      {entry.confidence && (
        <section aria-labelledby="rule-c">
          <h2 id="rule-c">How sure we are</h2>
          <p>
            <b>{entry.confidence[0]!.toUpperCase() + entry.confidence.slice(1)}.</b>{' '}
            {CONFIDENCE_WORDS[entry.confidence]}
          </p>
          {entry.confidenceNote && <p className="subtle">{entry.confidenceNote}</p>}
        </section>
      )}
      <section aria-labelledby="rule-s">
        <h2 id="rule-s">Where it comes from</h2>
        {entry.sources.length > 0 ? (
          <ul>
            {entry.sources.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : (
          <p>
            The Comprehensive Rules {data.crVersion && `v${data.crVersion} `}and their general
            Q&amp;A, read into our digest as of {data.asOf.digest}.
          </p>
        )}
        <Cites cr={entry.cr} />
      </section>
      {rel.length > 0 && (
        <section aria-labelledby="rule-r">
          <h2 id="rule-r">Related</h2>
          <ul>
            {rel.map((e) => (
              <li key={e.id}>
                <Link to={`/rules/${e.id}`}>{e.title}</Link>{' '}
                <span className="subtle">({entryLabel(e)})</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

/** A Comprehensive Rules number: the entries that cite it. */
export function CrView({
  resolved,
}: {
  resolved: Extract<ReturnType<typeof resolveRule>, { kind: 'cr' }>;
}) {
  const demos = DEMOS.filter(
    (d) => d.rules.includes(resolved.cr) || d.rules.includes(resolved.matched),
  );
  return (
    <article className="rule-entry">
      <p className="subtle rule-kicker">Comprehensive Rules number</p>
      <h1 id="page-title" tabIndex={-1}>
        CR {resolved.cr}
      </h1>
      {resolved.via === 'under' && (
        <p>No entry cites CR {resolved.cr} itself. These cite rules inside it.</p>
      )}
      {resolved.via === 'parent' && (
        <p>
          No entry cites CR {resolved.cr} on its own, so here is where its parent rule, CR{' '}
          {resolved.matched}, is covered.
        </p>
      )}
      {resolved.via === 'exact' && (
        <p>
          {resolved.entries.length === 1
            ? 'One entry cites'
            : `${resolved.entries.length} entries cite`}{' '}
          this rule number.
        </p>
      )}
      <ul className="rule-hits">
        {resolved.entries.map((e) => (
          <li key={e.id}>
            <Link to={`/rules/${e.id}`}>{e.title}</Link>{' '}
            <span className="subtle">({entryLabel(e)})</span>
          </li>
        ))}
      </ul>
      <ShowMeLink demos={demos} back={`cr/${resolved.cr}`} />
    </article>
  );
}

/** What `/rules/<id>` shows once the data is loaded: the entry, the CR number's entries, or "not found". */
export function RuleBody({ data, id }: { data: RulesData; id: string }) {
  const resolved = resolveRule(data, id);
  if (resolved?.kind === 'entry') return <EntryView data={data} entry={resolved.entry} />;
  if (resolved?.kind === 'cr') return <CrView resolved={resolved} />;
  return (
    <>
      <h1 id="page-title" tabIndex={-1}>
        Rule not found
      </h1>
      <p>
        There is nothing for “{id}” in the rules reference. Rule numbers look like{' '}
        <Link to={rulePath('7-1-4-1')}>CR 7-1-4-1</Link>, <Link to="/rules/RL-18">RL-18</Link> or{' '}
        <Link to="/rules/item/17">item 17</Link>; <Link to="/rules">search the reference</Link> to
        find one.
      </p>
    </>
  );
}

export const titleOfRule = (data: RulesData, id: string): string => {
  const r = resolveRule(data, id);
  return r?.kind === 'entry' ? r.entry.title : r?.kind === 'cr' ? `CR ${r.cr}` : 'Rule not found';
};

export default function RuleEntryRoute({ path }: { path: string }) {
  const id = ruleIdOf(path);
  const { data, error } = useRules();
  const title = data ? titleOfRule(data, id) : 'Rule';
  useEffect(() => {
    document.title = `${title} · Rules · OPTCG Sim`;
    // The heading takes focus on route change (accessibility §3.1), unless the page is giving it
    // to "Show me" after the demo.
    if (data && new URLSearchParams(window.location.search).get('from') !== 'show')
      document.getElementById('page-title')?.focus();
  }, [title, data]);
  return (
    <main className="page rules" id="main" aria-busy={!data && !error} data-path={path}>
      <p className="subtle">
        <Link to="/rules">← Rules reference</Link>
      </p>
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
          Loading the rule…
        </h1>
      )}
      {data && <RuleBody data={data} id={id} />}
    </main>
  );
}
