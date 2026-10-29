/**
 * The effect DSL (docs/research/effect-dsl.md §4, decisions E-D1..E-D11). A card script is typed,
 * JSON-serializable data: no functions, closures or classes (ADR 0003, ADR 0006). The engine's
 * interpreter (`engine/src/effects/`) runs it; a script says what the card says, and the engine owns
 * every rule that applies to all cards (timing, costs, "up to", Once Per Turn, replacement order).
 *
 * Scripts live in `cards/effects/<SET>/<CARD-ID>.ts`, one `CardScript` per card number, and are
 * validated by `validateScript` (`dsl-validate.ts`) in CI (E-D1).
 *
 * The vocabulary below is the full §4.14 sketch. The runtime implements the part that the scripted
 * archetypes need; `validateScript` rejects anything the runtime does not implement yet, so a script
 * can never silently do nothing (see `IMPLEMENTED` in `dsl-validate.ts`).
 */
import type { CardCategory, Color, Keyword } from './schema.ts';

export type { Keyword };
/** Relative players: `you` controls the ability's source; `opponent` is the other player. */
export type P = 'you' | 'opponent';
/** Names a `may` step for `ifDid`. */
export type Label = string;
/** Names a bound selection (`bind`), read back with `{ ref }`. */
export type Name = string;

export interface CardScript {
  /** Card number, e.g. `OP17-058`. */
  cardId: string;
  /**
   * `textHash(effectText, triggerText)` of the verified card text the script was written from.
   * A test fails when the card data's text changes, so the script is re-verified (PROMPT.md M1).
   */
  textHash: string;
  /** Where the text was verified (the card's override and any person-scale check). */
  verified: { source: string; date: string; note?: string };
  /** Printed keyword lines. Must equal the verified override's `keywords` (E-D7). */
  keywords?: Keyword[];
  rules?: RulesClause[];
  abilities: Ability[];
  /** Official rulings the script and its test follow (rulings.md RL entries, per-set Q&A rows). */
  rulings?: string[];
}

export type RulesClause =
  | { donDeckSize: number }
  | { alsoNamed: string[] }
  | { anyNumberInDeck: true }
  | { deckRestriction: Filter };

interface AbilityBase {
  /** Lower-case id, unique on the card: `on-play`, `opp-attack`, `counter`. */
  id: string;
  /** Short plain-language summary for prompts and logs, e.g. "Give −2000 power". */
  label?: string;
  oncePerTurn?: true;
  conditions?: Condition[];
}

export type AutoAbility = AbilityBase & {
  kind: 'auto';
  /** Two entries are one ability with a shared Once Per Turn ("[When Attacking]/[On Your Opponent's Attack]"). */
  when: AutoTiming[];
  /** "You may" in the effect itself. An auto with a `cost` is optional by construction (CR 8-3-1-4). */
  optional?: true;
  cost?: Cost[];
  effect: Effect;
};
export type ActivateAbility = AbilityBase & {
  kind: 'activate';
  when: ActivateTiming | ActivateTiming[];
  cost?: Cost[];
  effect: Effect;
};
export type TriggerAbility = AbilityBase & { kind: 'trigger'; cost?: Cost[]; effect: Effect };
export type PermanentAbility = AbilityBase & {
  kind: 'permanent';
  /** Where the card must be for the effect to apply (default `field`). */
  zone?: 'field' | 'hand';
  apply: Continuous[];
};
export type ReplacementAbility = AbilityBase & {
  kind: 'replacement';
  replaces: ReplaceEvent;
  /** "you may … instead" (every meta replacement is optional). */
  optional: boolean;
  instead: Cost[] | Effect;
};
export type Ability =
  AutoAbility | ActivateAbility | TriggerAbility | PermanentAbility | ReplacementAbility;

export type ActivateTiming = 'activateMain' | 'main' | 'counter';
export type NamedTiming =
  | 'onPlay'
  | 'whenAttacking'
  | 'onOpponentAttack'
  | 'onBlock'
  | 'onKO'
  | 'endOfYourTurn'
  | 'endOfOpponentsTurn'
  | 'startOfYourTurn'
  | 'startOfGame';
