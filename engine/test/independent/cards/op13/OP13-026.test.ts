/**
 * OP13-026 Sunny-Kun (Character, Green, cost 1, 2000, Counter +1000, {FILM}/{Straw Hat Crew}, Wisdom).
 *
 * Card text: "[Activate: Main] [Once Per Turn] You may rest 1 of your DON!! cards: This Character
 * gains +2000 power until the end of your opponent's next turn."
 *
 * Rules: CR 8-3 (the rest-1-DON!! cost is paid to activate and needs an active DON!!); [Once Per
 * Turn] is spent when the ability is used (CR 8-1-3-2); "until the end of your opponent's next
 * turn" spans the rest of my turn and the whole opponent's next turn.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  don,
  endTurn,
  kind,
  L13,
  mine,
  need,
  noDefence,
  offeredAbilities,
  payDonStrict,
  theirs,
  toMyNextMain,
  V13,
  useAbility,
  charsOfIds,
} from './kit-op13a.ts';

const SUNNY = 'OP13-026';

function board(costArea = { active: 5, rested: 0 }, extra: string[] = []) {
  return mine(L13.luffy, { characters: [SUNNY, ...extra], costArea });
}
const sunny = (g: ReturnType<typeof board>) => at(g, 'p1', 'characters', SUNNY);
/** Activate and pay the single DON!! (asked or forced). */
function use(g: ReturnType<typeof board>) {
  useAbility(g, sunny(g));
  if (kind(g) === 'choose') payDonStrict(g, 1);
  need(g, 'main', 'p1');
}

describe("OP13-026 Sunny-Kun: [Once Per Turn] rest 1 DON!!, +2000 until the end of the opponent's next turn", () => {
  it('printed values: cost 1, 2000, Counter +1000', () => {
    const g = board();
    const c = g.card(sunny(g));
    expect(c.cost).toBe(1);
    expect(c.power).toBe(2000);
    expect(c.counter).toBe(1000);
  });

  it('activating rests 1 active DON!! and gives this Character +2000', () => {
    const g = board();
    use(g);
    expect(don(g)).toMatchObject({ active: 4, rested: 1 });
    expect(g.power(sunny(g))).toBe(4000);
  });

  it("the boost is still there during the opponent's next turn", () => {
    const g = board();
    use(g);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(sunny(g))).toBe(4000);
  });

  it("the boost is gone at the end of the opponent's next turn (my next Main Phase)", () => {
    const g = board();
    use(g);
    toMyNextMain(g);
    need(g, 'main', 'p1');
    expect(g.power(sunny(g))).toBe(2000);
  });

  it('[Once Per Turn]: not offered again after it was used', () => {
    const g = board();
    use(g);
    expect(offeredAbilities(g, sunny(g))).toEqual([]);
    expect(g.power(sunny(g))).toBe(4000);
  });

  it('[Once Per Turn] resets: usable again on my next turn', () => {
    const g = board();
    use(g);
    toMyNextMain(g);
    need(g, 'main', 'p1');
    expect(offeredAbilities(g, sunny(g)).length).toBe(1);
  });

  it('without an active DON!! the cost cannot be paid: not offered, no boost', () => {
    const g = board({ active: 0, rested: 5 });
    expect(offeredAbilities(g, sunny(g))).toEqual([]);
    expect(g.power(sunny(g))).toBe(2000);
  });

  it('with exactly 1 active DON!! it can be paid', () => {
    const g = board({ active: 1, rested: 4 });
    expect(offeredAbilities(g, sunny(g)).length).toBe(1);
    use(g);
    expect(don(g)).toMatchObject({ active: 0, rested: 5 });
    expect(g.power(sunny(g))).toBe(4000);
  });

  it('only this Character gains the power: my Leader and other Characters do not', () => {
    const g = board({ active: 5, rested: 0 }, [V13.marco]);
    use(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(at(g, 'p1', 'characters', V13.marco))).toBe(5000);
  });

  it("the boost matters in the opponent's turn: a 3000-power attacker K.O.s a rested 2000 Sunny-Kun, not a 4000 one", () => {
    const boosted = mine(
      L13.luffy,
      {
        characters: [{ card: SUNNY, rested: true }] as never,
        costArea: { active: 5, rested: 0 },
      },
      { characters: [V13.komachiyo] },
    );
    use(boosted as never);
    endTurn(boosted);
    attack(
      boosted,
      at(boosted, 'p2', 'characters', V13.komachiyo),
      at(boosted, 'p1', 'characters', SUNNY),
    );
    noDefence(boosted);
    expect(charsOfIds(boosted, 'p1')).toEqual([SUNNY]);

    const plain = theirs(
      L13.luffy,
      { characters: [{ card: SUNNY, rested: true }] as never },
      { characters: [V13.komachiyo] },
    );
    attack(
      plain,
      at(plain, 'p2', 'characters', V13.komachiyo),
      at(plain, 'p1', 'characters', SUNNY),
    );
    noDefence(plain);
    expect(charsOfIds(plain, 'p1')).toEqual([]);
  });
});
