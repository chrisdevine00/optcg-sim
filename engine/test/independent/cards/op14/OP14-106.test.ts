/**
 * OP14-106 Salome (Character, Yellow, cost 3, 1000, Counter +1000, [Blocker]).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.)
 * [Trigger] Play this card."
 *
 * Rules: CR 10-1-4, CR 10-1-5 ([Trigger]: no cost is paid, the card is played), CR 3-7-6-1
 * (Character area limit of 5).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  blockers,
  BLUE,
  block,
  chars,
  hitLeader,
  activateTrigger,
  kind,
  LD14,
  need,
  passCounter,
  pickInst,
  SC14,
  theirs,
  trash,
  hand,
  don,
} from './kit-op14d.ts';

const ID = 'OP14-106';

function lifeHit(o: { chars?: string[]; p2chars?: string[] } = {}) {
  const g = theirs(
    LD14.neutral,
    { life: [ID, BLUE, BLUE, BLUE], characters: o.chars ?? [] },
    { characters: o.p2chars ?? [SC14.c4] },
  );
  hitLeader(g);
  need(g, 'trigger', 'p1');
  return g;
}

describe('OP14-106 Salome: [Blocker]; [Trigger] play this card', () => {
  it('has the printed [Blocker] keyword and can block an attack on my Leader', () => {
    const g = theirs(LD14.neutral, { characters: [ID] }, {});
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
    block(g, at(g, 'p1', 'characters', ID));
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('[Trigger]: activating plays it as an ACTIVE Character, without paying its cost of 3 (no DON!! available)', () => {
    const g = lifeHit();
    expect(don(g, 'p1').active).toBe(0);
    activateTrigger(g);
    expect(atMain(g, 'p2')).toBe(true);
    const c = g.zone('p1', 'characters');
    expect(c.map((x) => x.card)).toEqual([ID]);
    expect(c[0]!.rested).toBe(false);
    expect(g.life('p1')).toBe(3);
    expect(trash(g)).toEqual([]);
  });

  it("once played by its [Trigger] it can block the opponent's next attack that turn", () => {
    const g = lifeHit({ p2chars: [SC14.c4, SC14.c5] });
    activateTrigger(g);
    attack(g, g.find('p2', 'characters', SC14.c4), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
  });

  it('declining the [Trigger]: Salome goes to my hand and nothing is played', () => {
    const g = lifeHit();
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ID]);
    expect(chars(g)).toEqual([]);
  });

  it('with 5 Characters already in play I must trash one to make room (CR 3-7-6-1), then Salome enters', () => {
    const g = lifeHit({ chars: [SC14.c2, SC14.c2, SC14.c2, SC14.c4, SC14.c5] });
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', SC14.c5)]);
    expect(chars(g)).toEqual([ID, SC14.c2, SC14.c2, SC14.c2, SC14.c4].sort());
    expect(trash(g)).toEqual([SC14.c5]);
  });

  it('is a plain 1000-power Character when blocking: it is K.O.d by a 5000 attacker and trashed', () => {
    const g = theirs(LD14.neutral, { characters: [ID] }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    block(g, at(g, 'p1', 'characters', ID));
    passCounter(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('Counter +1000 from hand: lifts my 5000 Leader over a 5000 attack but only ties a 6000 attack', () => {
    const run = (attacker: string) => {
      const g = theirs(
        LD14.neutral,
        { hand: [ID], life: [BLUE, BLUE, BLUE, BLUE] },
        { characters: [attacker] },
      );
      attack(g, g.find('p2', 'characters', attacker), g.leader('p1'));
      need(g, 'block', 'p1');
      g.act({ type: 'block', blocker: null });
      g.act({ type: 'counter', card: g.find('p1', 'hand', ID), target: g.leader('p1') });
      expect(g.power(g.leader('p1'))).toBe(6000);
      g.act({ type: 'endCounter' });
      return g;
    };
    expect(run(SC14.c2 /* 4000 */).life('p1')).toBe(4);
    const hit = run(SC14.c4 /* 6000 */);
    expect(kind(hit)).toBe('trigger');
  });

  it('a [Trigger] Salome that is not played stays out of play for good: nothing in play after a declined trigger and a later turn', () => {
    const g = lifeHit();
    g.act({ type: 'trigger', activate: false });
    g.act({ type: 'endTurn' });
    expect(chars(g)).toEqual([]);
  });

  it('must not play itself when it is not taken as damage: a Salome in my hand is not played by anything', () => {
    const g = theirs(LD14.neutral, { hand: [ID] }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(kind(g)).toBe('block');
    expect(chars(g)).toEqual([]);
  });
});
