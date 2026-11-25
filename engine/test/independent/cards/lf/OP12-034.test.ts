/**
 * OP12-034 Perona (Character, Green, cost 1, 2000, Counter +1000, Special, {Thriller Bark
 * Pirates}/{Muggy Kingdom}).
 *
 * Card text: "[On Play] If your Leader has the <Slash> attribute, look at 5 cards from the top of your
 * deck; reveal up to 1 <Slash> attribute card or green Event and add it to your hand. Then, place
 * the rest at the bottom of your deck in any order."
 *
 * Rules: the [On Play] is mandatory; the "If" is an effect condition on my Leader's attribute; "up to
 * 1" may be none (CR 8-4-4-1); a card is looked at and revealed only when added (CR 11-2-1); the
 * qualifying cards are Characters or other cards with the Slash attribute, or green Events (a green
 * Character that is not Slash does not qualify, nor does a red Event); the rest go to the bottom.
 * Scenery: OP01-031 Oden ({Slash} Leader), OP01-001 Zoro (Slash), ST01-001 Luffy (Strike);
 * Slash cards OP01-053 Wire (green Character), green Event OP02-047 Paradise Totsuka, red Event
 * ST01-014 Guard Point, green non-Slash Character OP01-043 Shinobu.
 */
import { describe, expect, it } from 'vitest';
import type { CardId } from '@optcg/engine';
import {
  atMain,
  deck,
  describeLook13,
  hand,
  kind,
  LD_LF,
  mine,
  need,
  playRaw,
  VAN_LF,
  EV_LF,
} from './kit-lfa.ts';

const PERONA = 'OP12-034';
const TOTSUKA = 'OP02-047';
const { wire, shinobu, mohji } = VAN_LF;

function start(leader: string, deckTopFirst: CardId[]) {
  const g = mine(leader, { hand: [PERONA], deck: deckTopFirst });
  playRaw(g, PERONA);
  return g;
}

describeLook13({
  id: PERONA,
  n: 5,
  start: (d) => start(LD_LF.oden, d),
  match: [wire, TOTSUKA],
  miss: shinobu,
  edgeHit: TOTSUKA,
  edgeMiss: EV_LF.guardPoint,
});

describe('OP12-034 Perona: the <Slash> Leader condition and the printed values', () => {
  const top = [wire, TOTSUKA, shinobu, shinobu, shinobu, ...Array.from({ length: 9 }, () => mohji)];

  it('printed values: cost 1, 2000 power, Counter +1000', () => {
    const g = start(LD_LF.oden, top);
    const p = g.find('p1', 'characters', PERONA);
    expect(g.card(p).cost).toBe(1);
    expect(g.power(p)).toBe(2000);
    expect(g.card(p).counter).toBe(1000);
  });

  it('a Leader without the <Slash> attribute (Strike): nothing is looked at, no prompt, the deck is untouched', () => {
    const g = start(LD_LF.luffy, top);
    expect(kind(g)).toBe('main');
    expect(deck(g)).toEqual(top);
    expect(hand(g)).toEqual([]);
  });

  it('other <Slash> Leaders work too (Zoro, Shanks)', () => {
    for (const leader of [LD_LF.zoro, LD_LF.shanks]) {
      const g = start(leader, top);
      need(g, 'choose', 'p1');
    }
  });

  it('must not: after the look the game returns to the Main Phase with Perona on the field and nothing else in hand', () => {
    const g = start(LD_LF.oden, top);
    need(g, 'choose', 'p1');
    // Decline: nothing added.
    g.act({ type: 'done' });
    for (let i = 0; i < 5 && kind(g) === 'order'; i++)
      g.act(g.legal().find((a) => a.type === 'order')!);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([PERONA]);
  });
});
