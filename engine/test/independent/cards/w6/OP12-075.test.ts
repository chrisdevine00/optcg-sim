/**
 * OP12-075 Ms. All Sunday (Character, Purple, cost 4, 5000, Counter +1000, {Baroque Works}).
 *
 * Card text: "[On Play] K.O. up to 1 of your opponent's Characters with a cost of 3 or less. Then, your
 * opponent may add 1 DON!! card from their DON!! deck and set it as active." "[Trigger] DON!! −1:
 * Play this card."
 *
 * Rules: "up to 1" lets me choose none (CR 8-4-4-1); an effect with no legal target does nothing and
 * the next clause still resolves (CR 4-10-2, "Then" after a non-failed clause); the opponent chooses
 * for the "may"; DON!! can only be added while their DON!! deck has a card (CR 6-4-1-2 style: nothing
 * is added from an empty deck); a [Trigger] with a DON!! −N cost can be activated only when N DON!!
 * can be returned (CR 10-1-5), and the card is played by the effect. M6b-Q75: with no DON!! left in
 * the DON!! deck only the result is asserted.
 */
import { describe, expect, it } from 'vitest';
import { act, decision } from '../../helpers.ts';
import {
  at,
  atMain,
  attack,
  chars,
  choices,
  don,
  hand,
  kind,
  LW,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  pickCards,
  playRaw,
  theirs,
  trash,
  V13,
  snap,
  mayChooseNone,
} from './kit-w6b.ts';

const SUNDAY = 'OP12-075';

/** p1 plays Ms. All Sunday (Leader ST01-001, 10 active DON!!); p2 has the given Characters and DON!!. */
function play(
  p2Chars: string[],
  p2Don: { active: number; rested: number } = { active: 3, rested: 2 },
) {
  const g = mine(LW.luffy, { hand: [SUNDAY] }, { characters: p2Chars, costArea: p2Don });
  playRaw(g, SUNDAY);
  return g;
}

/** The opponent's "add 1 DON!!" question: answer with the option whose label says Add (or the other). */
function answerAdd(g: ReturnType<typeof play>, add: boolean) {
  const d = need(g, 'choose', 'p2');
  expect(d.purpose).toBe('mode');
  const opt = d.options!.find((o) => (add ? /add 1 don/i.test(o.label) : /not/i.test(o.label)))!;
  act(g, { type: 'pick', choice: { option: opt.id } });
}

