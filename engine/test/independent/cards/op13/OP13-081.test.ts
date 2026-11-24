/**
 * OP13-081 Koala (Character, Black, cost 5, 6000, Counter +1000, {Revolutionary Army}/{Dressrosa}).
 *
 * Card text: "If your Leader has the "Revolutionary Army" type, this Character gains +3 cost.
 * [Activate: Main] [Once Per Turn] You may place 1 card from your trash at the bottom of your deck:
 * Give up to 1 rested DON!! card to your Leader or 1 of your Characters."
 *
 * Rules: CR 4-9 / 1-3-6-2 (cost modifications), CR 8-3-1-3 (an unpayable cost), CR 8-3-1-4 ("you
 * may" cost), CR 4-8-1 ("up to"), DON!! given are taken from the cost area (rested), CR 3-5-2 (the
 * trash is open), [Once Per Turn] (CR 10-2-13).
 * Leaders: OP07-001 Monkey.D.Dragon ({Revolutionary Army}), ST01-001 Luffy (no such type).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  ch,
  choices,
  deck,
  defend,
  don,
  kind,
  LD13,
  me,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  S13,
  trash,
  tryActivate,
  useAbility,
  BOUNCE,
  bounce,
  chars,
} from './kit-op13c.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import type { CardId } from '@optcg/engine';

const ID = 'OP13-081';

function field(
  leader: string,
  o: {
    trash?: CardId[];
    active?: number;
    rested?: number;
    chars?: CardId[];
    p2Leader?: string;
  } = {},
): TestGame {
  return me(
    leader,
    {
      characters: [ID, ...(o.chars ?? [])],
      trash: o.trash ?? [S13.c2],
      costArea: { active: o.active ?? 3, rested: o.rested ?? 2 },
    },
    {},
    o.p2Leader,
  );
}

describe('OP13-081 Koala: +3 cost while my Leader has the "Revolutionary Army" type', () => {
  it('Revolutionary Army Leader: cost 8; any other Leader: cost 5', () => {
    const a = field(LD13.ra);
    expect(a.card(at(a, 'p1', 'characters', ID)).cost).toBe(8);
    const b = field(LD13.plain);
    expect(b.card(at(b, 'p1', 'characters', ID)).cost).toBe(5);
  });

  it('must not: the opponent’s Revolutionary Army Leader does not raise my Koala’s cost', () => {
    const g = field(LD13.plain, { p2Leader: LD13.ra });
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(5);
  });

  it('the raised cost matters: the opponent’s "cost 6 or less" return effect can take a cost-5 Koala but not a cost-8 one', () => {
    const low = defend(LD13.plain, { characters: [ID] });
    bounce(low, at(low, 'p1', 'characters', ID));
    expect(chars(low)).toEqual([]);
    const high = defend(LD13.ra, { characters: [ID] });
    // Not a legal target: the choice is not offered (or the effect finds nothing).
    const lightning = high.find('p2', 'hand', BOUNCE);
    act(high, { type: 'playCard', card: lightning });
    need(high, 'optional', 'p2');
    act(high, { type: 'optional', accept: true });
    for (let i = 0; i < 5 && kind(high) === 'choose'; i++) {
      const pay = high
        .legal()
        .find((x) => x.type === 'pick' && typeof x.choice === 'object' && 'from' in x.choice);
      if (!pay) break;
      high.act(pay);
    }
    expect(choices(high)).not.toContain(at(high, 'p1', 'characters', ID));
  });
});

describe('OP13-081 Koala [Activate: Main] [Once Per Turn]: place 1 trash card at the bottom: give up to 1 rested DON!!', () => {
  it('pays with the chosen trash card (it goes to the BOTTOM of the deck) and gives 1 rested DON!! to my Leader', () => {
    const g = field(LD13.plain, { trash: [S13.c2, S13.c4] });
    const before = don(g);
    useAbility(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.c2, S13.c4].sort());
    pickInst(g, [at(g, 'p1', 'trash', S13.c4)]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(g.leader('p1'));
    pickInst(g, [g.leader('p1')]);
    expect(trash(g)).toEqual([S13.c2]);
    expect(deck(g)).toHaveLength(16);
    expect(deck(g)[deck(g).length - 1]).toBe(S13.c4);
    expect(don(g)).toMatchObject({
      given: before.given + 1,
      rested: before.rested - 1,
      active: before.active,
    });
  });

  it('may give the DON!! to one of my Characters instead; only my own Leader and Characters are candidates', () => {
    const g = me(
      LD13.plain,
      { characters: [ID, S13.c3], trash: [S13.c2], costArea: { active: 3, rested: 2 } },
      { characters: [S13.c4] },
    );
    useAbility(g, at(g, 'p1', 'characters', ID));
    // The cost has one candidate, so the engine may pay it by itself.
    if (kind(g) === 'choose' && offeredIds(g).includes(S13.c2))
      pickInst(g, [at(g, 'p1', 'trash', S13.c2)]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(ch(g, 'p1', S13.c3));
    expect(choices(g)).not.toContain(ch(g, 'p2', S13.c4));
    expect(choices(g)).not.toContain(g.leader('p2'));
    pickInst(g, [ch(g, 'p1', S13.c3)]);
    expect(don(g)).toMatchObject({ given: 1, rested: 1 });
    expect(g.power(ch(g, 'p1', S13.c3))).toBe(6000);
  });

  it('"up to 1": the DON!! may be left ungiven; the trash card stays paid', () => {
    const g = field(LD13.plain);
    useAbility(g, at(g, 'p1', 'characters', ID));
    if (kind(g) === 'choose' && offeredIds(g).includes(S13.c2))
      pickInst(g, [at(g, 'p1', 'trash', S13.c2)]);
    none(g);
    expect(don(g)).toMatchObject({ given: 0, rested: 2 });
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(16);
  });

  it('[Once Per Turn]: after it is used it is not offered again this turn', () => {
    const g = field(LD13.plain, { trash: [S13.c2, S13.c4] });
    useAbility(g, at(g, 'p1', 'characters', ID));
    pickInst(g, [at(g, 'p1', 'trash', S13.c2)]);
    pickInst(g, [g.leader('p1')]);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('CR 8-3-1-3: with an empty trash the cost cannot be paid and the ability is not usable', () => {
    const g = field(LD13.plain, { trash: [] });
    expect(tryActivate(g, at(g, 'p1', 'characters', ID))).toBe(false);
    expect(don(g)).toMatchObject({ given: 0, rested: 2 });
  });

  it('only RESTED DON!! can be given: with no rested DON!! nothing is given', () => {
    const g = field(LD13.plain, { active: 5, rested: 0 });
    const used = tryActivate(g, at(g, 'p1', 'characters', ID));
    if (used) {
      if (kind(g) === 'choose' && offeredIds(g).includes(S13.c2))
        pickInst(g, [at(g, 'p1', 'trash', S13.c2)]);
      if (kind(g) === 'choose') none(g);
    }
    expect(don(g)).toMatchObject({ given: 0, active: 5, rested: 0 });
  });

  it('must not: the active DON!! stay active; only a rested one is moved', () => {
    const g = field(LD13.plain);
    useAbility(g, at(g, 'p1', 'characters', ID));
    if (kind(g) === 'choose' && offeredIds(g).includes(S13.c2))
      pickInst(g, [at(g, 'p1', 'trash', S13.c2)]);
    pickInst(g, [g.leader('p1')]);
    expect(don(g).active).toBe(3);
  });
});
