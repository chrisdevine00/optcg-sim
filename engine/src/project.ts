/**
 * Projection (ARCHITECTURE §2.7, ADR 0005): what one player may see.
 *
 * Hidden information is hidden at the level of linkage, not only card ids:
 * - **Handles.** A visible card's handle is a hash of (viewer, instance id, projection key). The key
 *   is re-rolled whenever the card enters a hidden zone (deck, hand, face-down Life) and whenever its
 *   deck is shuffled (`ops.moveCard`, `ops.shuffleDeck`), and the new-object rule gives a new id. So
 *   a handle is stable while a card stays visible, differs per viewer, and never links a card across
 *   a secret area. View actions use handles; `actionFromView` maps them back.
 * - **Hidden cards** appear only as positional placeholders (`p2.hand.3`), with no id and no card.
 *   The opponent's hand is placeholders in canonical (positional) order, so its order shows nothing.
 * - **Resolution stack.** Frame locals never appear in a view (redacted by omission).
 * - **Events** pass through `projectEvents`, which strips card ids and ids of hidden moves.
 */
import type {
  CardId,
  Decision,
  GameEvent,
  InstanceId,
  PlayerId,
  PlayerView,
  ViewCard,
  ZoneName,
} from './api.ts';
import { legalActions } from './actions.ts';
import { derive } from './derive.ts';
import { hashString } from './hash.ts';
import { PLAYERS, type State, type Zone } from './state.ts';
import type { Action } from './api.ts';
import { CARD_FIELDS } from './draft.ts';
import { battleStepOf, publicDecision, zoneIds } from './queries.ts';

/** Extra runtime fields beyond the frozen `PlayerView`: the open battle and the no-area slot. */
export interface ProjectedView extends PlayerView {
  readonly battle: { attacker: string; target: string; blocker: string | null } | null;
  /** A [Trigger] card being resolved (CR 10-1-5-3). */
  readonly resolving: ViewCard[];
  /** What this player legitimately knows about hidden cards (looked-at deck tops; M4). */
  readonly known: Record<string, CardId>;
}

const ZONE_NAMES: readonly ZoneName[] = [
  'deck',
  'hand',
  'life',
  'leader',
  'characters',
  'stage',
  'trash',
  'donDeck',
  'costArea',
];

/** The handle `viewer` sees for a card with this id and projection key. */
export function handleFor(viewer: PlayerId, id: InstanceId, key: string): string {
  return 'h' + hashString(`${viewer}|${id}|${key}`).slice(0, 12);
}

function viewCard(s: State, id: InstanceId, viewer: PlayerId): ViewCard {
  const c = s.cards[id]!;
  const dv = derive(s, id);
  return {
    handle: handleFor(viewer, id, c.key),
    card: c.card,
    rested: c.rested,
    faceUp: c.faceUp,
    don: c.don,
    power: dv.power,
    cost: dv.cost,
    keywords: dv.keywords,
  };
}

/** A face-down card: positional handle, no id, no card. */
function hiddenCard(p: PlayerId, zone: ZoneName, i: number): ViewCard {
  return {
    handle: `${p}.${zone}.${i}`,
    card: null,
    rested: false,
    faceUp: false,
    don: 0,
    power: null,
    cost: null,
    keywords: [],
  };
}

/** Can `viewer` see this card where it is now? */
export function visibleTo(s: State, id: InstanceId, viewer: PlayerId): boolean {
  const c = s.cards[id]!;
  return zoneVisible(c.zone, c.owner, viewer, c.faceUp);
}

export function zoneVisible(
  zone: Zone,
  owner: PlayerId,
  viewer: PlayerId,
  faceUp: boolean,
): boolean {
  switch (zone) {
    case 'deck':
      return false;
    case 'hand':
      return owner === viewer;
    case 'life':
      return faceUp;
    default:
      return true;
  }
}

function zonesFor(s: State, viewer: PlayerId): PlayerView['zones'] {
  const out = {} as Record<PlayerId, Record<ZoneName, ViewCard[]>>;
  for (const p of PLAYERS) {
    const z = {} as Record<ZoneName, ViewCard[]>;
    for (const zone of ZONE_NAMES) {
      const ids = zoneIds(s, p, zone);
      z[zone] = ids.map((id, i) =>
        visibleTo(s, id, viewer) ? viewCard(s, id, viewer) : hiddenCard(p, zone, i),
      );
    }
    out[p] = z;
  }
  return out;
}

function donFor(s: State): PlayerView['don'] {
  const out = {} as Record<
    PlayerId,
    { deck: number; active: number; rested: number; given: number }
  >;
  for (const p of PLAYERS) {
    const ps = s.players[p];
    let given = 0;
    for (const id of [ps.leader, ...ps.characters]) given += s.cards[id]!.don;
    out[p] = { deck: ps.donDeck, active: ps.donActive, rested: ps.donRested, given };
  }
  return out;
}

