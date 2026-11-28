/**
 * OP18-084 Saint Gunko (Character, Black, cost 1, 2000, {Celestial Dragons}/{Holy Knights of God}).
 *
 * Card text (cards/data):
 *   "[On Play] Look at 4 cards from the top of your deck; reveal up to 1 {Holy Knights of God} type
 *    card and add it to your hand. Then, trash the rest.
 *    [Activate: Main] You may rest 4 of your DON!! cards: Play up to 1 {Holy Knights of God} type
 *    Character card with a cost of 6 or less from your trash."
 *
 * Rules: only the top 4 are looked at; "up to 1" may add none; the added card is revealed (CR
 * 11-2-1); the rest (3 or 4 cards) go to the trash, not the bottom. The [Activate: Main] has no
 * once-per-turn limit: its cost (rest 4 active DON!!) is the limit; the play is free; cost 6 is
 * allowed, cost 10 is not.
 *
 * Scenery: OP18-083 Saint Killingham (Black, cost 5, {Holy Knights of God}), OP18-065 Saint Gunko
 * (Purple, cost 10, {Holy Knights of God}), OP01-012 Sai / OP01-023 Marco / OP02-007 Thatch /
 * OP02-006 Kingdew (no such type).
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import { act, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  at,
  canActivate,
  cardIds,
  choiceCards,
  choices,
  decline,
  donOf,
  fill,
  hasEvent,
  kind,
  LEAD,
  mine,
  need,
  offered,
  offeredAbilities,
  settleOrders,
  VAN,
} from './kit-d.ts';

const GUNKO = 'OP18-084';
const KILL = 'OP18-083';
const BIG = 'OP18-065';
const PAD = 'OP01-010';

describe('OP18-084 Saint Gunko: [On Play] look at 4, add up to 1 {Holy Knights of God} card, trash the rest', () => {
  function start(top: CardId[]): TestGame {
    const g = mine(LEAD.kaido, { hand: [GUNKO], deck: [...top, ...fill(PAD, 6)] });
    play(g, g.find('p1', 'hand', GUNKO));
    return g;
  }

  it('offers exactly the {Holy Knights of God} cards of the top 4; the pick goes to hand, the other 3 to the trash', () => {
    const g = start([VAN.sai, KILL, VAN.marco, BIG, VAN.thatch]);
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).toEqual([BIG, KILL].sort());
    act(g, { type: 'pick', choice: g.find('p1', 'deck', KILL) });
    settleOrders(g);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'hand')).toEqual([KILL]);
    expect(cardIds(g, 'p1', 'trash').sort()).toEqual([BIG, VAN.marco, VAN.sai].sort());
    // The 5th card (outside the look) is now on top of the deck.
    expect(cardIds(g, 'p1', 'deck')[0]).toBe(VAN.thatch);
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(7);
  });

  it('the added card is revealed; the trashed ones are not', () => {
    const g = start([VAN.sai, KILL, VAN.marco, VAN.kingdew]);
    act(g, { type: 'pick', choice: g.find('p1', 'deck', KILL) });
    settleOrders(g);
    expect(hasEvent(g, 'CardRevealed', { card: KILL })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: VAN.sai })).toBe(false);
  });

  it('"up to 1": adding none trashes all 4 looked-at cards', () => {
    const g = start([KILL, BIG, VAN.marco, VAN.sai]);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    settleOrders(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(cardIds(g, 'p1', 'trash')).toHaveLength(4);
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(6);
  });

  it('only the top 4 are looked at: a {Holy Knights of God} card in 5th place is not offered', () => {
    const g = start([VAN.sai, VAN.marco, VAN.thatch, VAN.kingdew, KILL]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    settleOrders(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(cardIds(g, 'p1', 'deck')[0]).toBe(KILL);
    expect(cardIds(g, 'p1', 'trash')).toHaveLength(4);
  });

  it('adds at most 1 even when several qualify; the second qualifying card is trashed', () => {
    const g = start([KILL, BIG, VAN.sai, VAN.marco]);
    act(g, { type: 'pick', choice: g.find('p1', 'deck', KILL) });
    settleOrders(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([KILL]);
    expect(cardIds(g, 'p1', 'trash')).toContain(BIG);
  });
});

describe('OP18-084 Saint Gunko: [Activate: Main] you may rest 4 DON!!: play up to 1 {Holy Knights of God} Character (cost 6 or less) from the trash', () => {
  function board(trash: CardId[], p1: Partial<PlayerSpec> = {}): TestGame {
    return mine(LEAD.kaido, {
      characters: [GUNKO],
      trash,
      costArea: { active: 9, rested: 0 },
      ...p1,
    });
  }

  const use = (g: TestGame) => {
    const gunko = at(g, 'p1', 'characters', GUNKO);
    act(g, { type: 'activate', card: gunko, ability: offeredAbilities(g, gunko)[0]! });
    if (offered(g, 'p1')) accept(g);
  };

  it('rests 4 DON!! and plays the chosen card from the trash for free (cost 5 is allowed)', () => {
    const g = board([KILL, VAN.sai]);
    use(g);
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).toEqual([KILL]);
    act(g, { type: 'pick', choice: g.find('p1', 'trash', KILL) });
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([GUNKO, KILL].sort());
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 4 });
    expect(cardIds(g, 'p1', 'trash')).toEqual([VAN.sai]);
  });

  it('cost boundary: a cost 10 {Holy Knights of God} Character (OP18-065) is not offered', () => {
    const g = board([KILL, BIG]);
    use(g);
    expect(choiceCards(g)).toEqual([KILL]);
  });

  it('a Character without the {Holy Knights of God} type is not offered', () => {
    const g = board([VAN.sai]);
    use(g);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(cardIds(g, 'p1', 'characters')).toEqual([GUNKO]);
  });

  it('"up to 1": picking none plays nothing; the 4 DON!! stay rested', () => {
    const g = board([KILL]);
    use(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(cardIds(g, 'p1', 'trash')).toEqual([KILL]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 4 });
  });

  it('with fewer than 4 active DON!! it cannot be used', () => {
    const g = board([KILL], { costArea: { active: 3, rested: 4 } });
    const gunko = at(g, 'p1', 'characters', GUNKO);
    if (canActivate(g, gunko)) {
      act(g, { type: 'activate', card: gunko, ability: offeredAbilities(g, gunko)[0]! });
      if (kind(g) === 'optional') {
        expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
        decline(g);
      }
    }
    expect(cardIds(g, 'p1', 'trash')).toEqual([KILL]);
  });

  it('no once-per-turn limit: with 8 active DON!! it can be used twice in a turn (two cards played)', () => {
    const g = board([KILL, KILL], { costArea: { active: 8, rested: 0 } });
    use(g);
    act(g, { type: 'pick', choice: g.find('p1', 'trash', KILL, 0) });
    expect(canActivate(g, at(g, 'p1', 'characters', GUNKO))).toBe(true);
    use(g);
    act(g, { type: 'pick', choice: g.find('p1', 'trash', KILL, 0) });
    expect(cardIds(g, 'p1', 'characters').filter((c) => c === KILL)).toHaveLength(2);
    expect(donOf(g, 'p1').active).toBe(0);
  });
});
