/**
 * OP10-024 Edward.Newgate (Character, Green, cost 5, 6000, Counter +1000, {The Four Emperors}/
 * {Whitebeard Pirates}/{ODYSSEY}).
 *
 * Card text: "[On Play] If you have 2 or more rested Characters, rest up to 1 of your opponent's
 * Characters with a cost of 5 or less. Then, K.O. up to 1 of your opponent's rested Characters with
 * a cost of 3 or less."
 *
 * Rules: the "If" has no colon: an effect condition over the whole sentence; a "Then" after a failed
 * "If" does not resolve (M4b-5), so with fewer than 2 rested Characters nothing at all happens. The
 * Newgate being played is active, so it does not count itself. Each "up to 1" may be none. The K.O.
 * looks at the board after the rest, so a Character just rested with cost 3 or less can be K.O.'d.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  cardIds,
  kind,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  VAN,
  type Chars,
} from './kit-op10a.ts';

const NEWGATE = 'OP10-024';

const rest = (card: string) => ({ card, rested: true });

function start(
  mineChars: Chars,
  oppChars: Chars,
  mineExtra: Parameters<typeof mine>[1] = {},
  leader: Parameters<typeof mine>[0] = 'ST01-001',
) {
  const g = mine(
    leader,
    { hand: [NEWGATE], characters: mineChars, ...mineExtra },
    { characters: oppChars },
  );
  playRaw(g, NEWGATE);
  return g;
}

const restedP2 = (g: ReturnType<typeof start>, card: string) =>
  g.card(at(g, 'p2', 'characters', card)).rested;

describe('OP10-024 Edward.Newgate: [On Play] with 2+ rested Characters, rest a cost-5 Character, then K.O. a rested cost-3 Character', () => {
  it('printed values: cost 5, 6000, Counter +1000', () => {
    const g = mine('ST01-001', { hand: [NEWGATE] });
    const c = g.find('p1', 'hand', NEWGATE);
    expect(g.card(c).cost).toBe(5);
    expect(g.card(c).counter).toBe(1000);
    expect(g.power(c)).toBe(6000);
  });

  it('with 2 rested Characters: rests an opposing cost-5 Character, then K.O.s a rested cost-3 one', () => {
    const g = start(
      [rest(VAN.sai), rest(VAN.marco)],
      [VAN.kingdew, { card: VAN.marco, rested: true }],
    );
    need(g, 'choose', 'p1');
    pickCards(g, [VAN.kingdew]);
    need(g, 'choose', 'p1');
    pickCards(g, [VAN.marco]);
    expect(restedP2(g, VAN.kingdew)).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VAN.kingdew]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([VAN.marco]);
    expect(kind(g)).toBe('main');
  });

  it('boundary: with only 1 rested Character nothing is asked and nothing happens (the Then is gated too)', () => {
    const g = start([rest(VAN.sai)], [VAN.kingdew, { card: VAN.marco, rested: true }]);
    expect(kind(g)).toBe('main');
    expect(restedP2(g, VAN.kingdew)).toBe(false);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('the Newgate just played is active and does not count itself: 1 other rested Character is not enough', () => {
    const g = start([rest(VAN.sai)], [VAN.kingdew]);
    expect(g.card(at(g, 'p1', 'characters', NEWGATE)).rested).toBe(false);
    expect(kind(g)).toBe('main');
    expect(restedP2(g, VAN.kingdew)).toBe(false);
  });

  it('only Characters count: a rested Leader and rested DON!! do not make up the 2', () => {
    const g = start(
      [rest(VAN.sai)],
      [VAN.kingdew],
      { costArea: { active: 5, rested: 5 } },
      { card: 'ST01-001', rested: true },
    );
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(kind(g)).toBe('main');
    expect(restedP2(g, VAN.kingdew)).toBe(false);
  });

  it("the opponent's rested Characters do not count as mine", () => {
    const g = start([rest(VAN.sai)], [rest(VAN.kingdew), rest(VAN.marco)]);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('boundary on the rest: cost 5 is offered, cost 6 is not', () => {
    const g = start([rest(VAN.sai), rest(VAN.marco)], [VAN.kingdew, VAN.thatch, VAN.hajrudin]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([VAN.kingdew, VAN.hajrudin].sort());
  });

  it('boundary on the K.O.: only rested Characters of cost 3 or less are offered (cost 4 is not)', () => {
    const g = start(
      [rest(VAN.sai), rest(VAN.marco)],
      [{ card: VAN.hajrudin, rested: true }, { card: VAN.sai, rested: true }, VAN.komachiyo],
    );
    need(g, 'choose', 'p1');
    none(g); // the rest step: choose nobody
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([VAN.sai]);
  });

  it("the K.O. sees the board after the rest: a cost-3 Character just rested can be K.O.'d", () => {
    const g = start([rest(VAN.sai), rest(VAN.marco)], [VAN.marco]);
    need(g, 'choose', 'p1');
    pickCards(g, [VAN.marco]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([VAN.marco]);
    pickCards(g, [VAN.marco]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
  });

  it('"up to 1" on the rest: may rest nobody and still K.O. an already-rested cost-3 Character', () => {
    const g = start(
      [rest(VAN.sai), rest(VAN.marco)],
      [VAN.kingdew, { card: VAN.marco, rested: true }],
    );
    none(g);
    need(g, 'choose', 'p1');
    pickCards(g, [VAN.marco]);
    expect(restedP2(g, VAN.kingdew)).toBe(false);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VAN.kingdew]);
  });

  it('"up to 1" on the K.O.: may K.O. nobody', () => {
    const g = start(
      [rest(VAN.sai), rest(VAN.marco)],
      [VAN.kingdew, { card: VAN.marco, rested: true }],
    );
    pickCards(g, [VAN.kingdew]);
    none(g);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(2);
  });
});
