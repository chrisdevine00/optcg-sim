/**
 * The flag list (learning-ui §4.1, accessibility §3.16): a sortable, filterable `listbox` that is a
 * tab stop of its own. Up and Down (and Home, End) move the choice, Enter opens Study, `F` goes to
 * the kind filter. One row per flag: turn, kind, severity (shape and word), certainty, and whether
 * it was practised.
 */
import { useId, useRef } from 'react';
import { FLAG_KINDS, type FlagKind, type PracticedState, type ReviewFlag } from '@optcg/ai';
import { FlagShape } from './Timeline.tsx';
import {
  KIND_SHAPE,
  KIND_WORD,
  SEVERITY,
  certaintyOf,
  practisedWord,
  type Actors,
} from './model.ts';

export type SortBy = 'severity' | 'turn';

export function FlagList({
  flags,
  selected,
  sort,
  kind,
  actors,
  practised,
  onSort,
  onKind,
  onChoose,
  onOpen,
  empty,
}: {
  /** Already filtered and sorted by the caller (so N and the stepper agree with what is shown). */
  flags: readonly ReviewFlag[];
  selected: string | null;
  sort: SortBy;
  kind: FlagKind | 'all';
  actors: Actors;
  practised: Readonly<Record<string, PracticedState>>;
  onSort(s: SortBy): void;
  onKind(k: FlagKind | 'all'): void;
  onChoose(id: string): void;
  onOpen(id: string): void;
  empty: string;
}) {
  const uid = useId();
  const box = useRef<HTMLUListElement>(null);
  const filter = useRef<HTMLSelectElement>(null);
  const at = Math.max(
    0,
    flags.findIndex((f) => f.id === selected),
  );

  const move = (to: number) => {
    const f = flags[Math.max(0, Math.min(flags.length - 1, to))];
    if (f) onChoose(f.id);
  };
  const onKey = (e: React.KeyboardEvent) => {
    const to =
      e.key === 'ArrowDown'
        ? at + 1
        : e.key === 'ArrowUp'
          ? at - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? flags.length - 1
              : null;
    if (to !== null) {
      e.preventDefault();
      move(to);
    } else if (e.key === 'Enter') {
      const f = flags[at];
      if (f) {
        e.preventDefault();
        onOpen(f.id);
      }
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      filter.current?.focus();
    }
  };

  return (
    <div className="fl">
      <div className="fl-controls">
        <label htmlFor={`${uid}-sort`}>Sort by</label>
        <select id={`${uid}-sort`} value={sort} onChange={(e) => onSort(e.target.value as SortBy)}>
          <option value="severity">Severity, then turn</option>
          <option value="turn">Turn</option>
        </select>
        <label htmlFor={`${uid}-kind`}>Kind</label>
        <select
          id={`${uid}-kind`}
          ref={filter}
          value={kind}
          onChange={(e) => onKind(e.target.value as FlagKind | 'all')}
        >
          <option value="all">All kinds</option>
          {FLAG_KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_WORD[k]}
            </option>
          ))}
        </select>
      </div>
      {flags.length === 0 ? (
        <p className="subtle">{empty}</p>
      ) : (
        <>
          <p className="fl-head" aria-hidden="true">
            <span>Turn</span>
            <span>Kind</span>
            <span>Severity</span>
            <span>Certainty</span>
          </p>
          <ul
            ref={box}
            className="fl-box"
            role="listbox"
            tabIndex={0}
            aria-label="Flags, one row each. Up and Down choose, Enter opens Study, F filters by kind."
            aria-activedescendant={`${uid}-o-${at}`}
            onKeyDown={onKey}
          >
            {flags.map((f, i) => {
              const sev = SEVERITY[f.severity];
              const mark = practisedWord(practised[f.id]);
              return (
                <li
                  key={f.id}
                  id={`${uid}-o-${i}`}
                  role="option"
                  aria-selected={f.id === selected}
                  className="fl-row"
                  data-flag={f.id}
                  onClick={() => onChoose(f.id)}
                  onDoubleClick={() => onOpen(f.id)}
                >
                  <span>
                    {f.kind === 'mulligan' ? (
                      'Start of the game'
                    ) : (
                      <>
                        Turn {f.turn}
                        <span className="fl-actor">
                          {' '}
                          {actors.playerOf(f.turn) === actors.me || actors.playerOf(f.turn) === null
                            ? 'your turn'
                            : `${actors.oppName}’s turn`}
                        </span>
                      </>
                    )}
                  </span>
                  <span>{KIND_WORD[f.kind]}</span>
                  <span className="fl-sev">
                    <FlagShape
                      shape={KIND_SHAPE[f.kind]}
                      size={Math.min(sev.size, 16)}
                      hindsight={f.severity === 'hindsight'}
                    />
                    {sev.word}
                  </span>
                  <span>
                    {certaintyOf(f)}
                    {mark && <em className="fl-practised"> · {mark}</em>}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
