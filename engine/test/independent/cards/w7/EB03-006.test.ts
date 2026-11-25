/**
 * EB03-006 Nami (Character, Red, cost 5, 7000, {Alabasta}/{Straw Hat Crew}, Wisdom).
 *
 * Card text (verified, minus signs restored over optcgapi): "[On Play] You may give your active
 * Leader −5000 power during this turn: Draw 1 card.
 * [Activate: Main] [Once Per Turn] If your Leader has the {Alabasta} type, give up to 1 of your
 * opponent's Characters −1000 power during this turn."
 *
 * Rules: CR 8-3-1 (an optional cost: declining skips the effect; the cost is paid in full or not
 * at all), "active Leader" = not rested, rules-digest 112 (an [On Play] with a cost may be
 * declined and the card is still played), a colon-less "If" is an effect condition (the ability
 * fires and its [Once Per Turn] is spent even when the check fails), CR 4-8-1 ("up to"), "during
 * this turn" ends at the End Phase (CR 6-6-1-3), CR 2-4-3 (exact type {Alabasta}).
 * Scenery (printed): OP04-001 Nefeltari Vivi (Leader, 5000, {Alabasta}, cannot attack, DON!!-cost
 * [Activate: Main]); ST01-001 Luffy (Leader, 5000, {Straw Hat Crew}/{Supernovas}, not {Alabasta});
 * OP01-023 Marco (cost 3, 5000), OP02-006 Kingdew (cost 5, 7000) vanilla Characters.
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import { decision } from '../../helpers.ts';
import { myTurn, side } from '../kit.ts';
import {
  anomalies,
  BLUE,
  handOf,
  L7,
  mayEnd,
  need,
  no,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  put,
  RED,
  S7,
  toMyNextMain,
  unusable,
  useAbility,
  yes,
} from './kit-w7a.ts';

const ID = 'EB03-006';

/** Nami in hand with 5 active DON!!; p2 has Marco and Kingdew. */
function hand(leader: PlayerSpec['leader'] = L7.viviAlabasta, o: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(L7.luffy, BLUE, { leader, hand: [ID], costArea: { active: 5, rested: 0 }, ...o }),
    side(L7.crocodile, RED, { characters: [S7.c3, S7.c5] }),
  );
}

/** Nami already on the field (not just played), my Leader as given. */
function field(leader: PlayerSpec['leader'] = L7.viviAlabasta, o: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(L7.luffy, BLUE, { leader, characters: [ID], costArea: { active: 1, rested: 0 }, ...o }),
    side(L7.crocodile, RED, { characters: [S7.c3, S7.c5] }),
  );
}

