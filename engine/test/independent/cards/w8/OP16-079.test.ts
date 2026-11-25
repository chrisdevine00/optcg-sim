/**
 * OP16-079 Yamato (Leader, Black, 5000, 5 Life, {Land of Wano}).
 *
 * Card text: "When a {Land of Wano} type Character card is played from your trash, that Character gains
 * [Rush] during this turn. (This card can attack on the turn in which it is played.)"
 *
 * Rules used: [Rush] (CR 10-1-1) lets a Character attack the turn it is played; "from your trash"
 * means the controller's own trash and a play from the hand or any other zone is not covered; the
 * grant is to the Character just played, for the turn only ("during this turn" ends in the End
 * Phase); the Character's types are read from its printed list (a card with several types counts);
 * the official OP16 Q&A says a Character played from the trash and then negated can still attack
 * (the grant belongs to the Leader). M6b-Q11 (any play from the trash, by any effect) is a reading
 * kept by the engine: the effects used here are plain "play from your trash" effects.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  asksDon,
  at,
  attack,
  C8,
  canAttackAnything,
  canHit,
  choices,
  decision,
  endTurn,
  expectOffered,
  kind,
  kw,
  L8,
  mine8,
  need,
  noDefence,
  none,
  pickCardId,
  pickDonClass,
  sortedCards,
  yes,
} from './kit-w8a.ts';

const YAMATO = L8.yamato;
const LUFFY8 = 'OP17-093'; // Black, cost 8, 8000: [On Play] Draw 1 card and play up to 1 Character with a cost of 2 or less from your trash.
const CUT_CHAINS = 'OP16-099'; // Black Event, cost 1, {Land of Wano}: [Main] You may rest 6 DON!!: trash 5 from the deck, then play up to 1 {Land of Wano} Character with a cost of 6 or less from your trash.
const MOMONOSUKE9 = 'OP16-085'; // Black, cost 9, 6000, [Blocker], {Land of Wano}: [On Play] play up to 1 {Land of Wano} Character with a cost of 6 or less other than [Kouzuki Momonosuke] from your trash.

/** Luffy (cost 8) is played; its [On Play] asks for a Character with cost 2 or less in the trash. */
function luffyPlayed(trash: string[], leader: string = YAMATO) {
  const g = mine8(leader, { hand: [LUFFY8], trash });
  act(g, { type: 'playCard', card: g.find('p1', 'hand', LUFFY8) });
  return g;
}

/** The Event "I've Come Here... To Cut Those Chains!!!": cost paid, 5 cards trashed, the trash pick pending. */
function chainsToPick(trash: string[], leader: string = YAMATO) {
  const g = mine8(leader, { hand: [CUT_CHAINS], trash });
  act(g, { type: 'playCard', card: g.find('p1', 'hand', CUT_CHAINS) });
  need(g, 'optional', 'p1');
  yes(g, 'p1');
  for (let i = 0; i < 8 && asksDon(g, 'p1'); i++) pickDonClass(g, 'costActive');
  need(g, 'choose', 'p1');
  return g;
}

