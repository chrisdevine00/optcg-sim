/**
 * OP12-090 Belo Betty (Character, Black, cost 3, 4000, Counter +2000, {Revolutionary Army}).
 *
 * Card text: "[When Attacking] You may trash 2 cards from the top of your deck: Give up to 1 of your
 * opponent's Characters -2 cost during this turn."
 *
 * Rules: CR 8-3-1-4 ("you may" cost), CR 4-8-1 ("up to" allows 0), CR 1-3-6-2 (a cost never reads
 * below 0), CR 6-6-1-3 ("during this turn"). A cost on the top of the deck is paid in order.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  decision,
  deck,
  mayChooseNone,
  mine,
  need,
  no,
  none,
  offeredIds,
  passBlock,
  pickCards,
  SCN,
  topDeck,
  trash,
  unusable,
  yes,
} from './kit-op12c.ts';

const ID = 'OP12-090';

function swing(
  oppChars: string[] = [SCN.c3, SCN.c6],
  deckCards = topDeck([SCN.c1, SCN.c2, SCN.c4]),
) {
  const g = mine(
    'OP07-001',
    { characters: [ID, SCN.c5], deck: deckCards },
    { characters: oppChars },
  );
  attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
  return g;
}

describe('OP12-090 Belo Betty: [When Attacking] may trash 2 from the deck: -2 cost on an opposing Character', () => {
  it('the attack offers the optional cost', () => {
    const g = swing();
    need(g, 'optional', 'p1');
  });

  it('accepting trashes the top 2 cards of the deck, then offers the opposing Characters', () => {
    const g = swing();
    yes(g);
    expect(trash(g)).toEqual([SCN.c1, SCN.c2].sort());
    expect(deck(g)[0]).toBe(SCN.c4);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c3, SCN.c6].sort());
  });

  it('the chosen Character gets -2 cost this turn (3 -> 1, 6 -> 4); the other is unchanged', () => {
    const g = swing();
    yes(g);
    pickCards(g, [SCN.c6]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c6)).cost).toBe(4);
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).cost).toBe(3);
    expect(decision(g)?.kind).toBe('block');
  });

  it('a cost never reads below 0: a cost-1 Character reads 0', () => {
    const g = swing([SCN.c1]);
    yes(g);
    pickCards(g, [SCN.c1]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c1)).cost).toBe(0);
  });

  it('"you may": declining trashes nothing and changes nothing', () => {
    const g = swing();
    no(g);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(13);
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).cost).toBe(3);
    expect(decision(g)?.kind).toBe('block');
  });

  it('"up to 1": after paying, the target may be skipped (the 2 cards stay trashed)', () => {
    const g = swing();
    yes(g);
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(trash(g)).toHaveLength(2);
    expect(g.card(at(g, 'p2', 'characters', SCN.c6)).cost).toBe(6);
  });

  it('the reduction lasts this turn only', () => {
    const g = swing();
    yes(g);
    pickCards(g, [SCN.c6]);
    passBlock(g);
    // Finish the battle and my turn.
    while (decision(g)?.kind !== 'main' || decision(g)?.player !== 'p1') {
      const d = decision(g);
      if (d?.kind === 'counter') act(g, { type: 'endCounter' });
      else if (d?.kind === 'trigger') act(g, { type: 'trigger', activate: false });
      else throw new Error(`unexpected ${d?.kind}`);
    }
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.card(at(g, 'p2', 'characters', SCN.c6)).cost).toBe(6);
  });

  it('with only 1 card in the deck the cost cannot be paid', () => {
    const g = swing([SCN.c3], [SCN.c1]);
    unusable(g, 'p1');
    expect(decision(g)?.kind).toBe('block');
    expect(trash(g)).toEqual([]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).cost).toBe(3);
  });

  it('it also fires when attacking a Character, and only opposing Characters are candidates', () => {
    const g = mine(
      'OP07-001',
      { characters: [ID, SCN.c5], deck: topDeck([SCN.c1, SCN.c2]) },
      { characters: [{ card: SCN.c3, rested: true } as never, SCN.c6] },
    );
    attack(g, at(g, 'p1', 'characters', ID), at(g, 'p2', 'characters', SCN.c3));
    yes(g);
    expect(offeredIds(g)).toEqual([SCN.c3, SCN.c6].sort());
  });
});
