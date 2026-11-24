/**
 * EB05-039 Pink Hornet (Event, Purple, cost 1, {The Vinsmoke Family}/{GERMA 66}).
 *
 * Card text: "[Main] DON!! -1: If your Leader has the {The Vinsmoke Family} type, give up to 1 of
 * your opponent's Characters -4000 power during this turn.
 * [Counter] DON!! -1: Your Leader gains +4000 power during this battle."
 *
 * Rules: CR 8-3-1-6 (DON!! -1 returns any DON!! on my field, rested or active, to the DON!! deck),
 * RL-52 (an Event's DON!! -X may be declined), CR 8-3-3 (failed "if"), CR 8-4-4-1, RL-08 (battle
 * boost ends with the battle), RL-09 (turn boost ends with the turn), CR 1-3-6-1.
 */
import { describe, expect, it } from 'vitest';
import { attack, endTurn, passBlock, passCounter } from '../../helpers.ts';
import {
  beginUse,
  BLUE,
  CH,
  canCounter,
  choiceCards,
  counterEvent,
  don,
  kind,
  LD,
  mainEvent,
  mine,
  RED,
  side,
  theirTurn,
  trash,
} from './kit-b.ts';

const ID = 'EB05-039';

function main(o: { leader?: string; active?: number; opp?: string[]; use?: boolean } = {}) {
  const g = mine(
    o.leader ?? LD.vinsmoke,
    { hand: [ID], characters: [CH.sai], costArea: { active: o.active ?? 3, rested: 0 } },
    { characters: o.opp ?? [CH.kingdew] },
  );
  mainEvent(g, g.find('p1', 'hand', ID), {
    use: [o.use ?? true],
    picks: [[g.find('p2', 'characters', (o.opp ?? [CH.kingdew])[0]!)]],
  });
  return g;
}

describe('EB05-039 Pink Hornet [Main]: DON!! -1: Vinsmoke Leader: opposing Character -4000 this turn', () => {
  it('Vinsmoke Leader: the Character loses 4000 power, 1 DON!! returns to the DON!! deck, the Event is trashed', () => {
    const g = main();
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(3000);
    expect(don(g).deck).toBe(7 + 1);
    expect(don(g).active + don(g).rested).toBe(2);
    expect(trash(g)).toEqual([ID]);
  });

  it('CR 8-3-3: a non-Vinsmoke Leader (ST01-001): no power change', () => {
    const g = main({ leader: LD.shc });
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(7000);
  });

  it('CR 8-3-1-6: with only 1 DON!! on my field (rested to pay the Event) DON!! -1 can still return it', () => {
    const g = main({ active: 1 });
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(3000);
    expect(don(g).active + don(g).rested).toBe(0);
  });

  it('RL-52: declining the DON!! -1 means no effect and no DON!! returned', () => {
    const g = main({ use: false });
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(7000);
    expect(don(g).deck).toBe(7);
  });

  it('only the opponent’s Characters may be chosen (not mine, not a Leader)', () => {
    const g = mine(
      LD.vinsmoke,
      { hand: [ID], characters: [CH.sai], costArea: { active: 3, rested: 0 } },
      { characters: [CH.kingdew, CH.marco] },
    );
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    beginUse(g);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g)).toEqual([CH.kingdew, CH.marco].sort());
  });

  it('"up to 1": choosing no Character changes no power', () => {
    const g = mine(
      LD.vinsmoke,
      { hand: [ID], costArea: { active: 3, rested: 0 } },
      { characters: [CH.kingdew, CH.marco] },
    );
    mainEvent(g, g.find('p1', 'hand', ID), { picks: [[]] });
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(7000);
    expect(g.power(g.find('p2', 'characters', CH.marco))).toBe(5000);
  });

  it('CR 1-3-6-1: a Character reduced below 0 stays on the field', () => {
    const g = main({ opp: [CH.komachiyo] });
    expect(g.power(g.find('p2', 'characters', CH.komachiyo))).toBe(-1000);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('RL-09: the -4000 lasts for this turn only (7000 again on the opponent’s turn)', () => {
    const g = main();
    endTurn(g);
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(7000);
  });
});

describe('EB05-039 Pink Hornet [Counter]: DON!! -1: my Leader +4000 during this battle', () => {
  function defending(leader: string = LD.vinsmoke) {
    return theirTurn(
      side(leader, BLUE, { hand: [ID], costArea: { active: 2, rested: 0 } }),
      side(LD.shc, RED, { characters: [CH.marco] }),
    );
  }
  const strike = (g: ReturnType<typeof defending>) => {
    attack(g, g.find('p2', 'characters', CH.marco), g.leader('p1'));
    passBlock(g);
  };

  it('Leader 5000 + 4000 stops a 5000 attacker; 1 DON!! is returned; the boost ends with the battle', () => {
    const g = defending();
    strike(g);
    counterEvent(g, g.find('p1', 'hand', ID));
    expect(g.power(g.leader('p1'))).toBe(9000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(don(g).deck).toBe(8 + 1);
  });

  it('no Leader-type condition on the [Counter]: it works with a non-Vinsmoke Leader', () => {
    const g = defending(LD.shc);
    strike(g);
    expect(canCounter(g, g.find('p1', 'hand', ID))).toBe(true);
    counterEvent(g, g.find('p1', 'hand', ID));
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('RL-52: declining the DON!! -1 gives no boost and returns no DON!!', () => {
    const g = defending();
    strike(g);
    counterEvent(g, g.find('p1', 'hand', ID), { use: [false] });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(don(g).deck).toBe(8);
  });
});
