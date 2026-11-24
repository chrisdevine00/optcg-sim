/**
 * EB05-050 Atlas (Character, Yellow, cost 1, 2000, Counter +1000, {Scientist}/{Egghead}).
 *
 * Card text: "[On Play] Look at 4 cards from the top of your deck; reveal up to 1 card with the
 * "Wisdom" attribute and add it to your hand. Then, place the rest at the bottom of your deck in
 * any order.
 * [Trigger] Activate this card's [On Play] effect."
 *
 * Rules: an attribute filter reads the card's attribute: Events have none, so they are never
 * "Wisdom" cards (plain reading). CR 8-4-4-1/-2/-4, RL-25 (a [Trigger] card is in no area while it
 * resolves and is trashed afterwards; declining puts it in hand).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  BLUE,
  CH,
  checkLook,
  declineTrigger,
  deck,
  describeLookAdd,
  fill,
  hand,
  hitLeader,
  kind,
  LD,
  mine,
  playCard,
  RED,
  side,
  STRIKE_FILL,
  tail,
  theirTurn,
  trash,
  YL,
} from './kit-b.ts';

const ID = 'EB05-050';
/** OP03-046 Genzo (Blue, cost 2, Wisdom) and EB02-029 Grandpa Ryu (Blue, cost 3, Wisdom). */
const GENZO = 'OP03-046';
const RYU = 'EB02-029';

describeLookAdd({
  id: ID,
  title: 'Atlas',
  n: 4,
  leader: YL.neutral,
  match: [GENZO, RYU],
  miss: STRIKE_FILL,
  beyond: CH.mohji,
});

describe('EB05-050 Atlas [On Play]: more cases', () => {
  const start = (top: string[]) => {
    const g = mine(LD.shc, { hand: [ID], deck: [...top, ...fill(BLUE, 12)] });
    playCard(g, ID);
    return g;
  };

  it('an Event has no attribute, so it is never offered even when it is the only card looked at', () => {
    const g = start(['EB05-040', STRIKE_FILL, STRIKE_FILL, STRIKE_FILL]);
    checkLook(g, { candidates: [], pick: [] });
    expect(hand(g)).toEqual([]);
  });

  it('a Strike card is not Wisdom: only Wisdom cards are offered', () => {
    const g = start([STRIKE_FILL, GENZO, CH.thatch, CH.komachiyo]);
    // Thatch (OP02-007) is also Wisdom.
    checkLook(g, { candidates: [GENZO, CH.thatch], pick: [CH.thatch] });
    expect(hand(g)).toEqual([CH.thatch]);
  });

  it('there is no Leader condition on the [On Play]: it works under any Leader', () => {
    const g = start([GENZO, STRIKE_FILL, STRIKE_FILL, STRIKE_FILL]);
    checkLook(g, { candidates: [GENZO], pick: [GENZO] });
    expect(hand(g)).toEqual([GENZO]);
  });
});

describe('EB05-050 Atlas [Trigger]: activate this card’s [On Play] effect', () => {
  function hit(top: string[]) {
    const g = theirTurn(
      side(LD.shc, BLUE, { life: [ID, ...fill(RED, 3)], deck: [...top, ...fill(BLUE, 12)] }),
      side(LD.shc, RED),
    );
    hitLeader(g, g.leader('p2'));
    return g;
  }

  it('activating from Life resolves the [On Play]: look at 4, add up to 1 Wisdom card', () => {
    const g = hit([STRIKE_FILL, GENZO, STRIKE_FILL, STRIKE_FILL]);
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    checkLook(g, { candidates: [GENZO], pick: [GENZO] });
    expect(hand(g)).toEqual([GENZO]);
    expect(tail(deck(g), 3)).toEqual([STRIKE_FILL, STRIKE_FILL, STRIKE_FILL]);
  });

  it('RL-25: after the Trigger Atlas is in the trash, not in hand and not on the field', () => {
    const g = hit([GENZO, STRIKE_FILL, STRIKE_FILL, STRIKE_FILL]);
    activateTrigger(g);
    checkLook(g, { candidates: [GENZO], pick: [] });
    expect(trash(g)).toEqual([ID]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g)).toEqual([]);
  });

  it('declining the Trigger puts Atlas in hand and looks at nothing', () => {
    const g = hit([GENZO, STRIKE_FILL, STRIKE_FILL, STRIKE_FILL]);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(deck(g)[0]).toBe(GENZO);
  });
});
