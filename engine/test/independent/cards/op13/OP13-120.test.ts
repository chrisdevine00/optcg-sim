/**
 * OP13-120 Sabo (Character, Black, cost 6, 7000, no Counter, {Revolutionary Army}/{Dressrosa}, [Blocker]).
 *
 * Card text: "[Blocker] [Activate: Main] [Once Per Turn] Up to 1 of your Characters gains +2 cost until
 * the end of your opponent's next turn. Then, give up to 1 rested DON!! card to your Leader."
 *
 * Rules: CR 10-2-13 ([Once Per Turn]), CR 8-4-4-1 ("up to"), CR 8-1-4-2 (durations), CR 6-5-5
 * (given DON!!), CR 10-1-4 ([Blocker]). The "Then" is not behind an "If", so it resolves whatever the
 * first part did. Opposing removal that reads a cost: OP17-046 Gloriosa (cost 5 or less).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  atMain,
  attack,
  blockers,
  bottomAim,
  chars,
  choices,
  doneRaw,
  don,
  endTurn,
  keywordsOf,
  LD13,
  mine,
  need,
  offeredAbilities,
  offeredIds,
  pickRaw,
  SC15,
  theirs,
  toMyNextMain,
  useAbility,
} from './kit-op13d.ts';

const ID = 'OP13-120';

function start(
  o: { own?: string[]; rested?: number; p2?: string[]; p2hand?: string[] } = {},
): TestGame {
  return mine(
    LD13.black,
    {
      characters: [ID, ...(o.own ?? [SC15.red3])],
      costArea: { active: 10 - (o.rested ?? 2), rested: o.rested ?? 2 },
    },
    { characters: o.p2 ?? [SC15.red3], hand: o.p2hand ?? [], costArea: { active: 0, rested: 10 } },
  );
}

const sabo = (g: TestGame) => at(g, 'p1', 'characters', ID);
const cost = (g: TestGame, card: string) => g.card(at(g, 'p1', 'characters', card)).cost;

describe('OP13-120 Sabo: [Blocker]; [Activate: Main] [Once Per Turn] +2 cost to one of my Characters until the end of the opponent’s next turn; then give up to 1 rested DON!! to my Leader', () => {
  it('+2 cost on the chosen Character (3 to 5), then 1 rested DON!! goes to my Leader', () => {
    const g = start();
    useAbility(g, sabo(g));
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p1', 'characters', SC15.red3));
    need(g, 'choose', 'p1');
    pickRaw(g, g.leader('p1'));
    expect(atMain(g)).toBe(true);
    expect(cost(g, SC15.red3)).toBe(5);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g)).toMatchObject({ active: 8, rested: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('it may target Sabo himself (cost 6 to 8)', () => {
    const g = start();
    useAbility(g, sabo(g));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ID, SC15.red3].sort());
    pickRaw(g, sabo(g));
    expect(cost(g, ID)).toBe(8);
  });

  it('only my own Characters are candidates', () => {
    const g = start({ p2: [SC15.red4] });
    useAbility(g, sabo(g));
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(at(g, 'p2', 'characters', SC15.red4));
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('the cost bonus lasts through the opponent’s next turn and is gone on my following turn', () => {
    const g = start();
    useAbility(g, sabo(g));
    pickRaw(g, at(g, 'p1', 'characters', SC15.red3));
    pickRaw(g, g.leader('p1'));
    endTurn(g);
    expect(cost(g, SC15.red3)).toBe(5);
    endTurn(g);
    expect(atMain(g)).toBe(true);
    expect(cost(g, SC15.red3)).toBe(3);
  });

  it('the raised cost is real: a cost 4 Character at 6 cannot be placed at the bottom by a "cost 5 or less" effect', () => {
    const g = start({ own: [SC15.red4], p2hand: [SC15.gloriosa] });
    useAbility(g, sabo(g));
    pickRaw(g, at(g, 'p1', 'characters', SC15.red4));
    pickRaw(g, g.leader('p1'));
    endTurn(g);
    bottomAim(g, at(g, 'p1', 'characters', SC15.red4));
    expect(chars(g)).toEqual([ID, SC15.red4].sort());
    // Control: without Sabo's bonus the same effect takes the cost 4 Character.
    const c = start({ own: [SC15.red4], p2hand: [SC15.gloriosa] });
    endTurn(c);
    bottomAim(c, at(c, 'p1', 'characters', SC15.red4));
    expect(chars(c)).toEqual([ID]);
  });

  it('"up to 1": choosing no Character is legal and the DON!! part still resolves ("Then" is not conditional)', () => {
    const g = start();
    useAbility(g, sabo(g));
    need(g, 'choose', 'p1');
    doneRaw(g);
    need(g, 'choose', 'p1');
    pickRaw(g, g.leader('p1'));
    expect(cost(g, SC15.red3)).toBe(3);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('"up to 1": the rested DON!! may be kept: choosing nobody gives none', () => {
    const g = start();
    useAbility(g, sabo(g));
    pickRaw(g, at(g, 'p1', 'characters', SC15.red3));
    need(g, 'choose', 'p1');
    doneRaw(g);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
    expect(cost(g, SC15.red3)).toBe(5);
  });

  it('with no rested DON!! the cost bonus still applies and nothing is given', () => {
    const g = start({ rested: 0 });
    useAbility(g, sabo(g));
    pickRaw(g, at(g, 'p1', 'characters', SC15.red3));
    if (g.legal().some((a) => a.type === 'pick')) {
      pickRaw(g, g.leader('p1'));
    } else if (g.legal().some((a) => a.type === 'done')) {
      doneRaw(g);
    }
    expect(cost(g, SC15.red3)).toBe(5);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(don(g)).toMatchObject({ active: 10, rested: 0 });
  });

  it('the DON!! goes only to the Leader: the pick offers nothing else', () => {
    const g = start();
    useAbility(g, sabo(g));
    pickRaw(g, at(g, 'p1', 'characters', SC15.red3));
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([g.leader('p1')]);
  });

  it('[Once Per Turn]: after one use it is not offered again; it is offered again the next turn', () => {
    const g = start();
    useAbility(g, sabo(g));
    pickRaw(g, at(g, 'p1', 'characters', SC15.red3));
    pickRaw(g, g.leader('p1'));
    expect(offeredAbilities(g, sabo(g))).toEqual([]);
    toMyNextMain(g);
    expect(offeredAbilities(g, sabo(g))).toHaveLength(1);
  });

  it('has [Blocker] and is the only blocker offered against an attack', () => {
    const g = theirs(LD13.black, { characters: [ID] }, {});
    expect(keywordsOf(g, sabo(g))).toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([sabo(g)]);
  });

  it('it is not offered on the opponent’s turn', () => {
    const g = theirs(LD13.black, { characters: [ID] }, {});
    expect(offeredAbilities(g, sabo(g))).toEqual([]);
  });
});
