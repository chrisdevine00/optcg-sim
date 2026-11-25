/**
 * EB03-039 Ulti (Character, Black, cost 6, 7000, Counter +1000, Strike, {Animal Kingdom Pirates}).
 *
 * Card text: "[On Play] If your Leader has the {Animal Kingdom Pirates} type, draw 1 card and trash 1
 * card from your hand. Then, play up to 1 Character card with 6000 power or less and no base effect
 * from your trash."
 *
 * Rules: CR 2-4-3 ("has the {X} type": exact type, one of several is enough), CR 8-1-3-1-2
 * (condition at resolution), M4b-5 (a "Then" after a failed "If" does not resolve), CR 4-8-1 ("up
 * to"), M6b-Q29 (keyword-only text is no base effect). A card trashed by this effect is in the
 * trash when the "Then" part looks at it.
 *
 * Scenery (printed): ST04-001 Kaido (Purple Leader, {Animal Kingdom Pirates}/{The Four Emperors}),
 * OP01-091 King (Purple Leader, {Animal Kingdom Pirates} only), ST01-001 Luffy (neither).
 */
import { describe, expect, it } from 'vitest';
import type { CardId } from '@optcg/engine';
import { decision, fill } from '../../helpers.ts';
import { myTurn, side } from '../kit.ts';
import {
  BLUE,
  canFinish,
  isChoose,
  LW,
  mayEnd,
  need,
  none,
  offeredCards,
  ofZone,
  pickCards,
  put,
  RED,
  restedOf,
  SC6,
} from './kit-w6a.ts';

const ID = 'EB03-039';
/** OP02-020 LittleOars Jr.: 9000, never eligible: filler. */
const FIL = SC6.c9k;
const KAIDO = 'ST04-001';
const KING = 'OP01-091';

/** p1 (turn 3) holds Ulti (cost 6) and `hand`; p1's deck starts with `top`; p1's trash is `trash`. */
function start(o: { leader?: string; hand?: CardId[]; top?: CardId[]; trash?: CardId[] } = {}) {
  return myTurn(
    side(o.leader ?? KAIDO, BLUE, {
      hand: [ID, ...(o.hand ?? [])],
      deck: [...(o.top ?? [FIL]), ...fill(FIL, 14)],
      trash: o.trash ?? [],
      costArea: { active: 6, rested: 0 },
    }),
    side(LW.luffy, RED, { costArea: { active: 3, rested: 0 } }),
  );
}

