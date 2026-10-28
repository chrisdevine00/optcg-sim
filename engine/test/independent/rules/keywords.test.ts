/**
 * Battle keywords (rules digest §J items 95–99; CR 10-1).
 * Keyword cards come from verified overrides (`keywords` in the card JSON). They are placed on the
 * field by the scenario, so their [On Play] text never runs; none has an [On Block] or a mandatory
 * [When Attacking].
 */
import { describe, expect, it } from 'vitest';
import { scenario, type ScenarioInput } from '../../fixtures/index.ts';
import {
  attack,
  canAttack,
  decision,
  FILL,
  fill,
  K,
  L,
  noDefence,
  play,
  result,
  TRIGGER_SPEED,
  V,
} from '../helpers.ts';

type Side = Partial<ScenarioInput['p1']>;

function game(p1: Side, p2: Side = {}) {
  return scenario({
    p1: { leader: L.redLuffy, life: fill(FILL.red, 5), deck: fill(FILL.red, 10), ...p1 },
    p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: fill(FILL.purple, 10), ...p2 },
  });
}

describe('[Rush] (CR 10-1-1)', () => {
  it('CR 10-1-1-1: a [Rush] Character may attack on the turn it is played', () => {
    // ST21-014 Monkey.D.Luffy: Red, cost 5, 6000, [Rush]; no [On Play].
    const g = game({ hand: [K.rushLuffy], costArea: { active: 5, rested: 0 } });
    play(g, g.find('p1', 'hand', K.rushLuffy));
    const luffy = g.find('p1', 'characters', K.rushLuffy);
    expect(g.card(luffy).keywords).toContain('Rush');
    expect(canAttack(g, luffy, g.leader('p2'))).toBe(true);
  });

  it('CR 3-7-4 / 10-1-1-1: without [Rush], a Character played this turn may not attack', () => {
    // OP01-023 Marco: vanilla, placed as played this turn.
    const g = game({ characters: [{ card: V.marco, playedThisTurn: true }] });
    expect(canAttack(g, g.find('p1', 'characters', V.marco), g.leader('p2'))).toBe(false);
  });
});

describe('[Rush: Character] (CR 10-1-6)', () => {
  // OP17-048 Shiki: Blue, cost 7, 9000, [Rush: Character]; its other text is optional.
  it('CR 10-1-6-1: on the turn it is played it may attack Characters but not the Leader', () => {
    const g = game(
      { leader: L.blueCrocodile, characters: [{ card: K.rushCharShiki, playedThisTurn: true }] },
      { characters: [{ card: V.dobon, rested: true }] },
    );
    const shiki = g.find('p1', 'characters', K.rushCharShiki);
    expect(g.card(shiki).keywords).toContain('Rush: Character');
    expect(canAttack(g, shiki, g.find('p2', 'characters', V.dobon))).toBe(true);
    expect(canAttack(g, shiki, g.leader('p2'))).toBe(false);
  });

  it('CR 10-1-6-1: on a later turn it may attack the Leader as usual', () => {
    const g = game({ leader: L.blueCrocodile, characters: [K.rushCharShiki] });
    expect(canAttack(g, g.find('p1', 'characters', K.rushCharShiki), g.leader('p2'))).toBe(true);
  });
});

describe('[Double Attack] (CR 10-1-2)', () => {
  // OP13-118 Monkey.D.Luffy: Green, cost 6, 7000, [Double Attack].
  const da = (p2Life: string[]) =>
    game({ leader: L.greenKid, characters: [K.doubleLuffy] }, { life: p2Life });

  it('CR 10-1-2-1 / 7-1-4-1-1-3: [Double Attack] deals 2 damage to the Leader', () => {
    const g = da(fill(FILL.purple, 3));
    const luffy = g.find('p1', 'characters', K.doubleLuffy);
    expect(g.card(luffy).keywords).toContain('Double Attack');
    attack(g, luffy, g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(1);
    expect(g.zone('p2', 'hand')).toHaveLength(2);
  });

  it('CR 10-1-2-1 / 7-1-4-1-1-1: [Double Attack] against 1 Life takes it and does not win', () => {
    const g = da([FILL.purple]);
    attack(g, g.find('p1', 'characters', K.doubleLuffy), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(0);
    expect(g.zone('p2', 'hand')).toHaveLength(1);
    expect(result(g)).toBeNull();
    expect(decision(g)).toMatchObject({ kind: 'main', player: 'p1' });
  });

  it('CR 7-1-4-1-1-1: [Double Attack] against 0 Life wins', () => {
    const g = da([]);
    attack(g, g.find('p1', 'characters', K.doubleLuffy), g.leader('p2'));
    noDefence(g);
    expect(result(g)).toMatchObject({ winner: 'p1' });
  });
});

describe('[Banish] (CR 10-1-3)', () => {
  // OP17-065 Queen: Purple, cost 9, 10000, [Banish]. p2's top Life card is OP01-104 Speed,
  // which has "[Trigger] Play this card."
  const banish = (p2Life: string[]) =>
    game({ leader: L.purpleKaido, characters: [K.banishQueen] }, { life: p2Life });

  it('CR 10-1-3-1: the Life card is trashed instead of added to hand, and no [Trigger] is offered', () => {
    const g = banish([TRIGGER_SPEED, FILL.purple, FILL.purple]);
    const queen = g.find('p1', 'characters', K.banishQueen);
    expect(g.card(queen).keywords).toContain('Banish');
    attack(g, queen, g.leader('p2'));
    noDefence(g);
    expect(decision(g)).toMatchObject({ kind: 'main', player: 'p1' });
    expect(g.life('p2')).toBe(2);
    expect(g.zone('p2', 'hand')).toHaveLength(0);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([TRIGGER_SPEED]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it('CR 10-1-3-1 / 7-1-4-1-1-1: [Banish] does not change the 0-Life win', () => {
    const g = banish([]);
    attack(g, g.find('p1', 'characters', K.banishQueen), g.leader('p2'));
    noDefence(g);
    expect(result(g)).toMatchObject({ winner: 'p1' });
  });
});
