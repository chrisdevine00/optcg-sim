/**
 * OP13-064 Gol.D.Roger (Character, Purple, cost 10, 13000, <Slash>, {Roger Pirates}{King of the
 * Pirates}).
 *
 * Card text: "Your Leader and all of your Characters that do not have a type including "Roger
 * Pirates" have their effects negated. [On Play] DON!! −3: Your Leader gains +2000 power until the
 * end of your opponent's next End Phase. Then, give all of your opponent's Characters −2000 power
 * until the end of your opponent's next End Phase."
 *
 * Rules used: a continuous negation lasts while the card is on the field; "a type including" is a
 * substring match on one of the card's types ({Former Roger Pirates} includes it); keywords and
 * [On Play]/[Activate: Main] are effects; an [On Play] with a DON!! −N cost may be declined (rules
 * digest 112) and returns the DON!! to the DON!! deck from the cost area, rested or not; "all of
 * your opponent's Characters" is read when the effect resolves. The text applies the type filter to
 * the Characters; whether the Leader is exempt when its own type includes "Roger Pirates" is not
 * settled by the text, so the tests use a Leader without that type (M6b-Q83).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, blockers, cardIds } from '../../helpers.ts';
import { accept, canActivate, decline, kind } from '../kit.ts';
import { dons, mine7, need, S7, theirs7, now } from './kit-w7b.ts';

const ROGER = 'OP13-064';
const KAYA = 'OP03-044'; // Blue, cost 1, East Blue: [On Play] Draw 2 cards and trash 2 cards from your hand.
const JINBE_LEADER = 'OP14-040'; // Blue, 5000: [Activate: Main] You may trash 1 card from your hand: give up to 2 rested DON!! to 1 {Fish-Man}/{Merfolk} Leader or Character.
const LEADER = S7.slashSupernova; // OP01-001 Zoro: Slash, no {Roger Pirates} type, inert.

/** p1 plays Roger from the hand with 10 DON!! and answers the DON!! −3 question. */
function playRoger(accepts: boolean, extra: Parameters<typeof mine7>[1] = {}, p2 = {}) {
  const g = mine7(LEADER, { hand: [ROGER], ...extra }, p2);
  act(g, { type: 'playCard', card: g.find('p1', 'hand', ROGER) });
  need(g, 'optional', 'p1');
  (accepts ? accept : decline)(g);
  return g;
}

