/**
 * OP18-060 Saint Gunko (Leader, Purple/Black, 5000, 4 Life, {Celestial Dragons}/{Holy Knights of God}).
 *
 * Card text (cards/data):
 *   "[Once Per Turn] When a Character is played from your trash, draw 2 cards and trash 1 card
 *    from your hand.
 *    [Activate: Main] [Once Per Turn] You may trash 1 card from your hand: If you have a Character
 *    with 8000 base power or more, add up to 1 DON!! card as active from your DON!! deck."
 *
 * Readings (docs/research/m6b-audit/OP-18.md Q18): any Character of yours played from your trash,
 * by any effect, once per turn; a Character played from hand does not count. The Activate cost is
 * paid first; the "If" is an effect condition read after the cost, on base power (printed).
 *
 * Scenery: OP18-084 Saint Gunko (Black, cost 1): [Activate: Main] rest 4 DON!!: play up to 1
 * {Holy Knights of God} Character with cost 6 or less from the trash. OP18-083 Saint Killingham
 * (Black, cost 5, {Holy Knights of God}) is the card played from the trash. OP02-007 Thatch is a
 * vanilla 8000 base power Character; OP02-006 Kingdew is a vanilla 7000 one.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  canActivate,
  cardIds,
  CH,
  choices,
  dbg,
  donOf,
  kind,
  mine,
  need,
  offeredAbilities,
  toMyNextMain,
  VAN,
} from './kit-d.ts';

const GUNKO = 'OP18-060';
const GUNKO_CHAR = 'OP18-084';
const KILLINGHAM = 'OP18-083';
const TOP = 'OP01-010';

/** p1 Main Phase: Leader, a Gunko character, two Killinghams in the trash, 5 active DON!! and 5 in the DON!! deck. */
function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}): TestGame {
  return mine(
    GUNKO,
    {
      characters: [GUNKO_CHAR],
      trash: [KILLINGHAM],
      hand: [VAN.sai, VAN.marco],
      deck: [TOP, TOP, TOP, TOP, TOP, TOP, TOP, TOP, TOP, TOP],
      costArea: { active: 8, rested: 0 },
      donDeck: 2,
      ...p1,
    },
    p2,
  );
}

/** Use the Gunko Character's [Activate: Main] (rest 4 DON!!, play from trash) and answer the trash pick. */
function playFromTrash(g: TestGame, card = KILLINGHAM, nth = 0) {
  const gunko = at(g, 'p1', 'characters', GUNKO_CHAR);
  const [ability] = offeredAbilities(g, gunko);
  act(g, { type: 'activate', card: gunko, ability: ability! });
  need(g, 'choose', 'p1');
  act(g, { type: 'pick', choice: g.find('p1', 'trash', card, nth) });
}

/** Settle the Leader's draw 2 / trash 1 after a play from the trash: trash `fodder`. */
function draw2trash1(g: TestGame, fodder: string) {
  need(g, 'choose', 'p1');
  act(g, { type: 'pick', choice: g.find('p1', 'hand', fodder) });
}

/** Start the Leader's [Activate: Main]. */
function startLeader(g: TestGame) {
  const [ability] = offeredAbilities(g, g.leader('p1'));
  act(g, { type: 'activate', card: g.leader('p1'), ability: ability! });
}

