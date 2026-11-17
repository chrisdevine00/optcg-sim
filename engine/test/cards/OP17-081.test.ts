/** OP17-081 Gerd. QA-OP17 OP17-085 / OP17-089 via RL-43 (self-cost boosts apply on the field only). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  trash,
  V,
} from './helpers.ts';
import { COST8, ELBAPH_LEADER, GIANT } from './helpers-sabo.ts';

/** P-041 Monkey.D.Luffy: vanilla, cost 10. */
const COST10 = 'P-041';

describe('OP17-081 Gerd', () => {
  it('with an {Elbaph} Leader it has +12 cost on the field, otherwise its printed cost', () => {
    const on = game({ leader: ELBAPH_LEADER, characters: ['OP17-081'] }, { leader: PLAIN_BLUE });
    expect(on.card(on.find('p1', 'characters', 'OP17-081')).cost).toBe(14);
    const off = game({ leader: PLAIN_PURPLE, characters: ['OP17-081'] }, { leader: PLAIN_BLUE });
    expect(off.card(off.find('p1', 'characters', 'OP17-081')).cost).toBe(2);
  });

  const setup = () =>
    game(
      {
        leader: PLAIN_PURPLE,
        hand: ['OP17-081', BLUE],
        trash: [COST8, COST10, 'OP17-081', GIANT, 'OP17-096', V.c7],
        costArea: { active: 2, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: trash 1 card from hand, add a Character cost 8 or less other than [Gerd] from the trash to hand', () => {
    const g = setup();
    play(g, 'OP17-081');
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.kind).toBe('choose');
    // Candidates: cost 8 and 7 Characters, Saul (printed cost 4 in the trash; its +12 is on the
    // field only) and the card just trashed as the cost (it is in the trash when this resolves).
    // Not Gerd (name), P-041 (cost 10) or the Event.
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(offered.sort()).toEqual(
      [COST8, V.c7, GIANT, BLUE].map((c) => g.find('p1', 'trash', c)).sort(),
    );
    pick(g, [g.find('p1', 'trash', COST8)]);
    expect(hand(g, 'p1')).toEqual([COST8]);
    expect(trash(g, 'p1')).toContain(BLUE);
  });

  it('[On Play]: the cost may be declined; nothing is trashed or added', () => {
    const g = setup();
    play(g, 'OP17-081');
    decline(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(trash(g, 'p1')).toHaveLength(6);
  });

  it('[On Play]: "up to 1", so the player may add nothing after paying', () => {
    const g = setup();
    play(g, 'OP17-081');
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    g.act({ type: 'done' });
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toContain(BLUE);
  });

  it('[On Play]: cannot be paid with an empty hand (the played card has left it)', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: ['OP17-081'],
        trash: [COST8],
        costArea: { active: 2, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP17-081');
    // The prompt says it cannot be paid: declining is the only legal answer.
    expectDecision(g, 'optional', 'p1');
    expect(g.legal().filter((a) => a.type === 'optional')).toEqual([
      { type: 'optional', accept: false, player: 'p1' },
    ]);
    decline(g);
    expect(trash(g, 'p1')).toEqual([COST8]);
  });
});
