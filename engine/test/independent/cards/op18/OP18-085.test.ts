/**
 * OP18-085 Cerberus (Black Character, cost 1, 0, Counter +2000, {Holy Knights of God}).
 *
 * Card text: "[Activate: Main] You may return this Character to the owner's hand: Up to 1 of your
 *             [Saint Shamrock] Characters gains [Rush], [Banish] or [Unblockable] during this turn."
 *
 * Reading (m6b-audit Q17): the player chooses one keyword (mode 0 Rush, 1 Banish, 2 Unblockable),
 * then the Shamrock; Cerberus is returned to hand first as the cost. Scenery: OP18-119 Saint
 * Shamrock (cost 8, 9000), OP18-088 Saint Sommers (another {HKG}, not named Shamrock), OP18-094 as
 * a Life card with a [Trigger] (to see Banish), OP09-072 Franky ([Blocker], to see Unblockable).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  atMain,
  canHit,
  cardIds,
  kind,
  kw,
  need,
  none,
  offeredIds,
  passBlock,
  passCounter,
  pickCards,
  toMyNextMain,
  useAbility,
  blockers,
  LDR,
} from './kit-e.ts';
import { mineE, pickOption, X } from './kit-e.ts';

const C = X.cerberus;
const SH = X.shamrock;
const SOMM = X.sommers;
const BLOCKER = 'OP09-072';
const MISS = 'OP02-060';

/** Activate Cerberus, choose keyword mode `mode`, and pick the Shamrock. */
function grant(g: ReturnType<typeof mineE>, mode: '0' | '1' | '2') {
  useAbility(g, at(g, 'p1', 'characters', C));
  pickOption(g, mode);
  pickCards(g, [SH]);
}
const fresh = (p2: object = {}, shRested = false) =>
  mineE(LDR.luffy, { characters: [C, { card: SH, playedThisTurn: true, rested: shRested }] }, p2);

describe('OP18-085 Cerberus: [Activate: Main] return this Character: [Saint Shamrock] gains [Rush], [Banish] or [Unblockable]', () => {
  it('the cost: Cerberus returns to the owner’s hand', () => {
    const g = fresh();
    grant(g, '0');
    expect(cardIds(g, 'p1', 'hand')).toEqual([C]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([SH]);
    expect(atMain(g, 'p1')).toBe(true);
  });

  it('Rush: a Shamrock played this turn can then attack the Leader', () => {
    const g = fresh();
    const sh = at(g, 'p1', 'characters', SH);
    expect(canHit(g, sh, g.leader('p2'))).toBe(false);
    grant(g, '0');
    expect(kw(g, sh)).toContain('Rush');
    expect(canHit(g, sh, g.leader('p2'))).toBe(true);
  });

  it('Banish: the Shamrock’s hit trashes the Life card; its [Trigger] cannot be used', () => {
    const g = mineE(LDR.luffy, { characters: [C, SH] }, { life: ['OP18-094', MISS, MISS, MISS] });
    grant(g, '1');
    attack(g, at(g, 'p1', 'characters', SH), g.leader('p2'));
    passBlock(g);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p2', 'trash')).toEqual(['OP18-094']);
    expect(cardIds(g, 'p2', 'hand')).toEqual([]);
    expect(g.life('p2')).toBe(3);
  });

  it('Unblockable: the opponent’s [Blocker] cannot be used against the Shamrock', () => {
    const g = mineE(LDR.luffy, { characters: [C, SH] }, { characters: [BLOCKER] });
    grant(g, '2');
    attack(g, at(g, 'p1', 'characters', SH), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('only the chosen keyword is gained: Banish alone gives neither Rush nor Unblockable', () => {
    const g = fresh();
    grant(g, '1');
    const k = kw(g, at(g, 'p1', 'characters', SH));
    expect(k).toContain('Banish');
    expect(k).not.toContain('Rush');
    expect(k).not.toContain('Unblockable');
  });

  it('control: without Cerberus’s effect the same Shamrock has none of the three and cannot attack on its turn of play', () => {
    const g = fresh();
    const k = kw(g, at(g, 'p1', 'characters', SH));
    expect(k).not.toContain('Rush');
    expect(k).not.toContain('Banish');
    expect(k).not.toContain('Unblockable');
  });

  it('only a Character named [Saint Shamrock] is a target (Saint Sommers is not offered)', () => {
    const g = mineE(LDR.luffy, { characters: [C, SH, SOMM] });
    useAbility(g, at(g, 'p1', 'characters', C));
    pickOption(g, '0');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SH]);
    none(g);
  });

  it('only my own Shamrock: the opponent’s is not offered', () => {
    const g = mineE(LDR.luffy, { characters: [C, SH] }, { characters: [SH] });
    useAbility(g, at(g, 'p1', 'characters', C));
    pickOption(g, '0');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pickCards(g, [SH]);
    expect(kw(g, at(g, 'p2', 'characters', SH))).not.toContain('Rush');
  });

  it('"up to 1": the Shamrock may be left out; Cerberus is still returned', () => {
    const g = mineE(LDR.luffy, { characters: [C, SH] });
    useAbility(g, at(g, 'p1', 'characters', C));
    pickOption(g, '0');
    none(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([C]);
    expect(kw(g, at(g, 'p1', 'characters', SH))).not.toContain('Rush');
  });

  it('the keyword lasts only during this turn', () => {
    const g = mineE(LDR.luffy, { characters: [C, SH] });
    grant(g, '1');
    expect(kw(g, at(g, 'p1', 'characters', SH))).toContain('Banish');
    toMyNextMain(g);
    expect(kw(g, at(g, 'p1', 'characters', SH))).not.toContain('Banish');
  });
});
