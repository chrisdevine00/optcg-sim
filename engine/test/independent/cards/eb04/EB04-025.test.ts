/**
 * EB04-025 Nefeltari Vivi (Character, cost 7, 4000, Counter +1000, {Alabasta}).
 *
 * Card text: "[On Play] Play up to 1 {Alabasta} type Character card with a cost of 8 or less other than
 * [Nefeltari Vivi] from your hand. Then, your opponent places 1 card from their hand at the bottom
 * of their deck."
 *
 * Rules: "other than [Nefeltari Vivi]" excludes every card with that NAME (ST01-009 too); "up to 1"
 * (CR 8-4-4-1); the OPPONENT chooses which card to place; with an empty hand nothing is placed.
 * Reading note: whether the opponent still places a card when I play nothing is not settled; the
 * tests assert the placement only after a card was played.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  BLUE,
  cardIds,
  choices,
  decision,
  fill,
  hand,
  kind,
  LE,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  SN,
} from './kit-eb04a.ts';

const VIVI = 'EB04-025';
const P2HAND = [SN.c4, SN.c5, SN.c6];
const P2DECK = fill(BLUE, 6);

function start(myHand: string[], p2hand: string[] = P2HAND) {
  const g = mine(LE.croc, { hand: [VIVI, ...myHand] }, { hand: p2hand, deck: P2DECK });
  playRaw(g, VIVI);
  return g;
}
const pickCard = (g: ReturnType<typeof start>, card: string) =>
  pickInst(g, [choices(g).find((i) => g.card(i).card === card)!]);

/** The opponent places the card `card` (or the first offered), settling an order prompt if asked. */
function oppPlaces(g: ReturnType<typeof start>, card?: string) {
  let guard = 0;
  while (decision(g)?.player === 'p2' && guard++ < 4) {
    if (kind(g) === 'order') {
      act(
        g,
        g.legal().find((a) => a.type === 'order')!,
      );
    } else {
      const want = card ? choices(g).find((i) => g.card(i).card === card) : undefined;
      act(g, { type: 'pick', choice: want ?? choices(g)[0]! });
    }
  }
}

describe('EB04-025 Nefeltari Vivi [On Play]: play an {Alabasta} Character (cost 8 or less, not Vivi), then the opponent places 1 card at the bottom of their deck', () => {
  it('printed values: cost 7, 4000, Counter +1000', () => {
    const g = mine(LE.croc, { hand: [VIVI] }, {});
    const c = g.card(g.find('p1', 'hand', VIVI));
    expect(c.cost).toBe(7);
    expect(c.power).toBe(4000);
    expect(c.counter).toBe(1000);
  });

  it('plays the chosen {Alabasta} Character from hand; then the opponent places 1 of their own cards at the bottom', () => {
    const g = start([SN.cobra5, SN.chaka6]);
    need(g, 'choose');
    pickCard(g, SN.cobra5);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([SN.cobra5, VIVI].sort());
    expect(hand(g)).toEqual([SN.chaka6]);
    need(g, 'choose', 'p2');
    expect(offeredIds(g).sort()).toEqual([...P2HAND].sort());
    oppPlaces(g, SN.c5);
    expect(kind(g)).toBe('main');
    expect(hand(g, 'p2').sort()).toEqual([SN.c4, SN.c6].sort());
    const deck = cardIds(g, 'p2', 'deck');
    expect(deck).toHaveLength(7);
    expect(deck.slice(0, 6)).toEqual(P2DECK);
    expect(deck[6]).toBe(SN.c5);
  });

  it('boundary: a cost-8 {Alabasta} Character is allowed (EB04-023 Chaka & Pell), a non-{Alabasta} one is not', () => {
    const g = start([SN.chaka8, SN.c3, SN.cobra5]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SN.cobra5, SN.chaka8].sort());
    none(g);
    oppPlaces(g);
  });

  it('"other than [Nefeltari Vivi]": another card named Nefeltari Vivi (ST01-009, {Alabasta}) is not offered', () => {
    const g = start([SN.viviChar, SN.karoo1]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SN.karoo1]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    oppPlaces(g);
  });

  it('"up to 1": may play nothing; then no Character enters play', () => {
    const g = start([SN.cobra5]);
    need(g, 'choose');
    none(g);
    oppPlaces(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([VIVI]);
    expect(hand(g)).toEqual([SN.cobra5]);
  });

  it('no {Alabasta} Character in hand: nothing is played', () => {
    const g = start([SN.c3, SN.viviChar]);
    // An "up to" pick over the hand with a filter is asked even when nothing matches.
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([]);
    none(g);
    oppPlaces(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([VIVI]);
    expect(hand(g)).toEqual([SN.c3, SN.viviChar].sort());
  });

  it('only 1 card is placed even if the opponent holds many', () => {
    const g = start([SN.cobra5], [SN.c4, SN.c5, SN.c6, SN.c7, SN.c3]);
    pickCard(g, SN.cobra5);
    oppPlaces(g);
    expect(hand(g, 'p2')).toHaveLength(4);
    expect(cardIds(g, 'p2', 'deck')).toHaveLength(7);
  });

  it('the opponent has an empty hand: nothing to place, no prompt for them', () => {
    const g = start([SN.cobra5], []);
    pickCard(g, SN.cobra5);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p2', 'deck')).toHaveLength(6);
    expect(at(g, 'p1', 'characters', SN.cobra5)).toBeTruthy();
  });

  it('the opponent has exactly 1 card: it is the one placed and their hand is empty', () => {
    const g = start([SN.cobra5], [SN.c6]);
    pickCard(g, SN.cobra5);
    oppPlaces(g);
    expect(hand(g, 'p2')).toEqual([]);
    expect(cardIds(g, 'p2', 'deck').at(-1)).toBe(SN.c6);
  });
});