const GENERIC_PROMPT: Record<Decision['kind'], string> = {
  chooseFirst: 'Your opponent is choosing who goes first.',
  mulligan: 'Your opponent is deciding whether to redraw.',
  main: "It is your opponent's Main Phase.",
  block: 'Your opponent is choosing whether to block.',
  counter: 'Your opponent is choosing Counters.',
  trigger: 'Your opponent is deciding on a [Trigger].',
  optional: 'Your opponent is deciding whether to use an effect.',
  choose: 'Your opponent is choosing.',
  order: 'Your opponent is ordering effects.',
};

const ACTION_CARD_FIELDS = ['card', 'target', 'attacker', 'blocker', 'choice'] as const;

/** Re-express an engine action in `viewer`'s handles. */
function actionToView(s: State, viewer: PlayerId, a: Action): Action {
  let out: Record<string, unknown> | null = null;
  for (const f of ACTION_CARD_FIELDS) {
    const v = (a as Record<string, unknown>)[f];
    if (f === 'choice' && v && typeof v === 'object' && 'card' in v) {
      const dc = v as { from: 'given'; card: InstanceId };
      (out ??= { ...a })[f] = { ...dc, card: handleFor(viewer, dc.card, s.cards[dc.card]!.key) };
    } else if (typeof v === 'string' && s.cards[v]) {
      (out ??= { ...a })[f] = handleFor(viewer, v, s.cards[v]!.key);
    }
  }
  return (out ?? a) as Action;
}

/**
 * Map an action expressed in `player`'s view handles back to engine instance ids, for the session
 * store to pass to `reduce`. Handles of cards the player cannot see do not resolve.
 */
export function actionFromView(s: State, player: PlayerId, a: Action): Action {
  const byHandle = new Map<string, InstanceId>();
  for (const id of Object.keys(s.cards)) {
    if (visibleTo(s, id, player)) byHandle.set(handleFor(player, id, s.cards[id]!.key), id);
  }
  let out: Record<string, unknown> | null = null;
  for (const f of ACTION_CARD_FIELDS) {
    const v = (a as Record<string, unknown>)[f];
    if (f === 'choice' && v && typeof v === 'object' && 'card' in v) {
      const dc = v as { from: 'given'; card: string };
      (out ??= { ...a })[f] = { ...dc, card: byHandle.get(dc.card) ?? dc.card };
    } else if (typeof v === 'string') {
      (out ??= { ...a })[f] = byHandle.get(v) ?? v;
    }
  }
  return (out ?? a) as Action;
}

export function project(s: State, player: PlayerId): ProjectedView {
  const h = (id: InstanceId): string => handleFor(player, id, s.cards[id]?.key ?? '');
  const dec = publicDecision(s);
  const mine = dec !== null && dec.player === player;
  const decision: Decision | null =
    dec === null
      ? null
      : mine
        ? dec
        : { kind: dec.kind, player: dec.player, prompt: GENERIC_PROMPT[dec.kind] };
  return {
    player,
    decision,
    actions: mine ? legalActions(s).map((a) => actionToView(s, player, a)) : [],
    turn: {
      number: s.turn,
      activePlayer: s.active,
      phase: s.phase,
      battleStep: battleStepOf(s),
    },
    result: s.result,
    zones: zonesFor(s, player),
    don: donFor(s),
    battle: s.battle && {
      attacker: h(s.battle.attacker),
      target: h(s.battle.target),
      blocker: s.battle.blocker && h(s.battle.blocker),
    },
    resolving: s.resolving.map((id) => viewCard(s, id, player)),
    known: {},
    __brand: 'PlayerView',
  };
}

/**
 * Events as `viewer` may see them (ARCHITECTURE §2.7 "projected events"). Instance ids become the
 * viewer's handles. A move the viewer cannot see keeps only its zones and owner: no card, no handle.
 */
export function projectEvents(events: readonly GameEvent[], viewer: PlayerId): GameEvent[] {
  return events.map((e) => {
    const keys = (e.keys ?? {}) as Record<string, string>;
    const out: GameEvent = { ...e };
    delete out.keys;
    if (e.type === 'CardMoved') {
      const owner = e.owner as PlayerId;
      const hideFrom = !zoneVisible(e.from as Zone, owner, viewer, e.wasFaceUp === true);
      const hideTo = !zoneVisible(e.to as Zone, owner, viewer, e.faceUp === true);
      if (hideFrom) delete out.instance;
      if (hideTo) delete out.newInstance;
      if (hideFrom && hideTo && e.revealed !== true) delete out.card;
    }
    for (const f of CARD_FIELDS) {
      const v = out[f];
      if (typeof v === 'string' && keys[v] !== undefined) out[f] = handleFor(viewer, v, keys[v]);
    }
    return out;
  });
}
