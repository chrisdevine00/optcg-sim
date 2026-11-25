/**
 * OP16-048 Buggy (Character, Blue, cost 5, 6000, Counter +1000, {Buggy Pirates}/{Impel Down}).
 *
 * Card text: "[On Play] If your Leader has the {Impel Down} type, draw 1 card and play up to 1
 * [Prisoner of Impel Down] card from your hand. [Once Per Turn] This effect can be activated when
 * your opponent attacks. Up to 1 of your [Prisoner of Impel Down] cards gains [Blocker] during this
 * turn."
 *
 * Reading: two effects. The [On Play] has the {Impel Down} condition; the second one is a [Once Per
 * Turn] effect that activates when the opponent attacks (like [On Your Opponent's Attack]) and has
 * no Leader condition.
 *
 * Rules: CR 8-3-3, CR 4-10-2, CR 8-4-4-1 ("up to"), CR 10-2-13 ([Once Per Turn]), CR 10-2-16
 * ([On Your Opponent's Attack] activates before the Block Step), CR 6-6-1-3 ("during this turn"),
 * CR 2-1-2 (exact names).
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, passBlock, passCounter } from '../../helpers.ts';
import {
  at,
  backAtMain,
  BLUE,
  choices,
  declineChoice,
  deck,
  don,
  fill,
  hand,
  ID,
  inst,
  kind,
  LDR,
  mine,
  need,
  offeredNow,
  pickInst,
  put,
  SCN,
  theirs,
  endTurn,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import { no, yes } from '../op17/kit-op17b.ts';

const BUGGY = 'OP16-048';
const PRISONER = 'OP16-042';
const DA = 'Blocker';

function playBuggy(leader: string, handCards: string[], top: string[] = [SCN.c2]) {
  const g = mine(leader, { hand: [BUGGY, ...handCards], deck: [...top, ...fill(BLUE, 10)] });
  put(g, BUGGY);
  return g;
}

describe('OP16-048 Buggy: [On Play] {Impel Down} Leader: draw 1, play a [Prisoner of Impel Down]; [Once Per Turn] when the opponent attacks, a [Prisoner of Impel Down] gains [Blocker]', () => {
  it('[On Play] with an {Impel Down} Leader: draws 1, then plays a [Prisoner of Impel Down] from hand', () => {
    const g = playBuggy(LDR.impel, [PRISONER]);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([PRISONER]);
    pickInst(g, [inst(g, 'p1', 'hand', PRISONER)]);
    expect(backAtMain(g)).toBe(true);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([BUGGY, PRISONER].sort());
    expect(hand(g)).toEqual([SCN.c2]);
    expect(deck(g)).toHaveLength(10);
  });

  it('the Prisoner is played by the effect: no cost is paid (only Buggy’s 5)', () => {
    const g = playBuggy(LDR.impel, [PRISONER]);
    pickInst(g, [inst(g, 'p1', 'hand', PRISONER)]);
    expect(don(g)).toMatchObject({ active: 5, rested: 5 });
  });

  it('the card is drawn first: a [Prisoner of Impel Down] drawn by this effect can be the one played', () => {
    const g = playBuggy(LDR.impel, [], [PRISONER]);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([PRISONER]);
    pickInst(g, [inst(g, 'p1', 'hand', PRISONER)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(PRISONER);
    expect(hand(g)).toEqual([]);
  });

  it('only a card named exactly [Prisoner of Impel Down] is offered (not another {Impel Down} Character)', () => {
    const g = playBuggy(LDR.impel, [ID.blugori, PRISONER, SCN.c1]);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([PRISONER]);
  });

  it('"up to 1": may play none; the card is still drawn', () => {
    const g = playBuggy(LDR.impel, [PRISONER]);
    declineChoice(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([BUGGY]);
    expect(hand(g)).toEqual([PRISONER, SCN.c2].sort());
  });

  it('with no [Prisoner of Impel Down] in hand (and none drawn) the card is still drawn', () => {
    const g = playBuggy(LDR.impel, [SCN.c1]);
    if (kind(g) === 'choose') declineChoice(g);
    expect(backAtMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCN.c1, SCN.c2].sort());
  });

  it('a Leader without the {Impel Down} type: no draw and no play', () => {
    const g = playBuggy(LDR.luffy, [PRISONER]);
    expect(backAtMain(g)).toBe(true);
    expect(hand(g)).toEqual([PRISONER]);
    expect(deck(g)).toHaveLength(11);
  });

  function defended(opts: { own?: string[]; p2?: string[]; leader?: string } = {}): TestGame {
    const g = theirs(
      opts.leader ?? LDR.luffy,
      { characters: [BUGGY, PRISONER, ...(opts.own ?? [])] },
      { characters: opts.p2 ?? [SCN.c3] },
    );
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    // "This effect can be activated when ..." is optional (W57-R5, the official Koala Q&A): the use
    // is asked, and these tests use it.
    yes(g, 'p1');
    return g;
  }

  it('when the opponent attacks: a [Prisoner of Impel Down] I choose gains [Blocker] and can block', () => {
    const g = defended();
    need(g, 'choose', 'p1');
    expect(g.card(at(g, 'p1', 'characters', PRISONER)).keywords).not.toContain(DA);
    pickInst(g, [at(g, 'p1', 'characters', PRISONER)]);
    expect(g.card(at(g, 'p1', 'characters', PRISONER)).keywords).toContain(DA);
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', PRISONER)]);
  });

  it('this part has no Leader condition: it works with a Leader that is not {Impel Down}', () => {
    const g = defended({ leader: LDR.dp });
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', PRISONER)]);
    expect(blockers(g)).toContain(at(g, 'p1', 'characters', PRISONER));
  });

  it('only [Prisoner of Impel Down] cards are offered; "up to 1" lets me give it to none', () => {
    const g = defended({ own: [ID.blugori] });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([PRISONER]);
    declineChoice(g);
    expect(blockers(g)).toEqual([]);
  });

  it('[Once Per Turn]: a second attack in the same turn does not offer it again', () => {
    const g = defended({ p2: [SCN.c3, SCN.c4] });
    need(g, 'choose', 'p1');
    declineChoice(g);
    passBlock(g);
    passCounter(g);
    need(g, 'main', 'p2');
    attack(g, inst(g, 'p2', 'characters', SCN.c4), g.leader('p1'));
    expect(kind(g)).toBe('block');
    expect(choices(g)).toEqual([]);
  });

  it('W57-R5: "can be activated" is optional: declining gives no [Blocker] and does not spend the Once Per Turn', () => {
    const g = theirs(
      LDR.luffy,
      { characters: [BUGGY, PRISONER] },
      { characters: [SCN.c3, SCN.c4] },
    );
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    no(g, 'p1');
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([]);
    passBlock(g);
    passCounter(g);
    need(g, 'main', 'p2');
    attack(g, inst(g, 'p2', 'characters', SCN.c4), g.leader('p1'));
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'characters', PRISONER)]);
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', PRISONER)]);
  });

  it('"during this turn": the [Blocker] is gone on my next turn', () => {
    const g = defended();
    pickInst(g, [at(g, 'p1', 'characters', PRISONER)]);
    passBlock(g);
    passCounter(g);
    need(g, 'main', 'p2');
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.card(at(g, 'p1', 'characters', PRISONER)).keywords).not.toContain(DA);
  });

  it('must-not-happen: my own attack does not offer it', () => {
    const g = mine(LDR.luffy, { characters: [BUGGY, PRISONER, SCN.c3] });
    attack(g, at(g, 'p1', 'characters', SCN.c3), g.leader('p2'));
    expect(kind(g)).toBe('block');
    expect(g.card(at(g, 'p1', 'characters', PRISONER)).keywords).not.toContain(DA);
  });
});
