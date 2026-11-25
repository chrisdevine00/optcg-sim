/**
 * OP10-116 Damned Punk (Event, Yellow, cost 4, {Kid Pirates}/{Supernovas}).
 *
 * Card text: "[Main] Look at up to 1 card from the top of your or your opponent's Life cards and
 * place it at the top or bottom of the Life cards. Then, K.O. up to 1 of your opponent's
 * Characters with a cost of 5 or less.
 * [Trigger] Draw 2 cards and trash 1 card from your hand."
 *
 * Rules: rules-digest 108 (a looked-at Life card returns to its owner's Life), CR 4-8-1 ("up to"),
 * CR 2-7-3 (an Event is trashed after use), CR 10-1-5 (a [Trigger] is activated instead of adding the
 * card to the hand; the Event then goes to the trash), only the opponent's Characters are targets.
 * Open: whether "Then, K.O." resolves after the look was skipped ("up to 1" chosen as none) is not
 * asserted, and neither is the face state of the placed card (M6b-Q81).
 * Scenery (printed): OP01-010 (cost 1) / OP01-012 (2) / OP01-023 (3) / OP01-018 (4) / OP02-006 (5) /
 * OP02-007 (6) vanilla Red Characters; ST03-001 Crocodile, ST01-001 Luffy (Leaders, 5000).
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import { decision, isLegal, noDefence } from '../../helpers.ts';
import { myTurn, side, theirTurn } from '../kit.ts';
import {
  anomalies,
  BLUE,
  donTotal,
  handOf,
  L7,
  lifeOf,
  mayEnd,
  need,
  none,
  offeredIds,
  ofZone,
  optionIds,
  pickCards,
  pickOption,
  put,
  RED,
  S7,
} from './kit-w7a.ts';

const ID = 'OP10-116';
const [A, B, C] = [S7.c1, S7.c2, S7.c3];

function start(o: Partial<PlayerSpec> = {}, opp: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(L7.luffy, BLUE, {
      hand: [ID],
      life: [A, B, C],
      costArea: { active: 4, rested: 0 },
      ...o,
    }),
    side(L7.crocodile, RED, {
      life: [S7.c4, S7.c5, S7.c6],
      characters: [S7.c4, S7.c5, S7.c6],
      ...opp,
    }),
  );
}

/** Play the Event and answer the look: `whose` Life, then `end`. Leaves the K.O. pick. */
function look(g: ReturnType<typeof start>, whose: 'you' | 'opponent', end: 'top' | 'bottom') {
  put(g, ID);
  need(g, 'choose', 'p1');
  pickOption(g, whose);
  pickOption(g, end);
}

