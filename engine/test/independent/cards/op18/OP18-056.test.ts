/**
 * OP18-056 Mr.13 & Ms.Friday (Character, Blue, cost 2, 3000, Counter +1000, {Animal}/{Baroque Works}).
 *
 * Card text (cards/data):
 *   "[DON!! x1] This Character gains +1000 power.
 *    [On Play] You may place 1 of your Characters with a type including "Baroque Works" other than
 *    this Character at the bottom of your deck: Your opponent trashes 1 card from their hand."
 *
 * Rules: the cost (place one OTHER Baroque Works Character of mine at the bottom of my deck) is
 * paid in full or not at all (CR 8-3-1); declining pays nothing and trashes nothing; the opponent
 * chooses which card of their hand to trash; with an empty hand they trash nothing.
 *
 * Scenery: OP18-043 Accelegator (Blue, cost 4, {Baroque Works}); OP09-055 Mr.1 (cost 5, {Former
 * Baroque Works}); OP01-012 Sai (no type); P-015 Sunny-Kun and ST05-007 Gordon as hand cards.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  BW,
  cardIds,
  choices,
  decline,
  describeDonPlus,
  kind,
  mine,
  need,
  offered,
  VAN,
} from './kit-d.ts';

const FRIDAY = 'OP18-056';
/** Instance of the Baroque Works Character that pays the cost (read before the play). */
let accel = '';

describeDonPlus(FRIDAY, 3000);

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}): TestGame {
  return mine(
    'ST03-001',
    {
      hand: [FRIDAY],
      characters: [BW.accel4, VAN.sai],
      deck: Array.from({ length: 6 }, () => 'OP02-060'),
      ...p1,
    },
    { hand: [VAN.sunny, VAN.gordon], ...p2 },
  );
}

function start(g: TestGame) {
  accel =
    g.zone('p1', 'characters').find((c) => c.card === BW.accel4 || c.card === BW.formerBw5)
      ?.instance ?? '';
  play(g, g.find('p1', 'hand', FRIDAY));
  need(g, 'optional', 'p1');
  accept(g);
}

/** Pay the cost with `card`: if it is the only candidate the engine may pay it without asking. */
function payPlace(g: TestGame, target: string) {
  if (kind(g) === 'choose' && g.decider === 'p1' && choices(g).includes(target)) {
    act(g, { type: 'pick', choice: target });
  }
}

describe('OP18-056 Mr.13 & Ms.Friday: [On Play] you may place another Baroque Works Character at the bottom of your deck: opponent trashes 1 card', () => {
  it('pays the cost and the opponent trashes the card they choose', () => {
    const g = game();
    start(g);
    payPlace(g, accel);
    expect(cardIds(g, 'p1', 'deck').slice(-1)).toEqual([BW.accel4]);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([FRIDAY, VAN.sai].sort());
    need(g, 'choose', 'p2');
    expect(choices(g)).toHaveLength(2);
    act(g, { type: 'pick', choice: g.find('p2', 'hand', VAN.gordon) });
    expect(cardIds(g, 'p2', 'trash')).toEqual([VAN.gordon]);
    expect(cardIds(g, 'p2', 'hand')).toEqual([VAN.sunny]);
    expect(kind(g)).toBe('main');
  });

  it('"other than this Character": Mr.13 himself is not offered as the cost, nor is a Character without the type', () => {
    const g = game({ characters: [BW.accel4, VAN.sai, BW.formerBw5] });
    start(g);
    const offeredNow = choices(g);
    expect(offeredNow).toContain(g.find('p1', 'characters', BW.accel4));
    expect(offeredNow).toContain(g.find('p1', 'characters', BW.formerBw5));
    expect(offeredNow).not.toContain(g.find('p1', 'characters', FRIDAY));
    expect(offeredNow).not.toContain(g.find('p1', 'characters', VAN.sai));
  });

  it('declining the cost: nothing is placed and the opponent trashes nothing', () => {
    const g = game();
    play(g, g.find('p1', 'hand', FRIDAY));
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'characters')).toHaveLength(3);
    expect(cardIds(g, 'p2', 'hand')).toHaveLength(2);
  });

  it('no other Baroque Works Character: the cost cannot be paid, so the opponent keeps their hand', () => {
    const g = game({ characters: [VAN.sai] });
    play(g, g.find('p1', 'hand', FRIDAY));
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(cardIds(g, 'p2', 'hand')).toHaveLength(2);
    expect(cardIds(g, 'p1', 'characters')).toContain(VAN.sai);
  });

  it('"type including": a {Former Baroque Works} Character can pay the cost', () => {
    const g = game({ characters: [BW.formerBw5] });
    start(g);
    payPlace(g, accel);
    expect(cardIds(g, 'p1', 'deck').slice(-1)).toEqual([BW.formerBw5]);
    need(g, 'choose', 'p2');
  });

  it('an opponent with an empty hand trashes nothing; the cost stays paid', () => {
    const g = game({}, { hand: [] });
    start(g);
    payPlace(g, accel);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p2', 'trash')).toEqual([]);
    expect(cardIds(g, 'p1', 'deck').slice(-1)).toEqual([BW.accel4]);
  });

  it('with a one-card opposing hand that card is trashed (forced or a single pick)', () => {
    const g = game({}, { hand: [VAN.sunny] });
    start(g);
    payPlace(g, accel);
    if (kind(g) === 'choose') act(g, { type: 'pick', choice: g.find('p2', 'hand', VAN.sunny) });
    expect(cardIds(g, 'p2', 'trash')).toEqual([VAN.sunny]);
  });
});
