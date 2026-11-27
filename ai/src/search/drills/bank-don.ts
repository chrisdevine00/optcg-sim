import type { DrillBank } from './types.ts';

/** M9 WP0 stub: an empty bank. WP3 replaces the body (and only this file) with the committed DON!! bank. */
export const bank = (): DrillBank => ({
  drill: 'don',
  builtWith: { engine: '', scripts: '' },
  items: [],
});
