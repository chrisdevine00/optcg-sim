import type * as Ai from './ai.ts';

export type DrillAi = typeof Ai;

/** The drills' ai functions and banks, loaded on a drill route only (see ai.ts). */
export const loadDrillAi = (): Promise<DrillAi> => import('./ai.ts');
