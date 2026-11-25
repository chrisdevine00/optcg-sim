/** OP10-097 Gum-Gum Rhino Schneider. */
import { describe, expect, it } from 'vitest';
import { dec, hand, none, pick, play, trash, V } from './helpers.ts';
import { canPick, DR3, pw, start, times, trigGame } from './helpers-a10g4.ts';

const ID = 'OP10-097';

/** `n` other cards in the trash (this Event makes it n + 1 when it resolves). */
const main = (n: number) => start({ hand: [ID], characters: [DR3, V.c2], trash: times(n, V.c1) });
const banish = (g: ReturnType<typeof start>) =>
  g.card(g.find('p1', 'characters', DR3)).keywords.includes('Banish');

describe('OP10-097 Gum-Gum Rhino Schneider', () => {
  it('[Main]: +2000 to a {Dressrosa} Character this turn; with 10+ cards in the trash it also gains [Banish]', () => {
    const g = main(9); // 9 + this Event = 10 (boundary)
    play(g, ID);
    expect(canPick(g, g.find('p1', 'characters', DR3))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false); // not {Dressrosa}
    pick(g, [g.find('p1', 'characters', DR3)]);
    expect(pw(g, 'p1', DR3)).toBe(7000);
    expect(banish(g)).toBe(true);
    expect(trash(g, 'p1')).toHaveLength(10);
    g.act({ type: 'endTurn' });
    expect(banish(g)).toBe(false);
    expect(pw(g, 'p1', DR3)).toBe(5000);
  });

  it('must not grant [Banish] with 9 cards in the trash (this Event included): only the +2000', () => {
    const g = main(8);
    play(g, ID);
    pick(g, [g.find('p1', 'characters', DR3)]);
    expect(pw(g, 'p1', DR3)).toBe(7000);
    expect(banish(g)).toBe(false);
  });

  it('"that card": [Banish] goes to the Character that got the +2000, not to another one', () => {
    const g = start({ hand: [ID], characters: [DR3, DR3], trash: times(12, V.c1) });
    play(g, ID);
    pick(g, [g.find('p1', 'characters', DR3, 1)]);
    expect(g.card(g.find('p1', 'characters', DR3, 1)).keywords).toContain('Banish');
    expect(g.card(g.find('p1', 'characters', DR3, 0)).keywords).not.toContain('Banish');
  });

  it('"up to 1": with nobody chosen nothing is granted', () => {
    const g = main(12);
    play(g, ID);
    none(g);
    expect(banish(g)).toBe(false);
    expect(pw(g, 'p1', DR3)).toBe(5000);
  });

  it('[Trigger]: draw 2 cards and trash 1 card from your hand', () => {
    const g = trigGame(ID, { hand: [V.c3], deck: [V.c4, V.c5, V.c6] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([V.c3, V.c4, V.c5]);
    pick(g, [g.find('p1', 'hand', V.c3)]);
    expect(hand(g, 'p1')).toEqual([V.c4, V.c5]);
    expect(trash(g, 'p1')).toContain(V.c3);
    expect(dec(g)?.kind).not.toBe('choose');
  });
});
