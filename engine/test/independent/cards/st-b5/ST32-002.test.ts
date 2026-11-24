/**
 * ST32-002 Kouzuki Oden (Green Character, cost 5, 6000, Counter +1000, Slash, {Land of Wano}/{Kouzuki Clan}).
 *
 * Card text: "[On Play] Draw 1 card and up to 1 of your opponent's Characters with a base cost of 6 or
 * less cannot be rested until the end of your opponent's next End Phase."
 *
 * Rules: rules-digest 57 (a card that "cannot be rested" cannot attack, cannot activate [Blocker],
 * cannot pay a rest cost and cannot be rested by an effect), RL-10/RL-11 (durations reaching into
 * the next turn), CR 8-4-4-1 ("up to").
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  attackers,
  blockers,
  BLUE,
  cardIds,
  choices,
  deck,
  endTurn,
  fill,
  hand,
  LDB,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  attack,
  SB,
  T,
  passBlock,
} from './kit-stb5b.ts';

const ODEN = T.oden;
const BLOCKER = 'OP09-072'; // Franky: Purple, cost 4, 5000, [Blocker]

function setup(opp: (string | { card: string; rested: boolean })[], hand_: string[] = []) {
  return mine(
    LDB.strike,
    { hand: [ODEN, ...hand_], deck: [SB.c3p5, ...fill(BLUE, 14)] },
    { characters: opp },
  );
}

/** Play Oden and lock `target`. */
function lock(g: ReturnType<typeof setup>, target: string) {
  playRaw(g, ODEN);
  pickCards(g, [target]);
}

describe('ST32-002 Oden: [On Play] draw 1; an opposing base-cost-6-or-less Character cannot be rested until the end of the opponent next End Phase', () => {
  it('draws 1 card and the chosen Character cannot attack on the opponent turn, while another can', () => {
    const g = setup([SB.c6p8, SB.c4p6]);
    lock(g, SB.c6p8);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SB.c3p5]);
    expect(deck(g)).toHaveLength(14);
    endTurn(g);
    need(g, 'main', 'p2');
    const free = attackers(g);
    expect(free).toContain(g.find('p2', 'characters', SB.c4p6));
    expect(free).not.toContain(g.find('p2', 'characters', SB.c6p8));
  });

  it('base cost boundary: base cost 6 is offered, base cost 7 is not', () => {
    const g = setup([SB.c6p8, SB.c7p9, SB.c5p7]);
    playRaw(g, ODEN);
    expect(offeredIds(g)).toEqual([SB.c5p7, SB.c6p8].sort());
  });

  it('it is the BASE cost: a Character of base cost 5 whose current cost is 8 is offered', () => {
    const g = setup([T.kuma]);
    expect(g.card(g.find('p2', 'characters', T.kuma)).cost).toBe(8);
    playRaw(g, ODEN);
    expect(offeredIds(g)).toEqual([T.kuma]);
  });

  it('it is the BASE cost: a Character of base cost 7 whose current cost is 8 is not offered', () => {
    const g = setup([T.koala]);
    expect(g.card(g.find('p2', 'characters', T.koala)).cost).toBe(8);
    playRaw(g, ODEN);
    expect(choices(g)).toEqual([]);
    // Nothing to choose: the draw has happened and play goes on.
    expect(hand(g)).toEqual([SB.c3p5]);
  });

  it('"up to 1": choosing nobody still draws 1 and locks nothing', () => {
    const g = setup([SB.c4p6]);
    playRaw(g, ODEN);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SB.c3p5]);
    endTurn(g);
    expect(attackers(g)).toContain(g.find('p2', 'characters', SB.c4p6));
  });

  it('only one Character is locked even when two are eligible', () => {
    const g = setup([SB.c4p6, SB.c5p7]);
    playRaw(g, ODEN);
    expect(need(g, 'choose').max).toBe(1);
    pickCards(g, [SB.c4p6]);
    endTurn(g);
    const free = attackers(g);
    expect(free).toContain(g.find('p2', 'characters', SB.c5p7));
    expect(free).not.toContain(g.find('p2', 'characters', SB.c4p6));
  });

  it('the draw does not depend on a target: with no opposing Character a card is drawn', () => {
    const g = setup([]);
    playRaw(g, ODEN);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SB.c3p5]);
  });

  it('duration: locked on the opponent turn, free again on the opponent following turn', () => {
    const g = setup([SB.c6p8]);
    lock(g, SB.c6p8);
    endTurn(g); // p2, turn 4
    expect(attackers(g)).not.toContain(g.find('p2', 'characters', SB.c6p8));
    endTurn(g); // p1, turn 5
    need(g, 'main', 'p1');
    endTurn(g); // p2, turn 6
    need(g, 'main', 'p2');
    expect(attackers(g)).toContain(g.find('p2', 'characters', SB.c6p8));
  });

  it('a locked [Blocker] cannot block (it cannot be rested), an unlocked one can', () => {
    const g = setup([BLOCKER]);
    lock(g, BLOCKER);
    attack(g, g.leader('p1'), g.leader('p2'));
    need(g, 'block', 'p2');
    expect(blockers(g)).toEqual([]);
    const control = setup([BLOCKER]);
    attack(control, control.leader('p1'), control.leader('p2'));
    need(control, 'block', 'p2');
    expect(blockers(control)).toEqual([control.find('p2', 'characters', BLOCKER)]);
    passBlock(control);
  });

  it('a locked Character cannot be rested by an opposing effect (Zoro, cost 2 or less), a free one can', () => {
    const g = mine(
      LDB.slash,
      { hand: [ODEN, T.zoro], deck: fill(BLUE, 15) },
      { characters: [SB.c2p0, SB.c2p4] },
    );
    lock(g, SB.c2p0);
    playRaw(g, T.zoro);
    // The engine may offer the locked Cobra as a target; if it is picked it must stay active.
    const locked = g.find('p2', 'characters', SB.c2p0);
    if (choices(g).includes(locked)) pickCards(g, [SB.c2p0]);
    else none(g);
    expect(g.card(locked).rested).toBe(false);
    expect(cardIds(g, 'p2', 'characters')).toContain(SB.c2p0);
  });

  it('control for the test above: without the lock the same Zoro rests the Cobra', () => {
    const g = mine(
      LDB.slash,
      { hand: [T.zoro], deck: fill(BLUE, 15) },
      { characters: [SB.c2p0, SB.c2p4] },
    );
    playRaw(g, T.zoro);
    pickCards(g, [SB.c2p0]);
    expect(g.card(g.find('p2', 'characters', SB.c2p0)).rested).toBe(true);
  });
});
