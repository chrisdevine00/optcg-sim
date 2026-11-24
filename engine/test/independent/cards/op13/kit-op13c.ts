/**
 * Helpers for the OP-13 group-C independent card tests. Public API, frozen fixtures and the
 * earlier kits only. Answer helpers accept ONE named kind of prompt and fail on anything else, so
 * a missing or extra "up to" / "you may" prompt is caught (EB05-R4, empty-pick investigation).
 */
import { describe, expect, it } from 'vitest';
import type { CardId, InstanceId, PlayerId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, attack, passBlock } from '../../helpers.ts';
import {
  accept,
  canHit,
  choose,
  decision,
  donChoices,
  donOf14,
  kind,
  mine,
  need,
  no,
  payDon,
  playRaw,
  yes,
  theirs,
  LIGHTNING,
} from '../op14/kit-op14c.ts';

export * from '../op14/kit-op14c.ts';
export type { PlayerSpec };

/** Leaders used as scenery. */
export const LD13 = {
  /** OP13-003 Gol.D.Roger: Purple/Red, 7000, 5 Life, {Roger Pirates}/{King of the Pirates}. -2000 power with 9 or less DON!!. */
  roger: 'OP13-003',
  /** OP12-001 Silvers Rayleigh: Red, 5000, 5 Life, {Former Roger Pirates}: a type INCLUDING "Roger Pirates", not [Gol.D.Roger]. */
  rogerPiratesLeader: 'OP12-001',
  /** OP13-079 Imu: Black, 5 Life. Only a deck rule, a start-of-game play and an [Activate: Main]. */
  imu: 'OP13-079',
  /** OP07-001 Monkey.D.Dragon: Red, 5000, 5 Life, {Revolutionary Army}. [Activate: Main] only. */
  ra: 'OP07-001',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. Vanilla: no type any group-C card looks for. */
  plain: 'ST01-001',
} as const;

/** Scenery cards with the stats the tests rely on. */
export const S13 = {
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000. */
  c1: 'OP01-010',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. */
  c2: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. */
  c3: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. */
  c4: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. */
  c5: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. */
  c6: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. */
  c7: 'OP02-020',
  /** OP12-012 Buggy: Red, cost 2, 2000, {Roger Pirates}. Only an [On Play]: inert on the field. */
  rp2: 'OP12-012',
  /** OP12-007 Shanks: Red, cost 2, 2000, {Roger Pirates}. Only an [On Play]: inert on the field. Named [Shanks]. */
  shanksRp: 'OP12-007',
  /** EB01-041 Crocus: Black, cost 6, 8000, {Former Roger Pirates}. Vanilla. */
  formerRp6: 'EB01-041',
  /** OP12-010 Douglas Bullet: Red, cost 6, 7000, {FILM}/{The Pirates Fest}/{Former Roger Pirates}. Vanilla. */
  formerRp6b: 'OP12-010',
  /** OP13-062 Crocus: Purple, cost 5, 6000, {Roger Pirates}. A Roger Pirates card for decks. */
  rp5: 'OP13-062',
  /** OP13-063 Kouzuki Oden: Purple, cost 5, 6000, {Land of Wano}/{Kouzuki Clan}/{Roger Pirates}. */
  rp5b: 'OP13-063',
  /** OP04-113 Rabiyan: Yellow, cost 2, 3000, {Big Mom Pirates}/{Homies}. [Trigger] only. */
  homies3: 'OP04-113',
  /** OP03-100 Kingbaum: Yellow, cost 3, 5000, {Big Mom Pirates}/{Homies}. Vanilla. */
  homies5: 'OP03-100',
  /** OP08-107 Nitro: Yellow, cost 1, 2000, {Big Mom Pirates}/{Homies}. [Activate: Main] only. */
  homies2: 'OP08-107',
  /** ST05-007 Gordon: Purple, cost 1, 3000, Counter +1000, {FILM}. Vanilla: 3000 power but not a Homies. */
  gordon: 'ST05-007',
  /** OP03-075 Galley-La Company: Purple Stage, cost 3, [Activate: Main] only. */
  stage3: 'OP03-075',
  /** OP05-040 Birdcage: Green Stage, cost 5. */
  stage5: 'OP05-040',
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000. A plain filler. */
  filler: 'OP02-060',
  /** OP01-104 Speed: Purple, cost 2, 3000, "[Trigger] Play this card." */
  speed: 'OP01-104',
  /** OP13-080 St. Ethanbaron V. Nusjuro: Black, cost 6, 5000, {Celestial Dragons}/{Five Elders}. */
  nusjuro: 'OP13-080',
  /** OP13-083 St. Jaygarcia Saturn: Black, cost 4, 5000, {Celestial Dragons}/{Five Elders}. */
  saturn: 'OP13-083',
  /** OP13-089 St. Topman Warcury: Black, cost 4, 5000, {Celestial Dragons}/{Five Elders}. [On K.O.] draw 1. */
  warcury: 'OP13-089',
  /** OP13-085 Saint Jalmac: Black, cost 2, 4000, {Celestial Dragons}. Vanilla. */
  jalmac: 'OP13-085',
  /** OP05-084 Saint Charlos: Black, cost 3, 0, {Celestial Dragons}. Only a [Your Turn] effect. */
  cd3: 'OP05-084',
} as const;

