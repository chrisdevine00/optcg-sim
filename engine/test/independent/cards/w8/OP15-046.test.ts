/**
 * OP15-046 Sabo (Character, Blue, cost 7, 9000, [Blocker], {Revolutionary Army}/{Dressrosa}).
 *
 * Card text: "[Blocker] [On Play] If your Leader has the {Dressrosa} type, activate up to 1
 * {Dressrosa} type Event from your hand."
 *
 * Rules used: the condition is read from the Leader's types when the effect resolves (a Leader may
 * have several types); the Event is activated without paying its printed cost (any cost, no limit),
 * its written cost is paid, only its [Main] is activated and it is trashed afterwards (official
 * OP15-046 / OP12-041 Q&A, M6b-Q27); the "up to 1" pick over the hand is asked even when nothing
 * matches and never depends on the hidden hand (M6b-Q93). M6b-Q92 (an Event whose own cost cannot be
 * paid) is open: only the outcome every reading shares is asserted.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  C8,
  canFinish,
  choices,
  decision,
  donCounts,
  E8,
  expectOffered,
  kind,
  kw,
  L8,
  mine8,
  no,
  none,
  offeredIds,
  pickCardId,
  sortedCards,
  theirs8,
} from './kit-w8a.ts';

const SABO = 'OP15-046';

function playSabo(g: ReturnType<typeof mine8>): void {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', SABO) });
}

describe('OP15-046 Sabo: [Blocker]; [On Play] with a {Dressrosa} Leader activate a {Dressrosa} Event from hand', () => {
  it('printed values: cost 7, 9000 power, [Blocker]', () => {
    const g = mine8(L8.rebecca, { hand: [SABO] });
    expect(g.card(g.find('p1', 'hand', SABO)).cost).toBe(7);
    playSabo(g);
    const s = at(g, 'p1', 'characters', SABO);
    expect(g.power(s)).toBe(9000);
    expect(kw(g, s)).toContain('Blocker');
  });

  it('[Blocker]: Sabo can be chosen to block an attack on the Leader', () => {
    const g = theirs8(L8.luffy, { characters: [SABO] }, { characters: [C8.kingdew] });
    attack(g, at(g, 'p2', 'characters', C8.kingdew), g.leader('p1'));
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === at(g, 'p1', 'characters', SABO)),
    ).toBe(true);
  });

  it('with a {Dressrosa} Leader every {Dressrosa} Event is a candidate whatever its cost (3, 4, 5, 7); non-Dressrosa Events and Characters are not', () => {
    const g = mine8(L8.rebecca, {
      hand: [
        SABO,
        E8.barrierBulls, // cost 3
        E8.radioKnife, // cost 4
        E8.barrierPistol, // cost 5
        E8.fireFist, // cost 7
        E8.concasser, // {Straw Hat Crew}/{Sky Island}: not Dressrosa
        C8.shinobu, // Character
      ],
    });
    playSabo(g);
    expectOffered(g, 'p1', [E8.barrierBulls, E8.radioKnife, E8.barrierPistol, E8.fireFist]);
    expect(canFinish(g)).toBe(true);
  });

  it('a Leader that has {Dressrosa} among several types counts (Lucy, {Revolutionary Army}/{Dressrosa})', () => {
    const g = mine8(L8.lucy, { hand: [SABO, E8.barrierBulls] });
    playSabo(g);
    expectOffered(g, 'p1', [E8.barrierBulls]);
  });

  it("a cost-5 Event is activated for free: Barrier-Barrier Pistol places a 6000-power Character at the bottom of the deck; the Event is trashed; only Sabo's 7 DON!! are paid", () => {
    const g = mine8(L8.rebecca, { hand: [SABO, E8.barrierPistol] }, { characters: [C8.hajrudin] });
    playSabo(g);
    pickCardId(g, E8.barrierPistol);
    for (let i = 0; i < 3 && kind(g) === 'choose'; i++) {
      const p = g.legal().find((a) => a.type === 'pick');
      if (p) g.act(p);
      else act(g, { type: 'done' });
    }
    expect(sortedCards(g, 'p2', 'characters')).toEqual([]);
    expect(sortedCards(g, 'p1', 'trash')).toEqual([E8.barrierPistol]);
    expect(sortedCards(g, 'p1', 'hand')).toEqual([]);
    expect(donCounts(g, 'p1')).toMatchObject({ active: 3, rested: 7 });
    expect(g.eventsOfType('EventActivated').length).toBe(1);
  });

  it('a cost-7 Event is activated too (Would You Let Me Eat the Flame-Flame Fruit? draws 2)', () => {
    const g = mine8(L8.rebecca, { hand: [SABO, E8.flameFruit] });
    playSabo(g);
    pickCardId(g, E8.flameFruit);
    expect(sortedCards(g, 'p1', 'hand')).toEqual([C8.mohji, C8.mohji]);
    expect(sortedCards(g, 'p1', 'trash')).toEqual([E8.flameFruit]);
  });

  it('the whole [Main] of the Event runs with a Leader it names: Flame-Flame Fruit with a [Lucy] Leader draws 2, gives the Leader +3000 and [Double Attack]', () => {
    const g = mine8(L8.lucy, { hand: [SABO, E8.flameFruit] });
    playSabo(g);
    pickCardId(g, E8.flameFruit);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(kw(g, g.leader('p1'))).toContain('Double Attack');
    expect(sortedCards(g, 'p1', 'hand')).toEqual([C8.mohji, C8.mohji]);
  });

  it('only the [Main] of an Event with [Main] and [Counter] (Just Watch Me, Ace!!!: -3000 to a Character) is activated', () => {
    const g = mine8(L8.rebecca, { hand: [SABO, E8.justWatch] }, { characters: [C8.hajrudin] });
    playSabo(g);
    pickCardId(g, E8.justWatch);
    for (let i = 0; i < 3 && kind(g) === 'choose'; i++) {
      const p = g.legal().find((a) => a.type === 'pick');
      if (p) g.act(p);
      else act(g, { type: 'done' });
    }
    expect(g.power(at(g, 'p2', 'characters', C8.hajrudin))).toBe(3000);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(sortedCards(g, 'p1', 'trash')).toEqual([E8.justWatch]);
  });

  it('"up to 1": choosing nothing leaves the hand and the trash as they were', () => {
    const g = mine8(L8.rebecca, { hand: [SABO, E8.barrierBulls] });
    playSabo(g);
    none(g);
    expect(sortedCards(g, 'p1', 'hand')).toEqual([E8.barrierBulls]);
    expect(sortedCards(g, 'p1', 'trash')).toEqual([]);
  });

  it('with no {Dressrosa} Event in hand the question is still asked, with nothing to choose (the same prompt as with one)', () => {
    const withEvent = mine8(L8.rebecca, { hand: [SABO, E8.barrierBulls] });
    const without = mine8(L8.rebecca, { hand: [SABO, E8.concasser, C8.sai] });
    playSabo(withEvent);
    playSabo(without);
    const a = decision(withEvent)!;
    const b = decision(without)!;
    expect([b.kind, b.player, b.purpose, b.prompt]).toEqual([
      a.kind,
      a.player,
      a.purpose,
      a.prompt,
    ]);
    expect(choices(without)).toEqual([]);
    act(without, { type: 'done' });
    expect(kind(without)).toBe('main');
  });

  it('without a {Dressrosa} Leader nothing is asked and nothing is activated, even with {Dressrosa} Events in hand', () => {
    const g = mine8(L8.luffy, { hand: [SABO, E8.barrierBulls, E8.barrierPistol] });
    playSabo(g);
    expect(kind(g)).toBe('main');
    expect(sortedCards(g, 'p1', 'hand')).toEqual([E8.barrierBulls, E8.barrierPistol].sort());
    expect(sortedCards(g, 'p1', 'trash')).toEqual([]);
    expect(sortedCards(g, 'p1', 'characters')).toEqual([SABO]);
  });

  it('only the Leader type counts: a {Dressrosa} Character on the field (and Sabo himself) does not stand in for it', () => {
    const g = mine8(L8.shanks, { hand: [SABO, E8.barrierBulls], characters: [C8.shinobu] });
    playSabo(g);
    expect(kind(g)).toBe('main');
    expect(sortedCards(g, 'p1', 'trash')).toEqual([]);
  });

  it('an Event with a written cost that cannot be paid does not do its effect (Ace Here Said You Deserved It!! needs 4 rested DON!!, only 3 are left; M6b-Q92 open)', () => {
    const g = mine8(L8.rebecca, { hand: [SABO, E8.aceDeserved] }, { characters: [C8.mohji] });
    playSabo(g);
    if (offeredIds(g).includes(E8.aceDeserved)) {
      pickCardId(g, E8.aceDeserved);
      if (kind(g) === 'optional') {
        expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
        no(g, 'p1');
      }
    } else {
      none(g);
    }
    expect(sortedCards(g, 'p2', 'characters')).toEqual([C8.mohji]);
    expect(donCounts(g, 'p1').rested).toBe(7);
  });
});
