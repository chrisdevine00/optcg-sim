/**
 * OP09-031 Donquixote Doflamingo (Character, Green, cost 5, 6000, Counter +1000,
 * {Donquixote Pirates}/{The Seven Warlords of the Sea}/{ODYSSEY}).
 *
 * Card text: "[Blocker]
 * [End of Your Turn] If you have 2 or more rested Characters, set this Character as active."
 *
 * Rules: CR 6-6-1-1 ([End of Your Turn] resolves in the End Phase of its owner's turn),
 * CR 10-1-4 ([Blocker]), a colon-less "If" is an effect condition (DECISIONS 2026-11-24).
 * The count includes this Character when it is rested.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, blockers, passBlock } from '../../helpers.ts';
import { at, atMain, kw, L9, mine, need, theirs, V9 } from './kit-op09b.ts';

const DOFFY = 'OP09-031';

function endMyTurn(g: ReturnType<typeof mine>): void {
  need(g, 'main', 'p1');
  act(g, { type: 'endTurn' });
}

const doffyEffects = (g: ReturnType<typeof mine>) =>
  g.events.filter((e) => e.type === 'EffectActivated' && e.card === DOFFY);

describe('OP09-031 Donquixote Doflamingo: [Blocker]; [End of Your Turn] with 2+ rested Characters, set this Character as active', () => {
  it('rested Doflamingo plus 1 other rested Character (2 rested): it is set active at the end of my turn', () => {
    const g = mine(L9.luffy, {
      characters: [
        { card: DOFFY, rested: true },
        { card: V9.c4, rested: true },
      ],
    });
    endMyTurn(g);
    expect(g.card(at(g, 'p1', 'characters', DOFFY)).rested).toBe(false);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('boundary: rested Doflamingo with every other Character active (only 1 rested) stays rested', () => {
    const g = mine(L9.luffy, {
      characters: [{ card: DOFFY, rested: true }, V9.c4, V9.c5],
    });
    endMyTurn(g);
    expect(g.card(at(g, 'p1', 'characters', DOFFY)).rested).toBe(true);
  });

  it('rested Doflamingo alone (1 rested) stays rested', () => {
    const g = mine(L9.luffy, { characters: [{ card: DOFFY, rested: true }] });
    endMyTurn(g);
    expect(g.card(at(g, 'p1', 'characters', DOFFY)).rested).toBe(true);
  });

  it('only this Character is set active: the other rested Characters stay rested', () => {
    const g = mine(L9.luffy, {
      characters: [
        { card: DOFFY, rested: true },
        { card: V9.c4, rested: true },
        { card: V9.c5, rested: true },
      ],
    });
    endMyTurn(g);
    expect(g.card(at(g, 'p1', 'characters', DOFFY)).rested).toBe(false);
    expect(g.card(at(g, 'p1', 'characters', V9.c4)).rested).toBe(true);
    expect(g.card(at(g, 'p1', 'characters', V9.c5)).rested).toBe(true);
  });

  it('the opponent\'s rested Characters do not count toward "your" rested Characters', () => {
    const g = mine(
      L9.luffy,
      { characters: [{ card: DOFFY, rested: true }] },
      {
        characters: [
          { card: V9.c4, rested: true },
          { card: V9.c5, rested: true },
        ],
      },
    );
    endMyTurn(g);
    expect(g.card(at(g, 'p1', 'characters', DOFFY)).rested).toBe(true);
  });

  it('asks nothing: the effect resolves on its own at the end of the turn', () => {
    const g = mine(L9.luffy, {
      characters: [
        { card: DOFFY, rested: true },
        { card: V9.c4, rested: true },
      ],
    });
    act(g, { type: 'endTurn' });
    // The next decision is the opponent's Main Phase, not a prompt of p1.
    need(g, 'main', 'p2');
    expect(doffyEffects(g)).toHaveLength(1);
  });

  it('an already active Doflamingo with 2 other rested Characters stays active and nothing else changes', () => {
    const g = mine(L9.luffy, {
      characters: [DOFFY, { card: V9.c4, rested: true }, { card: V9.c5, rested: true }],
    });
    endMyTurn(g);
    expect(g.card(at(g, 'p1', 'characters', DOFFY)).rested).toBe(false);
    expect(g.card(at(g, 'p1', 'characters', V9.c4)).rested).toBe(true);
  });

  it("must not fire at the end of the opponent's turn", () => {
    const g = theirs(
      L9.luffy,
      {
        characters: [
          { card: DOFFY, rested: true },
          { card: V9.c4, rested: true },
        ],
      },
      {},
    );
    need(g, 'main', 'p2');
    act(g, { type: 'endTurn' });
    expect(doffyEffects(g)).toHaveLength(0);
  });

  it('has [Blocker] and can block an attack on my Leader (and is then rested)', () => {
    const g = theirs(L9.luffy, { characters: [DOFFY] }, {});
    expect(kw(g, at(g, 'p1', 'characters', DOFFY))).toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', DOFFY)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', DOFFY) });
    expect(g.card(at(g, 'p1', 'characters', DOFFY)).rested).toBe(true);
    passBlock(g);
  });

  it('a rested Doflamingo cannot block', () => {
    const g = theirs(L9.luffy, { characters: [{ card: DOFFY, rested: true }] }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });
});
