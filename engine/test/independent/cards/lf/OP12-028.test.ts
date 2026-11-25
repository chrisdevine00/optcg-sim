/**
 * OP12-028 Kouzuki Hiyori (Character, Green, cost 1, 0 power, Counter +1000, Wisdom, {Land of
 * Wano}/{Kouzuki Clan}).
 *
 * Card text: "[Activate: Main] You may rest 1 of your DON!! cards and this Character: If your Leader is
 * [Roronoa Zoro], look at 5 cards from the top of your deck; reveal up to 1 <Slash> attribute card
 * or green Event and add it to your hand. Then, place the rest at the bottom of your deck in any
 * order."
 *
 * Rules: the text before the colon is the cost (CR 8-3-1): rest 1 active DON!! and rest Hiyori, so
 * she must be active and 1 DON!! must be active; the "If" is after the colon, so it is an effect
 * condition: the activation is legal with another Leader and the cost is still paid, but nothing
 * resolves (CR 8-3-3); [Roronoa Zoro] is a name: "Roronoa Zoro & Sanji" is not it; the look:
 * "up to 1" may be none, only qualifying cards (a <Slash> card or a green Event) are offered,
 * the revealed card is added, the rest go to the bottom.
 * Scenery: OP01-001 Zoro and OP12-020 Zoro (both named [Roronoa Zoro]), ST12-001 Zoro & Sanji
 * (a different name), ST01-001 Luffy; Wire (Slash, green Character), Totsuka (green Event),
 * Guard Point (red Event), Shinobu (green, Special).
 */
import { describe, expect, it } from 'vitest';
import type { CardId } from '@optcg/engine';
import {
  at,
  atMain,
  canFinish,
  deck,
  describeLook13,
  don,
  hand,
  isRested,
  kind,
  LD_LF,
  mine,
  need,
  offeredAbilities,
  offeredIds,
  useAbility,
  VAN_LF,
  EV_LF,
} from './kit-lfa.ts';
import { settleOrders } from '../op17/kit-op17b.ts';

const HIYORI = 'OP12-028';
const TOTSUKA = 'OP02-047';
const ZORO_GREEN = 'OP12-020';
const ZORO_SANJI = 'ST12-001';
const { wire, shinobu, mohji } = VAN_LF;

function start(
  deckTopFirst: CardId[],
  o: { leader?: string; active?: number; rested?: number; hiyoriRested?: boolean } = {},
) {
  const g = mine(o.leader ?? LD_LF.zoro, {
    characters: [{ card: HIYORI, rested: o.hiyoriRested ?? false }],
    deck: deckTopFirst,
    costArea: { active: o.active ?? 10, rested: o.rested ?? 0 },
  });
  if (!o.hiyoriRested && (o.active ?? 10) > 0) useAbility(g, at(g, 'p1', 'characters', HIYORI));
  return g;
}

describeLook13({
  id: HIYORI,
  n: 5,
  start: (d) => start(d),
  match: [wire, TOTSUKA],
  miss: shinobu,
  edgeHit: TOTSUKA,
  edgeMiss: EV_LF.guardPoint,
});

const TOP: CardId[] = [
  wire,
  TOTSUKA,
  shinobu,
  shinobu,
  shinobu,
  ...Array.from({ length: 9 }, () => mohji),
];

describe('OP12-028 Kouzuki Hiyori: cost, Leader condition and printed values', () => {
  it('printed values: cost 1, 0 power, Counter +1000', () => {
    const g = mine(LD_LF.zoro, { characters: [HIYORI] });
    const h = at(g, 'p1', 'characters', HIYORI);
    expect(g.card(h).cost).toBe(1);
    expect(g.power(h)).toBe(0);
    expect(g.card(h).counter).toBe(1000);
  });

  it('the cost rests exactly 1 DON!! and Hiyori herself', () => {
    const g = start(TOP);
    expect(isRested(g, at(g, 'p1', 'characters', HIYORI))).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1 });
  });

  it('Hiyori cannot be activated a second time (she is rested)', () => {
    const g = start(TOP);
    need(g, 'choose', 'p1');
    g.act({ type: 'done' });
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', HIYORI))).toEqual([]);
  });

  it('a rested Hiyori cannot be activated', () => {
    const g = start(TOP, { hiyoriRested: true });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', HIYORI))).toEqual([]);
  });

  it('with no active DON!! (all rested) the cost cannot be paid: not offered', () => {
    const g = start(TOP, { active: 0, rested: 10 });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', HIYORI))).toEqual([]);
  });

  it('boundary: exactly 1 active DON!! pays the cost', () => {
    const g = start(TOP, { active: 1, rested: 9 });
    need(g, 'choose', 'p1');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 10 });
  });

  it('another Leader named [Roronoa Zoro] (OP12-020) works', () => {
    const g = start(TOP, { leader: ZORO_GREEN });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([wire, TOTSUKA].sort());
  });

  it('a Leader that is not [Roronoa Zoro] (Luffy): the cost is paid, nothing is looked at, nothing is added', () => {
    const g = mine(LD_LF.luffy, {
      characters: [HIYORI],
      deck: TOP,
      costArea: { active: 10, rested: 0 },
    });
    useAbility(g, at(g, 'p1', 'characters', HIYORI));
    expect(kind(g)).toBe('main');
    expect(isRested(g, at(g, 'p1', 'characters', HIYORI))).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1 });
    expect(deck(g)).toEqual(TOP);
    expect(hand(g)).toEqual([]);
  });

  it('"Roronoa Zoro & Sanji" is a different name: no look', () => {
    const g = mine(ZORO_SANJI, {
      characters: [HIYORI],
      deck: TOP,
      costArea: { active: 10, rested: 0 },
    });
    useAbility(g, at(g, 'p1', 'characters', HIYORI));
    expect(kind(g)).toBe('main');
    expect(deck(g)).toEqual(TOP);
  });

  it('a green Character that is not <Slash> (Shinobu) and a red Event are not offered', () => {
    const g = start([
      shinobu,
      EV_LF.guardPoint,
      wire,
      ...Array.from({ length: 2 }, () => mohji),
      ...TOP.slice(5),
    ]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([wire]);
    expect(canFinish(g)).toBe(true);
  });
});
