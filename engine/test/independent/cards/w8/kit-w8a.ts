/**
 * Helpers for the wave 8 group-A independent card tests (OP12-041, OP15-014, OP15-046, EB03-031,
 * PRB02-005, OP16-079). Public API, frozen fixtures and the earlier kits only. Every answer helper
 * accepts ONE named kind of prompt and fails on anything else; where a test asks whether a prompt
 * appears it uses raw `g.act` / `decision`. Scenery stats are noted next to each constant.
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
import { act, decision } from '../../helpers.ts';
import { choices, donChoices, myTurn, side, theirTurn } from '../kit.ts';

export {
  act,
  attack,
  cardIds,
  decision,
  endTurn,
  noDefence,
  passBlock,
  passCounter,
} from '../../helpers.ts';
export {
  at,
  atMain,
  canAttackAnything,
  canHit,
  kw,
  n,
  need,
  no,
  none,
  offer,
  offeredAbilities,
  offeredIds,
  pickCards,
  pickInst,
  toMyNextMain,
  useAbility,
  yes,
} from '../op17/kit-op17b.ts';
export { canFinish, choices, donChoices, donOf, kind, myTurn, side, theirTurn } from '../kit.ts';

/** Leaders used as scenery (printed). */
export const L8 = {
  /** OP12-041 Sanji: Blue/Purple, 5000, 4 Life, {Straw Hat Crew}/{The Vinsmoke Family}. The card under test in OP12-041; a [Sanji] Leader elsewhere. */
  sanji: 'OP12-041',
  /** PRB01-001 Sanji: Red, 5000, 5 Life, {Straw Hat Crew}. [Activate: Main] only (needs a target); a mono-coloured [Sanji] Leader. */
  sanjiRed: 'PRB01-001',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. [Activate: Main] only. Not [Sanji], not Dressrosa, not Wano, mono-coloured. */
  luffy: 'ST01-001',
  /** OP01-002 Trafalgar Law: Green/Red, 5000, 4 Life, {Heart Pirates}/{Supernovas}. Multicoloured. [Activate: Main] only. */
  law: 'OP01-002',
  /** OP15-039 Rebecca: Blue, 5000, 5 Life, {Dressrosa}. Cannot attack; [Activate: Main] only. */
  rebecca: 'OP15-039',
  /** OP15-002 Lucy: Blue/Red, 5000, 5 Life, {Revolutionary Army}/{Dressrosa}. Multicoloured. */
  lucy: 'OP15-002',
  /** ST05-001 Shanks: Purple, 5000, 5 Life, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. [Activate: Main] only. Not [Sanji]. */
  shanks: 'ST05-001',
  /** OP16-079 Yamato: Black, 5000, 5 Life, {Land of Wano}. The card under test in OP16-079. */
  yamato: 'OP16-079',
  /** ST09-001 Yamato: Yellow, 5000, 5 Life, {Land of Wano}. No text that matters here. */
  yamatoYellow: 'ST09-001',
} as const;