describe('OP18-060 Saint Gunko: [Once Per Turn] when a Character is played from your trash, draw 2 and trash 1', () => {
  it('a Character played from the trash from an effect: draw 2, then trash 1 card of my choice from hand', () => {
    const g = game();
    playFromTrash(g);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([GUNKO_CHAR, KILLINGHAM].sort());
    // Two cards drawn (hand 2 -> 4), then the pick to trash one is pending.
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(4);
    need(g, 'choose', 'p1');
    expect(choices(g)).toHaveLength(4);
    draw2trash1(g, VAN.sai);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(3);
    expect(cardIds(g, 'p1', 'hand')).not.toContain(VAN.sai);
    expect(cardIds(g, 'p1', 'trash')).toEqual([VAN.sai]);
    expect(kind(g)).toBe('main');
  });

  it('the card just played from the trash and a card just drawn are both valid cards to trash', () => {
    const g = game();
    playFromTrash(g);
    const drawn = g.zone('p1', 'hand').find((c) => c.card === TOP)!;
    expect(choices(g)).toContain(drawn.instance);
    act(g, { type: 'pick', choice: drawn.instance });
    expect(cardIds(g, 'p1', 'trash')).toEqual([TOP]);
  });

  it('[Once Per Turn]: a second Character played from the trash in the same turn draws nothing', () => {
    const g = game({ trash: [KILLINGHAM, KILLINGHAM] });
    playFromTrash(g);
    draw2trash1(g, VAN.sai);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(3);
    playFromTrash(g);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(3);
    expect(cardIds(g, 'p1', 'characters')).toHaveLength(3);
  });

  it('[Once Per Turn] resets: it works again on my next turn', () => {
    const g = game({ trash: [KILLINGHAM, KILLINGHAM] });
    playFromTrash(g);
    draw2trash1(g, VAN.sai);
    toMyNextMain(g);
    const before = cardIds(g, 'p1', 'hand').length;
    expect(canActivate(g, at(g, 'p1', 'characters', GUNKO_CHAR))).toBe(true);
    playFromTrash(g);
    // The turn draw happened before; now 2 more are drawn.
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(before + 2);
  });

  it('a Character played from hand does not trigger it', () => {
    const g = game({ hand: [VAN.sai, VAN.marco, 'OP01-018'] });
    play(g, g.find('p1', 'hand', 'OP01-018'));
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(2);
    expect(cardIds(g, 'p1', 'trash')).toEqual([KILLINGHAM]);
  });

  it('an "up to 1" pick of nothing plays nothing and so draws nothing', () => {
    const g = game();
    const gunko = at(g, 'p1', 'characters', GUNKO_CHAR);
    act(g, { type: 'activate', card: gunko, ability: offeredAbilities(g, gunko)[0]! });
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(2);
    expect(cardIds(g, 'p1', 'trash')).toEqual([KILLINGHAM]);
  });
});

describe('OP18-060 Saint Gunko: [Activate: Main] [Once Per Turn] trash 1: if I have a base 8000+ Character, add 1 active DON!!', () => {
  it('with an 8000 base power Character: trash 1 card, add 1 DON!! as active from the DON!! deck', () => {
    const g = game({ characters: [VAN.thatch] });
    const before = donOf(g, 'p1');
    startLeader(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    // "up to 1": a count may be asked; take 1.
    if (kind(g) === 'choose') act(g, { type: 'pick', choice: { option: '1' } });
    expect(cardIds(g, 'p1', 'trash').sort()).toEqual([KILLINGHAM, VAN.sai].sort());
    const after = donOf(g, 'p1');
    expect(after.active).toBe(before.active + 1);
    expect(after.rested).toBe(before.rested);
    expect(after.deck).toBe(before.deck - 1);
  });

  it('boundary: 7000 base power is not enough, but the cost stays paid and no DON!! is added', () => {
    const g = game({ characters: [CH.kingdew5] });
    const before = donOf(g, 'p1');
    startLeader(g);
    if (kind(g) === 'optional') act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    expect(cardIds(g, 'p1', 'hand')).toEqual([VAN.marco]);
    expect(donOf(g, 'p1')).toMatchObject({ active: before.active, deck: before.deck });
  });

  it('"base power": a 7000 Character with +1000 from a given DON!! (8000 current) does not count', () => {
    const g = game({ characters: [CH.kingdew5] });
    act(g, { type: 'giveDon', target: g.find('p1', 'characters', CH.kingdew5) });
    expect(g.power(g.find('p1', 'characters', CH.kingdew5))).toBe(8000);
    const before = donOf(g, 'p1');
    startLeader(g);
    if (kind(g) === 'optional') act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    expect(donOf(g, 'p1')).toMatchObject({ active: before.active, deck: before.deck });
  });

  it('"you have": an 8000 Character on the opponent’s side does not count', () => {
    const g = game({}, { characters: [VAN.thatch] });
    const before = donOf(g, 'p1');
    startLeader(g);
    if (kind(g) === 'optional') act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    expect(donOf(g, 'p1').deck).toBe(before.deck);
  });

  it('[Once Per Turn]: not offered a second time this turn, offered again next turn', () => {
    const g = game({ characters: [VAN.thatch] });
    startLeader(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    if (kind(g) === 'choose') act(g, { type: 'pick', choice: { option: '1' } });
    expect(kind(g)).toBe('main');
    expect(canActivate(g, g.leader('p1'))).toBe(false);
    toMyNextMain(g);
    expect(canActivate(g, g.leader('p1'))).toBe(true);
  });

  it('the cost needs a card in hand: with an empty hand it cannot be activated', () => {
    const g = game({ characters: [VAN.thatch], hand: [] });
    expect(canActivate(g, g.leader('p1'))).toBe(false);
    expect(dbg(g)).toContain('main');
  });
});
