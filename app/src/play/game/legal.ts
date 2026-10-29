/**
 * The legal moves of the current decision, indexed by card handle, from `view.actions` only
 * (flows G4: highlights come from the view's actions; the UI never decides legality).
 */
import type { Action, PlayerView } from '@optcg/engine';

type A<T extends Action['type']> = Extract<Action, { type: T }>;

export interface Legal {
  kind: string | null;
  play: Map<string, A<'playCard'>>;
  attacks: Map<string, A<'attack'>[]>;
  give: Map<string, A<'giveDon'>>;
  activate: Map<string, A<'activate'>[]>;
  blocks: Map<string, A<'block'>>;
  noBlock: A<'block'> | null;
  counters: Map<string, A<'counter'>[]>;
  endCounter: A<'endCounter'> | null;
  picks: Map<string, A<'pick'>>;
  done: A<'done'> | null;
  endTurn: A<'endTurn'> | null;
  triggers: A<'trigger'>[];
  optional: A<'optional'>[];
  order: A<'order'>[];
  mulligan: A<'mulligan'>[];
  chooseFirst: A<'chooseFirst'>[];
}

const push = <K, V>(m: Map<K, V[]>, k: K, v: V) => {
  const l = m.get(k);
  if (l) l.push(v);
  else m.set(k, [v]);
};

export function legalOf(view: PlayerView, mine: boolean): Legal {
  const L: Legal = {
    kind: mine ? (view.decision?.kind ?? null) : null,
    play: new Map(),
    attacks: new Map(),
    give: new Map(),
    activate: new Map(),
    blocks: new Map(),
    noBlock: null,
    counters: new Map(),
    endCounter: null,
    picks: new Map(),
    done: null,
    endTurn: null,
    triggers: [],
    optional: [],
    order: [],
    mulligan: [],
    chooseFirst: [],
  };
  if (!mine) return L;
  for (const a of view.actions) {
    switch (a.type) {
      case 'playCard':
        L.play.set(a.card, a);
        break;
      case 'attack':
        push(L.attacks, a.attacker, a);
        break;
      case 'giveDon':
        L.give.set(a.target, a);
        break;
      case 'activate':
        push(L.activate, a.card, a);
        break;
      case 'block':
        if (a.blocker === null) L.noBlock = a;
        else L.blocks.set(a.blocker, a);
        break;
      case 'counter':
        push(L.counters, a.card, a);
        break;
      case 'endCounter':
        L.endCounter = a;
        break;
      case 'pick':
        if (typeof a.choice === 'string') L.picks.set(a.choice, a);
        else L.picks.set(JSON.stringify(a.choice), a);
        break;
      case 'done':
        L.done = a;
        break;
      case 'endTurn':
        L.endTurn = a;
        break;
      case 'trigger':
        L.triggers.push(a);
        break;
      case 'optional':
        L.optional.push(a);
        break;
      case 'order':
        L.order.push(a);
        break;
      case 'mulligan':
        L.mulligan.push(a);
        break;
      case 'chooseFirst':
        L.chooseFirst.push(a);
        break;
      default:
        break;
    }
  }
  return L;
}
