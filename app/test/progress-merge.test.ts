/**
 * M9 WP6: `mergeProgress` is a join: commutative, associative and idempotent over 200 random documents
 * (a seeded generator: no Math.random), keeps the earliest dates, and caps each drill at its newest 200.
 */
import { describe, expect, it } from 'vitest';
import { DRILL_IDS, type DrillId } from '@optcg/ai';
import { capSessions, MAX_SESSIONS_PER_DRILL, mergeProgress } from '../src/progress/merge.ts';
import type { DrillSession, LessonRecord, ProgressV1 } from '../src/progress/types.ts';
import { iso, NOW, session } from './progress-support.ts';

/** mulberry32: a small seeded generator. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SOURCES: LessonRecord['source'][] = ['drill', 'tutorial', 'games', 'manual'];

/** Sessions are drawn from a fixed pool of ids so two documents overlap; an id always has one body. */
function pool(): DrillSession[] {
  const out: DrillSession[] = [];
  for (let i = 0; i < 40; i++) {
    const d = DRILL_IDS[i % DRILL_IDS.length] as DrillId;
    out.push(session(d, 10, i % 11, iso(NOW + i * 60_000), { id: `s${i}` }));
  }
  return out;
}
const POOL = pool();

function doc(r: () => number): ProgressV1 {
  const sessions = POOL.filter(() => r() < 0.4);
  const lessons: ProgressV1['lessons'] = {};
  for (const code of ['L09', 'L10', 'L12', 'L18', 'L25']) {
    if (r() < 0.5) continue;
    const rec: LessonRecord = { source: SOURCES[Math.floor(r() * 4)]! };
    if (r() < 0.6) rec.passedAt = iso(NOW + Math.floor(r() * 100) * 1000);
    if (r() < 0.3) rec.passedTimedAt = iso(NOW + Math.floor(r() * 100) * 1000);
    if (r() < 0.4) rec.readAt = iso(NOW + Math.floor(r() * 100) * 1000);
    lessons[code] = rec;
  }
  return { v: 1, lessons, sessions };
}

describe('mergeProgress', () => {
  it('is commutative, associative and idempotent over 200 random pairs', () => {
    const r = rng(20261126);
    for (let i = 0; i < 200; i++) {
      const a = doc(r);
      const b = doc(r);
      const c = doc(r);
      expect(mergeProgress(a, b), `commutative ${i}`).toEqual(mergeProgress(b, a));
      expect(mergeProgress(mergeProgress(a, b), c), `associative ${i}`).toEqual(
        mergeProgress(a, mergeProgress(b, c)),
      );
      expect(mergeProgress(a, a), `idempotent ${i}`).toEqual(mergeProgress(a, a));
      const ab = mergeProgress(a, b);
      expect(mergeProgress(ab, ab), `idempotent on a merge ${i}`).toEqual(ab);
      expect(mergeProgress(ab, a), `absorbs ${i}`).toEqual(ab);
    }
  });

  it('is the union of sessions by id and keeps the earliest date of each lesson', () => {
    const a: ProgressV1 = {
      v: 1,
      lessons: { L10: { source: 'drill', passedAt: iso(NOW + 5000), readAt: iso(NOW + 9000) } },
      sessions: [POOL[0]!, POOL[1]!],
    };
    const b: ProgressV1 = {
      v: 1,
      lessons: {
        L10: { source: 'manual', passedAt: iso(NOW + 1000), passedTimedAt: iso(NOW + 2000) },
        L18: { source: 'manual', readAt: iso(NOW) },
      },
      sessions: [POOL[1]!, POOL[2]!],
    };
    const m = mergeProgress(a, b);
    expect(m.sessions.map((s) => s.id)).toEqual(['s0', 's1', 's2']);
    expect(m.lessons.L10).toEqual({
      source: 'drill',
      passedAt: iso(NOW + 1000),
      passedTimedAt: iso(NOW + 2000),
      readAt: iso(NOW + 9000),
    });
    expect(m.lessons.L18).toEqual({ source: 'manual', readAt: iso(NOW) });
  });

  it('keeps the newest 200 sessions of each drill and all of another drill', () => {
    const many = Array.from({ length: 230 }, (_, i) =>
      session('counter', 10, 5, iso(NOW + i * 1000), { id: `c${i}` }),
    );
    const one = session('don', 10, 5, iso(NOW - 1_000_000), { id: 'd0' });
    const capped = capSessions([...many, one]);
    expect(capped.filter((s) => s.drill === 'counter')).toHaveLength(MAX_SESSIONS_PER_DRILL);
    expect(capped.some((s) => s.id === 'c29')).toBe(false);
    expect(capped.some((s) => s.id === 'c30')).toBe(true);
    expect(capped.some((s) => s.id === 'd0')).toBe(true);
    const half = mergeProgress(
      { v: 1, lessons: {}, sessions: many.slice(0, 115) },
      { v: 1, lessons: {}, sessions: many.slice(115) },
    );
    expect(half.sessions.map((s) => s.id)).toEqual(many.slice(30).map((s) => s.id));
  });
});
