/** OP13-015 Makino. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick } from './helpers.ts';
import { canActivate } from './helpers-op16g1.ts';
import { ACE_CHAR, LUFFY_CHAR, mk } from './helpers-op13g1.ts';

const ID = 'OP13-015';

describe('OP13-015 Makino', () => {
  const start = (p1 = {}) => mk({ characters: [ID, LUFFY_CHAR, ACE_CHAR], ...p1 });
  const act = (g: ReturnType<typeof mk>) =>
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'main' });

  it('[Activate: Main]: rests Makino; up to 1 of your [Monkey.D.Luffy] cards gains +2000 power this turn', () => {
    const g = start();
    act(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    pick(g, [g.find('p1', 'characters', LUFFY_CHAR)]);
    expect(g.power(g.find('p1', 'characters', LUFFY_CHAR))).toBe(7000);
  });

  it('the Leader is a [Monkey.D.Luffy] card too; only Luffy cards are offered', () => {
    const g = start();
    act(g);
    const offered = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(offered.sort()).toEqual([g.leader('p1'), g.find('p1', 'characters', LUFFY_CHAR)].sort());
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', ACE_CHAR))).toBe(6000);
  });

  it('"up to 1": may choose nothing, but Makino is rested for the cost anyway', () => {
    const g = start();
    act(g);
    none(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expectDecision(g, 'main', 'p1');
  });

  it('cannot be activated while rested', () => {
    const g = mk({ characters: [{ card: ID, rested: true }, LUFFY_CHAR] });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'main')).toBe(false);
  });

  it('can be activated the turn she is played; +2000 ends with the turn', () => {
    const g = mk({ characters: [{ card: ID, playedThisTurn: true }, LUFFY_CHAR] });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'main')).toBe(true);
    act(g);
    pick(g, [g.find('p1', 'characters', LUFFY_CHAR)]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', LUFFY_CHAR))).toBe(5000);
  });
});
