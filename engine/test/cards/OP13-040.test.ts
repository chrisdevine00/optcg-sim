/** OP13-040 I Know You're Strong... So I'll Go All Out from the Very Start!!! */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, endCounter, game, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import {
  cardsOf,
  COST8,
  counterStep,
  donArea,
  SHC_LEADER,
  useCounter,
} from './helpers-luffyace.ts';

const ID = 'OP13-040';

describe("OP13-040 I Know You're Strong... So I'll Go All Out from the Very Start!!!", () => {
  const start = () =>
    game(
      { leader: SHC_LEADER, hand: [ID], ...donArea(3) },
      {
        leader: PLAIN_BLUE,
        characters: [
          { card: V.c7, rested: true },
          { card: V.c3, rested: true },
          { card: V.c1, rested: true },
          { card: COST8, rested: true }, // cost 8: too expensive
          V.c2, // active
        ],
      },
    );

  it('[Main]: you may rest 2 DON!!: up to 2 rested opposing Characters with cost 7 or less will not become active in their next Refresh Phase', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(don(g, 'p1').rested).toBe(3);
    // Rested and cost 7 or less: three candidates (the cost-8 and the active one are not).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    pick(g, [g.find('p2', 'characters', V.c7), g.find('p2', 'characters', V.c3)]);
    // Still rested now; the choice changes nothing until the Refresh Phase.
    for (const c of g.zone('p2', 'characters').filter((x) => x.card !== V.c2))
      expect(c.rested).toBe(true);
    g.act({ type: 'endTurn' });
    // p2's Refresh Phase has run: the two chosen stay rested, everything else is active.
    const rested = (card: string) => g.card(g.find('p2', 'characters', card)).rested;
    expect(rested(V.c7)).toBe(true);
    expect(rested(V.c3)).toBe(true);
    expect(rested(V.c1)).toBe(false);
    expect(rested(COST8)).toBe(false);
    expect(rested(V.c2)).toBe(false);
  });

  it('without the Event, every rested Character becomes active in the Refresh Phase (control)', () => {
    const g = start();
    g.act({ type: 'endTurn' });
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it('[Main]: declining the optional cost does nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    g.act({ type: 'endTurn' });
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
    expect(cardsOf(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('[Main]: only rested Characters are targets (an active-only board has none)', () => {
    const g = game(
      { leader: SHC_LEADER, hand: [ID], ...donArea(3) },
      { leader: PLAIN_BLUE, characters: [V.c1] },
    );
    play(g, ID);
    accept(g);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });

  it('[Counter]: your Leader gains +3000 power during this battle', () => {
    const g = counterStep({ leader: SHC_LEADER, hand: [ID], ...donArea(1) }, {}, V.c5);
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(g.life('p1')).toBe(3);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
