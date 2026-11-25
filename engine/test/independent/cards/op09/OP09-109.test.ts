/**
 * OP09-109 Jaguar.D.Saul (Character, Yellow, cost 3, 5000, no Counter, {Giant}/{Navy}/{Ohara},
 * Strike).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.)
 * [Trigger] If your Leader is [Nico Robin], play this card."
 *
 * Rules: "[Nico Robin]" is an exact card name. An activated [Trigger] whose condition fails sends
 * the card to the trash (CR 10-1-5-3); a [Trigger] play costs nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  atMain,
  attack,
  blockers,
  chr,
  hand,
  LD9,
  lifeCards,
  mine,
  need,
  onField,
  SC9,
  theirs,
  trash,
  triggerGame,
  don,
} from './kit-op09c.ts';

const SAUL = 'OP09-109';

describe('OP09-109 Jaguar.D.Saul: [Blocker]; [Trigger] if my Leader is [Nico Robin], play this card', () => {
  it('printed values: cost 3, 5000, no Counter, keyword [Blocker]', () => {
    const g = mine(LD9.robin, { characters: [SAUL] }, {});
    const c = g.card(chr(g, 'p1', SAUL));
    expect(c.cost).toBe(3);
    expect(c.power).toBe(5000);
    expect(c.counter ?? null).toBeNull();
    expect(c.keywords).toContain('Blocker');
  });

  it('[Blocker]: can block an attack on my Leader', () => {
    const g = theirs(LD9.robin, { characters: [SAUL] }, { characters: [SC9.c3] });
    attack(g, chr(g, 'p2', SC9.c3), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([chr(g, 'p1', SAUL)]);
  });

  it('[Trigger] with a [Nico Robin] Leader: Saul is played, active, and I keep my Life count minus the hit', () => {
    const g = triggerGame(SAUL, { leader: LD9.robin });
    activateTrigger(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(onField(g, SAUL)).toBe(true);
    expect(g.zone('p1', 'characters')[0]!.rested).toBe(false);
    expect(lifeCards(g)).toHaveLength(2);
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toEqual([]);
  });

  it('[Trigger] works with the other [Nico Robin] Leader (EB05-010) as well', () => {
    const g = triggerGame(SAUL, { leader: LD9.robin2 });
    activateTrigger(g);
    expect(onField(g, SAUL)).toBe(true);
  });

  it('[Trigger] costs nothing: no DON!! is needed or spent', () => {
    const g = triggerGame(SAUL, { leader: LD9.robin });
    expect(don(g)).toMatchObject({ active: 0, rested: 0 });
    activateTrigger(g);
    expect(onField(g, SAUL)).toBe(true);
    expect(don(g)).toMatchObject({ active: 0, rested: 0 });
  });

  it('[Trigger] with a Leader that is not [Nico Robin]: the activated card is trashed, not played', () => {
    const g = triggerGame(SAUL, { leader: LD9.luffy });
    activateTrigger(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g)).toEqual([SAUL]);
    expect(hand(g)).toEqual([]);
  });

  it('[Trigger] with a Leader of the same colours/type but another name (Straw Hat Crew Leader ST29-001): not played', () => {
    const g = triggerGame(SAUL, { leader: LD9.egghead });
    activateTrigger(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g)).toEqual([SAUL]);
  });

  it('[Trigger] has no Life or board condition: a low Life count does not matter', () => {
    const g = triggerGame(SAUL, { leader: LD9.robin, before: 1 });
    activateTrigger(g);
    expect(onField(g, SAUL)).toBe(true);
  });

  it('declining the [Trigger]: Saul goes to my hand, nothing is played', () => {
    const g = triggerGame(SAUL, { leader: LD9.robin });
    act(g, { type: 'trigger', activate: false });
    expect(hand(g)).toEqual([SAUL]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g)).toEqual([]);
  });

  it('a Saul played by his [Trigger] can block the next attack of that turn', () => {
    const g = triggerGame(SAUL, { leader: LD9.robin, p2: { characters: [SC9.c3] } });
    activateTrigger(g);
    attack(g, chr(g, 'p2', SC9.c3), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([chr(g, 'p1', SAUL)]);
  });
});
