/**
 * OP18-119 Saint Shamrock (Black Character, cost 8, 9000, no Counter, {Celestial Dragons}/{Holy Knights of God}).
 *
 * Card text: "[On K.O.] You may trash 1 card from your hand: Play this Character card from your trash.
 *             [Activate: Main] [Once Per Turn] If this Character was played on this turn, play up to
 *             1 {Holy Knights of God} type Character card with a cost of 6 or less from your trash."
 *
 * Readings: a colon-less "If" is an effect condition, so the ability can be activated at any time
 * but only does something on the turn Shamrock was played. A Shamrock played from the trash by its
 * own [On K.O.] counts as "played". Scenery: OP18-085 Cerberus (HKG, cost 1), OP18-088 Saint
 * Sommers (HKG, cost 6; its [On Play] needs 6 DON!! on the field, so those tests keep fewer),
 * a second OP18-119 (HKG, cost 8), OP03-082 Kumadori (CP9, not HKG), OP12-005 Shiki (the attacker).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  cardIds,
  decline,
  donOf,
  kind,
  mayChooseNone,
  need,
  none,
  offeredAbilities,
  offeredIds,
  passBlock,
  payHand,
  pickCards,
  play,
  toMyNextMain,
  unusable,
  useAbility,
  yes,
  LDR,
  CH,
} from './kit-e.ts';
import { mineE, theirsE, X } from './kit-e.ts';

const SH = X.shamrock;
const CERB = X.cerberus;
const SOMM = X.sommers;
const KUMA = X.cp4;
const SHIKI = 'OP12-005';
const MISS = 'OP02-060';

describe('OP18-119 Saint Shamrock: [Activate: Main] [Once Per Turn] if played this turn, play up to 1 {Holy Knights of God} cost <= 6 from the trash', () => {
  const fresh = (trash: string[], active = 10) =>
    mineE(LDR.luffy, {
      characters: [{ card: SH, playedThisTurn: true }],
      trash,
      costArea: { active, rested: 0 },
    });

  it('offers {HKG} Characters with cost <= 6 only (6 in, 8 out; non-HKG out) and plays the pick', () => {
    const g = fresh([KUMA, SH, SOMM, CERB], 5);
    useAbility(g, at(g, 'p1', 'characters', SH));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CERB, SOMM].sort());
    pickCards(g, [CERB]);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([CERB, SH].sort());
    expect(cardIds(g, 'p1', 'trash')).not.toContain(CERB);
    expect(atMain(g, 'p1')).toBe(true);
  });

  it('cost 6 boundary: Saint Sommers can be played (with < 6 DON!! on the field its [On Play] does nothing)', () => {
    const g = fresh([SOMM], 5);
    useAbility(g, at(g, 'p1', 'characters', SH));
    pickCards(g, [SOMM]);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([SH, SOMM].sort());
  });

  it('a Saint Sommers played this way is an ordinary play: with 6+ DON!! on my field its [On Play] K.O. is offered', () => {
    const g = mineE(
      LDR.luffy,
      { characters: [{ card: SH, playedThisTurn: true }], trash: [SOMM] },
      { characters: ['OP01-012', CH.kingdew5] },
    );
    useAbility(g, at(g, 'p1', 'characters', SH));
    pickCards(g, [SOMM]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual(['OP01-012']);
    pickCards(g, ['OP01-012']);
    expect(cardIds(g, 'p2', 'trash')).toEqual(['OP01-012']);
  });

  it('the Character is played for free (no DON!! rested)', () => {
    const g = fresh([CERB], 5);
    useAbility(g, at(g, 'p1', 'characters', SH));
    pickCards(g, [CERB]);
    expect(g.zone('p1', 'characters')).toHaveLength(2);
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 0 });
  });

  it('"up to 1": may play nothing', () => {
    const g = fresh([CERB, SOMM], 5);
    useAbility(g, at(g, 'p1', 'characters', SH));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([SH]);
  });

  it('plays only one even when several qualify', () => {
    const g = fresh([CERB, SOMM], 5);
    useAbility(g, at(g, 'p1', 'characters', SH));
    pickCards(g, [CERB]);
    expect(cardIds(g, 'p1', 'characters')).toHaveLength(2);
  });

  it('[Once Per Turn]: not offered a second time in the same turn', () => {
    const g = fresh([CERB, SOMM], 5);
    useAbility(g, at(g, 'p1', 'characters', SH));
    pickCards(g, [CERB]);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', SH))).toEqual([]);
  });

  it('must not work if Shamrock was not played this turn: no {HKG} Character is played from the trash', () => {
    const g = mineE(LDR.luffy, {
      characters: [SH],
      trash: [CERB],
      costArea: { active: 5, rested: 0 },
    });
    const abilities = offeredAbilities(g, at(g, 'p1', 'characters', SH));
    if (abilities.length) {
      act(g, { type: 'activate', card: at(g, 'p1', 'characters', SH), ability: abilities[0]! });
      if (kind(g) === 'choose') none(g);
    }
    expect(cardIds(g, 'p1', 'characters')).toEqual([SH]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([CERB]);
  });

  it('really played from hand this turn (8 DON!!): the ability then works; next turn it does nothing', () => {
    const g = mineE(LDR.luffy, {
      hand: [SH],
      trash: [CERB, SOMM],
      costArea: { active: 8, rested: 0 },
    });
    play(g, at(g, 'p1', 'hand', SH));
    expect(atMain(g, 'p1')).toBe(true);
    useAbility(g, at(g, 'p1', 'characters', SH));
    pickCards(g, [CERB]);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([CERB, SH].sort());
    toMyNextMain(g);
    const abilities = offeredAbilities(g, at(g, 'p1', 'characters', SH));
    if (abilities.length) {
      act(g, { type: 'activate', card: at(g, 'p1', 'characters', SH), ability: abilities[0]! });
      if (kind(g) === 'choose') none(g);
    }
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([CERB, SH].sort());
    expect(cardIds(g, 'p1', 'trash')).toEqual([SOMM]);
  });
});

describe('OP18-119 Saint Shamrock: [On K.O.] you may trash 1 card from your hand: play this Character from your trash', () => {
  function falls(hand: string[], p1: object = {}) {
    const g = theirsE(
      LDR.luffy,
      { characters: [{ card: SH, rested: true }], hand, ...p1 },
      { characters: [SHIKI] },
    );
    attack(g, at(g, 'p2', 'characters', SHIKI), at(g, 'p1', 'characters', SH));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  }

  it('paying 1 hand card returns Shamrock from the trash to the field (active)', () => {
    const g = falls([CH.marco3, MISS]);
    yes(g, 'p1');
    payHand(g, [CH.marco3]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([SH]);
    expect(g.card(at(g, 'p1', 'characters', SH)).rested).toBe(false);
    expect(cardIds(g, 'p1', 'trash')).toEqual([CH.marco3]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([MISS]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('declining leaves Shamrock in the trash', () => {
    const g = falls([CH.marco3]);
    decline(g);
    expect(cardIds(g, 'p1', 'trash')).toEqual([SH]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([CH.marco3]);
  });

  it('with an empty hand the cost cannot be paid', () => {
    const g = falls([]);
    unusable(g, 'p1');
    expect(cardIds(g, 'p1', 'trash')).toEqual([SH]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('does not fire when Shamrock survives (a 7000 attacker cannot K.O. 9000)', () => {
    const g = theirsE(
      LDR.luffy,
      { characters: [{ card: SH, rested: true }], hand: [MISS] },
      { characters: [CH.kingdew5] },
    );
    attack(g, at(g, 'p2', 'characters', CH.kingdew5), at(g, 'p1', 'characters', SH));
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p1', 'characters')).toEqual([SH]);
  });
});
