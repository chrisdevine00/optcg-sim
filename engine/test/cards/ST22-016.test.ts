/** ST22-016 Take That Back!! Take Back What You Said!!. */
import { describe, expect, it } from 'vitest';
import { dec, endCounter, expectDecision, hand, none, pick, takeDamage } from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { trigGame } from './helpers-op11g1.ts';
import { choices, deckOf, FORMER3, OTHER_LEADER, V, WB4 } from './helpers-lfb.ts';

const ID = 'ST22-016';

describe('ST22-016 Take That Back!! Take Back What You Said!!', () => {
  const start = (top: string, chars: string[] = [V.c1]) =>
    counterStep(
      {
        leader: OTHER_LEADER,
        characters: chars as never,
        hand: [ID],
        deck: [top, V.c2, V.c3] as never,
        costArea: { active: 3, rested: 0 },
      },
      {},
    );

  it('[Counter]: a revealed {Whitebeard Pirates} card: up to 1 of your Leader or Character cards gains +4000 power during this battle', () => {
    const g = start(WB4);
    useCounter(g, ID);
    expect(g.eventsOfType('CardRevealed').at(-1)).toMatchObject({ card: WB4 });
    expectDecision(g, 'choose', 'p1');
    expect(choices(g).sort()).toEqual([g.leader('p1'), g.find('p1', 'characters', V.c1)].sort());
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    // The bonus is for this battle only.
    endCounter(g);
    takeDamage(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Character may be the target', () => {
    const g = start(FORMER3);
    useCounter(g, ID);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(7000);
  });

  it('"up to 1": the target can be declined', () => {
    const g = start(WB4);
    useCounter(g, ID);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('must not fire: another type is only revealed and stays on top, no power', () => {
    const g = start(V.c4);
    useCounter(g, ID);
    expect(g.eventsOfType('CardRevealed').at(-1)).toMatchObject({ card: V.c4 });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(deckOf(g, 'p1')[0]).toBe(V.c4);
    expect(dec(g)?.kind).toBe('counter');
  });

  it('[Trigger]: draw 1 card', () => {
    const g = trigGame(ID, { deck: [V.c2, V.c3] as never, hand: [] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });
});
