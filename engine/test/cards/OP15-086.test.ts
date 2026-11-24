/** OP15-086 Nami. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import {
  canAttack,
  donArea,
  mine,
  names,
  offers,
  OTHER_LEADER,
  SHC_BASE8000,
  SHC_C4,
  SHC_C7,
  SHC_C8,
  SHC_LEADER,
} from './helpers-op15g3.ts';

const ID = 'OP15-086';

describe('OP15-086 Nami', () => {
  const start = (leader: string, trash: string[]) =>
    mine({ leader, hand: [ID], trash, ...donArea(8) }, { characters: [V.c1] });

  it('[On Play] with a {Straw Hat Crew} Leader plays a {Straw Hat Crew} Character with cost 7 or less from the trash, and it gains [Rush] this turn', () => {
    const g = start(SHC_LEADER, [SHC_C7]);
    play(g, ID);
    pick(g, [g.find('p1', 'trash', SHC_C7)]);
    const jinbe = g.find('p1', 'characters', SHC_C7);
    expect(g.card(jinbe).keywords).toContain('Rush');
    expect(g.card(jinbe).rested).toBe(false);
    // Rush: it can attack the turn it comes in (Nami herself cannot).
    expect(canAttack(g, jinbe, g.leader('p2'))).toBe(true);
    expect(canAttack(g, g.find('p1', 'characters', ID), g.leader('p2'))).toBe(false);
  });

  it('the cost bound is 7: a cost 8 Character and a non-{Straw Hat Crew} Character are not candidates', () => {
    const g = start(SHC_LEADER, [SHC_C8, V.c1, SHC_C4]);
    play(g, ID);
    expect(offers(g, g.find('p1', 'trash', SHC_C8))).toBe(false);
    expect(offers(g, g.find('p1', 'trash', V.c1))).toBe(false);
    expect(offers(g, g.find('p1', 'trash', SHC_C4))).toBe(true);
    none(g);
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('the Rush is for this turn only and only for the Character played by the effect', () => {
    const g = start(SHC_LEADER, [SHC_BASE8000]);
    play(g, ID);
    pick(g, [g.find('p1', 'trash', SHC_BASE8000)]);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Rush');
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', SHC_BASE8000)).keywords).not.toContain('Rush');
  });

  it('with a Leader that is not {Straw Hat Crew} nothing is played', () => {
    const g = start(OTHER_LEADER, [SHC_C4]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
    expect(names(g, 'p1', 'trash')).toEqual([SHC_C4]);
  });

  it('"up to 1": the player may play none', () => {
    const g = start(SHC_LEADER, [SHC_C4]);
    play(g, ID);
    none(g);
    expect(names(g, 'p1', 'trash')).toEqual([SHC_C4]);
  });
});
