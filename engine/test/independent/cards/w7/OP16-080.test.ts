/**
 * OP16-080 Marshall.D.Teach (Leader, Black/Yellow, 5000 power, 4 Life, <Special>, {Blackbeard
 * Pirates}{The Seven Warlords of the Sea}).
 *
 * Card text: "[Opponent's Turn] All of your Characters gain +1 cost. [On Your Opponent's Attack] [Once
 * Per Turn] You may trash 1 card with a [Trigger] from your hand: Change the target of that attack
 * to this Leader or to one of your {Blackbeard Pirates} type Character cards."
 *
 * Rules used: [Opponent's Turn] holds only during the opponent's turn; "cost" of a Character is
 * read by every effect that compares costs; a "You may" cost paid from the hand is the player's
 * choice, and the question must not depend on the hidden hand (the optional is asked, with "yes"
 * unavailable when no card of the hand has a [Trigger]); [Once Per Turn]; the new target takes the
 * battle. A card has a [Trigger] when its printed text has one.
 * Not used: `mine`/`theirs` of the m4b kit (they strip this Leader's ability).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, cardIds, decision } from '../../helpers.ts';
import { accept, choices, decline, kind } from '../kit.ts';
import { canAccept, mine7, need, now, S7, theirs7 } from './kit-w7b.ts';

const TEACH = 'OP16-080';
const TRIG = 'OP17-107'; // Charlotte Daifuku: Yellow, cost 3, 4000, has "[Trigger] Play this card."
const TRIG2 = 'OP14-106'; // Salome: Yellow, cost 3, 1000, [Blocker], has a [Trigger]
const NOTRIG = S7.marco; // no [Trigger]
const BB = S7.bb4; // OP09-082 Avalo Pizarro: {Blackbeard Pirates}, cost 4, 6000
const BB2 = S7.bb5; // OP10-084 Sanjuan.Wolf: {Blackbeard Pirates}, cost 5, 7000
const ATTACKER = S7.kingdew;
const ICE = 'OP09-115'; // Event cost 1: [Main] K.O. up to 1 of your opponent's Characters with a cost of 3 or less and a [Trigger].

/** p2's turn: p1 Teach with `p1`, p2 with Kingdew as attacker. */
function game(p1: Parameters<typeof theirs7>[1] = {}, p2: Parameters<typeof theirs7>[2] = {}) {
  return theirs7(TEACH, p1, { characters: [ATTACKER], ...p2 });
}

type G = ReturnType<typeof game>;

function attackOn(g: G, target: string, attacker: string = ATTACKER) {
  attack(g, g.find('p2', 'characters', attacker), target);
}

/** Say yes, trash `card` from the hand if it is asked, then pick `target` if it is asked. */
function useAbility(g: G, card: string, target?: string) {
  need(g, 'optional', 'p1');
  accept(g);
  if (kind(g) === 'choose') {
    const c = g.find('p1', 'hand', card);
    if (choices(g).includes(c)) act(g, { type: 'pick', choice: c });
  }
  if (target && kind(g) === 'choose') act(g, { type: 'pick', choice: target });
}

function resolveBattle(g: G) {
  need(g, 'block', 'p1');
  act(g, { type: 'block', blocker: null });
  act(g, { type: 'endCounter' });
  while (decision(g)?.kind === 'trigger') act(g, { type: 'trigger', activate: false });
}

