/** ST18-003 San-Gorou. */
import { describe, expect, it } from 'vitest';
import { dec, hand, pick, V } from './helpers.ts';
import { withAbilities, type Ability } from '../../src/testing.ts';
import { attack, finishBattle, mk } from './helpers-st1821.ts';

const ID = 'ST18-003';

const start = (active: number, don = 0) =>
  mk({
    characters: [{ card: ID, don }],
    costArea: { active, rested: 0 },
    deck: [V.c3, V.c4, V.c5],
    hand: [],
  });

describe('ST18-003 San-Gorou', () => {
  it('[When Attacking] with 8 DON!! on the field: draws 1 card', () => {
    const g = start(8);
    attack(g, g.find('p1', 'characters', ID));
    expect(hand(g, 'p1')).toEqual([V.c3]);
    finishBattle(g);
  });

  it('boundary: 7 DON!! draws nothing', () => {
    const g = start(7);
    attack(g, g.find('p1', 'characters', ID));
    expect(hand(g, 'p1')).toEqual([]);
    finishBattle(g);
  });

  it('DON!! given to San-Gorou count toward the 8 (6 in the cost area + 2 given)', () => {
    const g = start(6, 2);
    attack(g, g.find('p1', 'characters', ID));
    expect(hand(g, 'p1')).toEqual([V.c3]);
    finishBattle(g);
  });

  it('draws exactly 1 (not per DON!!), and the attack carries on to the block step', () => {
    const g = start(10);
    attack(g, g.find('p1', 'characters', ID));
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(dec(g)?.kind).toBe('block');
    finishBattle(g);
  });

  it('[Once Per Turn] (B3B-R5): a second attack by the same San-Gorou in one turn draws nothing', () => {
    const g = start(8);
    const sg = g.find('p1', 'characters', ID);
    attack(g, sg);
    finishBattle(g);
    expect(hand(g, 'p1')).toEqual([V.c3]);
    // Set San-Gorou active again (a planted Leader effect) and attack a second time.
    const leader = g.leader('p1');
    g.state = withAbilities(g.state, g.card(leader).card, [
      {
        id: 'planted',
        kind: 'activate',
        when: 'activateMain',
        effect: [{ do: { setActive: { from: 'characters', owner: 'you', pick: { upTo: 1 } } } }],
      } as unknown as Ability,
    ]);
    g.act({ type: 'activate', card: leader, ability: 'planted' });
    pick(g, [sg]);
    expect(g.card(sg).rested).toBe(false);
    attack(g, sg);
    finishBattle(g);
    expect(hand(g, 'p1')).toEqual([V.c3]);
  });

  it('each San-Gorou has its own Once Per Turn: two of them each draw when they attack', () => {
    const g = mk({
      characters: [ID, ID],
      costArea: { active: 8, rested: 0 },
      deck: [V.c3, V.c4, V.c5],
      hand: [],
    });
    attack(g, g.find('p1', 'characters', ID, 0));
    finishBattle(g);
    attack(g, g.find('p1', 'characters', ID, 1));
    expect(hand(g, 'p1')).toEqual([V.c3, V.c4]);
    finishBattle(g);
  });
});
