/**
 * ST31-004 Monkey.D.Luffy (Character, Red, cost 7, 9000, no Counter; Straw Hat Crew / The Four
 * Emperors).
 *
 * Card text (cards/data):
 *   "If you have a total of 3 or more given DON!! cards, this Character gains [Rush].
 *    [On Play] For every {Straw Hat Crew} type card on your field, give up to 1 of your opponent's
 *    Characters −1000 power during this turn."
 *
 * Rules: "on your field" covers the Leader, Characters and Stage areas (CR 3-1-2), and this Luffy
 * itself (it is on the field when its [On Play] resolves). The count is made when the effect
 * resolves; each unit gives "up to 1" target (CR 8-4-4-1); "during this turn" ends in the End Phase
 * (CR 6-6-1-3). The Rush condition counts DON!! given to the Leader and all Characters in total.
 */
import { describe, expect, it } from 'vitest';
import type { InstanceId, PlayerSpec } from '@optcg/engine';
import {
  act,
  canAttackAny,
  CH,
  canFinish,
  choices,
  endTurn,
  F,
  kind,
  LB,
  myTurn,
  play,
  side,
  sideL,
} from './kit-b.ts';

const LUFFY = 'ST31-004';
const SUNNY_STAGE = 'ST31-005';

function playGame(p1: Partial<PlayerSpec> = {}, leader: string = LB.redShc) {
  const g = myTurn(
    side(leader, F.red, { hand: [LUFFY], costArea: { active: 7, rested: 0 }, ...p1 }),
    side(LB.opp, F.red, { characters: [CH.kingdew, CH.thatch, CH.marco, CH.sai, CH.hajrudin] }),
  );
  play(g, g.find('p1', 'hand', LUFFY));
  return g;
}

/** Answer each "up to 1" pick with the next unused target; returns how many picks were made. */
function spend(g: ReturnType<typeof playGame>, targets: InstanceId[]): number {
  let n = 0;
  const left = [...targets];
  for (let i = 0; i < 12 && kind(g) === 'choose'; i++) {
    const offeredNow = choices(g);
    const t = left.find((x) => offeredNow.includes(x));
    if (t) {
      act(g, { type: 'pick', choice: t });
      left.splice(left.indexOf(t), 1);
      n++;
    } else if (canFinish(g)) {
      act(g, { type: 'done' });
    } else break;
  }
  return n;
}

describe('ST31-004 [On Play]: for every {Straw Hat Crew} card on your field, −1000 to up to 1 opponent Character', () => {
  it('Leader (SHC) + Robin (SHC) + Luffy itself = 3: three Characters get −1000; Marco (not SHC) is not counted', () => {
    const g = playGame({ characters: [CH.robin, CH.komachiyo] });
    const k = g.find('p2', 'characters', CH.kingdew);
    const t = g.find('p2', 'characters', CH.thatch);
    const m = g.find('p2', 'characters', CH.marco);
    const picks = spend(g, [k, t, m]);
    expect(picks).toBe(3);
    expect(g.power(k)).toBe(6000);
    expect(g.power(t)).toBe(7000);
    expect(g.power(m)).toBe(4000);
    expect(g.power(g.find('p2', 'characters', CH.sai))).toBe(4000);
  });

  it('a non-SHC Leader: only Luffy itself counts, so exactly 1 pick', () => {
    const g = playGame({}, LB.greenKid);
    const k = g.find('p2', 'characters', CH.kingdew);
    const t = g.find('p2', 'characters', CH.thatch);
    const picks = spend(g, [k, t]);
    expect(picks).toBe(1);
    // Kingdew 7000 and Thatch 8000: exactly one of them lost exactly 1000.
    expect(7000 - g.power(k)! + (8000 - g.power(t)!)).toBe(1000);
  });

  it('a Stage with the type counts too: Leader + Thousand Sunny (Stage) + Luffy = 3', () => {
    const g = playGame({ stage: SUNNY_STAGE });
    const ids = ['kingdew', 'thatch', 'marco', 'sai'].map((n) =>
      g.find(
        'p2',
        'characters',
        { kingdew: CH.kingdew, thatch: CH.thatch, marco: CH.marco, sai: CH.sai }[n]!,
      ),
    );
    expect(spend(g, ids)).toBe(3);
  });

  it('"during this turn": the −1000 is gone on the next turn', () => {
    const g = playGame({ characters: [CH.robin] });
    const k = g.find('p2', 'characters', CH.kingdew);
    const t = g.find('p2', 'characters', CH.thatch);
    spend(g, [k, t]);
    expect(g.power(k)).toBe(6000);
    endTurn(g);
    expect(g.power(k)).toBe(7000);
    expect(g.power(t)).toBe(8000);
  });

  it('"up to 1" each time: all picks may be declined', () => {
    const g = playGame({ characters: [CH.robin] });
    for (let i = 0; i < 5 && kind(g) === 'choose' && canFinish(g); i++) act(g, { type: 'done' });
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(7000);
  });

  it('only the opponent’s Characters can be chosen, never your own', () => {
    const g = playGame({ characters: [CH.robin] });
    const offeredNow = choices(g);
    expect(offeredNow).not.toContain(g.find('p1', 'characters', CH.robin));
    expect(offeredNow).not.toContain(g.leader('p2'));
  });
});

describe('ST31-004: with a total of 3 or more given DON!! this Character gains [Rush]', () => {
  function fieldGame(leaderDon: number, lufyDon: number, otherDon: number) {
    return myTurn(
      sideL({ card: LB.redShc, don: leaderDon }, F.red, {
        characters: [
          { card: LUFFY, don: lufyDon, playedThisTurn: true },
          { card: CH.robin, don: otherDon },
        ],
      }),
      side(LB.opp, F.red),
    );
  }

  it('2 on the Leader + 1 on Robin = 3 in total: [Rush], and it can attack the turn it is played', () => {
    const g = fieldGame(2, 0, 1);
    const luffy = g.find('p1', 'characters', LUFFY);
    expect(g.card(luffy).keywords).toContain('Rush');
    expect(canAttackAny(g, luffy)).toBe(true);
  });

  it('only 2 in total: no [Rush]; it cannot attack this turn', () => {
    const g = fieldGame(1, 0, 1);
    const luffy = g.find('p1', 'characters', LUFFY);
    expect(g.card(luffy).keywords).not.toContain('Rush');
    expect(canAttackAny(g, luffy)).toBe(false);
  });

  it('DON!! on Luffy itself count too: 3 on Luffy', () => {
    const g = fieldGame(0, 3, 0);
    expect(g.card(g.find('p1', 'characters', LUFFY)).keywords).toContain('Rush');
  });
});
