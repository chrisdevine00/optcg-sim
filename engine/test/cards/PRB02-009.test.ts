/** PRB02-009 Mr.3(Galdino). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  dec,
  expectDecision,
  hand,
  pick,
  times,
  trash,
  V,
} from './helpers.ts';
import { cardsIn, mk, plantCharEffect, plantLeaderEffect } from './helpers-prbst.ts';
import { withAbilities, type Ability } from '../../src/testing.ts';

const ID = 'PRB02-009';
const REST_MINE = { rest: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } };

describe('PRB02-009 Mr.3(Galdino)', () => {
  /** p2's turn: p2's BLUE Character rests one of p1's Characters (the planted effect). */
  const start = (p1chars: (string | { card: string; rested: boolean })[] = [ID, V.c3]) =>
    mk(
      { characters: p1chars, hand: times(2, BLUE) },
      { characters: [BLUE] },
      { turn: 4, activePlayer: 'p2' },
    );
  const mr3 = (g: ReturnType<typeof start>) => g.find('p1', 'characters', ID);

  it('has [Blocker] (printed)', () => {
    const g = start();
    expect(g.card(mr3(g)).keywords).toContain('Blocker');
  });

  it("when rested by your opponent's effect, you may trash it and draw 2 cards", () => {
    const g = start();
    plantCharEffect(g, BLUE, REST_MINE);
    pick(g, [mr3(g)]);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(cardsIn(g, 'p1', 'trash')).toEqual([ID]);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([V.c3]);
    expect(hand(g, 'p1')).toHaveLength(4);
  });

  it("a Leader's effect counts too (any effect of the opponent)", () => {
    const g = start();
    plantLeaderEffect(g, REST_MINE);
    pick(g, [mr3(g)]);
    accept(g);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(hand(g, 'p1')).toHaveLength(4);
  });

  it('"you may": declined, it stays on the field rested and nothing is drawn', () => {
    const g = start();
    plantCharEffect(g, BLUE, REST_MINE);
    pick(g, [mr3(g)]);
    decline(g);
    expect(g.card(mr3(g)).rested).toBe(true);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('must not fire: an attack of its own (the rules rest the attacker)', () => {
    const g = mk({ characters: [ID], hand: times(2, BLUE) }, { characters: [V.c1] });
    g.act({ type: 'attack', attacker: mr3(g), target: g.leader('p2') });
    expect(dec(g)?.kind).not.toBe('optional');
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('must not fire: your own effect resting it', () => {
    const g = mk({ characters: [ID, V.c3], hand: times(2, BLUE) }, {});
    g.state = withAbilities(g.state, V.c3, [
      {
        id: 'p',
        kind: 'activate',
        when: 'activateMain',
        effect: [{ do: { rest: { from: 'characters', owner: 'you', pick: { exactly: 2 } } } }],
      } as unknown as Ability,
    ]);
    g.act({ type: 'activate', card: g.find('p1', 'characters', V.c3), ability: 'p' });
    while (dec(g)?.kind === 'choose') g.act(g.legal().find((a) => a.type === 'pick')!);
    expect(g.card(mr3(g)).rested).toBe(true);
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('must not fire: an already rested Mr.3 is not rested again', () => {
    const g = start([{ card: ID, rested: true }, V.c3]);
    plantCharEffect(g, BLUE, REST_MINE);
    pick(g, [mr3(g)]);
    expect(dec(g)?.kind).toBe('main');
    expect(trash(g, 'p1')).toEqual([]);
  });
});
