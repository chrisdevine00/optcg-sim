/** OP18-060 Saint Gunko (Leader). */
import { describe, expect, it } from 'vitest';
import { addMost, BLUE, don, expectDecision, hand, pick, trash, V } from './helpers.ts';
import { activate } from './helpers-a10g1.ts';
import { CERBERUS, GUNKO_L, mine } from './helpers-op18-g3.ts';

const ID = GUNKO_L;
const HK = 'OP18-084'; // Saint Gunko: [Activate: Main] rest 4 DON!!: play a {Holy Knights of God} Character from the trash
const fromTrash = (trashCards: string[], handCards: string[] = [BLUE], don = 10) => {
  const g = mine(
    {
      leader: ID,
      characters: [HK],
      trash: trashCards,
      hand: handCards,
      costArea: { active: don, rested: 0 },
    },
    {},
  );
  return g;
};
const playFromTrash = (g: ReturnType<typeof fromTrash>) => {
  activate(g, g.find('p1', 'characters', HK), 'activate');
  pick(g, [g.find('p1', 'trash', CERBERUS)]);
};

describe('OP18-060 Saint Gunko', () => {
  it('when a Character is played from your trash: draw 2, then trash 1 card from your hand', () => {
    const g = fromTrash([CERBERUS]);
    playFromTrash(g);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([CERBERUS, HK].sort());
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1')).toHaveLength(3); // BLUE + 2 drawn
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(trash(g, 'p1')).toEqual([BLUE]);
  });

  it('a Character played from your hand does not trigger it', () => {
    const g = mine({ leader: ID, hand: [V.c1] }, {});
    g.act({ type: 'playCard', card: g.find('p1', 'hand', V.c1) });
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('Once Per Turn: a second Character played from the trash the same turn draws nothing', () => {
    const g = fromTrash([CERBERUS, CERBERUS]);
    playFromTrash(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(hand(g, 'p1')).toHaveLength(2);
    playFromTrash(g);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });

  describe('[Activate: Main] [Once Per Turn] trash 1 card from your hand', () => {
    const start = (chars: (string | { card: string; don?: number })[]) =>
      mine(
        { leader: ID, characters: chars, hand: [BLUE, V.c1], costArea: { active: 3, rested: 0 } },
        {},
      );
    const act = (g: ReturnType<typeof start>) => activate(g, g.leader('p1'), 'add-don');

    it('with a Character with 8000 base power or more: add up to 1 DON!! as active', () => {
      const g = start([V.c6]);
      act(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      addMost(g);
      expect(don(g, 'p1').active).toBe(4);
      expect(trash(g, 'p1')).toEqual([V.c1]);
    });

    it('base power counts, not given DON!!: 7000 + 2 DON!! given does not qualify; the card is still trashed', () => {
      const g = start([{ card: V.c5, don: 2 }]);
      act(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
      expect(trash(g, 'p1')).toEqual([V.c1]);
      expect(don(g, 'p1').active).toBe(3);
    });

    it('is Once Per Turn', () => {
      const g = start([V.c6]);
      act(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      addMost(g);
      expect(g.legal().some((a) => a.type === 'activate' && a.card === g.leader('p1'))).toBe(false);
    });

    it('needs a card in hand to trash', () => {
      const g = mine({ leader: ID, characters: [V.c6], hand: [] }, {});
      expect(g.legal().some((a) => a.type === 'activate' && a.card === g.leader('p1'))).toBe(false);
    });
  });
});
