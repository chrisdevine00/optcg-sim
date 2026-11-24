/** OP17-057 Fullalead. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  endCounter,
  expectDecision,
  game,
  PLAIN_BLUE,
  pick,
  takeDamage,
  ROCKS,
  trash,
  V,
} from './helpers.ts';

const ID = 'OP17-057';
/** OP17-053 Barbell: a {Rocks Pirates} Character whose effects do not act on an attack. */
const ROCKS_CHAR = 'OP17-053';

describe('OP17-057 Fullalead', () => {
  const attacked = (extra: { hand?: string[]; characters?: string[]; leader?: string } = {}) => {
    const g = game(
      {
        leader: extra.leader ?? ROCKS,
        stage: ID,
        hand: extra.hand ?? [BLUE],
        characters: extra.characters ?? [ROCKS_CHAR, V.c1],
      },
      { leader: PLAIN_BLUE, characters: [V.c6] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c6), target: g.leader('p1') });
    return g;
  };

  it('you may rest this Stage and trash 1 card: up to 1 {Rocks Pirates} Leader or Character gains +1000 power during this battle', () => {
    const g = attacked();
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    // The Rocks Leader and the Rocks Character are offered, the other Character is not.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
    expect(trash(g, 'p1')).toEqual([BLUE]);
    g.act({ type: 'block', blocker: null });
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a {Rocks Pirates} Character may be chosen instead', () => {
    const g = attacked();
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    const c = g.find('p1', 'characters', ROCKS_CHAR);
    pick(g, [c]);
    expect(g.power(c)).toBe(8000);
  });

  it('declining pays nothing: the Stage stays active and the card stays in hand', () => {
    const g = attacked();
    decline(g);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(false);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with an empty hand the cost cannot be paid', () => {
    const g = attacked({ hand: [] });
    // The prompt is shown but cannot be accepted: there is no card to trash.
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(false);
  });

  it('with a Leader and Characters that are not {Rocks Pirates} the cost may be paid but nothing gains power', () => {
    const g = attacked({ leader: PLAIN_BLUE, characters: [V.c1] });
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
  });
});