describe('OP16-079 Yamato: a {Land of Wano} Character played from your trash gains [Rush] this turn', () => {
  it('a {Land of Wano} Character played from the trash by an effect has [Rush] and can attack at once', () => {
    const g = luffyPlayed([C8.komachiyo]);
    expectOffered(g, 'p1', [C8.komachiyo]);
    pickCardId(g, C8.komachiyo);
    need(g, 'main', 'p1');
    const k = at(g, 'p1', 'characters', C8.komachiyo);
    expect(kw(g, k)).toContain('Rush');
    expect(canHit(g, k, g.leader('p2'))).toBe(true);
  });

  it('the Rush attack really lands: Shinobu (5000) played from the trash by "Cut Those Chains" attacks the 5000 Leader and removes a Life card', () => {
    const g = chainsToPick([C8.shinobu]);
    expectOffered(g, 'p1', [C8.shinobu]);
    pickCardId(g, C8.shinobu);
    need(g, 'main', 'p1');
    const s = at(g, 'p1', 'characters', C8.shinobu);
    expect(kw(g, s)).toContain('Rush');
    attack(g, s, g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('the same Character played from the HAND does not get [Rush] (summoning sickness applies)', () => {
    const g = mine8(YAMATO, { hand: [C8.shinobu] });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', C8.shinobu) });
    const s = at(g, 'p1', 'characters', C8.shinobu);
    expect(kw(g, s)).not.toContain('Rush');
    expect(canAttackAnything(g, s)).toBe(false);
  });

  it('a Character that does not have the {Land of Wano} type played from the trash gets no [Rush]', () => {
    const g = luffyPlayed([C8.mohji]);
    pickCardId(g, C8.mohji);
    need(g, 'main', 'p1');
    const m = at(g, 'p1', 'characters', C8.mohji);
    expect(kw(g, m)).not.toContain('Rush');
    expect(canAttackAnything(g, m)).toBe(false);
  });

  it('with both kinds in the trash, only the {Land of Wano} one that is picked gets [Rush]; the other cards on the field and the played Luffy do not', () => {
    const g = luffyPlayed([C8.mohji, C8.komachiyo]);
    expectOffered(g, 'p1', [C8.mohji, C8.komachiyo]);
    pickCardId(g, C8.komachiyo);
    expect(kw(g, at(g, 'p1', 'characters', C8.komachiyo))).toContain('Rush');
    expect(kw(g, at(g, 'p1', 'characters', LUFFY8))).not.toContain('Rush');
    expect(kw(g, g.leader('p1'))).not.toContain('Rush');
    expect(sortedCards(g, 'p1', 'trash')).toEqual([C8.mohji]);
  });

  it('only the Character just played: another Character already on the field does not gain [Rush]', () => {
    const g = mine8(YAMATO, {
      hand: [LUFFY8],
      trash: [C8.komachiyo],
      characters: [{ card: C8.sai, playedThisTurn: true }],
    });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', LUFFY8) });
    pickCardId(g, C8.komachiyo);
    expect(kw(g, at(g, 'p1', 'characters', C8.sai))).not.toContain('Rush');
    expect(canAttackAnything(g, at(g, 'p1', 'characters', C8.sai))).toBe(false);
  });

  it('a {Land of Wano} Character with several types counts: Kawamatsu ({Fish-Man}/{Land of Wano}/{The Akazaya Nine}, cost 5)', () => {
    const g = chainsToPick([C8.kawamatsu]);
    pickCardId(g, C8.kawamatsu);
    expect(kw(g, at(g, 'p1', 'characters', C8.kawamatsu))).toContain('Rush');
  });

  it("[Rush] lasts for this turn only: it is gone during the opponent's turn", () => {
    const g = luffyPlayed([C8.komachiyo]);
    pickCardId(g, C8.komachiyo);
    const k = at(g, 'p1', 'characters', C8.komachiyo);
    expect(kw(g, k)).toContain('Rush');
    endTurn(g);
    need(g, 'main', 'p2');
    expect(kw(g, k)).not.toContain('Rush');
  });

  it("a {Land of Wano} Character played from the trash by another {Land of Wano} Character's [On Play] (Kouzuki Momonosuke) gets [Rush]; Momonosuke, played from the hand, does not", () => {
    const g = mine8(YAMATO, { hand: [MOMONOSUKE9], trash: [C8.shinobu] });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', MOMONOSUKE9) });
    expectOffered(g, 'p1', [C8.shinobu]);
    pickCardId(g, C8.shinobu);
    expect(kw(g, at(g, 'p1', 'characters', C8.shinobu))).toContain('Rush');
    const m = at(g, 'p1', 'characters', MOMONOSUKE9);
    expect(kw(g, m)).not.toContain('Rush');
    expect(canAttackAnything(g, m)).toBe(false);
  });

  it('"up to 1": playing nothing from the trash grants nothing and leaves the trash as it was', () => {
    const g = luffyPlayed([C8.komachiyo]);
    none(g);
    expect(sortedCards(g, 'p1', 'trash')).toEqual([C8.komachiyo]);
    expect(sortedCards(g, 'p1', 'characters')).toEqual([LUFFY8]);
  });

  it('without this Leader no [Rush] is given: the same play under a different {Land of Wano} Leader (ST09-001 Yamato) leaves the Character unable to attack', () => {
    const g = luffyPlayed([C8.komachiyo], L8.yamatoYellow);
    pickCardId(g, C8.komachiyo);
    const k = at(g, 'p1', 'characters', C8.komachiyo);
    expect(kw(g, k)).not.toContain('Rush');
    expect(canAttackAnything(g, k)).toBe(false);
  });

  it('only "your" trash and "your" Leader: the opponent having this Leader gives my Character played from my trash nothing', () => {
    const g = mine8(L8.luffy, { hand: [LUFFY8], trash: [C8.komachiyo] }, {}, YAMATO);
    act(g, { type: 'playCard', card: g.find('p1', 'hand', LUFFY8) });
    pickCardId(g, C8.komachiyo);
    const k = at(g, 'p1', 'characters', C8.komachiyo);
    expect(kw(g, k)).not.toContain('Rush');
    expect(canAttackAnything(g, k)).toBe(false);
  });

  it('a non-Wano Character is an ordinary candidate of the Luffy effect and the Leader adds no question and no [Rush]', () => {
    const g = luffyPlayed([C8.sai]);
    // Luffy's own pick is asked (the Character is a cost-2 candidate); the Leader adds nothing to it.
    expect(kind(g)).toBe('choose');
    expect(choices(g).length).toBe(1);
    expect(decision(g)!.player).toBe('p1');
    pickCardId(g, C8.sai);
    expect(kw(g, at(g, 'p1', 'characters', C8.sai))).not.toContain('Rush');
  });
});
