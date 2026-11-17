/** OP08-036 Electrical Luna. */
import { describe, expect, it } from 'vitest';
import { game, pick, play, V } from './helpers.ts';
import { damageWithP2, PLAIN_BLUE, RGL } from './helpers-rgl-penel.ts';

/** A vanilla Character with cost 8 (Red, 10000 power). */
const C8 = 'EB02-004';

describe('OP08-036 Electrical Luna', () => {
  const setup = () =>
    game(
      { leader: RGL, hand: ['OP08-036'], costArea: { active: 3, rested: 0 } },
      {
        leader: PLAIN_BLUE,
        characters: [
          { card: V.c5, rested: true },
          { card: V.c7, rested: true },
          { card: C8, rested: true },
          V.c3,
        ],
      },
    );

  it("[Main]: the opponent's rested Characters with a cost of 7 or less skip their next Refresh Phase", () => {
    const g = setup();
    play(g, 'OP08-036');
    g.act({ type: 'endTurn' }); // p2's Refresh Phase
    const rested = (c: string) => g.card(g.find('p2', 'characters', c)).rested;
    expect(rested(V.c5)).toBe(true);
    expect(rested(V.c7)).toBe(true); // cost 7 is "7 or less"
    expect(rested(C8)).toBe(false); // cost 8 untaps
    expect(rested(V.c3)).toBe(false);
  });

  it('only the next Refresh Phase: they become active in the one after', () => {
    const g = setup();
    play(g, 'OP08-036');
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' }); // p2 ends its turn
    g.act({ type: 'endTurn' }); // p1 ends its turn
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });

  it('does not touch a Character that is active when the Event resolves', () => {
    const g = game(
      { leader: RGL, hand: ['OP08-036'], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c3] },
    );
    play(g, 'OP08-036');
    // Rested only after the Event: it still untaps (nothing was marked).
    const id = g.find('p2', 'characters', V.c3);
    g.act({ type: 'endTurn' });
    expect(g.card(id).rested).toBe(false);
  });

  it("[Trigger]: rests up to 1 of the opponent's Characters", () => {
    const g = damageWithP2('OP08-036', {}, [V.c7, V.c3]);
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
  });
});
