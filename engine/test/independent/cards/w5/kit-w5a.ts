/**
 * Helpers for the engine-wave-5 group-A independent card tests (EB02-035, EB03-033, EB03-051,
 * OP03-008, OP09-025, OP09-061, OP09-065, OP09-068, OP09-070, OP09-073, OP09-076, OP09-104,
 * OP09-119). Public API, frozen fixtures and the earlier kits only. Every answer helper accepts ONE
 * named kind of prompt and fails on anything else; where a test asks whether a prompt appears it
 * uses raw `g.act` / `decision`. Scenery stats are noted next to each constant; tests repeat the
 * ones they rely on.
 */
import { queries, type CardId, type DonClass, type InstanceId, type PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { donChoices, kind } from '../kit.ts';
import { need } from '../op17/kit-op17b.ts';

export * from '../op17/kit-op17b.ts';
export { asksDonCount, donCountOptions, takeDon } from '../op16/kit-op16b.ts';

/** Leaders used as scenery. */
export const LW = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, Strike, {Straw Hat Crew}/{Supernovas}. Not multicoloured, not ODYSSEY, not Big Mom. [Activate: Main] only. */
  luffy: 'ST01-001',
  /** OP03-099 Charlotte Katakuri: Yellow, 5000, {Big Mom Pirates}. [DON!! x1][When Attacking] only. */
  bigMom: 'OP03-099',
  /** OP09-022 Lim: Green/Purple (multicoloured), 5000, {ODYSSEY}. Characters are played rested; [Activate: Main] only. */
  lim: 'OP09-022',
  /** OP01-002 Trafalgar Law: Green/Red (multicoloured), 5000, Slash, {Heart Pirates}/{Supernovas}. [Activate: Main] only. */
  law: 'OP01-002',
  /** OP03-021 Kuro: Green, 5000, Slash. [Activate: Main] only. */
  slashLeader: 'OP03-021',
  /** ST05-001 Shanks: Purple, 5000, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. Not Big Mom, not multicoloured. */
  shanks: 'ST05-001',
} as const;

/** Scenery cards. Stats are the printed ones. */
export const SW = {
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000, Strike. Vanilla. */
  c1: 'OP01-010',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000, Slash. Vanilla. */
  sai: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, Special. Vanilla. */
  marco: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000, Strike. Vanilla. */
  hajrudin: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000, Strike. Vanilla. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000, Wisdom. Vanilla. */
  thatch: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000, Strike. Vanilla. */
  oars: 'OP02-020',
  /** OP04-012 Nefeltari Cobra: Red, cost 2, 0 power, Counter +1000. Inert alone. */
  cobra: 'OP04-012',
  /** OP02-043 Roronoa Zoro: Green, cost 4, 6000, Counter +1000, Slash. Vanilla. */
  zoroSlash: 'OP02-043',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000, Slash. Vanilla. */
  shiki8: 'OP12-005',
  /** EB05-041 Koala: Black, cost 2, 4000, Counter +1000, Strike, {Revolutionary Army}/{Dressrosa}. Vanilla. */
  koala: 'EB05-041',
  /** OP05-012 Hack: Red, cost 3, 5000, Counter +1000, Strike, {Fish-Man}/{Revolutionary Army}. Vanilla. */
  hack: 'OP05-012',
  /** OP09-113 Morley: Yellow, cost 4, 6000, Counter +1000, Special, {Giant}/{Revolutionary Army}. Vanilla. */
  morley: 'OP09-113',
  /** OP13-088 Terry Gilteo: Black, cost 5, 6000, Counter +2000, Wisdom, {Revolutionary Army}. Vanilla. */
  terry: 'OP13-088',
  /** OP05-077 Gamma Knife: Purple Event, cost 2, [Main] DON!! -1: gives up to 1 opposing Character -5000 power this turn. */
  gammaKnife: 'OP05-077',
  /** OP09-077 Gum-Gum Lightning: Purple Event, cost 2, [Main] DON!! -2: K.O. up to 1 Character with 6000 power or less. */
  lightning: 'OP09-077',
  /** OP07-076 Slow-Slow Beam Sword: Purple Event, cost 2, [Counter] DON!! -1: +2000 power this battle, then rest up to 1 opposing Character. */
  beamSword: 'OP07-076',
  /** OP09-078 Gum-Gum Giant: Purple Event, cost 1, [Counter] DON!! -2, you may trash 1 card from hand: with a {Straw Hat Crew} Leader, +4000 power this battle; draw 2. */
  giant: 'OP09-078',
  /** EB01-059 Kingdom Come: Yellow Event, cost 6, [Main] K.O. up to 1 Character; then trash Life down to 1. */
  kingdomCome: 'EB01-059',
  /** OP02-022 Whitebeard Pirates: Red Event, cost 1. */
  redEvent: 'OP02-022',
  /** OP01-027 Round Table: Red Event, cost 4. */
  redEvent2: 'OP01-027',
  /** EB01-028 Gum-Gum Champion Rifle: Blue Event, cost 1 (not red). */
  blueEvent: 'EB01-028',
  /** OP05-077 is purple; used as the "not red" Event too. */
  purpleEvent: 'OP05-077',
} as const;

