/**
 * OP15-099 Urouge (Character, Yellow, cost 6, 7000, Counter +1000, Strike, {Fallen Monk Pirates}/
 * {Supernovas}/{Sky Island}).
 *
 * Card text: "[On Play] You may trash 1 {Supernovas} type card from your hand: This Character gains
 * [Rush] during this turn. [Activate: Main] You may turn 1 card from the top of your Life cards
 * face-down: Give up to 1 rested DON!! card to your Leader or 1 of your Characters."
 *
 * Rules: an auto's colon cost may be declined (CR 8-3-1-4) and cannot be paid in part (CR 8-3-1-3);
 * a hand cost is offered even when unpayable, with "use" unavailable (DECISIONS 2026-10-29); an
 * choice over the hidden hand is always asked, even with one candidate (DECISIONS, hidden-zone
 * choices); [Rush] lets
 * a Character attack the turn it is played (CR 10-1-1); the Activate cost needs the top Life card to
 * be face-up (a face-down card cannot be turned face-down, CR 1-3-2-1, DECISIONS 2026-11-25 G68);
 * given DON!! come from the rested DON!! of the cost area (CR 6-5-5); "up to 1" may be none.
 * Scenery: OP02-043 Roronoa Zoro, OP14-005 Killer and OP10-104 Caribou ({Supernovas} cards),
 * OP01-023 Marco (not), ST01-001 Luffy as Leader.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  canAttackAnything,
  chars,
  choices,
  don,
  hand,
  kind,
  LD_LF,
  mine,
  need,
  no,
  none,
  offeredAbilities,
  offeredIds,
  payHand,
  pickInst,
  playRaw,
  theirs,
  trash,
  unusable,
  useAbility,
  VAN_LF,
  yes,
  endTurn,
} from './kit-lfa.ts';

const UROUGE = 'OP15-099';
const { marco, mohji, zoroChar, killer1000 } = VAN_LF;
const CARIBOU = 'OP10-104';

/** p1 plays Urouge with `handCards` in hand. */
function play(handCards: string[]) {
  const g = mine(LD_LF.luffy, { hand: [UROUGE, ...handCards] });
  playRaw(g, UROUGE);
  return g;
}

describe('OP15-099 Urouge: [On Play] you may trash a {Supernovas} card: gains [Rush] this turn', () => {
  it('printed values: cost 6, 7000, Counter +1000', () => {
    const g = mine(LD_LF.luffy, { hand: [UROUGE] });
    const u = at(g, 'p1', 'hand', UROUGE);
    expect(g.card(u).cost).toBe(6);
    expect(g.card(u).counter).toBe(1000);
    playRaw(g, UROUGE);
    expect(g.power(at(g, 'p1', 'characters', UROUGE))).toBe(7000);
  });

  it('with {Supernovas} cards in hand: accepting asks which one; only {Supernovas} cards are offered', () => {
    const g = play([zoroChar, killer1000, marco]);
    need(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([killer1000, zoroChar].sort());
  });

  it('paying: the chosen card is trashed and Urouge may attack the turn he is played', () => {
    const g = play([zoroChar, killer1000, marco]);
    yes(g, 'p1');
    payHand(g, [zoroChar]);
    expect(trash(g)).toEqual([zoroChar]);
    expect(hand(g)).toEqual([killer1000, marco].sort());
    const u = at(g, 'p1', 'characters', UROUGE);
    expect(g.card(u).keywords).toContain('Rush');
    expect(atMain(g, 'p1')).toBe(true);
    expect(canAttackAnything(g, u)).toBe(true);
  });

  it('exactly one {Supernovas} card in hand: it is the only candidate offered (a hand pick is always asked)', () => {
    const g = play([CARIBOU, marco]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CARIBOU]);
    payHand(g, [CARIBOU]);
    expect(trash(g)).toEqual([CARIBOU]);
    expect(g.card(at(g, 'p1', 'characters', UROUGE)).keywords).toContain('Rush');
  });

  it('"you may": declining keeps the hand, and Urouge cannot attack this turn', () => {
    const g = play([zoroChar, killer1000]);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(hand(g)).toEqual([killer1000, zoroChar].sort());
    const u = at(g, 'p1', 'characters', UROUGE);
    expect(g.card(u).keywords).not.toContain('Rush');
    expect(canAttackAnything(g, u)).toBe(false);
  });

  it('with no {Supernovas} card in hand (only Marco) the cost cannot be paid: no Rush', () => {
    const g = play([marco]);
    unusable(g, 'p1');
    const u = at(g, 'p1', 'characters', UROUGE);
    expect(hand(g)).toEqual([marco]);
    expect(canAttackAnything(g, u)).toBe(false);
  });

  it('with an empty hand the cost cannot be paid either', () => {
    const g = play([]);
    unusable(g, 'p1');
    expect(canAttackAnything(g, at(g, 'p1', 'characters', UROUGE))).toBe(false);
  });

  it("[Rush] is for this turn only: it is gone during the opponent's turn and my next turn", () => {
    const g = play([zoroChar]);
    yes(g, 'p1');
    payHand(g, [zoroChar]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(at(g, 'p1', 'characters', UROUGE)).keywords).not.toContain('Rush');
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.card(at(g, 'p1', 'characters', UROUGE)).keywords).not.toContain('Rush');
  });
});

