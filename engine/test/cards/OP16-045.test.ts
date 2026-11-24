/** OP16-045 Crocodile. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, hand, none, pick, play } from './helpers.ts';
import { IVANKOV, LUFFY_034, mine, MR2_G, MR3_G } from './helpers-op16g2.ts';

const ID = 'OP16-045';
const onField = (g: ReturnType<typeof mine>) => g.zone('p1', 'characters').map((c) => c.card);

describe('OP16-045 Crocodile', () => {
  it('has [Blocker]', () => {
    const g = mine({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] return 1 of your Characters with a cost of 2 or more to your hand: play up to 1 {Impel Down} Character with a cost of 2 or less from your hand', () => {
    const g = mine({ hand: [ID, IVANKOV], characters: [MR3_G] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', MR3_G)]); // cost 2
    expect(hand(g, 'p1')).toContain(MR3_G);
    pick(g, [g.find('p1', 'hand', IVANKOV)]);
    expect(onField(g).sort()).toEqual([ID, IVANKOV].sort());
    expect(g.card(g.find('p1', 'characters', IVANKOV)).rested).toBe(false);
  });

  it('the returned Character may be played back at once (cost 2 or less)', () => {
    const g = mine({ hand: [ID], characters: [MR3_G] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', MR3_G)]);
    pick(g, [g.find('p1', 'hand', MR3_G)]);
    expect(onField(g).sort()).toEqual([ID, MR3_G].sort());
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('a Character with a cost of 1 cannot be returned (only Crocodile itself, cost 4, can)', () => {
    const g = mine({ hand: [ID, IVANKOV], characters: [LUFFY_034] });
    play(g, ID);
    accept(g);
    // Crocodile is the only eligible Character, so it is returned without a choice.
    expect(onField(g)).toEqual([LUFFY_034]);
    expect(hand(g, 'p1')).toContain(ID);
    pick(g, [g.find('p1', 'hand', IVANKOV)]);
    expect(onField(g).sort()).toEqual([IVANKOV, LUFFY_034].sort());
  });

  it('only a Character with a cost of 2 or less is played: a cost 4 {Impel Down} card is not a candidate', () => {
    const g = mine({ hand: [ID, MR2_G, IVANKOV], characters: [MR3_G] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', MR3_G)]);
    const picks = g.legal().filter((a) => a.type === 'pick');
    const choices = picks.map((a) => (a.type === 'pick' ? a.choice : null));
    expect(choices).toContain(g.find('p1', 'hand', IVANKOV));
    expect(choices).not.toContain(g.find('p1', 'hand', MR2_G));
  });

  it('"up to 1": may play none, and the cost may be declined (nothing is returned)', () => {
    const g = mine({ hand: [ID, IVANKOV], characters: [MR3_G] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', MR3_G)]);
    none(g);
    expect(hand(g, 'p1')).toContain(MR3_G);
    const g2 = mine({ hand: [ID, IVANKOV], characters: [MR3_G] });
    play(g2, ID);
    decline(g2);
    expect(onField(g2).sort()).toEqual([ID, MR3_G].sort());
    expect(dec(g2)?.kind).toBe('main');
  });
});
