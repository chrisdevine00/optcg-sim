/** EB03-061 Uta. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, expectDecision, none, pick, setMost, V } from './helpers.ts';
import { canPick, FILM3, FILM4, mk } from './helpers-eb03g2.ts';
import type { TestGame } from '../fixtures/index.ts';

const ID = 'EB03-061';
const use = (g: TestGame) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'main' });
const mixed = { costArea: { active: 3, rested: 3 } };

describe('EB03-061 Uta', () => {
  it('[Activate: Main] [Once Per Turn]: sets up to 1 of your DON!! as active, then rests an opposing Character with a cost of 4 or less', () => {
    const g = mk({ characters: [ID], ...mixed }, { characters: [V.c4, V.c5] });
    use(g);
    setMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 2 });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true); // boundary: cost 4
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false); // cost 5
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });

  it("may rest 1 of the opponent's DON!! cards instead of a Character", () => {
    const g = mk(
      { characters: [ID], ...mixed },
      { characters: [V.c5], costArea: { active: 4, rested: 0 } },
    );
    use(g);
    setMost(g);
    g.act({ type: 'pick', choice: { from: 'costActive' } });
    expect(don(g, 'p2')).toMatchObject({ active: 3, rested: 1 });
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });

  it('"up to 1" for both parts: the DON!! count may be 0 and the rest may be left', () => {
    const g = mk({ characters: [ID], ...mixed }, { characters: [V.c3] });
    use(g);
    g.act({ type: 'pick', choice: { option: '0' } });
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 3 });
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });

  it('with no rested DON!! nothing is set (and nothing is asked); the rest part still happens', () => {
    const g = mk({ characters: [ID], costArea: { active: 4, rested: 0 } }, { characters: [V.c3] });
    use(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
  });

  it('Once Per Turn: a second activation is not legal', () => {
    const g = mk({ characters: [ID], ...mixed }, { characters: [V.c3] });
    use(g);
    setMost(g);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(
      g.legal().some((a) => a.type === 'activate' && a.card === g.find('p1', 'characters', ID)),
    ).toBe(false);
  });

  describe('[End of Your Turn]', () => {
    it('you may rest 1 of your DON!!: sets up to 1 of your {FILM} Characters as active', () => {
      const g = mk({
        characters: [{ card: FILM4, rested: true }, { card: V.c3, rested: true }, ID],
      });
      g.act({ type: 'endTurn' });
      accept(g);
      expectDecision(g, 'choose', 'p1');
      expect(canPick(g, g.find('p1', 'characters', FILM4))).toBe(true);
      expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false); // not {FILM}
      pick(g, [g.find('p1', 'characters', FILM4)]);
      expect(g.card(g.find('p1', 'characters', FILM4)).rested).toBe(false);
      expect(g.card(g.find('p1', 'characters', V.c3)).rested).toBe(true);
      expect(don(g, 'p1').rested).toBe(1);
    });

    it('the cost is optional: declining sets nothing', () => {
      const g = mk({ characters: [{ card: FILM3, rested: true }, ID] });
      g.act({ type: 'endTurn' });
      decline(g);
      expect(g.card(g.find('p1', 'characters', FILM3)).rested).toBe(true);
      expect(don(g, 'p1').rested).toBe(0);
    });

    it('"up to 1": after resting the DON!! the Character may be left rested', () => {
      const g = mk({ characters: [{ card: FILM3, rested: true }, ID] });
      g.act({ type: 'endTurn' });
      accept(g);
      none(g);
      expect(g.card(g.find('p1', 'characters', FILM3)).rested).toBe(true);
    });

    it('Uta herself ({FILM}) can be set active', () => {
      const g = mk({ characters: [{ card: ID, rested: true }] });
      g.act({ type: 'endTurn' });
      accept(g);
      pick(g, [g.find('p1', 'characters', ID)]);
      expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
    });

    it('with no active DON!! the cost cannot be paid: nothing is asked and the Character stays rested', () => {
      const g = mk({
        characters: [{ card: FILM3, rested: true }, ID],
        costArea: { active: 0, rested: 4 },
      });
      g.act({ type: 'endTurn' });
      expect(g.card(g.find('p1', 'characters', FILM3)).rested).toBe(true);
      expect(g.decider).toBe('p2');
    });
  });
});
