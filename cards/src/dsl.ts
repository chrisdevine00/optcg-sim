/**
 * The effect DSL (docs/research/effect-dsl.md §4, decisions E-D1..E-D11). A card script is typed,
 * JSON-serializable data: no functions, closures or classes (ADR 0003, ADR 0006). The engine's
 * interpreter (`engine/src/effects/`) runs it; a script says what the card says, and the engine owns
 * every rule that applies to all cards (timing, costs, "up to", Once Per Turn, replacement order).
 *
 * Scripts live in `cards/effects/<SET>/<CARD-ID>.ts`, one `CardScript` per card number, and are
 * validated by `validateScript` (`dsl-validate.ts`) in CI (E-D1).
 *
 * The vocabulary below is the full §4.14 sketch. The runtime implements the part the meta needs
 * (M4a: Rocks and Kaido; M4b wave 1: the other 143 meta cards, effect-dsl.md §4.15);
 * `validateScript` rejects anything the runtime does not implement, so a script can never silently
 * do nothing (see `IMPLEMENTED` in `dsl-validate.ts`).
 */
import type { PrintedTiming } from './printed.ts';
import type { Attribute, CardCategory, Color, Keyword } from './schema.ts';

export type { Keyword };
/** Relative players: `you` controls the ability's source; `opponent` is the other player. */
export type P = 'you' | 'opponent';
/** Names a `may` step, or a `do` step that did something, for `ifDid` ("If you do"). */
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
  /**
   * The cost is worded "you may" (CR 8-3-1-4). On an Event, playing the card (paying its printed
   * cost and trashing it) is separate from this cost, which is then asked and may be declined: the
   * effect alone does not activate (DECISIONS 2026-10-29, B-1).
   */
  costOptional?: true;
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
  /**
   * One event, or a list of K.O. / removal events that one ability covers with a single Once Per
   * Turn ("would be K.O.'d or would be removed from the field by your opponent's effect", G14 b).
   */
  replaces: ReplaceEvent | ReplaceEvent[];
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
  /**
   * `from`: where the card was played from (`trash`: "played from your trash"); `via`: how it was
   * played, `rule` (the normal play from hand), `effect` (any effect) or `characterEffect` (an
   * effect whose source is a Character) (M6b wave 3, G25).
   */
  | {
      event: 'cardPlayed';
      by: P;
      filter?: Filter;
      from?: 'hand' | 'trash';
      via?: 'rule' | 'effect' | 'characterEffect';
    }
  | { event: 'eventActivated'; by: P }
  | { event: 'blockerActivated'; by: P }
  /**
   * "When a [Trigger] activates" (G56): a Life card's [Trigger] is activated (the damaged player
   * chose to reveal and use it), not merely added to a hand. `by` is the player whose [Trigger]
   * it is, relative to the watcher; `any` is either player's. The effect resolves after the
   * [Trigger] has (pending effects wait for the damage processing to end).
   */
  | { event: 'triggerActivated'; by: P | 'any' }
  /** "When your Leader … attacks" (`attacker`) or "… is attacked" (`target`). */
  | { event: 'attack'; attacker?: Selector; target?: Selector }
  /**
   * "When a DON!! card on your field is returned to your DON!! deck" (OP17-062). One event per
   * instruction that returns DON!!, with the number returned. `min`: "2 or more DON!! cards are
   * returned" (G40); `cause`: "by your effect" (`yourEffect`) or by the other player's
   * (`opponentEffect`), any effect (`effect`); a DON!! −N cost is part of the effect (RL-16).
   */
  | {
      event: 'donReturned';
      owner: P;
      min?: number;
      cause?: 'effect' | 'yourEffect' | 'opponentEffect';
    }
  | { event: 'lifeRemoved'; owner: P | 'any' }
  /**
   * "When you take damage" (G43): `owner` took damage (battle or effect), at least one Life card
   * was taken, and the damage processing, [Trigger] included, has ended (rules-digest 106). One
   * event per damage (a Double Attack's 2 points are one damage). A damage a replacement stopped
   * is not taken.
   */
  | { event: 'damageTaken'; owner: P }
  | { event: 'lifeBecameZero'; owner: P }
  /**
   * "When one of your Characters is K.O.'d" (`owner` absent or `you`), or "when one of your
   * opponent's Characters is K.O.'d" (`owner: 'opponent'`, G38).
   */
  | { event: 'koed'; filter: Filter; owner?: P }
  /**
   * "When a card is trashed from your hand by an effect" (G22): fires once per instruction with
   * the number trashed (`{ eventCount }`). `by`: whose effect (relative to the watcher; absent:
   * either), `sourceFilter`: the effect's source card. A cost trash counts only with `includeCosts`
   * (M6b-Q31 is open).
   */
  | { event: 'trashedFromHand'; owner: P; by?: P; sourceFilter?: Filter; includeCosts?: true }
  /**
   * "When this Character becomes rested" (G24): a card of `owner` (or either) goes from active to
   * rested. Without `by` any cause counts (an effect, a cost, an attack or a block). `by` limits it
   * to a rest by an effect: any (`effect`), the watcher's (`yourEffect`) or the other player's
   * (`opponentEffect`); `sourceFilter` is the effect's source card ("by your opponent's
   * Character's effect"). M6b-Q30 is open.
   */
  | {
      event: 'rested';
      owner: P | 'any';
      filter?: Filter;
      by?: 'effect' | 'yourEffect' | 'opponentEffect';
      sourceFilter?: Filter;
    }
  /**
   * "When your Character is removed from the field" (G29): a Character or Stage of `owner` leaves
   * the field by any move (a K.O., trashed, returned to hand or deck; battle, effect, cost or rule).
   * `cause` limits it to an effect: any (`effect`, a cost included), the watcher's (`yourEffect`)
   * or the other player's (`opponentEffect`); `to`: where it went. `filter` reads the card where it
   * now is (printed values, M6b-Q20). `leftField` is the same event.
   */
  | {
      event: 'removed' | 'leftField';
      owner: P;
      filter?: Filter;
      cause?: 'effect' | 'yourEffect' | 'opponentEffect';
      to?: 'hand' | 'deck' | 'trash';
    };

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
  | { not: Condition }
  /**
   * `[On K.O.]` and "when this Character is K.O.'d" qualified by the cause (G28): `opponentEffect`
   * is an effect of the K.O.'d card's controller's opponent, `effect` an effect of either player
   * (a cost included, as `cause: 'effect'` of a replacement). False when the ability did not
   * resolve from a K.O.
   */
  | { koCause: 'opponentEffect' | 'effect' }
  /** "A Character of P has been K.O.'d during this turn" (G26): any cause, either player's doing. */
  | { koedThisTurn: P }
  /**
   * "A card in P's hand was trashed by an effect during this turn" (G69): a card trashed from P's
   * hand by an effect of either player or as a cost (a cost is part of the effect, M6b-Q31), at any
   * earlier point of the turn, whatever the ability that reads it.
   */
  | { handTrashedThisTurn: P }
  /**
   * "The attacking card is …" (G71): the card attacking in the battle that triggered this ability
   * matches the filter, read at its current attributes and cost. Only in an auto ability whose
   * every timing is `onOpponentAttack`, as an ability condition ("when your opponent's Character
   * attacks") or in an effect's `if` ("if that Character has <Slash>"). False when there is no
   * battle.
   */
  | { attackerIs: Filter }
  /** "P has activated an Event [with a base cost …] during this turn" (G26). */
  | { eventsActivatedThisTurn: P; baseCost?: Cmp };
