/**
 * EB04-024 Terracotta (Character, cost 2, 0 power, Counter +2000, {Alabasta}).
 *
 * Card text: "[Activate: Main] You may rest this Character and trash 1 card from your hand: Up to 1 of
 * your {Alabasta} type Characters gains [Unblockable] during this turn. (This card cannot be blocked.)"
 *
 * Rules: CR 8-3-1-3/-4 (costs: rest this Character AND trash 1 card from hand; an unusable cost
 * cannot be paid), [Unblockable] (CR 10-1-?: a [Blocker] cannot be declared), "up to 1"
 * (CR 8-4-4-1), "during this turn" ends with the turn.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  blockers,
  choices,
  endTurn,
  hand,
  kind,
  LE,
  mayChooseNone,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  payHand,
  pickInst,
  SN,
  trash,
  useAbility,
} from './kit-eb04a.ts';

const TERRA = 'EB04-024';

function field(p1: Parameters<typeof mine>[1] = {}) {
  return mine(
    LE.luffy,
    { characters: [TERRA, SN.karoo1, SN.c2], hand: [SN.c1, SN.c3], ...p1 },
    { characters: [SN.blocker] },
  );
}
const terra = (g: ReturnType<typeof field>) => at(g, 'p1', 'characters', TERRA);
const karoo = (g: ReturnType<typeof field>) => at(g, 'p1', 'characters', SN.karoo1);

/** Activate, pay the hand card, and give the keyword to `target` (a card id of mine). */
function grant(g: ReturnType<typeof field>, target: string, cost = SN.c1) {
  useAbility(g, terra(g));
  need(g, 'choose');
  payHand(g, [cost]);
  need(g, 'choose');
  pickInst(g, [at(g, 'p1', 'characters', target)]);
}

describe('EB04-024 Terracotta: [Activate: Main] rest this Character and trash 1 card: an {Alabasta} Character gains [Unblockable] this turn', () => {
  it('printed values: cost 2, 0 power, Counter +2000', () => {
    const g = field();
    const c = g.card(terra(g));
    expect(c.cost).toBe(2);
    expect(c.power).toBe(0);
    expect(c.counter).toBe(2000);
  });

  it('control: without the effect the opposing [Blocker] may block my attacker', () => {
    const g = field();
    attack(g, karoo(g), g.leader('p2'));
    expect(blockers(g)).toHaveLength(1);
  });

  it('pays (Terracotta rests, 1 hand card is trashed); the chosen {Alabasta} Character cannot be blocked', () => {
    const g = field();
    grant(g, SN.karoo1);
    expect(kind(g)).toBe('main');
    expect(g.card(terra(g)).rested).toBe(true);
    expect(trash(g)).toEqual([SN.c1]);
    expect(hand(g)).toEqual([SN.c3]);
    expect(g.card(karoo(g)).keywords).toContain('Unblockable');
    attack(g, karoo(g), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('only {Alabasta} Characters are candidates (Terracotta herself is one, a non-{Alabasta} Character is not); "up to 1" allows none', () => {
    const g = field();
    useAbility(g, terra(g));
    payHand(g, [SN.c1]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([TERRA, SN.karoo1].sort());
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', SN.c2));
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.card(karoo(g)).keywords).not.toContain('Unblockable');
  });

  it('must not happen: the chosen Character gets it, the other {Alabasta} Character does not', () => {
    const g = field({ characters: [TERRA, SN.karoo1, SN.cobra5] });
    grant(g, SN.karoo1);
    expect(g.card(at(g, 'p1', 'characters', SN.cobra5)).keywords).not.toContain('Unblockable');
    expect(g.card(karoo(g)).keywords).toContain('Unblockable');
  });

  it('cost: Terracotta already rested cannot pay "rest this Character", so the ability is not usable', () => {
    const g = field({ characters: [{ card: TERRA, rested: true }, SN.karoo1] });
    if (offeredAbilities(g, terra(g)).length) {
      useAbility(g, terra(g));
      if (kind(g) === 'optional') act(g, { type: 'optional', accept: false });
    }
    expect(trash(g)).toEqual([]);
    expect(g.card(karoo(g)).keywords).not.toContain('Unblockable');
  });

  it('cost: with an empty hand nothing can be trashed, so nothing is granted', () => {
    const g = field({ hand: [] });
    if (offeredAbilities(g, terra(g)).length) {
      useAbility(g, terra(g));
      if (kind(g) === 'optional') act(g, { type: 'optional', accept: false });
    }
    expect(g.card(terra(g)).rested).toBe(false);
    expect(g.card(karoo(g)).keywords).not.toContain('Unblockable');
  });

  it('the keyword lasts this turn only', () => {
    const g = field();
    grant(g, SN.karoo1);
    endTurn(g);
    endTurn(g);
    expect(g.card(karoo(g)).keywords).not.toContain('Unblockable');
  });

  it('Terracotta may give it to herself, but, rested by the cost, she cannot attack with it', () => {
    const g = field();
    grant(g, TERRA);
    expect(g.card(terra(g)).keywords).toContain('Unblockable');
    expect(g.card(terra(g)).rested).toBe(true);
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === terra(g))).toBe(false);
  });
});
