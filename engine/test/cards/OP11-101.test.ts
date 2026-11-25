/** OP11-101 Capone"Gang"Bege. */
import { describe, expect, it } from 'vitest';
import type { Step } from '@optcg/cards';
import { project, type ProjectedView } from '@optcg/engine';
import { withAbilities } from '../../src/testing.ts';
import {
  accept,
  decline,
  dec,
  game,
  hand,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from './helpers.ts';
import { atMain, canAccept, ids, SN3, SN4 } from './helpers-w7c1.ts';
import { main } from './m6b-w1/probe.ts';

const ID = 'OP11-101';
/** The name of OP14-008 Scratchmen Apoo (the card SN3 is). */
const SN3_NAME = 'Scratchmen Apoo';
/** The opponent's probe card: an [Activate: Main] that does `step` to one of its opponent's Characters. */
const bounce: Step = {
  do: {
    move: {
      what: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } },
      to: { zone: 'hand' },
    },
  },
};
const ko: Step = {
  do: { ko: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } },
};

describe('OP11-101 Capone"Gang"Bege', () => {
  /** p2's turn: its Character (PURPLE) runs `step` against p1. */
  const mk = (step: Step = bounce, p1: object = {}) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [ID, SN3, V.c1], ...p1 },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, PURPLE, [main([step])]);
    return g;
  };
  const strike = (g: ReturnType<typeof mk>, target: string) => {
    g.act({ type: 'activate', card: g.find('p2', 'characters', PURPLE), ability: 'a' });
    pick(g, [g.find('p1', 'characters', target)]);
  };

  it('is a [Blocker]', () => {
    const g = mk();
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('a {Supernovas} Character removed by an opponent effect may go to the top of your Life face-down instead', () => {
    const g = mk();
    strike(g, SN3);
    expect(dec(g)?.kind).toBe('optional');
    accept(g);
    expect(ids(g, 'p1', 'characters').sort()).toEqual([ID, V.c1].sort());
    const life = g.zone('p1', 'life');
    expect(life.map((c) => c.card)[0]).toBe(SN3);
    expect(life[0]!.faceUp).toBe(false);
    expect(g.life('p1')).toBe(4);
    expect(hand(g, 'p1')).not.toContain(SN3);
    // You know the card you put there; your opponent does not.
    expect((project(g.state, 'p1') as unknown as ProjectedView).known['p1.life.0']).toBe(SN3);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('works against a K.O. effect too', () => {
    const g = mk(ko);
    strike(g, SN3);
    accept(g);
    expect(ids(g, 'p1', 'life')[0]).toBe(SN3);
    expect(ids(g, 'p1', 'trash')).not.toContain(SN3);
  });

  it('"you may": declining lets the removal happen', () => {
    const g = mk();
    strike(g, SN3);
    decline(g);
    expect(hand(g, 'p1')).toContain(SN3);
    expect(g.life('p1')).toBe(3);
  });

  it('must not apply to Bege himself ("other than"), nor to a Character that is not a {Supernovas}', () => {
    const self = mk();
    strike(self, ID);
    expect(canAccept(self)).toBe(false);
    expect(hand(self, 'p1')).toContain(ID);

    const plain = mk();
    strike(plain, V.c1);
    expect(canAccept(plain)).toBe(false);
    expect(hand(plain, 'p1')).toContain(V.c1);
    expect(plain.life('p1')).toBe(3);
  });

  it('the exclusion is by name: another copy of Bege is not protected either', () => {
    const g = mk(bounce, { characters: [ID, ID, SN3] });
    strike(g, ID);
    expect(canAccept(g)).toBe(false);
    expect(hand(g, 'p1')).toContain(ID);
  });

  it('[Once Per Turn]: a second removal in the same turn is not offered', () => {
    const g = mk(bounce, { characters: [ID, SN3, SN4] });
    strike(g, SN3);
    accept(g);
    expect(atMain(g)).toBe(true);
    strike(g, SN4);
    expect(canAccept(g)).toBe(false);
    expect(hand(g, 'p1')).toContain(SN4);
    expect(g.life('p1')).toBe(4);
  });

  it('a declined replacement does not spend the once per turn', () => {
    const g = mk(bounce, { characters: [ID, SN3, SN4] });
    strike(g, SN3);
    decline(g);
    strike(g, SN4);
    expect(dec(g)?.kind).toBe('optional');
    accept(g);
    expect(ids(g, 'p1', 'life')[0]).toBe(SN4);
  });

  it('must not apply to your own effects', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [ID, SN3, PURPLE] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, PURPLE, [
      main([
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'you',
                filter: { name: SN3_NAME },
                pick: { exactly: 1 },
              },
              to: { zone: 'hand' },
            },
          },
        },
      ]),
    ]);
    g.act({ type: 'activate', card: g.find('p1', 'characters', PURPLE), ability: 'a' });
    expect(canAccept(g)).toBe(false);
    expect(hand(g, 'p1')).toContain(SN3);
    expect(g.life('p1')).toBe(3);
  });
});
