/**
 * OP10-083 Kouzuki Momonosuke (Character, Black, cost 2, 0 power, Counter +2000, {Land of Wano}/
 * {Kouzuki Clan}/{Dressrosa}).
 *
 * Card text: "[Activate: Main] You may rest this Character and 1 of your "Dressrosa" type Leader or
 * Stage cards: Give up to 1 of your opponent's Characters −2 cost during this turn."
 *
 * Rules: cost cannot be below 0 outside a calculation (CR 1-3-6-2); "during this turn" ends at the
 * end of the turn (CR 6-6-1-3); a rested card cannot be rested again; "up to" allows 0.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  chr,
  endTurn,
  kind,
  LD10,
  mine,
  need,
  none,
  offeredAbility,
  offeredIds,
  payRestDress,
  pickInst,
  rawActivate,
  SC14,
} from './kit-op10c.ts';

const ID = 'OP10-083';
const STAGE = 'OP04-096';

function game(
  o: {
    leader?: string | { card: string; rested: boolean };
    stage?: boolean;
    self?: { card: string; rested: boolean } | string;
    p2?: string[];
  } = {},
) {
  return mine(
    o.leader ?? LD10.dress,
    {
      characters: [o.self ?? ID],
      ...(o.stage ? { stage: STAGE } : {}),
    },
    { characters: o.p2 ?? [SC14.c3, SC14.c2, SC14.c1] },
  );
}

function use(g: ReturnType<typeof game>, which: 'leader' | 'stage' = 'leader') {
  rawActivate(g, at(g, 'p1', 'characters', ID));
  payRestDress(g, which);
}

describe('OP10-083 Momonosuke [Activate: Main] rest self + Dressrosa Leader/Stage: -2 cost this turn', () => {
  it('rests Momonosuke and the Leader, and gives the chosen Character -2 cost', () => {
    const g = game();
    use(g);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', SC14.c3)]);
    need(g, 'main', 'p1');
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(g.card(chr(g, 'p2', SC14.c3)).cost).toBe(1);
  });

  it('only the chosen Character changes; the others keep their cost', () => {
    const g = game();
    use(g);
    pickInst(g, [chr(g, 'p2', SC14.c3)]);
    expect(g.card(chr(g, 'p2', SC14.c2)).cost).toBe(2);
    expect(g.card(chr(g, 'p2', SC14.c1)).cost).toBe(1);
  });

  it('a cost never goes below 0: -2 on a cost-1 Character shows 0', () => {
    const g = game();
    use(g);
    pickInst(g, [chr(g, 'p2', SC14.c1)]);
    expect(g.card(chr(g, 'p2', SC14.c1)).cost).toBe(0);
  });

  it('targets Characters only: the opposing Leader is not offered', () => {
    const g = game();
    use(g);
    expect(offeredIds(g).sort()).toEqual([SC14.c1, SC14.c2, SC14.c3].sort());
  });

  it('the reduction ends with the turn', () => {
    const g = game();
    use(g);
    pickInst(g, [chr(g, 'p2', SC14.c3)]);
    endTurn(g);
    // p2's turn: whatever p2 is asked first, the Character is back to its printed cost.
    expect(g.card(chr(g, 'p2', SC14.c3)).cost).toBe(3);
  });

  it('"up to 1": may choose nothing; both rests stay paid', () => {
    const g = game();
    use(g);
    none(g);
    need(g, 'main', 'p1');
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(g.card(chr(g, 'p2', SC14.c3)).cost).toBe(3);
  });

  it('a Dressrosa Stage can pay instead of the Leader', () => {
    const g = game({ leader: LD10.plain, stage: true });
    use(g, 'stage');
    pickInst(g, [chr(g, 'p2', SC14.c2)]);
    expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(g.card(chr(g, 'p2', SC14.c2)).cost).toBe(0);
  });

  it('without a {Dressrosa} Leader or Stage the ability cannot be used', () => {
    const g = game({ leader: LD10.plain });
    expect(offeredAbility(g, at(g, 'p1', 'characters', ID))).toBe(false);
  });

  it('a rested Momonosuke cannot pay "rest this Character"; a rested Leader cannot be rested again', () => {
    const a = game({ self: { card: ID, rested: true } });
    expect(offeredAbility(a, at(a, 'p1', 'characters', ID))).toBe(false);
    const b = game({ leader: { card: LD10.dress, rested: true } });
    expect(offeredAbility(b, at(b, 'p1', 'characters', ID))).toBe(false);
  });

  it('after using it Momonosuke is rested, so it cannot be used twice in a turn', () => {
    const g = game();
    use(g);
    pickInst(g, [chr(g, 'p2', SC14.c3)]);
    expect(kind(g)).toBe('main');
    expect(offeredAbility(g, at(g, 'p1', 'characters', ID))).toBe(false);
    void act;
  });
});
