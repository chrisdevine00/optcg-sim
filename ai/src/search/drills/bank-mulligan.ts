import type { DrillBank } from './types.ts';

/** M9 WP0 stub: an empty bank. WP3 replaces the body (and only this file) with `mulliganBank()`'s items. */
export const bank = (): DrillBank => ({
  drill: 'mulligan',
  builtWith: { engine: '', scripts: '' },
  items: [],
});
