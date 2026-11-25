/** EB02-009 Thousand Sunny. */
import { describe, expect, it } from 'vitest';
import { dec, game, none, pick, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { activate, atMain, given, offeredAb, pickableCardIds, SHC3, SN4 } from './helpers-w7c1.ts';

const ID = 'EB02-009';

describe('EB02-009 Thousand Sunny', () => {
  const mk = (p1: object = {}) =>
    game(
      { leader: { card: PLAIN_PURPLE, don: 2 }, stage: ID, characters: [SN4, SHC3, V.c1], ...p1 },
      { leader: PLAIN_BLUE },
    );
  const go = (g: ReturnType<typeof mk>) => {
    activate(g, g.find('p1', 'stage', ID), 'activate');
  };

  it('you may rest this Stage: 1 given DON!! goes from your Leader to a {Straw Hat Crew} Character', () => {
    const g = mk();
    go(g);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
    pick(g, [g.leader('p1')]);
    pick(g, [g.find('p1', 'characters', SN4)]);
    expect(given(g, g.leader('p1'))).toBe(1);
    expect(given(g, g.find('p1', 'characters', SN4))).toBe(1);
    expect(atMain(g)).toBe(true);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('only {Straw Hat Crew} Characters receive: not another type, not the Leader, not a Stage', () => {
    const g = mk();
    go(g);
    pick(g, [g.leader('p1')]);
    expect(pickableCardIds(g).sort()).toEqual([SHC3, SN4].sort());
  });

  it('the DON!! may come from a Character, and are given to a different {Straw Hat Crew} Character', () => {
    const g = mk({
      leader: PLAIN_PURPLE,
      characters: [{ card: SN4, don: 1 }, { card: V.c1, don: 1 }, SHC3],
    });
    go(g);
    // Two cards have DON!! given: either may be the source (a Leader with none is not offered).
    expect(pickableCardIds(g).sort()).toEqual([SN4, V.c1].sort());
    pick(g, [g.find('p1', 'characters', SN4)]);
    // The source is never the destination: the only other {Straw Hat Crew} Character receives
    // (one candidate, so nothing is asked).
    expect(dec(g)?.kind).toBe('main');
    expect(given(g, g.find('p1', 'characters', SN4))).toBe(0);
    expect(given(g, g.find('p1', 'characters', SHC3))).toBe(1);
    expect(given(g, g.find('p1', 'characters', V.c1))).toBe(1);
  });

  it('"up to 1": choosing no source moves nothing, and the Stage stays rested (the cost is paid)', () => {
    const g = mk();
    go(g);
    none(g);
    expect(given(g, g.leader('p1'))).toBe(2);
    expect(given(g, g.find('p1', 'characters', SN4))).toBe(0);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
    expect(atMain(g)).toBe(true);
  });

  it('must not move anything with no DON!! given or no {Straw Hat Crew} Character; a rested Stage is not offered', () => {
    const noDon = mk({ leader: PLAIN_PURPLE });
    go(noDon);
    expect(dec(noDon)?.kind).toBe('main');
    expect(noDon.eventsOfType('DonMoved')).toHaveLength(0);
    // The rest cost was paid anyway: activating is the choice.
    expect(noDon.card(noDon.find('p1', 'stage', ID)).rested).toBe(true);

    const noShc = mk({ characters: [V.c1] });
    go(noShc);
    expect(noShc.eventsOfType('DonMoved')).toHaveLength(0);
    expect(given(noShc, noShc.leader('p1'))).toBe(2);

    const rested = mk({ stage: { card: ID, rested: true } });
    expect(offeredAb(rested, rested.find('p1', 'stage', ID), 'activate')).toBe(false);
  });
});