export type CmpOp = '<=' | '>=' | '=' | '<' | '>';

export type Num =
  | number
  | { count: Selector; distinctNames?: true }
  | { life: P | 'both' }
  /** The number of face-up cards in a player's Life area (G41): "if you have a face-up Life card". */
  | { lifeFaceUp: P }
  | { hand: P }
  | { trash: P }
  | { deck: P }
  /** DON!! on a player's field: cost area plus given (rules-digest: the field includes the cost area). */
  | { donOnField: P; state?: 'active' | 'rested' }
  | { donGiven: P }
  | { turnIndex: P }
  | { refCount: Name }
  /** The number a `chooseNumber` action bound (G44). */
  | { chosen: Name }
  | { refStat: Name; stat: 'cost' | 'power' | 'basePower' | 'donGiven' }
  /**
   * A stat of the one card a selector names (G67): `from: 'leader'` or `'self'`, no pick, so it
   * reads a card without asking anyone. "This Character's base power becomes the same as your
   * Leader's base power" (OP14-053) is `setBasePower` with this as its value, which a `{ refStat }`
   * cannot be since a permanent has nothing bound. 0 when the card is not there.
   */
  | { statOf: Selector; stat: 'cost' | 'power' | 'basePower' }
  /**
   * The current costs of every card a selector names added up (G67): "if the total cost of your
   * Characters is 5 or more" (OP10-022). A selector with no pick over the field.
   */
  | { totalCost: Selector }
  /**
   * The number of DON!! cards given to the card a `power` or `cost` action is applying to, read
   * once per target ("-1000 power for every DON!! card given to that Character", G34). Only an
   * amount of those two actions has a target to read.
   */
  | { donGivenToTarget: true }
  /**
   * The current power of the card a `power` or `cost` action is applying to, read once per target
   * and floored at 0. `{ mul: [{ targetPower: true }, -1] }` is "set the power to 0" (CR 4-12-1:
   * it lowers by the current power, so buffs and given DON!! do not survive, B4T-R1).
   */
  | { targetPower: true }
  | { sum: Num[] }
  | { mul: [Num, number] }
  /** Integer floor of a division: "for every 5 cards in your trash" (G23). The divisor is >= 1. */
  | { div: [Num, number] }
  /** The number of cards the event that triggered this ability moved (trashed from hand, G22). */
  | { eventCount: true };

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
  /**
   * "Reveal up to N ... from your hand" (block 3 batch A review, B3B-R3): the chosen cards are
   * shown to the opponent (a `CardRevealed` event, reason `effect`) once chosen. Only for cards in
   * your own hand (`from: 'hand'`, `owner: 'you'`); the cost `{ reveal: Selector }` already shows
   * the cards of a cost.
   */
  reveal?: true;
  /** Store the chosen instances in the frame for a later `{ ref }`. */
  bind?: Name;
  /**
   * Event-triggered autos (D9): only the card the event is about, the one just played for a
   * `cardPlayed` timing ("that Character"), and only while it is still in the zones the selector
   * names and passes its filter. Without `pick` the pool (the one card, or none) is bound whole.
   */
  lki?: 'subject';
}

