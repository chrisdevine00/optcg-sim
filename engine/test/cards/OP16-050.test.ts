/** OP16-050 Miss Olive. */
import { describe, expect, it } from 'vitest';
import { BLUE, PURPLE, accept, decline, dec, hand, pick, play } from './helpers.ts';
import { LUFFY_034, mine, MR3_G } from './helpers-op16g2.ts';

const ID = 'OP16-050';
const onField = (g: ReturnType<typeof mine>) => g.zone('p1', 'characters').map((c) => c.card);

describe('OP16-050 Miss Olive', () => {
  it('has [Blocker]', () => {
    const g = mine({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] return 1 of your Characters with a cost of 2 or more to your hand: draw 2 and trash 1 card from your hand', () => {
    const g = mine({ hand: [ID], characters: [MR3_G], deck: [BLUE, PURPLE, BLUE] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', MR3_G)]);
    expect(hand(g, 'p1')).toEqual([MR3_G, BLUE, PURPLE]); // returned card plus 2 drawn
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    expect(hand(g, 'p1')).toEqual([MR3_G, BLUE]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([PURPLE]);
    expect(onField(g)).toEqual([ID]);
  });

  it('the returned card may be the one trashed afterwards', () => {
    const g = mine({ hand: [ID], characters: [MR3_G], deck: [BLUE, PURPLE, BLUE] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', MR3_G)]);
    pick(g, [g.find('p1', 'hand', MR3_G)]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([MR3_G]);
  });

  it('a Character with a cost of 1 cannot be returned: only Miss Olive herself (cost 5) is eligible', () => {
    const g = mine({ hand: [ID], characters: [LUFFY_034], deck: [BLUE, PURPLE, BLUE] });
    play(g, ID);
    accept(g);
    expect(onField(g)).toEqual([LUFFY_034]); // Miss Olive was returned, the cost 1 Character stayed
    expect(hand(g, 'p1')).toContain(ID);
  });

  it('the cost may be declined: nothing is returned, nothing is drawn', () => {
    const g = mine({ hand: [ID], characters: [MR3_G], deck: [BLUE, PURPLE] });
    play(g, ID);
    decline(g);
    expect(onField(g).sort()).toEqual([ID, MR3_G].sort());
    expect(hand(g, 'p1')).toEqual([]);
    expect(dec(g)?.kind).toBe('main');
  });
});
