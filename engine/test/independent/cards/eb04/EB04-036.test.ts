/**
 * EB04-036 Foxy (Character, Purple, cost 8, 9000, no Counter, {Foxy Pirates}).
 *
 * Card text: "[On Play] DON!! −1: If your Leader has the {Foxy Pirates} type, draw 2 cards and trash 1
 * card from your hand. Then, rest up to 1 of your opponent's Characters with a cost of 9 or less.
 * [Activate: Main] [Once Per Turn] Add up to 1 DON!! card from your DON!! deck and rest it."
 *
 * Rules: DON!! −1 is an optional cost paid before the "If". A "Then" after a failed "If" does not
 * resolve (M4b-5). "Add up to 1 DON!!" asks a count; the added DON!! is rested.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  BLUE,
  chars,
  decision,
  donCost,
  donDeckN,
  donTotal,
  fill,
  hand,
  isRestedInst,
  kind,
  LB,
  mine,
  need,
  no,
  none,
  offeredAbilities,
  offeredIds,
  payDonAny,
  pickRaw,
  playRaw,
  trash,
  useAbility,
  yes,
  atMain,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-036';
const SAI = 'OP01-012'; // Red, cost 2, 4000
const HAJ = 'OP01-018'; // Red, cost 4, 6000
const MIHAWK = 'OP01-070'; // Blue, cost 9, 9000
const XEBEC = 'OP17-118'; // cost 10, 12000

function play(leader: string = LB.foxy, foes: string[] = [HAJ]): TestGame {
  const g = mine(
    leader,
    { hand: [ID, BLUE], deck: [SAI, HAJ, ...fill(BLUE, 10)] },
    { characters: foes },
  );
  playRaw(g, ID);
  return g;
}

/** Pay DON!! −1 (yes, then the DON!! pick). */
function pay(g: TestGame): void {
  yes(g);
  payDonAny(g, 1);
}

describe('EB04-036 Foxy: [On Play] DON!! -1, Foxy Pirates Leader: draw 2, trash 1, then rest a Character (cost 9 or less)', () => {
  it('draws 2, trashes 1 card of the hand, and rests the chosen Character', () => {
    const g = play();
    pay(g);
    need(g, 'choose', 'p1');
    // hand now: Mohji, Sai, Hajrudin (Foxy itself was played)
    expect(offeredIds(g)).toEqual([BLUE, HAJ, SAI].sort());
    pickRaw(g, g.find('p1', 'hand', SAI));
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p2', 'characters', HAJ));
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([BLUE, HAJ].sort());
    expect(trash(g)).toEqual([SAI]);
    expect(isRestedInst(g, at(g, 'p2', 'characters', HAJ))).toBe(true);
  });

  it('cost boundary: a cost-9 Character is offered for resting, a cost-10 one is not', () => {
    const g = play(LB.foxy, [MIHAWK, XEBEC, HAJ]);
    pay(g);
    pickRaw(g, g.find('p1', 'hand', SAI));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HAJ, MIHAWK].sort());
  });

  it('"rest up to 1": may rest nothing', () => {
    const g = play();
    pay(g);
    pickRaw(g, g.find('p1', 'hand', SAI));
    need(g, 'choose', 'p1');
    none(g);
    expect(isRestedInst(g, at(g, 'p2', 'characters', HAJ))).toBe(false);
    expect(hand(g)).toHaveLength(2);
  });

  it('declining DON!! −1: no draw, no trash, nothing rested, no DON!! returned', () => {
    const g = play();
    const dons = donTotal(g);
    no(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([BLUE]);
    expect(isRestedInst(g, at(g, 'p2', 'characters', HAJ))).toBe(false);
    expect(donTotal(g)).toBe(dons);
  });

  it('paying DON!! −1 returns one DON!! to the DON!! deck', () => {
    const g = play();
    const dons = donTotal(g);
    const deckN = donDeckN(g);
    pay(g);
    pickRaw(g, g.find('p1', 'hand', SAI));
    none(g);
    expect(donTotal(g)).toBe(dons - 1);
    expect(donDeckN(g)).toBe(deckN + 1);
  });

  it('without a {Foxy Pirates} Leader nothing is drawn, trashed or rested (the "Then" does not resolve)', () => {
    const g = play(LB.neutral);
    if (kind(g) === 'optional') pay(g);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([BLUE]);
    expect(trash(g)).toEqual([]);
    expect(isRestedInst(g, at(g, 'p2', 'characters', HAJ))).toBe(false);
  });

  it('the trash is a forced choice: exactly one card is trashed from a hand of three', () => {
    const g = play();
    pay(g);
    pickRaw(g, g.find('p1', 'hand', BLUE));
    expect(kind(g)).toBe('choose');
    expect(trash(g)).toEqual([BLUE]);
  });

  it('Foxy stays on the field after its [On Play]', () => {
    const g = play();
    pay(g);
    pickRaw(g, g.find('p1', 'hand', SAI));
    none(g);
    expect(chars(g)).toEqual([ID]);
  });
});

describe('EB04-036 Foxy: [Activate: Main][Once Per Turn] add up to 1 DON!! and rest it', () => {
  function onField(donDeck?: number): TestGame {
    return mine(
      LB.foxy,
      {
        characters: [ID],
        deck: fill(BLUE, 10),
        costArea: { active: donDeck === 0 ? 10 : 5, rested: 0 },
        donDeck,
      },
      {},
    );
  }

  it('adds 1 DON!! from the DON!! deck, rested', () => {
    const g = onField();
    const [a, r] = donCost(g);
    const f = at(g, 'p1', 'characters', ID);
    useAbility(g, f);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: { option: '1' } });
    expect(donCost(g)).toEqual([a, r + 1]);
  });

  it('"up to 1": may add none', () => {
    const g = onField();
    const dons = donTotal(g);
    useAbility(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: { option: '0' } });
    expect(donTotal(g)).toBe(dons);
  });

  it('[Once Per Turn]: it is not offered again after use', () => {
    const g = onField();
    const f = at(g, 'p1', 'characters', ID);
    useAbility(g, f);
    act(g, { type: 'pick', choice: { option: '1' } });
    expect(atMain(g)).toBe(true);
    expect(offeredAbilities(g, f)).toEqual([]);
  });

  it('with the DON!! deck empty nothing can be added', () => {
    const g = onField(0);
    const dons = donTotal(g);
    const f = at(g, 'p1', 'characters', ID);
    if (offeredAbilities(g, f).length) {
      useAbility(g, f);
      if (decision(g)?.kind === 'choose') act(g, { type: 'pick', choice: { option: '0' } });
    }
    expect(donTotal(g)).toBe(dons);
  });
});