export type Pick =
  /**
   * `totalCost`: the chosen cards' costs add up to at most this; `totalPower` (G55): their powers
   * do, "with a total power of 4000 or less" (current power, as `totalCost` reads current cost).
   */
  | { upTo: number; totalCost?: Cmp; totalPower?: { lte: Num }; distinctNames?: true }
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
  /** "a card name including \"Ace\"": a substring of the card name (CR 2-1-2, M6b wave 2, G13). */
  | { nameIncludes: string }
  | { color: Color }
  /** A printed attribute: "Characters with the <Slash> attribute" (M6b wave 1, G3). */
  | { attribute: Attribute }
  | { multicolor: true }
  | { hasTrigger: boolean }
  /**
   * Printed text (G49), read from the card's verified text, not its script: `hasBaseEffect: false`
   * is "with no base effect" (a card with only keywords has none; a [Trigger] is an effect,
   * M6b-Q70); `hasTiming` is "with an [On Play] effect" ("without": `{ not: { hasTiming } }`).
   */
  | { hasBaseEffect: boolean }
  | { hasTiming: PrintedTiming }
  | { keyword: Keyword }
  | { state: 'active' | 'rested' }
  | { isSelf: boolean }
  /** "If this Character was played on this turn". */
  | { playedThisTurn: true }
  /** The number of DON!! cards given to the card: "with a DON!! card given" (gte 1), G34. */
  | { donGiven: Cmp }
  | { ref: Name }
  /** "With the same card name as" the card a selector bound (G54); a card that is gone matches nothing. */
  | { sameNameAs: Name }
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
  /**
   * "Turn N of your Life cards face-up": the top N, which must be face-down. The object form (G68)
   * is "turn 1 card from the top or bottom of your Life cards face-up": one card at the named end
   * (`topOrBottom`: the player picks an end whose card is face-down; the choice is public).
   */
  | { turnLifeFaceUp: number | { n: 1; from: 'top' | 'bottom' | 'topOrBottom' } }
  /**
   * "Give your active Leader -5000 power during this turn" as a cost (G62): a modifier on the card
   * a cost selector names (your Leader), paid only while that card matches (an active Leader).
   */
  | { power: { target: Selector; amount: number; duration: Duration } }
  /**
   * "Turn N of your Life cards face-down": the top N, which must be face-up (G8). The object form
   * (G68) names the end, as `turnLifeFaceUp` does, and needs a face-up card at it.
   */
  | { turnLifeFaceDown: number | { n: 1; from: 'top' | 'bottom' | 'topOrBottom' } }
  | { mill: number }
  /**
   * "Trash N cards from the top of your Life cards" (G30): not damage, so no [Trigger]; the card
   * is trashed face up. Payable while the Life area holds N cards.
   */
  | { trashLife: number }
  /**
   * Replacement payloads: "return 1 DON!! card from your field to your DON!! deck instead". The
   * object form returns active cost-area DON!! only: "return 2 of your active DON!! cards" (G9).
   * `{ atLeast: n }` is "return n or more DON!! cards from your field to your DON!! deck" (G42):
   * the player chooses how many, from n to every DON!! card on their field, and which ones; one
   * `donReturned` event for the whole number. Not a replacement payload.
   */
  | { returnDon: number | { n: number; state: 'active' } | { atLeast: number } }
  /**
   * "Return N total of your currently given DON!! cards to your cost area rested" (G70): the DON!!
   * leave the cards they are given to (the player chooses which, N may come from several cards) and
   * go rested to the cost area; they stay on the field, so nothing returns to the DON!! deck and no
   * `donReturned` watcher fires. Payable with N or more DON!! given to your Leader and Characters.
   */
  | { returnGivenDon: number }
  /** "Give N active DON!! cards to your Leader or 1 of your Characters" as a cost (G7). */
  | { giveDon: { n: number; state: 'active'; to: Selector } }
  /** "Give 1 of your opponent's rested DON!! cards to 1 of your opponent's Characters" (G20). */
  | { giveDon: { n: number; state: 'rested'; to: Selector; from: 'opponent' } }
  /**
   * "K.O. 1 of your Characters": a cost that is a real K.O. of one of your own Characters (G1).
   * It is part of the effect (CR 8-1-1), so "cannot be K.O.'d by effects" stops it (RL-16).
   */
  | { ko: Selector }
  | { move: Selector; to: Dest }
  /**
   * "A or B": the player pays one of the alternatives, a list of costs each (G19). Payable when
   * any alternative is; a choice is asked only when more than one can be paid.
   */
  | { oneOf: Cost[][] };

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
  /**
   * `labels` are worded for the chooser (shown on their decision). `neutral` words each mode for
   * both players' logs, e.g. "Charlotte Linlin's player draws 2 cards." (M4a-11).
   */
  | { chooseOne: Step[][]; chooser?: P; labels: string[]; neutral?: string[] }
  | { forEach: Num; do: Step[] }
  /**
   * `endOfThisTurn`: after this turn's [End of Your Turn] effects. `startOfOpponentsNextMainPhase`
   * (D8): at the start of the Main Phase of the other player's next turn, after that Main Phase's
   * own "start of Main Phase" effects; conditions written outside the `delayed` step are read when
   * it is created, not then (official PRB02 Q&A for PRB02-005).
   */
  | { delayed: { at: 'endOfThisTurn' | 'startOfOpponentsNextMainPhase' }; do: Step[] };
