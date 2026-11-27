/**
 * Every screen-reader script's step table, in the order the owner walks them, for the listening sheet
 * (`scripts/a11y-sheet.ts` writes `docs/design/a11y-passes/M10-listening-pass.md` from this list).
 * A script added to `app/a11y/src` without an entry here fails `app/test/a11y-sheet.test.ts`.
 *
 * Plain data and the scripts' own tables only: nothing here runs a browser.
 */
import type { StepDef } from './steps.ts';
import { L_RECORD_URL, L_STEPS, L_URL } from './l.ts';
import { M3_STEPS, M3_URL } from './m3.ts';
import { M7_STEPS, M7_TUTORIAL_URL } from './m7.ts';
import { M8_STEPS, M8_URL } from './m8.ts';
import { M9_STEPS, M9_URL } from './m9.ts';
import { M10_STEPS, M10_URL } from './m10.ts';

export interface ScriptDef {
  /** The script's file name without the extension: `m3`, `l`, `m7`, ... */
  id: string;
  /** What the sheet calls it. */
  name: string;
  title: string;
  /** Where its steps are specified: the accessibility.md section. */
  section: string;
  /** The page the script starts on, relative to the app's base address. */
  start: string;
  /** What to know before starting (one or two sentences; never changes a step). */
  intro: string;
  steps: readonly StepDef[];
}

export const SCRIPTS: readonly ScriptDef[] = [
  {
    id: 'm3',
    name: 'M3',
    title: 'The board, every decision type',
    section: '§11.3',
    start: M3_URL,
    intro:
      'The scenario starts on turn 3. Use Tab where a step says Tab (not VO-Right). Letter keys go to the board only while focus is inside it.',
    steps: M3_STEPS,
  },
  {
    id: 'l',
    name: 'L',
    title: 'The learning slice: attack, coach, count, review',
    section: '§11.4',
    start: L_URL,
    intro: `Steps F3 to 5 run on this page. Steps 6 to 10 start from a planted finished game: load \`${L_RECORD_URL}\`, concede it through the Game menu and open "Review this game".`,
    steps: L_STEPS,
  },
  {
    id: 'm7',
    name: 'M7',
    title: 'The tutorial and the coach',
    section: '§11.5',
    start: M7_TUTORIAL_URL,
    intro:
      'Four parts, each on its own page: the tutorial (T), the hint (H), Settings (S) and the blunder warning (B). The Do column says which page to load.',
    steps: M7_STEPS,
  },
  {
    id: 'm8',
    name: 'M8',
    title: 'The review of a finished game',
    section: '§11.6',
    start: M8_URL,
    intro:
      'Load the planted missed-lethal game, concede it (Game menu, Concede, Concede) and open "Review this game"; the game saves itself.',
    steps: M8_STEPS,
  },
  {
    id: 'm9',
    name: 'M9',
    title: 'The learning layer: matchups, drills, rules, progress',
    section: '§11.8',
    start: M9_URL,
    intro:
      'Five short parts, each on its own page. D2 needs about a minute of waiting for the ten-second warning.',
    steps: M9_STEPS,
  },
  {
    id: 'm10',
    name: 'M10',
    title: 'The release shell: About, not found, skip link, offline, update',
    section: '§11.9',
    start: M10_URL,
    intro:
      'O1 needs the installed app: load Settings once with a connection and wait a few seconds, then turn Wi-Fi off. U1 needs a new build to be waiting, which a live site does not offer by hand: write "not run by hand" in its Result unless you have one (the scripted run judges it).',
    steps: M10_STEPS,
  },
];
