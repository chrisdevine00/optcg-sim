/**
 * The `missed-lethal` detector (M8 WP1): one item is one turn of a seat, at its first Main decision.
 * The check is the L-slice's (`checkLethalItem`, ported from `reviewMissedLethal` with no change in
 * behaviour): `public` proof first (severe, `any-hand`), `actual` only when that fails (Hindsight);
 * a search that did not finish is a marker, never a clean turn.
 */
import { queries } from '@optcg/engine';
import { checkLethalItem } from '../lethal/review.ts';
import { lethalToMarker, lethalToReviewFlag } from './adapt.ts';
import { didInTurn } from './did.ts';
import type { Detector, ReviewFlag } from './types.ts';

export const detect: Detector = (item, ctx) => {
  const state = ctx.stateAt(item.index);
  const dec = queries.decision(state);
  if (!dec || dec.kind !== 'main') return null;
  const f = checkLethalItem(
    { turn: item.turn, player: dec.player, index: item.index },
    ctx.record.actions,
    state,
    ctx.cards,
    ctx.cap,
  );
  if (!f) return null;
  const proof = {
    public: f.public,
    actual: f.actual,
    player: f.player,
    actionIndex: f.actionIndex,
  };
  const did = didInTurn(ctx.record, ctx.stateAt, item.index, f.player, ctx.cards);
  const flag = lethalToReviewFlag(f, did);
  const marker = lethalToMarker(f);
  const flags: ReviewFlag[] = flag ? [{ ...flag, lethal: proof }] : [];
  return {
    itemId: item.id,
    turn: item.turn,
    flags,
    notes: [],
    ...(marker ? { marker: { ...marker, lethal: proof } } : {}),
  };
};
