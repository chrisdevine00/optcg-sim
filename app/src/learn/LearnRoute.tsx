/**
 * `/learn`, the course hub (M9 WP6; learning-ui §8.1): 27 lessons in four stages, the continue card
 * (the next unfinished lesson, or the Progress page's "Work on" lesson when that differs, with its
 * reason in numbers), each lesson a row that is a link, its status in words and shape, and the drill it
 * has. The guided tutorial is Stage 1's first row. Everything is untimed; nothing here gates anything.
 */
import { useEffect, useMemo, useState } from 'react';
import { DRILL_NAMES } from '../drills/types.ts';
import { lessonInfo, type LessonInfo, type LessonStatus } from '../progress/derive.ts';
import { nextUnfinished, recommend } from '../progress/recommend.ts';
import { useProgressData } from '../progress/useProgressData.ts';
import { Link } from '../router.tsx';
import { LESSONS, type Lesson } from './lessons.ts';
import { StatusChip } from './StatusChip.tsx';
import './learn.css';

/** What a row says about how the lesson is practised and passed. */
export function drillWords(info: LessonInfo): string {
  const r = info.rule;
  if (r.kind === 'drill') {
    const name = DRILL_NAMES[r.drill];
    return info.best ? `${name}: best ${info.best.correct} of ${info.best.n}` : name;
  }
  if (r.kind === 'tutorial') return 'Guided tutorial';
  if (r.kind === 'games') return 'Games against Rookie';
  return 'Lesson only: no drill yet';
}

export const stagesOf = (
  lessons: readonly Lesson[] = LESSONS,
): { name: string; lessons: Lesson[] }[] => {
  const out: { name: string; lessons: Lesson[] }[] = [];
  for (const l of lessons) {
    const last = out.at(-1);
    if (last && last.name === l.stage) last.lessons.push(l);
    else out.push({ name: l.stage, lessons: [l] });
  }
  return out;
};

export default function LearnRoute({ path }: { path: string }) {
  const data = useProgressData();
  const [today] = useState(() => Date.now());
  const stages = useMemo(() => stagesOf(), []);
  useEffect(() => {
    document.title = 'Learn · OPTCG Sim';
    document.getElementById('page-title')?.focus();
  }, []);

  const rec = useMemo(
    () => recommend({ ...data.input, lethal: data.lethal }, today),
    [data.input, data.lethal, today],
  );
  const next = useMemo(() => nextUnfinished(data.input)[0], [data.input]);
  const credited = data.input.credit !== null;

  return (
    <main
      className="page learn-hub"
      id="main"
      aria-labelledby="page-title"
      data-path={path}
      aria-busy={!data.ready || undefined}
    >
      <h1 id="page-title" tabIndex={-1}>
        Learn
      </h1>
      <p>
        {LESSONS.length} lessons in {stages.length} stages. Untimed; leave and come back any time.
      </p>
      <p className="subtle">
        <Link to="/drills">Drills</Link> · <Link to="/rules">Rules reference</Link> ·{' '}
        <Link to="/progress">Your progress</Link>
      </p>

      {!data.ready ? (
        <p role="status">Loading your progress…</p>
      ) : (
        <>
          <section className="lh-continue" aria-labelledby="lh-continue">
            {rec.kind === 'flags' && rec.lesson !== next?.code ? (
              <>
                <h2 id="lh-continue">Work on: {rec.title}</h2>
                <p>{rec.reason}</p>
                <p>
                  <Link className="btn primary" to={`/learn/${rec.lessonId}`}>
                    Start lesson {rec.lesson}
                  </Link>
                </p>
              </>
            ) : next ? (
              <>
                <h2 id="lh-continue">
                  Continue: {next.code} {next.title}
                </h2>
                <p>
                  {rec.kind === 'flags' && rec.lesson === next.code
                    ? rec.reason
                    : rec.kind === 'course'
                      ? rec.reason
                      : drillWords(lessonInfo(next.code, data.input))}
                </p>
                <p>
                  <Link className="btn primary" to={`/learn/${next.id}`}>
                    {lessonInfo(next.code, data.input).status === 'in-progress'
                      ? 'Continue lesson '
                      : 'Start lesson '}
                    {next.code}
                  </Link>
                </p>
              </>
            ) : (
              <>
                <h2 id="lh-continue">Every lesson is finished</h2>
                <p>Review your games on the Progress page to find what to sharpen next.</p>
              </>
            )}
          </section>

          {stages.map((st, i) => (
            <section key={st.name} aria-labelledby={`lh-stage-${i}`} className="lh-stage">
              <h2 id={`lh-stage-${i}`}>{st.name}</h2>
              <ul className="lh-list">
                {i === 0 && (
                  <li className="lh-row">
                    <Link className="lh-link" to="/tutorial">
                      <span className="lh-code">Tutorial</span>
                      <span className="lh-title">Guided tutorial: L01 to L07 on a real board</span>
                      <span className="sr-only">, </span>
                      <StatusChip
                        status={credited ? 'passed' : 'not-started'}
                        {...(credited ? { note: 'tutorial' } : {})}
                      />
                    </Link>
                  </li>
                )}
                {st.lessons.map((l) => (
                  <Row key={l.id} lesson={l} info={lessonInfo(l.code, data.input)} />
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </main>
  );
}

export function Row({ lesson, info }: { lesson: Lesson; info: LessonInfo }) {
  const status: LessonStatus = info.status;
  return (
    <li className="lh-row">
      <Link className="lh-link" to={`/learn/${lesson.id}`}>
        <span className="lh-code">{lesson.code}</span>
        <span className="sr-only">, </span>
        <span className="lh-title">{lesson.title}</span>
        <span className="sr-only">, </span>
        <StatusChip status={status} />
        <span className="sr-only">, </span>
        <span className="lh-drill subtle">{drillWords(info)}</span>
      </Link>
    </li>
  );
}
