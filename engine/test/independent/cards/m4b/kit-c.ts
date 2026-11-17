/**
 * Helpers for the group C independent card tests (M4b). Public API and frozen fixtures only.
 * Builds on `../kit.ts`; nothing here knows how any card is scripted.
 */
import { describe, expect, it } from 'vitest';
import { queries, type CardId, type DonClass, type InstanceId, type PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, attack, decision, fill, isLegal, passBlock, passCounter } from '../../helpers.ts';
import {
  eventCounterTargets,
  useCounter,
  canFinish,
  choices,
  donChoices,
  kind,
  myTurn,
  side,
  theirTurn,
} from '../kit.ts';

export { myTurn, theirTurn, side };

// ---------------------------------------------------------------------------------------------
// Scenery (stats checked against cards/data)
// ---------------------------------------------------------------------------------------------

export const C = {
  /** OP15-058 Enel: Purple Leader, 5000, 5 Life, Sky Island. */
  enel: 'OP15-058',
  /** ST05-001 Shanks: Purple Leader, 5000, 5 Life, no automatic effects. */
  shanks: 'ST05-001',
  /** ST01-001 Monkey.D.Luffy: Red Leader, 5000, 5 Life. */
  luffy: 'ST01-001',
  /** OP17-079 Monkey.D.Luffy: Black Leader with the {Elbaph} type, 5000. */
  elbaphLeader: 'OP17-079',
  /** OP15-118 Enel: Purple Character, cost 6, 8000 (+2000 with 6 or less DON!!). */
  enelChar: 'OP15-118',
  /** OP15-061 Ohm: Purple Character, cost 1, 2000, Counter +1000. */
  ohm: 'OP15-061',
  /** OP17-089 Jaguar.D.Saul: Black Character, printed cost 4, +12 cost on the field (16). */
  saul: 'OP17-089',
  /** OP17-088 Hajrudin: Black Character, cost 7, 8000, Counter +2000, {Elbaph}, no text. */
  elbaphChar: 'OP17-088',
  /** OP17-098 Gum-Gum Kong Gun: Black Event, cost 1, types include {Elbaph}. */
  elbaphEvent: 'OP17-098',
  /** OP17-081 Gerd: Black Character, cost 2, 3000. */
  gerd: 'OP17-081',
  /** OP04-007 Sanji: Red Character, cost 1, 3000, no text. */
  sanjiVanilla: 'OP04-007',
  /** OP15-078 Mamaragan: Purple Event, cost 0. */
  purpleEvent0: 'OP15-078',
  /** OP07-076 Slow-Slow Beam Sword: Purple Event, cost 2. */
  purpleEvent2: 'OP07-076',
  /** OP08-077 Conquest of the Sea: Purple Event, cost 6. */
  purpleEvent6: 'OP08-077',
  /** EB01-010 There's No Way You Could Defeat Me!!: Red Event, cost 3. */
  redEvent3: 'EB01-010',
  /** P-015 Sunny-Kun: Red Character, cost 1, 3000, {Straw Hat Crew}, no text. */
  shc1: 'P-015',
  /** OP02-033 Jinbe: Green Character, cost 2, 4000, {Straw Hat Crew}, no text. */
  shc2: 'OP02-033',
  /** OP02-028 Usopp: Green Character, cost 3, 5000, {Straw Hat Crew}, no text. */
  shc3: 'OP02-028',
  /** P-041 Monkey.D.Luffy: Purple Character, cost 10, 12000, no text. */
  cost10: 'P-041',
  /** OP02-011 Vista: Red Character, cost 3. [On Play] K.O. up to 1 opponent Character with 3000 power or less. */
  vista: 'OP02-011',
  /** ST04-015 Brachio Bomber: Purple Event, cost 6. [Main] K.O. up to 1 opp Character with cost 6 or less. */
  brachio: 'ST04-015',
  /** OP09-072 Franky: Purple Character, cost 4, 5000, [Blocker] (on the field its [On Play] is idle). */
  blocker: 'OP09-072',
} as const;

/** Cards of known cost and power for filling a field (no text unless noted). */
export const V = {
  sunny: 'P-015', // cost 1, 3000
  sai: 'OP01-012', // cost 2, 4000
  marco: 'OP01-023', // cost 3, 5000
  hajrudin: 'OP01-018', // cost 4, 6000
  kingdew: 'OP02-006', // cost 5, 7000
  thatch: 'OP02-007', // cost 6, 8000
  littleOars: 'OP02-020', // cost 7, 9000
  shiki8: 'OP12-005', // cost 8, 10000
} as const;

