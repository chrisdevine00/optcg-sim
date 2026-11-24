/** EB03-048 Rebecca. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, expectDecision, hand, none, pick, play, times, V } from './helpers.ts';
import { canPick, cardsIn, DR_CHAR, DR_STAGE1, finishOrder, mk, STAGE1 } from './helpers-eb03g2.ts';

const ID = 'EB03-048';
const top5 = [V.c1, DR_STAGE1, DR_CHAR, STAGE1, V.c2];

describe('EB03-048 Rebecca', () => {
  it('[On Play]: reveals a {Dressrosa} Stage from the top 5 into your hand, bottoms the rest, and plays a cost 1 {Dressrosa} Stage from your hand', () => {
    const g = mk({ hand: [ID], deck: [...top5, ...times(5, BLUE)] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', DR_STAGE1))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', DR_CHAR))).toBe(false); // {Dressrosa} but not a Stage
    expect(canPick(g, g.find('p1', 'deck', STAGE1))).toBe(false); // a Stage but not {Dressrosa}
    pick(g, [g.find('p1', 'deck', DR_STAGE1)]);
    finishOrder(g);
    pick(g, [g.find('p1', 'hand', DR_STAGE1)]);
    expect(cardsIn(g, 'p1', 'stage')).toEqual([DR_STAGE1]);
    expect(hand(g, 'p1')).toEqual([]);
    const deck = cardsIn(g, 'p1', 'deck');
    expect(deck).toHaveLength(9);
    expect(deck.slice(5).sort()).toEqual([V.c1, DR_CHAR, STAGE1, V.c2].sort());
  });

  it('"up to 1": may take nothing; the Stage then stays in the deck bottom', () => {
    const g = mk({ hand: [ID], deck: [...top5, ...times(5, BLUE)] });
    play(g, ID);
    none(g);
    finishOrder(g);
    none(g); // the play pick is asked at most 0 (no Stage in hand)
    expect(cardsIn(g, 'p1', 'stage')).toEqual([]);
    expect(cardsIn(g, 'p1', 'deck').slice(5)).toContain(DR_STAGE1);
    expect(dec(g)?.kind).toBe('main');
  });

  it('plays only a cost 1 {Dressrosa} Stage from the hand: a non-{Dressrosa} Stage and a Dressrosa Character are not offered', () => {
    const g = mk({
      hand: [ID, STAGE1, DR_CHAR, DR_STAGE1],
      deck: [V.c1, V.c2, V.c3, V.c4, V.c5, ...times(5, BLUE)],
    });
    play(g, ID);
    none(g);
    finishOrder(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', DR_STAGE1))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', STAGE1))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', DR_CHAR))).toBe(false);
    pick(g, [g.find('p1', 'hand', DR_STAGE1)]);
    expect(cardsIn(g, 'p1', 'stage')).toEqual([DR_STAGE1]);
  });

  it('boundary: the 6th card is not looked at', () => {
    const g = mk({
      hand: [ID],
      deck: [V.c1, V.c2, V.c3, V.c4, V.c5, DR_STAGE1, ...times(4, BLUE)],
    });
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
  });

  it('is a [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });
});
