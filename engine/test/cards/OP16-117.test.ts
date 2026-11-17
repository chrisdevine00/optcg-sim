/** OP16-117 Black Hole: [Main] trash a [Trigger] card: negate a cost 8 or less Character; [Trigger] add a {Blackbeard Pirates} card from trash. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { BLACKBEARD, ENEL, ids, TRIG, triggerHit } from './helpers-robin.ts';

const EV = 'OP16-117';
/** Borsalino: cost 5 with [Blocker]; Linlin: cost 10. */
const BORSALINO = 'EB04-058';
const LINLIN = 'OP17-112';

const setup = () =>
  game(
    { leader: ENEL, hand: [EV, TRIG, BLUE], costArea: { active: 2, rested: 0 } },
    { leader: PLAIN_BLUE, characters: [BORSALINO, LINLIN] },
  );

describe('OP16-117 Black Hole', () => {
  it('[Main] trash a [Trigger] card: negates a Character with a cost of 8 or less this turn', () => {
    const g = setup();
    const b = g.find('p2', 'characters', BORSALINO);
    expect(g.card(b).keywords).toContain('Blocker');
    play(g, EV);
    accept(g);
    pick(g, [g.find('p1', 'hand', TRIG)]);
    // Only the cost 5 Character is a target (Linlin has a cost of 10).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [b]);
    expect(g.card(b).keywords).not.toContain('Blocker');
    expect(ids(g, 'p1', 'trash').sort()).toEqual([EV, TRIG].sort());
    expectDecision(g, 'main', 'p1');
  });

  it('the cost may be declined: nothing is trashed or negated', () => {
    const g = setup();
    play(g, EV);
    decline(g);
    expect(hand(g, 'p1')).toEqual([TRIG, BLUE]);
    expect(g.card(g.find('p2', 'characters', BORSALINO)).keywords).toContain('Blocker');
  });

  it('with no card with a [Trigger] in hand the cost cannot be paid', () => {
    const g = game(
      { leader: ENEL, hand: [EV, BLUE], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [BORSALINO] },
    );
    play(g, EV);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(g.card(g.find('p2', 'characters', BORSALINO)).keywords).toContain('Blocker');
  });

  it('"up to 1": the target may be left out after paying', () => {
    const g = setup();
    play(g, EV);
    accept(g);
    pick(g, [g.find('p1', 'hand', TRIG)]);
    none(g);
    expect(g.card(g.find('p2', 'characters', BORSALINO)).keywords).toContain('Blocker');
    expect(ids(g, 'p1', 'trash')).toContain(TRIG);
  });

  it('[Trigger] adds up to 1 {Blackbeard Pirates} card from the trash to your hand', () => {
    const g = triggerHit(EV, { trash: [V.c1, BLACKBEARD, PURPLE] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'trash', BLACKBEARD)]);
    expect(hand(g, 'p1')).toEqual([BLACKBEARD]);
  });

  it('[Trigger] with no {Blackbeard Pirates} card in the trash does nothing', () => {
    const g = triggerHit(EV, { trash: [V.c1] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([]);
  });
});
