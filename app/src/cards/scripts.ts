/**
 * Effect scripts available to the app (M4a): the registry's card numbers. Cards outside it play
 * for their stats and verified keywords, with an "effect not automated" badge (effect-dsl E-D8).
 */
import { SCRIPTED_IDS } from '@optcg/cards';

export const SCRIPTED: ReadonlySet<string> = SCRIPTED_IDS;
export const SCRIPTED_ANY = SCRIPTED.size > 0;
