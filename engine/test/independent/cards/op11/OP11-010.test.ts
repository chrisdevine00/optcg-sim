/**
 * OP11-010 Hibari (Character, Red, cost 5, 6000, no Counter, {Navy}/{SWORD}).
 *
 * Card text: "[On Play] Give up to 1 of your opponent's Characters −2000 power during this turn.
 * [When Attacking] This Character gains +1000 power during this turn. Then, up to 1 of your "Navy"
 * type Leader can also attack active Characters during this turn."
 *
 * Rules: only rested Characters can normally be attacked (CR 7-1-1-2); "can also attack active
 * Characters" widens the Leader's targets for this turn (RL-17), and the Leader stays able to attack
 * its usual targets. Only a "Navy" type Leader qualifies. Power changes last this turn.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  canHit,
  chr,
  choices,
  kind,
  L11,
  mine,
  N11,
  need,
  none,
  noDefence,
  offeredIds,
  pickInst,
  playRaw,
  toMyNextMain,
  canFinish,
} from './kit-op11a.ts';
import { act } from '../../helpers.ts';

const HIBARI = 'OP11-010';

function board(leader: string) {
  return mine(
    leader,
    { characters: [HIBARI, N11.navy4] },
    { characters: [N11.marco, { card: N11.sai, rested: true }] },
  );
}

/** Hibari attacks the opposing Leader; any "up to 1 Leader" question is answered with my Leader. */
function hibariAttacks(g: ReturnType<typeof board>) {
  act(g, {
    type: 'attack',
    attacker: at(g, 'p1', 'characters', HIBARI),
    target: g.leader('p2'),
  });
  for (let i = 0; i < 3 && kind(g) === 'choose'; i++) {
    if (choices(g).includes(g.leader('p1'))) act(g, { type: 'pick', choice: g.leader('p1') });
    else if (canFinish(g)) act(g, { type: 'done' });
    else break;
  }
}

describe('OP11-010 Hibari: [On Play] -2000 power', () => {
  it('printed values: cost 5, 6000, no Counter', () => {
    const g = mine(L11.koby, { hand: [HIBARI] });
    const h = at(g, 'p1', 'hand', HIBARI);
    expect(g.card(h).cost).toBe(5);
    expect(g.power(h)).toBe(6000);
    expect(g.card(h).counter).toBeNull();
  });

  it('gives the chosen opposing Character -2000 power during this turn', () => {
    const g = mine(L11.koby, { hand: [HIBARI] }, { characters: [N11.marco, N11.sai] });
    playRaw(g, HIBARI);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.marco, N11.sai].sort());
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    expect(g.power(chr(g, 'p2', N11.marco))).toBe(3000);
    expect(g.power(chr(g, 'p2', N11.sai))).toBe(4000);
  });

  it('"up to 1": may choose no one', () => {
    const g = mine(L11.koby, { hand: [HIBARI] }, { characters: [N11.marco] });
    playRaw(g, HIBARI);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(chr(g, 'p2', N11.marco))).toBe(5000);
  });
});

describe('OP11-010 Hibari: [When Attacking] +1000 power; the Navy Leader can attack active Characters', () => {
  it('Hibari gains +1000 power during this turn', () => {
    const g = board(L11.koby);
    hibariAttacks(g);
    expect(g.power(chr(g, 'p1', HIBARI))).toBe(7000);
    noDefence(g);
    expect(g.power(chr(g, 'p1', HIBARI))).toBe(7000);
  });

  it('afterwards a Navy Leader can attack an ACTIVE opposing Character', () => {
    const g = board(L11.koby);
    expect(canHit(g, g.leader('p1'), chr(g, 'p2', N11.marco))).toBe(false);
    hibariAttacks(g);
    noDefence(g);
    need(g, 'main', 'p1');
    expect(canHit(g, g.leader('p1'), chr(g, 'p2', N11.marco))).toBe(true);
  });

  it('the Leader can still attack the opposing Leader and rested Characters', () => {
    const g = board(L11.koby);
    hibariAttacks(g);
    noDefence(g);
    expect(canHit(g, g.leader('p1'), g.leader('p2'))).toBe(true);
    expect(canHit(g, g.leader('p1'), chr(g, 'p2', N11.sai))).toBe(true);
  });

  it('a Leader without the Navy type gets nothing', () => {
    const g = board(L11.luffy);
    hibariAttacks(g);
    noDefence(g);
    need(g, 'main', 'p1');
    expect(canHit(g, g.leader('p1'), chr(g, 'p2', N11.marco))).toBe(false);
  });

  it('only the Leader: my other Navy Character does not gain it', () => {
    const g = board(L11.koby);
    hibariAttacks(g);
    noDefence(g);
    expect(canHit(g, chr(g, 'p1', N11.navy4), chr(g, 'p2', N11.marco))).toBe(false);
  });

  it('the permission and the +1000 end with the turn', () => {
    const g = board(L11.koby);
    hibariAttacks(g);
    noDefence(g);
    toMyNextMain(g);
    need(g, 'main', 'p1');
    expect(canHit(g, g.leader('p1'), chr(g, 'p2', N11.marco))).toBe(false);
    expect(g.power(chr(g, 'p1', HIBARI))).toBe(6000);
  });
});
