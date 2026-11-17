/**
 * OP14-096 Ground Death (Event, Black, cost 1, {Baroque Works}/{The Seven Warlords of the Sea}).
 *
 * Card text:
 *   "[Main] You may rest 2 of your DON!! cards: Negate the effect of up to 1 of your opponent's
 *    Characters with a cost of 5 or less during this turn.
 *    [Counter] If you have 10 or more cards in your trash, up to 1 of your Leader or Character
 *    cards gains +4000 power during this battle."
 *
 * Rules: CR 8-2 (a negated card's effects, keywords included, do nothing; CardView.negated);
 * CR 8-3-1-3 / 8-3-1-4 (cost fully payable / "may"); CR 2-7-3 / 8-4-2 (an Event is trashed
 * BEFORE its effect resolves, so the Event itself counts in "10 or more cards in your trash");
 * CR 4-10-1; CR 6-6-1-3 ("during this turn").
 */
import { describe, expect, it } from 'vitest';
import { act, attack, endTurn, fill, passBlock, passCounter } from '../../helpers.ts';
import { canCounterWith, donOf, kind, myTurn, theirTurn, useCounter } from '../kit.ts';
import {
  blockOptions,
  C,
  drive,
  FILLER,
  ids,
  offeredCards,
  playCard,
  side,
  sorted,
  V,
} from './kit-c.ts';

const ID = 'OP14-096';

describe('OP14-096 Ground Death: [Main] rest 2 DON!! → negate an opponent Character (cost ≤5) this turn', () => {
  function game(active = 3, theirs: string[] = [V.kingdew, V.thatch, C.blocker]) {
    return myTurn(
      side(C.luffy, FILLER, { hand: [ID], characters: [V.marco], costArea: { active, rested: 0 } }),
      side(C.shanks, FILLER, { characters: theirs }),
    );
  }

  it('happy path: pays 1 + rests 2, the chosen Character (cost 5) is negated', () => {
    const g = game();
    const t = g.find('p2', 'characters', V.kingdew);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [t], don: 'costActive' });
    expect(g.card(t).negated).toBe(true);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
    expect(ids(g, 'p1', 'trash')).toContain(ID);
  });

  it('only opponent Characters with cost 5 or less are candidates (cost 6 is not; not my Characters)', () => {
    const g = game();
    playCard(g, 'p1', ID);
    for (let i = 0; i < 3 && kind(g) === 'optional'; i++) g.act({ type: 'optional', accept: true });
    for (let i = 0; i < 3 && kind(g) === 'choose' && offeredCards(g).length === 0; i++) {
      g.act(g.legal().find((a) => a.type === 'pick')!);
    }
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual(sorted([V.kingdew, C.blocker]));
  });

  it('a negated [Blocker] Character cannot block this turn (control: the same attack can be blocked)', () => {
    const g = game();
    const marco = g.find('p1', 'characters', V.marco);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p2', 'characters', C.blocker)], don: 'costActive' });
    attack(g, marco, g.leader('p2'));
    expect(blockOptions(g)).toEqual([]);

    const h = game();
    attack(h, h.find('p1', 'characters', V.marco), h.leader('p2'));
    expect(blockOptions(h)).toEqual([h.find('p2', 'characters', C.blocker)]);
  });

  it('"up to 1": may negate nobody (the cost is still paid)', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [], don: 'costActive' });
    for (const c of g.zone('p2', 'characters')) expect(g.card(c.instance).negated).toBeFalsy();
    expect(donOf(g, 'p1').rested).toBe(3);
  });

  it('CR 8-3-1-3: with only 2 DON!! (1 goes to the Event) the "rest 2" cannot be paid: nothing is negated', () => {
    const g = game(2);
    const t = g.find('p2', 'characters', V.kingdew);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [t], don: 'costActive' });
    expect(g.card(t).negated).toBeFalsy();
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 1 });
  });

  it('CR 8-3-1-4: declining the "may" cost rests no extra DON!! and negates nothing', () => {
    const g = game();
    const t = g.find('p2', 'characters', V.kingdew);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false, targets: [t] });
    expect(g.card(t).negated).toBeFalsy();
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
  });

  it('"during this turn": the negation is over on the opponent\'s turn', () => {
    const g = game();
    const t = g.find('p2', 'characters', V.kingdew);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [t], don: 'costActive' });
    endTurn(g);
    expect(g.card(t).negated).toBeFalsy();
  });
});

describe('OP14-096 Ground Death: [Counter] 10 or more cards in trash → Leader or Character +4000 this battle', () => {
  function defending(trash: number) {
    return theirTurn(
      side(C.luffy, FILLER, {
        hand: [ID],
        trash: fill(FILLER, trash),
        costArea: { active: 1, rested: 0 },
      }),
      side(C.shanks, FILLER, { characters: [V.kingdew] }),
    );
  }

  it('9 cards already in the trash: the Event itself is trashed first and makes 10, so the boost applies', () => {
    const g = defending(9);
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    drive(g, 'p1', { targets: [g.leader('p1')] });
    expect(g.power(g.leader('p1'))).toBe(9000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('8 cards in the trash: 9 with the Event, not enough → no boost, the hit lands', () => {
    const g = defending(8);
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

  it('20 cards: still +4000, not more', () => {
    const g = defending(20);
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    drive(g, 'p1', { targets: [g.leader('p1')] });
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('the +4000 may go to a Character instead of the Leader', () => {
    const g = theirTurn(
      side(C.luffy, FILLER, {
        hand: [ID],
        trash: fill(FILLER, 9),
        characters: [V.sai],
        costArea: { active: 1, rested: 0 },
      }),
      side(C.shanks, FILLER, { characters: [V.kingdew] }),
    );
    const sai = g.find('p1', 'characters', V.sai);
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    drive(g, 'p1', { targets: [sai] });
    expect(g.power(sai)).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
