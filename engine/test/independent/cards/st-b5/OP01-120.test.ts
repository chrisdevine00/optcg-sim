/**
 * OP01-120 Shanks (Character, Red, cost 9, 10000, no Counter, {The Four Emperors}/{Red-Haired
 * Pirates}, [Rush]).
 *
 * Card text: "[Rush] [When Attacking] Your opponent cannot activate a [Blocker] Character that has 2000
 * or less power during this battle."
 *
 * Rules: [Rush] lets a Character attack on the turn it is played (CR 10-1-1-1); [When Attacking]
 * is an auto effect of the attack (CR 7-1-1-3) and so applies before the Block Step; "2000 or less"
 * includes exactly 2000; "during this battle" ends at End of the Battle (CR 7-1-5-3), so a later
 * battle is unaffected; only one [Blocker] may be activated per battle (RD 91).
 */
import { describe, expect, it } from 'vitest';
import {
  attack,
  blockers,
  kind,
  kw,
  mine,
  noDefence,
  pw,
  SL,
  playCardRaw,
  passBlock,
} from './kit-stb5a.ts';

const ID = 'OP01-120';
const KILLER = 'OP01-039'; // Green, cost 2, 2000, [Blocker]
const MCKINLEY = 'OP05-112'; // Yellow, cost 3, 3000, [Blocker]
const ROSINANTE = 'OP05-030'; // Green, cost 2, 1000, [Blocker]
const KAIDO = 'OP17-042'; // cost 4, 6000, [Blocker]
const MARCO = 'OP01-023'; // Red, 5000, a plain attacker of mine
const KING = 'OP02-006'; // Red, 7000

type Placed = string | { card: string; rested?: boolean };

function swing(p2chars: Placed[], target: 'leader' | string = 'leader', mineChars: Placed[] = []) {
  const g = mine(SL.luffy, { characters: [ID, ...mineChars] }, { characters: p2chars });
  const tgt = target === 'leader' ? g.leader('p2') : g.find('p2', 'characters', target);
  attack(g, g.find('p1', 'characters', ID), tgt);
  return g;
}

describe('OP01-120 Shanks: [Rush]', () => {
  it('has [Rush] and can attack the opposing Leader on the turn it is played', () => {
    const g = mine(SL.luffy, { hand: [ID], costArea: { active: 10, rested: 0 } });
    playCardRaw(g, ID);
    const shanks = g.find('p1', 'characters', ID);
    expect(kw(g, shanks)).toContain('Rush');
    expect(
      g
        .legal()
        .some((a) => a.type === 'attack' && a.attacker === shanks && a.target === g.leader('p2')),
    ).toBe(true);
  });
});

describe('OP01-120 Shanks: [When Attacking] the opponent cannot activate a [Blocker] with 2000 power or less during this battle', () => {
  it('a [Blocker] with exactly 2000 power cannot be activated', () => {
    const g = swing([KILLER]);
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([]);
  });

  it('a [Blocker] with 1000 power cannot be activated either', () => {
    const g = swing([ROSINANTE]);
    expect(blockers(g)).toEqual([]);
  });

  it('boundary: a [Blocker] with 3000 power can still block', () => {
    const g = swing([MCKINLEY]);
    expect(blockers(g)).toEqual([g.find('p2', 'characters', MCKINLEY)]);
  });

  it('a stronger [Blocker] (6000) can block', () => {
    const g = swing([KAIDO]);
    expect(blockers(g)).toEqual([g.find('p2', 'characters', KAIDO)]);
  });

  it('with a 2000, a 1000 and a 3000 [Blocker] only the 3000 one is offered', () => {
    const g = swing([KILLER, ROSINANTE, MCKINLEY]);
    expect(blockers(g)).toEqual([g.find('p2', 'characters', MCKINLEY)]);
  });

  it('the restriction also holds when Shanks attacks a rested Character', () => {
    const g = swing([{ card: KING, rested: true }, KILLER], KING);
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([]);
  });

  it('only for this battle: in the next battle (another attacker) the 2000 [Blocker] may block', () => {
    const g = mine(SL.luffy, { characters: [ID, MARCO] }, { characters: [KILLER] });
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
    passBlock(g);
    noDefence(g);
    attack(g, g.find('p1', 'characters', MARCO), g.leader('p2'));
    expect(blockers(g)).toEqual([g.find('p2', 'characters', KILLER)]);
  });

  it('the Leader may still be hit by the 10000 attack when no [Blocker] is allowed', () => {
    const g = swing([KILLER]);
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('the restriction is on activating [Blocker], not on the card: it keeps [Blocker] and its power', () => {
    const g = swing([KILLER]);
    expect(pw(g, 'p2', KILLER)).toBe(2000);
    expect(kw(g, g.find('p2', 'characters', KILLER))).toContain('Blocker');
  });
});
