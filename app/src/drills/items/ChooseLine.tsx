/**
 * "Choose a line" (flows F19d): the DON!! item as three or four described lines, in the order the
 * bank lists them, each a labelled radio with none checked. Scoring is the same as on the board: a
 * line is right when it leaves no more DON!! unused than the best one.
 */
import { useEffect, useRef, useState } from 'react';
import type { DonItem } from '../types.ts';
import type { ItemTimer } from '../timer.ts';
import { ItemBar } from '../ItemBar.tsx';

export function ChooseLineScreen({
  item,
  index,
  total,
  note,
  timer,
  factor,
  onFactor,
  onSubmit,
  onBoard,
  onShow,
  onSkip,
  onLeave,
}: {
  item: DonItem;
  index: number;
  total: number;
  note: string | null;
  timer: ItemTimer;
  factor: number | null;
  onFactor(f: number | null): void;
  onSubmit(lineId: string): void;
  onBoard(): void;
  onShow(): void;
  onSkip(): void;
  onLeave(): void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const head = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    head.current?.focus();
  }, [item.id]);
  return (
    <main className="page page-full drill" id="main" aria-labelledby="page-title">
      <h1 id="page-title" tabIndex={-1} ref={head}>
        Which line spends your DON!! best?
      </h1>
      <p className="drill-seat">
        Your turn {item.scenario.turn} with {item.mine}. Pick one; the fewest DON!! left unused is
        right.
      </p>
      <fieldset className="drill-lines">
        <legend>Lines for this turn</legend>
        {item.lines.map((l) => (
          <label key={l.id} className="drill-line">
            <input
              type="radio"
              name="line"
              value={l.id}
              checked={picked === l.id}
              onChange={() => setPicked(l.id)}
            />
            <span>{l.label}</span>
          </label>
        ))}
      </fieldset>
      <div className="drill-answers">
        <button
          type="button"
          className="btn drill-answer"
          disabled={picked === null}
          onClick={() => picked && onSubmit(picked)}
        >
          Submit line
        </button>
      </div>
      <ItemBar
        drill="don"
        index={index}
        total={total}
        note={note}
        timer={timer}
        factor={factor}
        onFactor={onFactor}
        onShow={onShow}
        onSkip={onSkip}
        onLeave={onLeave}
      >
        <button type="button" className="btn small" onClick={onBoard}>
          Play it on the board
        </button>
      </ItemBar>
    </main>
  );
}
