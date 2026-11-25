/**
 * OP10-095 Roronoa Zoro (Character, Black, cost 4, 6000, no Counter, {Straw Hat Crew}/
 * {Supernovas}/{Dressrosa}).
 *
 * Card text: "[On Play] You may rest 1 of your "Dressrosa" type Leader or Stage cards: K.O. up to 1
 * of your opponent's Characters with a cost of 4 or less. Then, trash 2 cards from the top of your
 * deck."
 *
 * Rules: CR 8-3-1-4 (optional cost), "up to" (CR 8-4-4-1), a rested card cannot be rested again,
 * "If"/"Then" (CR 4-10-2: a "then" clause that cannot be resolved does not stop the next one),
 * defeat at 0 cards in the deck (CR 9-2-1-2).
 */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  chr,
  deck,
  finishEmpty,
  LD10,
  mine,
  need,
  no,
  none,
  offeredIds,
  payRestDress,
  pickInst,
  playRaw,
  result,
  SC10,
  SC14,
  trash,
  unusable,
  yes,
  zoneIds,
} from './kit-op10c.ts';

const ID = 'OP10-095';
const STAGE = 'OP04-096';

function game(
  o: {
    leader?: string | { card: string; rested: boolean };
    stage?: boolean;
    p2?: string[];
    deckSize?: number;
  } = {},
) {
  return mine(
    o.leader ?? LD10.dress,
    {
      hand: [ID],
      costArea: { active: 4, rested: 0 },
      deck: [SC10.dr2, SC10.dr3, BLUE, BLUE, BLUE].slice(0, o.deckSize ?? 5),
      ...(o.stage ? { stage: STAGE } : {}),
    },
    { characters: o.p2 ?? [SC14.c2, SC14.c4, SC14.c5] },
  );
}

describe('OP10-095 Zoro [On Play] rest Dressrosa Leader/Stage: K.O. cost <= 4, then trash 2 from deck', () => {
  it('resting the Dressrosa Leader K.O.s a cost-4 Character, then trashes the top 2 cards of the deck', () => {
    const g = game();
    playRaw(g, ID);
    yes(g, 'p1');
    payRestDress(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    pickInst(g, [chr(g, 'p2', SC14.c4)]);
    need(g, 'main', 'p1');
    expect(trash(g, 'p2')).toEqual([SC14.c4]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([SC14.c2, SC14.c5].sort());
    expect(trash(g)).toEqual([SC10.dr2, SC10.dr3].sort());
    expect(deck(g)).toEqual([BLUE, BLUE, BLUE]);
  });

  it('boundary: costs 2 and 4 are offered, cost 5 is not', () => {
    const g = game();
    playRaw(g, ID);
    yes(g, 'p1');
    payRestDress(g);
    expect(offeredIds(g)).toEqual([SC14.c2, SC14.c4].sort());
    expect(offeredIds(g)).not.toContain(SC14.c5);
  });

  it('a Dressrosa Stage can pay instead of the Leader; the other card stays active', () => {
    const g = game({ leader: LD10.nova, stage: true });
    playRaw(g, ID);
    yes(g, 'p1');
    payRestDress(g, 'stage');
    expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    pickInst(g, [chr(g, 'p2', SC14.c2)]);
    expect(trash(g, 'p2')).toEqual([SC14.c2]);
  });

  it('with both a Dressrosa Leader and Stage, either may be rested (one only)', () => {
    const g = game({ stage: true });
    playRaw(g, ID);
    yes(g, 'p1');
    payRestDress(g, 'stage');
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
  });

  it('"up to 1": may K.O. nothing; the cost stays paid and the deck is still trashed (Then)', () => {
    const g = game();
    playRaw(g, ID);
    yes(g, 'p1');
    payRestDress(g);
    none(g);
    need(g, 'main', 'p1');
    expect(zoneIds(g, 'p2', 'characters')).toHaveLength(3);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(trash(g)).toHaveLength(2);
  });

  it('with no Character of cost 4 or less the deck is still trashed', () => {
    const g = game({ p2: [SC14.c5, SC14.c6] });
    playRaw(g, ID);
    yes(g, 'p1');
    payRestDress(g);
    finishEmpty(g);
    need(g, 'main', 'p1');
    expect(zoneIds(g, 'p2', 'characters')).toHaveLength(2);
    expect(trash(g)).toHaveLength(2);
  });

  it("declining the cost: nothing rests, nothing is K.O.'d, the deck is untouched", () => {
    const g = game();
    playRaw(g, ID);
    no(g, 'p1');
    need(g, 'main', 'p1');
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(zoneIds(g, 'p2', 'characters')).toHaveLength(3);
    expect(deck(g)).toHaveLength(5);
    expect(trash(g)).toEqual([]);
  });

  it('without a {Dressrosa} Leader or Stage the cost cannot be paid', () => {
    const g = game({ leader: LD10.nova });
    playRaw(g, ID);
    unusable(g, 'p1');
    need(g, 'main', 'p1');
    expect(zoneIds(g, 'p2', 'characters')).toHaveLength(3);
    expect(deck(g)).toHaveLength(5);
  });

  it('an already rested Dressrosa Leader cannot be rested again as the cost', () => {
    const g = game({ leader: { card: LD10.dress, rested: true } });
    playRaw(g, ID);
    unusable(g, 'p1');
    need(g, 'main', 'p1');
    expect(zoneIds(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('trashing the last cards of the deck loses the game (a 2-card deck is emptied)', () => {
    const g = game({ deckSize: 2 });
    playRaw(g, ID);
    yes(g, 'p1');
    payRestDress(g);
    none(g);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });
});
