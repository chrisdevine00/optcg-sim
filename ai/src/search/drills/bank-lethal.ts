import type { DrillBank } from './types.ts';

/** M9 WP0 stub: an empty bank. WP2 replaces the body (and only this file) with the committed lethal bank. */
export const bank = (): DrillBank => ({
  drill: 'lethal',
  builtWith: { engine: '', scripts: '' },
  items: [],
});
