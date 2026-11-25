/** ST27-004 Sanjuan.Wolf. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, play, trash, V } from './helpers.ts';
import { BP_LEADER, fill, mk, NOT_BP_LEADER } from './helpers-st2627.ts';

const ID = 'ST27-004';
const onField = (leader: string, trashCards: string[], oppTrash: string[] = []) => {
  const g = mk({ leader, characters: [ID], trash: trashCards }, { trash: oppTrash });
  return { g, id: g.find('p1', 'characters', ID) };
};

describe('ST27-004 Sanjuan.Wolf', () => {
  it('with a {Blackbeard Pirates} Leader it gains +1 cost for every 4 cards in your trash (4, 8, 12 are the steps)', () => {
    const cost = (n: number) => {
      const { g, id } = onField(BP_LEADER, fill(n, V.c1));
      return g.card(id).cost;
    };
    expect(cost(0)).toBe(4);
    expect(cost(3)).toBe(4);
    expect(cost(4)).toBe(5);
    expect(cost(7)).toBe(5);
    expect(cost(8)).toBe(6);
    expect(cost(11)).toBe(6);
    expect(cost(12)).toBe(7);
  });

  it('with a {Blackbeard Pirates} Leader it gains [Blocker]', () => {
    const { g, id } = onField(BP_LEADER, []);
    expect(g.card(id).keywords).toContain('Blocker');
  });

  it('with a Leader that is not {Blackbeard Pirates} it has neither [Blocker] nor the cost bonus', () => {
    const { g, id } = onField(NOT_BP_LEADER, fill(12, V.c1));
    expect(g.card(id).keywords).not.toContain('Blocker');
    expect(g.card(id).cost).toBe(4);
  });

  it("only your own trash counts: the opponent's 8 cards add nothing", () => {
    const { g, id } = onField(BP_LEADER, fill(3, V.c1), fill(8, V.c2));
    expect(g.card(id).cost).toBe(4);
  });

  it('[On Play] trashes 1 card from your hand (mandatory)', () => {
    const g = mk({ leader: BP_LEADER, hand: [ID, V.c1, V.c2] });
    play(g, ID);
    const d = dec(g)!;
    if (d.kind === 'choose') {
      g.act({ type: 'pick', choice: g.find('p1', 'hand', V.c2) });
      if (dec(g)?.kind === 'choose') g.act({ type: 'done' });
    }
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toEqual([V.c2]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('with an empty hand after playing it nothing is trashed and no prompt appears', () => {
    const g = mk({ leader: BP_LEADER, hand: [ID] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('the granted [Blocker] really blocks; without the Leader type it cannot', () => {
    for (const [leader, canBlock] of [
      [BP_LEADER, true],
      [NOT_BP_LEADER, false],
    ] as const) {
      const g = mk(
        { leader, characters: [ID] },
        { characters: [V.c7] },
        { turn: 4, activePlayer: 'p2' },
      );
      g.act({
        type: 'attack',
        attacker: g.find('p2', 'characters', V.c7),
        target: g.leader('p1'),
      });
      // The Leader's own [On Your Opponent's Attack] (OP16-080, scripted) asks first: decline it.
      if (g.legal().some((a) => a.type === 'optional')) g.act({ type: 'optional', accept: false });
      const wolf = g.find('p1', 'characters', ID);
      expect(g.legal().some((a) => a.type === 'block' && a.blocker === wolf)).toBe(canBlock);
    }
  });
});
