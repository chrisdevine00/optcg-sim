/**
 * ST20-002 Charlotte Cracker (Yellow Character, cost 4, 5000, Counter +1000, {Big Mom Pirates}).
 * "[Once Per Turn] If this Character would be K.O.'d by an effect, you may trash 1 card from the top
 * of your Life cards instead.
 * [Trigger] You may trash 1 card from your hand: Play this card."
 * Rules: a replacement applies only to the event it names (a K.O. by an EFFECT, not by battle), is
 * optional ("you may"), is once per turn, cannot be applied when impossible (no Life cards, CR 8-1-3-4-5),
 * and a Life card trashed by an effect does not activate its [Trigger].
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  BLUE,
  hand,
  inst,
  kind,
  LD,
  many,
  need,
  no,
  legalFor,
  opponentKOs,
  SC,
  theirs,
  theyKo,
  trash,
  yes,
  activateTrigger,
  hitLeader,
  payHand,
} from './kit-st1821a.ts';

const ID = 'ST20-002';
const LIGHTNING = 'OP09-077'; // p2's K.O. effect: DON!! -2: K.O. up to 1 Character with 6000 power or less

/** p2's Main Phase: p2 holds `n` Gum-Gum Lightning (K.O. effect); p1 has Cracker and these extras. */
function pos(n = 1, chars: string[] = [ID], life: string[] = many(BLUE, 4)) {
  return theirs(LD.yamato, { characters: chars, life }, { hand: many(LIGHTNING, n) });
}

describe('ST20-002 Charlotte Cracker: replace an effect K.O. by trashing the top Life card', () => {
  it('an opponent K.O. effect asks me; accepting trashes my top Life card and Cracker stays', () => {
    const g = pos();
    const top = g.zone('p1', 'life')[0]!.instance;
    opponentKOs(g, inst(g, 'p1', 'characters', ID));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(g.life('p1')).toBe(3);
    expect(g.zone('p1', 'life').map((c) => c.instance)).not.toContain(top);
    expect(trash(g)).toEqual([BLUE]);
  });

  it('declining the replacement: Cracker is K.O.d and my Life is unchanged', () => {
    const g = pos();
    opponentKOs(g, inst(g, 'p1', 'characters', ID));
    no(g, 'p1');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g)).toEqual([ID]);
    expect(g.life('p1')).toBe(4);
  });

  it('Once Per Turn: a second K.O. effect in the same turn is not replaced', () => {
    const g = pos(2);
    opponentKOs(g, inst(g, 'p1', 'characters', ID));
    yes(g, 'p1');
    expect(atMain(g, 'p2')).toBe(true);
    opponentKOs(g, inst(g, 'p1', 'characters', ID));
    expect(kind(g)).not.toBe('optional');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g)).toEqual([BLUE, ID].sort());
    expect(g.life('p1')).toBe(3);
  });

  it('a battle K.O. is not replaced: no question, Cracker goes to the trash', () => {
    const g = theirs(LD.yamato, { characters: [{ card: ID, rested: true }] });
    theyKo(g, inst(g, 'p1', 'characters', ID));
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g)).toEqual([ID]);
    expect(g.life('p1')).toBe(4);
  });

  it('with no Life cards the replacement cannot be applied: Cracker is K.O.d without a question', () => {
    const g = pos(1, [ID], []);
    opponentKOs(g, inst(g, 'p1', 'characters', ID));
    expect(kind(g)).not.toBe('optional');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g)).toEqual([ID]);
  });

  it('a Life card trashed this way does not activate its [Trigger]', () => {
    const g = pos(1, [ID], [ID, BLUE, BLUE]);
    opponentKOs(g, inst(g, 'p1', 'characters', ID));
    yes(g, 'p1');
    expect(kind(g)).not.toBe('trigger');
    expect(g.life('p1')).toBe(2);
    expect(trash(g)).toEqual([ID]);
  });

  it('it protects only itself: another Character of mine K.O.d by the effect is simply K.O.d', () => {
    const g = pos(1, [ID, SC.c3]);
    opponentKOs(g, inst(g, 'p1', 'characters', SC.c3));
    expect(kind(g)).not.toBe('optional');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(g.life('p1')).toBe(4);
  });
});

describe('ST20-002 Charlotte Cracker: [Trigger] trash 1 card from hand: play this card', () => {
  function hit(handCards: string[]) {
    const g = theirs(LD.yamato, { life: [ID, BLUE, BLUE, BLUE], hand: handCards }, {});
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('paying 1 hand card plays Cracker from the Life card: it is on the field, my hand lost the paid card', () => {
    const g = hit([SC.c3, SC.c4]);
    activateTrigger(g);
    payHand(g, [SC.c3]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(trash(g)).toEqual([SC.c3]);
    expect(hand(g)).toEqual([SC.c4]);
  });

  it('with an empty hand the cost is offered but cannot be accepted; declining adds the card to my hand, it is not played', () => {
    const g = hit([]);
    // The [Trigger] is offered (the hand is hidden) but cannot be activated: only "no" is legal.
    expect(legalFor(g, 'p1', { type: 'trigger', activate: true })).toBe(false);
    expect(legalFor(g, 'p1', { type: 'trigger', activate: false })).toBe(true);
    act(g, { type: 'trigger', activate: false });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g)).toEqual([ID]);
    expect(trash(g)).toEqual([]);
  });
});
