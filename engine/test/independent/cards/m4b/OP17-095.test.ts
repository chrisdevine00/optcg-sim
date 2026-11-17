/**
 * OP17-095 Roronoa Zoro (Character, Black, cost 2, 2000, Counter +2000, {Straw Hat Crew}/
 * {Elbaph}).
 *
 * Card text:
 *   "If there is a Character with a cost of 12 or more, this Character gains +3000 power.
 *    If one of your Characters would be removed from the field by your opponent's effect, you
 *    may place 3 cards from your trash at the bottom of your deck in any order instead."
 *
 * Rules: CR 8-1-3-4 (replacement effects: "instead", optional "may", declining means it does not
 * resolve, CR 8-1-3-4-1); CR 8-1-3-4-5 (an impossible replacement cannot be applied); CR 10-2-1
 * (K.O. by battle is not an effect, so it is not replaced); the removal source is OP17-098 Kong Gun
 * ("[Main] ... K.O. up to 2 of your opponent's Characters with a cost of 6 or less", needs a cost
 * 12+ Character: the opponent's OP17-089 Saul) played by the opponent.
 */
import { describe, expect, it } from 'vitest';
import { attack, noDefence } from '../../helpers.ts';
import { kind, theirTurn } from '../kit.ts';
import { C, deckCards, drive, FILLER, ids, playCard, side, sorted, V } from './kit-c.ts';

const ID = 'OP17-095';

function game(trash: string[], mine: Parameters<typeof side>[2] = {}) {
  return theirTurn(
    side(C.luffy, FILLER, { characters: [ID, V.sunny], trash, ...mine }),
    side(C.shanks, FILLER, {
      characters: [C.saul],
      hand: [C.elbaphEvent],
      costArea: { active: 7, rested: 0 },
    }),
  );
}

/** p2 plays Kong Gun and chooses `victim`; stops with p1's replacement question (if any) open. */
function vista(g: ReturnType<typeof game>, victim: string) {
  playCard(g, 'p2', C.elbaphEvent);
  drive(g, 'p2', { targets: [g.find('p1', 'characters', victim)], don: 'costActive' });
}

describe('OP17-095 Zoro: +3000 power with a cost 12+ Character', () => {
  it.each([
    ['own Saul', [ID, C.saul], [], 5000],
    ['opponent Saul', [ID], [C.saul], 5000],
    ['no cost 12+', [ID], [], 2000],
  ])('%s → %i', (_n, mine, theirs, power) => {
    const g = theirTurn(
      side(C.luffy, FILLER, { characters: mine as string[] }),
      side(C.shanks, FILLER, { characters: theirs as string[] }),
    );
    expect(g.power(g.find('p1', 'characters', ID))).toBe(power);
  });
});

