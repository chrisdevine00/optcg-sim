/**
 * OP09-032 Donquixote Rosinante (Character, Green, cost 3, 4000, Counter +1000,
 * {Donquixote Pirates}/{Navy}/{ODYSSEY}).
 *
 * Card text: "[Blocker]
 * [On Your Opponent's Attack] [Once Per Turn] Set this Character as active."
 *
 * Rules: CR 10-2-16 ([On Your Opponent's Attack] resolves when the attack is declared, before the
 * Block Step), CR 10-2-13 ([Once Per Turn] is per card and per turn), CR 10-1-4 ([Blocker]).
 *
 * Not asserted: whether the Once Per Turn is spent when the Character is already active (no ruling).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, blockers, decision, noDefence, passBlock } from '../../helpers.ts';
import { at, atMain, kw, L9, mine, need, theirs, V9 } from './kit-op09b.ts';

const ROS = 'OP09-032';

const rosEffects = (g: ReturnType<typeof mine>) =>
  g.events.filter((e) => e.type === 'EffectActivated' && e.card === ROS);

describe("OP09-032 Donquixote Rosinante: [Blocker]; [On Your Opponent's Attack] [Once Per Turn] set this Character as active", () => {
  it('a rested Rosinante is set active when the opponent attacks my Leader, so it can block', () => {
    const g = theirs(
      L9.luffy,
      { characters: [{ card: ROS, rested: true }] },
      { characters: [V9.c1] },
    );
    attack(g, at(g, 'p2', 'characters', V9.c1), g.leader('p1'));
    expect(decision(g)?.kind).toBe('block');
    expect(g.card(at(g, 'p1', 'characters', ROS)).rested).toBe(false);
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ROS)]);
    passBlock(g);
  });

  it('asks nothing: no optional or choose before the Block Step', () => {
    const g = theirs(
      L9.luffy,
      { characters: [{ card: ROS, rested: true }] },
      { characters: [V9.c1] },
    );
    act(g, { type: 'attack', attacker: at(g, 'p2', 'characters', V9.c1), target: g.leader('p1') });
    need(g, 'block', 'p1');
    expect(rosEffects(g)).toHaveLength(1);
  });

  it('it also fires when the attack is aimed at one of my Characters', () => {
    const g = theirs(
      L9.luffy,
      {
        characters: [
          { card: ROS, rested: true },
          { card: V9.c4, rested: true },
        ],
      },
      { characters: [V9.c1] },
    );
    attack(g, at(g, 'p2', 'characters', V9.c1), at(g, 'p1', 'characters', V9.c4));
    expect(g.card(at(g, 'p1', 'characters', ROS)).rested).toBe(false);
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ROS)]);
    passBlock(g);
  });

  it('once per turn: after it untapped and blocked (rested again), a second attack in the same turn does not untap it', () => {
    const g = theirs(
      L9.luffy,
      { characters: [{ card: ROS, rested: true }] },
      { characters: [V9.c1, V9.c1] },
    );
    attack(g, at(g, 'p2', 'characters', V9.c1, 0), g.leader('p1'));
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ROS) });
    noDefence(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.card(at(g, 'p1', 'characters', ROS)).rested).toBe(true);
    attack(g, at(g, 'p2', 'characters', V9.c1, 1), g.leader('p1'));
    expect(decision(g)?.kind).toBe('block');
    expect(g.card(at(g, 'p1', 'characters', ROS)).rested).toBe(true);
    expect(blockers(g)).toEqual([]);
    expect(rosEffects(g)).toHaveLength(1);
    passBlock(g);
  });

  it('an active Rosinante simply blocks as normal when the opponent attacks', () => {
    const g = theirs(L9.luffy, { characters: [ROS] }, { characters: [V9.c1] });
    attack(g, at(g, 'p2', 'characters', V9.c1), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ROS)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ROS) });
    expect(g.card(at(g, 'p1', 'characters', ROS)).rested).toBe(true);
  });

  it("the once-per-turn use renews on the opponent's next turn", () => {
    const g = theirs(
      L9.luffy,
      { characters: [{ card: ROS, rested: true }] },
      { characters: [V9.c1] },
    );
    attack(g, at(g, 'p2', 'characters', V9.c1), g.leader('p1'));
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ROS) });
    noDefence(g);
    act(g, { type: 'endTurn' });
    // p1's turn 5: Rosinante attacks (and so rests); p2 does not defend.
    need(g, 'main', 'p1');
    act(g, { type: 'attack', attacker: at(g, 'p1', 'characters', ROS), target: g.leader('p2') });
    noDefence(g);
    expect(g.card(at(g, 'p1', 'characters', ROS)).rested).toBe(true);
    act(g, { type: 'endTurn' });
    // p2's turn 6: a new attack, a new use.
    need(g, 'main', 'p2');
    attack(g, at(g, 'p2', 'characters', V9.c1), g.leader('p1'));
    expect(g.card(at(g, 'p1', 'characters', ROS)).rested).toBe(false);
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ROS)]);
    passBlock(g);
  });

  it('must not fire on my own attacks: a rested Rosinante stays rested when my Leader attacks', () => {
    const g = mine(L9.luffy, { characters: [{ card: ROS, rested: true }] });
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(rosEffects(g)).toHaveLength(0);
    expect(g.card(at(g, 'p1', 'characters', ROS)).rested).toBe(true);
  });

  it('has [Blocker]', () => {
    const g = mine(L9.luffy, { characters: [ROS] });
    expect(kw(g, at(g, 'p1', 'characters', ROS))).toContain('Blocker');
  });

  it('a rested Rosinante that is not attacked at all stays rested (no other trigger)', () => {
    const g = theirs(L9.luffy, { characters: [{ card: ROS, rested: true }] }, {});
    need(g, 'main', 'p2');
    expect(g.card(at(g, 'p1', 'characters', ROS)).rested).toBe(true);
    expect(rosEffects(g)).toHaveLength(0);
  });
});
