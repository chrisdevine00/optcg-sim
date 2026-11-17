/**
 * Linkage tracking for the hidden-information leak property (ADR 0005, M2-03): a card that passed
 * through a zone hidden from a viewer must never show that viewer a handle it showed before.
 *
 * Two legitimate repeats are modelled, both narrowly:
 * - a card revealed from a player's hand stays known while it stays there (`revealedInHand`);
 * - a Life card revealed in place (OP15-119, OP15-114 style) keeps its handle, because the card
 *   did not move: the viewer saw "this handle is that card", the view shows it hidden again, and
 *   when that same card later moves or is revealed again the handle repeats (`revealedInLife`,
 *   review M4b-09). The exemption covers exactly that handle, is spent by the next sighting, and
 *   a card that was never revealed in Life gets none.
 */
import type { PlayerId } from '../../src/index.ts';

export class LinkTracker {
  readonly seen: Record<PlayerId, Map<string, Set<string>>> = { p1: new Map(), p2: new Map() };
  readonly hiddenSince: Record<PlayerId, Set<string>> = { p1: new Set(), p2: new Set() };
  readonly revealedInHand: Record<PlayerId, Set<string>> = { p1: new Set(), p2: new Set() };
  /** Life cards revealed in place, with the handle the viewer was shown. */
  readonly revealedInLife: Record<PlayerId, Map<string, string>> = { p1: new Map(), p2: new Map() };
  relinks = 0;
  returns = 0;
  /** How many repeats the Life exemption allowed (so a test can see it is exercised). */
  exempted = 0;

  constructor(private readonly label: string) {}

  /** The viewer is shown card `id` under handle `h`. Throws on a relink after a hidden stretch. */
  note(v: PlayerId, id: string, h: string, where: string): void {
    const set = this.seen[v].get(id) ?? new Set<string>();
    if (this.hiddenSince[v].has(id)) {
      this.returns++;
      if (set.has(h)) {
        if (this.revealedInLife[v].get(id) === h) {
          this.revealedInLife[v].delete(id); // spent: the same card, in the same place
          this.exempted++;
        } else {
          this.relinks++;
          throw new Error(`${this.label}: ${v} relinked ${id} by handle ${h} (${where})`);
        }
      }
    }
    set.add(h);
    this.seen[v].set(id, set);
    this.hiddenSince[v].delete(id);
  }

  /** A `CardRevealed` event showed the viewer card `id` (handle `h`) from `from`. */
  revealed(v: PlayerId, id: string, h: string, from: string | undefined): void {
    this.revealedInHand[v].add(id);
    if (from === 'life') this.revealedInLife[v].set(id, h);
  }

  /** The viewer's view shows card `id` face-down in `zone`. */
  hiddenInView(v: PlayerId, id: string, zone: string): void {
    const known = zone === 'hand' && this.revealedInHand[v].has(id);
    if (this.seen[v].has(id) && !known) this.hiddenSince[v].add(id);
  }

  /** The viewer's view shows card `id` under handle `h` in `zone`. */
  shownInView(v: PlayerId, id: string, h: string, zone: string): void {
    this.note(v, id, h, `view ${zone}`);
    this.revealedInHand[v].delete(id);
  }
}
