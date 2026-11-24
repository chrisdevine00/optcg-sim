/**
 * ST30-007 Portgas.D.Ace (Character, Red, cost 4, 6000, no Counter, {Whitebeard Pirates}).
 *
 * Card text: "[On Play] You may rest 1 of your DON!! cards: This Character gains [Rush] during this
 * turn. [When Attacking] Give up to 1 of your opponent's Characters -1000 power during this turn."
 *
 * Rules: "rest 1 of your DON!! cards" is the cost (1) (RD 85), an unpayable cost leaves the effect
 * unused (CR 8-3-1-3), [Rush] lets a Character attack on the turn it is played (CR 10-1-1-1),
 * "during this turn" ends in the End Phase (CR 6-6-1-3), "up to 1" allows 0 (CR 8-4-4-1), the
 * attacker wins a tie (CR 7-1-4-1).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  BLUE,
  canAttack,
  canHit,
  choices,
  don,
  kind,
  kw,
  mayChooseNone,
  mine,
  need,
  no,
  none,
  noDefence,
  offeredIds,
  pickInst,
  playCardRaw,
  SL,
  toMyNextMain,
  unusable,
  yes,
  pw,
} from './kit-stb5a.ts';

const ID = 'ST30-007';
const KING = 'OP02-006'; // Red, cost 5, 7000
const MARCO = 'OP01-023'; // Red, cost 3, 5000

/** p1 plays Ace with `active` active DON!! (4 pay the cost). */
function played(active = 10, p2chars: (string | { card: string; rested?: boolean })[] = []) {
  const g = mine(
    SL.luffy,
    { hand: [ID], costArea: { active, rested: 0 } },
    { characters: p2chars, life: Array(4).fill(BLUE) },
  );
  playCardRaw(g, ID);
  return g;
}

/** Ace is on the field and ready to attack. */
function ready(p2chars: (string | { card: string; rested?: boolean })[] = []) {
  return mine(SL.luffy, { characters: [ID] }, { characters: p2chars });
}

describe('ST30-007 Portgas.D.Ace: [On Play] you may rest 1 DON!!: [Rush] this turn', () => {
  it('paying rests 1 DON!!, Ace gains [Rush] and may attack the opposing Leader this turn', () => {
    const g = played();
    yes(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(don(g).rested).toBe(5);
    expect(don(g).active).toBe(5);
    const ace = g.find('p1', 'characters', ID);
    expect(kw(g, ace)).toContain('Rush');
    expect(canAttack(g, ace, g.leader('p2'))).toBe(true);
  });

  it('declining: no DON!! rested beyond the cost, no [Rush], Ace cannot attack this turn', () => {
    const g = played();
    need(g, 'optional', 'p1');
    no(g, 'p1');
    const ace = g.find('p1', 'characters', ID);
    expect(don(g).rested).toBe(4);
    expect(kw(g, ace)).not.toContain('Rush');
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === ace)).toBe(false);
  });

  it('with no active DON!! left after the cost, the cost cannot be paid and there is no [Rush]', () => {
    const g = played(4);
    unusable(g, 'p1');
    const ace = g.find('p1', 'characters', ID);
    expect(kw(g, ace)).not.toContain('Rush');
    expect(don(g).rested).toBe(4);
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === ace)).toBe(false);
  });

  it('with exactly 1 active DON!! left after the cost, the cost can be paid (boundary)', () => {
    const g = played(5);
    yes(g, 'p1');
    const ace = g.find('p1', 'characters', ID);
    expect(kw(g, ace)).toContain('Rush');
    expect(don(g).active).toBe(0);
    expect(don(g).rested).toBe(5);
  });

  it('[Rush] lasts this turn only: on my next turn Ace has no [Rush]', () => {
    const g = played();
    yes(g, 'p1');
    const ace = g.find('p1', 'characters', ID);
    toMyNextMain(g);
    expect(kw(g, ace)).not.toContain('Rush');
  });

  it('[Rush] is not [Rush: Character]: the Leader is a legal target', () => {
    const g = played();
    yes(g, 'p1');
    const ace = g.find('p1', 'characters', ID);
    expect(canHit(g, ace, g.leader('p2'))).toBe(true);
  });
});

describe('ST30-007 Portgas.D.Ace: [When Attacking] up to 1 opposing Character gets -1000 this turn', () => {
  it("offers the opponent's Characters (not the Leader, not mine)", () => {
    const g = mine(
      SL.luffy,
      { characters: [ID, MARCO] },
      { characters: [{ card: KING, rested: true }] },
    );
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KING]);
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('gives the chosen Character -1000 power during this turn', () => {
    const g = ready([{ card: KING, rested: true }]);
    attack(g, g.find('p1', 'characters', ID), g.find('p2', 'characters', KING));
    pickInst(g, [g.find('p2', 'characters', KING)]);
    expect(pw(g, 'p2', KING)).toBe(6000);
  });

  it('the -1000 can decide the battle: 6000 vs a 7000 Character that dropped to 6000 (tie goes to the attacker)', () => {
    const g = ready([{ card: KING, rested: true }]);
    attack(g, g.find('p1', 'characters', ID), g.find('p2', 'characters', KING));
    pickInst(g, [g.find('p2', 'characters', KING)]);
    noDefence(g);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it('without the -1000 the same attack fails (6000 vs 7000)', () => {
    const g = ready([{ card: KING, rested: true }]);
    attack(g, g.find('p1', 'characters', ID), g.find('p2', 'characters', KING));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    noDefence(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(pw(g, 'p2', KING)).toBe(7000);
  });

  it('"up to 1": may choose nothing and nothing changes', () => {
    const g = ready([KING, MARCO]);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(pw(g, 'p2', KING)).toBe(7000);
    expect(pw(g, 'p2', MARCO)).toBe(5000);
  });

  it('only one Character is lowered even with two available', () => {
    const g = ready([KING, MARCO]);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    pickInst(g, [g.find('p2', 'characters', MARCO)]);
    expect(pw(g, 'p2', MARCO)).toBe(4000);
    expect(pw(g, 'p2', KING)).toBe(7000);
    expect(kind(g)).toBe('block');
  });

  it('with no opposing Character the attack goes on and nothing is lowered', () => {
    const g = ready([]);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(kind(g)).toBe('block');
  });

  it('the -1000 lasts until the end of the turn, not only the battle, and is gone on the next turn', () => {
    const g = ready([KING]);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    pickInst(g, [g.find('p2', 'characters', KING)]);
    noDefence(g);
    expect(pw(g, 'p2', KING)).toBe(6000);
    act(g, { type: 'endTurn' });
    expect(pw(g, 'p2', KING)).toBe(7000);
  });
});
