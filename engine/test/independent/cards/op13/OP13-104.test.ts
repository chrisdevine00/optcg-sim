/**
 * OP13-104 Kouzuki Hiyori (Character, Yellow, cost 4, 0 power, Counter +1000, {Land of Wano}/{Kouzuki Clan}, [Blocker]).
 *
 * Card text: "[Blocker] [On K.O.] You may trash 1 card from your hand: If your Leader is multicolored,
 * add up to 1 card from the top of your deck to the top of your Life cards."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 10-2-17 ([On K.O.]), CR 8-3-1 / 8-3-1-3 (cost), CR 8-3-3
 * (failed "if"), CR 8-4-4-1 ("up to"), CR 3-10-2 (Life cards go in face-down). Multicolored Leader:
 * EB04-001 Jewelry Bonney (Red/Yellow); single-colored: ST09-001 Yamato (Yellow).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  atMain,
  attack,
  BLUE,
  blockers,
  bounceAim,
  chars,
  choices,
  deck,
  deckWith,
  doneRaw,
  hand,
  hitRested,
  kind,
  koAim,
  LD13,
  lifeCards,
  lifeFaces,
  need,
  no,
  payHandRaw,
  SC15,
  theirsWith,
  trash,
  unusable,
  yes,
} from './kit-op13d.ts';

const ID = 'OP13-104';
const F1 = SC15.red2;
const F2 = SC15.red3;
const TOP = 'OP13-085';

function koed(o: { leader?: string; hand?: string[]; life?: number } = {}): TestGame {
  const g = theirsWith(
    o.leader ?? LD13.eggMulti,
    {
      characters: [{ card: ID, rested: true }],
      hand: o.hand ?? [F1, F2],
      deck: deckWith([TOP], 10),
      life: Array.from({ length: o.life ?? 4 }, () => BLUE),
    },
    {},
  );
  hitRested(g, at(g, 'p1', 'characters', ID));
  return g;
}

/** Answer yes and pay `F1`; whatever deck-to-Life question follows is left pending. */
function pay(g: TestGame): void {
  need(g, 'optional', 'p1');
  yes(g);
  payHandRaw(g, [F1]);
}

/** The "add up to 1 card from the top of your deck" step: the engine asks it as a yes/no; say yes. */
function addTop(g: TestGame): void {
  need(g, 'optional', 'p1');
  yes(g);
}

describe('OP13-104 Kouzuki Hiyori: [Blocker]; [On K.O.] may trash 1: if my Leader is multicolored, add up to 1 card from the top of my deck to my Life', () => {
  it('has [Blocker] and is the only blocker offered against an attack', () => {
    const g = theirsWith(LD13.eggMulti, { characters: [ID] }, {});
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
  });

  it('K.O.’d in battle with a multicolored Leader: asked to pay, then the top deck card goes on top of my Life', () => {
    const g = koed();
    pay(g);
    addTop(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.life('p1')).toBe(5);
    expect(lifeCards(g)[0]).toBe(TOP);
    expect(lifeFaces(g)[0]).toBe(false);
    expect(deck(g)).toHaveLength(10);
    expect(trash(g)).toEqual([ID, F1].sort());
    expect(hand(g)).toEqual([F2]);
  });

  it('a single-colored Leader: the card is trashed as the cost but no Life card is added', () => {
    const g = koed({ leader: LD13.yellow });
    pay(g);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      doneRaw(g);
    }
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(11);
    expect(trash(g)).toEqual([ID, F1].sort());
  });

  it('declining the cost: nothing is trashed and no Life card is added', () => {
    const g = koed();
    need(g, 'optional', 'p1');
    no(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([F1, F2].sort());
    expect(trash(g)).toEqual([ID]);
  });

  it('CR 8-3-1-3: with an empty hand the cost cannot be paid', () => {
    const g = koed({ hand: [] });
    unusable(g, 'p1');
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(11);
  });

  it('"up to 1": after paying, adding nothing is legal; the paid card stays trashed', () => {
    const g = koed();
    pay(g);
    // "up to 1" from the top of the deck: the engine asks it as a yes/no; "no" adds nothing.
    need(g, 'optional', 'p1');
    no(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(11);
    expect(trash(g)).toEqual([ID, F1].sort());
  });

  it('K.O.’d by an opposing effect it works the same way (Life 5 afterwards)', () => {
    const g = theirsWith(
      LD13.eggMulti,
      {
        characters: [ID],
        hand: [F1, F2],
        deck: deckWith([TOP], 10),
        life: [BLUE, BLUE, BLUE, BLUE],
      },
      {},
    );
    koAim(g, at(g, 'p1', 'characters', ID));
    pay(g);
    addTop(g);
    expect(g.life('p1')).toBe(5);
    expect(lifeCards(g)[0]).toBe(TOP);
  });

  it('returned to the hand is not a K.O.: no [On K.O.] question', () => {
    const g = theirsWith(
      LD13.eggMulti,
      { characters: [ID], hand: [F1, F2], deck: deckWith([TOP], 10) },
      {},
    );
    bounceAim(g, at(g, 'p1', 'characters', ID));
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([F1, F2, ID].sort());
    expect(g.life('p1')).toBe(4);
  });

  it('the added card comes from my deck, not the opponent’s, and my deck shrinks by exactly 1', () => {
    const g = koed();
    pay(g);
    addTop(g);
    expect(g.zone('p2', 'deck').length).toBe(15);
    expect(deck(g)).toHaveLength(10);
  });
});
