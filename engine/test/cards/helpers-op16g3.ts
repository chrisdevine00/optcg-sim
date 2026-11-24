/** Constants for the OP-16 group 3 card tests (OP16-058 to OP16-091). Every card named here is a vanilla or has inert text in these positions. */
import type { TestGame } from '../fixtures/index.ts';
import { dec, game, PLAIN_BLUE, V } from './helpers.ts';

/** OP16-060 Sengoku Leader: Purple, {Navy}; its only text is an [Activate: Main]. */
export const NAVY_LEADER = 'OP16-060';
/** ST04-001 Kaido Leader: Purple, {Animal Kingdom Pirates} (not Navy). */
export const NOT_NAVY = 'ST04-001';
/** ST09-001 Yamato Leader: Yellow, {Land of Wano}; a passive power bonus only. */
export const WANO_LEADER = 'ST09-001';
/** OP14-060 Doflamingo Leader: Purple, {Donquixote Pirates}; only an [On Your Opponent's Attack]. */
export const DQ_LEADER = 'OP14-060';
/** {Admiral} Characters (cost 7, 8000): Kuzan, Sakazuki, Borsalino. Only [On Play] / Activate text. */
export const ADMIRAL_A = 'OP16-063';
export const ADMIRAL_B = 'OP16-065';
export const ADMIRAL_C = 'OP16-073';
/** {Impel Down} vanillas: Blugori (cost 1, 3000), Sphinx (cost 4, 6000), Saldeath (cost 6, 8000). */
export const ID_3000 = 'OP02-084';
export const ID_6000 = 'OP02-088';
export const ID_8000 = 'OP11-064';
/** {Land of Wano} vanillas: Komachiyo (1, 3000), Kawamatsu (5, 6000), Sanji (8, 9000). */
export const WANO_1 = 'OP01-010';
export const WANO_5 = 'OP12-023';
export const WANO_8 = 'OP16-086';
/** P-064 Kouzuki Momonosuke (cost 6): a vanilla with the name but not cost 9. */
export const MOMO_6 = 'P-064';
/** OP16-085 Kouzuki Momonosuke (cost 9, Blocker, {Land of Wano}). */
export const MOMO_9 = 'OP16-085';
/** OP16-042 Prisoner of Impel Down (cost 6, 6000). */
export const PRISONER = 'OP16-042';
/** OP16-041 Buggy Leader (Blue). */
export const BUGGY_LEADER = 'OP16-041';

/** p2's 7000 Character attacks p1's Leader on p2's turn 4; p1 owes the block/counter decisions next. */
export function defend(p1: Parameters<typeof game>[0], attacker: string = V.c7) {
  const g = game(
    p1,
    { leader: PLAIN_BLUE, characters: [attacker] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', attacker), target: g.leader('p1') });
  return g;
}

/**
 * Resolve the chains of [On Play] prompts that played Characters leave behind: decline every
 * optional cost, take the most for every "add up to N DON!!" count, take the first order offered.
 */
export function settle(g: TestGame): void {
  for (let i = 0; i < 20; i++) {
    const d = dec(g);
    if (!d || d.kind === 'main') return;
    if (d.kind === 'optional') g.act({ type: 'optional', accept: false });
    else if (d.kind === 'choose' && d.options?.length)
      g.act({ type: 'pick', choice: { option: d.options[0]!.id } });
    else if (d.kind === 'choose' && (d.max ?? 0) === 0) g.act({ type: 'done' });
    else if (d.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
    else return;
  }
}
