/** OP13-102 Edison. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, none, pick, PLAIN_PURPLE, V } from './helpers.ts';
import { activate } from './helpers-w3s.ts';
import { canPick, mine, names, rep, trig } from './helpers-op13g4.ts';

const ID = 'OP13-102';

describe('OP13-102 Edison', () => {
  const run = (myLife: number, oppLife: number, opp: string[]) => {
    const g = mine(
      { leader: PLAIN_PURPLE, characters: [ID], life: rep(myLife, BLUE), deck: rep(5, BLUE) },
      { characters: opp, life: rep(oppLife, BLUE) },
    );
    activate(g, g.find('p1', 'characters', ID), 'activate');
    return g;
  };

  it('[Activate: Main] trash this: with fewer Life than the opponent, draw 1 and rest a cost 3 Character', () => {
    const g = run(2, 3, [V.c3, V.c4]);
    expect(names(g, 'p1', 'trash')).toEqual([ID]);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(g.zone('p2', 'characters').find((c) => c.card === V.c3)!.rested).toBe(true);
  });

  it('equal Life counts: still draws ("equal to or less")', () => {
    const g = run(3, 3, [V.c3]);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
  });

  it('more Life than the opponent: no draw and no rest either (a "Then" after a failed "If" does not resolve, M4b-5)', () => {
    const g = run(4, 3, [V.c2]);
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.zone('p2', 'characters')[0]!.rested).toBe(false);
  });

  it('"up to 1": may rest nothing, and with no target nothing is asked', () => {
    const g = run(2, 3, [V.c3]);
    none(g);
    expect(g.zone('p2', 'characters')[0]!.rested).toBe(false);
    const h = run(2, 3, [V.c4]);
    if (dec(h)?.kind === 'choose') none(h);
    expect(h.zone('p1', 'hand')).toHaveLength(1);
  });

  it('[Trigger] draws 1 and rests up to 1 Character with cost 3 or less', () => {
    const g = trig(ID, { leader: PLAIN_PURPLE, deck: rep(5, BLUE) }, [V.c3]);
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain(BLUE);
    expect(g.zone('p2', 'characters').find((c) => c.card === V.c3)!.rested).toBe(true);
  });
});