describe('EB03-039 Ulti: [On Play] with an {Animal Kingdom Pirates} Leader: draw 1, trash 1, then play up to 1 vanilla 6000-or-less from trash', () => {
  it('draws 1, asks which card to trash (exactly 1), then offers the trash and plays the card', () => {
    const g = start({ hand: [SC6.c6k, SC6.c3k], top: [SC6.c4k], trash: [SC6.c5k] });
    put(g, ID);
    // After the draw the hand is Hajrudin, Komachiyo, Sai: pick exactly one to trash.
    need(g, 'choose', 'p1');
    expect(offeredCards(g)).toEqual([SC6.c6k, SC6.c3k, SC6.c4k].sort());
    expect(decision(g)?.min).toBe(1);
    expect(canFinish(g)).toBe(false);
    pickCards(g, [SC6.c3k]);
    need(g, 'choose', 'p1');
    // Trash: Marco (earlier) and Komachiyo (just trashed); both are vanilla 6000 or less.
    expect(offeredCards(g)).toEqual([SC6.c5k, SC6.c3k].sort());
    pickCards(g, [SC6.c5k]);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'characters')).toEqual([SC6.c5k, ID].sort());
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.c4k, SC6.c6k].sort());
    expect(ofZone(g, 'p1', 'trash')).toEqual([SC6.c3k]);
    expect(restedOf(g, 'p1', SC6.c5k)).toEqual([false]);
  });

  it('the card trashed by this effect can be played at once from the trash', () => {
    const g = start({ hand: [SC6.c6k], top: [SC6.c7k] });
    put(g, ID);
    need(g, 'choose', 'p1');
    pickCards(g, [SC6.c6k]);
    need(g, 'choose', 'p1');
    expect(offeredCards(g)).toEqual([SC6.c6k]);
    pickCards(g, [SC6.c6k]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([SC6.c6k, ID].sort());
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.c7k]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([]);
  });

  it('the drawn card may be the one trashed', () => {
    const g = start({ hand: [SC6.c6k], top: [SC6.c4k] });
    put(g, ID);
    need(g, 'choose', 'p1');
    pickCards(g, [SC6.c4k]);
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.c6k]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([SC6.c4k]);
  });

  it('with no other card in hand, the drawn card is the only one that can be trashed', () => {
    const g = start({ hand: [], top: [SC6.c4k] });
    put(g, ID);
    // One candidate: the engine may ask or resolve the pick itself.
    if (isChoose(g) && /trash/i.test(decision(g)?.prompt ?? '')) pickCards(g, [SC6.c4k]);
    expect(ofZone(g, 'p1', 'hand')).toEqual([]);
    expect(
      ofZone(g, 'p1', 'trash').includes(SC6.c4k) || ofZone(g, 'p1', 'characters').includes(SC6.c4k),
    ).toBe(true);
  });

  it('a Leader that is not {Animal Kingdom Pirates}: no draw, no trash, no play, no prompt', () => {
    const g = start({ leader: LW.luffy, hand: [SC6.c6k], top: [SC6.c4k], trash: [SC6.c5k] });
    put(g, ID);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.c6k]);
    expect(g.zone('p1', 'deck')).toHaveLength(15);
    expect(ofZone(g, 'p1', 'trash')).toEqual([SC6.c5k]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('the type check passes for a Leader with only the type (King) as it does for one with several (Kaido)', () => {
    const g = start({ leader: KING, hand: [SC6.c6k], top: [SC6.c4k], trash: [SC6.c5k] });
    put(g, ID);
    need(g, 'choose', 'p1');
    pickCards(g, [SC6.c4k]);
    need(g, 'choose', 'p1');
    pickCards(g, [SC6.c5k]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([SC6.c5k, ID].sort());
  });

  it('trash filter: 6000 and a keyword-only Blocker are offered; 7000, a base effect and an Event are not', () => {
    const g = start({
      hand: [SC6.c3k],
      top: [FIL],
      trash: [SC6.c6k, SC6.blenheim, SC6.c7k, SC6.zala, 'OP02-022'],
    });
    put(g, ID);
    need(g, 'choose', 'p1');
    pickCards(g, [SC6.c3k]);
    need(g, 'choose', 'p1');
    // The trashed Komachiyo (vanilla 3000) is eligible too.
    expect(offeredCards(g)).toEqual([SC6.c6k, SC6.blenheim, SC6.c3k].sort());
  });

  it('"up to 1": the play may be skipped; the draw and the trash have happened', () => {
    const g = start({ hand: [SC6.c6k], top: [SC6.c4k], trash: [SC6.c5k] });
    put(g, ID);
    need(g, 'choose', 'p1');
    pickCards(g, [SC6.c6k]);
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    expect(decision(g)?.max).toBe(1);
    none(g);
    expect(ofZone(g, 'p1', 'characters')).toEqual([ID]);
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.c4k]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([SC6.c5k, SC6.c6k].sort());
  });

  it('nothing in the trash qualifies: the trash cards are still trashed and no Character is played', () => {
    const g = start({ hand: [SC6.c7k], top: [SC6.zala], trash: [SC6.c8k] });
    put(g, ID);
    need(g, 'choose', 'p1');
    pickCards(g, [SC6.c7k]);
    // The trash is public: the engine may skip the empty pick or ask it empty.
    if (isChoose(g)) none(g);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'characters')).toEqual([ID]);
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.zala]);
  });
});
