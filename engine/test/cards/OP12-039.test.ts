/** OP12-039 Luffy Is the Man Who Will Become the King of Pirates!!!. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, play, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { at, choices, mk, RED_LEADER, ZORO_LEADER } from './helpers-op12g1.ts';

const ID = 'OP12-039';

describe('OP12-039 Luffy Is the Man Who Will Become the King of Pirates!!!', () => {
  it('[Main]: sets your [Roronoa Zoro] Leader as active', () => {
    const g = mk({ leader: { card: ZORO_LEADER, rested: true } as never, hand: [ID] });
    expect(g.card(g.leader('p1')).rested).toBe(true);
    play(g, ID);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
    expect(dec(g)?.kind).toBe('main');
  });

  it('a Leader that is not [Roronoa Zoro] stays rested', () => {
    const g = mk({ leader: { card: RED_LEADER, rested: true } as never, hand: [ID] });
    play(g, ID);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('an already active [Roronoa Zoro] Leader is unchanged and nothing is asked', () => {
    const g = mk({ leader: ZORO_LEADER, hand: [ID] });
    play(g, ID);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(dec(g)?.kind).toBe('main');
  });

  it('[Main] sets only the Leader, not rested Characters', () => {
    const g = mk({
      leader: { card: ZORO_LEADER, rested: true } as never,
      hand: [ID],
      characters: [{ card: V.c3, rested: true } as never],
    });
    play(g, ID);
    expect(g.card(at(g, 'p1', 'characters', V.c3)).rested).toBe(true);
  });

  it('[Trigger]: up to 1 of your Leader or Character cards gains +1000 power this turn', () => {
    const g = damageGame(ID, { leader: ZORO_LEADER, characters: [V.c3] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(choices(g).sort()).toEqual([g.leader('p1'), at(g, 'p1', 'characters', V.c3)].sort());
    pick(g, [at(g, 'p1', 'characters', V.c3)]);
    expect(g.power(at(g, 'p1', 'characters', V.c3))).toBe(6000);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(at(g, 'p1', 'characters', V.c3))).toBe(5000);
  });

  it('[Trigger]: "up to 1" may be skipped, and declining the trigger does nothing', () => {
    const g = damageGame(ID, { leader: ZORO_LEADER, characters: [V.c3] });
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(g.power(at(g, 'p1', 'characters', V.c3))).toBe(5000);
    const h = damageGame(ID, { leader: ZORO_LEADER, characters: [V.c3] });
    h.act({ type: 'trigger', activate: false });
    expect(h.power(at(h, 'p1', 'characters', V.c3))).toBe(5000);
  });
});