/** Events used as scenery. */
export const E8 = {
  /** OP12-059 Concasser: Blue, cost 1, {Straw Hat Crew}/{Sky Island}. [Main] If your Leader is [Sanji], draw 1 card. [Counter] needs 4 Events in trash. */
  concasser: 'OP12-059',
  /** OP12-078 Brochette Blow: Purple, cost 3, {Straw Hat Crew}. [Main] If DON!! on your field <= opponent's, draw 1; then give up to 1 opposing Character -3000 power this turn. */
  brochette: 'OP12-078',
  /** ST21-017 Gum-Gum Mole Pistol: Red, cost 4, {Straw Hat Crew}/{The Four Emperors}. [Main] -5000 to an opposing Character; then K.O. a 2000-or-less if you have a 6000+ Character. */
  molePistol: 'ST21-017',
  /** OP11-059 Gum-Gum King Cobra: Blue, cost 1, {Straw Hat Crew}. Only a [Counter]. */
  kingCobra: 'OP11-059',
  /** OP09-077 Gum-Gum Lightning: Purple, cost 2, {Straw Hat Crew}/{The Four Emperors}. [Main] DON!! -2: K.O. up to 1 opposing Character with 6000 power or less. */
  lightning: 'OP09-077',
  /** OP06-017 Meteor-Strike of Love: Red, cost 2, {FILM}/{Straw Hat Crew}. [Main]/[Counter] You may add 1 Life to hand: up to 1 Leader/Character +3000 this turn. */
  meteor: 'OP06-017',
  /** EB05-009 Fight and Die with Me!!!: Red, cost 1, {Straw Hat Crew}/{East Blue}. [Main] Characters with 4000 base power or less +1000 until the end of the opponent's next End Phase. [Counter] Leader +3000 during the battle. */
  fightAndDie: 'EB05-009',
  /** OP15-019 Barrier Bulls: Red, cost 3, {Dressrosa}/{Barto Club}. [Main] Draw 1 and your Leader gains +1000 until the end of the opponent's next End Phase. Not {Straw Hat Crew}. */
  barrierBulls: 'OP15-019',
  /** OP15-055 Go Ahead and Use 'Em, Mr. Luffy!!!: Blue, cost 3, {Dressrosa}/{Barto Club}. [Main] Choose one: draw 2 / a {Dressrosa} Character gains [Blocker]. */
  goAhead: 'OP15-055',
  /** OP10-061 Special Long-Range Attack!! Bagworm: Blue, cost 3, {Straw Hat Crew}/{Dressrosa}. [Main] Draw 1; then return an opposing Character with cost 2 or less to hand. */
  bagworm: 'OP10-061',
  /** OP13-019 But Ace Here Said You Deserved It!!: Red, cost 1, {Revolutionary Army}/{Dressrosa}. [Main] You may rest 4 DON!!: -3000 to an opposing Character this turn; then K.O. an opposing Character with 3000 power or less. */
  aceDeserved: 'OP13-019',
  /** OP10-041 Radio Knife: Green, cost 4, {Heart Pirates}/{Supernovas}/{Dressrosa}. [Main] Rest an opposing Character with cost 6 or less; then K.O. a rested one with cost 5 or less. */
  radioKnife: 'OP10-041',
  /** OP10-060 Barrier-Barrier Pistol: Blue, cost 5, {Dressrosa}/{Barto Club}. [Main] Place up to 1 opposing Character with 6000 power or less at the bottom of the deck. */
  barrierPistol: 'OP10-060',
  /** OP15-021 Just Watch Me, Ace!!!: Red, cost 4, {Revolutionary Army}/{Dressrosa}. With 4+ Events in your trash it costs 3 less in hand. [Main]/[Counter] -3000 to an opposing Character this turn. */
  justWatch: 'OP15-021',
  /** OP15-020 Fire Fist: Red, cost 7, {Revolutionary Army}/{Dressrosa}. [Main] Leader +3000 this turn; -8000 to an opposing Character; then you may trash 2 from hand: K.O. ... */
  fireFist: 'OP15-020',
  /** OP15-056 Would You Let Me Eat the Flame-Flame Fruit?: Blue, cost 7, {Revolutionary Army}/{Dressrosa}. [Main] Draw 2 cards; then your [Lucy] Leader gains [Double Attack] and +3000. */
  flameFruit: 'OP15-056',
  /** OP12-058 I Will Make Whitebeard the King of the Pirates: Blue, cost 9, {Whitebeard Pirates}. [Main] needs a Whitebeard Leader. */
  whitebeardKing: 'OP12-058',
  /** OP16-116 Zehahahahaha!: Yellow, cost 8, {Blackbeard Pirates}/{The Seven Warlords of the Sea}. [Main] needs 10 DON!! on the field and [Marshall.D.Teach] in hand; then takes an opposing Life card to hand. */
  zehahaha: 'OP16-116',
} as const;

/** Scenery Characters (vanilla unless noted). */
export const C8 = {
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000. Vanilla; the deck filler. */
  mohji: 'OP02-060',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. Vanilla. */
  sai: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. Vanilla. */
  marco: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. Vanilla. */
  hajrudin: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. Vanilla. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. Vanilla. */
  thatch: 'OP02-007',
  /** ST01-008 Nico Robin: Red, cost 3, 5000, {Straw Hat Crew}. Vanilla. */
  robin: 'ST01-008',
  /** P-015 Sunny-Kun: Red, cost 1, 3000, Counter +1000, {FILM}/{Straw Hat Crew}. Vanilla. */
  sunny: 'P-015',
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000, {Animal}/{Land of Wano}. Vanilla. */
  komachiyo: 'OP01-010',
  /** OP01-043 Shinobu: Green, cost 3, 5000, {Land of Wano}. Vanilla. */
  shinobu: 'OP01-043',
  /** OP12-023 Kawamatsu: Green, cost 5, 6000, {Fish-Man}/{Land of Wano}/{The Akazaya Nine}. Vanilla. */
  kawamatsu: 'OP12-023',
} as const;

