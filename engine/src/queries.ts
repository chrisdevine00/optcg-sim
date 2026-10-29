/**
 * Read-only queries over full state (api.ts `Queries`). Tests, the AI's review mode and the app's
 * hotseat read the game through these, never through state fields.
 */
import type {
  BattleStep,
  CardView,
  Decision,
  GameState,
  InstanceId,
  PlayerId,
  Queries,
  ZoneName,
} from './api.ts';
import { derive } from './derive.ts';
import { counterOf } from './effects/eval.ts';
import type { State } from './state.ts';

const st = (g: GameState): State => g as unknown as State;

export function publicDecision(s: State): Decision | null {
  const d = s.decision;
  if (!d) return null;
  const out: Decision = { kind: d.kind, player: d.player, prompt: d.prompt };
  if (d.min !== undefined) out.min = Math.max(0, d.min - (d.picked?.length ?? 0));
  if (d.max !== undefined) out.max = Math.max(0, d.max - (d.picked?.length ?? 0));
  const purpose = d.role ?? (d.purpose === 'characterLimit' ? 'characterLimit' : undefined);
  if (purpose) out.purpose = purpose;
  if (d.source) {
    out.source = { card: d.source.cardId, ability: d.source.ability, instance: d.source.card };
    if (d.source.label) out.source.label = d.source.label;
  }
  if (d.options) out.options = d.options.map((o) => ({ ...o }));
  return out;
}

export function battleStepOf(s: State): BattleStep | null {
  const b = s.battle;
  if (!b) return null;
  switch (b.step) {
    case 'attackEnd':
      return 'attack';
    case 'blockEnd':
      return 'block';
    case 'counterEnd':
      return 'counter';
    case 'damageEnd':
      return 'damage';
    case 'endExpire':
      return 'end';
    default:
      return b.step;
  }
}

export function cardView(s: State, id: InstanceId): CardView {
  const c = s.cards[id];
  if (!c) throw new Error(`No card instance ${id} (it may have become a new object, CR 3-1-6)`);
  const dv = derive(s, id);
  return {
    instance: id,
    card: c.card,
    owner: c.owner,
    // A [Trigger] card being resolved is in no area (CR 10-1-5-3); it reports `resolving`.
    zone: c.zone as ZoneName,
    rested: c.rested,
    faceUp: c.faceUp,
    don: c.don,
    power: dv.power,
    cost: dv.cost,
    keywords: dv.keywords,
    ...extras(s, id),
    played: c.played,
  };
}

/** M4a additions to a card's view: Counter value and effect flags. */
export function extras(
  s: State,
  id: InstanceId,
): { counter: number | null; cannotAttack?: true; negated?: true } {
  const dv = derive(s, id);
  const out: { counter: number | null; cannotAttack?: true; negated?: true } = {
    counter: counterOf(s, id),
  };
  if (dv.cannotAttack) out.cannotAttack = true;
  if (dv.negated) out.negated = true;
  return out;
}

export function zoneIds(s: State, p: PlayerId, zone: ZoneName): InstanceId[] {
  const ps = s.players[p];
  switch (zone) {
    case 'leader':
      return [ps.leader];
    case 'deck':
    case 'hand':
    case 'life':
    case 'characters':
    case 'stage':
    case 'trash':
      return ps[zone];
    case 'donDeck':
    case 'costArea':
      // DON!! are counted by location class, not instances (E-D4); see `queries.don`.
      return [];
  }
}

export const queries: Queries = {
  decision: (g) => publicDecision(st(g)),
  result: (g) => st(g).result,
  turn: (g) => {
    const s = st(g);
    return { number: s.turn, activePlayer: s.active, phase: s.phase, battleStep: battleStepOf(s) };
  },
  zone: (g, p, zone) => {
    const s = st(g);
    return zoneIds(s, p, zone).map((id) => cardView(s, id));
  },
  card: (g, id) => cardView(st(g), id),
  don: (g, p) => {
    const s = st(g);
    const ps = s.players[p];
    let given = 0;
    for (const id of [ps.leader, ...ps.characters]) given += s.cards[id]!.don;
    return { deck: ps.donDeck, active: ps.donActive, rested: ps.donRested, given };
  },
  battle: (g) => {
    const b = st(g).battle;
    return b && { attacker: b.attacker, target: b.target, blocker: b.blocker };
  },
  usedThisTurn: (g) =>
    st(g).oncePerTurn.map((k) => {
      const i = k.indexOf('/');
      return { card: k.slice(0, i), ability: k.slice(i + 1) };
    }),
};