export function donOf(g: TestGame, who: PlayerId = 'p1') {
  return queries.don(g.state, who);
}

/** DON!! on the field: cost area plus DON!! given to cards. */
export function onField(g: TestGame, who: PlayerId = 'p1'): number {
  const d = donOf(g, who);
  return d.active + d.rested + d.given;
}

/**
 * Play a card from hand with raw actions. Only DON!! class picks that pay the play cost (active
 * cost-area DON!!) are answered; any other decision (a "you may" question, a target pick) is left
 * pending. Returns the card's instance.
 */
export function put(g: TestGame, card: CardId, who: PlayerId = g.decider): InstanceId {
  const i = g.find(who, 'hand', card);
  act(g, { type: 'playCard', card: i });
  for (let n = 0; n < 12; n++) {
    const d = decision(g);
    if (d?.kind !== 'choose' || d.player !== who || d.purpose !== 'cost') break;
    const want = donChoices(g).find((o) => o.from === 'costActive');
    if (!want) break;
    act(g, { type: 'pick', choice: want });
  }
  return i;
}

/** True when a count question (`choose`, purpose `mode`) is pending for `who`. */
export function asksCount(g: TestGame, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return d?.kind === 'choose' && d.player === who && d.purpose === 'mode';
}

/** The ids of the options of the pending count question, in the order offered. */
export function countOptions(g: TestGame, who: PlayerId = 'p1'): string[] {
  const d = need(g, 'choose', who);
  if (d.purpose !== 'mode') throw new Error(`Expected a count question, got ${d.purpose}`);
  return (d.options ?? []).map((o) => o.id);
}

/** Answer the pending count question with exactly `n` (it must be offered). */
export function answerCount(g: TestGame, n: number, who: PlayerId = 'p1'): void {
  const offered = countOptions(g, who);
  if (!offered.includes(String(n))) throw new Error(`Count ${n} not offered; offered ${offered}`);
  act(g, { type: 'pick', choice: { option: String(n) } });
}

/**
 * Pay a "return N DON!! to your DON!! deck" cost that is already accepted: answer the count
 * question when one is pending (with `n`), then pick DON!! of class `from` while a DON!! cost pick
 * is pending. Nothing else is answered; if the engine decides the classes itself nothing is asked.
 */
export function returnDon(
  g: TestGame,
  n: number,
  from: DonClass['from'] = 'costActive',
  who: PlayerId = 'p1',
): void {
  if (asksCount(g, who)) answerCount(g, n, who);
  for (let i = 0; i < 12; i++) {
    const d = decision(g);
    if (d?.kind !== 'choose' || d.player !== who || d.purpose !== 'cost') return;
    const opts = donChoices(g);
    if (!opts.length) return;
    const want = opts.find((o) => o.from === from) ?? opts[0]!;
    act(g, { type: 'pick', choice: want });
  }
}

/** Instances of `card` in `who`'s zone. */
export function allOf(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
  card: CardId,
): InstanceId[] {
  return g
    .zone(who, zone)
    .filter((c) => c.card === card)
    .map((c) => c.instance);
}

/** Describe the pending decision for failure messages. */
export function pend(g: TestGame): string {
  const d = decision(g);
  return d ? `${d.kind}/${d.purpose}:${d.prompt}` : 'none';
}

/** The kind of the pending decision, or null. */
export function pk(g: TestGame): string | null {
  return kind(g);
}