describe("OP17-095 Zoro: replacement for removal by the opponent's effect", () => {
  it('accepting with exactly 3 cards in the trash: the Character stays and the 3 cards go to the bottom of the deck', () => {
    const g = game([V.sai, V.marco, V.hajrudin]);
    vista(g, V.sunny);
    expect(kind(g)).toBe('optional');
    drive(g, 'p1', { accept: true });
    expect(ids(g, 'p1', 'characters').sort()).toEqual([ID, V.sunny].sort());
    expect(ids(g, 'p1', 'trash')).toEqual([]);
    const deck = deckCards(g, 'p1');
    expect(deck).toHaveLength(18);
    expect(sorted(deck.slice(-3))).toEqual(sorted([V.sai, V.marco, V.hajrudin]));
  });

  it('it protects Zoro himself too', () => {
    const g = game([V.sai, V.marco, V.hajrudin]);
    vista(g, ID);
    drive(g, 'p1', { accept: true });
    expect(ids(g, 'p1', 'characters')).toContain(ID);
    expect(ids(g, 'p1', 'trash')).toEqual([]);
  });

  it('"you may": declining lets the K.O. happen and the trash is untouched', () => {
    const g = game([V.sai, V.marco, V.hajrudin]);
    vista(g, V.sunny);
    drive(g, 'p1', { accept: false });
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(sorted(ids(g, 'p1', 'trash'))).toEqual(sorted([V.sai, V.marco, V.hajrudin, V.sunny]));
    expect(deckCards(g, 'p1')).toHaveLength(15);
  });

  it("CR 8-1-3-4-5: with only 2 cards in the trash the replacement cannot apply: the Character is K.O.'d", () => {
    const g = game([V.sai, V.marco]);
    vista(g, V.sunny);
    drive(g, 'p1', { accept: true });
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(sorted(ids(g, 'p1', 'trash'))).toEqual(sorted([V.sai, V.marco, V.sunny]));
  });

  it('with 5 cards in the trash the owner chooses which 3 go to the bottom', () => {
    const g = game([V.sai, V.marco, V.hajrudin, V.kingdew, V.thatch]);
    vista(g, V.sunny);
    drive(g, 'p1', {
      accept: true,
      targets: [
        g.find('p1', 'trash', V.sai),
        g.find('p1', 'trash', V.marco),
        g.find('p1', 'trash', V.thatch),
      ],
    });
    expect(ids(g, 'p1', 'characters').sort()).toEqual([ID, V.sunny].sort());
    expect(sorted(ids(g, 'p1', 'trash'))).toEqual(sorted([V.hajrudin, V.kingdew]));
    expect(sorted(deckCards(g, 'p1').slice(-3))).toEqual(sorted([V.sai, V.marco, V.thatch]));
  });

  it('K.O. by losing a battle is not "removed by your opponent\'s effect": no replacement is offered', () => {
    const g = theirTurn(
      side(C.luffy, FILLER, {
        characters: [ID, { card: V.sunny, rested: true }],
        trash: [V.sai, V.marco, V.hajrudin],
      }),
      side(C.shanks, FILLER, { characters: [V.kingdew] }),
    );
    attack(g, g.find('p2', 'characters', V.kingdew), g.find('p1', 'characters', V.sunny));
    noDefence(g);
    expect(kind(g)).toBe('main');
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(ids(g, 'p1', 'trash')).toHaveLength(4);
  });

  // DISAGREEMENTS-c.md D-2: the engine asks once for a two-Character K.O. and one payment saves both.
  it.fails(
    'one effect removing two Characters with only 3 cards in the trash: after the first replacement the second is impossible (CR 8-1-3-4-5)',
    () => {
      const g = game([V.sai, V.marco, V.hajrudin]);
      playCard(g, 'p2', C.elbaphEvent);
      drive(g, 'p2', {
        targets: [g.find('p1', 'characters', V.sunny), g.find('p1', 'characters', ID)],
        don: 'costActive',
      });
      drive(g, 'p1', { accept: true });
      // Exactly one of the two stays (its removal was replaced); the other could not be.
      expect(ids(g, 'p1', 'characters')).toHaveLength(1);
      expect(ids(g, 'p1', 'trash')).toHaveLength(1);
      expect(deckCards(g, 'p1')).toHaveLength(18);
    },
  );

  // DISAGREEMENTS-c.md D-2
  it.fails(
    'each Character is its own removal: with 6 cards in the trash both can be saved, paying 3 each',
    () => {
      const g = game([V.sai, V.marco, V.hajrudin, V.kingdew, V.thatch, V.littleOars]);
      playCard(g, 'p2', C.elbaphEvent);
      drive(g, 'p2', {
        targets: [g.find('p1', 'characters', V.sunny), g.find('p1', 'characters', ID)],
        don: 'costActive',
      });
      drive(g, 'p1', { accept: true });
      expect(ids(g, 'p1', 'characters')).toHaveLength(2);
      expect(ids(g, 'p1', 'trash')).toHaveLength(0);
      expect(deckCards(g, 'p1')).toHaveLength(21);
    },
  );
});
