/**
 * EB03-057 Yamato (Character, yellow, cost 5, 6000, Counter +1000, {Land of Wano}).
 *
 * Card text: "[On Play] Give up to 3 rested DON!! cards to your {Land of Wano} type Leader.
 * [On K.O.] Trash up to 1 card from the top of your opponent's Life cards."
 *
 * Rules: a DON!! card given to a card is neither active nor rested (CR 4-4-2) and adds +1000 power
 * on its owner's turn (RL-13). Only rested DON!! can be given and only to the Leader named by the
 * text. Paying the cost rests the 5 DON!! that paid it, so at least 5 rested DON!! are in the cost
 * area when [On Play] resolves from hand. Trashing Life by an effect is not damage: no [Trigger]
 * (RD 104, RL-22).
 */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import {
  act,
  at,
  attack,
  BLUE,
  chars,
  chr,
  decision,
  donSum,
  fill,
  hand,
  kind,
  mine,
  need,
  no,
  opponentKingdomCome,
  passBlock,
  pickCount,
  countOptions,
  playRaw,
  theirs,
  trash,
  W,
  LW,
  yes,
} from './kit-w4b.ts';

const YAMATO = 'EB03-057';
const RINDO = 'OP14-115';

/** p1's Main Phase with Yamato in hand; the Leader `leader`; `active` and `rested` DON!! before the play. */
function board(leader: string, active = 10, rested = 0, others: string[] = []) {
  return mine(leader, { hand: [YAMATO], characters: others, costArea: { active, rested } }, {});
}

describe('EB03-057 Yamato: [On Play] give up to 3 rested DON!! to your {Land of Wano} Leader', () => {
  it('asks how many (up to 3, most first); giving 3 puts 3 DON!! on the Leader: power 5000 + 3000', () => {
    const g = board(LW.oden);
    playRaw(g, YAMATO);
    expect(countOptions(g)).toEqual(['3', '2', '1', '0']);
    pickCount(g, 3);
    need(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(donSum(g)).toMatchObject({ given: 3 });
  });

  it('the DON!! come from the rested ones: the cost area keeps its other cards (5 rested paid, 3 given, 2 rested left, 5 active)', () => {
    const g = board(LW.oden);
    playRaw(g, YAMATO);
    pickCount(g, 3);
    expect(donSum(g)).toMatchObject({ active: 5, rested: 2, given: 3 });
  });

  it('only rested DON!! are given: DON!! that were already rested before the play count too', () => {
    const g = board(LW.oden, 5, 5);
    playRaw(g, YAMATO);
    pickCount(g, 3);
    // 5 + 5 = 10 rested after paying; 3 given leaves 7 rested and 0 active.
    expect(donSum(g)).toMatchObject({ active: 0, rested: 7, given: 3 });
  });

  it('"up to": giving 2 leaves one more rested DON!! in the cost area and the Leader at 7000', () => {
    const g = board(LW.oden);
    playRaw(g, YAMATO);
    pickCount(g, 2);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(donSum(g)).toMatchObject({ rested: 3, given: 2 });
  });

  it('"up to": giving 0 is allowed and gives nothing', () => {
    const g = board(LW.oden);
    playRaw(g, YAMATO);
    pickCount(g, 0);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(donSum(g)).toMatchObject({ given: 0, rested: 5 });
  });

  it('the DON!! go to the Leader only, not to Yamato or another {Land of Wano} Character', () => {
    const g = board(LW.oden, 10, 0, [W.komachiyo]);
    playRaw(g, YAMATO);
    pickCount(g, 3);
    expect(g.power(at(g, 'p1', 'characters', YAMATO))).toBe(6000);
    expect(g.power(at(g, 'p1', 'characters', W.komachiyo))).toBe(3000);
  });

  it('with a Leader that is not {Land of Wano} no DON!! are given', () => {
    const g = board(LW.croc);
    playRaw(g, YAMATO);
    if (decision(g)?.kind === 'choose') pickCount(g, 3);
    need(g, 'main', 'p1');
    expect(donSum(g)).toMatchObject({ given: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(chars(g)).toEqual([YAMATO]);
  });
});

describe("EB03-057 Yamato: [On K.O.] trash up to 1 card from the top of the opponent's Life", () => {
  /** p2's turn: p2's 9000 Oars attacks the rested Yamato; no block, no counter. */
  function koYamato(p2Life: string[] = fill(BLUE, 4)) {
    const g = theirs(
      LW.oden,
      { characters: [{ card: YAMATO, rested: true }] },
      { characters: [W.oars9], life: p2Life },
    );
    attack(g, at(g, 'p2', 'characters', W.oars9), chr(g, 'p1', YAMATO));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  }

  it('offers the "up to 1" trash; taking it trashes the opponent\'s top Life card', () => {
    const g = koYamato([W.marco, ...fill(BLUE, 3)]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    need(g, 'main', 'p2');
    expect(g.life('p2')).toBe(3);
    expect(trash(g, 'p2')).toEqual([W.marco]);
    expect(trash(g)).toEqual([YAMATO]);
  });

  it('choosing nothing ("up to 1") leaves the opponent\'s Life alone', () => {
    const g = koYamato();
    need(g, 'optional', 'p1');
    no(g, 'p1');
    need(g, 'main', 'p2');
    expect(g.life('p2')).toBe(4);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('is not damage: no [Trigger] decision for the opponent and nothing goes to their hand', () => {
    const g = koYamato([RINDO, ...fill(BLUE, 3)]);
    yes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(hand(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([RINDO]);
    expect(chars(g, 'p2')).toEqual([W.oars9]);
  });

  it('trashes at most 1 card', () => {
    const g = koYamato();
    yes(g, 'p1');
    expect(g.life('p2')).toBe(3);
  });

  it('with the opponent at 0 Life nothing happens and nobody loses (Life moved by an effect is not damage)', () => {
    const g = koYamato([]);
    if (kind(g) === 'optional') yes(g, 'p1');
    expect(g.life('p2')).toBe(0);
    expect(queries.result(g.state)).toBeNull();
  });

  it("also fires when Yamato is K.O.'d by an effect", () => {
    const g = theirs(LW.oden, { characters: [YAMATO] }, { hand: [W.kingdomCome], characters: [] });
    opponentKingdomCome(g, g.find('p1', 'characters', YAMATO));
    // Kingdom Come trashed the opponent's Life down to 1 first.
    expect(g.life('p2')).toBe(1);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(g.life('p2')).toBe(0);
    expect(queries.result(g.state)).toBeNull();
  });
});
