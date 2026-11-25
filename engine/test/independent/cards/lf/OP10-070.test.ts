/**
 * OP10-070 Trebol (Character, Purple, cost 4, 5000, Counter +1000, Special, {Donquixote Pirates}).
 *
 * Card text: "[Blocker] [On Play] All of your Characters with 1000 base power or less cannot be K.O.'d
 * by your opponent's effects until the end of your opponent's next turn."
 *
 * Rules: base power is the printed power (CR 4-9-2): given DON!! and boosts do not change it; the
 * protection stops opposing K.O. effects only, not a battle loss (RL-14); "until the end of your
 * opponent's next turn" covers their whole next turn and no later one (RL-11); the [On Play] is
 * mandatory and asks nothing; [Blocker] can be used as printed.
 * Scenery: EB01-056 Flampe (1000), OP04-012 Cobra (0), OP14-005 Killer (1000), OP17-113 Streusen
 * (2000), OP01-023 Marco (5000); EB01-059 Kingdom Come is the opposing K.O. effect.
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  attack,
  blockers,
  chars,
  endTurn,
  kind,
  koWithKingdomCome,
  KINGDOM_COME,
  LD_LF,
  mine,
  need,
  noDefence,
  opponentKingdomCome,
  playRaw,
  trash,
  VAN_LF,
} from './kit-lfa.ts';

const TREBOL = 'OP10-070';
const { flampe1000, cobra0, killer1000, streusen2000, marco, thatch, mohji } = VAN_LF;
type Ch = string | { card: string; rested?: boolean; don?: number };

/** p1 plays Trebol with `others` on the field; p2 holds Kingdom Come and a Thatch. */
function play(others: Ch[], p2chars: Ch[] = [thatch], costArea = { active: 10, rested: 0 }) {
  const g = mine(
    LD_LF.croc,
    { hand: [TREBOL], characters: others, costArea },
    {
      hand: [KINGDOM_COME],
      characters: p2chars,
      life: [mohji, mohji, mohji, mohji],
      costArea: { active: 10, rested: 0 },
    },
  );
  playRaw(g, TREBOL);
  return g;
}

function theyKo(g: TestGame, target: string) {
  endTurn(g);
  need(g, 'main', 'p2');
  opponentKingdomCome(g, at(g, 'p1', 'characters', target));
}

describe('OP10-070 Trebol', () => {
  it('printed values: cost 4, 5000, Counter +1000, [Blocker]; the [On Play] asks nothing', () => {
    const g = play([flampe1000]);
    expect(kind(g)).toBe('main');
    const t = at(g, 'p1', 'characters', TREBOL);
    expect(g.card(t).cost).toBe(4);
    expect(g.power(t)).toBe(5000);
    expect(g.card(t).counter).toBe(1000);
    expect(g.card(t).keywords).toContain('Blocker');
  });

  it('[Blocker]: he can block an attack on my Leader', () => {
    const g = play([]);
    endTurn(g);
    attack(g, at(g, 'p2', 'characters', thatch), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', TREBOL)]);
  });

  it("a 1000-power Character cannot be K.O.'d by the opponent's effects", () => {
    const g = play([flampe1000]);
    theyKo(g, flampe1000);
    expect(chars(g)).toContain(flampe1000);
    expect(trash(g)).not.toContain(flampe1000);
  });

  it('a 0-power Character is covered ("1000 base power or less")', () => {
    const g = play([cobra0]);
    theyKo(g, cobra0);
    expect(chars(g)).toContain(cobra0);
  });

  it('boundary: a 2000-power Character is not covered', () => {
    const g = play([streusen2000]);
    theyKo(g, streusen2000);
    expect(chars(g)).not.toContain(streusen2000);
    expect(trash(g)).toContain(streusen2000);
  });

  it('Trebol himself (5000) is not covered', () => {
    const g = play([flampe1000]);
    theyKo(g, TREBOL);
    expect(chars(g)).not.toContain(TREBOL);
    expect(trash(g)).toContain(TREBOL);
  });

  it('base power is meant: a 1000-power Character holding given DON!! is still covered', () => {
    const g = play([{ card: killer1000, don: 2 }], [thatch], { active: 8, rested: 0 });
    theyKo(g, killer1000);
    expect(chars(g)).toContain(killer1000);
  });

  it('only K.O. by effects is stopped: a covered rested Character still loses a battle', () => {
    const g = play([{ card: flampe1000, rested: true }]);
    endTurn(g);
    attack(g, at(g, 'p2', 'characters', thatch), at(g, 'p1', 'characters', flampe1000));
    noDefence(g);
    expect(chars(g)).not.toContain(flampe1000);
    expect(trash(g)).toContain(flampe1000);
  });

  it("the protection ends with the end of the opponent's next turn: on the turn after that the K.O. works", () => {
    const g = play([flampe1000]);
    endTurn(g); // p2 turn 4
    need(g, 'main', 'p2');
    endTurn(g); // p1 turn 5
    need(g, 'main', 'p1');
    endTurn(g); // p2 turn 6
    need(g, 'main', 'p2');
    opponentKingdomCome(g, at(g, 'p1', 'characters', flampe1000));
    expect(chars(g)).not.toContain(flampe1000);
    expect(trash(g)).toContain(flampe1000);
  });

  it("must not cover the opponent's Characters: my K.O. effect K.O.s their 1000-power Character", () => {
    const g = mine(
      LD_LF.croc,
      { hand: [TREBOL, KINGDOM_COME], costArea: { active: 10, rested: 0 } },
      { characters: [flampe1000], life: [mohji, mohji, mohji, mohji] },
    );
    playRaw(g, TREBOL);
    koWithKingdomCome(g, at(g, 'p2', 'characters', flampe1000));
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it("a 5000 Character of mine (not 1000 or less) is K.O.'d as usual", () => {
    const g = play([marco]);
    theyKo(g, marco);
    expect(trash(g)).toContain(marco);
  });
});
