/**
 * OP10-022 Trafalgar Law (Leader, Green/Yellow, 5000, 4 Life, Slash, {Heart Pirates}/{Supernovas}/{Dressrosa}).
 *
 * Card text: "[DON!! x1] [Activate: Main] [Once Per Turn] If the total cost of your Characters is 5
 * or more, you may return 1 of your Characters to the owner's hand: Reveal 1 card from the top of
 * your Life cards. If that card is a "Supernovas" type Character card with a cost of 5 or less,
 * you may play that card."
 *
 * Rules: CR 8-3-2-3 ([DON!! xN]: N or more DON!! given to this card), the "If ... :" before the
 * colon is an activation condition (checked when activating, so it is not offered when false),
 * "total cost of your Characters" = the sum of the costs of the Characters on my field (not the
 * opponent's, not a Stage, not the Leader), CR 8-3-1 (the returned Character is the cost), CR 3-10
 * and rules-digest 104 (a Life card moved by an effect is not damage: no [Trigger]), the Character
 * area holds 5 (the returned Character frees a slot), CR 4-8-1 ("you may play").
 * Open M6b-Q84 (current versus printed cost for the total) and the face state of a revealed card
 * left in Life: not asserted. Scenery (printed): OP01-010 (cost 1) / OP01-012 (2) / OP01-023 (3) /
 * OP01-018 (4) / OP02-006 (5) vanilla Red Characters; OP14-008 Apoo (cost 3), OP10-101 Urouge (5),
 * OP10-105 Cavendish (6): {Supernovas} Characters; OP10-116 Damned Punk (Event, {Supernovas}, cost 4).
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import { decision } from '../../helpers.ts';
import { myTurn, side } from '../kit.ts';
import {
  anomalies,
  BLUE,
  handOf,
  L7,
  lifeOf,
  need,
  no,
  offeredAbilities,
  offeredIds,
  ofZone,
  payHand,
  RED,
  S7,
  toMyNextMain,
  yes,
} from './kit-w7a.ts';

const ID = 'OP10-022';
const PUNK = 'OP10-116';

function start(o: Partial<PlayerSpec> = {}, opp: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(ID, BLUE, {
      leader: { card: ID, don: 1 },
      characters: [S7.c3, S7.c2],
      life: [S7.sn3, S7.c2, S7.c3, S7.c4],
      ...o,
    }),
    side(L7.crocodile, RED, opp),
  );
}

const lead = (g: ReturnType<typeof start>) => g.leader('p1');
const offered = (g: ReturnType<typeof start>) => offeredAbilities(g, lead(g)).length > 0;

/** Activate and return `back` (answering the cost pick if it is asked). Leaves the play question, if any. */
function run(g: ReturnType<typeof start>, back?: CardId) {
  const [ability] = offeredAbilities(g, lead(g));
  if (!ability) throw new Error('Law is not offered');
  g.act({ type: 'activate', card: lead(g), ability });
  if (back !== undefined && decision(g)?.kind === 'choose' && offeredIds(g).length) {
    payHand(g, [back]);
  }
}