export type AutoTiming =
  | NamedTiming
  | { event: 'cardPlayed'; by: P; filter?: Filter }
  | { event: 'eventActivated'; by: P }
  | { event: 'blockerActivated'; by: P }
  /** "When your Leader … attacks" (`attacker`) or "… is attacked" (`target`). */
  | { event: 'attack'; attacker?: Selector; target?: Selector }
  /** "When a DON!! card on your field is returned to your DON!! deck" (OP17-062). */
  | { event: 'donReturned'; owner: P }
  | { event: 'lifeRemoved'; owner: P | 'any' }
  | { event: 'lifeBecameZero'; owner: P }
  | { event: 'koed'; filter: Filter };

export type Condition =
  | { yourTurn: true }
  | { opponentsTurn: true }
  /** [DON!! xN]: at least N DON!! given to this card (CR 8-3-2-3). */
  | { donGiven: number }
  | { cmp: [Num, CmpOp, Num] }
  | { exists: Selector }
  | { none: Selector }
  | { leader: Filter }
  | { self: Filter }
  | { ref: Name; matches: Filter }
  /** "If you do": the labelled `may` was accepted and performed. */
  | { did: Label }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };
export type CmpOp = '<=' | '>=' | '=' | '<' | '>';

export type Num =
  | number
  | { count: Selector }
  | { life: P | 'both' }
  | { hand: P }
  | { trash: P }
  | { deck: P }
  /** DON!! on a player's field: cost area plus given (rules-digest: the field includes the cost area). */
  | { donOnField: P; state?: 'active' | 'rested' }
  | { donGiven: P }
  | { turnIndex: P }
  | { refCount: Name }
  | { refStat: Name; stat: 'cost' | 'power' | 'basePower' }
  | { sum: Num[] }
  | { mul: [Num, number] };

export type Zone =
  | 'leader'
  | 'characters'
  | 'stage'
  | 'field'
  | 'hand'
  | 'trash'
  | 'deckTop'
  | 'lifeTop'
  | 'lifeTopOrBottom'
  | 'looked'
  | 'self'
  | 'donCostArea'
  | 'donGiven'
  | 'donField'
  | 'donDeck';

export interface Selector {
  from: Zone | Zone[];
  owner: P | 'any';
  filter?: Filter;
  /** Absent: every match ("all of your opponent's Characters", or the one card a zone holds). */
  pick?: Pick;
  /** Who chooses (default `you`); `opponent` for "your opponent trashes 1 card from their hand". */
  chooser?: P;
  /**
   * The chooser picks face-down from a secret area they cannot see (QA-OP17 OP17-075, OP17-099):
   * the engine picks uniformly at random with the seeded RNG, which is the same information.
   */
  blind?: true;
  /** Store the chosen instances in the frame for a later `{ ref }`. */
  bind?: Name;
  /** Event-triggered autos: read the last-known snapshot of the event's subject. */
  lki?: 'subject';
}

export type Pick =
  | { upTo: number; totalCost?: Cmp; distinctNames?: true }
  | { exactly: number }
  | { any: true }
  | { groups: { filter: Filter; upTo: number }[] };

export type Cmp = { lte: Num } | { gte: Num } | { eq: Num };

export type Filter =
  | { category: CardCategory[] }
  | { cost: Cmp }
  | { baseCost: Cmp }
  | { power: Cmp }
  | { basePower: Cmp }
  | { hasCounter: boolean }
  /** An exact element of the card's type list ({Navy}, "Navy" and [Navy] all mean this). */
  | { type: string }
  /** "a type including \"Rocks Pirates\"": a substring of a type element (CR 2-4-3-1). */
  | { typeIncludes: string }
  /** An exact card name (CR 2-1-2). */
  | { name: string }
  | { color: Color }
  | { multicolor: true }
  | { hasTrigger: boolean }
  | { keyword: Keyword }
  | { state: 'active' | 'rested' }
  | { isSelf: boolean }
  /** "If this Character was played on this turn". */
  | { playedThisTurn: true }
  | { ref: Name }
  | { all: Filter[] }
  | { any: Filter[] }
  | { not: Filter };

export type Cost =
  /** DON!! −N: return N DON!! from your field to your DON!! deck (CR 8-3-1-6, 10-2-10). */
  | { donMinus: number }
  /** ①N, "rest N of your DON!! cards": rest N active cost-area DON!! (CR 8-3-1-5; QA-OP08 OP08-082). */
  | { restDon: number | 'any' }
  /** "Trash N cards [with …] from your hand" (CR 10-2-14-1). Picks are `exactly`. */
  | { trash: Selector }
  | { reveal: Selector }
  | { rest: Selector }
  | { restSelf: true }
  | { trashSelf: true }
  | { lifeToHand: { from: 'top' | 'topOrBottom'; n: number } }
  | { turnLifeFaceUp: number }
  | { mill: number }
  /** Replacement payloads: "return 1 DON!! card from your field to your DON!! deck instead". */
  | { returnDon: number }
  | { move: Selector; to: Dest };

