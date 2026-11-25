/** OP09-104 Sabo. */
import { describe, expect, it } from 'vitest';
import {
  dec,
  expectDecision,
  game,
  hand,
  none,
  option,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  play,
  PURPLE,
  V,
} from './helpers.ts';
import { canPick, MULTI_LEADER, RA_CHAR } from './helpers-w5c1.ts';
import { damageWith } from './triggers.ts';

const ID = 'OP09-104';
const start = (life: string[], handCards: string[] = [RA_CHAR]) =>
  game(
    { leader: PLAIN_PURPLE, hand: [ID, ...handCards], life, costArea: { active: 7, rested: 0 } },
    { leader: PLAIN_BLUE },
  );
const lifeCards = (g: ReturnType<typeof start>) => g.zone('p1', 'life').map((c) => c.card);

describe('OP09-104 Sabo', () => {
  describe('[On Play]', () => {
    it('adds a {Revolutionary Army} Character from hand to the top of Life face-up, then takes the top Life card to hand', () => {
      const g = start([V.c1, V.c2]);
      play(g, ID);
      pick(g, [g.find('p1', 'hand', RA_CHAR)]);
      // Life is now Hack (face-up), c1, c2: 3 cards, so one goes to hand: top or bottom.
      expect(lifeCards(g)).toEqual([RA_CHAR, V.c1, V.c2]);
      expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
      const d = expectDecision(g, 'choose', 'p1');
      expect(d.options?.map((o) => o.id)).toEqual(['top', 'bottom']);
      option(g, 'top');
      expect(hand(g, 'p1')).toEqual([RA_CHAR]);
      expect(lifeCards(g)).toEqual([V.c1, V.c2]);
      expect(dec(g)?.kind).toBe('main');
    });

    it('the card from the bottom can be taken instead', () => {
      const g = start([V.c1, V.c2]);
      play(g, ID);
      pick(g, [g.find('p1', 'hand', RA_CHAR)]);
      option(g, 'bottom');
      expect(hand(g, 'p1')).toEqual([V.c2]);
      expect(lifeCards(g)).toEqual([RA_CHAR, V.c1]);
    });

    it('only a {Revolutionary Army} Character can be added: other cards in hand cannot', () => {
      const g = start([V.c1], [RA_CHAR, V.c3, PURPLE]);
      play(g, ID);
      expectDecision(g, 'choose', 'p1');
      expect(canPick(g, g.find('p1', 'hand', RA_CHAR))).toBe(true);
      expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(false);
      expect(canPick(g, g.find('p1', 'hand', PURPLE))).toBe(false);
    });

    it('boundary: with 1 Life, the added card makes 2, so one is taken; with 0 Life it makes 1 and nothing is taken', () => {
      const one = start([V.c1]);
      play(one, ID);
      pick(one, [one.find('p1', 'hand', RA_CHAR)]);
      expectDecision(one, 'choose', 'p1');
      option(one, 'top');
      expect(lifeCards(one)).toEqual([V.c1]);

      const zero = start([]);
      play(zero, ID);
      pick(zero, [zero.find('p1', 'hand', RA_CHAR)]);
      expect(dec(zero)?.kind).toBe('main');
      expect(lifeCards(zero)).toEqual([RA_CHAR]);
      expect(hand(zero, 'p1')).toEqual([]);
    });

    it('"up to 1": adding nothing still takes a Life card when you have 2 or more', () => {
      const g = start([V.c1, V.c2]);
      play(g, ID);
      none(g);
      expectDecision(g, 'choose', 'p1');
      option(g, 'top');
      expect(hand(g, 'p1')).toEqual([RA_CHAR, V.c1]);
      expect(lifeCards(g)).toEqual([V.c2]);
    });

    it('must not take a Life card with fewer than 2: adding nothing with 1 Life leaves it', () => {
      const g = start([V.c1]);
      play(g, ID);
      none(g);
      expect(dec(g)?.kind).toBe('main');
      expect(lifeCards(g)).toEqual([V.c1]);
      expect(hand(g, 'p1')).toEqual([RA_CHAR]);
    });

    it('with no {Revolutionary Army} card in hand the pick is empty and the Life step still runs', () => {
      const g = start([V.c1, V.c2], [V.c3]);
      play(g, ID);
      // The pick is still asked, at a maximum of 0, so the question does not show what the hand holds.
      const ask = expectDecision(g, 'choose', 'p1');
      expect([ask.min, ask.max]).toEqual([0, 0]);
      none(g);
      expectDecision(g, 'choose', 'p1');
      option(g, 'bottom');
      expect(hand(g, 'p1')).toEqual([V.c3, V.c2]);
    });
  });

  describe('[Trigger] if your Leader is multicolored, draw 2 cards', () => {
    it('a multicolored Leader draws 2', () => {
      const g = damageWith(ID, { leader: MULTI_LEADER });
      g.act({ type: 'trigger', activate: true });
      expect(hand(g, 'p1')).toHaveLength(2);
    });

    it('a single-colour Leader draws nothing (and the Trigger is used up)', () => {
      const g = damageWith(ID, { leader: PLAIN_PURPLE });
      g.act({ type: 'trigger', activate: true });
      expect(hand(g, 'p1')).toHaveLength(0);
      expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(ID);
    });

    it('declining the Trigger adds Sabo to the hand with no draw', () => {
      const g = damageWith(ID, { leader: MULTI_LEADER });
      g.act({ type: 'trigger', activate: false });
      expect(hand(g, 'p1')).toEqual([ID]);
    });
  });
});
