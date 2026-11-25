/** OP11-073 Charlotte Linlin. */
import { describe, expect, it } from 'vitest';
import { accept, dec, decline, don, expectDecision, payDon, V } from './helpers.ts';
import {
  atMain,
  BM_LEADER,
  canHit,
  finishBattle,
  NOT_BM_LEADER,
  nameCost,
  revealGame,
} from './helpers-w5c2.ts';

const ID = 'OP11-073';

/** p2 (turn 4) attacks p1's Leader with its 6000 Character (V.c4); p2's deck top is `top`. */
const attacked = (top: string = V.c3, active = 5, p2chars: string[] = [V.c4]) => {
  const g = revealGame(
    { leader: BM_LEADER, characters: [ID], costArea: { active, rested: 0 } },
    { characters: p2chars },
    top,
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', p2chars[0]!),
    target: g.leader('p1'),
  });
  return g;
};

describe('OP11-073 Charlotte Linlin', () => {
  it('has [Rush] only while your Leader has the {Big Mom Pirates} type', () => {
    const yes = revealGame({ leader: BM_LEADER, characters: [{ card: ID, playedThisTurn: true }] });
    expect(canHit(yes, yes.find('p1', 'characters', ID), yes.leader('p2'))).toBe(true);
    const no = revealGame({
      leader: NOT_BM_LEADER,
      characters: [{ card: ID, playedThisTurn: true }],
    });
    expect(canHit(no, no.find('p1', 'characters', ID), no.leader('p2'))).toBe(false);
  });

  it("[On Your Opponent's Attack]: DON!! -5, name the revealed cost: your Leader gains +2000 power this turn", () => {
    const g = attacked(V.c3);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    payDon(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 0 });
    nameCost(g, 3);
    g.act({ type: 'pick', choice: g.leader('p1') });
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.zone('p2', 'deck')[0]!.card).toBe(V.c3);
    finishBattle(g);
    expect(g.life('p1')).toBe(3); // 7000 stops the 6000 attacker
    // "during this turn": still there after the battle, and gone with the turn.
    expect(g.power(g.leader('p1'))).toBe(7000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a miss: the DON!! are still returned, no boost, no further question', () => {
    const g = attacked(V.c3);
    accept(g);
    payDon(g);
    nameCost(g, 4);
    expect(dec(g)?.kind).toBe('block');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 0 });
    finishBattle(g);
    expect(g.life('p1')).toBe(2);
  });

  it('may be declined (nothing is paid or revealed), and "up to 1" may take no boost', () => {
    const g = attacked(V.c3);
    decline(g);
    expect(don(g, 'p1').active).toBe(5);
    expect(g.eventsOfType('CardRevealed').filter((e) => e.reason === 'effect')).toEqual([]);
    expectDecision(g, 'block', 'p1');

    const h = attacked(V.c3);
    accept(h);
    payDon(h);
    nameCost(h, 3);
    h.act({ type: 'done' });
    expect(h.power(h.leader('p1'))).toBe(5000);
  });

  it('needs 5 DON!!: with 4 it cannot be accepted; [Once Per Turn] covers a second attack', () => {
    const poor = attacked(V.c3, 4);
    // The cost cannot be paid, so the ability is not offered: straight to the block decision.
    expectDecision(poor, 'block', 'p1');
    expect(poor.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    expect(don(poor, 'p1').active).toBe(4);

    const g = attacked(V.c3, 10, [V.c4, V.c3]);
    accept(g);
    payDon(g);
    nameCost(g, 9);
    finishBattle(g);
    expect(g.life('p1')).toBe(2);
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expect(atMain(g)).toBe(false);
    expectDecision(g, 'block', 'p1');
  });
});
