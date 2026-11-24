/** OP13-109 Jewelry Bonney. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, dec, pick, PLAIN_PURPLE, PURPLE, V } from './helpers.ts';
import { koByBattle, names, plantOpponentEffect, rep, theirs, trig } from './helpers-op13g4.ts';

const ID = 'OP13-109';
const koIt = { ko: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } };
const bounce = {
  move: {
    what: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } },
    to: { zone: 'hand' },
  },
};

describe('OP13-109 Jewelry Bonney', () => {
  const run = (
    action: Record<string, unknown>,
    life: Parameters<typeof theirs>[0]['life'] = rep(3, BLUE),
  ) => {
    const g = theirs({ leader: PLAIN_PURPLE, characters: [ID], life });
    plantOpponentEffect(g, action);
    return g;
  };

  it('if an opponent effect would K.O. it: may turn the top Life card face-up instead', () => {
    const g = run(koIt);
    accept(g);
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.life('p1')).toBe(3);
  });

  it('also replaces being returned to the hand ("removed from the field")', () => {
    const g = run(bounce);
    accept(g);
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
  });

  it('declining lets the removal happen and the Life card stays face-down', () => {
    const g = run(koIt);
    decline(g);
    expect(names(g, 'p1', 'characters')).toEqual([]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
  });

  it('when the top Life card is already face-up the cost cannot be paid: it is removed', () => {
    const g = run(koIt, [{ card: BLUE, faceUp: true }, BLUE]);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(names(g, 'p1', 'characters')).toEqual([]);
  });

  it("a battle K.O. is not replaced (only the opponent's effects)", () => {
    const g = koByBattle({ leader: PLAIN_PURPLE, life: rep(3, BLUE) }, ID);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(names(g, 'p1', 'characters')).toEqual([]);
  });

  it('[Trigger] draws 2 and trashes 1 card from the hand', () => {
    const g = trig(ID, { leader: PLAIN_PURPLE, hand: [V.c1], deck: [BLUE, PURPLE, V.c2] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(g.zone('p1', 'hand')).toHaveLength(2);
    expect(names(g, 'p1', 'trash')).toContain(V.c1);
  });
});
