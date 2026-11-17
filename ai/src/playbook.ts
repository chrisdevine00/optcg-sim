/**
 * Archetype playbooks (ARCHITECTURE §4.6): `ai/playbooks/<leader-id>.json`. Each one is written from
 * the archetype guide's "Game plan by turn" and "Playbook seeds" (`docs/content/archetypes/`), so the
 * Meta Explorer guide and the AI never disagree. A playbook biases the heuristic (weight multipliers,
 * card values, face-versus-board by stage) and the move choice (biases), and lists the game-plan
 * assertions the tests check.
 */
import rocks from '../playbooks/OP17-039.json';
import kaido from '../playbooks/OP17-058.json';
import enel from '../playbooks/OP05-098.json';
import kalgara from '../playbooks/OP08-098.json';
import robin from '../playbooks/OP09-062.json';
import hancock from '../playbooks/OP14-041.json';
import luffyAce from '../playbooks/ST30-001.json';
import luffyRedGreen from '../playbooks/OP13-001.json';
import luffyBlack from '../playbooks/OP17-079.json';

/** The heuristic terms a playbook can scale (see `search/heuristic.ts`). */
export type WeightKey = 'life' | 'hand' | 'counter' | 'board' | 'don' | 'threat';

/**
 * What every bias may carry for "Why?": the guide's line a move follows, with its source. Only
 * biases whose condition is public are cited (a play is public once made; "does not play Buckin
 * while OP17-118 is in hand" is not, so it has no citation).
 */
export interface BiasCite {
  cite?: string;
  /** useOnAttacker: the line for holding the ability back when it changes nothing. */
  citeHold?: string;
  /** The guide's source tag for the line (docs/content/sources.md), or the guide itself. */
  citeSource?: string;
}

/** A move bias. Bonuses are in heuristic units (about one card each). */
export type Bias = BiasCite &
  /** The AI's Leader (or a card) attacks, from the AI's own turn `fromOwnTurn`. */
  (
    | {
        kind: 'attackWith';
        card: 'leader' | string;
        fromOwnTurn: number;
        bonus: number;
        seed: number;
      }
    /**
     * One of the AI's Characters with at least `minPower` power attacks (`withTrigger`: only a card
     * with a [Trigger]), from own turn `fromOwnTurn`. The power is the derived power, so a bonus
     * that needs Linlin on the field (4000 becomes 8000) holds only while she is there.
     */
    | {
        kind: 'attackWithPower';
        minPower: number;
        withTrigger?: boolean;
        fromOwnTurn: number;
        bonus: number;
        seed: number;
      }
    /** Accept this optional ability ("you may") while the AI holds at least `minHand` cards. */
    | {
        kind: 'acceptOptional';
        source: string;
        ability: string;
        minHand: number;
        /** Only while the AI's DON!! deck still has at least this many cards (Robin's pitch, RL-50). */
        donDeckAtLeast?: number;
        /**
         * Only while a card with a [Trigger] is in hand (Hiyori's swap puts one on Life). The
         * condition is a hidden card, so a move that follows it is never cited.
         */
        triggerInHand?: boolean;
        bonus: number;
        seed: number;
      }
    /** Play one of these cards, optionally only from or by an own turn. */
    | {
        kind: 'play';
        cards: string[];
        fromOwnTurn?: number;
        byOwnTurn?: number;
        bonus: number;
        seed: number;
      }
    /** Do not play `card` while `whileInHand` is in hand, from own turn `fromOwnTurn`. */
    | {
        kind: 'avoidPlay';
        card: string;
        whileInHand: string;
        fromOwnTurn: number;
        penalty: number;
        seed: number;
      }
    /**
     * In this ability's target choice, prefer the candidate with the highest power (the opponent's
     * Character, usually) or, with `by: 'cost'`, the highest cost (the AI's own free play).
     */
    | {
        kind: 'targetHighestPower';
        source: string;
        ability: string;
        by?: 'power' | 'cost';
        bonus: number;
        seed: number;
      }
    /**
     * Give DON!! to the AI's Leader (`target: 'leader'`) or to a card with this id, from own turn
     * `fromOwnTurn`: one `bonus` for a move that gives any, however many, while the card holds
     * fewer than `upTo` given DON!! (default 1): the bonus is for getting one there, not for
     * piling them on.
     */
    | {
        kind: 'giveDon';
        target: 'leader' | string;
        fromOwnTurn: number;
        upTo?: number;
        bonus: number;
        seed: number;
      }
    /**
     * Play `card` only when `when` holds (every condition given): otherwise a `penalty`. Both
     * conditions read public facts (the AI's own field, the opponent's Life), so a play that meets
     * them can be cited. `never: true` is "only to win": the penalty is always paid, and a move that
     * wins outscores it (a win is worth 1000).
     */
    | {
        kind: 'playOnlyIf';
        card: string;
        when: {
          /** At least `min` Characters of these ids on the AI's field. */
          ownBoard?: { cards: string[]; min: number };
          /** The opponent has at most this many Life cards. */
          oppLifeAtMost?: number;
          never?: boolean;
        };
        penalty: number;
        seed: number;
      }
    /**
     * Do not attack with the Leader while `card` is in hand and affordable with the DON!! the attack
     * would leave: play it first (Kalgara: Sweet 3 Generals' −3000 goes on before Wyper's sweep).
     */
    | { kind: 'playBeforeLeaderAttack'; card: string; penalty: number; seed: number }
    /**
     * In this ability's choice from the AI's own hand, prefer a card with a [Trigger] (Hiyori puts a
     * known Trigger card on top of Life). Never cited: the pick is a hidden card.
     */
    | { kind: 'pickWithTrigger'; source: string; ability: string; bonus: number; seed: number }
    /**
     * On the opponent's attack, use this once-per-turn ability on their attacking Character when it
     * changes the battle (the attacker falls below the defender, or the Counter needed falls).
     */
    | { kind: 'useOnAttacker'; source: string; ability: string; bonus: number; seed: number }
    /**
     * Play `card` only after the Leader has attacked this turn (its [When Attacking] has had the
     * chance to shrink a target), when the opponent has a Character in the power window.
     */
    | {
        kind: 'playAfterLeaderAttack';
        card: string;
        targetPower: [number, number];
        penalty: number;
        seed: number;
      }
    /**
     * Group 2 additions (Luffy & Ace, OP13-001, OP17-079). `playOnlyWhen`: in the Main Phase play
     * one of `cards` only while `when` holds (a penalty otherwise). With `beforeLeaderAttack` it
     * also wants the play before the Leader has attacked this turn.
     */
    | {
        kind: 'playOnlyWhen';
        cards: string[];
        when: PlayCondition;
        beforeLeaderAttack?: boolean;
        penalty: number;
        seed: number;
      }
    /** Never play a Character whose base power is `minPower` or more. */
    | { kind: 'avoidBasePower'; minPower: number; penalty: number; seed: number }
    /** From own turn `fromOwnTurn`, give the Leader a DON!! each turn before passing. */
    | { kind: 'leaderDon'; fromOwnTurn: number; bonus: number; seed: number }
    /** From own turn `fromOwnTurn`, pass the turn with `min` to `max` active DON!!. */
    | {
        kind: 'keepActiveDon';
        fromOwnTurn: number;
        min: number;
        max: number;
        penalty: number;
        seed: number;
      }
    /**
     * Own turns `fromOwnTurn` to `toOwnTurn`: a Leader attack takes every active DON!! that no
     * [Counter] Event in hand needs (more power raises the Counter the defender needs).
     */
    | { kind: 'spareDon'; fromOwnTurn: number; toOwnTurn: number; bonus: number; seed: number }
    /** In this ability's target choice, prefer a card from `cards`. */
    | {
        kind: 'preferPick';
        source: string;
        ability: string;
        cards: string[];
        bonus: number;
        seed: number;
      }
  );

