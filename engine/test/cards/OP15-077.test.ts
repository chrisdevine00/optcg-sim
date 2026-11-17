/** OP15-077 Lightning Dragon. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, don, game, hand, payDon, pick, play, V } from './helpers.ts';
import { ENEL, PLAIN_BLUE } from './helpers-rgl-penel.ts';

describe('OP15-077 Lightning Dragon', () => {
  const start = () =>
    game(
      { leader: ENEL, hand: ['OP15-077'], costArea: { active: 2, rested: 0 }, donDeck: 4 },
      {
        leader: PLAIN_BLUE,
        characters: [{ card: V.c4, rested: true }, { card: V.c5, rested: true }, V.c3],
      },
    );
  const rested = (g: ReturnType<typeof start>, c: string) =>
    g.card(g.find('p2', 'characters', c)).rested;

  it('[Main] DON!! -1: draws 1, then a rested Character with 6000 power or less will not become active in the next Refresh Phase', () => {
    const g = start();
    play(g, 'OP15-077');
    accept(g);
    payDon(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    // Only the rested 6000-power Character is offered (not the rested 7000 one, not the active one).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    g.act({ type: 'endTurn' }); // p2's Refresh Phase
    expect(rested(g, V.c4)).toBe(true);
    expect(rested(g, V.c5)).toBe(false);
  });

  it('only the next Refresh Phase is skipped', () => {
    const g = start();
    play(g, 'OP15-077');
    accept(g);
    payDon(g);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(rested(g, V.c4)).toBe(false);
  });

  it('may be declined: no draw, no DON!! returned', () => {
    const g = start();
    play(g, 'OP15-077');
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(don(g, 'p1').deck).toBe(4);
  });

  it('with no valid target the draw still happens', () => {
    const g = game(
      { leader: ENEL, hand: ['OP15-077'], costArea: { active: 2, rested: 0 }, donDeck: 4 },
      { leader: PLAIN_BLUE, characters: [V.c3] },
    );
    play(g, 'OP15-077');
    accept(g);
    payDon(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });
});
