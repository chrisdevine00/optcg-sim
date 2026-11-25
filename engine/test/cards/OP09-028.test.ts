/** OP09-028 Sanji. */
import { describe, expect, it } from 'vitest';
import { accept, dec, decline, expectDecision, hand, none, option, pick, V } from './helpers.ts';
import {
  canPick,
  ids,
  koByEffect,
  mk,
  ODY,
  OPP,
  plantOpponentEffect,
  SHC,
} from './helpers-a09g1.ts';

const ID = 'OP09-028';
const trashPile = [SHC.c3, ODY.c4, V.c2, SHC.c5, SHC.c4];
const start = (p1: object = {}) => {
  const g = mk({ characters: [ID], life: [V.c1, V.c2, V.c3], trash: trashPile, ...p1 });
  koByEffect(g, 'p1', ID);
  return g;
};

describe('OP09-028 Sanji', () => {
  it('[On K.O.]: add 1 Life card to your hand: play up to 1 {ODYSSEY} or {Straw Hat Crew} Character with cost 4 or less from your trash, rested', () => {
    const g = start();
    expectDecision(g, 'optional', 'p1');
    accept(g);
    option(g, 'top');
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(g.life('p1')).toBe(2);
    expect(canPick(g, g.find('p1', 'trash', SHC.c3))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', ODY.c4))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', SHC.c4))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', SHC.c5))).toBe(false); // cost 5
    expect(canPick(g, g.find('p1', 'trash', V.c2))).toBe(false); // neither type
    expect(canPick(g, g.find('p1', 'trash', ID))).toBe(false); // Sanji himself: cost 5
    pick(g, [g.find('p1', 'trash', ODY.c4)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ODY.c4]);
    expect(g.card(g.find('p1', 'characters', ODY.c4)).rested).toBe(true);
  });

  it('the Life card may be taken from the bottom', () => {
    const g = start();
    accept(g);
    option(g, 'bottom');
    expect(hand(g, 'p1')).toEqual([V.c3]);
    expect(g.life('p1')).toBe(2);
    pick(g, [g.find('p1', 'trash', SHC.c3)]);
    expect(ids(g, 'p1', 'characters')).toEqual([SHC.c3]);
  });

  it('may be declined: no Life card is taken and nothing is played', () => {
    const g = start();
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.life('p1')).toBe(3);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('"up to 1": the Life card stays in hand when you play nothing', () => {
    const g = start();
    accept(g);
    option(g, 'top');
    none(g);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('with no Life cards the cost cannot be paid: the effect does not happen', () => {
    const g = start({ life: [] });
    if (dec(g)?.kind === 'optional') {
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      decline(g);
    }
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(g.zone('p1', 'trash')).toHaveLength(trashPile.length + 1);
  });

  it('is not an [On K.O.] when Sanji is returned to the hand by an effect (nothing is offered)', () => {
    const g = mk({ characters: [ID], life: [V.c1], trash: trashPile }, {}, OPP);
    plantOpponentEffect(g, {
      move: {
        what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
        to: { zone: 'hand' },
      },
    });
    pick(g, [g.find('p1', 'characters', ID)]);
    expectDecision(g, 'main', 'p2');
    expect(hand(g, 'p1')).toEqual([ID]);
    expect(g.life('p1')).toBe(1);
  });
});
