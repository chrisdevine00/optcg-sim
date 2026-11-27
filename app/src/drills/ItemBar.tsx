/**
 * The bar every item screen carries: where you are ("Item 3 of 10"), where the item came from, the
 * timer, and the three things that are not answers: Show answer, Skip and Leave. None of them is
 * styled as the answer to the item, and Show answer counts the item as shown, not correct.
 */
import type { ReactNode } from 'react';
import type { DrillId } from '@optcg/ai';
import type { ItemTimer } from './timer.ts';
import { TimerView } from './Timer.tsx';

export function ItemBar({
  drill,
  index,
  total,
  note,
  timer,
  factor,
  onFactor,
  onShow,
  onSkip,
  onLeave,
  children,
}: {
  drill: DrillId;
  index: number;
  total: number;
  note: string | null;
  timer: ItemTimer;
  factor: number | null;
  onFactor?: ((f: number | null) => void) | undefined;
  onShow(): void;
  onSkip(): void;
  onLeave(): void;
  /** The drill's own extra controls (the lethal drill's "No lethal"), placed after Skip. */
  children?: ReactNode;
}) {
  return (
    <div className="drill-bar" role="group" aria-label="Drill controls">
      <p className="drill-progress" data-testid="drill-progress">
        <b>
          Item {index + 1} of {total}
        </b>
        {note && <span className="drill-note"> · {note}</span>}
      </p>
      <div className="drill-bar-actions">
        <button type="button" className="btn small" onClick={onShow}>
          Show answer
        </button>
        <button type="button" className="btn small" onClick={onSkip}>
          Skip
        </button>
        <button type="button" className="btn small" onClick={onLeave}>
          Leave
        </button>
        {children}
      </div>
      <TimerView drill={drill} timer={timer} factor={factor} onFactor={onFactor} />
    </div>
  );
}