export type Duration =
  'battle' | 'thisTurn' | 'untilEndOfOpponentsNextTurn' | 'untilStartOfYourNextTurn';

export interface Dest {
  zone: 'hand' | 'trash' | 'deck' | 'life';
  position?: 'top' | 'bottom' | 'topOrBottom';
  faceUp?: boolean;
}

export type Step =
  | { do: Action; label?: Label }
  | { if: Condition; then: Step[]; else?: Step[] }
  | { may: Step[]; label: Label; prompt?: string }
  | { ifDid: Label; then: Step[] }
  | { chooseOne: Step[][]; chooser?: P; labels: string[] }
  | { forEach: Num; do: Step[] }
  | { delayed: { at: 'endOfThisTurn' }; do: Step[] };
export type Effect = Step[];

export interface Take {
  pick: Pick;
  filter?: Filter;
  reveal?: true;
  to: 'hand' | 'lifeTop';
}

export type Action =
  | { draw: Num; player?: P; upTo?: true }
  | { trashFromHand: Selector }
  | { mill: { player: P; n: number } }
  | {
      lookAtTop: {
        n: number;
        player?: P;
        take: Take[];
        rest: 'bottomAnyOrder' | 'trash' | 'topOrBottomAnyOrder' | 'topAnyOrder';
      };
    }
  | { reveal: { from: 'deckTop' | 'lifeTop'; n: number; bind: Name } }
  | { move: { what: Selector; to: Dest } }
  | { trashLifeUntil: number }
  | { play: { what: Selector; rested?: true } }
  | { ko: Selector }
  | { rest: Selector }
  | { setActive: Selector }
  | { skipRefresh: Selector }
  | { power: { target: Selector; amount: Num; duration: Duration } }
  | { setBasePower: { target: Selector; value: Num; duration: Duration } }
  | { cost: { target: Selector; amount: Num; duration: Duration } }
  | { playCost: { next: Filter; from: 'hand'; amount: number; window: 'thisTurn'; uses: 1 } }
  | { giveDon: { n: Num; state: 'rested' | 'active'; to: Selector; each?: true } }
  | { addDon: { n: number; state: 'active' | 'rested'; upTo?: true }[] }
  | { returnDon: { n: Num | 'toMatchOpponent' } }
  | { grant: { target: Selector; keyword: Keyword; duration: Duration } }
  | { negate: { target: Selector; duration: Duration } }
  | { restrict: { target: Selector | P; what: Restriction; duration: Duration } }
  | { activate: { ability: 'main' | 'onPlay'; of: 'self' } }
  | { select: Selector };

export type Restriction =
  | 'cannotAttack'
  | 'cannotActivateBlockerAgainstIt'
  | 'cannotDrawByOwnEffects'
  | 'cannotBeRemovedByOpponentEffects'
  | 'cannotBeKOd'
  | { cannotPlay: Filter };

export type Continuous =
  | { power: { target: Selector; amount: Num } }
  | { setBasePower: { target: Selector; value: Num } }
  | { cost: { target: Selector; amount: Num } }
  | { playCost: { target: Selector; amount: Num } }
  /** A Counter value for cards in hand (CR 2-10-4: only the highest applies). */
  | { counter: { target: Selector; value: number; onlyIfNone?: true } }
  | { grant: { target: Selector; keyword: Keyword } }
  | { restrict: { target: Selector | P; what: Restriction } }
  /** "Your opponent cannot attack any card other than …" (OP17-044). */
  | { lockAttackTarget: { attacker: P; only: Selector } }
  | { tiers: { when: Condition; apply: Continuous[] }[] };

export type ReplaceEvent = { ko: Selector } | { leaveField: Selector; cause: 'opponentEffect' };

/**
 * Hash of a card's verified text, for `CardScript.textHash`. cyrb53 over the effect and trigger
 * text, so it runs the same in Node and the browser with no dependency.
 */
export function textHash(effectText: string, triggerText: string | null): string {
  const str = `${effectText}\u0000${triggerText ?? ''}`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}
