/** OP12-080 Baratie. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { expectDecision, game, hand, none, pick, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { damageWith } from './triggers.ts';
import { cardsOf, finishOrder } from './helpers-luffyace.ts';
import {
  activate,
  atMain,
  ids,
  NOT_MUSIC,
  offeredAb,
  offeredPicks,
  SANJI_LEADER,
  WB_EVENT,
} from './helpers-w6c2.ts';

const ID = 'OP12-080';
const AB = 'place-look';
/** Top 3: an Event, a Character and a second Event; then two more cards. */
const DECK = [WB_EVENT, V.c1, NOT_MUSIC, V.c2, V.c3];
const mk = (p1: Partial<PlayerSpec> = {}) =>
  game({ leader: SANJI_LEADER, stage: ID, deck: DECK, ...p1 }, { leader: PLAIN_BLUE });
const use = (g: ReturnType<typeof mk>) => activate(g, g.find('p1', 'stage', ID), AB);

describe('OP12-080 Baratie', () => {
  it('[Activate: Main] with [Sanji]: the Stage goes to the bottom of the deck, look at 3, add an Event, the rest go below it', () => {
    const g = mk();
    use(g);
    expect(g.zone('p1', 'stage')).toHaveLength(0);
    expectDecision(g, 'choose', 'p1');
    // Only the Events among the top 3 are offered, not the Character, nor the cards below the 3.
    expect(offeredPicks(g).sort()).toEqual(
      [g.find('p1', 'deck', WB_EVENT), g.find('p1', 'deck', NOT_MUSIC)].sort(),
    );
    pick(g, [g.find('p1', 'deck', NOT_MUSIC)]);
    expect(hand(g, 'p1')).toEqual([NOT_MUSIC]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(NOT_MUSIC);
    finishOrder(g);
    expect(atMain(g)).toBe(true);
    const deck = cardsOf(g, 'p1', 'deck');
    // The two cards not taken are the last two; the Stage went there before the search.
    expect(deck.slice(0, 2)).toEqual([V.c2, V.c3]);
    expect(deck).toHaveLength(DECK.length);
    expect(deck[2]).toBe(ID);
    expect(deck.slice(3).sort()).toEqual([WB_EVENT, V.c1].sort());
  });

  it('"up to 1": at most one Event, and none is allowed', () => {
    const g = mk();
    use(g);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(DECK.length + 1);
    expect(g.zone('p1', 'stage')).toHaveLength(0);
  });

  it('the "If your Leader is [Sanji]" follows the cost: with another Leader the Stage is placed and nothing else happens', () => {
    const g = mk({ leader: PLAIN_PURPLE });
    use(g);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p1', 'stage')).toHaveLength(0);
    const deck = cardsOf(g, 'p1', 'deck');
    expect(deck).toEqual([...DECK, ID]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.eventsOfType('CardRevealed').filter((e) => e.reason === 'effect')).toHaveLength(0);
  });

  it('only a Stage on the field can pay: it is offered while on the field and the cost is a removal', () => {
    const g = mk();
    expect(offeredAb(g, g.find('p1', 'stage', ID), AB)).toBe(true);
    use(g);
    const moved = g.eventsOfType('CardMoved').find((e) => e.card === ID && e.to === 'deck')!;
    expect(moved.cause).toEqual({ kind: 'cost', by: 'p1' });
  });

  it('[Trigger] plays this card (onto the Stage area); declining adds it to the hand', () => {
    const g = damageWith(ID, { leader: SANJI_LEADER });
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'stage')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([]);

    const d = damageWith(ID, { leader: SANJI_LEADER });
    d.act({ type: 'trigger', activate: false });
    expect(ids(d, 'p1', 'stage')).toEqual([]);
    expect(hand(d, 'p1')).toEqual([ID]);
  });
});
