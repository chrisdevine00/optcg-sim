/**
 * OP16-044 Emporio.Ivankov (Character, Blue, cost 2, 2000, Counter +1000, {Revolutionary Army}/{Impel Down}).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.)" No other text.
 *
 * Rules: CR 10-1-4 / RD 91 ([Blocker]: one blocker per battle, a rested Character cannot block, the
 * blocker must be one of the defender's other cards), CR 7-1-4 (Damage Step: attacker wins on >=).
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, passBlock, passCounter, takeDamage } from '../../helpers.ts';
import {
  backAtMain,
  BAT,
  block,
  inst,
  kind,
  LDR,
  mine,
  need,
  put,
  SCN,
  theirs,
  don,
} from './kit-op16b.ts';

const IVAN = 'OP16-044';
/** OP09-072 Franky: cost 4, 5000, [Blocker]: a second blocker (its [On Play] only matters when played). */
const SECOND_BLOCKER = 'OP09-072';

describe('OP16-044 Emporio.Ivankov: [Blocker]', () => {
  it('has the [Blocker] keyword', () => {
    const g = theirs(LDR.luffy, { characters: [IVAN] }, {});
    expect(g.card(inst(g, 'p1', 'characters', IVAN)).keywords).toContain('Blocker');
  });

  it('is a legal block against an attack on the Leader; blocking rests it and the Leader takes no damage', () => {
    const g = theirs(LDR.luffy, { characters: [IVAN] }, { characters: [SCN.c3] });
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([inst(g, 'p1', 'characters', IVAN)]);
    block(g, inst(g, 'p1', 'characters', IVAN));
    expect(g.card(inst(g, 'p1', 'characters', IVAN)).rested).toBe(true);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('a 5000 attacker K.O.s the blocker (2000), and still the Leader takes nothing', () => {
    const g = theirs(LDR.luffy, { characters: [IVAN] }, { characters: [SCN.c3] });
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    block(g, inst(g, 'p1', 'characters', IVAN));
    passCounter(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([IVAN]);
    expect(g.life('p1')).toBe(4);
  });

  it('boundary: an attacker with exactly 2000 power K.O.s it (the attacker wins ties); one with 0 power does not', () => {
    const tie = theirs(LDR.luffy, { characters: [IVAN] }, { characters: [BAT.dadan2000] });
    attack(tie, inst(tie, 'p2', 'characters', BAT.dadan2000), tie.leader('p1'));
    block(tie, inst(tie, 'p1', 'characters', IVAN));
    passCounter(tie);
    expect(tie.zone('p1', 'characters')).toHaveLength(0);

    const weak = theirs(LDR.luffy, { characters: [IVAN] }, { characters: [BAT.cobra0] });
    attack(weak, inst(weak, 'p2', 'characters', BAT.cobra0), weak.leader('p1'));
    block(weak, inst(weak, 'p1', 'characters', IVAN));
    passCounter(weak);
    expect(weak.zone('p1', 'characters').map((c) => c.card)).toEqual([IVAN]);
  });

  it('declining to block: the attack connects and Ivankov stays active', () => {
    const g = theirs(LDR.luffy, { characters: [IVAN] }, { characters: [SCN.c3] });
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    passBlock(g);
    passCounter(g);
    takeDamage(g);
    expect(g.life('p1')).toBe(3);
    expect(g.card(inst(g, 'p1', 'characters', IVAN)).rested).toBe(false);
  });

  it('a rested Ivankov cannot block', () => {
    const g = theirs(
      LDR.luffy,
      { characters: [{ card: IVAN, rested: true }] },
      { characters: [SCN.c3] },
    );
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('can block an attack on one of my rested Characters (the blocker is another card)', () => {
    const g = theirs(
      LDR.luffy,
      { characters: [IVAN, { card: SCN.c4, rested: true }] },
      { characters: [SCN.c3] },
    );
    attack(g, inst(g, 'p2', 'characters', SCN.c3), inst(g, 'p1', 'characters', SCN.c4));
    expect(blockers(g)).toEqual([inst(g, 'p1', 'characters', IVAN)]);
  });

  it('when Ivankov itself is the target (rested) it is not offered as a blocker for itself', () => {
    const g = theirs(
      LDR.luffy,
      { characters: [{ card: IVAN, rested: true }] },
      { characters: [SCN.c3] },
    );
    attack(g, inst(g, 'p2', 'characters', SCN.c3), inst(g, 'p1', 'characters', IVAN));
    expect(blockers(g)).toEqual([]);
  });

  it('only one [Blocker] per battle: after Ivankov blocks, a second Blocker is not offered', () => {
    const g = theirs(LDR.luffy, { characters: [IVAN, SECOND_BLOCKER] }, { characters: [SCN.c3] });
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g).sort()).toEqual(
      [inst(g, 'p1', 'characters', IVAN), inst(g, 'p1', 'characters', SECOND_BLOCKER)].sort(),
    );
    block(g, inst(g, 'p1', 'characters', IVAN));
    expect(kind(g)).toBe('counter');
    expect(blockers(g)).toEqual([]);
  });

  it('it is vanilla otherwise: playing it for 2 DON!! asks nothing', () => {
    const g = mine(LDR.luffy, { hand: [IVAN] });
    put(g, IVAN);
    need(g, 'main', 'p1');
    expect(backAtMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
  });
});
