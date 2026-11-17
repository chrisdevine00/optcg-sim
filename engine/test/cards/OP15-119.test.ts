/** OP15-119 Monkey.D.Luffy: Rush with 6+ DON!!; reveals a Life card when the opponent activates an Event or [Blocker]. */
import { describe, expect, it } from 'vitest';
import { withAbilities, withKeywords } from '../../src/testing.ts';
import { BLUE, expectDecision, game, PLAIN_BLUE, V } from './helpers.ts';
import { KAL } from './helpers-kalgara.ts';

const LUFFY = 'OP15-119';
const EVENT = 'OP15-074';

describe('OP15-119 Monkey.D.Luffy', () => {
  it('gains [Rush] with 6 or more DON!! on your field', () => {
    const g = game(
      { leader: KAL, characters: [LUFFY], costArea: { active: 5, rested: 1 } },
      { leader: PLAIN_BLUE },
    );
    expect(g.card(g.find('p1', 'characters', LUFFY)).keywords).toContain('Rush');
  });

  it('given DON!! count toward the 6', () => {
    const g = game(
      { leader: { card: KAL, don: 2 }, characters: [LUFFY], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    expect(g.card(g.find('p1', 'characters', LUFFY)).keywords).toContain('Rush');
  });

  it('has no [Rush] with 5 DON!!', () => {
    const g = game(
      { leader: KAL, characters: [LUFFY], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    expect(g.card(g.find('p1', 'characters', LUFFY)).keywords).not.toContain('Rush');
  });

  it('[Rush] lets it attack the turn it is played (6 DON!! left after paying)', () => {
    const g = game(
      { leader: KAL, hand: [LUFFY], costArea: { active: 6, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'playCard', card: g.find('p1', 'hand', LUFFY) });
    const luffy = g.find('p1', 'characters', LUFFY);
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === luffy)).toBe(true);
  });

  describe('reveal and boost', () => {
    const eventGame = (life: string[]) => {
      const g = game(
        { leader: KAL, characters: [LUFFY], life },
        { leader: PLAIN_BLUE, hand: [EVENT], costArea: { active: 3, rested: 0 } },
        { activePlayer: 'p2', turn: 4 },
      );
      g.state = withAbilities(g.state, EVENT, [
        { id: 'm', kind: 'activate', when: 'main', effect: [] },
      ]);
      return g;
    };

    it('when the opponent activates an Event: +1000 per cost of the revealed Life card, until the end of the turn', () => {
      const g = eventGame([V.c5, V.c1, V.c1]);
      g.act({ type: 'playCard', card: g.find('p2', 'hand', EVENT) });
      expect(g.power(g.find('p1', 'characters', LUFFY))).toBe(7000 + 5000);
      const e = g.eventsOfType('CardRevealed').find((x) => x.from === 'life');
      expect(e?.card).toBe(V.c5);
      expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false); // revealed, not turned face-up
      expect(g.life('p1')).toBe(3);
    });

    it("works on the opponent's turn and the boost ends with that turn", () => {
      const g = eventGame([V.c3, V.c1, V.c1]);
      g.act({ type: 'playCard', card: g.find('p2', 'hand', EVENT) });
      expect(g.power(g.find('p1', 'characters', LUFFY))).toBe(10000);
      g.act({ type: 'endTurn' });
      expect(g.power(g.find('p1', 'characters', LUFFY))).toBe(7000);
    });

    it('does not fire on your own Event', () => {
      const g = game(
        {
          leader: KAL,
          characters: [LUFFY],
          hand: [EVENT],
          life: [V.c5],
          costArea: { active: 3, rested: 0 },
        },
        { leader: PLAIN_BLUE },
      );
      g.state = withAbilities(g.state, EVENT, [
        { id: 'm', kind: 'activate', when: 'main', effect: [] },
      ]);
      g.act({ type: 'playCard', card: g.find('p1', 'hand', EVENT) });
      expect(g.power(g.find('p1', 'characters', LUFFY))).toBe(7000);
    });

    it('when the opponent activates [Blocker]', () => {
      const g = game(
        { leader: KAL, characters: [LUFFY], life: [V.c4, V.c1] },
        { leader: PLAIN_BLUE, characters: [BLUE] },
      );
      g.state = withKeywords(g.state, BLUE, ['Blocker']);
      g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
      expectDecision(g, 'block', 'p2');
      g.act({ type: 'block', blocker: g.find('p2', 'characters', BLUE) });
      expect(g.power(g.find('p1', 'characters', LUFFY))).toBe(7000 + 4000);
    });

    it('with no Life cards nothing is revealed and the power does not change', () => {
      const g = eventGame([]);
      g.act({ type: 'playCard', card: g.find('p2', 'hand', EVENT) });
      expect(g.power(g.find('p1', 'characters', LUFFY))).toBe(7000);
    });

    it('does not fire when your own Character blocks', () => {
      const g = game(
        { leader: KAL, characters: [LUFFY, BLUE], life: [V.c4] },
        { leader: PLAIN_BLUE, characters: [V.c7] },
        { activePlayer: 'p2', turn: 4 },
      );
      g.state = withKeywords(g.state, BLUE, ['Blocker']);
      g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
      g.act({ type: 'block', blocker: g.find('p1', 'characters', BLUE) });
      expect(g.power(g.find('p1', 'characters', LUFFY))).toBe(7000);
    });
  });
});
