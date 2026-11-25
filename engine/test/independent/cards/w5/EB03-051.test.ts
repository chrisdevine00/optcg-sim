/**
 * EB03-051 Charlotte Smoothie (Character, Yellow, cost 3, 3000, Counter +2000, Special, {Big Mom
 * Pirates}).
 *
 * Card text: "[On Play] If you have a face-up Life card, K.O. up to 1 of your opponent's Characters with
 * a cost of 2 or less. Then, turn all of your Life cards face-down."
 *
 * Rules: CR 3-10-2-1 (a Life card can be face-up), CR 8-3-3 / 4-10-1 (text after a failed "if" does
 * not resolve), CR 4-10-2 ("then" resolves even if the clause before it did nothing), CR 4-8-1
 * ("up to"), CR 10-2-1-2 (K.O.), CR 3-10-2 (Life order is kept).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, decision } from '../../helpers.ts';
import { canFinish, choices, myTurn, side } from '../kit.ts';
import { BLUE, LW, need, put, RED, SW } from './kit-w5a.ts';

const ID = 'EB03-051';
const A = SW.c1;
const B = SW.sai;
const C = SW.marco;
const D = SW.hajrudin;

type Life = NonNullable<PlayerSpec['life']>;

function start(o: { life?: Life; opp?: string[]; oppLife?: Life } = {}) {
  return myTurn(
    side(LW.bigMom, BLUE, {
      hand: [ID],
      costArea: { active: 3, rested: 0 },
      life: o.life ?? [A, B, C, D],
    }),
    side(LW.luffy, RED, {
      characters: o.opp ?? [SW.sai, SW.marco, SW.c1],
      ...(o.oppLife ? { life: o.oppLife } : {}),
    }),
  );
}

const faces = (g: ReturnType<typeof start>, who: 'p1' | 'p2' = 'p1') =>
  g.zone(who, 'life').map((c) => c.faceUp);
const order = (g: ReturnType<typeof start>, who: 'p1' | 'p2' = 'p1') =>
  g.zone(who, 'life').map((c) => c.card);

describe('EB03-051 Charlotte Smoothie: [On Play] if I have a face-up Life card, K.O. up to 1 cost 2 or less; then turn all my Life face-down', () => {
  it('with a face-up Life card: K.O.s a chosen cost-2 Character, then all my Life is face-down', () => {
    const g = start({ life: [{ card: A, faceUp: true }, B, C, D] });
    expect(faces(g)).toEqual([true, false, false, false]);
    put(g, ID);
    need(g, 'choose', 'p1');
    const sai = g.find('p2', 'characters', SW.sai);
    act(g, { type: 'pick', choice: sai });
    if (decision(g)?.kind === 'choose' && canFinish(g)) act(g, { type: 'done' });
    need(g, 'main', 'p1');
    expect(g.zone('p2', 'characters').map((c) => c.card)).not.toContain(SW.sai);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toContain(SW.sai);
    expect(faces(g)).toEqual([false, false, false, false]);
  });

  it('cost 2 and cost 1 are valid targets, cost 3 is not (boundary of "2 or less")', () => {
    const g = start({ life: [{ card: A, faceUp: true }, B, C, D] });
    put(g, ID);
    need(g, 'choose', 'p1');
    const offered = choices(g);
    expect(offered).toContain(g.find('p2', 'characters', SW.sai));
    expect(offered).toContain(g.find('p2', 'characters', SW.c1));
    expect(offered).not.toContain(g.find('p2', 'characters', SW.marco));
    expect(offered).toHaveLength(2);
  });

  it('only the opponent Characters: not the Leaders, not my own Characters', () => {
    const g = myTurn(
      side(LW.bigMom, BLUE, {
        hand: [ID],
        costArea: { active: 3, rested: 0 },
        life: [{ card: A, faceUp: true }, B],
        characters: [SW.c1],
      }),
      side(LW.luffy, RED, { characters: [SW.sai] }),
    );
    put(g, ID);
    need(g, 'choose', 'p1');
    const offered = choices(g);
    expect(offered).toEqual([g.find('p2', 'characters', SW.sai)]);
  });

  it("no face-up Life card: nothing is K.O.'d and no question is asked", () => {
    const g = start({ life: [A, B, C, D] });
    put(g, ID);
    expect(decision(g)?.kind).toBe('main');
    expect(g.zone('p2', 'characters')).toHaveLength(3);
    expect(faces(g)).toEqual([false, false, false, false]);
    expect(order(g)).toEqual([A, B, C, D]);
  });

  it('one face-up card among several face-down is enough, wherever it is (the bottom one here)', () => {
    const g = start({ life: [A, B, C, { card: D, faceUp: true }] });
    put(g, ID);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p2', 'characters', SW.c1) });
    if (decision(g)?.kind === 'choose' && canFinish(g)) act(g, { type: 'done' });
    expect(g.zone('p2', 'characters').map((c) => c.card)).not.toContain(SW.c1);
    expect(faces(g)).toEqual([false, false, false, false]);
  });

  it('only face-up cards are turned: the Life count and the order of the cards stay as they were', () => {
    const g = start({ life: [{ card: A, faceUp: true }, B, { card: C, faceUp: true }, D] });
    put(g, ID);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p2', 'characters', SW.sai) });
    if (decision(g)?.kind === 'choose' && canFinish(g)) act(g, { type: 'done' });
    expect(order(g)).toEqual([A, B, C, D]);
    expect(faces(g)).toEqual([false, false, false, false]);
  });

  it('"up to 1": choosing nothing K.O.s nothing, and the Then clause still turns my Life face-down', () => {
    const g = start({ life: [{ card: A, faceUp: true }, B, C, D] });
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    need(g, 'main', 'p1');
    expect(g.zone('p2', 'characters')).toHaveLength(3);
    expect(faces(g)).toEqual([false, false, false, false]);
  });

  it('with no Character of cost 2 or less to K.O., a face-up Life is still turned face-down', () => {
    const g = start({ life: [{ card: A, faceUp: true }, B, C, D], opp: [SW.marco, SW.kingdew] });
    put(g, ID);
    // An empty "up to" pick may or may not be shown.
    if (decision(g)?.kind === 'choose') {
      expect(choices(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    need(g, 'main', 'p1');
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(faces(g)).toEqual([false, false, false, false]);
  });

  it("the opponent's Life cards are not turned: their face-up card stays face-up", () => {
    const g = start({
      life: [{ card: A, faceUp: true }, B],
      oppLife: [{ card: SW.c1, faceUp: true }, SW.sai],
    });
    put(g, ID);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(faces(g, 'p2')).toEqual([true, false]);
    expect(faces(g, 'p1')).toEqual([false, false]);
  });

  it('a face-up Life card counts for the condition, but only MY Life: the opponent having one is not enough', () => {
    const g = start({ life: [A, B], oppLife: [{ card: SW.c1, faceUp: true }, SW.sai] });
    put(g, ID);
    need(g, 'main', 'p1');
    expect(g.zone('p2', 'characters')).toHaveLength(3);
  });

  it('the cost is the current one: with an opposing OP09-061 Leader (+1 cost) a printed cost 2 Character is cost 3 and is not a target', () => {
    const g = myTurn(
      side(LW.bigMom, BLUE, {
        hand: [ID],
        costArea: { active: 3, rested: 0 },
        life: [{ card: A, faceUp: true }, B],
      }),
      {
        ...side(LW.luffy, RED, { characters: [SW.sai, SW.c1] }),
        leader: { card: 'OP09-061', don: 1 },
      },
    );
    expect(g.card(g.find('p2', 'characters', SW.sai)).cost).toBe(3);
    put(g, ID);
    need(g, 'choose', 'p1');
    // Komachiyo (printed 1) is cost 2 now: a target; Sai (printed 2) is cost 3: not.
    expect(choices(g)).toEqual([g.find('p2', 'characters', SW.c1)]);
  });
});