export type Effect = Step[];

export interface Take {
  pick: Pick;
  filter?: Filter;
  reveal?: true;
  /** `play`: play the taken Characters for free, rested with `rested` (G17). */
  to: 'hand' | 'lifeTop' | 'play';
  rested?: true;
}

export type Action =
  | { draw: Num; player?: P; upTo?: true }
  | { trashFromHand: Selector }
  /** Trash the top n cards of a deck, as many as it holds (G4). */
  | { mill: { player: P; n: Num } }
  | {
      lookAtTop: {
        n: number;
        /**
         * Whose deck. `opponent` is look-only (G31): no `take`, and the cards stay where they are
         * (`rest: 'stay'`); the looker remembers them until the deck changes.
         */
        player?: P;
        take: Take[];
        /**
         * `topAnyOrder`: all the cards go back on top, in an order you choose (G31). `stay`: nothing
         * is taken and nothing moves (look only).
         */
        rest: 'bottomAnyOrder' | 'trash' | 'topOrBottomAnyOrder' | 'topAnyOrder' | 'stay';
      };
    }
  | {
      reveal: {
        from: 'deckTop' | 'lifeTop';
        n: number;
        bind: Name;
        /**
         * `opponent`: reveal the top card of the opponent's deck to both players (G44). It stays
         * on top, known to both until the deck is shuffled or the card moves.
         */
        player?: 'opponent';
      };
    }
  /**
   * "Choose a cost" (G44): the controller names a whole number from `min` to `max` (at most 10).
   * Everyone is told the number. It is read back with `{ chosen: bind }`, for instance as the
   * right side of a cost comparison against a revealed card.
   */
  | { chooseNumber: { min: number; max: number; bind: Name } }
  | { move: { what: Selector; to: Dest } }
  | { trashLifeUntil: number }
  /**
   * "Turn all of your Life cards face-down" (G41): every face-up card of your Life area turns
   * face-down (the cost form turns the top N, G8). Face-down cards stay as they are.
   */
  | { turnLifeFaceDown: 'all' }
  /** "You take N damage" / "deal N damage to your opponent": real damage, a [Trigger] may activate (G36). */
  | { damage: { player: P; n: Num } }
  /** "You win the game" (G35): the controller wins at once. */
  | { winGame: true }
  /**
   * "Select 2 Characters. Swap their base power with each other during this turn / battle" (G33):
   * `a` and `b` are chosen one after the other (`b` is never the card `a` chose); each one's base
   * power becomes the other's, read when the effect resolves.
   */
  | { swapBasePower: { a: Selector; b: Selector; duration: Duration } }
  /** "Up to 1 of your Leader or Character cards can also attack active Characters during this turn" (G32). */
  | { canAttackActive: { target: Selector; duration: Duration } }
  /**
   * An Event (or any effect) creates a replacement that lasts to the end of the turn (D6): "if any
   * of your Characters would be K.O.'d in battle during this turn, you may trash 1 card from your
   * hand instead". It may apply to every matching event of the turn.
   */
  | {
      addReplacement: {
        replaces: ReplaceEvent;
        optional: boolean;
        instead: Cost[] | Effect;
        duration: 'thisTurn';
      };
    }
  /**
   * `player: 'opponent'` (G51): your opponent plays the card, from their own hand, and chooses it
   * ("your opponent plays up to 1 Character card with a cost of 4 or less from their hand"); the
   * selector then names their hand and `chooser: 'opponent'`. `what` may also read the top card of
   * your deck or Life that an earlier `reveal` bound (`filter: { ref }`, G53).
   */
  | { play: { what: Selector; rested?: true; player?: 'opponent' } }
  | { ko: Selector }
  | { rest: Selector }
  | { setActive: Selector }
  /**
   * "Will not become active in your next Refresh Phase": a card (`from` a field zone), or (G48)
   * `{ from: 'donCostArea', owner: 'opponent', filter: { state: 'rested' }, pick: { upTo: n } }`,
   * "up to n of your opponent's rested DON!! cards": that many of their rested DON!! stay rested
   * (as many as they have, up to n).
   */
  | { skipRefresh: Selector }
  | { power: { target: Selector; amount: Num; duration: Duration } }
  | { setBasePower: { target: Selector; value: Num; duration: Duration } }
  | { cost: { target: Selector; amount: Num; duration: Duration } }
  | { playCost: { next: Filter; from: 'hand'; amount: number; window: 'thisTurn'; uses: 1 } }
  | {
      giveDon: {
        n: Num;
        /** With `from: 'opponent'`, `any` lets the giver pick active or rested DON!! (G20). */
        state: 'rested' | 'active' | 'any';
        to: Selector;
        each?: true;
        /**
         * Give the opponent's DON!! to the opponent's own Leader or Characters (G20): the giver
         * chooses which DON!! and which card; they return to their owner at Refresh (CR 6-2-3).
         */
        from?: 'opponent';
      };
    }
  /** `player: 'opponent'` (G51): the DON!! come from the opponent's DON!! deck onto their field. */
  | { addDon: { n: number; state: 'active' | 'rested'; upTo?: true }[]; player?: 'opponent' }
  /**
   * `player: 'opponent'`: the opponent returns n DON!! from their field (they choose which, as many
   * as they have); `from: 'active'` limits it to their active cost-area DON!! (G27).
   */
  | { returnDon: { n: Num | 'toMatchOpponent'; player?: 'opponent'; from?: 'active' } }
  /**
   * `keyword` and/or `attribute` (G59): "gains [Rush: Character] and the <Slash> attribute during
   * this turn". An attribute granted is read by the `attribute` filter wherever the card is; it does
   * not replace the printed ones.
   */
  | { grant: { target: Selector; keyword?: Keyword; attribute?: Attribute; duration: Duration } }
  | { negate: { target: Selector; duration: Duration } }
  | { restrict: { target: Selector | P; what: Restriction; duration: Duration } }
  | {
      activate:
        | { ability: 'main' | 'onPlay' | 'onKO' | 'counter'; of: 'self' }
        /**
         * "Activate up to 1 Event ... from your hand" / "activate the [Main] effect of an Event
         * ... in your trash" (D2). From the hand: the Event is revealed and trashed without paying
         * its printed cost, its [Main] runs with its own activation costs, and it counts as an Event
         * activation for watchers. From the trash: only its [Main] runs, the card stays, and no
         * watcher sees an Event activated (official OP12, OP15, EB03 Q&A).
         */
        | { ability: 'main'; of: Selector };
    }
  /**
   * "Look at up to 1 card from the top of your or your opponent's Life cards and place it at the top
   * or bottom of the Life cards" (`owner: 'any'`: you choose whose, or none; with `you` or
   * `opponent` the look is not optional), or "look at all of your Life cards and place them back in
   * any order" (G64). The cards stay in their owner's Life with the face state they had; only you
   * see them, and you remember what you saw.
   */
  | {
      lookAtLife:
        | { owner: P | 'any'; n: 1; place: 'topOrBottom' }
        | { owner: 'you'; n: 'all'; place: 'anyOrder' };
    }
  /**
   * "Give up to 1 of your currently given DON!! cards to 1 of your Characters" (G65): take `n` DON!!
   * from the card `from` chooses (your Leader or a Character with DON!! given) and give them to the
   * card `to` chooses (never the same card). Both are yours; no DON!! changes state.
   */
  | { moveDon: { n: number; from: Selector; to: Selector } }
  /**
   * "Change the attack target to the selected card" (D3): during an opponent's attack, before the
   * Block Step, the target becomes the card `to` chooses among your Leader and Characters, active or
   * rested. [When Attacking] and [On Your Opponent's Attack] do not fire again; a Blocker may still
   * be declared against the new target (but not by it).
   */
  | { redirectAttack: { to: Selector } }
  | { select: Selector };