/** A list of placed Characters (card ids or placements). */
export type Placed = NonNullable<PlayerSpec['characters']>;

/** Removal events played by p2 in a game built with `theirs` (p1 defends). */
export const BOUNCE = 'OP17-056';
export const BOTTOM = 'OP17-046';
export { LIGHTNING };

/** p2's hand with every removal effect, plus a second Lightning. */
export const P2_HAND: CardId[] = [LIGHTNING, LIGHTNING, BOUNCE, BOTTOM];

/** p2's Main Phase; p1 defends with `spec` and p2 holds the removal cards. */
export function defend(
  leader: string,
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  p2Leader?: string,
): TestGame {
  return theirs(leader, p1, { hand: P2_HAND, ...p2 }, p2Leader);
}

/** p2 plays Lightning (DON!! -2) and picks `target`. Stops at the first decision p1 owes. */
export function ko(g: TestGame, target: InstanceId): void {
  act(g, { type: 'playCard', card: g.find('p2', 'hand', LIGHTNING) });
  accept(g);
  payDon(g, 2);
  choose(g, [target]);
}

/** p2 plays OP17-056 (rest 5 DON!!): return `target` (cost 6 or less) to its owner's hand. */
export function bounce(g: TestGame, target: InstanceId): void {
  act(g, { type: 'playCard', card: g.find('p2', 'hand', BOUNCE) });
  accept(g);
  payDon(g, 5);
  choose(g, [target]);
}

/** p2 plays OP17-046 Gloriosa: place `target` (cost 5 or less) at the bottom of its owner's deck. */
export function toBottom(g: TestGame, target: InstanceId): void {
  act(g, { type: 'playCard', card: g.find('p2', 'hand', BOTTOM) });
  choose(g, [target]);
}

/**
 * p2 tries to K.O. `target` with Lightning. If the engine does not offer the Character as a target
 * (it cannot be removed), the choice is left empty. Either way the test asserts the outcome.
 */
export function tryKo(g: TestGame, target: InstanceId): void {
  act(g, { type: 'playCard', card: g.find('p2', 'hand', LIGHTNING) });
  accept(g);
  payDon(g, 2);
  finishTry(g, target);
}

/** Pick `target` if the pending choose of p2 offers it; end an empty or target-less choose. */
function finishTry(g: TestGame, target: InstanceId): void {
  const d = decision(g);
  if (d?.kind !== 'choose' || d.player !== 'p2') return;
  const offered = g.legal().some((a) => a.type === 'pick' && a.choice === target);
  if (offered) choose(g, [target]);
  else if (g.legal().some((a) => a.type === 'done')) act(g, { type: 'done' });
}

/** Like `tryKo` with the bounce event. */
export function tryBounce(g: TestGame, target: InstanceId): void {
  act(g, { type: 'playCard', card: g.find('p2', 'hand', BOUNCE) });
  accept(g);
  payDon(g, 5);
  finishTry(g, target);
}

/** p2's Leader (5000) attacks `target`; p1 neither blocks nor counters. Stops at the first later decision. */
export function battleOn(g: TestGame, target: InstanceId, attacker?: InstanceId): void {
  attack(g, attacker ?? g.leader('p2'), target);
  passBlock(g);
  if (kind(g) === 'counter') act(g, { type: 'endCounter' });
}

/** A trash of `n` plain cards. */
export function junk(n: number): CardId[] {
  return Array.from({ length: n }, () => S13.c2);
}

/** n copies of a card. */
export function many(card: CardId, n: number): CardId[] {
  return Array.from({ length: n }, () => card);
}

/** A deck of the given top cards (top first) followed by `pad` plain cards. */
export function deckTop(top: CardId[], pad = 10): CardId[] {
  return [...top, ...many(S13.filler, pad)];
}

/** p1's Main Phase (turn 3) with 5 active DON!! (5 left in the DON!! deck) unless `spec` says otherwise. */
export function me(
  leader: string | { card: CardId; don?: number },
  spec: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  p2Leader?: string,
): TestGame {
  return mine(leader, { costArea: { active: 5, rested: 0 }, ...spec }, p2, p2Leader);
}

/** Count of cards in a zone as a number. */
export function size(g: TestGame, who: PlayerId, zone: Parameters<TestGame['zone']>[1]): number {
  return g.zone(who, zone).length;
}

