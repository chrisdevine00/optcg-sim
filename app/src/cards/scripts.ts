/**
 * Effect scripts available to the app: the registry's card numbers (M4b: every meta-list card with an
 * effect is scripted). Cards outside it play for their stats and verified keywords, with an "effect not
 * automated" badge (effect-dsl E-D8); vanilla and keywords-only cards need no script.
 */
import { SCRIPTED_IDS } from '@optcg/cards';

export const SCRIPTED: ReadonlySet<string> = SCRIPTED_IDS;
export const SCRIPTED_ANY = SCRIPTED.size > 0;
