/**
 * M9 WP6: the Learn hub and lesson page. Worked examples are the committed JSON generated from
 * explanations.md (regenerating gives the same bytes, and each equals `docExample`); every lesson id
 * the explanations name has a page; the hub's rows read well to a screen reader; Show me links exist
 * exactly where a rules demo names the lesson; and the progress and learn pages render a heading.
 */
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { KIND_WORD } from '../src/play/review/model.ts';
import { docExample } from '../../ai/test/support/doc.ts';
import { buildExamples, LESSON_EXAMPLES, render } from '../../scripts/lesson-examples.ts';
import { EXAMPLE_LESSONS, examplesFor } from '../src/learn/examples.ts';
import { demosForLesson, lessonOfPath, ruleRefs } from '../src/learn/LessonRoute.tsx';
import { drillWords, Row, stagesOf } from '../src/learn/LearnRoute.tsx';
import { LESSONS, lessonById } from '../src/learn/lessons.ts';
import { lessonInfo } from '../src/progress/derive.ts';
import { FLAG_WORD } from '../src/progress/ProgressRoute.tsx';
import { credit, inputOf, iso, NOW, progressOf, session } from './progress-support.ts';

const DOC = readFileSync(new URL('../../docs/design/explanations.md', import.meta.url), 'utf8');
/** What a screen reader says: aria-hidden spans are skipped. */
const text = (html: string) =>
  html
    .replace(/<span aria-hidden="true">[^<]*<\/span>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

describe('worked examples', () => {
  it('are the committed JSON: regenerating from explanations.md gives the same bytes', async () => {
    const committed = readFileSync(new URL('../src/learn/examples.json', import.meta.url), 'utf8');
    expect(await render(DOC)).toBe(committed);
  });

  it('go to the lessons the spec names, in order', () => {
    expect(LESSON_EXAMPLES).toEqual({
      L05: ['E04', 'E05'],
      L09: ['E06', 'E07'],
      L10: ['E05', 'E19'],
      L12: ['E10', 'E11'],
      L14: ['E08', 'E09'],
      L15: ['E01', 'E20'],
    });
    expect([...EXAMPLE_LESSONS].sort()).toEqual(Object.keys(LESSON_EXAMPLES).sort());
    for (const [code, ids] of Object.entries(LESSON_EXAMPLES))
      expect(examplesFor(code).map((e) => e.id)).toEqual(ids);
  });

  it('are the doc’s own text: each equals what docExample reads', () => {
    for (const [code, ids] of Object.entries(LESSON_EXAMPLES))
      examplesFor(code).forEach((ex, i) => {
        expect(ex.explanation, `${code} ${ids[i]}`).toEqual(docExample(ids[i]!));
        expect(ex.title).not.toBe('');
        expect(ex.position.length).toBeGreaterThan(20);
      });
  });

  it('would fail the check if the doc changed (a changed claim is not the committed JSON)', async () => {
    const edited = DOC.replace("claim: 'This counter didn\\'t need playing.'", "claim: 'Edited.'");
    expect(edited).not.toBe(DOC);
    expect(buildExamples(edited).L05![0]!.explanation.claim).toBe('Edited.');
    const committed = readFileSync(new URL('../src/learn/examples.json', import.meta.url), 'utf8');
    expect(await render(edited)).not.toBe(committed);
  });

  it('every lesson an explanation points at has a lesson page (the CI check, for /learn)', () => {
    const ids = new Set([...DOC.matchAll(/lessonId: '(L\d+-[a-z0-9-]+)'/g)].map((m) => m[1]!));
    expect(ids.size).toBeGreaterThan(5);
    for (const id of ids) {
      expect(lessonById(id), id).toBeDefined();
      expect(lessonOfPath(`/learn/${id}`)?.id).toBe(id);
    }
    expect(lessonOfPath('/learn/L10')?.id).toBe('L10-counter-or-take');
    expect(lessonOfPath('/learn/L99')).toBeUndefined();
  });
});

describe('the hub', () => {
  it('lists every lesson once, in four stages, Stage 1 first', () => {
    const stages = stagesOf();
    expect(stages).toHaveLength(4);
    expect(stages.flatMap((s) => s.lessons.map((l) => l.code))).toEqual(LESSONS.map((l) => l.code));
    expect(stages[0]!.name).toMatch(/^Stage 1/);
    expect(stages[0]!.lessons[0]!.code).toBe('L01');
    expect(LESSONS).toHaveLength(27);
  });

  it('reads a row as "L10, Counter or take, in progress, Counter or take it: best 6 of 10"', () => {
    const input = inputOf([], { progress: progressOf([session('counter', 10, 6, iso(NOW))]) });
    const lesson = lessonById('L10-counter-or-take')!;
    const html = renderToStaticMarkup(
      createElement(Row, { lesson, info: lessonInfo('L10', input) }),
    );
    expect(text(html)).toBe('L10, Counter or take, in progress, Counter or take it: best 6 of 10');
    expect(html).toContain('href="/optcg-sim/learn/L10-counter-or-take"'.replace('/optcg-sim', ''));
  });

  it('says how each kind of lesson is practised', () => {
    const input = inputOf([], { credit: credit(NOW) });
    expect(drillWords(lessonInfo('L18', input))).toBe('Lesson only: no drill yet');
    expect(drillWords(lessonInfo('L03', input))).toBe('Guided tutorial');
    expect(drillWords(lessonInfo('L08', input))).toBe('Games against Rookie');
    expect(drillWords(lessonInfo('L15', input))).toBe('Lethal puzzles');
  });
});

describe('Show me and rules links', () => {
  it('has a Show me demo for L01 to L07 and L25 to L27 and for no strategy lesson', () => {
    const rules = ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L25', 'L26', 'L27'];
    for (const l of LESSONS) {
      const has = demosForLesson(l).length > 0;
      expect(has, l.code).toBe(rules.includes(l.code));
    }
  });

  it('reads the rule numbers a lesson cites', () => {
    expect(ruleRefs('CR 3-1-1, 3-1-2, 5-2-1-1 to 5-2-1-8')).toEqual({
      cr: ['3-1-1', '3-1-2', '5-2-1-1', '5-2-1-8'],
      rulings: [],
      items: [],
    });
    expect(ruleRefs('CR 4-9-2 (rules-digest item 34); RL-33, RL-43')).toEqual({
      cr: ['4-9-2'],
      rulings: ['RL-33', 'RL-43'],
      items: ['item/34'],
    });
    expect(ruleRefs('CR 10-1 (all); rules-digest items 131–133').items).toEqual([
      'item/131',
      'item/132',
      'item/133',
    ]);
    expect(ruleRefs('')).toEqual({ cr: [], rulings: [], items: [] });
  });
});

describe('the pages', () => {
  it('render their heading first so focus can move to it', async () => {
    for (const [mod, path] of [
      [await import('../src/learn/LearnRoute.tsx'), '/learn'],
      [await import('../src/progress/ProgressRoute.tsx'), '/progress'],
    ] as const) {
      const html = renderToStaticMarkup(createElement(mod.default, { path }));
      expect(html).toMatch(/<h1 id="page-title" tabindex="-1">[^<]+<\/h1>/);
      expect(html).toContain(`data-path="${path}"`);
    }
    const lesson = renderToStaticMarkup(
      createElement((await import('../src/learn/LessonRoute.tsx')).default, {
        path: '/learn/L10-counter-or-take',
      }),
    );
    expect(lesson).toMatch(/<h1 id="page-title" tabindex="-1">L10 · Counter or take<\/h1>/);
    expect(lesson).toContain('Worked examples');
    expect(lesson).toContain('/drills/counter');
    const missing = renderToStaticMarkup(
      createElement((await import('../src/learn/LessonRoute.tsx')).default, {
        path: '/learn/nope',
      }),
    );
    expect(missing).toContain('Lesson not found');
  });

  it('the lesson page offers Mark as read only for a lesson with no drill, and Show me for a rules lesson', async () => {
    const page = async (id: string) =>
      renderToStaticMarkup(
        createElement((await import('../src/learn/LessonRoute.tsx')).default, {
          path: `/learn/${id}`,
        }),
      );
    expect(await page('L18-hand-management')).toContain('Mark as read');
    expect(await page('L10-counter-or-take')).not.toContain('Mark as read');
    expect(await page('L05-block-and-counter')).toContain('Show me');
    expect(await page('L18-hand-management')).not.toContain('Show me');
  });

  it('names flag kinds as the review does', () => {
    expect(FLAG_WORD).toEqual(KIND_WORD);
  });
});