describe('OP13-064 Gol.D.Roger: negates my Leader and my non-{Roger Pirates} Characters; [On Play] DON!! −3: Leader +2000, opposing Characters −2000', () => {
  it('printed values: cost 10, 13000 power', () => {
    const g = mine7(LEADER, { hand: [ROGER] });
    const r = g.zone('p1', 'hand')[0]!;
    expect(g.card(r.instance).cost).toBe(10);
    expect(g.card(r.instance).power).toBe(13000);
  });

  describe('the negation', () => {
    const board = () =>
      mine7(
        LEADER,
        { characters: [ROGER, S7.marco, S7.rogerBlocker, S7.formerRoger] },
        { characters: [S7.kingdew] },
      );

    it('my Leader and my Characters without a type including "Roger Pirates" are negated', () => {
      const g = board();
      expect(g.card(g.leader('p1')).negated).toBe(true);
      expect(g.card(g.find('p1', 'characters', S7.marco)).negated).toBe(true);
    });

    it('Roger himself, a {Roger Pirates} Character and a {Former Roger Pirates} Character are not negated', () => {
      const g = board();
      expect(g.card(g.find('p1', 'characters', ROGER)).negated).toBeFalsy();
      expect(g.card(g.find('p1', 'characters', S7.rogerBlocker)).negated).toBeFalsy();
      expect(g.card(g.find('p1', 'characters', S7.formerRoger)).negated).toBeFalsy();
    });

    it("the opponent's Leader and Characters are not negated", () => {
      const g = board();
      expect(g.card(g.leader('p2')).negated).toBeFalsy();
      expect(g.card(g.find('p2', 'characters', S7.kingdew)).negated).toBeFalsy();
    });

    it('without Roger nothing of mine is negated', () => {
      const g = mine7(LEADER, { characters: [S7.marco] });
      expect(g.card(g.leader('p1')).negated).toBeFalsy();
      expect(g.card(g.find('p1', 'characters', S7.marco)).negated).toBeFalsy();
    });

    it('a negated Leader cannot use its [Activate: Main]; without Roger it can', () => {
      const withRoger = mine7(JINBE_LEADER, {
        characters: [ROGER],
        hand: [S7.marco],
        costArea: { active: 0, rested: 5 },
      });
      expect(canActivate(withRoger, withRoger.leader('p1'))).toBe(false);
      const without = mine7(JINBE_LEADER, { hand: [S7.marco], costArea: { active: 0, rested: 5 } });
      expect(canActivate(without, without.leader('p1'))).toBe(true);
    });

    it("a negated Character's [Blocker] is lost, a {Roger Pirates} Character keeps it", () => {
      const g = theirs7(
        LEADER,
        { characters: [ROGER, S7.blocker, S7.rogerBlocker] },
        { characters: [S7.kingdew] },
      );
      attack(g, g.find('p2', 'characters', S7.kingdew), g.leader('p1'));
      need(g, 'block', 'p1');
      const b = blockers(g);
      expect(b).toContain(g.find('p1', 'characters', S7.rogerBlocker));
      expect(b).not.toContain(g.find('p1', 'characters', S7.blocker));
    });

    it('control: without Roger the same [Blocker] can block', () => {
      const g = theirs7(LEADER, { characters: [S7.blocker] }, { characters: [S7.kingdew] });
      attack(g, g.find('p2', 'characters', S7.kingdew), g.leader('p1'));
      need(g, 'block', 'p1');
      expect(blockers(g)).toContain(g.find('p1', 'characters', S7.blocker));
    });

    it("a negated Character's [On Play] does nothing: Kaya draws and trashes nothing while Roger is on the field", () => {
      const g = mine7(LEADER, { characters: [ROGER], hand: [KAYA, S7.marco, S7.sai] }, {});
      act(g, { type: 'playCard', card: g.find('p1', 'hand', KAYA) });
      expect(kind(g), now(g)).toBe('main');
      expect(cardIds(g, 'p1', 'hand').sort()).toEqual([S7.marco, S7.sai].sort());
      expect(cardIds(g, 'p1', 'trash')).toEqual([]);
    });

    it("control: without Roger Kaya's [On Play] draws 2 (a trash choice follows)", () => {
      const g = mine7(LEADER, { hand: [KAYA, S7.marco, S7.sai] }, {});
      act(g, { type: 'playCard', card: g.find('p1', 'hand', KAYA) });
      expect(cardIds(g, 'p1', 'hand').length).toBe(4);
      need(g, 'choose', 'p1');
    });

    it('the negation ends when Roger leaves the field (K.O.d in battle)', () => {
      const g = theirs7(
        LEADER,
        { characters: [{ card: ROGER, rested: true }, S7.marco] },
        { characters: [{ card: S7.vanilla10, don: 2 }], costArea: { active: 8, rested: 0 } },
      );
      expect(g.card(g.leader('p1')).negated).toBe(true);
      attack(g, g.find('p2', 'characters', S7.vanilla10), g.find('p1', 'characters', ROGER));
      act(g, { type: 'block', blocker: null });
      act(g, { type: 'endCounter' });
      expect(cardIds(g, 'p1', 'trash')).toEqual([ROGER]);
      expect(g.card(g.leader('p1')).negated).toBeFalsy();
      expect(g.card(g.find('p1', 'characters', S7.marco)).negated).toBeFalsy();
    });
  });

  describe('[On Play] DON!! −3', () => {
    it('paying: my Leader gets +2000 (7000) and every opposing Character −2000, at once', () => {
      const g = playRoger(true, {}, { characters: [S7.kingdew, S7.hajrudin] });
      expect(kind(g)).toBe('main');
      expect(g.power(g.leader('p1'))).toBe(7000);
      expect(g.power(g.find('p2', 'characters', S7.kingdew))).toBe(5000);
      expect(g.power(g.find('p2', 'characters', S7.hajrudin))).toBe(4000);
    });

    it('3 DON!! go back to the DON!! deck (7 left in the cost area, none active after paying cost 10)', () => {
      const g = playRoger(true);
      expect(dons(g)).toMatchObject({ deck: 3, rested: 7, active: 0, given: 0 });
    });

    it("my own Characters and the opponent's Leader are not changed", () => {
      const g = playRoger(true, { characters: [S7.marco] }, {});
      expect(g.power(g.find('p1', 'characters', S7.marco))).toBe(5000);
      expect(g.power(g.leader('p2'))).toBe(5000);
    });

    it('declining the cost: Roger stays on the field, no power change, no DON!! returned', () => {
      const g = playRoger(false, {}, { characters: [S7.kingdew] });
      expect(g.power(g.leader('p1'))).toBe(5000);
      expect(g.power(g.find('p2', 'characters', S7.kingdew))).toBe(7000);
      expect(dons(g)).toMatchObject({ deck: 0, rested: 10 });
      expect(cardIds(g, 'p1', 'characters')).toEqual([ROGER]);
    });

    it('with no opposing Characters the Leader still gets +2000', () => {
      const g = playRoger(true);
      expect(g.power(g.leader('p1'))).toBe(7000);
    });

    it("lasts through the opponent's turn and ends at the end of the opponent's End Phase", () => {
      const g = playRoger(true, {}, { characters: [S7.kingdew] });
      act(g, { type: 'endTurn' });
      // p2's Main Phase.
      need(g, 'main', 'p2');
      expect(g.power(g.leader('p1'))).toBe(7000);
      expect(g.power(g.find('p2', 'characters', S7.kingdew))).toBe(5000);
      act(g, { type: 'endTurn' });
      // p1's next Main Phase.
      need(g, 'main', 'p1');
      expect(g.power(g.leader('p1'))).toBe(5000);
      expect(g.power(g.find('p2', 'characters', S7.kingdew))).toBe(7000);
    });

    it('a Character the opponent plays after the effect resolved is not reduced', () => {
      const g = playRoger(true, {}, { hand: [S7.marco], costArea: { active: 5, rested: 0 } });
      act(g, { type: 'endTurn' });
      need(g, 'main', 'p2');
      const m = g.find('p2', 'hand', S7.marco);
      act(g, { type: 'playCard', card: m });
      while (kind(g) === 'choose') {
        const p = g.legal().find((a) => a.type === 'pick');
        if (!p) break;
        g.act(p);
      }
      expect(g.power(g.find('p2', 'characters', S7.marco))).toBe(5000);
    });
  });
});
