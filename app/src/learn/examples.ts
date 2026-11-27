/**
 * The worked examples the lesson pages show (M9 WP6). `examples.json` is generated from
 * `docs/design/explanations.md` by `scripts/lesson-examples.ts`; a test regenerates it and compares.
 */
import type { Explanation } from '@optcg/ai';
import data from './examples.json';

export interface LessonExample {
  id: string;
  title: string;
  position: string;
  explanation: Explanation;
}

const ALL = data as unknown as Record<string, LessonExample[]>;

/** The examples of a lesson by its code (`L10`); none for most lessons. */
export const examplesFor = (code: string): LessonExample[] => ALL[code] ?? [];

export const EXAMPLE_LESSONS: readonly string[] = Object.keys(ALL);
