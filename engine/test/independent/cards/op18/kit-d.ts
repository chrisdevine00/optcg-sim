/**
 * Helpers for the OP-18 group-D independent card tests (OP18-041 .. OP18-084). Public API, frozen
 * fixtures and the earlier kits only. Scenery stats are noted next to each constant; tests repeat
 * the ones they rely on. None of the scenery has a script that fires in the positions used.
 */
import type { InstanceId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, attack, decision, noDefence, play } from '../../helpers.ts';
import { describe, expect, it } from 'vitest';
import { accept, choose, mine, offered, payDon, RED, side, theirTurn } from './kit-ga.ts';

export * from './kit-ga.ts';

/** Baroque Works scenery (vanilla, or unscripted with text that has no effect in the engine). */
export const BW = {
  /** OP18-043 Accelegator: Blue, cost 4, 6000, Counter +1000, {Animal}/{Alabasta}/{Baroque Works}. Vanilla. */
  accel4: 'OP18-043',
  /** OP14-095 Mr.9: Black, cost 5, 6000, Counter +2000, {Baroque Works}. Vanilla. */
  mr9: 'OP14-095',
  /** OP09-055 Mr.1(Daz.Bonez): Blue, cost 5, 7000, Counter +1000, {Former Baroque Works}/{Cross Guild}. Vanilla. */
  formerBw5: 'OP09-055',
  /** OP02-053 Crocodile: Blue, cost 5, 7000, Counter +1000, {Impel Down}/{Former Baroque Works}. Vanilla. */
  formerBw5b: 'OP02-053',
  /** ST30-013 Mr.2.Bon.Kurei(Bentham): Green, cost 4, 6000, Counter +1000, {Impel Down}/{Former Baroque Works}. Vanilla. */
  formerBw4: 'ST30-013',
  /** OP01-083 Mr.1: Blue, cost 2, 3000, Counter +1000, {Baroque Works}. Unscripted ([DON!! x1] text only). */
  bw2: 'OP01-083',
  /** OP04-066 Miss.Valentine(Mikita): Purple, cost 2, 2000, Counter +1000, {Baroque Works}. Unscripted. */
  bw2weak: 'OP04-066',
  /** OP02-063 Mr.1: Blue, cost 1, 1000, Counter +1000, {Impel Down}/{Former Baroque Works}. Unscripted. */
  bw1weak: 'OP02-063',
  /** OP01-080 Miss Doublefinger(Zala): Blue, cost 3, 4000, Counter +1000, {Baroque Works}. Unscripted. */
  bw3: 'OP01-080',
  /** EB01-034 Ms. Wednesday: Purple, cost 3, 4000, Counter +1000, {Baroque Works}, [Blocker]. Unscripted. */
  bw3blocker: 'EB01-034',
} as const;

/** OP09-077 Gum-Gum Lightning (Purple Event): used by p2 (Kaido Leader) to K.O. a Character with 6000 power or less. */
export const KO_EVENT = 'OP09-077';

/** p2 plays Gum-Gum Lightning (cost 2, DON!! -2) and targets `target`. p2 needs the event in hand and 4 active DON!!. */
export function lightningKo(g: TestGame, target: InstanceId): void {
  play(g, g.find('p2', 'hand', KO_EVENT));
  if (offered(g, 'p2')) accept(g);
  payDon(g, 2);
  choose(g, [target]);
}

/** p2's attacker attacks p1's (rested) Character and nobody defends. */
export function strike(g: TestGame, attacker: InstanceId, target: InstanceId): void {
  attack(g, attacker, target);
  noDefence(g);
}

export { act };

/** Debug: one line describing the pending decision and its legal picks. */
export function dbg(g: TestGame): string {
  const d = decision(g);
  if (!d) return 'none';
  const legal = g
    .legal()
    .slice(0, 12)
    .map((a) => JSON.stringify(a).replace(/"player":"p\d",?/, ''))
    .join(' ');
  return `${d.kind}/${d.player}/${d.purpose ?? ''} "${d.prompt}" max=${d.max} min=${d.min} :: ${legal}`;
}

/**
 * "[DON!! x1] This Character gains +1000 power." on the Character `id` (printed power `base`):
 * three standard tests (no DON!!, one DON!! on my turn, one DON!! on the opponent's turn).
 */
export function describeDonPlus(id: string, base: number): void {
  describe(`${id} [DON!! x1] +1000 power`, () => {
    it('without DON!! given it has its printed power', () => {
      const g = mine('ST01-001', { characters: [id] });
      expect(g.power(g.find('p1', 'characters', id))).toBe(base);
    });

    it('with 1 DON!! given, on my turn: +1000 from the effect and +1000 from the DON!!', () => {
      const g = mine('ST01-001', {
        characters: [{ card: id, don: 1 }],
        costArea: { active: 9, rested: 0 },
      });
      expect(g.power(g.find('p1', 'characters', id))).toBe(base + 2000);
    });

    it('with 1 DON!! given, on the opponent’s turn: the effect still gives +1000, the DON!! itself gives nothing', () => {
      const g = theirTurn(
        side('ST01-001', RED, { characters: [{ card: id, don: 1 }] }),
        side('ST01-001', RED),
      );
      expect(g.power(g.find('p1', 'characters', id))).toBe(base + 1000);
    });
  });
}
