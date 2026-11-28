/**
 * OP18-016 Monkey.D.Luffy (Red Character, cost 6, 7000, {Alabasta}/{Straw Hat Crew}).
 *
 * Card text (cards/data):
 *   "[Banish]
 *    [On K.O.] Play up to 1 {Alabasta} type Character card with 6000 power or less from your hand."
 *
 * Reading: Banish keyword; when K.O.'d, play (for free) up to 1 {Alabasta} Character card from hand
 * with printed power <= 6000.
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import {
  at,
  atMain,
  cardIds,
  donOf,
  endBattle,
  hand,
  kw,
  LC,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  theirs,
  VC,
} from './kit-c.ts';

const LUFFY = 'OP18-016';

/** p2's Thatch (8000) K.O.'s p1's rested Luffy (7000). */
function ko(handCards: string[]) {
  const g = theirs(
    LC.luffy,
    { characters: [{ card: LUFFY, rested: true }], hand: handCards },
    { characters: [VC.thatch6] },
  );
  attack(g, at(g, 'p2', 'characters', VC.thatch6), at(g, 'p1', 'characters', LUFFY));
  endBattle(g);
  return g;
}

describe('OP18-016 Luffy: [Banish] and [On K.O.] play an {Alabasta} Character (6000 or less) from hand', () => {
  it('has Banish', () => {
    const g = theirs(LC.luffy, { characters: [LUFFY] });
    expect(kw(g, at(g, 'p1', 'characters', LUFFY))).toContain('Banish');
  });

  it('when K.O.’d plays a 6000 power {Alabasta} Character for free (boundary)', () => {
    const g = ko([VC.cobra5]);
    need(g, 'choose', 'p1');
    pickCards(g, [VC.cobra5]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p1', 'characters')).toEqual([VC.cobra5]);
    expect(hand(g)).toEqual([]);
    expect(donOf(g, 'p1').active).toBe(0);
  });

  it('a 7000 power {Alabasta} Character is not offered; neither is a Character without the type', () => {
    const g = ko([VC.karoo5, VC.marco3, VC.sanji1]);
    expect(offeredIds(g)).toEqual([VC.sanji1]);
    pickCards(g, [VC.sanji1]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([VC.sanji1]);
  });

  it('"up to 1": may play nothing', () => {
    const g = ko([VC.cobra5]);
    none(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([VC.cobra5]);
  });

  it('only one card is played when two qualify', () => {
    const g = ko([VC.cobra5, VC.sanji1]);
    pickCards(g, [VC.sanji1]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([VC.sanji1]);
    expect(hand(g)).toEqual([VC.cobra5]);
  });

  // Settled by the review (OP18-R11, ADR 0005): a pick over the hidden hand is asked even with no
  // qualifying card (max 0), so the pause tells the opponent nothing; the trash (OP18-010) is public.
  it('with no qualifying card in hand an empty pick is still asked, and nothing is played', () => {
    const g = ko([VC.marco3]);
    expect(atMain(g, 'p2')).toBe(false);
    g.act({ type: 'done' });
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('Banish on attack: the hit Life card goes to the trash, not the hand', () => {
    const g = mine(LC.luffy, { characters: [LUFFY] });
    attack(g, at(g, 'p1', 'characters', LUFFY), g.leader('p2'));
    endBattle(g);
    expect(g.life('p2')).toBe(3);
    expect(g.zone('p2', 'trash')).toHaveLength(1);
    expect(g.zone('p2', 'hand')).toHaveLength(0);
  });
});
