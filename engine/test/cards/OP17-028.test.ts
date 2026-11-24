/** OP17-028 Bonk Punch & Monster. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { mainGame, OTHER_LEADER } from './helpers-op17g2.ts';

const ID = 'OP17-028';
const rested = (card: string) => ({ card, rested: true });

describe('OP17-028 Bonk Punch & Monster', () => {
  const start = () =>
    mainGame({ leader: OTHER_LEADER, hand: [ID], costArea: { active: 4, rested: 0 } }, [
      rested(V.c6),
      rested(V.c7),
      V.c2,
      rested(V.c1),
    ]);

  it('[On Play]: K.O. up to 1 rested opponent Character with a cost of 6 or less', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    // Rested cost 1 and cost 6 only: not the rested cost 7, not the active cost 2.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V.c6]);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
  });

  it('"up to 1": may choose nothing', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(4);
  });

  it('with only active or too expensive Characters nothing happens', () => {
    const g = mainGame({ leader: OTHER_LEADER, hand: [ID], costArea: { active: 4, rested: 0 } }, [
      V.c2,
      rested(V.c7),
    ]);
    play(g, ID);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('has [Blocker]', () => {
    const g = start();
    const id = play(g, ID);
    none(g);
    expect(g.card(id).keywords).toContain('Blocker');
  });
});
