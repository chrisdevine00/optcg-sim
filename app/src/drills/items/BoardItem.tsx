/**
 * A drill item on the real board (lethal, counter or take it, DON!! allocation). The board is the
 * ordinary `Game` over a `GameController` restored from the item (`materialise`), judged by the
 * controller's puzzle judge: the item ends when `puzzleState()` says solved or failed, and the
 * drill's own bar rides in the decision panel's slot. The AI seat's cards never reach this screen:
 * the player sees what their own view shows ("4 cards in their hand, up to +2000 each").
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Card } from '@optcg/cards';
import { GameController } from '../../play/game/controller.ts';
import { Game } from '../../play/game/Game.tsx';
import type { SessionRecord } from '../../session/index.ts';
import { itemCardIds, hasNoLethal, materialise } from '../materialise.ts';
import type { DrillAi } from '../load.ts';
import type { DrillEntry } from '../session.ts';
import type { ItemTimer } from '../timer.ts';
import type { BoardItem } from '../types.ts';
import { ItemBar } from '../ItemBar.tsx';

export type BoardOutcome = 'solved' | 'failed';

export const PROMPT: Record<BoardItem['drill'], string> = {
  lethal: 'Find lethal, or declare none.',
  counter: 'They attack. Counter it, or take it.',
  don: 'Spend your DON!! well: the fewest left unused wins.',
};

export function BoardItemScreen({
  ai,
  entry,
  index,
  total,
  note,
  timer,
  factor,
  onFactor,
  onOutcome,
  onNoLethal,
  onChooseLine,
  onShow,
  onSkip,
  onLeave,
  load,
  onReady,
  aiPort,
}: {
  ai: DrillAi;
  entry: DrillEntry;
  index: number;
  total: number;
  note: string | null;
  timer: ItemTimer;
  factor: number | null;
  onFactor?: ((f: number | null) => void) | undefined;
  onOutcome(o: BoardOutcome): void;
  onNoLethal?: () => void;
  /** DON!!: swap the board for the list of lines (only an item with lines has one). */
  onChooseLine?: () => void;
  onShow(): void;
  onSkip(): void;
  onLeave(): void;
  /** The session's card loader: loads what is missing and returns the shared map. */
  load(ids: string[]): Promise<Map<string, Card>>;
  /** Tests: the controller once it is built. */
  onReady?: (ctl: GameController) => void;
  aiPort?: ConstructorParameters<typeof GameController>[2]['aiPort'];
}) {
  const item = entry.item as BoardItem;
  const [ctl, setCtl] = useState<GameController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [header, setHeader] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    let live = true;
    let made: GameController | null = null;
    done.current = false;
    void (async () => {
      try {
        const ids = itemCardIds({ start: { scenario: item.scenario } } as unknown as SessionRecord);
        const cards = await load(ids);
        if (!live) return;
        const m = materialise(ai, entry, cards, aiPort ? { aiPort: aiPort as never } : {});
        made = m.ctl;
        if (item.drill === 'lethal') setHeader(ai.lethalHeaderOf(item, cards));
        made.start();
        onReady?.(made);
        setCtl(made);
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      live = false;
      made?.dispose();
    };
    // One controller per item: the entry's identity is the item's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  // The item ends when the controller's judge says so; a lethal turn with no attack left ends itself.
  useEffect(() => {
    if (!ctl) return;
    let beat: number | undefined;
    const startActions = ctl.session.actionCount;
    const check = () => {
      if (done.current) return;
      const s = ctl.puzzleState();
      if (s === 'solved' || s === 'failed') {
        done.current = true;
        window.clearTimeout(beat);
        onOutcome(s);
        return;
      }
      if (item.drill !== 'lethal') return;
      // UX-R32: after the last legal attack the puzzle evaluates itself. Only once an attack was made
      // (a board with no attack at all is answered with "No lethal"), and after a beat to see the hit.
      window.clearTimeout(beat);
      const legal = ctl.myDecision() ? ctl.actions() : [];
      const attacked = ctl.session
        .actionsSince(startActions)
        .some((a) => a.type === 'attack' && a.player === ctl.me);
      const end = legal.find((a) => a.type === 'endTurn');
      if (attacked && end && !legal.some((a) => a.type === 'attack'))
        beat = window.setTimeout(() => {
          if (!done.current && ctl.myDecision()) ctl.act(end);
        }, 700);
    };
    const off = ctl.subscribe(check);
    check();
    return () => {
      off();
      window.clearTimeout(beat);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctl]);

  // N declares "No lethal" (flows F19b), like the board's own single-key shortcuts.
  const declare = onNoLethal && hasNoLethal(item) ? onNoLethal : null;
  useEffect(() => {
    if (!declare) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'n' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      e.preventDefault();
      declare();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [declare]);

  if (error)
    return (
      <main className="page page-full drill" id="main" aria-labelledby="page-title">
        <h1 id="page-title" tabIndex={-1}>
          This item could not be set up
        </h1>
        <p role="alert">{error}</p>
        <p>
          <button type="button" className="btn" onClick={onSkip}>
            Skip it
          </button>{' '}
          <button type="button" className="btn" onClick={onLeave}>
            Leave
          </button>
        </p>
      </main>
    );
  if (!ctl)
    return (
      <main
        className="page page-full drill"
        id="main"
        aria-busy="true"
        aria-labelledby="page-title"
      >
        <h1 id="page-title" tabIndex={-1}>
          Setting up the board
        </h1>
      </main>
    );

  const slot: ReactNode = (
    <div className="drill-slot" data-testid="drill-slot">
      <p className="drill-prompt" id="drill-prompt">
        <b>{PROMPT[item.drill]}</b>
        {header && <span className="drill-header"> {header}</span>}
      </p>
      <ItemBar
        drill={item.drill}
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
        {declare && (
          <button type="button" className="btn small" aria-keyshortcuts="N" onClick={declare}>
            No lethal <kbd>N</kbd>
          </button>
        )}
        {onChooseLine && (
          <button type="button" className="btn small" onClick={onChooseLine}>
            Choose a line
          </button>
        )}
      </ItemBar>
    </div>
  );
  return (
    <Game
      key={item.id}
      ctl={ctl}
      onHome={onLeave}
      onNewGame={onLeave}
      onRematch={onLeave}
      drillSlot={slot}
    />
  );
}