export type Spec = Partial<PlayerSpec>;

/** A p1 Main Phase with 10 active DON!!; p2 has `L8.luffy` with 0 DON!! unless overridden. */
export function mine8(
  leader: string,
  p1: Spec = {},
  p2: Spec = {},
  p2Leader: string = L8.luffy,
): TestGame {
  return myTurn(
    side(leader, C8.mohji, { costArea: { active: 10, rested: 0 }, ...p1 }),
    side(p2Leader, C8.sunny, { costArea: { active: 0, rested: 0 }, ...p2 }),
  );
}

/** A p2 Main Phase (turn 4); p1 defends with 0 DON!! unless overridden. */
export function theirs8(
  leader: string,
  p1: Spec = {},
  p2: Spec = {},
  p2Leader: string = L8.luffy,
): TestGame {
  return theirTurn(
    side(leader, C8.mohji, { costArea: { active: 0, rested: 0 }, ...p1 }),
    side(p2Leader, C8.sunny, { costArea: { active: 10, rested: 0 }, ...p2 }),
  );
}

/** Card ids of `who`'s zone, sorted. */
export function sortedCards(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
): CardId[] {
  return g
    .zone(who, zone)
    .map((c) => c.card)
    .sort();
}

/** Card ids of `who`'s zone, in order (top first). */
export function orderedCards(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
): CardId[] {
  return g.zone(who, zone).map((c) => c.card);
}

/** Total DON!! of `who` on the field: cost area (active + rested) plus given. */
export function donField(g: TestGame, who: PlayerId): number {
  const d = donCounts(g, who);
  return d.active + d.rested + d.given;
}

export function donCounts(g: TestGame, who: PlayerId) {
  return queries.don(g.state, who);
}

/** The decision pending now, as `kind:player` (never reveals more than the opponent sees). */
export function who(g: TestGame): string {
  const d = decision(g);
  return d ? `${d.kind}:${d.player}` : 'none';
}

/** The pending `choose` is owed by `p` and offers these card ids (sorted). */
export function expectOffered(g: TestGame, p: PlayerId, cards: CardId[]): void {
  const d = decision(g);
  expect(`${d?.kind}:${d?.player}`).toBe(`choose:${p}`);
  const got = choices(g)
    .map((i) => g.card(i).card)
    .sort();
  expect(got).toEqual([...cards].sort());
}

/** Activate the single [Activate: Main] on `card` with a raw action. The effect's own prompts are NOT answered. */
export function rawActivate(g: TestGame, card: InstanceId): void {
  const abilities = g
    .legal()
    .flatMap((a) => (a.type === 'activate' && a.card === card ? [a.ability] : []));
  const unique = [...new Set(abilities)];
  if (unique.length !== 1) throw new Error(`Expected one ability on ${card}, got ${unique}`);
  act(g, { type: 'activate', card, ability: unique[0]! });
}

/** Pick the offered card instance of card id `card` in the pending `choose` (strict, ONE named prompt kind). */
export function pickCardId(g: TestGame, card: CardId, nth = 0): void {
  const d = decision(g);
  if (d?.kind !== 'choose') throw new Error(`Expected choose, got ${d?.kind} (${d?.prompt})`);
  const hit = choices(g).filter((i) => g.card(i).card === card)[nth];
  if (!hit)
    throw new Error(`${card} not offered; offered ${choices(g).map((i) => g.card(i).card)}`);
  act(g, { type: 'pick', choice: hit });
}

/** Answer the pending DON!! class pick (a `choose` whose picks are DON!! classes) with `from`. */
export function pickDonClass(g: TestGame, from: 'costActive' | 'costRested' = 'costActive'): void {
  const d = decision(g);
  if (d?.kind !== 'choose') throw new Error(`Expected choose, got ${d?.kind}`);
  const want = donChoices(g).find((o) => o.from === from);
  if (!want) throw new Error(`No ${from} DON!! offered`);
  act(g, { type: 'pick', choice: want });
}

/** True if the pending decision is a DON!! class pick owed by `p`. */
export function asksDon(g: TestGame, p: PlayerId): boolean {
  const d = decision(g);
  return d?.kind === 'choose' && d.player === p && donChoices(g).length > 0;
}

/** True if the pending decision is a count question ("add up to N") owed by `p`. */
export function asksCount(g: TestGame, p: PlayerId): boolean {
  const d = decision(g);
  return d?.kind === 'choose' && d.player === p && d.purpose === 'mode' && !!d.options?.length;
}
