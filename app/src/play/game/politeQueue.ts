/**
 * Spaces out polite live-region writes (accessibility §9.3, L-SR20). One polite region holds one
 * text: a second write within about 100 ms replaced the first before NVDA could speak it (the
 * puzzle's "Solved" line, 2 ms before "Rematch, or New game."). Lines wait their turn, in order,
 * at least `gap` ms apart; a line written after a quiet spell is written at once.
 */
const MAX_WAITING = 3;

export type Source = 'game' | 'coach';

export class PoliteQueue {
  private queue: { text: string; source: Source }[] = [];
  private lastAt = Number.NEGATIVE_INFINITY;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly write: (text: string, source: Source) => void,
    private readonly gap = 300,
  ) {}

  push(text: string, source: Source = 'game'): void {
    if (!this.queue.length && Date.now() - this.lastAt >= this.gap) {
      this.emit(text, source);
      return;
    }
    // A long backlog (a fast AI turn) would make every line late: past three waiting lines, the
    // rest join the last one. Nothing is dropped and the order holds.
    // Lines of different sources are never merged: a coach line stays its own line, so the
    // interruption-contract tests can read it by itself.
    const last = this.queue[this.queue.length - 1];
    if (this.queue.length >= MAX_WAITING && last && last.source === source) last.text += ` ${text}`;
    else this.queue.push({ text, source });
    this.schedule();
  }

  /** Forget everything waiting (a reveal, a rewind: the lines are stale). */
  clear(): void {
    this.queue = [];
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.lastAt = Number.NEGATIVE_INFINITY;
  }

  private emit(text: string, source: Source): void {
    this.lastAt = Date.now();
    this.write(text, source);
  }

  private schedule(): void {
    if (this.timer || !this.queue.length) return;
    this.timer = setTimeout(
      () => {
        this.timer = null;
        const next = this.queue.shift();
        if (next !== undefined) this.emit(next.text, next.source);
        this.schedule();
      },
      Math.max(0, this.gap - (Date.now() - this.lastAt)),
    );
  }
}
