/**
 * Helpers for the wave 7 group B independent card tests (OP12-036, OP12-117, OP13-064, OP13-105,
 * OP14-053, OP14-060, OP15-093, OP16-080, ST15-001, ST20-003, ST36-005). Public API, frozen
 * fixtures and the base kit only (`../kit.ts`, `../../helpers.ts`). The older group kits are NOT
 * used: some of them strip the text of OP14-060 and OP16-080 from the position. Every answer
 * helper accepts ONE named kind of prompt and fails on anything else; where a test asks whether a
 * prompt appears it uses raw `g.act` / `decision`. Scenery stats are noted next to each constant.
 */
import { expect } from 'vitest';
import {
  queries,
  type CardId,
  type InstanceId,
  type PlayerId,
  type PlayerSpec,
} from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, cardIds, decision, fill, passBlock, passCounter } from '../../helpers.ts';
import { choices, kind, myTurn, side, theirTurn } from '../kit.ts';

export * from '../kit.ts';

/** Scenery used by the wave 7 group B tests. */
export const S7 = {
  // ---- Leaders (inert unless noted) ----
  /** OP01-001 Roronoa Zoro: Red, 5000, Slash, {Straw Hat Crew}/{Supernovas}. [DON!! x1][Your Turn] +1000 to Characters: inert without given DON!!. */
  slashSupernova: 'OP01-001',
  /** OP01-003 Monkey.D.Luffy: Green/Red, 5000, Strike, {Straw Hat Crew}/{Supernovas}. [Activate: Main] (4) only. */
  strikeSupernova: 'OP01-003',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, Strike, {Straw Hat Crew}/{Supernovas}. [Activate: Main] only (needs a rested DON!!). */
  luffyLeader: 'ST01-001',
  /** OP02-001 Edward.Newgate: Red, 6000, Special, {Whitebeard Pirates}. [End of Your Turn] add 1 card from the top of Life to hand. */
  newgate: 'OP02-001',
  /** ST10-002 Monkey.D.Luffy: Purple/Red, 6000, {Straw Hat Crew}. [Activate: Main] [Once Per Turn] only. */
  leader6000: 'ST10-002',
  /** OP13-003 Gol.D.Roger: Purple/Red, 7000 base, {Roger Pirates}. "If you have 9 or less DON!! on your field, give this Leader -2000 power". */
  roger7000: 'OP13-003',
  /** ST03-001 Crocodile: Blue, 5000, {Baroque Works}. [Activate: Main] only. */
  crocodile: 'ST03-001',
  // ---- Characters ----
  /** P-041 Monkey.D.Luffy: Purple, cost 10, 12000, Counter +1000, vanilla. */
  vanilla10: 'P-041',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000, vanilla, Slash. */
  vanilla8Slash: 'OP12-005',
  /** OP01-070 Dracule Mihawk: Blue, cost 9, 9000, no Counter, Slash. [On Play] only (inert on the field). */
  c9: 'OP01-070',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, vanilla. */
  marco: 'OP01-023',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000, vanilla. */
  sai: 'OP01-012',
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000, vanilla. */
  komachiyo: 'OP01-010',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000, vanilla. */
  hajrudin: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000, vanilla. */
  kingdew: 'OP02-006',
  /** OP02-043 Roronoa Zoro: Green, cost 4, 6000, Counter +1000, vanilla, <Slash>, {FILM}/{Straw Hat Crew}/{Supernovas}. */
  zoroVanilla: 'OP02-043',
  /** OP02-041 Monkey.D.Luffy: Green, cost 7, 7000, [Blocker]; [On Play] play up to 1 {FILM}/{Straw Hat Crew} Character with cost 4 or less from hand. */
  luffyPlayer: 'OP02-041',
  /** OP05-035 Bellamy: Green, cost 3, 5000, Counter +1000, {Donquixote Pirates}, vanilla, Strike. */
  dq3: 'OP05-035',
  /** OP10-073 Buffalo: Purple, cost 4, 6000, Counter +1000, {Donquixote Pirates}, vanilla, Strike. */
  dq4: 'OP10-073',
  /** OP10-068 Diamante: Purple, cost 5, 7000, Counter +1000, {Donquixote Pirates}, vanilla, Slash. */
  dq5Slash: 'OP10-068',
  /** OP09-082 Avalo Pizarro: Black, cost 4, 6000, Counter +1000, {Blackbeard Pirates}, vanilla, Special. */
  bb4: 'OP09-082',
  /** OP10-084 Sanjuan.Wolf: Black, cost 5, 7000, Counter +1000, {Blackbeard Pirates}/{Giant}, vanilla, Special. */
  bb5: 'OP10-084',
  /** OP05-074 Eustass"Captain"Kid: Purple, cost 5, 6000, Counter +1000, [Blocker] (inert unless DON!! are returned). */
  kid6000: 'OP05-074',
  /** OP09-075 Eustass"Captain"Kid: Purple, cost 3, 5000 base, no Counter; [On Play] only (inert on the field). */
  kid5000: 'OP09-075',
  /** P-003 Eustass"Captain"Kid: Green, cost 3, 4000 base, Counter +1000; [DON!! x2] Double Attack only. */
  kid4000: 'P-003',
  /** OP04-077 Ideo: Black, cost 2, 2000, Counter +1000, {Dressrosa}, [Blocker] only (scripted, keyword only). */
  blocker: 'OP04-077',
  /** OP09-005 Silvers Rayleigh: Red, cost 5, 6000, {Roger Pirates}, [Blocker]; [On Play] needs 2 opposing 5000+ Characters. */
  rogerBlocker: 'OP09-005',
  /** OP12-010 Douglas Bullet: Red, cost 6, 7000, Counter +2000, vanilla, {FILM}/{The Pirates Fest}/{Former Roger Pirates}. */
  formerRoger: 'OP12-010',
  /** EB01-023 Edward Weevil: Blue, cost 4, 6000, [On Play] Draw 1 card. */
  draw1: 'EB01-023',
  /** OP01-104 Speed: Purple Character, cost 2, 3000, no effect, "[Trigger] Play this card." */
  trigSpeed: 'OP01-104',
  /** EB04-055 style triggers are not used. OP17-107 Charlotte Daifuku: Yellow, cost 3, 4000, Counter +2000, "[Trigger] Play this card." */
  trig: 'OP17-107',
  // ---- Events ----
  /** OP12-117 Slam Gibson, the card under test. */
  gibson: 'OP12-117',
  /** OP09-077 Gum-Gum Lightning: Purple Event, cost 2, [Main] DON!! -2: K.O. up to 1 Character with 6000 power or less. */
  lightning: 'OP09-077',
} as const;

