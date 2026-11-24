/** OP15-054 And No One Else Can Have It! It's Our Memento of Him. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, option, pick, play, V } from './helpers.ts';
import { DRESS2, DRESS5, DRESSROSA_LEADER, idsOf, LUCY, mine, STAGE } from './helpers-op15g2.ts';

const ID = 'OP15-054';
/** OP05-090 Riku Doldo III: {Dressrosa}, cost 4, 5000, [Blocker] only. */
const RIKU = 'OP05-090';

describe("OP15-054 And No One Else Can Have It! It's Our Memento of Him", () => {
  const modeOf = (g: ReturnType<typeof mine>, n: number) => {
    const d = expectDecision(g, 'choose', 'p1');
    return d.options![n]!.id;
  };

  it('[Main] with a [Lucy] Leader, mode 1: draw 2, trash 1, then play up to 1 {Dressrosa} Character cost 4 or less from hand', () => {
    const g = mine(LUCY, { hand: [ID, DRESS2], deck: [V.c1, RIKU, V.c2] });
    play(g, ID);
    option(g, modeOf(g, 0));
    // After drawing 2 the hand is [DRESS2, V.c1, RIKU]; trash V.c1, then play RIKU (cost 4, just drawn).
    pick(g, [g.find('p1', 'hand', V.c1)]);
    pick(g, [g.find('p1', 'hand', RIKU)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([RIKU]);
    expect(idsOf(g, 'p1', 'trash')).toContain(V.c1);
    expect(hand(g, 'p1')).toEqual([DRESS2]);
  });

  it('only {Dressrosa} Characters with a cost of 4 or less can be played (cost 5 and non-Dressrosa cannot)', () => {
    const g = mine(LUCY, { hand: [ID, DRESS5, V.c2, RIKU, V.c1], deck: [V.c3, V.c3, V.c3, V.c3] });
    play(g, ID);
    option(g, modeOf(g, 0));
    pick(g, [g.find('p1', 'hand', V.c1)]);
    const picks = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(picks).toEqual([g.find('p1', 'hand', RIKU)]);
    none(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });

  it("mode 2: return up to 1 Stage to its owner's hand (the opponent's Stage goes to the opponent's hand)", () => {
    const g = mine(LUCY, { hand: [ID] }, { stage: STAGE });
    play(g, ID);
    option(g, modeOf(g, 1));
    pick(g, [g.find('p2', 'stage', STAGE)]);
    expect(idsOf(g, 'p2', 'stage')).toEqual([]);
    expect(hand(g, 'p2')).toEqual([STAGE]);
  });

  it('mode 2 may return your own Stage, or nothing ("up to 1")', () => {
    const g = mine(LUCY, { hand: [ID], stage: STAGE });
    play(g, ID);
    option(g, modeOf(g, 1));
    pick(g, [g.find('p1', 'stage', STAGE)]);
    expect(hand(g, 'p1')).toEqual([STAGE]);
    const h = mine(LUCY, { hand: [ID], stage: STAGE });
    play(h, ID);
    option(h, modeOf(h, 1));
    none(h);
    expect(idsOf(h, 'p1', 'stage')).toEqual([STAGE]);
  });

  it('without a [Lucy] Leader (another {Dressrosa} Leader) nothing happens, but the Event is spent', () => {
    const g = mine(DRESSROSA_LEADER, { hand: [ID], deck: [V.c1, V.c2, V.c3] }, { stage: STAGE });
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(idsOf(g, 'p1', 'trash')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p2', 'stage')).toEqual([STAGE]);
  });
});
