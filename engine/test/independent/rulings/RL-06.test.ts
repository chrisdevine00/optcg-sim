/**
 * RL-06 What the full-area trash may choose, and what it is not.
 * rulings.md RL-06 (CR 3-7-6-1-1, 10-2-1-3; QA-GR "5 Characters … [On K.O.]"; QA-ST01–04 ST02-010).
 *
 * Cards: five vanilla red Characters; OP01-023 Marco is rested and holds 2 given DON!!.
 * ST01-003 Karoo (cost 1, vanilla) in hand.
 */
import { describe, expect, it } from 'vitest';
import { scenario } from '../../fixtures/index.ts';
import { don, FILL, fill, ids, isLegal, L, pickOne, play, V } from '../helpers.ts';

function full() {
  return scenario({
    p1: {
      leader: L.redLuffy,
      characters: [
        V.komachiyo,
        V.sai,
        { card: V.marco, rested: true, don: 2 },
        V.hajrudin,
        V.kingdew,
      ],
      hand: [V.karoo],
      costArea: { active: 1, rested: 0 },
      donDeck: 7,
      life: fill(FILL.red, 5),
      deck: fill(FILL.red, 10),
    },
    p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: fill(FILL.purple, 10) },
  });
}

describe('RL-06: the full-area rule trash', () => {
  it('RL-06: any one of your Characters may be chosen, including a rested one holding DON!!', () => {
    const g = full();
    const board = ids(g, 'p1', 'characters');
    play(g, g.find('p1', 'hand', V.karoo));
    for (const c of board) expect(isLegal(g, { type: 'pick', choice: c })).toBe(true);
  });

  it('RL-06: it is not a K.O., and the trashed Character’s DON!! go to the cost area rested', () => {
    const g = full();
    play(g, g.find('p1', 'hand', V.karoo));
    pickOne(g, g.find('p1', 'characters', V.marco));
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([V.marco]);
    // 1 rested to pay Karoo + 2 returned from Marco (CR 6-5-5-4).
    expect(don(g, 'p1')).toEqual({ deck: 7, active: 0, rested: 3, given: 0 });
    // Event name from ARCHITECTURE §2.8.
    expect(g.eventsOfType('KO')).toEqual([]);
  });

  it.todo('RL-06: [On K.O.] of the trashed Character does not activate (needs M4 effects)');
  it.todo('RL-06: "cannot be K.O.\'d" does not stop the rule trash (needs M4 effects)');
  it.todo(
    'RL-06 (QA-ST01–04 ST02-010): a defender who trashes their blocking Jinbe via its [On Block] play skips Counter and Damage (needs M4 effects)',
  );
});
