/**
 * `/learn/:lessonId` (M8 WP6, grown in M9 WP6; learning-ui §8.2): one page per lesson, opened from the
 * hub, from an explanation's "Lesson:" link or from the Progress "Work on" card. In order: the header
 * with the status, the idea, the worked example(s) as real `Explanation`s at Learner verbosity, "Show
 * me" where a rules demo names the lesson (L01 to L07, L25 to L27), Practise (the drill, the exit
 * criterion, the best result; or how a lesson without a drill is passed, with "Mark as read"), and the
 * rules and sources the lesson cites. Everything is untimed.
 */
import { useEffect, useState } from 'react';
import { ExplanationView } from '../play/coach/ExplanationView.tsx';
import { DRILL_NAMES } from '../drills/types.ts';
import { resolveTag } from '../meta/guides.ts';
import { lessonInfo, type LessonInfo } from '../progress/derive.ts';
import { ruleWords } from '../progress/exit.ts';
import { appProgress } from '../progress/store.ts';
import { useProgressData } from '../progress/useProgressData.ts';
import { DEMOS } from '../rules/demos/index.ts';
import { linkTerms, resolveRule, type GlossaryTerm, type RulesData } from '../rules/index.ts';
import { useRules } from '../rules/RuleEntry.tsx';
import { RuleLink } from '../rules/RuleLink.tsx';
import { Link } from '../router.tsx';
import { examplesFor } from './examples.ts';
import { LESSONS, lessonById, type Lesson } from './lessons.ts';
import { StatusChip } from './StatusChip.tsx';
import './learn.css';

/** The rule numbers a lesson's `Rules:` line cites. */
export interface RuleRefs {
  /** `7-1-4-1`: Comprehensive Rules numbers. */
  cr: string[];
  /** `RL-18` */
  rulings: string[];
  /** Digest items, as `item/34`. */
  items: string[];
}

export function ruleRefs(rules: string): RuleRefs {
  const cr = [...new Set([...rules.matchAll(/\b(\d+(?:-\d+)+)\b/g)].map((m) => m[1]!))];
  const rulings = [...new Set([...rules.matchAll(/\bRL-\d{2}\b/g)].map((m) => m[0]))];
  const items: string[] = [];
  for (const m of rules.matchAll(/\bitems?\s+(\d+)(?:\s*[–-]\s*(\d+))?/g)) {
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    for (let n = a; n <= Math.min(b, a + 4); n++)
      if (!items.includes(`item/${n}`)) items.push(`item/${n}`);
  }
  return { cr, rulings, items };
}

/** The lesson a path names: by id (`L10-counter-or-take`) or by code (`L10`). */
export const lessonOfPath = (path: string): Lesson | undefined => {
  const id = decodeURIComponent(path.slice('/learn/'.length));
  return lessonById(id) ?? LESSONS.find((l) => l.code === id);
};

/** Demos whose `lesson` names this one, by code or by id. */
export const demosForLesson = (l: Lesson) =>
  DEMOS.filter((d) => d.lesson === l.code || d.lesson === l.id);

/** The idea, with the first mention of a few glossary terms linked to the reference. */
function Idea({ text, glossary }: { text: string; glossary: readonly GlossaryTerm[] }) {
  return (
    <p>
      {linkTerms(text, glossary, 6).map((p, i) =>
        typeof p === 'string' ? (
          p
        ) : (
          <Link key={i} to={`/rules?q=${encodeURIComponent(p.term)}`} className="term">
            {p.text}
          </Link>
        ),
      )}
    </p>
  );
}

function Practise({
  lesson,
  info,
  onMarkRead,
  onUnmarkRead,
  busy,
}: {
  lesson: Lesson;
  info: LessonInfo;
  onMarkRead: () => void;
  onUnmarkRead: () => void;
  busy: boolean;
}) {
  const r = info.rule;
  return (
    <section aria-labelledby="lesson-drill">
      <h2 id="lesson-drill">Practise</h2>
      {r.kind === 'drill' && (
        <>
          <p>
            <Link className="btn primary" to={`/drills/${r.drill}`}>
              Practise: {DRILL_NAMES[r.drill]}
            </Link>
          </p>
          <p>{lesson.drill}</p>
          <p>
            <b>Pass (untimed):</b> {lesson.exit}
          </p>
          <p>
            <b>In numbers:</b> {ruleWords(r)}.{' '}
            {info.best
              ? `Your best so far: ${info.best.correct} of ${info.best.n}.`
              : 'No drill sessions yet.'}
          </p>
        </>
      )}
      {r.kind === 'tutorial' && (
        <>
          <p>{lesson.drill}</p>
          <p>
            <b>How it is passed:</b> finishing the guided tutorial credits lessons L01 to L07.{' '}
            <Link to="/tutorial">Open the tutorial</Link>
          </p>
          <p>
            <b>Pass (untimed):</b> {lesson.exit}
          </p>
        </>
      )}
      {r.kind === 'games' && (
        <>
          <p>{lesson.drill}</p>
          <p>
            <b>Pass (untimed):</b> {lesson.exit}
          </p>
          <p>
            {info.detail}. <Link to="/play">Start a game</Link>
          </p>
        </>
      )}
      {r.kind === 'none' && (
        <>
          <p>
            <b>Lesson only: no drill yet.</b> The practice planned for this lesson is below; it is
            not built, so this lesson is marked read, not passed.
          </p>
          <p className="subtle">Planned: {lesson.drill}</p>
          <p className="subtle">Planned exit: {lesson.exit}</p>
          <p>
            {info.status === 'read' ? (
              <button type="button" className="btn" disabled={busy} onClick={onUnmarkRead}>
                Marked as read: undo
              </button>
            ) : (
              <button type="button" className="btn" disabled={busy} onClick={onMarkRead}>
                Mark as read
              </button>
            )}
          </p>
        </>
      )}
      {lesson.exitTimed && (
        <p className="subtle">
          <b>Optional, timed:</b> {lesson.exitTimed}
        </p>
      )}
    </section>
  );
}

