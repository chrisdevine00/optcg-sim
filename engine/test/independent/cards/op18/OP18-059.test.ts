/**
 * OP18-059 I Pray For Your Success. (Event, Blue, cost 0, {The Seven Warlords of the Sea}/{Baroque Works}).
 *
 * Card text (cards/data):
 *   "[Main] You may rest 1 of your DON!! cards and trash 1 card with a type including "Baroque
 *    Works" from your hand: Draw 2 cards.
 *    [Counter] You may trash 1 card from your hand: Up to 1 of your Leader or Characters gains
 *    +3000 power during this battle."
 *
 * Rules: both are optional cost-effects (CR 8-3-1: all cost parts or none). [Main] needs 1 active
 * DON!! and a hand card whose type includes "Baroque Works" (the Event itself is not in hand while
 * it resolves). [Counter] trashes any 1 hand card; the +3000 goes on 1 Leader or Character for the
 * battle; the Event costs 0 so it can be used with no active DON!!.
 *
 * Scenery: OP18-043 Accelegator (BW, cost 4), OP09-055 Mr.1 ({Former Baroque Works}), OP01-012 Sai,
 * OP01-023 Marco; OP01-018 Hajrudin (6000) attacks.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, attack, passBlock, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  BW,
  canCounterWith,
  counterAction,
  cardIds,
  choiceCards,
  chooseIfAsked,
  decline,
  donOf,
  fill,
  kind,
  LDR,
  mine,
  need,
  offered,
  RED,
  side,
  theirTurn,
  useCounter,
  VAN,
} from './kit-d.ts';

const PRAY = 'OP18-059';
const CROC = 'ST03-001';
const TOP = 'OP01-010';

function game(hand: string[], p1: Partial<PlayerSpec> = {}): TestGame {
  return mine(CROC, {
    hand: [PRAY, ...hand],
    deck: fill(TOP, 6),
    costArea: { active: 3, rested: 0 },
    ...p1,
  });
}

describe('OP18-059 I Pray For Your Success.: [Main] rest 1 DON!! and trash a Baroque Works card from hand: draw 2', () => {
  it('pays 1 DON!! and 1 Baroque Works card, then draws 2', () => {
    const g = game([BW.accel4, VAN.sai]);
    play(g, g.find('p1', 'hand', PRAY));
    need(g, 'optional', 'p1');
    accept(g);
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).toEqual([BW.accel4]);
    act(g, { type: 'pick', choice: g.find('p1', 'hand', BW.accel4) });
    expect(cardIds(g, 'p1', 'hand').sort()).toEqual([TOP, TOP, VAN.sai].sort());
    expect(cardIds(g, 'p1', 'trash').sort()).toEqual([BW.accel4, PRAY].sort());
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
    expect(kind(g)).toBe('main');
  });

  it('"type including": a {Former Baroque Works} card is offered next to a Baroque Works card; a non-BW card is not', () => {
    const g = game([BW.formerBw5, BW.accel4, VAN.sai]);
    play(g, g.find('p1', 'hand', PRAY));
    accept(g);
    expect(choiceCards(g)).toEqual([BW.accel4, BW.formerBw5].sort());
  });

  it('declining pays nothing: no DON!! rested, no card trashed, no draw', () => {
    const g = game([BW.accel4]);
    play(g, g.find('p1', 'hand', PRAY));
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([BW.accel4]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 0 });
  });

  it('with no Baroque Works card in hand the cost cannot be paid (the Event itself is not in hand)', () => {
    const g = game([VAN.sai]);
    play(g, g.find('p1', 'hand', PRAY));
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(cardIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
  });

  it('with no active DON!! the cost cannot be paid even with a Baroque Works card in hand', () => {
    const g = game([BW.accel4], { costArea: { active: 0, rested: 2 } });
    play(g, g.find('p1', 'hand', PRAY));
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(cardIds(g, 'p1', 'hand')).toEqual([BW.accel4]);
  });
});

describe('OP18-059 I Pray For Your Success.: [Counter] you may trash 1 card from hand: Leader or Character gains +3000 power', () => {
  /** p2's Hajrudin (6000) attacks p1's Leader (5000); p1 has Sai on the field and the Event plus 2 cards in hand. */
  function attacked(hand: string[] = [PRAY, VAN.sai, VAN.marco]): TestGame {
    const g = theirTurn(
      side(CROC, 'OP02-060', { hand, characters: [{ card: VAN.sai, rested: true }] }),
      side(LDR.luffy, RED, { characters: [VAN.hajrudin] }),
    );
    attack(g, g.find('p2', 'characters', VAN.hajrudin), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('trash any 1 card: the Leader gains +3000 for the battle and survives', () => {
    const g = attacked();
    useCounter(g, g.find('p1', 'hand', PRAY), g.leader('p1'));
    if (kind(g) === 'choose' && g.legal().some((a) => a.type === 'pick')) {
      act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    }
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(cardIds(g, 'p1', 'trash')).toContain(VAN.sai);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
  });

  it('it can go on a Character instead: the attacked rested Character survives a 6000 attack', () => {
    const g = theirTurn(
      side(CROC, 'OP02-060', {
        hand: [PRAY, VAN.marco],
        characters: [{ card: VAN.sai, rested: true }],
      }),
      side(LDR.luffy, RED, { characters: [VAN.hajrudin] }),
    );
    const sai = g.find('p1', 'characters', VAN.sai);
    attack(g, g.find('p2', 'characters', VAN.hajrudin), sai);
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', PRAY), sai);
    if (
      kind(g) === 'choose' &&
      g.legal().some((a) => a.type === 'pick' && a.choice === g.find('p1', 'hand', VAN.marco))
    ) {
      act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.marco) });
    }
    chooseIfAsked(g, [sai]);
    expect(g.power(sai)).toBe(7000);
    act(g, { type: 'endCounter' });
    expect(cardIds(g, 'p1', 'characters')).toEqual([VAN.sai]);
  });

  it('costs 0: it can be used with no active DON!! at all', () => {
    const g = attacked();
    expect(donOf(g, 'p1').active).toBe(0);
    expect(canCounterWith(g, g.find('p1', 'hand', PRAY))).toBe(true);
  });

  it('declining the cost: no card is trashed and no power is gained (the Event is still spent)', () => {
    const g = attacked();
    g.act(counterAction(g, g.find('p1', 'hand', PRAY))!);
    need(g, 'optional', 'p1');
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(cardIds(g, 'p1', 'hand').sort()).toEqual([VAN.marco, VAN.sai].sort());
    expect(cardIds(g, 'p1', 'trash')).toEqual([PRAY]);
  });

  it('with no other card in hand the cost cannot be paid: "use" is not available', () => {
    const g = attacked([PRAY]);
    g.act(counterAction(g, g.find('p1', 'hand', PRAY))!);
    need(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