describe('OP15-099 Urouge: [Activate: Main] you may turn the top Life card face-down: give up to 1 rested DON!!', () => {
  const life = (up: boolean[]) => up.map((faceUp) => ({ card: mohji, faceUp }));
  /** p1: Urouge, Marco; Life as given (top first); `active`/`rested` DON!!. */
  function board(up: boolean[], o: { rested?: number; active?: number } = {}) {
    return mine(LD_LF.luffy, {
      characters: [UROUGE, marco],
      life: life(up),
      costArea: { active: o.active ?? 5, rested: o.rested ?? 3 },
    });
  }

  it('top Life card face-up: it is turned face-down and 1 rested DON!! is given to the chosen Leader', () => {
    const g = board([true, true, false]);
    useAbility(g, at(g, 'p1', 'characters', UROUGE));
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    const lifeNow = g.zone('p1', 'life');
    expect(lifeNow.map((c) => c.faceUp)).toEqual([false, true, false]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 2 });
  });

  it('only the top card is turned: the second face-up card stays face-up', () => {
    const g = board([true, true, true]);
    useAbility(g, at(g, 'p1', 'characters', UROUGE));
    need(g, 'choose', 'p1');
    none(g);
    expect(g.zone('p1', 'life').map((c) => c.faceUp)).toEqual([false, true, true]);
  });

  it("the DON!! may go to a Character: the candidates are my Leader and Characters, not the opponent's", () => {
    const g = mine(
      LD_LF.luffy,
      { characters: [UROUGE, marco], life: life([true]), costArea: { active: 5, rested: 3 } },
      { characters: [marco] },
    );
    useAbility(g, at(g, 'p1', 'characters', UROUGE));
    need(g, 'choose', 'p1');
    const c = choices(g);
    expect(c).toContain(g.leader('p1'));
    expect(c).toContain(at(g, 'p1', 'characters', marco));
    expect(c).toContain(at(g, 'p1', 'characters', UROUGE));
    expect(c).not.toContain(g.leader('p2'));
    expect(c).not.toContain(at(g, 'p2', 'characters', marco));
    pickInst(g, [at(g, 'p1', 'characters', marco)]);
    expect(g.card(at(g, 'p1', 'characters', marco)).don).toBe(1);
    expect(g.power(at(g, 'p1', 'characters', marco))).toBe(6000);
  });

  it('top Life card face-down: the cost cannot be paid, the ability is not offered', () => {
    const g = board([false, true, true]);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', UROUGE))).toEqual([]);
  });

  it('after the use the top card is face-down, so it cannot be used again even with other face-up cards', () => {
    const g = board([true, true, true]);
    const u = at(g, 'p1', 'characters', UROUGE);
    useAbility(g, u);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(offeredAbilities(g, u)).toEqual([]);
  });

  it('no Life cards: the cost cannot be paid', () => {
    const g = board([]);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', UROUGE))).toEqual([]);
  });

  it('"up to 1": giving nobody still costs the turned card; no DON!! is given', () => {
    const g = board([true]);
    useAbility(g, at(g, 'p1', 'characters', UROUGE));
    need(g, 'choose', 'p1');
    none(g);
    expect(g.zone('p1', 'life').map((c) => c.faceUp)).toEqual([false]);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 3 });
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('only a rested DON!! is given: active DON!! stay active and the count of rested DON!! drops by 1', () => {
    const g = board([true], { active: 7, rested: 1 });
    useAbility(g, at(g, 'p1', 'characters', UROUGE));
    pickInst(g, [at(g, 'p1', 'characters', marco)]);
    expect(don(g, 'p1')).toMatchObject({ active: 7, rested: 0 });
  });

  it('with no rested DON!! there is nothing to give: nothing is given', () => {
    const g = board([true], { active: 8, rested: 0 });
    useAbility(g, at(g, 'p1', 'characters', UROUGE));
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(don(g, 'p1')).toMatchObject({ active: 8, rested: 0 });
    expect(g.card(g.leader('p1')).don).toBe(0);
  });
});

void act;
void chars;
void theirs;
