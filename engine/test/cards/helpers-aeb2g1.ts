/**
 * Constants and helpers for the EB-02 group 1 card tests. Every card named below is a vanilla or an
 * unscripted card whose text is inert where the test puts it (a Leader's text only matters for a
 * trigger these tests never cause).
 */
import type { CardId, InstanceId } from '@optcg/engine';
import { type TestGame } from '../fixtures/index.ts';
import { dec, don, expectDecision, hand, pick, V } from './helpers.ts';
import { cardsOf, finishOrder, SHC } from './helpers-luffyace.ts';

export {
  mk,
  boost,
  RED_LEADER,
  EB,
  EB_LEADER,
  FISH_LEADER,
  REBECCA_OLD,
} from './helpers-op15g1.ts';
export { activate, offeredAb, canPick, pickable, koBy } from './helpers-w3s.ts';
export { koByEffect, settle } from './helpers-op14g4.ts';
export { canHit, finishBattle, p2Attacks, NAVY_LEADER } from './helpers-w4sb.ts';
export { SHC, cardsOf, finishOrder };
export { dec, don, hand, pick, V, expectDecision };
export { none, option, play, payDon } from './helpers.ts';

/** {Land of Wano} Leader [Kin'emon] (only an [Activate: Main], never used here). */
export const WANO_LEADER = 'OP02-025';
/** [Portgas.D.Ace] {Whitebeard Pirates} Leader (Red). */
export const ACE_LEADER = 'OP03-001';
/** {Whitebeard Pirates} Leader that is not [Portgas.D.Ace]: [Edward.Newgate] is scripted, so the other Ace. */
export const NOT_WB_LEADER = 'ST03-001';
/** [Donquixote Rosinante] Leader (Blue/Green) and another Blue Leader. */
export const ROSI_LEADER = 'OP05-022';
/** Multicolored Leader (Blue/Black), 5000 power. */
export const MULTI_LEADER = 'OP04-039';
/** Cost 2 / 4000 Purple vanilla; cost 3 / 5000 Purple vanilla; cost 1 / 3000 Purple vanilla; cost 4 / 6000. */
export const C1 = V.c1;
export const C2 = V.c2;
export const C3 = V.c3;
export const C4 = V.c4;
export const C5 = V.c5;
/** {Animal} vanillas: cost 2 [Momoo] (4000), cost 3 [Humandrill] (5000), cost 4 [Sphinx] (6000). */
export const ANIMAL2 = 'OP03-035';
export const ANIMAL3 = 'ST12-004';
export const ANIMAL4 = 'OP02-088';
/** {Revolutionary Army} vanillas: [Koala] cost 2, [Hack] cost 3 (neither is [Sabo]). */
export const RA2 = 'EB05-041';
export const RA3 = 'OP05-012';
/** A 0-power vanilla (cost 1): a stand-in for "1000 power or less" with a buff. */
export const ZERO = 'OP13-014';
/** [Zou] (Stage, cost 3), [Galley-La Company] (Stage, cost 3), [Merry Go] (Stage, cost 1), unscripted. */
export const ZOU = 'OP08-039';
export const GALLEY = 'OP03-075';
export const MERRY = 'EB02-041';
/** A cost-2 and a cost-3 Character that is {Straw Hat Crew}: SHC.jinbe2 (cost 2) and a green SHC cost 3. */
export const SHC_CARD3 = 'OP02-028';
/** An Event (no script, cost 3) and a Stage for hand fodder. */
export const EVENT = 'OP03-056';

export const names = (
  g: TestGame,
  p: 'p1' | 'p2',
  zone: Parameters<TestGame['zone']>[1],
): CardId[] => cardsOf(g, p, zone);

/** Pick the DON!! count option (the most) when "how many" is asked, else nothing. */
export function maybeCount(g: TestGame): void {
  const d = dec(g);
  if (d?.kind === 'choose' && d.options?.length)
    g.act({ type: 'pick', choice: { option: d.options[0]!.id } });
}

/** Take a card from the look-at set (by instance in the deck) and settle the order of the rest. */
export function takeFromLook(g: TestGame, card: CardId): void {
  pick(g, [g.find('p1', 'deck', card)]);
  finishOrder(g);
}

export const idOf = (
  g: TestGame,
  p: 'p1' | 'p2',
  zone: Parameters<TestGame['zone']>[1],
  card: CardId,
  nth = 0,
): InstanceId => g.find(p, zone, card, nth);