describe('OP10-022 Trafalgar Law: [DON!! x1] [Activate: Main] return a Character, reveal my top Life card, maybe play it', () => {
  it('printed effect: the Character goes to my hand; a {Supernovas} Character of cost 5 or less is played from the top of my Life', () => {
    const g = start();
    run(g, S7.c2);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(decision(g)?.kind).toBe('main');
    expect(handOf(g, 'p1')).toEqual([S7.c2]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([S7.c3, S7.sn3].sort());
    expect(lifeOf(g, 'p1')).toEqual([S7.c2, S7.c3, S7.c4]);
    expect(g.card(g.find('p1', 'characters', S7.sn3)).rested).toBe(false);
    expect(anomalies(g)).toBe(0);
  });

  it('declining the "you may play": the revealed card stays on top of my Life and the Character stays in hand', () => {
    const g = start();
    run(g, S7.c2);
    no(g, 'p1');
    expect(decision(g)?.kind).toBe('main');
    expect(lifeOf(g, 'p1')).toEqual([S7.sn3, S7.c2, S7.c3, S7.c4]);
    expect(handOf(g, 'p1')).toEqual([S7.c2]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([S7.c3]);
  });

  it('the revealed card is not a {Supernovas} card (Komachiyo): it stays in Life and nothing is asked', () => {
    const g = start({ life: [S7.c1, S7.sn3, S7.c3, S7.c4] });
    run(g, S7.c2);
    expect(decision(g)?.kind).toBe('main');
    expect(lifeOf(g, 'p1')).toEqual([S7.c1, S7.sn3, S7.c3, S7.c4]);
    expect(handOf(g, 'p1')).toEqual([S7.c2]);
  });

  it('only the TOP card is revealed: a {Supernovas} card second from the top is not played', () => {
    const g = start({ life: [S7.c1, S7.sn3, S7.sn5, S7.c4] });
    run(g, S7.c2);
    expect(decision(g)?.kind).toBe('main');
    expect(lifeOf(g, 'p1')).toEqual([S7.c1, S7.sn3, S7.sn5, S7.c4]);
  });

  it('cost boundary: a {Supernovas} Character of cost 5 may be played, one of cost 6 may not', () => {
    const five = start({ life: [S7.sn5, S7.c2, S7.c3, S7.c4] });
    run(five, S7.c2);
    need(five, 'optional', 'p1');
    yes(five, 'p1');
    expect(ofZone(five, 'p1', 'characters')).toContain(S7.sn5);
    const six = start({ life: [S7.sn6, S7.c2, S7.c3, S7.c4] });
    run(six, S7.c2);
    expect(decision(six)?.kind).toBe('main');
    expect(ofZone(six, 'p1', 'characters')).not.toContain(S7.sn6);
    expect(lifeOf(six, 'p1')[0]).toBe(S7.sn6);
  });

  it('a {Supernovas} Event on top of my Life is not a Character card: it is not played', () => {
    const g = start({ life: [PUNK, S7.c2, S7.c3, S7.c4] });
    run(g, S7.c2);
    expect(decision(g)?.kind).toBe('main');
    expect(lifeOf(g, 'p1')[0]).toBe(PUNK);
    expect(handOf(g, 'p1')).toEqual([S7.c2]);
  });

  it('playing from Life is not damage: the Life count drops by one and no [Trigger] decision comes up', () => {
    const g = start();
    run(g, S7.c2);
    yes(g, 'p1');
    expect(g.life('p1')).toBe(3);
    expect(decision(g)?.kind).toBe('main');
    expect(handOf(g, 'p1')).toEqual([S7.c2]); // the Life card did not go to the hand
  });

  it('the Character played from Life has just been played: it cannot attack this turn', () => {
    const g = start();
    run(g, S7.c2);
    yes(g, 'p1');
    const apoo = g.find('p1', 'characters', S7.sn3);
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === apoo)).toBe(false);
    expect(
      g
        .legal()
        .some((a) => a.type === 'attack' && a.attacker === g.find('p1', 'characters', S7.c3)),
    ).toBe(true);
  });

  it('activation condition: a total cost of 5 (3 + 2) is enough, a total of 4 (3 + 1) is not offered', () => {
    expect(offered(start())).toBe(true);
    expect(offered(start({ characters: [S7.c3, S7.c1] }))).toBe(false);
  });

  it('a single Character of cost 5 is enough, and it can be the one returned', () => {
    const g = start({ characters: [S7.c5] });
    expect(offered(g)).toBe(true);
    run(g, S7.c5);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(ofZone(g, 'p1', 'characters')).toEqual([S7.sn3]);
    expect(handOf(g, 'p1')).toEqual([S7.c5]);
  });

  it("only my own Characters count: the opponent's Characters, my Stage and my Leader add nothing", () => {
    const g = start(
      { characters: [S7.c3, S7.c1], stage: 'EB02-009' },
      { characters: [S7.c7, S7.c6] },
    );
    expect(offered(g)).toBe(false);
  });

  it('[DON!! x1]: with no DON!! given to the Leader the ability is not offered; with 2 it is', () => {
    expect(offered(start({ leader: { card: ID, don: 0 } }))).toBe(false);
    expect(offered(start({ leader: { card: ID, don: 2 } }))).toBe(true);
  });

  it('[Once Per Turn]: not offered again this turn even though DON!! and total cost still qualify; offered again next turn', () => {
    const g = start({ characters: [S7.c5, S7.c2], life: [S7.c1, S7.c2, S7.c3, S7.c4] });
    run(g, S7.c2);
    expect(decision(g)?.kind).toBe('main');
    // Kingdew (cost 5) is left and the Leader still has its DON!!: only the [Once Per Turn] stops it.
    expect(g.card(lead(g)).don).toBe(1);
    expect(offered(g)).toBe(false);
    toMyNextMain(g);
    // The DON!! given to the Leader returned at the Refresh Phase: give one again.
    expect(offered(g)).toBe(false);
    g.act({ type: 'giveDon', target: lead(g) });
    expect(offered(g)).toBe(true);
  });

  it('with five Characters, the returned one frees the slot: the played card makes five, with no trash choice', () => {
    const g = start({
      characters: [S7.c1, S7.c2, S7.c3, S7.c4, S7.c5],
      life: [S7.sn3, S7.c2, S7.c3, S7.c4],
    });
    run(g, S7.c1);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(decision(g)?.kind).toBe('main');
    expect(g.zone('p1', 'characters')).toHaveLength(5);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
    expect(ofZone(g, 'p1', 'characters')).toContain(S7.sn3);
  });

  it('with no Life cards the cost may still be paid and nothing is revealed or played', () => {
    const g = start({ life: [] });
    run(g, S7.c2);
    expect(decision(g)?.kind).toBe('main');
    expect(handOf(g, 'p1')).toEqual([S7.c2]);
    expect(g.life('p1')).toBe(0);
    expect(anomalies(g)).toBe(0);
  });

  it('the questions before the reveal are the same whatever the top Life card is (no prompt depends on a hidden card)', () => {
    const trace = (top: CardId) => {
      const g = start({ life: [top, S7.c2, S7.c3, S7.c4] });
      const [ability] = offeredAbilities(g, lead(g));
      g.act({ type: 'activate', card: lead(g), ability: ability! });
      const d = decision(g);
      return [d?.kind, d?.purpose, d?.prompt, offeredIds(g).sort()];
    };
    expect(trace(S7.sn3)).toEqual(trace(S7.c1));
  });
});
