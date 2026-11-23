/** Vitest setup: load every effect script before a test file runs (scripts load per set; M6b-0). */
import { loadAllScripts } from '../cards/effects/index.ts';

await loadAllScripts();
