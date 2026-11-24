/** EB04-024 Terracotta. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, trash } from './helpers.ts';
import {
  activateAb,
  ALA5,
  at,
  canActivate,
  canPick,
  isRested,
  mk,
  RED_LEADER,
  V,
} from './helpers-eb04g1.ts';

const ID = 'EB04-024';
/** [Trafalgar Law] (ST10-010): a scripted card whose only text is [Blocker] (keywords come from scripts). */
const BLOCKER = 'ST10-010';
const keywordsOf = (g: ReturnType<typeof mk>, card: string, nth = 0) =>
  g.card(at(g, 'p1', 'characters', card, nth)).keywords;

describe('EB04-024 Terracotta', () => {
  const start = (h = [V.c1]) =>
    mk({ leader: RED_LEADER, hand: h, characters: [ID, ALA5, V.c3] }, { characters: [V.c3] });

  it('[Activate: Main] rest this Character and trash 1 card from hand: an {Alabasta} Character gains [Unblockable] this turn', () => {
    const g = start();
    activateAb(g, at(g, 'p1', 'characters', ID), 'activate');
    pick(g, [g.find('p1', 'hand', V.c1)]); // the trash cost
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, at(g, 'p1', 'characters', V.c3))).toBe(false); // not {Alabasta}
    expect(canPick(g, at(g, 'p1', 'characters', ALA5))).toBe(true);
    pick(g, [at(g, 'p1', 'characters', ALA5)]);
    expect(keywordsOf(g, ALA5)).toContain('Unblockable');
    expect(isRested(g, at(g, 'p1', 'characters', ID))).toBe(true);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('the granted [Unblockable] stops a Blocker: it cannot block (control: it can without the grant)', () => {
    const blockers = (g: ReturnType<typeof mk>) =>
      g.legal().filter((a) => a.type === 'block' && a.blocker !== null);
    const run = (grant: boolean) => {
      const g = mk(
        { leader: RED_LEADER, hand: [V.c1], characters: [ID, ALA5] },
        { characters: [BLOCKER] },
      );
      if (grant) {
        activateAb(g, at(g, 'p1', 'characters', ID), 'activate');
        pick(g, [g.find('p1', 'hand', V.c1)]);
        pick(g, [at(g, 'p1', 'characters', ALA5)]);
      }
      g.act({
        type: 'attack',
        attacker: at(g, 'p1', 'characters', ALA5),
        target: g.leader('p2'),
      });
      expectDecision(g, 'block', 'p2');
      return blockers(g).length;
    };
    expect(run(false)).toBe(1);
    expect(run(true)).toBe(0);
  });

  it('Terracotta herself can be the target (she is an {Alabasta})', () => {
    const g = start();
    activateAb(g, at(g, 'p1', 'characters', ID), 'activate');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(canPick(g, at(g, 'p1', 'characters', ID))).toBe(true);
    pick(g, [at(g, 'p1', 'characters', ID)]);
    expect(keywordsOf(g, ID)).toContain('Unblockable');
  });

  it('"up to 1": the target may be skipped (the cost stays paid)', () => {
    const g = start();
    activateAb(g, at(g, 'p1', 'characters', ID), 'activate');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    none(g);
    expect(keywordsOf(g, ALA5)).not.toContain('Unblockable');
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it('the keyword lasts this turn only', () => {
    const g = start();
    activateAb(g, at(g, 'p1', 'characters', ID), 'activate');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    pick(g, [at(g, 'p1', 'characters', ALA5)]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(keywordsOf(g, ALA5)).not.toContain('Unblockable');
  });

  it('cannot be activated with no hand card, or while Terracotta is rested', () => {
    expect(canActivate(start([]), at(start([]), 'p1', 'characters', ID), 'activate')).toBe(false);
    const g = mk({
      leader: RED_LEADER,
      hand: [V.c1],
      characters: [{ card: ID, rested: true }],
    });
    expect(canActivate(g, at(g, 'p1', 'characters', ID), 'activate')).toBe(false);
  });
});
