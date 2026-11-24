/**
 * EB05-017 Mermaid Cafe Dancers (Character, Green, cost 1, 0, Counter +2000, {Merfolk}/{Fish-Man Island}, Wisdom).
 *
 * Card text: "[On Your Opponent's Attack] You may rest 1 of your DON!! cards and trash this Character:
 * Your {Fish-Man} or {Merfolk} type Leader gains +4000 power during this battle."
 *
 * Rules: CR 10-2-16 / RD 89, CR 8-3-1-3/-4 (costs: all or nothing), RL-08, RD 90 (the battle ends
 * when the target leaves its area), CR 10-2-1-3 (trash is not a K.O.).
 */
import { describe, expect, it } from 'vitest';
import { attack, fill, passBlock } from '../../helpers.ts';
import {
  accept,
  chars,
  choices,
  choose,
  decline,
  don,
  EL,
  kind,
  offered,
  payDon,
  RED,
  skipUnusable,
  theirs,
  trash,
  VAN,
} from './kit-eb05a.ts';

const DANCERS = 'EB05-017';

function defending(leader: string, active = 3, dancersRested = false) {
  return theirs(
    leader,
    {
      characters: [{ card: DANCERS, rested: dancersRested }],
      life: fill(RED, 4),
      costArea: { active, rested: 0 },
    },
    { characters: [VAN.kingdew] },
  );
}
function use(g: ReturnType<typeof defending>) {
  accept(g);
  payDon(g, 1);
  if (kind(g) === 'choose' && choices(g).includes(g.leader('p1'))) choose(g, [g.leader('p1')]);
}

describe('EB05-017 Mermaid Cafe Dancers: [On Your Opponent’s Attack] rest 1 DON!! and trash this: Fish-Man or Merfolk Leader +4000', () => {
  it('pays 1 rested DON!! and trashes Dancers; a {Fish-Man} Leader gets +4000 (5000 -> 9000)', () => {
    const g = defending(EL.fishMan);
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(true);
    use(g);
    expect(trash(g)).toEqual([DANCERS]);
    expect(chars(g)).toEqual([]);
    expect(don(g)).toMatchObject({ active: 2, rested: 1 });
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('a {Merfolk} Leader also qualifies', () => {
    const g = defending(EL.shirahoshi);
    attack(g, g.leader('p2'), g.leader('p1'));
    use(g);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('the boost makes the attack fail and ends with the battle', () => {
    const g = defending(EL.fishMan);
    attack(g, g.leader('p2'), g.leader('p1'));
    use(g);
    passBlock(g);
    g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  // DISAGREEMENTS-a.md EB05-017 (same shape as EB05-013): the Leader is not an "up to" target.
  it('the Leader boost has no "up to": after paying, the player cannot choose to skip it', () => {
    const g = defending(EL.fishMan);
    attack(g, g.leader('p2'), g.leader('p1'));
    accept(g);
    payDon(g, 1);
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('CR 8-3-1-4: declining pays nothing: Dancers stays and the Leader is not boosted', () => {
    const g = defending(EL.fishMan);
    attack(g, g.leader('p2'), g.leader('p1'));
    decline(g);
    expect(chars(g)).toEqual([DANCERS]);
    expect(don(g)).toMatchObject({ active: 3, rested: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 8-3-1-3: with no active DON!! neither half of the cost can be paid: Dancers is not trashed', () => {
    const g = defending(EL.fishMan, 0);
    attack(g, g.leader('p2'), g.leader('p1'));
    skipUnusable(g, 'p1');
    expect(chars(g)).toEqual([DANCERS]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Leader of neither type gets no boost', () => {
    const g = defending(EL.croc);
    attack(g, g.leader('p2'), g.leader('p1'));
    if (offered(g, 'p1')) use(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('when Dancers is the attacked Character, trashing her ends the battle: no K.O. and the Leader keeps its Life', () => {
    const g = defending(EL.fishMan, 3, true);
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.find('p1', 'characters', DANCERS));
    expect(offered(g, 'p1')).toBe(true);
    use(g);
    expect(trash(g)).toEqual([DANCERS]);
    expect(g.life('p1')).toBe(4);
    expect(kind(g)).toBe('main');
  });

  it('activates against an attack on the Leader or on a Character alike (Leader gets +4000 in both)', () => {
    const g = theirs(
      EL.fishMan,
      {
        characters: [DANCERS, { card: VAN.marco, rested: true }],
        life: fill(RED, 4),
        costArea: { active: 3, rested: 0 },
      },
      { characters: [VAN.kingdew] },
    );
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.find('p1', 'characters', VAN.marco));
    expect(offered(g, 'p1')).toBe(true);
    use(g);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });
});
