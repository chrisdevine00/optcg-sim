/**
 * OP12-091 Poker (Character, Black, cost 3, 4000, Counter +1000, {Animal Kingdom Pirates}/{SMILE}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] You may place 3 cards from your trash at the bottom of
 * your deck in any order: Up to 2 of your "SMILE" type Characters gain +2000 power during this turn."
 *
 * Rules: CR 8-3-1-4 ("you may" cost), CR 4-8-1 ("up to" allows 0), CR 10-2-12 ([Once Per Turn] is spent
 * when the effect is activated), CR 6-6-1-3 ("during this turn"). Poker itself is a SMILE Character.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  canFinish,
  decision,
  deck,
  isMain,
  kind,
  LDR,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickCards,
  payHand,
  SC3,
  SCN,
  settleOrders,
  trash,
  unusable,
  useAbility,
  yes,
} from './kit-op12c.ts';

const ID = 'OP12-091';
const TRASH = [SCN.c1, SCN.c2, SCN.c3, SCN.c4];

function board(trashCards: string[] = TRASH, chars: string[] = [SC3.smile3, SCN.c5]) {
  return mine(LDR.ra, { characters: [ID, ...chars], trash: trashCards });
}

/** Activate and pay with the first three trash cards, as far as the engine asks. */
function activateAndPay(g: ReturnType<typeof board>, pay: string[] = [SCN.c1, SCN.c2, SCN.c3]) {
  useAbility(g, at(g, 'p1', 'characters', ID));
  if (kind(g) === 'optional') yes(g);
  need(g, 'choose', 'p1');
  if (decision(g)?.purpose === 'cost') payHand(g, pay);
  settleOrders(g);
}

describe('OP12-091 Poker: [Activate: Main] [Once Per Turn] place 3 from the trash at the bottom: up to 2 SMILE +2000', () => {
  it('is offered with 3 or more cards in the trash', () => {
    const g = board();
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toHaveLength(1);
  });

  it('paying: exactly the chosen 3 trash cards go to the bottom of the deck, the 4th stays in the trash', () => {
    const g = board();
    activateAndPay(g);
    expect(trash(g)).toEqual([SCN.c4]);
    expect(deck(g)).toHaveLength(18);
    expect(deck(g).slice(-3).sort()).toEqual([SCN.c1, SCN.c2, SCN.c3].sort());
  });

  it('candidates: my SMILE Characters, Poker himself included; non-SMILE and opposing SMILE are not offered', () => {
    const g = mine(
      LDR.ra,
      { characters: [ID, SC3.smile3, SCN.c5], trash: TRASH },
      { characters: [SC3.smile5] },
    );
    activateAndPay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ID, SC3.smile3].sort());
  });

  it('two SMILE Characters each gain +2000 power this turn', () => {
    const g = board();
    activateAndPay(g);
    pickCards(g, [ID, SC3.smile3]);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(6000);
    expect(g.power(at(g, 'p1', 'characters', SC3.smile3))).toBe(7000);
    expect(g.power(at(g, 'p1', 'characters', SCN.c5))).toBe(7000);
    expect(atMain(g)).toBe(true);
  });

  it('"up to 2": one is enough, and a third is never possible', () => {
    const g = mine(LDR.ra, {
      characters: [ID, SC3.smile3, SC3.smile5],
      trash: TRASH,
    });
    activateAndPay(g);
    need(g, 'choose', 'p1');
    expect(decision(g)?.max).toBe(2);
    pickCards(g, [SC3.smile5]);
    expect(g.power(at(g, 'p1', 'characters', SC3.smile5))).toBe(9000);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(4000);
  });

  it('"up to": the targets may be skipped after the cost is paid', () => {
    const g = board();
    activateAndPay(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    none(g);
    expect(trash(g)).toEqual([SCN.c4]);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(4000);
  });

  it('the cost is exactly 3 cards from the trash (any cards): not fewer, not more', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', ID));
    if (kind(g) === 'optional') yes(g);
    need(g, 'choose', 'p1');
    expect(decision(g)?.purpose).toBe('cost');
    expect(decision(g)?.min).toBe(3);
    expect(decision(g)?.max).toBe(3);
    expect(canFinish(g)).toBe(false);
  });

  it('not activating costs nothing: the trash and the deck are untouched', () => {
    const g = board();
    expect(trash(g)).toHaveLength(4);
    expect(deck(g)).toHaveLength(15);
    expect(isMain(g)).toBe(true);
  });

  it('with only 2 cards in the trash the cost cannot be paid', () => {
    const g = board([SCN.c1, SCN.c2]);
    const abilities = offeredAbilities(g, at(g, 'p1', 'characters', ID));
    if (abilities.length) {
      act(g, { type: 'activate', card: at(g, 'p1', 'characters', ID), ability: abilities[0]! });
      unusable(g, 'p1');
    }
    expect(trash(g)).toHaveLength(2);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(4000);
    expect(isMain(g)).toBe(true);
  });

  it('[Once Per Turn]: after one use the ability is not offered again this turn', () => {
    const g = board([...TRASH, SCN.c5, SCN.c6, SCN.c7]);
    activateAndPay(g);
    pickCards(g, [ID]);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('the +2000 is gone at the start of the next turn', () => {
    const g = board();
    activateAndPay(g);
    pickCards(g, [ID]);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(6000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(4000);
  });
});
