/** OP12-075 Ms. All Sunday. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  dec,
  don,
  expectDecision,
  game,
  hand,
  none,
  option,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  pick,
  V,
} from './helpers.ts';
import { damageWith } from './triggers.ts';
import { atMain, ids, offeredPicks } from './helpers-w6c2.ts';

const ID = 'OP12-075';
const mk = (p2: Partial<PlayerSpec> = {}) =>
  game(
    { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 4, rested: 0 } },
    {
      leader: PLAIN_BLUE,
      characters: [V.c3, V.c4],
      costArea: { active: 3, rested: 0 },
      donDeck: 7,
      ...p2,
    },
  );
const cast = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });

describe('OP12-075 Ms. All Sunday', () => {
  it('[On Play]: K.O. up to 1 Character with cost 3 or less (4 is not a target); then the opponent may add a DON!! active', () => {
    const g = mk();
    cast(g);
    expect(offeredPicks(g)).toEqual([g.find('p2', 'characters', V.c3)]);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c4]);
    // The question is the opponent's, and the answer adds from their own DON!! deck.
    const d = expectDecision(g, 'choose', 'p2');
    expect(d.options?.map((o) => o.label)).toEqual(['Add 1 DON!! (active)', 'Do not add']);
    option(g, '0');
    expect(don(g, 'p2')).toMatchObject({ active: 4, deck: 6 });
    expect(don(g, 'p1').deck).toBe(10 - 4);
    expect(atMain(g)).toBe(true);
  });

  it('the opponent may decline, and then gets no DON!!', () => {
    const g = mk();
    cast(g);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    option(g, '1');
    expect(don(g, 'p2')).toMatchObject({ active: 3, deck: 7 });
    expect(atMain(g)).toBe(true);
  });

  it('"Then" is not "If you do": the opponent is asked even when nothing was K.O.\'d', () => {
    const none3 = mk({ characters: [V.c4] });
    cast(none3);
    // No target for the K.O. (up to 1, asked at max 0), then the opponent's question.
    if (dec(none3)?.player === 'p1') none(none3);
    expectDecision(none3, 'choose', 'p2');
    option(none3, '0');
    expect(don(none3, 'p2').active).toBe(4);
    expect(ids(none3, 'p2', 'characters')).toEqual([V.c4]);

    const declined = mk();
    cast(declined);
    none(declined);
    expectDecision(declined, 'choose', 'p2');
    option(declined, '0');
    expect(ids(declined, 'p2', 'characters')).toEqual([V.c3, V.c4]);
    expect(don(declined, 'p2').active).toBe(4);
  });

  it('"up to 1": only one Character is K.O.\'d when two qualify', () => {
    const g = mk({ characters: [V.c3, V.c3] });
    cast(g);
    pick(g, [g.find('p2', 'characters', V.c3, 0)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c3]);
    expectDecision(g, 'choose', 'p2');
  });

  it('with an empty DON!! deck the opponent adds nothing', () => {
    const g = mk({ donDeck: 0, costArea: { active: 10, rested: 0 } });
    cast(g);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    if (dec(g)?.kind === 'choose' && dec(g)?.player === 'p2') option(g, '0');
    expect(don(g, 'p2')).toMatchObject({ active: 10, deck: 0 });
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('[Trigger] DON!! -1: play this card; not offered with no DON!! on the field, and declining adds it to the hand', () => {
    const g = damageWith(ID, { costArea: { active: 1, rested: 0 } });
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(don(g, 'p1').deck).toBe(10);

    const none0 = damageWith(ID);
    expect(none0.isLegal({ type: 'trigger', activate: true, player: 'p1' })).toBe(false);
    none0.act({ type: 'trigger', activate: false });
    expect(hand(none0, 'p1')).toContain(ID);
  });
});
