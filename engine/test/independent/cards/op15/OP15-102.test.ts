/**
 * OP15-102 Gan.Fall (Character, Yellow, cost 4, 4000, Counter +2000, {Sky Island}).
 *
 * Card text (cost sign restored by override): "If you have a {Sky Island} type Character with 7000 power or
 * more, give this card in your hand -3 cost.
 * [On Play] Rest up to 1 of your opponent's Characters with a cost equal to or less than the number of your
 * opponent's Life cards."
 *
 * Rules relied on: CR 8-1-3 (permanent effect that works from the hand), CR 2-6-2 (power is the current
 * power), "up to" may choose nothing, rest is not K.O.; the cost modifier works on the card in hand only.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  chars,
  choices,
  don,
  isLegal,
  kind,
  LD15,
  mayChooseNone,
  mine,
  need,
  offeredIds,
  pickCards,
  playRaw,
  reachablePickSets,
  SC15,
  skipChoice,
  trash,
} from './kit-op15c.ts';

const GAN = 'OP15-102';

function start(
  o: {
    mine?: string[];
    active?: number;
    p2?: (string | { card: string; rested: boolean })[];
    p2Life?: string[];
  } = {},
) {
  return mine(
    LD15.neutral,
    { hand: [GAN], characters: o.mine ?? [], costArea: { active: o.active ?? 10, rested: 0 } },
    { characters: o.p2 ?? [SC15.red4, SC15.red5], ...(o.p2Life ? { life: o.p2Life } : {}) },
  );
}

const playable = (g: ReturnType<typeof start>) =>
  isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', GAN) });

describe('OP15-102 Gan.Fall: -3 cost in hand', () => {
  it('with a {Sky Island} Character of 7000 power (Wyper): costs 1, so 1 active DON!! is enough', () => {
    const g = start({ mine: [SC15.sky6], active: 1 });
    expect(g.card(g.find('p1', 'hand', GAN)).cost).toBe(1);
    expect(playable(g)).toBe(true);
    playRaw(g, g.find('p1', 'hand', GAN));
    expect(don(g).active).toBe(0);
    expect(don(g).rested).toBe(1);
  });

  it('a stronger {Sky Island} Character (8000 Kalgara) also gives the reduction', () => {
    const g = start({ mine: [SC15.kalgara], active: 1 });
    expect(playable(g)).toBe(true);
  });

  it('exactly 7000 power counts (Nola 7000, {Animal}/{Sky Island})', () => {
    const g = start({ mine: [SC15.sky5x7], active: 1 });
    expect(g.card(g.find('p1', 'hand', GAN)).cost).toBe(1);
  });

  it('no such Character: it costs its printed 4, so 3 active DON!! are not enough', () => {
    const g = start({ active: 3 });
    expect(g.card(g.find('p1', 'hand', GAN)).cost).toBe(4);
    expect(playable(g)).toBe(false);
  });

  it('with 4 active DON!! it can be played at full cost', () => {
    const g = start({ active: 4 });
    expect(playable(g)).toBe(true);
    playRaw(g, g.find('p1', 'hand', GAN));
    expect(don(g).active).toBe(0);
  });

  it('boundary: a {Sky Island} Character with 6000 power (Seto) is not enough: still cost 4', () => {
    const g = start({ mine: [SC15.sky5], active: 3 });
    expect(g.card(g.find('p1', 'hand', GAN)).cost).toBe(4);
    expect(playable(g)).toBe(false);
  });

  it('a 7000+ power Character that is not {Sky Island} (Kingdew 7000) does not give the reduction', () => {
    const g = start({ mine: [SC15.red5], active: 3 });
    expect(g.card(g.find('p1', 'hand', GAN)).cost).toBe(4);
    expect(playable(g)).toBe(false);
  });

  it('the reduction is for the card in hand only: on the field Gan.Fall shows cost 4', () => {
    const g = start({ mine: [SC15.sky6], active: 1 });
    playRaw(g, g.find('p1', 'hand', GAN));
    if (kind(g) === 'choose') skipChoice(g);
    expect(g.card(at(g, 'p1', 'characters', GAN)).cost).toBe(4);
  });
});

describe('OP15-102 Gan.Fall [On Play]', () => {
  const play = (o: Parameters<typeof start>[0] = {}) => {
    const g = start(o);
    playRaw(g, g.find('p1', 'hand', GAN));
    return g;
  };

  it('opponent with 4 Life: offers Characters with cost 4 or less (4 yes, 5 no) and rests the chosen one', () => {
    const g = play();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC15.red4]);
    pickCards(g, [SC15.red4]);
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', SC15.red4)).rested).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', SC15.red5)).rested).toBe(false);
  });

  it('it rests the target, it does not K.O. it', () => {
    const g = play();
    pickCards(g, [SC15.red4]);
    expect(chars(g, 'p2')).toEqual([SC15.red4, SC15.red5].sort());
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('the limit is the opponent’s Life count: with 2 Life only cost 2 or less qualifies', () => {
    const g = play({
      p2: [SC15.red2, SC15.red3],
      p2Life: [SC15.red2, SC15.red2],
    });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC15.red2]);
  });

  it('with 5 Life a cost-5 Character qualifies', () => {
    const g = play({ p2Life: [SC15.red2, SC15.red2, SC15.red2, SC15.red2, SC15.red2] });
    expect(offeredIds(g)).toEqual([SC15.red4, SC15.red5].sort());
  });

  it('with 0 Life only a cost-0 Character could qualify: there is none, so nothing happens', () => {
    const g = play({ p2Life: [] });
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      skipChoice(g);
    }
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', SC15.red4)).rested).toBe(false);
  });

  it('"up to 1": choosing nothing rests nothing', () => {
    const g = play();
    expect(mayChooseNone(g)).toBe(true);
    skipChoice(g);
    expect(g.card(at(g, 'p2', 'characters', SC15.red4)).rested).toBe(false);
  });

  it('rests at most one Character even when two qualify', () => {
    const g = play({ p2: [SC15.red3, SC15.red4] });
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
  });

  it('only the opponent’s Characters are offered, not mine', () => {
    const g = play({ mine: [SC15.red2] });
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', SC15.red2));
  });
});