function RulesAndSources({ lesson, rules }: { lesson: Lesson; rules: RulesData | null }) {
  const refs = ruleRefs(lesson.rules);
  const tags = [
    ...new Set([...lesson.concept.matchAll(/\[([A-Z][A-Z0-9-]+)\]/g)].map((m) => m[1]!)),
  ];
  // A reference is a link only when the reference has that entry; otherwise it is plain text.
  const known = (id: string) => rules !== null && resolveRule(rules, id) !== null;
  const cr = refs.cr.filter((c) => known(`cr/${c}`));
  const rulings = refs.rulings.filter((c) => known(c));
  const items = refs.items.filter((c) => known(c));
  const sources = tags.map((t) => resolveTag(t));
  if (!lesson.rules && sources.length === 0) return null;
  return (
    <section aria-labelledby="lesson-rules">
      <h2 id="lesson-rules">Rules and sources</h2>
      {lesson.rules && <p>Cited: {lesson.rules}</p>}
      {(cr.length > 0 || rulings.length > 0 || items.length > 0) && (
        <ul className="lesson-refs" aria-label="Open in the rules reference">
          {cr.map((c) => (
            <li key={c}>
              <RuleLink cr={c}>Rule: CR {c}</RuleLink>
            </li>
          ))}
          {rulings.map((id) => (
            <li key={id}>
              <Link to={`/rules/${id}`}>Ruling {id}</Link>
            </li>
          ))}
          {items.map((id) => (
            <li key={id}>
              <Link to={`/rules/${id}`}>Digest item {id.slice(5)}</Link>
            </li>
          ))}
        </ul>
      )}
      {sources.length > 0 && (
        <>
          <h3 className="lesson-h3">Sources</h3>
          <ul className="lesson-refs">
            {sources.map((s) => (
              <li key={s.tag}>
                [{s.tag}]{' '}
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  s.label
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export default function LessonRoute({ path }: { path: string }) {
  const lesson = lessonOfPath(path);
  const id = decodeURIComponent(path.slice('/learn/'.length));
  const data = useProgressData();
  const { data: rules } = useRules();
  const [said, setSaid] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    document.title = lesson ? `${lesson.code} ${lesson.title} · OPTCG Sim` : 'Lesson · OPTCG Sim';
    document.getElementById('page-title')?.focus();
  }, [lesson]);

  if (!lesson)
    return (
      <main className="page" id="main" aria-labelledby="page-title" data-path={path}>
        <h1 id="page-title" tabIndex={-1}>
          Lesson not found
        </h1>
        <p>
          There is no lesson “{id}”. <Link to="/learn">Back to Learn</Link>
        </p>
      </main>
    );

  const info = lessonInfo(lesson.code, data.input);
  const examples = examplesFor(lesson.code);
  const demos = demosForLesson(lesson);
  const mark = async (read: boolean) => {
    setBusy(true);
    try {
      const store = appProgress();
      if (read) await store.markRead(lesson.code);
      else await store.unmarkRead(lesson.code);
      data.reload();
      setSaid(read ? `${lesson.code} marked as read.` : `${lesson.code} is no longer marked read.`);
    } catch {
      setSaid('That could not be saved. Nothing was changed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page lesson" id="main" aria-labelledby="page-title" data-path={path}>
      <p className="subtle">
        <Link to="/learn">← Back to Learn</Link> · {lesson.stage}
      </p>
      <h1 id="page-title" tabIndex={-1}>
        {lesson.code} · {lesson.title}
      </h1>
      <p>
        {data.ready ? (
          <StatusChip status={info.status} />
        ) : (
          <span className="subtle">Checking your progress…</span>
        )}{' '}
        <span className="subtle">
          {data.ready && info.status === 'not-started' ? '' : info.detail}
        </span>
      </p>
      <p className="sr-only" role="status">
        {said}
      </p>

      <section aria-labelledby="lesson-idea">
        <h2 id="lesson-idea">The idea</h2>
        <Idea text={lesson.concept} glossary={rules?.glossary ?? []} />
      </section>

      {examples.length > 0 && (
        <section aria-labelledby="lesson-example">
          <h2 id="lesson-example">
            {examples.length === 1 ? 'Worked example' : 'Worked examples'}
          </h2>
          {examples.map((ex) => (
            <div className="lesson-example" key={ex.id}>
              <h3 className="lesson-h3">{ex.title}</h3>
              <p className="subtle">{ex.position}</p>
              <ExplanationView
                ex={ex.explanation}
                context={ex.explanation.conceptId === 'mulligan' ? 'guide' : 'review'}
                verbosity="learner"
                idPrefix={`lesson-${ex.id}`}
                evidenceLabel={`Why it works: ${ex.title}`}
                headingLevel={4}
              />
            </div>
          ))}
        </section>
      )}

      {demos.length > 0 && (
        <section aria-labelledby="lesson-show">
          <h2 id="lesson-show">Show me</h2>
          <p>See it happen on the real board, one step at a time.</p>
          <ul className="lesson-refs">
            {demos.map((d) => (
              <li key={d.id}>
                <Link to={`/rules/${d.id}/show`}>{d.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Practise
        lesson={lesson}
        info={info}
        busy={busy || !data.ready}
        onMarkRead={() => void mark(true)}
        onUnmarkRead={() => void mark(false)}
      />
      <RulesAndSources lesson={lesson} rules={rules} />
    </main>
  );
}
