/**
 * OP09-118 Gol.D.Roger (Character, Red, cost 10, 13000, no Counter, {Roger Pirates}/{King of the Pirates}).
 *
 * Card text: "[Rush] (This card can attack on the turn in which it is played.)
 * When your opponent activates [Blocker], if either you or your opponent has 0 Life cards, you win the
 * game."
 *
 * Rules: CR 10-1-4 (Rush), CR 7-1-2 (a [Blocker] is activated in the Block Step by the defending
 * player), a win is a game result; "you" is Roger's controller, "your opponent" activates [Blocker].
 * Open question M6b-Q50 (simultaneous defeat) is not relied on here.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  BLUE,
  block,
  C9,
  canAttackAnything,
  hand,
  kind,
  L9,
  mine,
  need,
  passBlock,
  passCounter,
  playId,
  RED,
  theirs,
  winner,
} from './kit-op09d.ts';

const ID = 'OP09-118';
const life = (n: number, c: string) => Array(n).fill(c) as string[];

/** p1's turn: Roger on the field; p2 has Franky [Blocker] (5000) and a rested Character to be attacked. */
function mineTurn(myLife: number, oppLife: number, o: { roger?: boolean; extra?: string[] } = {}) {
  return mine(
    L9.neutral,
    {
      characters: [...(o.roger === false ? [] : [ID]), ...(o.extra ?? [])],
      life: life(myLife, BLUE),
    },
    {
      characters: [C9.franky, { card: C9.c3, rested: true }],
      life: life(oppLife, RED),
    },
  );
}

describe('OP09-118 Gol.D.Roger: when my opponent activates [Blocker], if either of us has 0 Life cards, I win', () => {
  it('the opponent has 0 Life: they block my Roger attack with Franky and I win at once', () => {
    const g = mineTurn(4, 0);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    need(g, 'block', 'p2');
    block(g, g.find('p2', 'characters', C9.franky));
    expect(winner(g)).toBe('p1');
  });

  it('I have 0 Life (the opponent has 4): when they block, I win', () => {
    const g = mineTurn(0, 4);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    need(g, 'block', 'p2');
    block(g, g.find('p2', 'characters', C9.franky));
    expect(winner(g)).toBe('p1');
  });

  it("boundary: both players have 1 Life: the block happens, nobody wins, Franky is K.O.'d by 13000 power", () => {
    const g = mineTurn(1, 1);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    block(g, g.find('p2', 'characters', C9.franky));
    expect(winner(g)).toBeNull();
    passCounter(g);
    expect(winner(g)).toBeNull();
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([C9.c3]);
    expect(g.life('p1')).toBe(1);
    expect(g.life('p2')).toBe(1);
  });

  it('only a [Blocker] activation triggers it: with 0 Life for me, if the opponent does not block, there is no win from Roger', () => {
    const g = mineTurn(0, 4);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    need(g, 'block', 'p2');
    passBlock(g);
    passCounter(g);
    expect(winner(g)).toBeNull();
    expect(g.life('p2')).toBe(3);
  });

  it('it works whichever of my Characters attacks: Roger stays behind, another Character is blocked, I win', () => {
    const g = mineTurn(4, 0, { extra: [C9.c4] });
    attack(g, g.find('p1', 'characters', C9.c4), g.leader('p2'));
    block(g, g.find('p2', 'characters', C9.franky));
    expect(winner(g)).toBe('p1');
  });

  it('a block against an attack on one of their own Characters also counts', () => {
    const g = mineTurn(4, 0);
    attack(g, g.find('p1', 'characters', ID), g.find('p2', 'characters', C9.c3));
    need(g, 'block', 'p2');
    block(g, g.find('p2', 'characters', C9.franky));
    expect(winner(g)).toBe('p1');
  });

  it('without Roger on the field (a copy in hand) the same position does not win', () => {
    const g = mine(
      L9.neutral,
      { characters: [C9.c4], hand: [ID], life: life(4, BLUE) },
      { characters: [C9.franky], life: life(0, RED) },
    );
    attack(g, g.find('p1', 'characters', C9.c4), g.leader('p2'));
    block(g, g.find('p2', 'characters', C9.franky));
    expect(winner(g)).toBeNull();
    expect(hand(g)).toEqual([ID]);
  });

  it("it is MY opponent's [Blocker] that counts: when I block on their turn with Roger on my field, I do not win", () => {
    const g = theirs(
      L9.neutral,
      { characters: [ID, C9.franky], life: [] },
      { characters: [C9.c4], life: life(4, RED), costArea: { active: 10, rested: 0 } },
    );
    attack(g, g.find('p2', 'characters', C9.c4), g.leader('p1'));
    need(g, 'block', 'p1');
    block(g, g.find('p1', 'characters', C9.franky));
    expect(winner(g)).toBeNull();
  });

  it('Roger controlled by the player whose Life is fine: the opponent with 0 Life is enough, my own Life is irrelevant (5 Life)', () => {
    const g = mineTurn(5, 0);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    block(g, g.find('p2', 'characters', C9.franky));
    expect(winner(g)).toBe('p1');
  });

  it('[Rush]: played from hand for 10 DON!!, it can attack the same turn, and is a 13000-power Character', () => {
    const g = mine(L9.neutral, { hand: [ID] }, { characters: [C9.franky] });
    playId(g, ID);
    expect(atMain(g)).toBe(true);
    const roger = g.find('p1', 'characters', ID);
    expect(g.card(roger).keywords).toContain('Rush');
    expect(g.power(roger)).toBe(13000);
    expect(canAttackAnything(g, roger)).toBe(true);
  });

  it('after the win nothing more is pending', () => {
    const g = mineTurn(4, 0);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    block(g, g.find('p2', 'characters', C9.franky));
    expect(winner(g)).toBe('p1');
    expect(kind(g)).toBeNull();
    void act;
  });
});