export const FILLER = 'ST05-007'; // Gordon, Purple, cost 1, 3000, Counter +1000
export const RED_FILL = 'P-015';

// ---------------------------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------------------------

export function deckOf(top: CardId[], filler: CardId = FILLER, total = 15): CardId[] {
  return [...top, ...fill(filler, Math.max(0, total - top.length))];
}

export function ids(g: TestGame, p: PlayerId, zone: Parameters<TestGame['zone']>[1]): CardId[] {
  return g.zone(p, zone).map((c) => c.card);
}

export function sorted(xs: CardId[]): CardId[] {
  return [...xs].sort();
}

export function inst(
  g: TestGame,
  p: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
  card: CardId,
  nth = 0,
): InstanceId {
  return g.find(p, zone, card, nth);
}

/** DON!! on the field: cost area + given. */
export function fieldDon(g: TestGame, p: PlayerId): number {
  const d = queries.don(g.state, p);
  return d.active + d.rested + d.given;
}

export function deckCards(g: TestGame, p: PlayerId): CardId[] {
  return ids(g, p, 'deck');
}

// ---------------------------------------------------------------------------------------------
// Driving decisions
// ---------------------------------------------------------------------------------------------

export interface Plan {
  /** Answer to every `optional` (default true). */
  accept?: boolean;
  /** Card instances to pick, in whatever `choose` offers them. */
  targets?: InstanceId[];
  /** Card ids to pick (first offered instance of each), for cards that do not exist yet when the plan is made. */
  cards?: CardId[];
  /** Preferred DON!! class for DON!! picks. */
  don?: DonClass['from'];
  /** For `given` picks: the card the DON!! is on. */
  givenTo?: InstanceId;
  /** Answers to `{option}` picks, by id fragment (first match wins), e.g. 'top' / 'bottom'. */
  option?: string;
}

/**
 * Settle every decision `player` owes: optional (per plan.accept), DON!! picks (plan.don), card
 * picks (plan.targets first, else finish if allowed, else the first offered), orders (first).
 * Stops when the decision belongs to someone else or is a main / block / counter / trigger one.
 */
export function drive(g: TestGame, player: PlayerId, plan: Plan = {}, limit = 40): void {
  // Unordered picks must come in canonical (instance id) order (ARCHITECTURE §2.3).
  const targets = [...(plan.targets ?? [])].sort();
  const cardIdsLeft = [...(plan.cards ?? [])];
  for (let i = 0; i < limit; i++) {
    const d = decision(g);
    if (!d || d.player !== player) return;
    if (d.kind === 'optional') {
      const canAccept = g.legal().some((a) => a.type === 'optional' && a.accept);
      act(g, { type: 'optional', accept: (plan.accept ?? true) && canAccept });
    } else if (d.kind === 'choose') {
      const dons = donChoices(g);
      if (dons.length) {
        const want = plan.don ?? 'costRested';
        const pick =
          dons.find((o) => o.from === want && (o.from !== 'given' || o.card === plan.givenTo)) ??
          dons[0]!;
        act(g, { type: 'pick', choice: pick });
        continue;
      }
      const cs = choices(g);
      let t = targets.find((x) => cs.includes(x));
      if (!t) {
        const wanted = cs.find((x) => cardIdsLeft.includes(g.card(x).card));
        if (wanted) {
          cardIdsLeft.splice(cardIdsLeft.indexOf(g.card(wanted).card), 1);
          t = wanted;
          act(g, { type: 'pick', choice: t });
          continue;
        }
      }
      if (t) {
        act(g, { type: 'pick', choice: t });
        targets.splice(targets.indexOf(t), 1);
        continue;
      }
      if (plan.option) {
        const o = g
          .legal()
          .find(
            (a) =>
              a.type === 'pick' &&
              typeof a.choice === 'object' &&
              'option' in a.choice &&
              a.choice.option.includes(plan.option!),
          );
        if (o) {
          g.act(o);
          continue;
        }
      }
      if (canFinish(g)) {
        act(g, { type: 'done' });
        continue;
      }
      const first = g.legal().find((a) => a.type === 'pick');
      if (!first) return;
      g.act(first);
    } else if (d.kind === 'order') {
      g.act(g.legal().find((a) => a.type === 'order')!);
    } else return;
  }
}