/** The DON!! on the field of `who`: cost area plus given. */
export function field(g: TestGame, who: PlayerId = 'p1'): number {
  const d = donOf14(g, who);
  return d.active + d.rested + d.given;
}

/** Pick one pending DON!! class `from` (a "DON!! −N" or "rest N DON!!" cost), strictly. */
export function payDonOnce(
  g: TestGame,
  from: 'costActive' | 'costRested' | 'given' = 'costActive',
) {
  need(g, 'choose');
  const want = donChoices(g).find((o) => o.from === from);
  if (!want) throw new Error(`No ${from} DON!! offered`);
  act(g, { type: 'pick', choice: want });
}

/** End p1's turn and answer any count question p1 owes on the way with the most (end-of-turn adds). Stops at p2's Main. */
export function endMyTurn(g: TestGame): void {
  act(g, { type: 'endTurn' });
  for (let i = 0; i < 10; i++) {
    const d = decision(g);
    if (!d || d.player !== 'p1') break;
    if (d.kind === 'choose' && d.purpose === 'mode' && d.options?.length) {
      act(g, { type: 'pick', choice: { option: d.options[0]!.id } });
    } else break;
  }
  need(g, 'main', 'p2');
  expect(kind(g)).toBe('main');
}

/**
 * "If you have 7 or more cards in your trash, this Character cannot be removed from the field by
 * your opponent's effects" (OP13-080, OP13-083, and "gains [Rush]" on OP13-080). The Character is on
 * p1's field in `defend` games; p2 holds Lightning (K.O.) and OP17-056 (return to hand).
 */
export function describeShield(cfg: { id: CardId; rush: boolean }): void {
  const { id, rush } = cfg;
  const shielded = (trashN: number, p2TrashN = 0) =>
    defend(
      LD13.plain,
      { characters: [id], trash: junk(trashN) },
      p2TrashN ? { trash: junk(p2TrashN) } : {},
    );
  describe(`${id} with 7 or more cards in my trash it cannot be removed from the field by the opponent's effects`, () => {
    it('7 cards in the trash: the opponent’s K.O. effect does not remove it', () => {
      const g = shielded(7);
      tryKo(g, g.find('p1', 'characters', id));
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([id]);
      expect(g.zone('p1', 'trash')).toHaveLength(7);
    });

    it('boundary: 6 cards in the trash: the same effect K.O.s it', () => {
      const g = shielded(6);
      tryKo(g, g.find('p1', 'characters', id));
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(id);
    });

    it('7 cards: the opponent’s return-to-hand effect does not remove it either ("removed from the field")', () => {
      const g = shielded(7);
      tryBounce(g, g.find('p1', 'characters', id));
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([id]);
      expect(g.zone('p1', 'hand')).toHaveLength(0);
    });

    it('6 cards: the return-to-hand effect works', () => {
      const g = shielded(6);
      tryBounce(g, g.find('p1', 'characters', id));
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([id]);
    });

    it('the count is of MY trash: 7 cards in the opponent’s trash and 6 in mine does not protect it', () => {
      const g = shielded(6, 7);
      tryKo(g, g.find('p1', 'characters', id));
      expect(g.zone('p1', 'characters')).toHaveLength(0);
    });

    it('a battle K.O. is not an effect: with 7 cards in the trash a rested Character is still K.O.’d by an attack', () => {
      const g = defend(LD13.plain, {
        characters: [{ card: id, rested: true }],
        trash: junk(7),
      });
      battleOn(g, g.find('p1', 'characters', id));
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(id);
    });

    it('only the OPPONENT’s effects are blocked: my own effect can still return it (OP13-059 Brilliant Punk cost)', () => {
      const g = me(LD13.plain, { characters: [id], trash: junk(7), hand: ['OP13-059'] });
      playRaw(g, 'OP13-059');
      need(g, 'optional', 'p1');
      yes(g, 'p1');
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([id]);
      void no;
    });

    if (rush) {
      it('[Rush] with 7 cards in the trash: it can attack the turn it is played', () => {
        const g = me(LD13.plain, {
          characters: [{ card: id, playedThisTurn: true }],
          trash: junk(7),
        });
        const i = g.find('p1', 'characters', id);
        expect(g.card(i).keywords).toContain('Rush');
        expect(canHit(g, i, g.leader('p2'))).toBe(true);
      });

      it('boundary: with 6 cards in the trash it has no [Rush] and cannot attack the turn it is played', () => {
        const g = me(LD13.plain, {
          characters: [{ card: id, playedThisTurn: true }],
          trash: junk(6),
        });
        const i = g.find('p1', 'characters', id);
        expect(g.card(i).keywords).not.toContain('Rush');
        expect(canHit(g, i, g.leader('p2'))).toBe(false);
      });
    }
  });
}
