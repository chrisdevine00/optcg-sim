/** OP15-110 Braham. */
import { describe, expect, it } from 'vitest';
import { accept, dec, decline, V } from './helpers.ts';
import { koByBattle, names, OTHER_LEADER, SI_LEADER } from './helpers-op15g3.ts';

const ID = 'OP15-110';
/** OP05-098 Enel Leader: {Sky Island} only, not {Shandian Warrior}; its text is an [Opponent's Turn] Life effect. */
const ENEL_SI = 'OP05-098';
describe('OP15-110 Braham', () => {
  const koed = (leader: string, deck = [V.c4, V.c5, V.c6]) => koByBattle({ leader, deck }, ID);

  it('[On K.O.] with a {Shandian Warrior} Leader adds up to 1 card from the top of the deck to the top of your Life cards', () => {
    const g = koed(SI_LEADER);
    expect(dec(g)?.kind).toBe('optional');
    accept(g);
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c4);
    expect(names(g, 'p1', 'deck')).toEqual([V.c5, V.c6]);
    expect(names(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('"up to 1": the add may be declined', () => {
    const g = koed(SI_LEADER);
    decline(g);
    expect(g.life('p1')).toBe(3);
    expect(names(g, 'p1', 'deck')).toHaveLength(3);
  });

  it('with a Leader that is not {Shandian Warrior} nothing is added', () => {
    const g = koed(OTHER_LEADER);
    expect(g.life('p1')).toBe(3);
    expect(names(g, 'p1', 'deck')).toHaveLength(3);
    expect(names(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('with an empty deck nothing is added', () => {
    const g = koed(SI_LEADER, []);
    if (dec(g)?.kind === 'optional') accept(g);
    expect(g.life('p1')).toBe(3);
  });

  it('a {Sky Island} Leader that is not {Shandian Warrior} does not qualify', () => {
    const g = koed(ENEL_SI);
    expect(g.life('p1')).toBe(3);
    expect(names(g, 'p1', 'deck')).toHaveLength(3);
  });
});
