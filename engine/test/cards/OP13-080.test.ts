/** OP13-080 St. Ethanbaron V. Nusjuro. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import {
  canAttack,
  canPick,
  idsOf,
  koedInBattle,
  mine,
  plantOpponentEffect,
  rep,
} from './helpers-op13g3.ts';

const ID = 'OP13-080';
const KO = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };

describe('OP13-080 St. Ethanbaron V. Nusjuro', () => {
  const trashOf = (n: number) => rep(n, V.c1);

  it("with 7 or more cards in your trash it cannot be removed from the field by your opponent's effects", () => {
    const g = mine({ characters: [ID], trash: trashOf(7) }, {}, 6);
    g.act({ type: 'endTurn' });
    plantOpponentEffect(g, KO);
    // It can still be chosen, but the K.O. does nothing.
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(idsOf(g, 'p1', 'trash')).toHaveLength(7);
  });

  it('boundary: with 6 cards in the trash an opposing effect K.O.s it', () => {
    const g = mine({ characters: [ID], trash: trashOf(6) }, {}, 6);
    g.act({ type: 'endTurn' });
    plantOpponentEffect(g, KO);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });

  it('the protection is only against effects: a battle K.O. still removes it', () => {
    const g = koedInBattle(ID, { leader: 'ST01-001', trash: trashOf(7) });
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(idsOf(g, 'p1', 'trash')).toContain(ID);
  });

  it('with 7 or more cards in the trash it gains [Rush] (attacks the turn it is played); with 6 it cannot', () => {
    const seven = mine({ hand: [ID], trash: trashOf(7) }, {}, 6);
    play(seven, ID);
    expect(canAttack(seven, seven.find('p1', 'characters', ID), seven.leader('p2'))).toBe(true);
    const six = mine({ hand: [ID], trash: trashOf(6) }, {}, 6);
    play(six, ID);
    expect(canAttack(six, six.find('p1', 'characters', ID), six.leader('p2'))).toBe(false);
  });

  it('[When Attacking] with 10 or more cards in your trash: give up to 1 opposing Character -2000 power during this turn', () => {
    const g = mine({ characters: [ID], trash: trashOf(10) }, { characters: [V.c3] }, 6);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(3000);
  });

  it('boundary: with 9 cards in the trash [When Attacking] does nothing (no prompt)', () => {
    const g = mine({ characters: [ID], trash: trashOf(9) }, { characters: [V.c3] }, 6);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
  });

  it('[When Attacking] "up to 1": may give nothing; only Characters are targets (not the Leader)', () => {
    const g = mine({ characters: [ID], trash: trashOf(10) }, { characters: [V.c3] }, 6);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expect(canPick(g, g.leader('p2'))).toBe(false);
    none(g);
    expectDecision(g, 'block', 'p2');
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
  });
});
