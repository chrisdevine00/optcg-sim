/**
 * OP12-072 Zeff (Character, Purple, cost 4, 5000, Counter +1000, {East Blue}).
 *
 * Card text: "When a DON!! card on your field is returned to your DON!! deck, if your Leader is [Sanji],
 * this Character gains [Rush] during this turn. (This card can attack on the turn in which it is
 * played.)"
 *
 * Rules: an automatic effect (CR 8-1-3-1) that fires each time a DON!! card of mine leaves my field
 * for my DON!! deck while Zeff is on the field; the Leader condition is read when it fires;
 * "during this turn" ends at the end of the turn (CR 8-6). Rush lets a Character attack the turn it
 * is played (CR 10-1-1). A card played AFTER the DON!! was returned is not affected.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attackers,
  cast,
  decision,
  don,
  kind,
  kw,
  LB,
  mine,
  need,
  none,
  SB,
  settleOrders,
  toMyNextMain,
} from './kit-op12b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ZEFF = 'OP12-072';
/** OP05-077 Gamma Knife: Purple Event, cost 2. [Main] DON!! -1: give up to 1 of your opponent's Characters -5000 power. */
const GAMMA = 'OP05-077';

/** Pay Gamma Knife's DON!! -1 (accepting the optional cost) and leave the target empty. */
function returnOneDon(g: TestGame): void {
  cast(g, GAMMA);
  need(g, 'optional', 'p1');
  act(g, { type: 'optional', accept: true });
  if (decision(g)?.purpose === 'cost') {
    act(g, { type: 'pick', choice: { from: 'costActive' } });
  }
  need(g, 'choose', 'p1');
  none(g);
}

function board(leader: string, zeffPlayedThisTurn = true): TestGame {
  return mine(
    leader,
    {
      hand: [GAMMA, ZEFF],
      characters: [{ card: ZEFF, playedThisTurn: zeffPlayedThisTurn }],
      costArea: { active: 6, rested: 0 },
    },
    { characters: [SB.hajrudin] },
  );
}

describe('OP12-072 Zeff: when my DON!! is returned to the DON!! deck, with a [Sanji] Leader, Rush this turn', () => {
  it('control: a Zeff played this turn cannot attack before any DON!! is returned', () => {
    const g = board(LB.sanji);
    expect(attackers(g)).not.toContain(g.find('p1', 'characters', ZEFF));
    expect(kw(g, g.find('p1', 'characters', ZEFF))).not.toContain('Rush');
  });

  it('returning a DON!! (Gamma Knife DON!! -1) with a [Sanji] Leader gives Zeff [Rush]: it can attack', () => {
    const g = board(LB.sanji);
    returnOneDon(g);
    const z = g.find('p1', 'characters', ZEFF);
    expect(don(g).deck).toBe(5);
    expect(kw(g, z)).toContain('Rush');
    expect(attackers(g)).toContain(z);
  });

  it('works with the other [Sanji] Leader (OP12-041) too', () => {
    const g = board(LB.sanjiDon);
    returnOneDon(g);
    expect(kw(g, g.find('p1', 'characters', ZEFF))).toContain('Rush');
  });

  it('must not: with a Leader that is not [Sanji] there is no Rush', () => {
    const g = board(LB.croc);
    returnOneDon(g);
    const z = g.find('p1', 'characters', ZEFF);
    expect(kw(g, z)).not.toContain('Rush');
    expect(attackers(g)).not.toContain(z);
  });

  it('must not: Zeff played AFTER the DON!! was returned does not get Rush', () => {
    const g = mine(
      LB.sanji,
      { hand: [GAMMA, ZEFF], costArea: { active: 8, rested: 0 } },
      { characters: [SB.hajrudin] },
    );
    returnOneDon(g);
    cast(g, ZEFF);
    expect(kind(g)).toBe('main');
    const z = g.find('p1', 'characters', ZEFF);
    expect(kw(g, z)).not.toContain('Rush');
    expect(attackers(g)).not.toContain(z);
  });

  it('must not: no DON!! is returned (declining the cost) so no Rush', () => {
    const g = board(LB.sanji);
    cast(g, GAMMA);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: false });
    const z = g.find('p1', 'characters', ZEFF);
    expect(kw(g, z)).not.toContain('Rush');
    expect(don(g).deck).toBe(4);
  });

  it('the Rush lasts only this turn: next turn the keyword is gone', () => {
    const g = board(LB.sanji, false);
    returnOneDon(g);
    expect(kw(g, g.find('p1', 'characters', ZEFF))).toContain('Rush');
    toMyNextMain(g);
    expect(kw(g, g.find('p1', 'characters', ZEFF))).not.toContain('Rush');
  });

  it('every Zeff on my field gets the keyword (two Zeffs played this turn can both attack)', () => {
    const g = mine(
      LB.sanji,
      {
        hand: [GAMMA],
        characters: [
          { card: ZEFF, playedThisTurn: true },
          { card: ZEFF, playedThisTurn: true },
        ],
        costArea: { active: 6, rested: 0 },
      },
      { characters: [SB.hajrudin] },
    );
    returnOneDon(g);
    // Two automatic effects at once: the player orders them.
    need(g, 'order', 'p1');
    settleOrders(g, 'p1');
    expect(kw(g, g.find('p1', 'characters', ZEFF, 0))).toContain('Rush');
    expect(kw(g, g.find('p1', 'characters', ZEFF, 1))).toContain('Rush');
    expect(attackers(g)).toContain(g.find('p1', 'characters', ZEFF, 0));
    expect(attackers(g)).toContain(g.find('p1', 'characters', ZEFF, 1));
  });

  it('a Zeff that can already attack is unaffected by the keyword (it attacks as usual)', () => {
    const g = board(LB.sanji, false);
    expect(attackers(g)).toContain(g.find('p1', 'characters', ZEFF));
    returnOneDon(g);
    expect(attackers(g)).toContain(g.find('p1', 'characters', ZEFF));
  });
});