/** When a `playOnlyWhen` card may be played (public conditions only). */
export type PlayCondition =
  /** The opponent has a rested Character with cost `maxCost` or less. */
  | { kind: 'oppRestedCharacter'; maxCost: number }
  /** The opponent has an active Character or an active DON!!. */
  | { kind: 'oppActive' }
  /** The AI has a Character whose cost is `cost` or more. */
  | { kind: 'ownCostAtLeast'; cost: number };

/** A measurable game-plan assertion (ARCHITECTURE §4.6), checked by the tests. */
export interface Assertion {
  /** The guide's playbook seed number. */
  seed: number;
  text: string;
  /** The share of qualifying situations that must satisfy it. */
  threshold: number;
  source: string;
}

/** One thing a keepable hand needs (strategy-concepts §9 [S9]; the guide's "keepable hand"). */
export interface MulliganPiece {
  name: string;
  /** How the guide says it, for "Why?". */
  label: string;
  /** Cards that count for it; omitted: any card with a Counter (Character or [Counter] Event). */
  cards?: string[];
  min: number;
}

/** Keep when every piece is met; going second, `secondShort` pieces may be missing. */
export interface MulliganRule {
  pieces: MulliganPiece[];
  secondShort: number;
  /** Pieces required going first whatever `secondShort` says. */
  requireGoingFirst: string[];
  /** Where the rule comes from (docs/content/sources.md tag, or the guide). */
  source: string;
}

export interface LeaderTrickCopy {
  /** The ability's short name in copy ("−2000"). */
  name: string;
  claim: string;
  nextTime: string;
  lessonId: string;
  sources: string[];
}

export interface Playbook {
  leaderId: string;
  archetypeId: string;
  /** How explanations name this AI (explanations.md copy rules: by its Leader). */
  aiName: string;
  asOf: string;
  guide: string;
  /** Where each choice comes from. */
  notes?: string[];
  /** Turn order (strategy-concepts §10, S17). */
  goFirst: boolean;
  digTargets: string[];
  winConditions: string[];
  /** Extra value of a card on this AI's field, for its ongoing effect. */
  cardValue: Record<string, number>;
  weights: Partial<Record<WeightKey, number>>;
  /** Multiplier on the opponent's Life term by the AI's own turn: T1–2, T3–4, T5 on. */
  faceBias: { early: number; mid: number; late: number };
  /** Multiplier on the AI's own Life term: above 1 counters more readily. */
  counterAggression: number;
  mulligan: MulliganRule;
  biases: Bias[];
  assertions: Assertion[];
  /** The Leader's defensive trick, for "Why?" (explanations.md E16). */
  leaderTrick?: LeaderTrickCopy & { source: string; ability: string };
}

const ALL = [
  rocks,
  kaido,
  robin,
  enel,
  kalgara,
  hancock,
  luffyAce,
  luffyRedGreen,
  luffyBlack,
] as unknown as Playbook[];

export const PLAYBOOKS: ReadonlyMap<string, Playbook> = new Map(ALL.map((p) => [p.leaderId, p]));

export function playbookFor(leaderId: string): Playbook | null {
  return PLAYBOOKS.get(leaderId) ?? null;
}

/** The AI's own turn count: T1 is its first turn (the guides count turns this way). */
export function ownTurn(turn: number, first: boolean): number {
  return first ? Math.ceil(turn / 2) : Math.floor(turn / 2);
}

/** Game stage for `faceBias`. */
export function stageOf(own: number): 'early' | 'mid' | 'late' {
  return own <= 2 ? 'early' : own <= 4 ? 'mid' : 'late';
}