describe('OP12-075 Ms. All Sunday: [On Play] K.O. a cost-3-or-less Character, then the opponent may add 1 active DON!!; [Trigger] DON!! −1: play this card', () => {
  it('printed values: cost 4, 5000 power, Counter +1000', () => {
    const g = mine(LW.luffy, { characters: [SUNDAY] });
    const c = g.card(at(g, 'p1', 'characters', SUNDAY));
    expect(c.cost).toBe(4);
    expect(g.power(c.instance)).toBe(5000);
    expect(c.counter).toBe(1000);
  });

  it('K.O.s a Character of cost 3 or less: cost 3 is offered, cost 4 is not', () => {
    const g = play([V13.marco, V13.hajrudin, V13.sai]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V13.sai, V13.marco].sort());
    pickCards(g, [V13.marco]);
    answerAdd(g, false);
    expect(chars(g, 'p2')).toEqual([V13.hajrudin, V13.sai].sort());
    expect(trash(g, 'p2')).toEqual([V13.marco]);
  });

  it('"up to 1": at most one is K.O.\'d, and I may choose none', () => {
    const g = play([V13.marco, V13.sai]);
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    answerAdd(g, false);
    expect(chars(g, 'p2')).toEqual([V13.sai, V13.marco].sort());
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('then the opponent chooses: adding takes 1 DON!! from their DON!! deck as active', () => {
    const g = play([V13.sai]);
    pickCards(g, [V13.sai]);
    const before = don(g, 'p2');
    answerAdd(g, true);
    expect(don(g, 'p2')).toMatchObject({
      active: before.active + 1,
      rested: before.rested,
      deck: before.deck - 1,
    });
    expect(atMain(g, 'p1')).toBe(true);
  });

  it('the opponent may decline: no DON!! is added', () => {
    const g = play([V13.sai]);
    pickCards(g, [V13.sai]);
    const before = don(g, 'p2');
    answerAdd(g, false);
    expect(don(g, 'p2')).toEqual(before);
    expect(atMain(g, 'p1')).toBe(true);
  });

  it('"Then" still resolves when there was nothing to K.O. (no Character of cost 3 or less)', () => {
    const g = play([V13.hajrudin]);
    // No candidate: the pick is empty or skipped; either way the opponent is then asked.
    if (kind(g) === 'choose' && decision(g)?.player === 'p1') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    answerAdd(g, true);
    expect(don(g, 'p2').active).toBe(4);
    expect(chars(g, 'p2')).toEqual([V13.hajrudin]);
  });

  it('with an empty DON!! deck (10 DON!! on their field) nothing can be added', () => {
    const g = play([V13.sai], { active: 5, rested: 5 });
    pickCards(g, [V13.sai]);
    if (kind(g) === 'choose' && decision(g)?.player === 'p2') answerAdd(g, true);
    expect(don(g, 'p2')).toMatchObject({ active: 5, rested: 5, deck: 0 });
    expect(atMain(g, 'p1'), snap(g)).toBe(true);
  });

  it('[Trigger] DON!! −1: Play this card: one DON!! returns to the DON!! deck, the card is played and its [On Play] resolves', () => {
    const g = theirs(
      LW.luffy,
      { life: [SUNDAY, V13.sai, V13.sai], costArea: { active: 3, rested: 0 } },
      { characters: [V13.hajrudin, V13.marco] },
    );
    attack(g, at(g, 'p2', 'characters', V13.hajrudin), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p1');
    act(g, { type: 'trigger', activate: true });
    // Its [On Play] K.O. targets p2's Marco (cost 3); Hajrudin (cost 4) is not offered.
    if (kind(g) === 'choose') {
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toEqual([V13.marco]);
      pickCards(g, [V13.marco]);
    }
    if (kind(g) === 'choose' && decision(g)?.player === 'p2') answerAdd(g, false);
    expect(chars(g, 'p1')).toEqual([SUNDAY]);
    expect(don(g, 'p1')).toMatchObject({ active: 2, deck: 8 });
    expect(chars(g, 'p2')).toEqual([V13.hajrudin]);
    expect(hand(g)).toEqual([]);
  });

  it('[Trigger] cannot be activated with no DON!! to return: the card can only be added to the hand', () => {
    const g = theirs(
      LW.luffy,
      { life: [SUNDAY, V13.sai, V13.sai], costArea: { active: 0, rested: 0 } },
      { characters: [V13.hajrudin] },
    );
    attack(g, at(g, 'p2', 'characters', V13.hajrudin), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p1');
    expect(g.legal().some((a) => a.type === 'trigger' && a.activate)).toBe(false);
    act(g, { type: 'trigger', activate: false });
    expect(hand(g)).toEqual([SUNDAY]);
    expect(chars(g, 'p1')).toEqual([]);
  });

  it('a [Trigger] with a DON!! −1 cost needs only 1 DON!!: rested DON!! count too', () => {
    const g = theirs(
      LW.luffy,
      { life: [SUNDAY, V13.sai, V13.sai], costArea: { active: 0, rested: 1 } },
      { characters: [V13.hajrudin] },
    );
    attack(g, at(g, 'p2', 'characters', V13.hajrudin), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p1');
    act(g, { type: 'trigger', activate: true });
    if (kind(g) === 'choose' && decision(g)?.player === 'p1') none(g);
    if (kind(g) === 'choose' && decision(g)?.player === 'p2') answerAdd(g, false);
    expect(chars(g, 'p1')).toEqual([SUNDAY]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 0, deck: 10 });
  });
});
