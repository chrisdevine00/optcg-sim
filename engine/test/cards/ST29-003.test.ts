/** ST29-003 Kaku. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, PURPLE, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { canPick, lifeOf, LUFFY_LEADER, mk } from './helpers-st29old.ts';

const ID = 'ST29-003';
const p2life = (n: number) => ({ life: Array.from({ length: n }, () => PURPLE) });

describe('ST29-003 Kaku', () => {
  it('has +1000 power while your Life is at most your opponent’s', () => {
    const equal = mk({ characters: [ID], life: lifeOf(3) }, p2life(3));
    expect(equal.power(equal.find('p1', 'characters', ID))).toBe(6000);
    const fewer = mk({ characters: [ID], life: lifeOf(2) }, p2life(3));
    expect(fewer.power(fewer.find('p1', 'characters', ID))).toBe(6000);
  });

  it('must not boost with more Life than the opponent (boundary 4 vs 3), nor change base power', () => {
    const g = mk({ characters: [ID], life: lifeOf(4) }, p2life(3));
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
    const h = mk({ characters: [ID], life: lifeOf(0) }, p2life(0));
    expect(h.power(h.find('p1', 'characters', ID))).toBe(6000); // 0 and 0 are equal
  });

  it('applies on the opponent’s turn too (no turn condition)', () => {
    const g = mk({ characters: [ID], life: lifeOf(3) }, p2life(3), { turn: 4, activePlayer: 'p2' });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });

  it('[Trigger]: K.O.s up to 1 opposing Character with a cost of 3 or less', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER }, { characters: [V.c3, V.c4] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false); // cost 4
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toContain(V.c4);
    expect(g.zone('p2', 'characters').map((c) => c.card)).not.toContain(V.c3);
  });

  it('[Trigger]: "up to 1" may K.O. nothing; an activated Trigger card is then trashed', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER }, { characters: [V.c3] });
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toContain(V.c3);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });
});
