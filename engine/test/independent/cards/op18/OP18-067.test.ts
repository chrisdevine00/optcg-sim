/**
 * OP18-067 Charlotte Smoothie (Character, Purple, cost 1, 2000, Counter +1000, {Big Mom Pirates}).
 *
 * Card text (cards/data):
 *   "[On Play] You may trash 1 {Big Mom Pirates} type card from your hand: Draw 2 cards."
 *
 * Rules: an optional cost-effect (CR 8-3-1): the cost is trashing 1 card of the {Big Mom Pirates}
 * type from the hand (any card category with that type, not only Characters); declining pays and
 * draws nothing; with no such card the cost cannot be paid.
 *
 * Scenery: ST07-002 Charlotte Anana (Yellow, cost 1, {Big Mom Pirates}), OP03-103 Bobbin the
 * Disposer (Yellow, cost 2, {Big Mom Pirates}), OP03-119 Buzz Cut Mochi (Yellow Event, {Big Mom
 * Pirates}), OP01-012 Sai (no type), OP02-060 Mohji ({Buggy Pirates}); OP01-010 fills the deck.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  cardIds,
  choiceCards,
  decline,
  fill,
  kind,
  LEAD,
  mine,
  need,
  offered,
  VAN,
} from './kit-d.ts';

const SMOOTHIE = 'OP18-067';
const ANANA = 'ST07-002';
const BOBBIN = 'OP03-103';
const MOCHI = 'OP03-119';
const TOP = 'OP01-010';

function game(hand: string[], p1: Partial<PlayerSpec> = {}): TestGame {
  return mine(LEAD.kaido, { hand: [SMOOTHIE, ...hand], deck: fill(TOP, 8), ...p1 });
}

function start(g: TestGame) {
  play(g, g.find('p1', 'hand', SMOOTHIE));
  need(g, 'optional', 'p1');
  accept(g);
}

describe('OP18-067 Charlotte Smoothie: [On Play] you may trash 1 {Big Mom Pirates} card from hand: draw 2 cards', () => {
  it('trashes the chosen {Big Mom Pirates} card and draws 2', () => {
    const g = game([ANANA, BOBBIN, VAN.sai]);
    start(g);
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).toEqual([ANANA, BOBBIN].sort());
    act(g, { type: 'pick', choice: g.find('p1', 'hand', BOBBIN) });
    expect(cardIds(g, 'p1', 'trash')).toEqual([BOBBIN]);
    expect(cardIds(g, 'p1', 'hand').sort()).toEqual([ANANA, TOP, TOP, VAN.sai].sort());
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(6);
    expect(kind(g)).toBe('main');
  });

  it('a card without the {Big Mom Pirates} type (Sai, Mohji) is not offered', () => {
    const g = game([ANANA, VAN.sai, 'OP02-060', BOBBIN]);
    start(g);
    expect(choiceCards(g)).toEqual([ANANA, BOBBIN].sort());
  });

  it('"{Big Mom Pirates} type card": an Event with that type can pay the cost', () => {
    const g = game([MOCHI, VAN.sai]);
    start(g);
    // A single candidate may be paid without a question.
    if (kind(g) === 'choose') act(g, { type: 'pick', choice: g.find('p1', 'hand', MOCHI) });
    expect(cardIds(g, 'p1', 'trash')).toEqual([MOCHI]);
    expect(cardIds(g, 'p1', 'hand').sort()).toEqual([TOP, TOP, VAN.sai].sort());
  });

  it('declining: nothing is trashed and nothing is drawn', () => {
    const g = game([ANANA]);
    play(g, g.find('p1', 'hand', SMOOTHIE));
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([ANANA]);
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(8);
  });

  it('with no {Big Mom Pirates} card in hand the cost cannot be paid and nothing is drawn', () => {
    const g = game([VAN.sai, 'OP02-060']);
    play(g, g.find('p1', 'hand', SMOOTHIE));
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(2);
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(8);
  });

  it('Smoothie herself is no longer in hand, so she cannot pay her own cost (only other cards count)', () => {
    const g = game([]);
    play(g, g.find('p1', 'hand', SMOOTHIE));
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(cardIds(g, 'p1', 'characters')).toEqual([SMOOTHIE]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
  });

  it('it draws exactly 2: the deck shrinks by 2', () => {
    const g = game([ANANA]);
    start(g);
    if (kind(g) === 'choose') act(g, { type: 'pick', choice: g.find('p1', 'hand', ANANA) });
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(6);
  });
});
