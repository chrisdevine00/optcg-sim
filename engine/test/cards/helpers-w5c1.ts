/**
 * Helpers and constants for the wave 5 group 1 card tests (EB02-035, EB03-033, EB03-051, OP03-008,
 * OP09-025, -061, -065, -068, -070, -073, -076, -104, -119). Every constant is a vanilla, or a card
 * whose text is inert where the test puts it.
 */
import type { InstanceId, PlayerId } from '@optcg/engine';
import { withAbilities, type Ability } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { accept, dec, option, payDon } from './helpers.ts';

export { canPick, pickable } from './helpers-w3s.ts';

/** OP08-058 Charlotte Pudding Leader ({Big Mom Pirates}, purple/yellow); its text only matters when it attacks. */
export const BMP_LEADER = 'OP08-058';
/** OP09-022 Lim Leader ({ODYSSEY}); its text is not used here. */
export const ODYSSEY_LEADER = 'OP09-022';
/** OP12-041 Sanji Leader: blue/purple (multicolored); an [Activate: Main] only. */
export const MULTI_LEADER = 'OP12-041';
/** Events: ST01-016 is red, ST02-017 is green (their text is never used). */
export const RED_EVENT = 'ST01-016';
export const GREEN_EVENT = 'ST02-017';
/** OP05-012 Hack: a {Revolutionary Army} vanilla (cost 3, 5000). OP12-083 Inazuma: {Revolutionary Army}, <Slash>. */
export const RA_CHAR = 'OP05-012';

/** The ids of the cards in a zone. */
export const ids = (g: TestGame, p: PlayerId, z: Parameters<TestGame['zone']>[1]): string[] =>
  g.zone(p, z).map((c) => c.card);

/**
 * Accept the optional "return 1 or more DON!!" cost, name how many (when asked), then answer any
 * which-DON!! question by taking the first offered place.
 */
export function payReturn(g: TestGame, n: number): void {
  accept(g);
  const d = dec(g);
  if (d?.kind === 'choose' && d.options?.length && d.options.every((o) => /^\d+$/.test(o.id)))
    option(g, String(n));
  payDon(g);
}

/** The count prompt of the cost, as the list of numbers offered (null when none is asked). */
export function countOptions(g: TestGame): string[] | null {
  const d = dec(g);
  return d?.kind === 'choose' && d.options?.length && d.options.every((o) => /^\d+$/.test(o.id))
    ? d.options.map((o) => o.id)
    : null;
}

/** Give `card` (of p1) a planted [Activate: Main] `k` that returns `n` of p1's DON!!, and run it. */
export function returnNow(g: TestGame, card: string, n: number): void {
  g.state = withAbilities(g.state, card, [
    {
      id: 'k',
      kind: 'activate',
      when: 'activateMain',
      effect: [{ do: { returnDon: { n } } }],
    } as unknown as Ability,
  ]);
  g.act({ type: 'activate', card: g.find('p1', 'characters', card), ability: 'k' });
}

/** Give `card` (of `who`) a planted [Activate: Main] `k` with `effect`, and run it. */
export function plantRun(
  g: TestGame,
  who: PlayerId,
  card: string,
  effect: Record<string, unknown>[],
): void {
  g.state = withAbilities(g.state, card, [
    { id: 'k', kind: 'activate', when: 'activateMain', effect } as unknown as Ability,
  ]);
  g.act({ type: 'activate', card: g.find(who, 'characters', card), ability: 'k' });
}

export type Id = InstanceId;
