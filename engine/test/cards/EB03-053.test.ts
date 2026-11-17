/** EB03-053 Nami. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  expectDecision,
  game,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { GENBO, ids, KAL, SETO, WYPER6 } from './helpers-kalgara.ts';

describe('EB03-053 Nami', () => {
  it("[On Play] gives a rested DON!! to the Leader, then (3+ opponent Life) a top Life card to the owner's hand", () => {
    const g = game(
      { leader: KAL, hand: ['EB03-053'], costArea: { active: 5, rested: 1 } },
      { leader: PLAIN_BLUE, life: [V.c2, PURPLE, PURPLE] },
    );
    play(g, 'EB03-053');
    pick(g, [g.leader('p1')]); // "up to 1" DON!!: the Leader is the only target
    // "up to 1" life card: accept.
    accept(g);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(g.life('p2')).toBe(2);
    expect(ids(g.zone('p2', 'hand'))).toEqual([V.c2]); // to the owner, not to p1
    expect(g.zone('p1', 'hand')).toEqual([]);
  });

  it('does not take Life when the opponent has 2 or less', () => {
    const g = game(
      { leader: KAL, hand: ['EB03-053'], costArea: { active: 5, rested: 1 } },
      { leader: PLAIN_BLUE, life: [PURPLE, PURPLE] },
    );
    play(g, 'EB03-053');
    pick(g, [g.leader('p1')]); // "up to 1" DON!!: the Leader is the only target
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(g.life('p2')).toBe(2);
    expectDecision(g, 'main', 'p1');
  });

  it('the DON!! rested to pay for Nami can be the one given; the Life part is a separate "Then, if"', () => {
    const g = game(
      { leader: KAL, hand: ['EB03-053'], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE, life: [PURPLE, PURPLE, PURPLE] },
    );
    play(g, 'EB03-053');
    pick(g, [g.leader('p1')]); // "up to 1" DON!!: the Leader is the only target
    // The 5 DON!! paid for Nami are rested and given to the Leader.
    accept(g);
    expect(g.life('p2')).toBe(2);
  });

  it('"up to 1": the Life card may be left', () => {
    const g = game(
      { leader: KAL, hand: ['EB03-053'], costArea: { active: 5, rested: 1 } },
      { leader: PLAIN_BLUE, life: [PURPLE, PURPLE, PURPLE] },
    );
    play(g, 'EB03-053');
    pick(g, [g.leader('p1')]); // "up to 1" DON!!: the Leader is the only target
    decline(g);
    expect(g.life('p2')).toBe(3);
  });

  describe('[On K.O.]', () => {
    const koed = (hand: string[], life = [V.c2, V.c3, V.c4]) => {
      const g = game(
        { leader: KAL, characters: [{ card: 'EB03-053', rested: true }], hand, life },
        { leader: PLAIN_BLUE, characters: [V.c7] },
        { turn: 4, activePlayer: 'p2' },
      );
      g.act({
        type: 'attack',
        attacker: g.find('p2', 'characters', V.c7),
        target: g.find('p1', 'characters', 'EB03-053'),
      });
      g.act({ type: 'block', blocker: null });
      g.act({ type: 'endCounter' });
      return g;
    };

    it('turns the top Life card face-up to play a Character with 6000 power or less', () => {
      const g = koed([GENBO, SETO, WYPER6]);
      accept(g);
      expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2); // Genbo 5000, Seto 6000
      pick(g, [g.find('p1', 'hand', SETO)]);
      expect(ids(g.zone('p1', 'characters'))).toEqual([SETO]);
      expect(ids(g.zone('p1', 'trash'))).toEqual(['EB03-053']);
      expect(g.life('p1')).toBe(3); // turned face-up, not removed
    });

    it('is optional: declining leaves Life face-down and plays nothing', () => {
      const g = koed([GENBO]);
      decline(g);
      expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
      expect(g.zone('p1', 'characters')).toEqual([]);
    });

    it('"up to 1": the cost is paid and nothing may be played', () => {
      const g = koed([GENBO]);
      accept(g);
      none(g);
      expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
      expect(g.zone('p1', 'characters')).toEqual([]);
    });

    it('cannot be paid when the top Life card is already face-up', () => {
      const h = game(
        {
          leader: KAL,
          characters: [{ card: 'EB03-053', rested: true }],
          hand: [GENBO],
          life: [{ card: V.c2, faceUp: true }, V.c3],
        },
        { leader: PLAIN_BLUE, characters: [V.c7] },
        { turn: 4, activePlayer: 'p2' },
      );
      h.act({
        type: 'attack',
        attacker: h.find('p2', 'characters', V.c7),
        target: h.find('p1', 'characters', 'EB03-053'),
      });
      h.act({ type: 'block', blocker: null });
      h.act({ type: 'endCounter' });
      // No optional offer: the top Life card is already face-up.
      expect(h.legal().some((a) => a.type === 'optional')).toBe(false);
      expect(h.zone('p1', 'characters')).toEqual([]);
    });
  });
});
