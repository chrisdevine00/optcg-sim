/**
 * OP15-029 Bartholomew Kuma (Character, Green, cost 4, 5000, Counter +1000, {Revolutionary Army}/
 * {The Seven Warlords of the Sea}).
 *
 * Card text: "[On Play] Up to 1 of your opponent's Characters with a cost of 5 or less cannot be
 * rested until the end of your opponent's next End Phase."
 *
 * Rules: "cannot be rested" (rules-digest 57): it cannot attack (attacking rests), cannot use
 * [Blocker], cannot be rested by effects. Duration CR 8-4-2: through the opponent's next turn.
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, endTurn, noDefence } from './kit-op15a.ts';
import {
  at,
  attackers,
  chr,
  LD15,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  S15,
  SCN,
} from './kit-op15a.ts';

const KUMA = 'OP15-029';

/** p1 plays Kuma with Marco on the field; p2 has Franky ([Blocker], cost 4) and the given Characters. */
function start(p2chars: string[] = []) {
  const g = mine(
    LD15.luffy,
    { hand: [KUMA], characters: [SCN.c3] },
    { characters: [S15.franky, ...p2chars] },
  );
  playRaw(g, KUMA);
  need(g, 'choose', 'p1');
  return g;
}

describe('OP15-029 Kuma: [On Play] an opposing Character with cost 5 or less cannot be rested', () => {
  it('offers the opposing Characters with cost 5 or less: cost 5 yes, cost 6 no', () => {
    const g = start([SCN.c5, SCN.c6]);
    expect(offeredIds(g)).toEqual([S15.franky, SCN.c5].sort());
  });

  it('a [Blocker] with the restriction cannot block my attack', () => {
    const g = start();
    pickInst(g, [chr(g, 'p2', S15.franky)]);
    attack(g, at(g, 'p1', 'characters', SCN.c3), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('without the restriction the same [Blocker] could block (control)', () => {
    const g = start();
    none(g);
    attack(g, at(g, 'p1', 'characters', SCN.c3), g.leader('p2'));
    expect(blockers(g)).toEqual([chr(g, 'p2', S15.franky)]);
  });

  it("it lasts through the opponent's next turn: the Character cannot attack, others can", () => {
    const g = start([SCN.c3]);
    pickInst(g, [chr(g, 'p2', S15.franky)]);
    endTurn(g);
    need(g, 'main', 'p2');
    const list = attackers(g);
    expect(list).not.toContain(chr(g, 'p2', S15.franky));
    expect(list).toContain(chr(g, 'p2', SCN.c3));
  });

  it('it is gone at the end of that turn: in my next turn the Character can block again', () => {
    const g = start();
    pickInst(g, [chr(g, 'p2', S15.franky)]);
    endTurn(g);
    endTurn(g);
    need(g, 'main', 'p1');
    attack(g, at(g, 'p1', 'characters', SCN.c3), g.leader('p2'));
    expect(blockers(g)).toEqual([chr(g, 'p2', S15.franky)]);
  });

  it('only the chosen Character is restricted: another [Blocker]-less Character still can attack next turn', () => {
    const g = start([SCN.c5]);
    pickInst(g, [chr(g, 'p2', SCN.c5)]);
    endTurn(g);
    expect(attackers(g)).toContain(chr(g, 'p2', S15.franky));
    expect(attackers(g)).not.toContain(chr(g, 'p2', SCN.c5));
  });

  it('"up to 1": choosing nothing restricts nothing', () => {
    const g = start();
    none(g);
    endTurn(g);
    expect(attackers(g)).toContain(chr(g, 'p2', S15.franky));
  });

  it('with no opposing Character of cost 5 or less there is nothing to choose and Kuma is played', () => {
    const g = mine(LD15.luffy, { hand: [KUMA] }, { characters: [SCN.c6] });
    playRaw(g, KUMA);
    if (g.legal().some((a) => a.type === 'done')) {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    need(g, 'main', 'p1');
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });
});
