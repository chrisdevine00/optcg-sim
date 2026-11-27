/**
 * Writes `app/src/learn/examples.json` (M9 WP6): the worked examples the lesson pages show, taken from
 * `docs/design/explanations.md` the way `docExample` (ai/test/support/doc.ts) reads them: the first
 * ```ts block after `## E<nn>.`, evaluated as a literal. A lesson page shows its examples at Learner
 * verbosity, so the text a player reads is the text the design doc specifies.
 *
 *   npx tsx scripts/lesson-examples.ts            writes the file
 *   npx tsx scripts/lesson-examples.ts --check    exits 1 if the committed file is not what this makes
 *
 * `app/test/learn-examples.test.ts` regenerates in memory and compares, so an edit to
 * explanations.md without a rerun fails CI.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import type { Explanation } from '../ai/src/explanation.ts';

/** Which doc examples each lesson shows, in order (learning-ui §8.2 step 3, and the M9 spec). */
export const LESSON_EXAMPLES: Record<string, string[]> = {
  L05: ['E04', 'E05'],
  L09: ['E06', 'E07'],
  L10: ['E05', 'E19'],
  L12: ['E10', 'E11'],
  L14: ['E08', 'E09'],
  L15: ['E01', 'E20'],
};

export interface LessonExample {
  /** `E05` */
  id: string;
  /** "A hit that should have been countered" */
  title: string;
  /** The doc's "Position." paragraph, in plain text: where the example happens. */
  position: string;
  explanation: Explanation;
}

export type LessonExamples = Record<string, LessonExample[]>;

const DOC = new URL('../docs/design/explanations.md', import.meta.url);
export const OUT = new URL('../app/src/learn/examples.json', import.meta.url);

const plain = (s: string) => s.replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim();

/** One example from the doc's text: the same parse as `docExample`. */
export function exampleOf(md: string, id: string): LessonExample {
  const at = md.indexOf(`## ${id}.`);
  if (at < 0) throw new Error(`explanations.md has no ${id}`);
  const rest = md.slice(at);
  const title = /^## E\w+\.\s*(.+)$/m.exec(rest)![1]!.trim();
  const next = rest.indexOf('\n## ', 3);
  const section = next < 0 ? rest : rest.slice(0, next);
  const position = /\*\*Position\.\*\*\s*([\s\S]*?)\n\n/.exec(section)?.[1] ?? '';
  const block = /```ts\n([\s\S]*?)```/.exec(rest)![1]!;
  const explanation = new Function(`return (${block});`)() as Explanation;
  return { id, title, position: plain(position), explanation };
}

export function buildExamples(md: string): LessonExamples {
  const out: LessonExamples = {};
  for (const [lesson, ids] of Object.entries(LESSON_EXAMPLES))
    out[lesson] = ids.map((id) => exampleOf(md, id));
  return out;
}

export async function render(md: string): Promise<string> {
  const path = fileURLToPath(OUT);
  const text = JSON.stringify(buildExamples(md), null, 2);
  return format(text, { ...(await resolveConfig(path)), parser: 'json' });
}

async function main(): Promise<void> {
  const text = await render(readFileSync(DOC, 'utf8'));
  if (process.argv.includes('--check')) {
    if (readFileSync(OUT, 'utf8') !== text) {
      console.error(
        'app/src/learn/examples.json is out of date: run npx tsx scripts/lesson-examples.ts',
      );
      process.exit(1);
    }
    return;
  }
  writeFileSync(OUT, text);
  console.log(`wrote ${fileURLToPath(OUT)}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) void main();
