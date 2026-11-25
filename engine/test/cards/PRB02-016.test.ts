/** PRB02-016 Otama. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, expectDecision, hand, option, pick, PURPLE, times, V } from './helpers.ts';
import { activate, cardsIn, mk, offeredAb, trigGame } from './helpers-prbst.ts';

const ID = 'PRB02-016';

describe('PRB02-016 Otama', () => {
  const start = (p1 = {}) =>
    mk({ characters: [ID, V.c3], life: [V.c1, V.c2, V.c3], hand: [BLUE], ...p1 });
  const otama = (g: ReturnType<typeof start>) => g.find('p1', 'characters', ID);

  it('[Activate: Main]: rest this Character and add the top Life card to your hand: a Leader or Character gets +3000 this turn', () => {
    const g = start();
    activate(g, otama(g), 'activate');
    option(g, 'top');
    expect(g.card(otama(g)).rested).toBe(true);
    expect(hand(g, 'p1')).toEqual([BLUE, V.c1]);
    expect(g.life('p1')).toBe(2);
    // Targets: the Leader, Otama and the other Character.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the Life card may be taken from the bottom', () => {
    const g = start();
    activate(g, otama(g), 'activate');
    option(g, 'bottom');
    expect(hand(g, 'p1')).toEqual([BLUE, V.c3]);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('"up to 1": the target may be skipped, after the cost is paid', () => {
    const g = start();
    activate(g, otama(g), 'activate');
    option(g, 'top');
    expect(g.legal().some((a) => a.type === 'done')).toBe(true);
    g.act({ type: 'done' });
    expect(g.card(otama(g)).rested).toBe(true);
    expect(g.life('p1')).toBe(2);
  });

  it('must not be usable with no Life cards, or when Otama is already rested', () => {
    const none = start({ life: [] });
    expect(offeredAb(none, otama(none), 'activate')).toBe(false);
    const rested = start({ characters: [{ card: ID, rested: true }, V.c3] });
    expect(offeredAb(rested, otama(rested), 'activate')).toBe(false);
  });

  it("[Trigger]: rests up to 1 of the opponent's Characters with a cost of 4 or less (5 is not a candidate)", () => {
    const g = trigGame(ID, {}, [V.c4, V.c5]);
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(offered).toEqual([g.find('p2', 'characters', V.c4)]);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });

  it('[Trigger] declined: Otama goes to the hand and nothing is rested', () => {
    const g = trigGame(ID, {}, [V.c4]);
    g.act({ type: 'trigger', activate: false });
    expect(dec(g)?.kind).not.toBe('choose');
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(false);
    expect(cardsIn(g, 'p1', 'hand')).toContain(ID);
    void times;
    void PURPLE;
  });
});
