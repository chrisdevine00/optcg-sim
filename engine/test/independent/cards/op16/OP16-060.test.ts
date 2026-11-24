/**
 * OP16-060 Sengoku (Leader, Purple, 5000, 5 Life, {Navy}).
 *
 * Card text: "[Activate: Main] You may return 8 of your active DON!! cards to your DON!! deck: Play up
 * to 3 {Admiral} type Character cards with different card names from your hand."
 *
 * Rules: CR 8-3-1-6 (returning DON!! to the DON!! deck), RL-24 (the DON!! come back through the DON!!
 * Phase), CR 8-3-1-3 (cost all or nothing), CR 2-1-2 (card names), CR 8-4-4-1 ("up to"), CR 4-7 /
 * RD 74 (a card played by an effect pays no cost), CR 3-7-5 (enters active).
 *
 * Scenery: the {Admiral} Characters are OP16-063 Kuzan, OP16-073 Borsalino and OP17-059 Aramaki, all
 * cost 7; their own [On Play] effects fire when played, so those prompts are answered explicitly.
 */
import { describe, expect, it } from 'vitest';
import { takeMost } from '../../helpers.ts';
import {
  abilities,
  at,
  canFinish,
  choices,
  declineChoice,
  decision,
  don,
  hand,
  ID,
  kind,
  mine,
  need,
  no,
  offeredNow,
  payDon,
  pickCards,
  SCN,
  settleOrders,
  theirs,
  useAbility,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const SENGOKU = 'OP16-060';
const KUZAN = 'OP16-063';
const BORSALINO = 'OP16-073';
const ARAMAKI = 'OP17-059';
/** OP16-066 Sengoku: {Navy} but not {Admiral}, cost 5. */
const NAVY_ONLY = 'OP16-066';
/** OP16-076 The Three Admirals!!: an {Admiral} Event, not a Character. */
const ADMIRAL_EVENT = 'OP16-076';

function start(handCards: string[], active = 10, rested = 0): TestGame {
  return mine(SENGOKU, { hand: handCards, costArea: { active, rested } });
}
function activateAndPay(g: TestGame) {
  useAbility(g, g.leader('p1'));
  payDon(g, 8, 'costActive');
}
/** Answer the [On Play] prompts of the played Admirals by name: orders, DON!! counts, and "no" to Aramaki's optional DON!! -1. */
function settleOnPlays(g: TestGame) {
  for (let i = 0; i < 20; i++) {
    const d = decision(g);
    if (!d || d.player !== 'p1') return;
    if (d.kind === 'order') settleOrders(g);
    else if (d.kind === 'optional') no(g, 'p1');
    else if (d.kind === 'choose' && d.purpose === 'mode') takeMost(g);
    else return;
  }
}
const onField = (g: TestGame) =>
  g
    .zone('p1', 'characters')
    .map((c) => c.card)
    .sort();

describe('OP16-060 Sengoku: [Activate: Main] return 8 active DON!!: play up to 3 {Admiral} Characters with different names from hand', () => {
  it('returns 8 active DON!! to the DON!! deck, then offers only {Admiral} Characters of different names', () => {
    const g = start([KUZAN, BORSALINO, ARAMAKI]);
    activateAndPay(g);
    expect(don(g)).toMatchObject({ active: 2, rested: 0, deck: 8 });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([ARAMAKI, BORSALINO, KUZAN].sort());
  });

  it('plays 3 Admirals with 3 different names from hand, paying no cost, and they enter the field', () => {
    const g = start([KUZAN, BORSALINO, ARAMAKI]);
    activateAndPay(g);
    pickCards(g, [KUZAN, BORSALINO, ARAMAKI]);
    settleOnPlays(g);
    expect(onField(g)).toEqual([ARAMAKI, BORSALINO, KUZAN].sort());
    expect(hand(g)).toEqual([]);
    expect(g.zone('p1', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it('a played Admiral’s cost (7) is not paid: playing one leaves the 2 remaining DON!! untouched', () => {
    const g = start([ARAMAKI]);
    activateAndPay(g);
    pickCards(g, [ARAMAKI]);
    settleOnPlays(g);
    expect(onField(g)).toEqual([ARAMAKI]);
    expect(don(g)).toMatchObject({ active: 2, deck: 8 });
  });

  it('"different card names": with two [Kuzan] in hand only one can be played', () => {
    const g = start([KUZAN, KUZAN, BORSALINO]);
    activateAndPay(g);
    need(g, 'choose', 'p1');
    pickCards(g, [KUZAN]);
    if (kind(g) === 'choose') expect(offeredNow(g)).not.toContain(KUZAN);
    if (kind(g) === 'choose' && canFinish(g)) declineChoice(g);
    settleOnPlays(g);
    expect(onField(g).filter((c) => c === KUZAN)).toHaveLength(1);
    expect(hand(g)).toContain(KUZAN);
  });

  it('"up to 3": may play just 1, or none, after paying', () => {
    const g = start([KUZAN, BORSALINO]);
    activateAndPay(g);
    declineChoice(g);
    expect(onField(g)).toEqual([]);
    expect(hand(g)).toEqual([BORSALINO, KUZAN].sort());
    expect(don(g)).toMatchObject({ active: 2, deck: 8 });
  });

  it('only {Admiral} Characters: a {Navy} Character that is not an {Admiral}, an {Admiral} Event and another type are not offered', () => {
    const g = start([KUZAN, NAVY_ONLY, ADMIRAL_EVENT, ID.blugori, SCN.c3]);
    activateAndPay(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([KUZAN]);
  });

  it('cost boundary: with 7 active DON!! the activation cannot be paid', () => {
    const g = start([KUZAN], 7);
    expect(abilities(g, g.leader('p1'))).toEqual([]);
  });

  it('the DON!! must be ACTIVE: 10 DON!! of which 3 are rested (7 active) cannot pay', () => {
    const g = start([KUZAN], 7, 3);
    expect(abilities(g, g.leader('p1'))).toEqual([]);
  });

  it('exactly 8 active DON!! (with 2 rested besides) can pay, and the rested ones stay', () => {
    const g = start([KUZAN], 8, 2);
    expect(abilities(g, g.leader('p1'))).toHaveLength(1);
    activateAndPay(g);
    expect(don(g)).toMatchObject({ active: 0, rested: 2, deck: 8 });
  });

  it('it is an [Activate: Main]: not offered in the opponent’s Main Phase', () => {
    const g = theirs(SENGOKU, { hand: [KUZAN], costArea: { active: 10, rested: 0 } }, {});
    expect(abilities(g, g.leader('p1'))).toEqual([]);
    void at;
    void choices;
  });
});