/** Which K.O.s a scoped `cannotBeKOd` stops (RL-14); a cost counts as an effect (RL-16). */
export type KOCause = 'effect' | 'opponentEffect' | 'battle';

export type Restriction =
  | 'cannotAttack'
  | 'cannotActivateBlockerAgainstIt'
  | 'cannotDrawByOwnEffects'
  /**
   * "You cannot add Life cards to your hand using your own effects" (G60): a restriction on a
   * player. It stops your effect (a cost included, M6b-Q31) taking a Life card of yours into your
   * hand; damage and your opponent's effects are not stopped.
   */
  | 'cannotAddLifeToHandByOwnEffects'
  /**
   * "This card in your hand cannot be played by effects" (G63): a permanent of a card in your hand
   * (`zone: 'hand'`, target `self`). Playing it from your hand by the rules stays legal.
   */
  | 'cannotBePlayedByEffects'
  | 'cannotBeRemovedByOpponentEffects'
  /** Cannot be K.O.'d at all: by effects and in battle (RL-14). */
  | 'cannotBeKOd'
  /**
   * "Cannot be K.O.'d by effects" / "by your opponent's effects" / "in battle" (G6). `by` limits it
   * to a K.O. whose source card matches (G46): the attacker for `battle` ("in battle by <Slash>
   * attribute cards", "by Leaders"), the card whose effect it is for `effect` and `opponentEffect`
   * ("by effects of Characters without the <Special> attribute"). The filter reads printed and
   * current values of that card, nothing relative to the protected card (no `ref`, no `isSelf`).
   */
  | { cannotBeKOd: { cause: KOCause; by?: Filter } }
  /**
   * "Cannot be rested": it cannot attack, activate [Blocker], pay a rest cost or be rested by any
   * effect (rules-digest 57, G2).
   */
  | 'cannotBeRested'
  /** "Cannot be rested by your opponent's effects": costs, rule rests and your own effects pass. */
  | { cannotBeRested: { by: 'opponentEffect' } }
  /** This card cannot activate [Blocker] (the blocking side, G10). */
  | 'cannotActivateBlocker'
  /**
   * "Cannot attack your opponent's Characters with a base cost of 7 or less" (G47): the restricted
   * Leader or Character cannot attack a card matching the filter. The filter reads the target:
   * printed and current values, keywords and rested state, nothing relative to the attacker.
   */
  | { cannotAttackTarget: Filter }
  /**
   * "You cannot play <cards> during this turn". Plays by any means unless `from: 'hand'` ("cannot
   * play cards from your hand", OP13-028): then only plays of a card in the hand are barred and a
   * play from the trash, deck or Life by an effect is not (M6b-Q33).
   */
  | { cannotPlay: Filter; from?: 'hand' }
  /**
   * "You cannot set DON!! cards as active using Character effects" (G21): a restriction on a
   * player. The effects of Leaders, Stages and Events stay allowed.
   */
  | { cannotSetDonActive: { by: 'characterEffects' } };