export type Spec = Partial<PlayerSpec>;

/** Sorted card ids of a zone. */
export function ids(g: TestGame, who: PlayerId, zone: Parameters<TestGame['zone']>[1]): CardId[] {
  return cardIds(g, who, zone).sort();
}

/** Card ids of a zone in order (top first for Life and deck). */
export function ordered(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
): CardId[] {
  return cardIds(g, who, zone);
}

/** A p1 Main Phase (turn 3): 10 active DON!!, p2 has a 4-Life Luffy-ST01 side unless overridden. */
export function mine7(
  leader: string,
  p1: Spec = {},
  p2: Spec = {},
  p2Leader = 'ST01-001',
): TestGame {
  return myTurn(
    side(leader, 'OP02-060', { costArea: { active: 10, rested: 0 }, ...p1 }),
    side(p2Leader, 'P-015', p2),
  );
}

/** A p2 Main Phase (turn 4); p1 defends. p2 has 10 active DON!!, p1 has 0 unless overridden. */
export function theirs7(
  leader: string,
  p1: Spec = {},
  p2: Spec = {},
  p2Leader = 'ST01-001',
): TestGame {
  return theirTurn(
    side(leader, 'OP02-060', { costArea: { active: 0, rested: 0 }, ...p1 }),
    side(p2Leader, 'P-015', { costArea: { active: 10, rested: 0 }, ...p2 }),
  );
}

/** Throws unless the pending decision is `k` owed by `who`. */
export function need(g: TestGame, k: string, who?: PlayerId): void {
  const d = decision(g);
  expect(`${d?.player}:${d?.kind}:${d?.prompt}`, 'pending decision').toMatch(
    new RegExp(`^${who ?? '[^:]+'}:${k}:`),
  );
}

export function owes(g: TestGame, who: PlayerId, k?: string): boolean {
  const d = decision(g);
  return !!d && d.player === who && (k === undefined || d.kind === k);
}

/** Debug text of the pending decision. */
export function now(g: TestGame): string {
  const d = decision(g);
  return `${d?.player}:${d?.kind}/${d?.purpose}: ${d?.prompt}`;
}

/** The deciding player's legal actions as JSON (for assertion messages). */
export function legalText(g: TestGame): string {
  return JSON.stringify(g.legal().slice(0, 12));
}

/** Instances the pending `choose` offers, as sorted card ids. */
export function offeredCards(g: TestGame): (CardId | null)[] {
  return choices(g)
    .map((i) => {
      try {
        return queries.card(g.state, i).card;
      } catch {
        return null;
      }
    })
    .sort();
}

/** Pick these instances in the pending `choose` (one `pick` each, in the order given). */
export function pickAll(g: TestGame, list: InstanceId[]): void {
  for (const c of list) act(g, { type: 'pick', choice: c });
}

/** End a pending "up to" choose with nothing (needs `done` legal). */
export function done(g: TestGame): void {
  act(g, { type: 'done' });
}

export function canDone(g: TestGame): boolean {
  return kind(g) === 'choose' && g.legal().some((a) => a.type === 'done');
}

export function canAccept(g: TestGame): boolean {
  return g.legal().some((a) => a.type === 'optional' && a.accept);
}

export function canDecline(g: TestGame): boolean {
  return g.legal().some((a) => a.type === 'optional' && !a.accept);
}

/** Rest or return DON!!: pick DON!! classes while the engine asks for them (preferring `from`). */
export function payDonFrom(
  g: TestGame,
  from: 'costActive' | 'costRested' | 'given' = 'costActive',
): void {
  const player = g.decider;
  for (let i = 0; i < 20; i++) {
    const d = decision(g);
    if (!d || d.player !== player || d.kind !== 'choose') return;
    const legal = g.legal();
    const pick = legal.find(
      (a) =>
        a.type === 'pick' &&
        typeof a.choice === 'object' &&
        a.choice !== null &&
        'from' in a.choice &&
        a.choice.from === from,
    );
    if (!pick) return;
    g.act(pick);
  }
}

/** DON!! counts of a player. */
export function dons(g: TestGame, who: PlayerId = 'p1') {
  return queries.don(g.state, who);
}

/** The defender does not block or counter; stops at the first Trigger or other decision after that. */
export function noDefence(g: TestGame): void {
  passBlock(g);
  passCounter(g);
}

/** Take Life damage without activating any [Trigger]; stops at anything else. */
export function declineTriggers(g: TestGame): void {
  while (decision(g)?.kind === 'trigger') act(g, { type: 'trigger', activate: false });
}

export { fill };
