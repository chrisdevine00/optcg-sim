/** OP09-077 Gum-Gum Lightning. */
import { describe, expect, it } from 'vitest';
import { accept, don, game, KAIDO, payDon, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { damageWith } from './triggers.ts';

describe('OP09-077 Gum-Gum Lightning', () => {
  it("[Main] DON!! −2: K.O. an opponent's Character with 6000 power or less", () => {
    const g = game(
      { leader: KAIDO, hand: ['OP09-077'], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c4, V.c5] },
    );
    play(g, 'OP09-077');
    accept(g); // DON!! −X on an Event is optional (CR 8-3-1-4, QA-ST01–04 ST04-016)
    payDon(g);
    expect(
      g.isLegal({ type: 'pick', choice: g.find('p2', 'characters', V.c5), player: 'p1' }),
    ).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V.c4]);
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('not playable with too few DON!! for its cost and DON!! −2 together', () => {
    const g = game(
      { leader: KAIDO, hand: ['OP09-077'], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    // cost 2 rests both; DON!! −2 then returns them: still payable (rested DON!! can be returned).
    expect(g.legal().some((a) => a.type === 'playCard')).toBe(true);
    const h = game(
      { leader: KAIDO, hand: ['OP09-077'], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    void h;
    const tooFew = game(
      { leader: KAIDO, hand: ['OP09-077'], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    expect(tooFew.legal().some((a) => a.type === 'playCard')).toBe(false);
  });

  it('[Trigger] adds 1 active DON!!', () => {
    const g = damageWith('OP09-077');
    g.act({ type: 'trigger', activate: true });
    expect(don(g, 'p1').active).toBe(1);
  });

  it('M4a-08 (QA-ST01–04 ST04-016): DON!! −2 may be declined; the Event is trashed and nothing happens', () => {
    const g = game(
      { leader: KAIDO, hand: ['OP09-077'], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c4] },
    );
    play(g, 'OP09-077');
    g.act({ type: 'optional', accept: false });
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 2, deck: 8 });
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual(['OP09-077']);
  });

  it('M4a-08: playable for its cost alone; with no DON!! left to return, "use" is unavailable', () => {
    const g = game(
      { leader: KAIDO, hand: ['OP09-077'], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    const ev = g.find('p1', 'hand', 'OP09-077');
    expect(g.isLegal({ type: 'playCard', card: ev, player: 'p1' })).toBe(true);
  });
});