describe('EB03-006 Nami: [On Play] you may give your active Leader -5000 power: draw 1', () => {
  it('printed effect: accepting lowers my Leader to 0 for the turn and draws 1 card', () => {
    const g = hand();
    const before = g.zone('p1', 'hand').length - 1;
    const deck = g.zone('p1', 'deck').length;
    put(g, ID);
    yes(g, 'p1');
    expect(decision(g)?.kind).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(0);
    expect(g.zone('p1', 'hand')).toHaveLength(before + 1);
    expect(g.zone('p1', 'deck')).toHaveLength(deck - 1);
    expect(g.find('p1', 'characters', ID)).toBeTruthy();
    expect(anomalies(g)).toBe(0);
  });

  it('declining: the Leader keeps its power, nothing is drawn, Nami is still played', () => {
    const g = hand();
    put(g, ID);
    no(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.find('p1', 'characters', ID)).toBeTruthy();
  });

  it('a rested Leader is not an "active Leader": the cost cannot be paid and nothing is drawn', () => {
    const g = hand({ card: L7.viviAlabasta, rested: true });
    put(g, ID);
    unusable(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.find('p1', 'characters', ID)).toBeTruthy();
  });

  it('the -5000 lasts for this turn only', () => {
    const g = hand();
    put(g, ID);
    yes(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(0);
    toMyNextMain(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("it takes the Leader's power only: the Leader with DON!! given pays from its current power", () => {
    const g = hand({ card: L7.viviAlabasta, don: 2 } as unknown as PlayerSpec['leader']);
    expect(g.power(g.leader('p1'))).toBe(7000);
    put(g, ID);
    yes(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(2000);
  });

  it('the Leader is the only card lowered: Nami and my other Characters keep their power', () => {
    const g = hand(L7.viviAlabasta, { characters: [S7.c3] });
    put(g, ID);
    yes(g, 'p1');
    expect(g.power(g.find('p1', 'characters', S7.c3))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(7000);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('Nami can use her [Activate: Main] on the turn she was played', () => {
    const g = hand();
    put(g, ID);
    yes(g, 'p1');
    expect(offeredAbilities(g, g.find('p1', 'characters', ID))).toHaveLength(1);
  });
});

describe('EB03-006 Nami: [Activate: Main] [Once Per Turn] with an {Alabasta} Leader, give up to 1 opposing Character -1000 power', () => {
  it('printed effect: the chosen opposing Character is 1000 lower this turn', () => {
    const g = field();
    const nami = g.find('p1', 'characters', ID);
    const marco = g.find('p2', 'characters', S7.c3);
    useAbility(g, nami);
    need(g, 'choose', 'p1');
    pickInst(g, [marco]);
    expect(decision(g)?.kind).toBe('main');
    expect(g.power(marco)).toBe(4000);
    expect(g.power(g.find('p2', 'characters', S7.c5))).toBe(7000);
    expect(anomalies(g)).toBe(0);
  });

  it('only the opponent\'s Characters are offered; "up to 1" allows none', () => {
    const g = field(L7.viviAlabasta, { characters: [ID, S7.c1] });
    useAbility(g, g.find('p1', 'characters', ID));
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([S7.c3, S7.c5].sort());
    expect(mayEnd(g)).toBe(true);
  });

  it('a Leader that is not {Alabasta}: the ability fires with no effect and no prompt', () => {
    const g = field(L7.luffy);
    const nami = g.find('p1', 'characters', ID);
    useAbility(g, nami);
    expect(decision(g)?.kind).toBe('main');
    expect(g.power(g.find('p2', 'characters', S7.c3))).toBe(5000);
    expect(g.power(g.find('p2', 'characters', S7.c5))).toBe(7000);
  });

  it('a colon-less "If" is an effect condition: failing it still spends the [Once Per Turn]', () => {
    const g = field(L7.luffy);
    const nami = g.find('p1', 'characters', ID);
    useAbility(g, nami);
    expect(offeredAbilities(g, nami)).toEqual([]);
  });

  it('[Once Per Turn]: after one use it is not offered again this turn, and it is offered next turn', () => {
    const g = field();
    const nami = g.find('p1', 'characters', ID);
    useAbility(g, nami);
    pickInst(g, [g.find('p2', 'characters', S7.c3)]);
    expect(offeredAbilities(g, nami)).toEqual([]);
    toMyNextMain(g);
    expect(offeredAbilities(g, g.find('p1', 'characters', ID))).toHaveLength(1);
  });

  it('choosing nobody ("up to 1") still spends the [Once Per Turn]', () => {
    const g = field();
    const nami = g.find('p1', 'characters', ID);
    useAbility(g, nami);
    none(g);
    expect(g.power(g.find('p2', 'characters', S7.c3))).toBe(5000);
    expect(offeredAbilities(g, nami)).toEqual([]);
  });

  it("the -1000 ends with the turn: the Character has its full power in the opponent's turn", () => {
    const g = field();
    const marco = g.find('p2', 'characters', S7.c3);
    useAbility(g, g.find('p1', 'characters', ID));
    pickInst(g, [marco]);
    expect(g.power(marco)).toBe(4000);
    g.act({ type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(g.find('p2', 'characters', S7.c3))).toBe(5000);
  });

  it("the Leader's type decides, not Nami's own {Alabasta} type: a non-{Alabasta} Leader with Nami gives nothing", () => {
    const g = field(L7.crocodile);
    const nami = g.find('p1', 'characters', ID);
    useAbility(g, nami);
    expect(decision(g)?.kind).toBe('main');
    expect(g.power(g.find('p2', 'characters', S7.c3))).toBe(5000);
  });

  it("the type condition looks at the Leader's type, not its state: a rested {Alabasta} Leader still qualifies", () => {
    const g = field({ card: L7.viviAlabasta, rested: true });
    useAbility(g, g.find('p1', 'characters', ID));
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', S7.c5)]);
    expect(g.power(g.find('p2', 'characters', S7.c5))).toBe(6000);
  });

  it('hand size is untouched by the Activate effect', () => {
    const g = field(L7.viviAlabasta, { hand: [S7.c1] as CardId[] });
    useAbility(g, g.find('p1', 'characters', ID));
    pickInst(g, [g.find('p2', 'characters', S7.c3)]);
    expect(handOf(g, 'p1')).toEqual([S7.c1]);
  });
});
