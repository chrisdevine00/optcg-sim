/**
 * `@optcg/ai/drills` (M9 WP7): the drills' banks, judges, answer text and the flag-to-puzzle seams.
 * The `@optcg/ai` barrel carries only the drills' types (and their two constants): the code is reached
 * from here, by the drill pages' own dynamic import, so the Game and review chunks never load it (the
 * barrel re-exporting it put the judges, the generators and the bank modules into the shared ai chunk).
 */
export * from './search/drills/index.ts';
