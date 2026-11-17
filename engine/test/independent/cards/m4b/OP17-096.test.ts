/**
 * OP17-096 I'm Luffy!! The Man Who Will Be King of the Pirates!! (Event, Black, cost 1, {Elbaph}/
 * {The Four Emperors}/{Straw Hat Crew}).
 *
 * Card text:
 *   "[Counter] If there is a Character with a cost of 12 or more, up to 1 of your Leader or
 *    Characters gains +4000 power during this battle.
 *    [Trigger] Add up to 1 {Elbaph} type card from your trash to your hand."
 *
 * Rules: CR 7-1-3-1-2 (Event [Counter]); CR 4-10-1 (failed "if": the Event is spent, no boost);
 * RL-43 (current cost; either player's Characters count); CR 7-1-5 (battle-long boost ends with
 * the battle); CR 10-1-5-3 (a [Trigger] card is in no area while it resolves, so it cannot add
 * itself from the trash).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock, passCounter } from '../../helpers.ts';
import { canCounterWith, eventCounterTargets, kind, theirTurn, useCounter } from '../kit.ts';
import { C, deckOf, drive, FILLER, ids, offeredCards, side, sorted, V } from './kit-c.ts';

const ID = 'OP17-096';

describe('OP17-096 [Counter]: with a cost 12+ Character, Leader or Character +4000 during this battle', () => {
  function defending(mine: string[], theirs: string[] = [V.kingdew]) {
    return theirTurn(
      side(C.elbaphLeader, FILLER, {
        hand: [ID],
        characters: mine,
        costArea: { active: 1, rested: 0 },
      }),
      side(C.shanks, FILLER, { characters: theirs }),
    );
  }

  it('own Saul on the field: Leader 5000 + 4000 stops a 7000 attacker; the boost ends with the battle', () => {
    const g = defending([C.saul]);
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    drive(g, 'p1', { targets: [g.leader('p1')] });
    expect(g.power(g.leader('p1'))).toBe(9000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("the opponent's cost 12+ Character (their attacker) also enables it", () => {
    const g = defending([], [C.saul]);
    attack(g, g.find('p2', 'characters', C.saul), g.leader('p1'));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    drive(g, 'p1', { targets: [g.leader('p1')] });
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('the boost may go to a Character instead', () => {
    const g = defending([C.saul, V.sai]);
    const sai = g.find('p1', 'characters', V.sai);
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    drive(g, 'p1', { targets: [sai] });
    expect(g.power(sai)).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("candidates are the Leader and my Characters (not the opponent's)", () => {
    const g = defending([C.saul, V.sai]);
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    passBlock(g);
    const t = eventCounterTargets(g, g.find('p1', 'hand', ID));
    expect(t).toEqual(
      [
        g.leader('p1'),
        g.find('p1', 'characters', C.saul),
        g.find('p1', 'characters', V.sai),
      ].sort(),
    );
  });

  it('CR 4-10-1: with no cost 12+ Character (cost 10 does not count) there is no boost and the hit lands', () => {
    const g = defending([C.cost10]);
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    passBlock(g);
    if (canCounterWith(g, g.find('p1', 'hand', ID))) {
      useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
      drive(g, 'p1', { targets: [g.leader('p1')] });
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });
});

describe('OP17-096 [Trigger]: add up to 1 {Elbaph} card from your trash to your hand', () => {
  function triggered(trash: string[]) {
    const g = theirTurn(
      side(C.luffy, FILLER, { life: [ID, FILLER, FILLER, FILLER], trash, deck: deckOf([]) }),
      side(C.shanks, FILLER, { characters: [V.kingdew] }),
    );
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  }

  it('activating adds an {Elbaph} card from the trash; the Trigger card itself ends in the trash', () => {
    const g = triggered([C.elbaphChar, V.sai]);
    expect(kind(g)).toBe('trigger');
    act(g, { type: 'trigger', activate: true });
    drive(g, 'p1', { cards: [C.elbaphChar] });
    expect(ids(g, 'p1', 'hand')).toEqual([C.elbaphChar]);
    expect(sorted(ids(g, 'p1', 'trash'))).toEqual(sorted([V.sai, ID]));
  });

  it('only {Elbaph} cards are offered', () => {
    const g = triggered([C.elbaphChar, V.sai, V.marco]);
    act(g, { type: 'trigger', activate: true });
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual([C.elbaphChar]);
  });

  it('"up to 1": may add nothing', () => {
    const g = triggered([C.elbaphChar]);
    act(g, { type: 'trigger', activate: true });
    drive(g, 'p1', { targets: [] });
    expect(ids(g, 'p1', 'hand')).toEqual([]);
  });

  it('CR 10-1-5-3: the Trigger card is in no area while it resolves, so it cannot fetch itself (empty trash → nothing to add)', () => {
    const g = triggered([]);
    act(g, { type: 'trigger', activate: true });
    drive(g, 'p1', {});
    expect(ids(g, 'p1', 'hand')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('declining the Trigger puts the card in hand and adds nothing from the trash', () => {
    const g = triggered([C.elbaphChar]);
    act(g, { type: 'trigger', activate: false });
    expect(ids(g, 'p1', 'hand')).toEqual([ID]);
    expect(ids(g, 'p1', 'trash')).toEqual([C.elbaphChar]);
  });
});
