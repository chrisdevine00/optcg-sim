/**
 * Copy-on-write access to a state during one `reduce` (ARCHITECTURE §2.2: "reduce never mutates
 * its input; internally it copies on write only what it touches"). The draft is a helper object;
 * the state it produces is plain JSON.
 */
import type { GameEvent, InstanceId, PlayerId } from './api.ts';
import { nextInt, type RngState } from './rng.ts';
import type { CardInst, PlayerState, State } from './state.ts';

const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
/**
 * Instance ids are `$` plus 7 characters (M2-22). No card number, ability id, label or handle starts
 * with `$`, so the hash and the leak tests can recognise an id anywhere without knowing the field.
 */
export const ID_PREFIX = '$';
/** An engine instance id, alone or at the start of a compound key such as `$abc1234/on-play`. */
export const INSTANCE_ID = /^\$[a-z0-9]{7}$/;
export const INSTANCE_ID_ANYWHERE = /\$[a-z0-9]{7}/;
/** Event fields that may hold an instance id. */
export const CARD_FIELDS = [
  'instance',
  'newInstance',
  'attacker',
  'target',
  'blocker',
  'from',
] as const;

export class Draft {
  readonly s: State;
  readonly events: GameEvent[] = [];
  intentId: string | undefined;
  private cardsCopied = false;
  private readonly copiedCards = new Set<InstanceId>();
  private readonly copiedPlayers = new Set<PlayerId>();
  private modsCopied = false;
  private optCopied = false;
  /** Atomic operations since the step began; the loop guard reads it. */
  ops = 0;
  /** Rule-processing flags (CR 9): players whose deck was touched, or who took damage at 0 Life. */
  readonly deckTouched = new Set<PlayerId>();
  readonly damagedAtZero = new Set<PlayerId>();

  constructor(base: State, intentId?: string) {
    this.s = { ...base, renames: [] };
    this.intentId = intentId;
  }

  card(id: InstanceId): CardInst {
    const c = this.s.cards[id];
    if (!c) throw new Error(`Unknown card instance ${id}`);
    return c;
  }

  /** A writable copy of a card instance. */
  wcard(id: InstanceId): CardInst {
    if (!this.cardsCopied) {
      this.s.cards = { ...this.s.cards };
      this.cardsCopied = true;
    }
    if (!this.copiedCards.has(id)) {
      const c = this.s.cards[id];
      if (!c) throw new Error(`Unknown card instance ${id}`);
      this.s.cards[id] = { ...c };
      this.copiedCards.add(id);
    }
    return this.s.cards[id]!;
  }

  /** A writable copy of a player's zones; arrays are copied with it. */
  pl(p: PlayerId): PlayerState {
    if (!this.copiedPlayers.has(p)) {
      if (this.copiedPlayers.size === 0) this.s.players = { ...this.s.players };
      const o = this.s.players[p];
      this.s.players[p] = {
        ...o,
        deck: o.deck.slice(),
        hand: o.hand.slice(),
        life: o.life.slice(),
        characters: o.characters.slice(),
        stage: o.stage.slice(),
        trash: o.trash.slice(),
      };
      this.copiedPlayers.add(p);
    }
    return this.s.players[p];
  }

  /** Read-only view of a player's zones. */
  ro(p: PlayerId): Readonly<PlayerState> {
    return this.s.players[p];
  }

  mods(): State['mods'] {
    if (!this.modsCopied) {
      this.s.mods = this.s.mods.slice();
      this.modsCopied = true;
    }
    return this.s.mods;
  }

  opt(): string[] {
    if (!this.optCopied) {
      this.s.oncePerTurn = this.s.oncePerTurn.slice();
      this.optCopied = true;
    }
    return this.s.oncePerTurn;
  }

  /** Writable stack (copied on first write). */
  private stackCopied = false;
  stack(): State['stack'] {
    if (!this.stackCopied) {
      this.s.stack = this.s.stack.map((f) => ({ ...f }));
      this.stackCopied = true;
    }
    return this.s.stack;
  }

  emit(e: GameEvent): void {
    if (this.intentId !== undefined) e.intentId = this.intentId;
    if (!e.keys) {
      // Record each referenced card's projection key, so `projectEvents` can derive view handles.
      // Keyed by field, never by id, so two fields naming one card cannot share a key (M2-03).
      let keys: Record<string, string> | undefined;
      for (const f of CARD_FIELDS) {
        const v = e[f];
        if (typeof v === 'string') {
          const c = this.s.cards[v];
          if (c) (keys ??= {})[f] = c.key;
        }
      }
      if (keys) e.keys = keys;
    }
    this.events.push(e);
  }

  rand(n: number): number {
    let v: number;
    [v, this.s.rng] = nextInt(this.s.rng, n);
    return v;
  }

  setRng(r: RngState): void {
    this.s.rng = r;
  }

  /**
   * A fresh instance id from the seeded RNG (ARCHITECTURE §2.2), so an id reveals nothing about
   * deck order or history.
   */
  newId(): InstanceId {
    for (;;) {
      const id = ID_PREFIX + this.randomChars(7);
      if (!(id in this.s.cards)) return id;
    }
  }

  /** A fresh projection key (see `CardInst.key`). */
  newKey(): string {
    return this.randomChars(6);
  }

  private randomChars(n: number): string {
    let out = '';
    let r = this.s.idRng;
    for (let i = 0; i < n; i++) {
      let v: number;
      [v, r] = nextInt(r, 36);
      out += ID_CHARS[v];
    }
    this.s.idRng = r;
    return out;
  }

  /**
   * Re-key an instance: same physical card, new id, for the new-object rule (CR 3-1-6).
   */
  rekey(id: InstanceId): InstanceId {
    const c = this.card(id);
    const nid = this.newId();
    if (!this.cardsCopied) {
      this.s.cards = { ...this.s.cards };
      this.cardsCopied = true;
    }
    Reflect.deleteProperty(this.s.cards, id);
    this.s.cards[nid] = { ...c };
    this.copiedCards.add(nid);
    this.s.renames = [...this.s.renames, [id, nid]];
    return nid;
  }
}
