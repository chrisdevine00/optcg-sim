/**
 * The raw research files, bundled as text and parsed once. Only `index.ts` `loadRules()` imports this
 * module (dynamically), so it is a lazy chunk: the reference is the one page that needs these ~100 KB.
 */
import digest from '../../../docs/research/rules-digest.md?raw';
import rulings from '../../../docs/research/rulings.md?raw';
import glossary from '../../../docs/content/glossary.md?raw';
import { buildRules } from './index.ts';

export const RULES = buildRules(digest, rulings, glossary);