describe('OP10-116 Damned Punk: [Main] look at 1 Life card and place it top or bottom; then K.O. an opposing Character (cost 5 or less)', () => {
  it("printed effect: my top Life card goes to the bottom, then the chosen cost-5 Character is K.O.'d", () => {
    const g = start();
    look(g, 'you', 'bottom');
    need(g, 'choose', 'p1');
    pickCards(g, [S7.c5]);
    expect(decision(g)?.kind).toBe('main');
    expect(lifeOf(g, 'p1')).toEqual([B, C, A]);
    expect(lifeOf(g, 'p2')).toEqual([S7.c4, S7.c5, S7.c6]);
    expect(ofZone(g, 'p2', 'characters')).toEqual([S7.c4, S7.c6].sort());
    expect(ofZone(g, 'p2', 'trash')).toEqual([S7.c5]);
    expect(anomalies(g)).toBe(0);
  });

  it('the Event is trashed after use and its cost of 4 DON!! is rested', () => {
    const g = start();
    look(g, 'you', 'top');
    pickCards(g, [S7.c4]);
    expect(donTotal(g, 'p1')).toBe(4);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(ofZone(g, 'p1', 'trash')).toEqual([ID]);
    expect(ofZone(g, 'p1', 'hand')).toEqual([]);
    expect(g.zone('p1', 'life')).toHaveLength(3);
  });

  it("the opponent's Life card goes to the bottom of the OPPONENT's Life", () => {
    const g = start();
    look(g, 'opponent', 'bottom');
    pickCards(g, [S7.c4]);
    expect(lifeOf(g, 'p2')).toEqual([S7.c5, S7.c6, S7.c4]);
    expect(lifeOf(g, 'p1')).toEqual([A, B, C]);
  });

  it('"top" leaves the Life area as it was', () => {
    const g = start();
    look(g, 'you', 'top');
    pickCards(g, [S7.c4]);
    expect(lifeOf(g, 'p1')).toEqual([A, B, C]);
  });

  it('the K.O. is limited to cost 5: the cost-5 Character is offered, the cost-6 one is not', () => {
    const g = start();
    look(g, 'you', 'top');
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([S7.c4, S7.c5].sort());
  });

  it('"up to 1" for the K.O.: none chosen, nobody is K.O.\'d, the look has happened', () => {
    const g = start();
    look(g, 'you', 'bottom');
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    none(g);
    expect(decision(g)?.kind).toBe('main');
    expect(g.zone('p2', 'characters')).toHaveLength(3);
    expect(lifeOf(g, 'p1')).toEqual([B, C, A]);
  });

  it('"up to 1" for the look: choosing none leaves both Life areas unchanged', () => {
    const g = start();
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(optionIds(g)).toContain('none');
    pickOption(g, 'none');
    // Whether the K.O. is still offered is not settled by the rules on file; settle it if asked.
    while (decision(g)?.kind === 'choose') none(g);
    expect(lifeOf(g, 'p1')).toEqual([A, B, C]);
    expect(lifeOf(g, 'p2')).toEqual([S7.c4, S7.c5, S7.c6]);
  });

  it('my own Characters are never K.O. targets', () => {
    const g = start({ characters: [S7.c1] }, { characters: [S7.c5] });
    look(g, 'you', 'top');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S7.c5]);
  });

  it('a Life card with a [Trigger] that is looked at does not activate it', () => {
    const g = start({ life: [S7.speed, B, C] });
    look(g, 'you', 'bottom');
    pickCards(g, [S7.c4]);
    expect(lifeOf(g, 'p1')).toEqual([B, C, S7.speed]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
    expect(handOf(g, 'p1')).toEqual([]);
  });

  it('the Event needs its cost: with 3 active DON!! it cannot be played', () => {
    const g = start({ costArea: { active: 3, rested: 0 } });
    expect(isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', ID) })).toBe(false);
  });

  it('what is asked before the K.O. is the same whichever cards are in the Life areas', () => {
    const shape = (mine: CardId[], theirs: CardId[]) => {
      const g = start({ life: mine }, { life: theirs });
      put(g, ID);
      const a = [decision(g)?.kind, decision(g)?.prompt, optionIds(g)];
      pickOption(g, 'you');
      const b = [decision(g)?.kind, decision(g)?.prompt, optionIds(g)];
      return [a, b];
    };
    expect(shape([A, B, C], [S7.c4, S7.c5, S7.c6])).toEqual(
      shape([S7.speed, S7.c7, S7.c2], [S7.c1, S7.c3, S7.c4]),
    );
  });
});

describe('OP10-116 Damned Punk: [Trigger] draw 2 cards and trash 1 card from your hand', () => {
  /** p2's Leader hits my Leader; my top Life card is the Event; I stop at the [Trigger] decision. */
  function struck(hand: CardId[] = [S7.c7]) {
    const g = theirTurn(
      side(L7.luffy, BLUE, { life: [ID, B, C], hand }),
      side(L7.crocodile, RED, {}),
    );
    g.act({ type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    noDefence(g);
    return g;
  }

  it('activating draws 2, then I trash 1 card of my choice from the hand (the drawn cards included)', () => {
    const g = struck();
    need(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    // Hand: the card I held and the 2 drawn; one must go.
    expect(g.zone('p1', 'hand')).toHaveLength(3);
    expect(offeredIds(g)).toContain(S7.c7);
    pickCards(g, [S7.c7]);
    expect(g.zone('p1', 'hand')).toHaveLength(2);
    expect(ofZone(g, 'p1', 'trash').sort()).toEqual([ID, S7.c7].sort());
    expect(g.life('p1')).toBe(2);
    expect(anomalies(g)).toBe(0);
  });

  it('with an empty hand the 2 drawn cards are the only candidates: draw 2, trash 1, end with 1', () => {
    const g = struck([]);
    g.act({ type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    expect(g.zone('p1', 'hand')).toHaveLength(2);
    expect(offeredIds(g)).toHaveLength(2);
    pickCards(g, [offeredIds(g)[0]!]);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(g.zone('p1', 'deck')).toHaveLength(13);
  });

  it('declining the [Trigger]: the Event card is added to my hand and nothing is drawn', () => {
    const g = struck();
    need(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: false });
    expect(handOf(g, 'p1')).toEqual([ID, S7.c7].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(15);
  });

  it('the [Trigger] does not look at Life or K.O. anything', () => {
    const g = struck();
    g.act({ type: 'trigger', activate: true });
    pickCards(g, [S7.c7]);
    expect(lifeOf(g, 'p1')).toEqual([B, C]);
    expect(decision(g)?.kind).not.toBe('choose');
  });
});
