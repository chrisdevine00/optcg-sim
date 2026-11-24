/** OP17-024 Howling Gab. */
import { describe, expect, it } from 'vitest';
import {
  endCounter,
  expectDecision,
  game,
  none,
  passBlock,
  pick,
  play,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';
import { RED_LEADER } from './helpers-op17g1.ts';

const ID = 'OP17-024';
/** OP17-019 has a [Trigger]: a Banish hit must not offer it. */
const TRIGGER_CARD = 'OP17-019';

describe('OP17-024 Howling Gab', () => {
  const start = (opp: Parameters<typeof game>[1]['characters']) =>
    game(
      { leader: RED_LEADER, hand: [ID], costArea: { active: 8, rested: 0 } },
      { leader: PLAIN_BLUE, characters: opp },
    );

  it("[On Play] rests up to 1 of your opponent's Characters", () => {
    const g = start([V.c1, V.c2]);
    play(g, ID);
    const target = g.find('p2', 'characters', V.c2);
    pick(g, [target]);
    expect(g.card(target).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });

  it('"up to 1": it may rest none, and only one Character is rested', () => {
    const g = start([V.c1, V.c2]);
    play(g, ID);
    none(g);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it('with no opposing Character the play resolves and nothing is rested', () => {
    const g = start([]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });

  it('[Banish]: listed as a keyword on the Character', () => {
    const g = start([]);
    const id = play(g, ID);
    expect(g.card(id).keywords).toContain('Banish');
  });

  it('[Banish]: the damaged Life card is trashed without activating its [Trigger]', () => {
    const g2 = game(
      { leader: RED_LEADER, characters: [ID] },
      { leader: PLAIN_BLUE, life: [TRIGGER_CARD, V.c1, V.c1] },
    );
    g2.act({
      type: 'attack',
      attacker: g2.find('p1', 'characters', ID),
      target: g2.leader('p2'),
    });
    passBlock(g2);
    endCounter(g2);
    expectDecision(g2, 'main', 'p1'); // no [Trigger] decision for p2
    expect(g2.life('p2')).toBe(2);
    expect(trash(g2, 'p2')).toEqual([TRIGGER_CARD]);
  });
});
