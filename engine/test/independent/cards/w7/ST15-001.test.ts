/**
 * ST15-001 Atmos (Character, Red, cost 4, 5000, Counter +1000, <Slash>, {Whitebeard Pirates}).
 *
 * Card text: "[When Attacking] If your Leader is [Edward.Newgate], you cannot add Life cards to your
 * hand using your own effects during this turn."
 *
 * Rules used: "If" before the effect text of a timing is a condition checked when the timing
 * resolves (name of the Leader, [Edward.Newgate] only); the restriction lasts the rest of the turn
 * and covers my own effects only (damage is not an effect); a cost that adds a Life card to the hand
 * is part of the effect only under one reading (M6b-Q77), so no test asserts whether such a cost can
 * be paid after the attack (the Kid control tests are before the attack or without the restriction).
 *
 * Scenery: OP02-001 Edward.Newgate (Leader, 6000, unscripted: inert); OP09-075 Eustass"Captain"Kid
 * ([On Play] You may add 1 card from the top of your Life cards to your hand: If your Leader has the
 * "Kid Pirates" type, add up to 1 DON!! ...); OP15-115 Impact Dial (Event, cost 2: [Main] K.O. up to
 * 1 of your opponent's Characters with a cost of 4 or less. Then, add 1 card from the top of your
 * Life cards to your hand.).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, cardIds } from '../../helpers.ts';
import { accept, choices, kind } from '../kit.ts';
import { canAccept, canDone, declineTriggers, done, mine7, need, now, S7 } from './kit-w7b.ts';

const ATMOS = 'ST15-001';
const NEWGATE = S7.newgate; // OP02-001, 6000 power, named Edward.Newgate
const KID = S7.kid5000; // OP09-075
const DIAL = 'OP15-115';
const LIFE = ['OP01-023', 'OP01-012', 'OP01-010', 'OP01-018']; // 4 Life cards

/** p1's Main Phase with Atmos ready to attack a rested enemy Character; `hand` as given. */
function game(leader: string, hand: string[], p2 = {}) {
  return mine7(
    leader,
    { characters: [ATMOS], hand, life: LIFE },
    { characters: [{ card: S7.sai, rested: true }], ...p2 },
  );
}

type G = ReturnType<typeof game>;

function atmosAttacks(g: G, target?: string) {
  attack(g, g.find('p1', 'characters', ATMOS), target ?? g.find('p2', 'characters', S7.sai));
  // [When Attacking] resolves on declaration; then the defender passes.
  act(g, { type: 'block', blocker: null });
  act(g, { type: 'endCounter' });
  declineTriggers(g);
  expect(kind(g), now(g)).toBe('main');
}

/** Play Kid (cost 3); stop at the first decision after paying. */
function playKid(g: G) {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', KID) });
}

/** Play Impact Dial (cost 2): pay, K.O. the rested Sai if it can be chosen. */
function playDial(g: G) {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', DIAL) });
  for (let i = 0; i < 6 && kind(g) === 'choose'; i++) {
    const sai = g.find('p2', 'characters', S7.sai);
    if (choices(g).includes(sai)) {
      act(g, { type: 'pick', choice: sai });
      if (kind(g) === 'choose' && canDone(g)) done(g);
      break;
    }
    const p = g.legal().find((a) => a.type === 'pick');
    if (!p) break;
    g.act(p);
  }
}

describe('ST15-001 Atmos: [When Attacking] with an [Edward.Newgate] Leader, I cannot add Life cards to my hand with my own effects this turn', () => {
  it('printed values: cost 4, 5000 power, Counter +1000', () => {
    const g = game(NEWGATE, []);
    const a = g.card(g.find('p1', 'characters', ATMOS));
    expect(a.cost).toBe(4);
    expect(a.power).toBe(5000);
    expect(a.counter).toBe(1000);
  });

  it('control: before any attack, an effect of mine that adds a Life card to my hand works (cost paid: Life 4 to 3, hand +1)', () => {
    const g = game(NEWGATE, [KID]);
    playKid(g);
    need(g, 'optional', 'p1');
    expect(canAccept(g)).toBe(true);
    accept(g);
    expect(g.life('p1')).toBe(3);
    expect(cardIds(g, 'p1', 'hand')).toContain('OP01-023');
  });

  it('an effect with no cost that adds a Life card to my hand (OP15-115 Impact Dial, after its K.O.) adds nothing; the K.O. still happens', () => {
    const g = game(NEWGATE, [DIAL]);
    atmosAttacks(g, g.leader('p2'));
    playDial(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    expect(g.life('p1')).toBe(4);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
  });

  it('control: the same Impact Dial without the restriction does add the top Life card to my hand', () => {
    const g = game(NEWGATE, [DIAL]);
    playDial(g);
    expect(g.life('p1')).toBe(3);
    expect(cardIds(g, 'p1', 'hand')).toEqual(['OP01-023']);
  });

  it('a Leader that is not [Edward.Newgate]: no restriction (the cost can be paid after the attack)', () => {
    const g = game(S7.slashSupernova, [KID]);
    atmosAttacks(g);
    playKid(g);
    need(g, 'optional', 'p1');
    expect(canAccept(g)).toBe(true);
    accept(g);
    expect(g.life('p1')).toBe(3);
  });

  it('a [Edward.Newgate] Character does not count: the Leader must be named Edward.Newgate', () => {
    const g = mine7(
      S7.slashSupernova,
      { characters: [ATMOS, 'OP02-004'], hand: [KID], life: LIFE },
      { characters: [{ card: S7.sai, rested: true }] },
    );
    atmosAttacks(g);
    playKid(g);
    need(g, 'optional', 'p1');
    expect(canAccept(g)).toBe(true);
  });

  it('it lasts this turn only: in my next turn the Life card can be added again', () => {
    const g = game(NEWGATE, [KID]);
    atmosAttacks(g);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    playKid(g);
    need(g, 'optional', 'p1');
    expect(canAccept(g)).toBe(true);
    accept(g);
    expect(g.life('p1')).toBe(3);
  });

  it('it is set whatever Atmos attacks: after attacking the Leader (a Life card is lost) the Impact Dial adds nothing either', () => {
    const g = game(NEWGATE, [DIAL]);
    atmosAttacks(g, g.leader('p2'));
    playDial(g);
    expect(g.life('p1')).toBe(4);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
  });

  it('the attack itself is unaffected: Atmos (5000) K.O.s a rested 4000 Character', () => {
    const g = game(NEWGATE, []);
    atmosAttacks(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([ATMOS]);
  });

  it("the restriction is on me only: the opponent's Life is untouched and the opponent may still use its own effects (no prompt is owed by them)", () => {
    const g = game(NEWGATE, []);
    atmosAttacks(g);
    expect(g.life('p2')).toBe(4);
    expect(kind(g)).toBe('main');
  });
});
