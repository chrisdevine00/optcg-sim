/**
 * EB03-007 Baccarat (Character, Red, cost 4, 5000, Counter +1000, Special, {FILM}/{Grantesoro}).
 *
 * Card text: "[Blocker] [On K.O.] Play up to 1 Character card with 6000 power or less and no base
 * effect from your hand."
 *
 * Rules: CR 10-1-4 ([Blocker]: only an active, rested-by-blocking Character blocks), CR 10-2-?
 * ([On K.O.] fires when this Character is K.O.'d, in battle or by an effect), CR 4-8-1 ("up to"),
 * M6b-Q29 (keyword-only text is no base effect). Convention: an "up to" pick over the hand with a
 * filter is asked (max 0 when nothing matches) so the prompt does not tell the opponent anything.
 *
 * Scenery (printed): OP02-020 LittleOars Jr. 9000 (attacker), OP01-010 Komachiyo 3000.
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import { act, attack, blockers, decision } from '../../helpers.ts';
import { side, theirTurn } from '../kit.ts';
import {
  BLUE,
  isChoose,
  kw,
  LW,
  mayEnd,
  need,
  none,
  offeredCards,
  ofZone,
  pickCards,
  RED,
  restedOf,
  SC6,
  yes,
} from './kit-w6a.ts';

const ID = 'EB03-007';

/** p2's turn: p1 holds Baccarat (and `chars`) and `hand`; p2 has `attackers` and `theirHand`. */
function theirs(
  o: {
    chars?: PlayerSpec['characters'];
    hand?: CardId[];
    attackers?: CardId[];
    theirHand?: CardId[];
    theirDon?: number;
    leader?: string;
  } = {},
) {
  return theirTurn(
    side(LW.luffy, BLUE, { characters: o.chars ?? [ID], hand: o.hand ?? [] }),
    side(o.leader ?? LW.luffy, RED, {
      characters: o.attackers ?? [SC6.c9k],
      hand: o.theirHand ?? [],
      costArea: { active: o.theirDon ?? 3, rested: 0 },
    }),
  );
}

/** p2's first attacker hits p1's Leader and p1 blocks with Baccarat; p1 does not counter. */
function blockWithBaccarat(g: ReturnType<typeof theirs>, attacker: CardId = SC6.c9k) {
  attack(g, g.find('p2', 'characters', attacker), g.leader('p1'));
  expect(blockers(g)).toEqual([g.find('p1', 'characters', ID)]);
  act(g, { type: 'block', blocker: g.find('p1', 'characters', ID), player: 'p1' });
  act(g, { type: 'endCounter', player: 'p1' });
}

describe('EB03-007 Baccarat: [Blocker]; [On K.O.] play up to 1 vanilla 6000-or-less Character from hand', () => {
  it('has [Blocker] and is offered as the only blocker', () => {
    const g = theirs();
    expect(kw(g, g.find('p1', 'characters', ID))).toContain('Blocker');
    attack(g, g.find('p2', 'characters', SC6.c9k), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', ID)]);
  });

  it("blocks a 9000 attacker, is K.O.'d, and then plays a matching Character from hand (active)", () => {
    const g = theirs({ hand: [SC6.c6k, SC6.c7k] });
    blockWithBaccarat(g);
    need(g, 'choose', 'p1');
    expect(offeredCards(g)).toEqual([SC6.c6k]);
    pickCards(g, [SC6.c6k]);
    need(g, 'main', 'p2');
    expect(ofZone(g, 'p1', 'characters')).toEqual([SC6.c6k]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([ID]);
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.c7k]);
    expect(restedOf(g, 'p1', SC6.c6k)).toEqual([false]);
  });

  it("also fires when it is K.O.'d as the target of an attack (rested)", () => {
    const g = theirs({ chars: [{ card: ID, rested: true }], hand: [SC6.c4k] });
    attack(g, g.find('p2', 'characters', SC6.c9k), g.find('p1', 'characters', ID));
    act(g, { type: 'block', blocker: null, player: 'p1' });
    act(g, { type: 'endCounter', player: 'p1' });
    need(g, 'choose', 'p1');
    pickCards(g, [SC6.c4k]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([SC6.c4k]);
  });

  it('filter: 6000 and a keyword-only Blocker are offered; 7000, a base effect and an Event are not', () => {
    const g = theirs({ hand: [SC6.c6k, SC6.blenheim, SC6.c7k, SC6.zala, 'OP02-022', SC6.raizo] });
    blockWithBaccarat(g);
    expect(offeredCards(g)).toEqual([SC6.c6k, SC6.blenheim].sort());
  });

  it('"up to 1": the pick may be ended with nothing and the hand is unchanged', () => {
    const g = theirs({ hand: [SC6.c6k] });
    blockWithBaccarat(g);
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    expect(decision(g)?.max).toBe(1);
    none(g);
    need(g, 'main', 'p2');
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.c6k]);
  });

  it('with an empty hand the pick is still asked, empty (no hidden-hand dependence)', () => {
    const g = theirs({ hand: [] });
    blockWithBaccarat(g);
    expect(isChoose(g, 'p1')).toBe(true);
    expect(offeredCards(g)).toEqual([]);
    expect(decision(g)?.max).toBe(0);
    none(g);
    need(g, 'main', 'p2');
  });

  it("a Baccarat that wins the battle (blocks a 3000 attacker) is not K.O.'d: no [On K.O.]", () => {
    const g = theirs({ hand: [SC6.c6k], attackers: [SC6.c3k] });
    blockWithBaccarat(g, SC6.c3k);
    need(g, 'main', 'p2');
    expect(ofZone(g, 'p1', 'characters')).toEqual([ID]);
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.c6k]);
  });

  it('a K.O. by an opponent effect fires it too (Gum-Gum Lightning, 6000 or less)', () => {
    const g = theirs({
      hand: [SC6.c6k],
      leader: 'ST04-001',
      attackers: [],
      theirHand: ['OP09-077'],
      theirDon: 4,
    });
    act(g, { type: 'playCard', card: g.find('p2', 'hand', 'OP09-077') });
    for (let i = 0; i < 12 && decision(g)?.player === 'p2'; i++) {
      const d = decision(g);
      if (d?.kind === 'optional') yes(g, 'p2');
      else if (d?.kind === 'choose') {
        const p = g.legal().find((a) => a.type === 'pick');
        if (!p) break;
        g.act(p);
      } else break;
    }
    need(g, 'choose', 'p1');
    expect(offeredCards(g)).toEqual([SC6.c6k]);
    pickCards(g, [SC6.c6k]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([SC6.c6k]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([ID]);
  });

  it("a full field of 5 leaves room: after Baccarat is K.O.'d the new Character is played without trashing another", () => {
    const g = theirs({
      chars: [ID, SC6.c3k, SC6.c3k, SC6.c3k, SC6.c3k],
      hand: [SC6.c6k],
    });
    blockWithBaccarat(g);
    need(g, 'choose', 'p1');
    pickCards(g, [SC6.c6k]);
    need(g, 'main', 'p2');
    expect(ofZone(g, 'p1', 'characters')).toEqual(
      [SC6.c6k, SC6.c3k, SC6.c3k, SC6.c3k, SC6.c3k].sort(),
    );
    expect(ofZone(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('a rested Baccarat cannot block', () => {
    const g = theirs({ chars: [{ card: ID, rested: true }] });
    attack(g, g.find('p2', 'characters', SC6.c9k), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });
});
