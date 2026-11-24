/**
 * OP13-014 Portgas.D.Rouge (Character, Red, cost 1, 0 power, Counter +2000, {Baterilla}, Wisdom).
 *
 * Card text: "[Trigger] Up to 1 of your [Portgas.D.Ace] cards gains +3000 power during this turn."
 * (No other effect text.)
 *
 * Rules: CR 4-6-3 / CR 10-1-5 (a [Trigger] is activated instead of adding the Life card to hand;
 * afterwards the card is trashed), CR 8-1-2 ("up to"), "during this turn" ends with the turn.
 * A "[Portgas.D.Ace] card" is any of my cards with that exact name: Leader (OP13-002) or Character
 * (P-119).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  attack,
  cardIds,
  charsOfIds,
  declineTrigger,
  endTurn,
  hand,
  kind,
  L13,
  need,
  noDefenceUntilTrigger,
  none,
  offeredInsts,
  passBlock,
  passCounter,
  pickInst,
  playRaw,
  mine,
  theirs,
  trash,
  useCounter,
  V13,
  doneRaw,
} from './kit-op13a.ts';

const ROUGE = 'OP13-014';

/** p2 attacks my Leader with Thatch (8000); my top Life card is Rouge. Stops at the [Trigger] decision. */
function hit(leader: string, chars: string[] = [], life: string[] = [ROUGE, V13.mohji, V13.mohji]) {
  const g = theirs(leader, { characters: chars, life }, { characters: [V13.thatch] });
  attack(g, at(g, 'p2', 'characters', V13.thatch), g.leader('p1'));
  noDefenceUntilTrigger(g);
  return g;
}

describe('OP13-014 Portgas.D.Rouge: [Trigger] up to 1 of my [Portgas.D.Ace] cards gains +3000', () => {
  it('printed values: cost 1, 0 power, Counter +2000, and no effect when played from hand', () => {
    const g = mine(L13.luffy, { hand: [ROUGE], characters: [V13.ace] });
    const c = g.card(at(g, 'p1', 'hand', ROUGE));
    expect(c.cost).toBe(1);
    expect(c.counter).toBe(2000);
    playRaw(g, ROUGE);
    need(g, 'main', 'p1');
    expect(g.power(at(g, 'p1', 'characters', V13.ace))).toBe(6000);
    expect(g.power(at(g, 'p1', 'characters', ROUGE))).toBe(0);
  });

  it('as a Life card hit by an attack, the [Trigger] is offered', () => {
    const g = hit(L13.luffy, [V13.ace]);
    need(g, 'trigger', 'p1');
    expect(g.legal().some((a) => a.type === 'trigger' && a.activate)).toBe(true);
  });

  it('activating: a [Portgas.D.Ace] Character gets +3000 this turn; Rouge is trashed, not added to hand', () => {
    const g = hit(L13.luffy, [V13.ace]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([at(g, 'p1', 'characters', V13.ace)]);
    pickInst(g, [at(g, 'p1', 'characters', V13.ace)]);
    expect(g.power(at(g, 'p1', 'characters', V13.ace))).toBe(9000);
    expect(trash(g)).toEqual([ROUGE]);
    expect(hand(g)).toEqual([]);
  });

  it('a [Portgas.D.Ace] Leader is also a legal recipient (OP13-002, 6000 -> 9000)', () => {
    const g = hit(L13.ace, [V13.ace]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g).sort()).toEqual(
      [g.leader('p1'), at(g, 'p1', 'characters', V13.ace)].sort(),
    );
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(g.power(at(g, 'p1', 'characters', V13.ace))).toBe(6000);
  });

  it('only cards named [Portgas.D.Ace]: other Characters and a non-Ace Leader are never offered', () => {
    const g = hit(L13.luffy, [V13.ace, V13.luffy, V13.marco]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([at(g, 'p1', 'characters', V13.ace)]);
    expect(offeredInsts(g)).not.toContain(g.leader('p1'));
  });

  it('"up to 1": the boost may be given to nobody; Rouge is still trashed', () => {
    const g = hit(L13.luffy, [V13.ace]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(at(g, 'p1', 'characters', V13.ace))).toBe(6000);
    expect(trash(g)).toEqual([ROUGE]);
  });

  it('gives +3000 to one card only when two [Portgas.D.Ace] cards qualify (Leader and Character)', () => {
    const g = hit(L13.ace, [V13.ace]);
    activateTrigger(g);
    pickInst(g, [at(g, 'p1', 'characters', V13.ace)]);
    expect(g.power(at(g, 'p1', 'characters', V13.ace))).toBe(9000);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('declining the [Trigger]: Rouge goes to hand and nothing is boosted', () => {
    const g = hit(L13.luffy, [V13.ace]);
    declineTrigger(g);
    expect(hand(g)).toEqual([ROUGE]);
    expect(g.power(at(g, 'p1', 'characters', V13.ace))).toBe(6000);
  });

  it('with no [Portgas.D.Ace] card on my field the activation does nothing and Rouge is trashed', () => {
    const g = hit(L13.luffy, [V13.marco]);
    activateTrigger(g);
    if (kind(g) === 'choose') {
      expect(offeredInsts(g)).toEqual([]);
      doneRaw(g);
    }
    expect(trash(g)).toEqual([ROUGE]);
    expect(charsOfIds(g, 'p1')).toEqual([V13.marco]);
  });

  it('the +3000 lasts this turn only: gone when the opponent ends their turn', () => {
    const g = hit(L13.luffy, [V13.ace]);
    activateTrigger(g);
    pickInst(g, [at(g, 'p1', 'characters', V13.ace)]);
    expect(g.power(at(g, 'p1', 'characters', V13.ace))).toBe(9000);
    if (kind(g) !== 'main') throw new Error(`unexpected ${kind(g)}`);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.power(at(g, 'p1', 'characters', V13.ace))).toBe(6000);
  });

  it('the Counter value from hand is +2000: a 6000 attacker no longer hits my 5000 Leader', () => {
    const g = theirs(L13.luffy, { hand: [ROUGE] }, { characters: [V13.hajrudin] });
    attack(g, at(g, 'p2', 'characters', V13.hajrudin), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    useCounter(g, at(g, 'p1', 'hand', ROUGE), g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(7000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(cardIds(g, 'p1', 'trash')).toEqual([ROUGE]);
  });
});
