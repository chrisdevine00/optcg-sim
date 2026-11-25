/**
 * OP10-091 Brook (Character, Black, cost 3, 0 power, Counter +1000, {Straw Hat Crew}/{Dressrosa}).
 *
 * Card text: "[Activate: Main] You may rest this Character and 1 of your "Dressrosa" type Leader or
 * Stage cards: K.O. up to 1 of your opponent's Characters with a cost of 1 or less. Then, trash 2
 * cards from the top of your deck."
 *
 * Rules: "cost of 1 or less" reads the current cost (CR 4-9-2); "up to 1" allows 0; CR 4-10-2 (a
 * "then" clause that cannot be resolved does not stop the next); defeat at an empty deck.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  chr,
  deck,
  finishEmpty,
  LD10,
  mine,
  need,
  none,
  offeredAbility,
  offeredIds,
  payRestDress,
  pickInst,
  rawActivate,
  result,
  SC10,
  SC14,
  trash,
  zoneIds,
} from './kit-op10c.ts';

const ID = 'OP10-091';
const STAGE = 'OP04-096';

function game(
  o: {
    leader?: string | { card: string; rested: boolean };
    stage?: boolean;
    self?: string | { card: string; rested: boolean };
    p2?: string[];
    deckSize?: number;
  } = {},
) {
  return mine(
    o.leader ?? LD10.dress,
    {
      characters: [o.self ?? ID],
      deck: [SC10.dr2, SC10.dr3, BLUE, BLUE, BLUE].slice(0, o.deckSize ?? 5),
      ...(o.stage ? { stage: STAGE } : {}),
    },
    { characters: o.p2 ?? [SC14.c1, SC14.c2, SC14.c3] },
  );
}

function use(g: ReturnType<typeof game>, which: 'leader' | 'stage' = 'leader') {
  rawActivate(g, at(g, 'p1', 'characters', ID));
  payRestDress(g, which);
}

describe('OP10-091 Brook [Activate: Main] rest self + Dressrosa: K.O. cost <= 1, then trash 2 from the deck', () => {
  it('K.O.s the cost-1 Character, then trashes the top 2 cards of my deck', () => {
    const g = game();
    use(g);
    pickInst(g, [chr(g, 'p2', SC14.c1)]);
    need(g, 'main', 'p1');
    expect(trash(g, 'p2')).toEqual([SC14.c1]);
    expect(trash(g)).toEqual([SC10.dr2, SC10.dr3].sort());
    expect(deck(g)).toEqual([BLUE, BLUE, BLUE]);
  });

  it('boundary: only the cost-1 Character is offered (cost 2 and 3 are not)', () => {
    const g = game();
    use(g);
    expect(offeredIds(g)).toEqual([SC14.c1]);
  });

  it('rests Brook and the Leader as the cost', () => {
    const g = game();
    use(g);
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('a Dressrosa Stage can pay instead of the Leader', () => {
    const g = game({ leader: LD10.plain, stage: true });
    use(g, 'stage');
    pickInst(g, [chr(g, 'p2', SC14.c1)]);
    expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(trash(g, 'p2')).toEqual([SC14.c1]);
  });

  it('"up to 1": may K.O. nothing; the deck is still trashed (Then)', () => {
    const g = game();
    use(g);
    none(g);
    need(g, 'main', 'p1');
    expect(zoneIds(g, 'p2', 'characters')).toHaveLength(3);
    expect(trash(g)).toHaveLength(2);
  });

  it('with no Character of cost 1 or less the deck is still trashed', () => {
    const g = game({ p2: [SC14.c2, SC14.c3] });
    use(g);
    finishEmpty(g);
    need(g, 'main', 'p1');
    expect(zoneIds(g, 'p2', 'characters')).toHaveLength(2);
    expect(trash(g)).toHaveLength(2);
  });

  it('K.O.s only one of two cost-1 Characters', () => {
    const g = game({ p2: [SC14.c1, SC10.dr2, SC14.zero1] });
    use(g);
    expect(offeredIds(g)).toEqual([SC14.zero1, SC14.c1].sort());
    pickInst(g, [chr(g, 'p2', SC14.zero1)]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([SC14.c1, SC10.dr2].sort());
  });

  it('without a {Dressrosa} Leader or Stage it cannot be used', () => {
    const g = game({ leader: LD10.plain });
    expect(offeredAbility(g, at(g, 'p1', 'characters', ID))).toBe(false);
  });

  it('a rested Brook or a rested Leader cannot pay', () => {
    const a = game({ self: { card: ID, rested: true } });
    expect(offeredAbility(a, at(a, 'p1', 'characters', ID))).toBe(false);
    const b = game({ leader: { card: LD10.dress, rested: true } });
    expect(offeredAbility(b, at(b, 'p1', 'characters', ID))).toBe(false);
  });

  it('trashing the last cards of the deck loses the game', () => {
    const g = game({ deckSize: 2 });
    use(g);
    none(g);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });
});
