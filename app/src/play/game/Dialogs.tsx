/**
 * Dialogs (accessibility.md §3.2 "Dialog" mode): the trash viewer (docked over the rail's log, rail
 * scrim only), the rewind list, the shortcut sheet, the game menu and the concede confirm. Opening
 * one moves focus into it; closing returns focus to the element that opened it.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { PlayerId } from '@optcg/engine';
import type { LogLine } from './text.ts';
import type { G } from './ui.ts';

export type DialogState =
  | null
  | { kind: 'trash'; player: PlayerId }
  | { kind: 'rewind' }
  | { kind: 'shortcuts' }
  | { kind: 'menu' }
  | { kind: 'concede' }
  /** Hotseat: a rewind changes the game for both players, so the other one agrees (flows F11.7). */
  | { kind: 'consent'; run: () => void };

export function Dialogs({
  g,
  dialog,
  lines,
  onClose,
  setDialog,
}: {
  g: G;
  dialog: DialogState;
  lines: LogLine[];
  onClose: () => void;
  setDialog: (d: DialogState) => void;
}) {
  if (!dialog) return null;
  switch (dialog.kind) {
    case 'trash':
      return <TrashViewer g={g} player={dialog.player} onClose={onClose} />;
    case 'rewind':
      return <RewindList g={g} lines={lines} onClose={onClose} />;
    case 'shortcuts':
      return <Shortcuts onClose={onClose} />;
    case 'concede':
      return (
        <Modal title="Concede this game?" onClose={onClose}>
          <p>It counts as a loss. You can still read the log.</p>
          <div className="row end">
            <button
              type="button"
              className="btn"
              onClick={() => {
                onClose();
                g.ctl.concede();
              }}
            >
              Concede
            </button>
            <button type="button" className="btn primary" data-autofocus onClick={onClose}>
              Keep playing
            </button>
          </div>
        </Modal>
      );
    case 'menu':
      return <GameMenu g={g} onClose={onClose} setDialog={setDialog} />;
    case 'consent': {
      const run = dialog.run;
      return (
        <Modal title="Rewind for both players?" onClose={onClose}>
          <p>
            A rewind changes the game for both of you. The other player agrees by pressing Enter.
          </p>
          <div className="row end">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn primary"
              data-autofocus
              onClick={() => {
                onClose();
                run();
              }}
            >
              Agree and rewind <kbd>Enter</kbd>
            </button>
          </div>
        </Modal>
      );
    }
  }
}