/** Play `card` from hand of the deciding player. */
export function playCard(g: TestGame, p: PlayerId, card: CardId, nth = 0): void {
  act(g, { type: 'playCard', card: g.find(p, 'hand', card, nth) });
}

export function canPlay(g: TestGame, p: PlayerId, card: CardId, nth = 0): boolean {
  return isLegal(g, { type: 'playCard', card: g.find(p, 'hand', card, nth) });
}

/** Names the candidates of the current choose decision as card ids (sorted). */
export function offeredCards(g: TestGame): CardId[] {
  return choices(g)
    .map((c) => g.card(c).card)
    .sort();
}

/** True when the deciding player owes a `choose`, or an optional, now (something asked). */
export function asking(g: TestGame): boolean {
  const k = kind(g);
  return k === 'choose' || k === 'optional';
}

/** Blockers offered to the defender now ([] when no Block Step decision is pending). */
export function blockOptions(g: TestGame): InstanceId[] {
  if (kind(g) !== 'block') return [];
  return g.legal().flatMap((a) => (a.type === 'block' && a.blocker !== null ? [a.blocker] : []));
}

/** Declare an attack and let the defender pass the Block Step (if any). */
export function attackAndPass(g: TestGame, attacker: InstanceId, target: InstanceId): void {
  attack(g, attacker, target);
  passBlock(g);
}

/** Keywords on a card as the engine derives them. */
export function keywordsOf(g: TestGame, instance: InstanceId): string[] {
  return g.card(instance).keywords;
}

export const mine = (
  leader: string,
  spec: Parameters<typeof side>[2] = {},
  filler: CardId = FILLER,
) => side(leader, filler, spec);

/** The same side with `n` DON!! given to its Leader. */
export function leaderDon(spec: ReturnType<typeof side>, n: number): ReturnType<typeof side> {
  const card = typeof spec.leader === 'string' ? spec.leader : spec.leader.card;
  return { ...spec, leader: { card, don: n } };
}

/**
 * The shared [Counter] of OP15-074 / 075 / 076: "Up to 1 of your [Enel] cards gains +2000 power
 * during this battle." Cost 0, so it needs no DON!!.
 */
export function enelCounterSuite(id: string): void {
  describe(`${id} [Counter]: up to 1 of your [Enel] cards gains +2000 power during this battle`, () => {
    function defending() {
      return theirTurn(
        side(C.enel, FILLER, { hand: [id], characters: [C.enelChar, V.sai], donDeck: 6 }),
        side(C.luffy, FILLER, { characters: [V.hajrudin] }),
      );
    }

    it('only [Enel] cards (the Leader and the Enel Character) are candidates, not other Characters', () => {
      const g = defending();
      attack(g, g.find('p2', 'characters', V.hajrudin), g.leader('p1'));
      passBlock(g);
      const targets = eventCounterTargets(g, g.find('p1', 'hand', id));
      expect(targets).toEqual([g.leader('p1'), g.find('p1', 'characters', C.enelChar)].sort());
    });

    it('Leader 5000 + 2000 beats a 6000 attacker; the boost ends with the battle', () => {
      const g = defending();
      attack(g, g.find('p2', 'characters', V.hajrudin), g.leader('p1'));
      passBlock(g);
      useCounter(g, g.find('p1', 'hand', id), g.leader('p1'));
      drive(g, 'p1', { targets: [g.leader('p1')] });
      expect(g.power(g.leader('p1'))).toBe(7000);
      act(g, { type: 'endCounter' });
      expect(g.life('p1')).toBe(4);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('can boost the [Enel] Character instead of the Leader', () => {
      const g = defending();
      const enel = g.find('p1', 'characters', C.enelChar);
      attack(g, g.find('p2', 'characters', V.hajrudin), g.leader('p1'));
      passBlock(g);
      const base = g.power(enel)!;
      useCounter(g, g.find('p1', 'hand', id), g.leader('p1'));
      drive(g, 'p1', { targets: [enel] });
      expect(g.power(enel)).toBe(base + 2000);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('without the Counter, the same attack deals damage (control)', () => {
      const g = defending();
      attack(g, g.find('p2', 'characters', V.hajrudin), g.leader('p1'));
      passBlock(g);
      passCounter(g);
      expect(g.life('p1')).toBe(3);
    });
  });
}
