/**
 * EB04-015 Jinbe (Character, Green, cost 7, 8000, no Counter, {Fish-Man}/{The Sun Pirates}/{Fish-Man Island}).
 *
 * Card text: "[Blocker]
 * [On K.O.] You may rest 1 of your cards: If your Leader has the {Fish-Man} or {Merfolk} type, play
 * up to 1 green Character card with a cost of 6 or less from your hand."
 *
 * Rules: [On K.O.] fires when this Character is K.O.'d (here in battle after blocking); the cost is
 * optional (CR 8-3-1-4) and is paid before the condition is checked (CR 8-3-1-3); "up to 1"
 * (CR 8-4-4-1); the played card must be a green Character card with cost <= 6 in hand.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  cardIds,
  choices,
  don,
  hand,
  kind,
  LE,
  mayChooseNone,
  need,
  no,
  none,
  offeredIds,
  pickInst,
  restCost,
  SN,
  theirs,
  theirsP,
  yes,
} from './kit-eb04a.ts';

const JINBE = 'EB04-015';

/** p2 attacks p1's Leader with `attacker`; p1 blocks with Jinbe. Stops at the first prompt after the K.O. */
function koInBattle(
  leader: string | { card: string; rested: boolean },
  attackerCard: string,
  hand_: string[],
  p1: Parameters<typeof theirsP>[1] = {},
) {
  const g = theirsP(
    leader,
    {
      characters: [JINBE],
      hand: hand_,
      costArea: { active: 3, rested: 0 },
      life: [SN.c1, SN.c1, SN.c1, SN.c1],
      ...p1,
    },
    { characters: [attackerCard] },
  );
  attack(g, at(g, 'p2', 'characters', attackerCard), g.leader('p1'));
  g.act({ type: 'block', blocker: at(g, 'p1', 'characters', JINBE) });
  if (kind(g) === 'counter') act(g, { type: 'endCounter' });
  return g;
}

describe('EB04-015 Jinbe: [Blocker]; [On K.O.] rest 1 of your cards: Fish-Man/Merfolk Leader plays a green Character cost 6 or less', () => {
  it('printed values: cost 7, 8000, [Blocker]', () => {
    const g = theirs(LE.fishMan, { characters: [JINBE] }, {});
    const c = g.card(at(g, 'p1', 'characters', JINBE));
    expect(c.cost).toBe(7);
    expect(c.power).toBe(8000);
    expect(c.keywords).toContain('Blocker');
  });

  it("K.O.'d while blocking, with a {Fish-Man} Leader: rest 1 DON!!, play a green cost-6 Character from hand", () => {
    const g = koInBattle(LE.fishMan, SN.c7, [SN.green6, SN.c1]);
    need(g, 'optional');
    yes(g, 'p1');
    restCost(g, [], 1);
    need(g, 'choose');
    pickInst(g, [choices(g).find((i) => g.card(i).card === SN.green6)!]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([SN.green6]);
    expect(hand(g)).toEqual([SN.c1]);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
  });

  it('a {Merfolk} Leader also qualifies', () => {
    const g = koInBattle(LE.merfolk, SN.c7, [SN.green5]);
    yes(g, 'p1');
    restCost(g, [], 1);
    pickInst(g, [choices(g).find((i) => g.card(i).card === SN.green5)!]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([SN.green5]);
  });

  it('only green Characters with cost 6 or less are offered: not a cost-7 green, not a non-green cost-3', () => {
    const g = koInBattle(LE.fishMan, SN.c7, [SN.green6, SN.green7, SN.c3, SN.green1]);
    yes(g, 'p1');
    restCost(g, [], 1);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SN.green1, SN.green6].sort());
    expect(mayChooseNone(g)).toBe(true);
    none(g);
  });

  it('"you may": declining the cost plays nothing and rests nothing', () => {
    const g = koInBattle(LE.fishMan, SN.c7, [SN.green6]);
    no(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([SN.green6]);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 0 });
  });

  it('"up to 1": after paying, choosing nothing plays nothing (the cost stays paid)', () => {
    const g = koInBattle(LE.fishMan, SN.c7, [SN.green6]);
    yes(g, 'p1');
    restCost(g, [], 1);
    need(g, 'choose');
    none(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([SN.green6]);
    expect(don(g, 'p1').rested).toBe(1);
  });

  // DISAGREEMENT B-1 (DISAGREEMENTS-a.md): the engine asks the "up to 1" hand pick only when the hand
  // holds a matching card, so the prompt itself reveals hidden information (severity 4).
  it.fails(
    'an "up to 1" pick over the hand is asked even when nothing matches (empty hand, or no green cost-6 Character): no hidden-card dependency',
    () => {
      for (const h of [[], [SN.c3, SN.green7]]) {
        const g = koInBattle(LE.fishMan, SN.c7, h);
        yes(g, 'p1');
        restCost(g, [], 1);
        need(g, 'choose', 'p1');
        expect(choices(g)).toEqual([]);
        none(g);
        expect(cardIds(g, 'p1', 'characters')).toEqual([]);
      }
    },
  );

  it('must not happen: a Leader that is neither {Fish-Man} nor {Merfolk} plays nothing', () => {
    const g = koInBattle(LE.luffy, SN.c7, [SN.green6]);
    if (kind(g) === 'optional') {
      yes(g, 'p1');
      restCost(g, [], 1);
    }
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([SN.green6]);
  });

  it('cost not payable (Leader rested, no active DON!!, Jinbe itself is gone): "use" is not offered and nothing is played', () => {
    const g = koInBattle({ card: LE.fishMan, rested: true }, SN.c7, [SN.green6], {
      costArea: { active: 0, rested: 3 },
    });
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      no(g, 'p1');
    }
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([SN.green6]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('must not happen: if Jinbe survives the battle (weaker attacker) [On K.O.] does not fire', () => {
    const g = koInBattle(LE.fishMan, SN.c1, [SN.green6]);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'characters')).toEqual([JINBE]);
    expect(hand(g)).toEqual([SN.green6]);
  });
});
