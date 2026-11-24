/** OP13-117 Gum-Gum Dawn Stamp. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, dec, none, pick, play, PLAIN_PURPLE, V } from './helpers.ts';
import { canPick, mine, names, rep, trig } from './helpers-op13g4.ts';

const ID = 'OP13-117';

describe('OP13-117 Gum-Gum Dawn Stamp', () => {
  const run = (life: Parameters<typeof mine>[0]['life'] = rep(3, BLUE), opp = [V.c6, V.c7]) => {
    const g = mine({ leader: PLAIN_PURPLE, hand: [ID], life }, { characters: opp }, 5);
    play(g, ID);
    return g;
  };

  it('[Main] turn 1 Life face-up: K.O. a Character with base cost 6 or less', () => {
    const g = run();
    accept(g);
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(names(g, 'p2', 'characters')).toEqual([V.c7]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.life('p1')).toBe(3);
  });

  it('declining the optional Life cost: no K.O., Life unchanged', () => {
    const g = run();
    decline(g);
    expect(names(g, 'p2', 'characters')).toHaveLength(2);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
  });

  it('cannot be paid with the top Life card face-up: the Event is played without the effect', () => {
    const g = run([{ card: BLUE, faceUp: true }, BLUE]);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(names(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('"up to 1": may K.O. nothing; with no legal target the Life card is still turned', () => {
    const g = run();
    accept(g);
    none(g);
    expect(names(g, 'p2', 'characters')).toHaveLength(2);
    const h = run(rep(3, BLUE), [V.c7]);
    accept(h);
    if (dec(h)?.kind === 'choose') none(h);
    expect(h.zone('p1', 'life')[0]!.faceUp).toBe(true);
  });

  it('[Trigger] draws 1 card', () => {
    const g = trig(ID, { leader: PLAIN_PURPLE, deck: rep(5, BLUE) });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain(BLUE);
  });
});