export type Continuous =
  | { power: { target: Selector; amount: Num } }
  | { setBasePower: { target: Selector; value: Num } }
  | { cost: { target: Selector; amount: Num } }
  | { playCost: { target: Selector; amount: Num } }
  /** A Counter value for cards in hand (CR 2-10-4: only the highest applies). */
  | { counter: { target: Selector; value: number; onlyIfNone?: true } }
  | { grant: { target: Selector; keyword: Keyword } }
  | { restrict: { target: Selector | P; what: Restriction } }
  /**
   * "Your Character cards are played rested" (G50): every card of yours matching the filter that
   * enters the field by a play, from a hand or by an effect, is rested.
   */
  | { playRested: Filter }
  /**
   * "Your Leader and all of your Characters that do not have a type including X have their effects
   * negated" (G66): the cards the selector names, at the first stage of the layers. A source never
   * negates itself, and a negated source produces nothing.
   */
  | { negate: { target: Selector } }
  /** "Your opponent cannot attack any card other than …" (OP17-044). */
  | { lockAttackTarget: { attacker: P; only: Selector } }
  | { tiers: { when: Condition; apply: Continuous[] }[] };

/**
 * What a replacement replaces. `ko` without a `cause` replaces every K.O. of the matched cards; with
 * one, only that cause (`effect`: an effect of either player or a cost; `opponentEffect`: an effect
 * of the card owner's opponent; `battle`). `leaveField` is a removal from the field: by the owner's
 * opponent's effect (`opponentEffect`), or by any cause, a battle K.O. and your own effects included
 * (`any`, G14). `damage` replaces damage to the controller of the replacing card (D4); the
 * replacement's payload happens instead and no Life card is taken (CR 4-6-3-1, rules-digest 103).
 */
export type ReplaceEvent =
  | { ko: Selector; cause?: 'opponentEffect' | 'effect' | 'battle' }
  | { leaveField: Selector; cause: 'opponentEffect' | 'any' }
  | { damage: 'you' }
  /**
   * "If this Character would be rested by your opponent's Character's effect" (G37): a rest by an
   * effect whose source is a Character of the card owner's opponent. The rest does not happen.
   */
  | { rest: Selector; cause: 'opponentCharacterEffect' };

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
