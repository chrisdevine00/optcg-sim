/**
 * PRB02-008 Marco (Character, cost 4, 6000, no Counter, {Former Whitebeard Pirates}/{Land of Wano},
 * [Blocker]).
 *
 * Card text: "[Blocker] [On K.O.] Draw 2 cards."
 *
 * Rules: [On K.O.] activates when this Character is K.O.'d on the field, by battle or by an effect,
 * on either player's turn (CR 10-2-17). Being trashed by the Character limit is not a K.O. (rules-
 * digest 78), nor is any other removal. The draw is not optional and is exactly 2.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  blockers,
  act,
  hand,
  kind,
  kw,
  LDP,
  mine,
  need,
  noDefence,
  opponentKOs,
  pickInst,
  playRaw,
  SP,
  sorted,
  takeMost,
  theirs,
  deck,
  decision,
  opponentKingdomCome,
  chr,
} from './kit-prb02sta.ts';

const MA = 'PRB02-008';
const TOP = [SP.c1p3, SP.c2p4, SP.c3p5, SP.c4p6];

describe('PRB02-008 Marco: [Blocker]; [On K.O.] draw 2 cards', () => {
  it('printed values: cost 4, 6000 power, no Counter, [Blocker]', () => {
    const g = mine(LDP.neutral, { characters: [MA] });
    const i = at(g, 'p1', 'characters', MA);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([4, 6000, null]);
    expect(kw(g, i)).toContain('Blocker');
  });

  it('K.O.d by an opposing effect: draws exactly 2 cards, the top two of the deck', () => {
    const g = theirs(
      LDP.neutral,
      { characters: [MA], deck: TOP },
      { hand: [SP.lightning], costArea: { active: 10, rested: 0 } },
    );
    opponentKOs(g, at(g, 'p1', 'characters', MA));
    if (decision(g)?.player === 'p2') takeMost(g);
    expect(hand(g)).toEqual([SP.c1p3, SP.c2p4].sort());
    expect(deck(g)).toEqual([SP.c3p5, SP.c4p6]);
    expect(sorted(g, 'p1', 'trash')).toEqual([MA]);
  });

  it("K.O.d in battle on the opponent's turn (attacked while rested): draws 2", () => {
    const g = theirs(
      LDP.neutral,
      { characters: [{ card: MA, rested: true }], deck: TOP },
      { characters: [SP.c6p8] },
    );
    attack(g, at(g, 'p2', 'characters', SP.c6p8), at(g, 'p1', 'characters', MA));
    noDefence(g);
    expect(sorted(g, 'p1', 'trash')).toEqual([MA]);
    expect(hand(g)).toEqual([SP.c1p3, SP.c2p4].sort());
  });

  it('K.O.d in battle as a blocker: [Blocker] blocks the 8000-power attacker, loses and draws 2', () => {
    const g = theirs(LDP.neutral, { characters: [MA], deck: TOP }, { characters: [SP.c6p8] });
    attack(g, at(g, 'p2', 'characters', SP.c6p8), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', MA)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', MA) });
    noDefence(g);
    expect(sorted(g, 'p1', 'trash')).toEqual([MA]);
    expect(hand(g)).toHaveLength(2);
  });

  it('a Marco that wins the battle draws nothing', () => {
    const g = mine(
      LDP.neutral,
      { characters: [MA], deck: TOP },
      { characters: [{ card: SP.c4p6, rested: true }] },
    );
    attack(g, at(g, 'p1', 'characters', MA), chr(g, 'p2', SP.c4p6));
    noDefence(g);
    expect(sorted(g, 'p1', 'characters')).toEqual([MA]);
    expect(hand(g)).toEqual([]);
  });

  it('trashed by the Character limit (not a K.O.): nothing is drawn', () => {
    const fiveChars = [MA, SP.c1p3, SP.c2p4, SP.c3p5, SP.c4p6];
    const g = mine(LDP.neutral, { characters: fiveChars, hand: [SP.c1p2], deck: TOP });
    playRaw(g, SP.c1p2);
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('characterLimit');
    pickInst(g, [at(g, 'p1', 'characters', MA)]);
    expect(sorted(g, 'p1', 'trash')).toEqual([MA]);
    expect(hand(g)).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('another Character being K.O.d does not draw for Marco', () => {
    const g = theirs(
      LDP.neutral,
      { characters: [MA, SP.c1p3], deck: TOP },
      { hand: [SP.lightning], costArea: { active: 10, rested: 0 } },
    );
    opponentKOs(g, at(g, 'p1', 'characters', SP.c1p3));
    if (decision(g)?.player === 'p2') takeMost(g);
    expect(hand(g)).toEqual([]);
    expect(sorted(g, 'p1', 'characters')).toEqual([MA]);
  });

  it("K.O.d by an Event's effect (Kingdom Come) also draws exactly 2, not more", () => {
    const g = theirs(
      LDP.neutral,
      { characters: [MA], deck: [...TOP, SP.c5p7, SP.c6p8] },
      { hand: [SP.kingdomCome], costArea: { active: 10, rested: 0 } },
    );
    opponentKingdomCome(g, at(g, 'p1', 'characters', MA));
    expect(hand(g)).toHaveLength(2);
    expect(deck(g)).toHaveLength(4);
  });

  it('the draw is not a choice: no prompt is asked to p1 after the K.O.', () => {
    const g = theirs(
      LDP.neutral,
      { characters: [{ card: MA, rested: true }], deck: TOP },
      { characters: [SP.c6p8] },
    );
    attack(g, at(g, 'p2', 'characters', SP.c6p8), at(g, 'p1', 'characters', MA));
    noDefence(g);
    expect(decision(g)?.player).toBe('p2');
    expect(kind(g)).toBe('main');
  });
});
