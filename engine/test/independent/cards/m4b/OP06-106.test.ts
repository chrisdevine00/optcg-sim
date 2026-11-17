/**
 * OP06-106 Kouzuki Hiyori (Character, Yellow, cost 2, 0 power, Counter +2000; Land of Wano / Kouzuki Clan).
 *
 * Card text: "[On Play] You may add 1 card from the top or bottom of your Life cards to your hand: Add up
 * to 1 card from your hand to the top of your Life cards."
 *
 * Rules: CR 8-3-1-4 an optional cost may be declined (then the effect does not happen); a Life card
 * taken by an effect is not damage, so no [Trigger] (rules digest 104); CR 8-3-1-3 a cost that cannot
 * be paid cannot be used (0 Life); CR 8-4-4-1 "up to 1" may be nothing. Cards added to Life go
 * face-down on top (CR 3-10-2).
 * Life used: OP02-060 Mohji, OP01-012 Sai, OP01-023 Marco, OP01-018 Hajrudin (top first).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act } from '../../helpers.ts';
import {
  accept,
  BLUE,
  canFinish,
  choiceCards,
  choose,
  chooseNone,
  choices,
  decline,
  kind,
  LD,
  LEAD,
  myTurn,
  offered,
  optionChoices,
  playFromHand,
  RED,
  side,
  sortedIds,
  VAN,
  zoneCards,
} from './kit-d.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const HIYORI = 'OP06-106';
const LIFE = [BLUE, VAN.sai, VAN.marco, VAN.hajrudin]; // top first

function game(p1: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LD.navy, BLUE, {
      hand: [HIYORI, VAN.komachiyo],
      life: LIFE,
      costArea: { active: 2, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED),
  );
}

/** Take the top or bottom Life card, whichever way the engine encodes the choice. */
function takeLife(g: TestGame, which: 'top' | 'bottom') {
  if (optionChoices(g).includes(which)) {
    act(g, { type: 'pick', choice: { option: which } });
  } else {
    // Fallback: the engine offers the two end cards of Life as cards.
    const want = which === 'top' ? LIFE[0]! : LIFE[LIFE.length - 1]!;
    choose(g, [choices(g).find((i) => g.card(i).card === want)!]);
  }
  if (kind(g) === 'choose' && optionChoices(g).length === 0 && choiceCards(g).length === 0) {
    if (canFinish(g)) act(g, { type: 'done' });
  }
}

describe('OP06-106 Kouzuki Hiyori: [On Play] swap a Life card for a hand card', () => {
  it('happy path: take the BOTTOM Life card, then put a hand card on TOP of Life', () => {
    const g = game();
    playFromHand(g, HIYORI);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    takeLife(g, 'bottom');
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.hajrudin, VAN.komachiyo].sort());
    expect(g.life('p1')).toBe(3);
    choose(g, [g.find('p1', 'hand', VAN.komachiyo)]);
    expect(zoneCards(g, 'p1', 'life')).toEqual([VAN.komachiyo, BLUE, VAN.sai, VAN.marco]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.hajrudin]);
    expect(kind(g)).toBe('main');
  });

  it('take the TOP Life card instead: the old top goes to hand, the hand card becomes the new top', () => {
    const g = game();
    playFromHand(g, HIYORI);
    accept(g);
    takeLife(g, 'top');
    expect(sortedIds(g, 'p1', 'hand')).toEqual([BLUE, VAN.komachiyo].sort());
    choose(g, [g.find('p1', 'hand', VAN.komachiyo)]);
    expect(zoneCards(g, 'p1', 'life')).toEqual([VAN.komachiyo, VAN.sai, VAN.marco, VAN.hajrudin]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([BLUE]);
  });

  it('the card just taken may be put straight back on top', () => {
    const g = game();
    playFromHand(g, HIYORI);
    accept(g);
    takeLife(g, 'bottom');
    choose(g, [g.find('p1', 'hand', VAN.hajrudin)]);
    expect(zoneCards(g, 'p1', 'life')).toEqual([VAN.hajrudin, BLUE, VAN.sai, VAN.marco]);
  });

  it('CR 8-4-4-1: "up to 1" lets you add nothing back: Life ends one lower, hand one higher', () => {
    const g = game();
    playFromHand(g, HIYORI);
    accept(g);
    takeLife(g, 'bottom');
    chooseNone(g);
    expect(g.life('p1')).toBe(3);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.hajrudin, VAN.komachiyo].sort());
  });

  it('CR 8-3-1-4: declining the cost changes nothing', () => {
    const g = game();
    playFromHand(g, HIYORI);
    decline(g);
    expect(zoneCards(g, 'p1', 'life')).toEqual(LIFE);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.komachiyo]);
    expect(kind(g)).toBe('main');
  });

  it('CR 8-3-1-3: with 0 Life the cost cannot be paid, so nothing is offered', () => {
    const g = game({ life: [] });
    playFromHand(g, HIYORI);
    expect(offered(g, 'p1')).toBe(false);
    expect(kind(g)).toBe('main');
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.komachiyo]);
  });

  it('no [Trigger] decision arises when a Life card goes to hand by this cost', () => {
    const g = game({ life: ['OP14-114', VAN.sai, VAN.marco, 'OP14-114'] });
    playFromHand(g, HIYORI);
    accept(g);
    expect(kind(g)).not.toBe('trigger');
  });
});
