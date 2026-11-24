/** OP13-020 Meteor Fist. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { LUFFY_LEADER, mk } from './helpers-op13g1.ts';

const ID = 'OP13-020';

describe('OP13-020 Meteor Fist', () => {
  it('[Main]: gives up to 1 opposing Character -5000 power this turn', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c4, V.c7] });
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(1000);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
  });

  it('may take power below 0; only Characters are candidates (not the Leader)', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c1] });
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(-2000);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('"up to 1": may choose nothing', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c4] });
    play(g, ID);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });

  it('lasts this turn only', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c4] });
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });

  it("[Trigger]: activates this card's [Main] effect (-5000), without needing it in hand", () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER }, { characters: [V.c4] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(1000);
  });

  it('[Trigger] declined, or with no opposing Character: nothing happens', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER }, { characters: [V.c4] });
    g.act({ type: 'trigger', activate: false });
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
    const h = mk({ hand: [ID] });
    play(h, ID);
    expectDecision(h, 'main', 'p1');
  });
});
