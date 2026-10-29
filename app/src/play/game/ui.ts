/** Board interaction modes (board.md §4.2, accessibility.md §3.2). */
import type { Card } from '@optcg/cards';
import type { Action, PlayerId, ProjectedView } from '@optcg/engine';
import type { Layout } from '../board/layout.ts';
import type { GameController } from './controller.ts';
import type { Legal } from './legal.ts';
import type { Names } from './text.ts';

export type UiMode =
  | { kind: 'idle' }
  /** A source is selected; its action menu is open (hand card, or a field card with no attack). */
  | { kind: 'selected'; handle: string }
  /** Targeting: the attacker's legal targets are lit (attack is an attacker's default action). */
  | { kind: 'target'; attacker: string }
  /** Attack confirm: the battle panel shows the preview; Enter or a second click commits. */
  | { kind: 'confirm'; attacker: string; target: string }
  /** DON!! mode: each click on a lit card gives 1 DON!!. */
  | { kind: 'don' }
  /** Count mode: give N DON!! to one card (keyboard path, accessibility §3.6). */
  | { kind: 'count'; target: string; n: number };

/** The defence planner's staged items (flows F6). */
export interface Staging {
  blocker: string | null;
  counters: { card: string; target: string }[];
}

export const NO_STAGING: Staging = { blocker: null, counters: [] };

export interface G {
  ctl: GameController;
  view: ProjectedView;
  me: PlayerId;
  opp: PlayerId;
  L: Layout;
  legal: Legal;
  cards: ReadonlyMap<string, Card>;
  names: Names;
  mine: boolean;
  ui: UiMode;
  setUi: (m: UiMode) => void;
  staging: Staging;
  setStaging: (s: Staging) => void;
  picks: string[];
  setPicks: (p: string[]) => void;
  /** Send one action for the screen's player. */
  act: (a: Action, intentId?: string) => void;
  cardOf: (
    handle: string,
  ) => { card: Card | undefined; power: number | null; owner: PlayerId; zone: string } | null;
  nameOf: (handle: string) => string;
  whyText: (text: string | null) => void;
  openInspector: (handle: string) => void;
  onNewGame: () => void;
  onRematch: () => void;
  onRewind: () => void;
  openRewindList: () => void;
}
