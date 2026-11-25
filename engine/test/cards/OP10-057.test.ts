/** OP10-057 Leo. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, hand, none, pick, play, trash, V } from './helpers.ts';
import {
  canPick,
  cardsOf,
  deckOf,
  DR2,
  DR3,
  DR_EVENT,
  finishOrder,
  mk,
  PLAIN_STAGE,
  USOPP_LEADER,
} from './helpers-a10g2.ts';

const ID = 'OP10-057';
const PLAIN_LEADER = 'ST01-001';

describe('OP10-057 Leo', () => {
  // Top 5: {Dressrosa} Event, {Dressrosa} Character, [Leo] (another copy), a plain card, {Dressrosa} Character; the 6th is {Dressrosa}.
  const top5 = [DR_EVENT, DR2, ID, V.c1, DR3];
  const start = (p1: Parameters<typeof mk>[0] = {}) =>
    mk({ leader: USOPP_LEADER, hand: [ID, V.c2], deck: deckOf([...top5, DR2]), ...p1 });

  it('[On Play] rest your Leader: with a [Usopp] Leader, looks at 5, takes up to 2 {Dressrosa} cards other than [Leo], the rest to the bottom, then trashes 1 card from your hand', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'deck', DR2), g.find('p1', 'deck', DR3)]);
    finishOrder(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(hand(g, 'p1').sort()).toEqual([DR2, DR3].sort());
    expect(trash(g, 'p1')).toEqual([V.c2]);
    const d = cardsOf(g, 'p1', 'deck');
    expect(d[0]).toBe(DR2); // the 6th card was not looked at
    expect(d.slice(-3).sort()).toEqual([DR_EVENT, ID, V.c1].sort());
    expectDecision(g, 'main', 'p1');
  });

  it('candidates: any {Dressrosa} category (an Event too), but not [Leo] himself or a non-{Dressrosa} card', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(canPick(g, g.find('p1', 'deck', DR_EVENT))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', DR2))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', ID))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
  });

  it('"up to 2": may take 1 or none; the trash still follows', () => {
    const g = start();
    play(g, ID);
    accept(g);
    none(g);
    finishOrder(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([V.c2]);
    expect(cardsOf(g, 'p1', 'deck').slice(-5).sort()).toEqual([...top5].sort());
  });

  it('with a Leader that is not [Usopp] the cost is still paid, but nothing is looked at or trashed', () => {
    const g = start({ leader: PLAIN_LEADER });
    play(g, ID);
    accept(g);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(trash(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(DR_EVENT);
  });

  it('may rest a Stage instead of the Leader', () => {
    const g = start({ stage: PLAIN_STAGE });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'stage', PLAIN_STAGE)]);
    none(g);
    finishOrder(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(g.card(g.find('p1', 'stage', PLAIN_STAGE)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('"You may": declining rests nothing and looks at nothing; nothing is payable with a rested Leader and no Stage', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(DR_EVENT);

    const h = start({ leader: { card: USOPP_LEADER, rested: true } });
    play(h, ID);
    expectDecision(h, 'main', 'p1');
    expect(cardsOf(h, 'p1', 'deck')[0]).toBe(DR_EVENT);
  });
});
