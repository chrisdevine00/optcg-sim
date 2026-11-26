/**
 * `/learn/:lessonId` (M8 WP6): the minimal lesson page a review's "Lesson:" link opens. Title, the
 * idea, the drill, and how the lesson is passed, from the curriculum. The worked example, "Show me"
 * and the drill itself arrive with the Learn hub in M9.
 */
import { useEffect } from 'react';
import { Link } from '../router.tsx';
import { lessonById } from './lessons.ts';
import './learn.css';

export default function LessonRoute({ path }: { path: string }) {
  const id = decodeURIComponent(path.slice('/learn/'.length));
  const lesson = lessonById(id);
  useEffect(() => {
    document.title = lesson ? `${lesson.code} ${lesson.title} · OPTCG Sim` : 'Lesson · OPTCG Sim';
    document.getElementById('lesson-title')?.focus();
  }, [lesson]);
  if (!lesson)
    return (
      <main className="page" id="main">
        <h1 id="lesson-title" tabIndex={-1}>
          Lesson not found
        </h1>
        <p>
          There is no lesson “{id}”. <Link to="/reviews">Back to your reviews</Link>
        </p>
      </main>
    );
  return (
    <main className="page lesson" id="main" aria-labelledby="lesson-title">
      <p className="subtle">
        <Link to="/reviews">← Reviews</Link> · {lesson.stage}
      </p>
      <h1 id="lesson-title" tabIndex={-1}>
        {lesson.code} · {lesson.title}
      </h1>
      <section aria-labelledby="lesson-idea">
        <h2 id="lesson-idea">The idea</h2>
        <p>{lesson.concept}</p>
        {lesson.rules && <p className="subtle">Rules: {lesson.rules}</p>}
      </section>
      <section aria-labelledby="lesson-drill">
        <h2 id="lesson-drill">Practise</h2>
        <p>{lesson.drill}</p>
        <p>
          <b>Pass (untimed):</b> {lesson.exit}
        </p>
        {lesson.exitTimed && (
          <p className="subtle">
            <b>Optional, timed:</b> {lesson.exitTimed}
          </p>
        )}
        <p className="subtle">
          The drills open with the Learn hub; until then, a review’s Practice this is the way to try
          it.
        </p>
      </section>
    </main>
  );
}
