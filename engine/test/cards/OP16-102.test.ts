/** OP16-102 Avalo Pizarro. */
import { describe, expect, it } from 'vitest';
import { hand, none, pick, V } from './helpers.ts';
import { BB_LEADER, FULLALEAD, koByBattle, names, OTHER_LEADER } from './helpers-op16g4.ts';
import { damageWith } from './triggers.ts';

const ID = 'OP16-102';
const FULLALEAD_BLUE = 'OP17-057'; // also named [Fullalead]

describe('OP16-102 Avalo Pizarro', () => {
  it('[On K.O.] draws 1, then plays a [Fullalead] from your hand', () => {
    const g = koByBattle({ leader: OTHER_LEADER, hand: [FULLALEAD, V.c5], deck: [V.c1, V.c2] }, ID);
    pick(g, [g.find('p1', 'hand', FULLALEAD)]);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([FULLALEAD]);
    expect(hand(g, 'p1')).toEqual([V.c5, V.c1]);
  });

  it('...or from your trash (either [Fullalead] is eligible)', () => {
    const g = koByBattle(
      { leader: OTHER_LEADER, hand: [FULLALEAD], trash: [FULLALEAD_BLUE], deck: [V.c1, V.c2] },
      ID,
    );
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'trash', FULLALEAD_BLUE)]);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([FULLALEAD_BLUE]);
  });

  it('must not play a card with another name; the draw still happens; "up to 1" may play none', () => {
    const g = koByBattle({ leader: OTHER_LEADER, hand: [V.c5], deck: [V.c1, V.c2] }, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(hand(g, 'p1')).toEqual([V.c5, V.c1]);
    const g2 = koByBattle({ leader: OTHER_LEADER, hand: [FULLALEAD], deck: [V.c1, V.c2] }, ID);
    none(g2);
    expect(g2.zone('p1', 'stage')).toHaveLength(0);
  });

  it('[Trigger] activates the [On K.O.] effect', () => {
    const g = damageWith(ID, { leader: BB_LEADER, trash: [FULLALEAD], deck: [V.c1, V.c2] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'trash', FULLALEAD)]);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([FULLALEAD]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(names(g, 'p1', 'trash')).toEqual([ID]);
  });
});
