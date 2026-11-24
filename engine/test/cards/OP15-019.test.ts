/** OP15-019 Barrier Bulls. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, play, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { mk, PLAIN_BLUE, RED_LEADER } from './helpers-op15g1.ts';

const ID = 'OP15-019';

describe('OP15-019 Barrier Bulls', () => {
  it('[Main]: draws 1 card and your Leader gains +1000 power', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c4] });
    play(g, ID);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(g.zone('p1', 'deck')).toHaveLength(9);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });

  it("the +1000 lasts until the end of your opponent's next End Phase, not just this turn", () => {
    const g = mk({ hand: [ID] });
    play(g, ID);
    g.act({ type: 'endTurn' });
    expectDecision(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(6000);
    g.act({ type: 'endTurn' });
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('only your Leader is boosted, and the draw is mandatory even with an empty hand', () => {
    const g = mk({ hand: [ID], characters: [V.c2] });
    play(g, ID);
    expect(g.power(g.find('p1', 'characters', V.c2))).toBe(4000);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it("[Trigger]: gives up to 1 of your opponent's Characters -4000 power this turn", () => {
    const g = damageGame(ID, { leader: RED_LEADER }, { characters: [V.c4] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(2000);
    expect(g.power(g.leader('p1'))).toBe(5000); // the [Main] half is not part of the [Trigger]
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });

  it('[Trigger]: "up to 1" may choose nothing, and an unused trigger does nothing', () => {
    const g = damageGame(ID, { leader: RED_LEADER }, { characters: [V.c4] });
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
    const h = damageGame(ID, { leader: RED_LEADER }, { characters: [V.c4] });
    h.act({ type: 'trigger', activate: false });
    expect(h.power(h.find('p2', 'characters', V.c4))).toBe(6000);
    expect(game({ leader: RED_LEADER }, { leader: PLAIN_BLUE }).zone('p1', 'hand')).toHaveLength(0);
  });
});
