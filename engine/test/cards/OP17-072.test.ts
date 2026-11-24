/** OP17-072 Black Maria. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  dec,
  endCounter,
  expectDecision,
  hand,
  none,
  passBlock,
  pick,
  PLAIN_PURPLE,
  PURPLE,
  takeDamage,
  trash,
  V,
} from './helpers.ts';
import { oppAttack } from './helpers-op17g3.ts';

const ID = 'OP17-072';
const attacked = (handCards: string[], chars: string[] = [ID], extra = 2) =>
  oppAttack(
    {
      leader: PLAIN_PURPLE,
      characters: chars,
      hand: handCards,
      life: Array.from({ length: extra }, () => PURPLE),
    },
    {},
  );

describe('OP17-072 Black Maria', () => {
  it('has [Blocker]', () => {
    const g = attacked([BLUE]);
    decline(g);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it("[On Your Opponent's Attack] trash 1 card: your Leader gains +1000 power during this battle", () => {
    const g = attacked([BLUE, PURPLE]);
    accept(g);
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    pick(g, [g.leader('p1')]);
    passBlock(g);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(trash(g, 'p1')).toEqual([PURPLE]);
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('can give the power to one of your Characters instead ("Leader or Characters")', () => {
    const g = attacked([BLUE], [ID, PURPLE]);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    pick(g, [g.find('p1', 'characters', PURPLE)]);
    expect(g.power(g.find('p1', 'characters', PURPLE))).toBe(4000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": may choose no target after paying the cost', () => {
    const g = attacked([BLUE]);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('declining the optional cost trashes nothing and boosts nothing', () => {
    const g = attacked([BLUE]);
    decline(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    passBlock(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Once Per Turn]: not offered on the second attack of the turn', () => {
    const g = oppAttack(
      {
        leader: PLAIN_PURPLE,
        characters: [ID],
        hand: [BLUE, BLUE],
        life: [PURPLE, PURPLE, PURPLE],
      },
      { characters: [V.c7, V.c7] },
    );
    // (the attacker V.c7 is first; the first attack is already declared)
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE, 0)]);
    pick(g, [g.leader('p1')]);
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    const second = g.find('p2', 'characters', V.c7, 1);
    g.act({ type: 'attack', attacker: second, target: g.leader('p1') });
    expect(dec(g)?.kind).not.toBe('optional');
    expectDecision(g, 'block', 'p1');
  });
});
