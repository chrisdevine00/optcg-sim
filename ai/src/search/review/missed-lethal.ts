/**
 * The `missed-lethal` detector (M8 WP1): one item is one turn of a seat, at its first Main decision.
 * The check is the L-slice's (`checkLethalItem`, ported from `reviewMissedLethal` with no change in
 * behaviour): `public` proof first (severe, `any-hand`), `actual` only when that fails (Hindsight);
 * a `public` search that did not finish is a marker, never a clean turn. A refuted `public` check
 * whose `actual` search runs out is a note, no marker (M8-1).
 */
import { queries } from '@optcg/engine';
import { checkLethalTurn } from '../lethal/review.ts';
import { lethalToMarker, lethalToReviewFlag } from './adapt.ts';
import { didInTurn } from './did.ts';
import type { Detector, ReviewFlag } from './types.ts';

export const detect: Detector = (item, ctx) => {
  if (!ctx.record.actions[item.index]) return null;
  const state = ctx.stateAt(item.index);
  const dec = queries.decision(state);
  if (!dec || dec.kind !== 'main') return null;
  const { flag: f, note } = checkLethalTurn(
    { turn: item.turn, player: dec.player, index: item.index },
    ctx.record.actions,
    state,
    ctx.cards,
    ctx.cap,
  );
  if (!f) return note ? { itemId: item.id, turn: item.turn, flags: [], notes: [note] } : null;
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
