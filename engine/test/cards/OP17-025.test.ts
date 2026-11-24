/** OP17-025 Building Snake. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, none, pick, V } from './helpers.ts';
import { koedInBattle, mainGame, OTHER_LEADER, SHANKS_LEADER } from './helpers-op17g2.ts';

const ID = 'OP17-025';
const rested = (card: string) => ({ card, rested: true });

describe('OP17-025 Building Snake', () => {
  const ko = () =>
    koedInBattle(
      ID,
      { leader: OTHER_LEADER },
      { characters: [rested(V.c6), rested(V.c7), V.c3] },
      V.c6,
    );

  it('[On K.O.]: K.O. up to 1 rested opponent Character with a cost of 6 or less', () => {
    const g = ko();
    const target = g.find('p2', 'characters', V.c6, 1);
    // Candidates: the rested attacker and the rested cost 6; not the cost 7 or the active cost 3.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [target]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c6, V.c7, V.c3]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V.c6]);
  });

  it('"up to 1": may choose nothing', () => {
    const g = ko();
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(4);
  });

  it('a rested cost 7 and an active cost 3 are not candidates', () => {
    const g = koedInBattle(ID, { leader: OTHER_LEADER }, { characters: [rested(V.c7), V.c3] });
    // Only the rested attacker (cost 6) qualifies.
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
  });

  describe('[Activate: Main] [Once Per Turn]', () => {
    const setup = (leader: string) =>
      mainGame({ leader, characters: [ID], costArea: { active: 1, rested: 2 } });

    it('gives up to 1 rested DON!! card to your [Shanks] Leader, once per turn', () => {
      const g = setup(SHANKS_LEADER);
      const snake = g.find('p1', 'characters', ID);
      g.act({ type: 'activate', card: snake, ability: 'give-don' });
      pick(g, [g.leader('p1')]);
      expect(g.card(g.leader('p1')).don).toBe(1);
      expect(g.power(g.leader('p1'))).toBe(6000);
      // The DON!! came from the rested ones.
      expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1, given: 1 });
      expect(g.isLegal({ type: 'activate', card: snake, ability: 'give-don', player: 'p1' })).toBe(
        false,
      );
    });

    it('with no rested DON!! nothing is given', () => {
      const g = mainGame({
        leader: SHANKS_LEADER,
        characters: [ID],
        costArea: { active: 2, rested: 0 },
      });
      const snake = g.find('p1', 'characters', ID);
      if (g.isLegal({ type: 'activate', card: snake, ability: 'give-don', player: 'p1' }))
        g.act({ type: 'activate', card: snake, ability: 'give-don' });
      expect(g.card(g.leader('p1')).don).toBe(0);
      expect(don(g, 'p1').active).toBe(2);
    });

    it('with a Leader that is not [Shanks] no DON!! is given', () => {
      const g = setup(OTHER_LEADER);
      const snake = g.find('p1', 'characters', ID);
      if (g.isLegal({ type: 'activate', card: snake, ability: 'give-don', player: 'p1' }))
        g.act({ type: 'activate', card: snake, ability: 'give-don' });
      expect(g.card(g.leader('p1')).don).toBe(0);
    });
  });
});