describe("OP16-080 Marshall.D.Teach: my Characters +1 cost on the opponent's turn; trash a [Trigger] card from hand to change an attack's target to this Leader or a {Blackbeard Pirates} Character", () => {
  it('printed values: Leader, 5000 power, 4 Life', () => {
    const g = mine7(TEACH, { life: ['P-015', 'P-015', 'P-015', 'P-015'] });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.life('p1')).toBe(4);
  });

  describe("[Opponent's Turn] +1 cost", () => {
    it("on the opponent's turn each of my Characters costs 1 more", () => {
      const g = game({ characters: [NOTRIG, BB] });
      expect(g.card(g.find('p1', 'characters', NOTRIG)).cost).toBe(4);
      expect(g.card(g.find('p1', 'characters', BB)).cost).toBe(5);
    });

    it('on my own turn the cost is printed', () => {
      const g = mine7(TEACH, { characters: [NOTRIG, BB] });
      expect(g.card(g.find('p1', 'characters', NOTRIG)).cost).toBe(3);
      expect(g.card(g.find('p1', 'characters', BB)).cost).toBe(4);
    });

    it("the opponent's Characters are not changed, on either turn", () => {
      const theirTurn = game({}, { characters: [ATTACKER] });
      expect(theirTurn.card(theirTurn.find('p2', 'characters', ATTACKER)).cost).toBe(5);
      const myTurn = mine7(TEACH, {}, { characters: [ATTACKER] });
      expect(myTurn.card(myTurn.find('p2', 'characters', ATTACKER)).cost).toBe(5);
    });

    it('an effect that compares costs sees it: a cost-3 [Trigger] Character cannot be chosen by "cost of 3 or less" on the opponent\'s turn', () => {
      const g = game({ characters: [TRIG] }, { hand: [ICE], characters: [] });
      act(g, { type: 'playCard', card: g.find('p2', 'hand', ICE) });
      // Pay for the Event; then the effect finds no legal target (cost 4 now), so the Character stays.
      for (let i = 0; i < 6 && kind(g) === 'choose'; i++) {
        const t = g.find('p1', 'characters', TRIG);
        expect(choices(g)).not.toContain(t);
        const p = g.legal().find((a) => a.type === 'pick');
        if (!p) {
          if (g.legal().some((a) => a.type === 'done')) act(g, { type: 'done' });
          break;
        }
        g.act(p);
      }
      expect(cardIds(g, 'p1', 'characters')).toEqual([TRIG]);
    });

    it('control: with another Leader the same cost-3 [Trigger] Character can be K.O.d by "cost of 3 or less"', () => {
      const g = theirs7(S7.crocodile, { characters: [TRIG] }, { hand: [ICE] });
      act(g, { type: 'playCard', card: g.find('p2', 'hand', ICE) });
      let sawTarget = false;
      for (let i = 0; i < 6 && kind(g) === 'choose'; i++) {
        const t = g.find('p1', 'characters', TRIG);
        if (choices(g).includes(t)) {
          sawTarget = true;
          act(g, { type: 'pick', choice: t });
          if (g.legal().some((a) => a.type === 'done') && kind(g) === 'choose')
            act(g, { type: 'done' });
          break;
        }
        const p = g.legal().find((a) => a.type === 'pick');
        if (!p) break;
        g.act(p);
      }
      expect(sawTarget).toBe(true);
      expect(cardIds(g, 'p1', 'trash')).toEqual([TRIG]);
    });
  });

  describe("[On Your Opponent's Attack] trash a [Trigger] card: change the target", () => {
    it('an attack on a non-{Blackbeard Pirates} Character: trash the [Trigger] card, redirect to the Leader; the Leader is hit and the Character is untouched', () => {
      const g = game({ hand: [TRIG, NOTRIG], characters: [{ card: S7.sai, rested: true }] });
      attackOn(g, g.find('p1', 'characters', S7.sai));
      useAbility(g, TRIG, g.leader('p1'));
      resolveBattle(g);
      expect(cardIds(g, 'p1', 'trash')).toEqual([TRIG]);
      // The hit Life card (a filler) joined the hand.
      expect(cardIds(g, 'p1', 'hand').sort()).toEqual([NOTRIG, 'OP02-060'].sort());
      expect(cardIds(g, 'p1', 'characters')).toEqual([S7.sai]);
      expect(g.life('p1')).toBe(3);
    });

    it('redirect to a {Blackbeard Pirates} Character, rested or active: it takes the battle (6000 against 7000: K.O.d)', () => {
      const g = game({
        hand: [TRIG],
        characters: [{ card: S7.sai, rested: true }, BB, { card: BB2, rested: true }],
      });
      attackOn(g, g.find('p1', 'characters', S7.sai));
      need(g, 'optional', 'p1');
      accept(g);
      // The trash pick (a single [Trigger] card) may be made without a prompt; then the target.
      if (kind(g) === 'choose' && choices(g).includes(g.find('p1', 'hand', TRIG))) {
        act(g, { type: 'pick', choice: g.find('p1', 'hand', TRIG) });
      }
      need(g, 'choose', 'p1');
      expect(choices(g)).toContain(g.find('p1', 'characters', BB));
      expect(choices(g)).toContain(g.find('p1', 'characters', BB2));
      act(g, { type: 'pick', choice: g.find('p1', 'characters', BB) });
      resolveBattle(g);
      expect(cardIds(g, 'p1', 'trash').sort()).toEqual([BB, TRIG].sort());
      expect(g.life('p1')).toBe(4);
    });

    it('the candidates are this Leader and the {Blackbeard Pirates} Characters: other Characters are not offered', () => {
      const g = game({ hand: [TRIG], characters: [{ card: S7.sai, rested: true }, BB, S7.dq3] });
      attackOn(g, g.find('p1', 'characters', S7.sai));
      need(g, 'optional', 'p1');
      accept(g);
      if (kind(g) === 'choose' && choices(g).includes(g.find('p1', 'hand', TRIG))) {
        act(g, { type: 'pick', choice: g.find('p1', 'hand', TRIG) });
      }
      need(g, 'choose', 'p1');
      expect(choices(g).sort()).toEqual([g.leader('p1'), g.find('p1', 'characters', BB)].sort());
    });

    it('an attack on my Leader may be redirected to a {Blackbeard Pirates} Character', () => {
      const g = game({ hand: [TRIG], characters: [BB] });
      attackOn(g, g.leader('p1'));
      useAbility(g, TRIG, g.find('p1', 'characters', BB));
      resolveBattle(g);
      expect(g.life('p1')).toBe(4);
      expect(cardIds(g, 'p1', 'trash').sort()).toEqual([BB, TRIG].sort());
    });

    it('with two [Trigger] cards in the hand I choose which one is trashed', () => {
      const g = game({ hand: [TRIG, TRIG2], characters: [{ card: S7.sai, rested: true }] });
      attackOn(g, g.find('p1', 'characters', S7.sai));
      need(g, 'optional', 'p1');
      accept(g);
      need(g, 'choose', 'p1');
      expect(choices(g).sort()).toEqual(
        [g.find('p1', 'hand', TRIG), g.find('p1', 'hand', TRIG2)].sort(),
      );
      act(g, { type: 'pick', choice: g.find('p1', 'hand', TRIG2) });
      expect(cardIds(g, 'p1', 'trash')).toEqual([TRIG2]);
      expect(cardIds(g, 'p1', 'hand')).toEqual([TRIG]);
    });

    it('a hand card without a [Trigger] cannot pay the cost: it is not a candidate', () => {
      const g = game({ hand: [TRIG, NOTRIG], characters: [{ card: S7.sai, rested: true }] });
      attackOn(g, g.find('p1', 'characters', S7.sai));
      need(g, 'optional', 'p1');
      accept(g);
      // One candidate: the engine may pick it itself. Either way the Marco is never offered.
      if (kind(g) === 'choose') expect(choices(g)).not.toContain(g.find('p1', 'hand', NOTRIG));
      expect(cardIds(g, 'p1', 'hand')).toContain(NOTRIG);
    });

    it('no prompt depends on the hidden hand: with no [Trigger] card, or an empty hand, the question is still asked and "yes" is not legal', () => {
      for (const hand of [[NOTRIG, S7.sai], []]) {
        const g = game({ hand, characters: [{ card: S7.sai, rested: true }] });
        attackOn(g, g.find('p1', 'characters', S7.sai));
        need(g, 'optional', 'p1');
        expect(canAccept(g)).toBe(false);
        decline(g);
        need(g, 'block', 'p1');
      }
      const withTrigger = game({ hand: [TRIG], characters: [{ card: S7.sai, rested: true }] });
      attackOn(withTrigger, withTrigger.find('p1', 'characters', S7.sai));
      need(withTrigger, 'optional', 'p1');
      expect(canAccept(withTrigger)).toBe(true);
    });

    it('declining: nothing is trashed and the attack stays on its target', () => {
      const g = game({ hand: [TRIG], characters: [{ card: S7.sai, rested: true }] });
      attackOn(g, g.find('p1', 'characters', S7.sai));
      need(g, 'optional', 'p1');
      decline(g);
      resolveBattle(g);
      expect(cardIds(g, 'p1', 'hand')).toEqual([TRIG]);
      expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    });

    it('[Once Per Turn]: after one use, a second attack in the same turn offers nothing', () => {
      const g = game(
        {
          hand: [TRIG, TRIG2],
          characters: [
            { card: S7.sai, rested: true },
            { card: S7.komachiyo, rested: true },
          ],
        },
        { characters: [ATTACKER, S7.hajrudin] },
      );
      attackOn(g, g.find('p1', 'characters', S7.sai));
      useAbility(g, TRIG, g.leader('p1'));
      resolveBattle(g);
      need(g, 'main', 'p2');
      attackOn(g, g.find('p1', 'characters', S7.komachiyo), S7.hajrudin);
      expect(kind(g), now(g)).toBe('block');
    });

    it('my own attack on my turn gives me no question', () => {
      const g = mine7(
        TEACH,
        { hand: [TRIG], characters: [S7.marco] },
        { characters: [{ card: S7.sai, rested: true }] },
      );
      attack(g, g.find('p1', 'characters', S7.marco), g.find('p2', 'characters', S7.sai));
      expect(kind(g)).not.toBe('optional');
    });
  });
});
