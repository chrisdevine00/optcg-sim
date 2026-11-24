/**
 * EB04-054 Bartholomew Kuma (Character, Yellow, cost 7, 7000, Counter +1000, {Revolutionary Army}/{Egghead}).
 *
 * Card text: "[On Play] If you have 2 or less Life cards, add up to 1 card from the top of your deck to
 * the top of your Life cards.
 * [On K.O.] Add up to 1 card from the top of your opponent's Life cards to the owner's hand."
 *
 * Rules: a card added to Life is placed face-down on top (CR 3-10-2). Taking a Life card to the hand
 * with an effect does not activate its [Trigger] (CR 10-1-5). "Up to 1" may be none. [On K.O.]
 * fires on a battle K.O. too.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  chars,
  deck,
  fill,
  hand,
  kind,
  LB,
  mine,
  none,
  passBlock,
  no,
  playRaw,
  theirs,
  trash,
  yes,
  atMain,
  decision,
  act,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-054';
const SAI = 'OP01-012';
const MARCO = 'OP01-023';
/** OP01-104 Speed: Purple, 3000, "[Trigger] Play this card." Used as a Life card with a [Trigger]. */
const TRIGGER_CARD = 'OP01-104';

describe('EB04-054 Kuma: [On Play] with 2 or less Life, add up to 1 card from the top of your deck to your Life', () => {
  function play(life: number): TestGame {
    const g = mine(LB.egghead, {
      hand: [ID],
      life: fill(BLUE, life),
      deck: [SAI, MARCO, ...fill(BLUE, 8)],
    });
    playRaw(g, ID);
    return g;
  }

  /** Answer the "up to 1" question: take the card (a pick) or none, whichever shape the engine asks. */
  function take(g: TestGame): void {
    const d = decision(g);
    if (d?.kind === 'choose') {
      const pick = g.legal().find((a) => a.type === 'pick');
      if (pick) g.act(pick);
      else act(g, { type: 'done' });
    } else if (d?.kind === 'optional') {
      act(g, { type: 'optional', accept: true });
    }
  }

  it('with 2 Life cards the deck top card goes to the top of Life', () => {
    const g = play(2);
    take(g);
    expect(atMain(g)).toBe(true);
    expect(g.life('p1')).toBe(3);
    expect(g.zone('p1', 'life')[0]!.card).toBe(SAI);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(deck(g)).toHaveLength(9);
    expect(deck(g)[0]).toBe(MARCO);
  });

  it('boundary: with 3 Life cards nothing is added', () => {
    const g = play(3);
    expect(kind(g)).toBe('main');
    expect(g.life('p1')).toBe(3);
    expect(deck(g)).toHaveLength(10);
  });

  it('with 0 Life cards it still adds a card', () => {
    const g = play(0);
    take(g);
    expect(g.life('p1')).toBe(1);
    expect(g.zone('p1', 'life')[0]!.card).toBe(SAI);
  });

  it('"up to 1": may add nothing', () => {
    const g = play(2);
    const d = decision(g);
    if (d?.kind === 'choose') none(g);
    else if (d?.kind === 'optional') act(g, { type: 'optional', accept: false });
    expect(g.life('p1')).toBe(2);
    expect(deck(g)).toHaveLength(10);
  });

  it('adds at most 1 card', () => {
    const g = play(1);
    take(g);
    expect(g.life('p1')).toBe(2);
    expect(deck(g)).toHaveLength(9);
  });
});

describe("EB04-054 Kuma: [On K.O.] add up to 1 card from the top of the opponent's Life to its owner's hand", () => {
  it("takes the top Life card of the opponent into the opponent's hand; Kuma (K.O.d by a 9000 attacker) is trashed", () => {
    const g = theirs(
      LB.egghead,
      { characters: [{ card: ID, rested: true }], life: fill(BLUE, 4), deck: fill(BLUE, 10) },
      { characters: ['OP02-020'], life: [SAI, MARCO, BLUE, BLUE] },
    );
    attack(g, at(g, 'p2', 'characters', 'OP02-020'), at(g, 'p1', 'characters', ID));
    passBlock(g);
    g.act({ type: 'endCounter' });
    yes(g, 'p1');
    expect(trash(g)).toEqual([ID]);
    expect(chars(g)).toEqual([]);
    expect(g.life('p2')).toBe(3);
    expect(hand(g, 'p2')).toEqual([SAI]);
  });

  it('a Life card with a [Trigger] does not activate when taken this way', () => {
    const g = theirs(
      LB.egghead,
      { characters: [{ card: ID, rested: true }], life: fill(BLUE, 4), deck: fill(BLUE, 10) },
      { characters: ['OP02-020'], life: [TRIGGER_CARD, BLUE, BLUE] },
    );
    attack(g, at(g, 'p2', 'characters', 'OP02-020'), at(g, 'p1', 'characters', ID));
    passBlock(g);
    g.act({ type: 'endCounter' });
    yes(g, 'p1');
    expect(chars(g, 'p2')).toEqual(['OP02-020']);
    expect(hand(g, 'p2')).toEqual([TRIGGER_CARD]);
  });

  it('"up to 1": may take nothing', () => {
    const g = theirs(
      LB.egghead,
      { characters: [{ card: ID, rested: true }], life: fill(BLUE, 4), deck: fill(BLUE, 10) },
      { characters: ['OP02-020'], life: [SAI, MARCO] },
    );
    attack(g, at(g, 'p2', 'characters', 'OP02-020'), at(g, 'p1', 'characters', ID));
    passBlock(g);
    g.act({ type: 'endCounter' });
    no(g, 'p1');
    expect(g.life('p2')).toBe(2);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('with no Life cards on the opponent side nothing happens', () => {
    const g = theirs(
      LB.egghead,
      { characters: [{ card: ID, rested: true }], life: fill(BLUE, 4), deck: fill(BLUE, 10) },
      { characters: ['OP02-020'], life: [] },
    );
    attack(g, at(g, 'p2', 'characters', 'OP02-020'), at(g, 'p1', 'characters', ID));
    passBlock(g);
    g.act({ type: 'endCounter' });
    if (kind(g) === 'optional') no(g, 'p1');
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('own Life is not touched', () => {
    const g = theirs(
      LB.egghead,
      { characters: [{ card: ID, rested: true }], life: fill(BLUE, 4), deck: fill(BLUE, 10) },
      { characters: ['OP02-020'], life: [SAI, BLUE] },
    );
    attack(g, at(g, 'p2', 'characters', 'OP02-020'), at(g, 'p1', 'characters', ID));
    passBlock(g);
    g.act({ type: 'endCounter' });
    yes(g, 'p1');
    expect(g.life('p1')).toBe(4);
    expect(g.life('p2')).toBe(1);
  });
});