function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    // showModal focuses the first control (the ✕); the dialog's intended button takes focus.
    d?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'wide' : ''}`}
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="modal-head">
        <h2 id="modal-title">{title}</h2>
        <button type="button" className="iconbtn" aria-label="Close (Escape)" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}

function TrashViewer({ g, player, onClose }: { g: G; player: PlayerId; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<'all' | 'Character' | 'Event' | 'Stage'>('all');
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button')?.focus();
  }, []);
  const trash = g.view.zones[player].trash;
  const rail = g.L.rail;
  const whose = g.names.hotseat
    ? `${g.names.player[player]}’s`
    : player === g.me
      ? 'Your'
      : 'Opponent’s';
  const list = trash
    .map((c) => ({ c, card: c.card ? g.cards.get(c.card) : undefined }))
    .filter((x) => filter === 'all' || x.card?.category === filter);
  return (
    <>
      <div
        className="rail-scrim"
        // The rail notice (the disclaimer) stays clear of the scrim (board.md §3.1, M3-21).
        style={{ left: rail.x, width: rail.w, top: rail.head + rail.notice }}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={ref}
        className="trash-viewer"
        role="dialog"
        aria-labelledby="trash-title"
        style={{
          left: rail.x + 8,
          width: rail.w - 16,
          top: rail.head + rail.notice + 4,
          height: rail.decision.top - rail.head - rail.notice - 8,
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }
        }}
      >
        <div className="modal-head">
          <h2 id="trash-title">
            {whose} trash · {trash.length}
          </h2>
          <button
            type="button"
            className="iconbtn"
            aria-label="Close trash (Escape)"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="row filters-row" role="group" aria-label="Filter">
          {(['all', 'Character', 'Event', 'Stage'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className="opt"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
        <ol className="trash-list" aria-label="Newest first">
          {list.length === 0 && <li className="subtle">Nothing here.</li>}
          {list.map(({ c, card }) => (
            <li key={c.handle}>
              <button type="button" className="linkbtn" onClick={() => g.openInspector(c.handle)}>
                {card?.name ?? 'Card'}
              </button>{' '}
              <span className="subtle">
                {card?.category}
                {card?.cost !== null && card?.cost !== undefined ? ` · cost ${card.cost}` : ''}
                {card?.counter ? ` · Counter +${card.counter}` : ''}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

function RewindList({ g, lines, onClose }: { g: G; lines: LogLine[]; onClose: () => void }) {
  const moves = lines.filter((l) => l.kind === 'move' && l.actor === g.me && !l.auto).reverse();
  const [sel, setSel] = useState<number | null>(null);
  return (
    <Modal title="Rewind to before a move" onClose={onClose} wide>
      <p className="subtle">
        Rewinding is deterministic: the same shuffle, so the same draws. Rewound games don’t count
        in your win rate.
      </p>
      {moves.length === 0 ? (
        <p>No moves of yours to rewind yet.</p>
      ) : (
        <ul className="rewind-list" role="listbox" aria-label="Your moves, newest first">
          {moves.map((m, i) => (
            <li key={`${m.index}-${i}`} role="option" aria-selected={sel === m.index}>
              <button
                type="button"
                className="opt"
                aria-pressed={sel === m.index}
                onClick={() => setSel(m.index)}
                data-autofocus={i === 0 ? '' : undefined}
              >
                {m.text}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="row end">
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn primary"
          aria-disabled={sel === null || undefined}
          onClick={() => {
            if (sel === null) return;
            onClose();
            g.requestRewind(() => g.ctl.rewindTo(sel));
          }}
        >
          Rewind to before it
        </button>
      </div>
    </Modal>
  );
}

const KEYS: [string, string][] = [
  ['Tab / Shift+Tab', 'Next or previous zone'],
  ['← → Home End', 'Move within a zone'],
  ['↑ ↓', 'Zone above or below'],
  ['Enter, Space', 'Action menu, or choose'],
  ['Escape', 'Back out one level (never commits)'],
  ['P', 'Current decision'],
  [
    'G then a letter',
    'Go to a zone (h hand, c Characters, l Leader row, m midline, p decision, g log; Shift for the opponent)',
  ],
  ['Q', 'Status summary'],
  ['A', 'Attack with the focused card'],
  ['+ or =', 'Give DON!! to the focused card'],
  ['I', 'Inspect the focused card'],
  ['E', 'End turn'],
  ['U / Shift+U', 'Rewind one move / back to my last decision'],
  ['R', 'Rewind list'],
  ['S', 'Skip to my decision (opponent’s turn)'],
  ['K', 'Pause or resume the AI'],
  ['.', 'Next AI move (Step pace)'],
  ['[ ]', 'Slower / faster'],
  ['?', 'This sheet'],
];

function Shortcuts({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Keyboard shortcuts" onClose={onClose} wide>
      <p className="subtle">
        Single-key shortcuts work while focus is on the board or the decision panel. In a defence,
        Enter commits only a Counter that stops the attack or a block; “Take the hit” needs focus,
        then Enter.
      </p>
      <table className="tbl keys-table">
        <tbody>
          {KEYS.map(([k, d]) => (
            <tr key={k}>
              <th scope="row">
                <kbd>{k}</kbd>
              </th>
              <td>{d}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Glyphs</h3>
      <p>
        ▶ can be played · ⚔ can attack · ◆ can receive DON!! · ⌖ can be targeted · ⚡ ability ready
        · ⛨ Blocker · » Rush · »C Rush: Character · ×2 Double Attack · ⊘ Banish · ⤳ Unblockable · T
        Trigger
      </p>
    </Modal>
  );
}

function GameMenu({
  g,
  onClose,
  setDialog,
}: {
  g: G;
  onClose: () => void;
  setDialog: (d: DialogState) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, []);
  const items: [string, () => void, boolean?][] = [
    ['Rewind list…', () => setDialog({ kind: 'rewind' }), !g.ctl.canRewind()],
    [
      'Back to my last decision',
      () => (onClose(), g.requestRewind(() => g.ctl.backToMyLastDecision())),
      !g.ctl.canRewind(),
    ],
    [
      'Forward one move',
      () => (onClose(), g.requestRewind(() => g.ctl.forward())),
      !g.ctl.session.canForward || !g.ctl.canRewind(),
    ],
    ['Keyboard shortcuts', () => setDialog({ kind: 'shortcuts' })],
    ['Concede…', () => setDialog({ kind: 'concede' }), !!g.view.result],
    ['New game', () => (onClose(), g.onNewGame())],
  ];
  return (
    <>
      <div className="click-away" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        className="popmenu game-menu"
        role="menu"
        aria-label="Game menu"
        style={{ left: g.L.rail.x + g.L.rail.w - 252, top: g.L.rail.head }}
        onKeyDown={(e) => {
          const els = [...(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
          const i = els.indexOf(document.activeElement as HTMLElement);
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            els[(i + (e.key === 'ArrowDown' ? 1 : els.length - 1)) % els.length]?.focus();
          }
        }}
      >
        {items.map(([label, run, disabled]) => (
          <button
            key={label}
            type="button"
            role="menuitem"
            className="mi"
            aria-disabled={disabled || undefined}
            onClick={() => !disabled && run()}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
