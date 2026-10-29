/**
 * Legal actions, their reasons, and how each one changes the game (ARCHITECTURE §2.3).
 *
 * One function, `check`, decides whether an intent is legal and, if not, why (`whyNot`). The
 * enumeration in `legalActions` produces exactly the intents `check` accepts; a property test holds
 * the two together. `reduce` validates with `check`, so it never has to enumerate.
 */
import type { Action, InstanceId, Intent, OptionChoice, PlayerId, Reason } from './api.ts';
import { hasTiming, type Ability } from './abilities.ts';
import { derive } from './derive.ts';
import { attackLock, counterOf, payable, type Ctx } from './effects/eval.ts';
import { answerEffect, pushEffect } from './effects/run.ts';
import type { Draft } from './draft.ts';
import { OPENING_HAND } from './defs.ts';
import {
  advance,
  answerAbilityOptional,
  answerTrigger,
  applyReplacement,
  beginEndPhase,
  fireFor,
  hasScriptedTrigger,
  choosePending,
  makeRoom,
  pendingLife,
  push,
  top,
} from './flow.ts';
import { addModifier, draw, endGame, giveDon, moveCard, rest, shuffleDeck } from './ops/index.ts';
import { other, type Choice, type State } from './state.ts';

const r = (text: string, rule?: string): Reason => (rule ? { text, rule } : { text });

// ---------------------------------------------------------------------------------------------
// Shared predicates
// ---------------------------------------------------------------------------------------------

function isOwnLeaderOrCharacter(s: State, p: PlayerId, id: InstanceId): boolean {
  const c = s.cards[id];
  return !!c && c.owner === p && (c.zone === 'leader' || c.zone === 'characters');
}

/** The player's own first turn: turn 1 for the first player, turn 2 for the second (CR 6-5-6-1). */
function firstTurnOf(s: State): boolean {
  return s.turn <= 2;
}

function eventAbility(s: State, cardId: string, t: 'main' | 'counter'): Ability | undefined {
  return s.defs[cardId]!.abilities.find((a) => hasTiming(a, t));
}

const ctx = (s: State, p: PlayerId, self: InstanceId): Ctx => ({ s, you: p, self });

/** Can `p` activate this Event's [Main] or [Counter] from hand: its cost plus its activation costs? */
function eventPayable(s: State, p: PlayerId, card: InstanceId, ab: Ability): boolean {
  const cost = derive(s, card).cost ?? 0;
  const costs = ab.kind === 'activate' ? ab.cost : undefined;
  return payable(ctx(s, p, card), costs, { playCost: cost, exclude: card });
}

function sick(s: State, id: InstanceId): boolean {
  const c = s.cards[id]!;
  return c.zone === 'characters' && c.played === s.turn;
}

// ---------------------------------------------------------------------------------------------
// check: null when legal, otherwise the first reason it is not
// ---------------------------------------------------------------------------------------------

/** Field types each action needs (M2-06, M2-18): checked before any field is read. */
const SHAPES: Record<string, Record<string, 'string' | 'boolean' | 'stringOrNull'>> = {
  chooseFirst: { goFirst: 'boolean' },
  mulligan: { redraw: 'boolean' },
  playCard: { card: 'string' },
  giveDon: { target: 'string' },
  activate: { card: 'string', ability: 'string' },
  attack: { attacker: 'string', target: 'string' },
  endTurn: {},
  block: { blocker: 'stringOrNull' },
  counter: { card: 'string', target: 'string' },
  endCounter: {},
  trigger: { activate: 'boolean' },
  optional: { accept: 'boolean' },
  pick: {},
  done: {},
  order: { first: 'string' },
  concede: {},
};

function shapeError(a: unknown): Reason | null {
  if (!a || typeof a !== 'object') return r('That is not an action.');
  const t = (a as { type?: unknown }).type;
  if (typeof t !== 'string' || !(t in SHAPES)) return r('That is not an action.');
  for (const [k, kind] of Object.entries(SHAPES[t]!)) {
    const v = (a as Record<string, unknown>)[k];
    const ok = kind === 'stringOrNull' ? v === null || typeof v === 'string' : typeof v === kind;
    if (!ok) return r(`That action is missing its ${k}.`);
  }
  return null;
}

export function check(s: State, player: PlayerId, a: Intent | null): Reason | null {
  if (s.result) return r('The game is over.');
  if (player !== 'p1' && player !== 'p2') return r('That is not a player in this game.');
  const bad = shapeError(a);
  if (bad || !a) return bad ?? r('That is not an action.');
  if (a.type === 'concede') return null; // CR 1-2-3: either player, at any time.
  const dec = s.decision;
  if (!dec) return r('Nothing is waiting for a decision.');
  if (dec.player !== player) return r('Your opponent is deciding right now.');
  const kindOf: Partial<Record<Intent['type'], string>> = {
    chooseFirst: 'chooseFirst',
    mulligan: 'mulligan',
    playCard: 'main',
    giveDon: 'main',
    activate: 'main',
    attack: 'main',
    endTurn: 'main',
    block: 'block',
    counter: 'counter',
    endCounter: 'counter',
    trigger: 'trigger',
    optional: 'optional',
    pick: 'choose',
    done: 'choose',
    order: 'order',
    concede: '',
  };
  if (kindOf[a.type] !== dec.kind && !(a.type === 'activate' && dec.kind === 'counter'))
    return wrongWindow(a.type);
  const ps = s.players[player];
  switch (a.type) {
    case 'chooseFirst':
      return typeof a.goFirst === 'boolean' ? null : r('Choose first or second.');
    case 'mulligan':
      return typeof a.redraw === 'boolean' ? null : r('Keep or redraw.');
    case 'endTurn':
      return null;
    case 'playCard': {
      const c = s.cards[a.card];
      if (!c || c.owner !== player || c.zone !== 'hand')
        return r('You can only play cards from your hand.', 'CR 6-5-3-1');
      const def = s.defs[c.card]!;
      const main = def.category === 'Event' ? eventAbility(s, c.card, 'main') : undefined;
      if (def.category === 'Event' && !main)
        return r(
          def.abilities.length === 0
            ? "This card's effect is not automated yet."
            : 'This Event has no [Main] effect to activate in your Main Phase.',
          def.abilities.length === 0 ? 'effect-dsl E-D8' : 'CR 6-5-3-1',
        );
      if (main && !eventPayable(s, player, a.card, main))
        return r("You can't pay this Event's cost and activation cost together.", 'CR 8-3-1-3');
      const cost = derive(s, a.card).cost ?? 0;
      if (cost > ps.donActive)
        return r(
          `You need ${cost} active DON!! to play this card; you have ${ps.donActive}.`,
          'CR 2-7-2',
        );
      return null;
    }
    case 'giveDon':
      if (ps.donActive < 1)
        return r('You have no active DON!! in your cost area to give.', 'CR 6-5-5-1');
      if (!isOwnLeaderOrCharacter(s, player, a.target))
        return r('DON!! can only be given to your Leader or one of your Characters.', 'CR 6-5-5-1');
      return null;
    case 'activate': {
      const c = s.cards[a.card];
      if (dec.kind === 'counter') {
        // An Event's [Counter] in the Counter Step (CR 7-1-3-1-2): costs are paid at activation;
        // its targets are chosen while it resolves (CR 8-4-4).
        if (!c || c.owner !== player || c.zone !== 'hand')
          return r('Counters are used from your hand.', 'CR 7-1-3-1-1');
        const ab = s.defs[c.card]!.abilities.find((x) => x.id === a.ability);
        if (!ab || !hasTiming(ab, 'counter'))
          return r("This card's [Counter] effect is not automated yet.", 'effect-dsl E-D8');
        if (!eventPayable(s, player, a.card, ab))
          return r("You can't pay this Event's cost and activation cost together.", 'CR 8-3-1-3');
        return null;
      }
      if (!c || c.owner !== player || !['leader', 'characters', 'stage'].includes(c.zone))
        return r('Only cards on your field have [Activate: Main] effects.', 'CR 10-2-2-1');
      const ab = s.defs[c.card]!.abilities.find((x) => x.id === a.ability);
      if (!ab || !hasTiming(ab, 'activateMain'))
        return r("This card's effect is not automated yet.", 'effect-dsl E-D8');
      if (derive(s, a.card).negated) return r("This card's effects are negated.", 'CR 8-2-1-1');
      if (ab.oncePerTurn && s.oncePerTurn.includes(`${a.card}/${ab.id}`))
        return r('[Once Per Turn]: already used this turn.', 'CR 10-2-13-1');
      if (ab.kind === 'activate' && !payable(ctx(s, player, a.card), ab.cost))
        return r("You can't pay this effect's cost.", 'CR 8-3-1-3');
      return null;
    }
    case 'attack':
      return checkAttack(s, player, a.attacker, a.target);
    case 'block': {
      if (a.blocker === null) return null;
      const b = s.battle!;
      const c = s.cards[a.blocker];
      if (!c || !isOwnLeaderOrCharacter(s, player, a.blocker))
        return r('Only your Leader or one of your Characters can block.', 'CR 10-1-4-1');
      if (!derive(s, a.blocker).keywords.includes('Blocker'))
        return r("This card doesn't have [Blocker].", 'CR 10-1-4-1');
      if (a.blocker === b.target)
        return r("The card being attacked can't use its own [Blocker].", 'CR 10-1-4-1');
      if (c.rested) return r("A rested card can't block.", 'CR 10-1-4-1');
      if (derive(s, b.attacker).keywords.includes('Unblockable'))
        return r('This attacker has [Unblockable]: [Blocker] cannot be activated.', 'CR 10-1-7-1');
      return null;
    }
    case 'counter': {
      const c = s.cards[a.card];
      if (!c || c.owner !== player || c.zone !== 'hand')
        return r('Counters are used from your hand.', 'CR 7-1-3-1-1');
      const def = s.defs[c.card]!;
      if (def.category === 'Event')
        return r(
          eventAbility(s, c.card, 'counter')
            ? "Activate this Event's [Counter] effect instead; it chooses its targets as it resolves."
            : "This card's [Counter] effect is not automated yet.",
          'CR 7-1-3-1-2, effect-dsl E-D8',
        );
      if (def.category !== 'Character' || !counterOf(s, a.card))
        return r('This card has no Counter value.', 'CR 7-1-3-1-1');
      if (!isOwnLeaderOrCharacter(s, player, a.target))
        return r('A Counter gives power to your Leader or one of your Characters.', 'CR 7-1-3-1-1');
      return null;
    }
    case 'endCounter':
      return null;
    case 'trigger': {
      if (typeof a.activate !== 'boolean') return r('Activate or not.');
      const card = pendingLife(s);
      if (a.activate && (card === null || !hasScriptedTrigger(s, card)))
        return r(
          card !== null && s.defs[s.cards[card]!.card]!.hasTrigger
            ? "This card's [Trigger] is not automated yet."
            : 'This card has no [Trigger].',
          'CR 10-1-5-1',
        );
      if (a.activate && card !== null && !triggerPayable(s, player, card))
        return r("You can't pay this [Trigger]'s cost.", 'CR 8-3-1-3');
      return null;
    }
    case 'optional':
      if (a.accept && dec.noAccept) return r("You can't pay this effect's cost now.", 'CR 8-3-1-3');
      return null;
    case 'pick':
      return checkPick(s, a.choice);
    case 'done': {
      const picked = dec.picked?.length ?? 0;
      if (picked < (dec.min ?? 0))
        return r(`Choose ${(dec.min ?? 0) - picked} more.`, 'CR 8-4-4-1');
      return null;
    }
    case 'order':
      return (dec.candidates ?? []).includes(a.first)
        ? null
        : r('That is not one of the things to order.');
  }
}

function wrongWindow(t: Intent['type']): Reason {
  switch (t) {
    case 'playCard':
    case 'giveDon':
    case 'activate':
    case 'attack':
    case 'endTurn':
      return r('You can only do that in your Main Phase, outside a battle.', 'CR 6-5-2');
    case 'block':
      return r('Blockers are chosen in the Block Step.', 'CR 7-1-2');
    case 'counter':
    case 'endCounter':
      return r('Counters are used in the Counter Step when you are attacked.', 'CR 7-1-3');
    default:
      return r('That is not the decision being asked for.');
  }
}

function checkAttack(
  s: State,
  p: PlayerId,
  attacker: InstanceId,
  target: InstanceId,
): Reason | null {
  if (firstTurnOf(s)) return r('Neither player can battle on their first turn.', 'CR 6-5-6-1');
  const a = s.cards[attacker];
  if (!a || !isOwnLeaderOrCharacter(s, p, attacker))
    return r('Only your Leader or one of your Characters can attack.', 'CR 7-1-1-1');
  if (a.rested) return r('Rested cards cannot attack.', 'CR 7-1-1-1');
  const dv = derive(s, attacker);
  if (dv.cannotAttack) return r('An effect says this card cannot attack.', 'CR 1-3-3');
  const kw = dv.keywords;
  const isSick = sick(s, attacker);
  if (isSick && !kw.includes('Rush') && !kw.includes('Rush: Character'))
    return r("A Character can't attack on the turn it is played.", 'CR 3-7-4');
  const t = s.cards[target];
  if (!t || t.owner === p || (t.zone !== 'leader' && t.zone !== 'characters'))
    return r("You can attack only your opponent's Leader or Characters.", 'CR 7-1');
  if (t.zone === 'characters' && !t.rested)
    return r("Active Characters can't be attacked.", 'CR 7-1-1-2');
  if (isSick && !kw.includes('Rush') && t.zone === 'leader')
    return r(
      '[Rush: Character] can attack only Characters on the turn it is played.',
      'CR 10-1-6-1',
    );
  const lock = attackLock(s, p);
  if (lock && !lock.includes(target))
    return r(
      `An effect lets you attack only ${[...new Set(lock.map((id) => s.defs[s.cards[id]!.card]!.name))].join(' or ') || 'nothing'} right now.`,
      'OP17-044',
    );
  return null;
}

function triggerPayable(s: State, p: PlayerId, card: InstanceId): boolean {
  const ab = s.defs[s.cards[card]!.card]!.abilities.find((x) => x.kind === 'trigger');
  return !!ab && ab.kind === 'trigger' && payable(ctx(s, p, card), ab.cost);
}

function choiceKey(x: Choice): string {
  if (typeof x === 'string') return x;
  if ('option' in x) return `option:${x.option}`;
  return x.from === 'given' ? `given:${x.card}` : x.from;
}

function checkPick(s: State, choice: Choice): Reason | null {
  const dec = s.decision!;
  const okShape =
    typeof choice === 'string' ||
    (choice !== null &&
      typeof choice === 'object' &&
      (('from' in choice && typeof choice.from === 'string') ||
        ('option' in choice && typeof (choice as OptionChoice).option === 'string')));
  if (!okShape) return r('That card cannot be chosen here.');
  const cands = dec.candidates ?? [];
  const picked = dec.picked ?? [];
  const keys = cands.map(choiceKey);
  const key = choiceKey(choice);
  const i = keys.indexOf(key);
  if (i < 0) return r('That card cannot be chosen here.');
  const idx = picked.map((x) => keys.indexOf(choiceKey(x)));
  const pickedOf = (j: number): number => idx.filter((x) => x === j).length;
  const counts = dec.counts;
  // Canonical order: picks of an unordered set go in candidate order (ADR 0003). A DON!! class
  // may be picked again while it still holds DON!! (E-D4).
  const last = idx.length ? idx[idx.length - 1]! : -1;
  if (i < last || (i === last && (!counts || pickedOf(i) >= counts[i]!)))
    return r('Choose cards in the listed order (they are an unordered set).');
  if (picked.length >= (dec.max ?? 1)) return r('You have already chosen as many as allowed.');
  const lim = dec.limits;
  if (lim) {
    if (lim.names && idx.some((j) => lim.names![j] === lim.names![i]))
      return r('The cards must have different card names.', 'OP17-118');
    if (lim.total !== undefined) {
      const total = idx.reduce((a, j) => a + (lim.costs[j] ?? 0), 0) + (lim.costs[i] ?? 0);
      if (total > lim.total) return r(`Their total cost must be ${lim.total} or less.`);
    }
  }
  // Completability lookahead: enough candidates must remain to reach the minimum.
  const need = (dec.min ?? 0) - picked.length - 1;
  let room = counts ? counts[i]! - pickedOf(i) - 1 : 0;
  for (let j = i + 1; j < cands.length; j++) room += counts ? counts[j]! : 1;
  if (room < need) return r('That choice could not be completed.');
  return null;
}

// ---------------------------------------------------------------------------------------------
// Enumeration
// ---------------------------------------------------------------------------------------------

export function legalActions(s: State): Action[] {
  if (s.result) return [];
  const dec = s.decision;
  const out: Action[] = [];
  if (dec) {
    const p = dec.player;
    const ps = s.players[p];
    switch (dec.kind) {
      case 'chooseFirst':
        out.push({ type: 'chooseFirst', goFirst: true, player: p });
        out.push({ type: 'chooseFirst', goFirst: false, player: p });
        break;
      case 'mulligan':
        out.push({ type: 'mulligan', redraw: false, player: p });
        out.push({ type: 'mulligan', redraw: true, player: p });
        break;
      case 'main': {
        for (const id of ps.hand) {
          if (check(s, p, { type: 'playCard', card: id }) === null)
            out.push({ type: 'playCard', card: id, player: p });
        }
        if (ps.donActive > 0) {
          for (const id of [ps.leader, ...ps.characters])
            out.push({ type: 'giveDon', target: id, player: p });
        }
        for (const id of [ps.leader, ...ps.characters, ...ps.stage]) {
          for (const ab of s.defs[s.cards[id]!.card]!.abilities) {
            if (hasTiming(ab, 'activateMain')) {
              if (check(s, p, { type: 'activate', card: id, ability: ab.id }) === null)
                out.push({ type: 'activate', card: id, ability: ab.id, player: p });
            }
          }
        }
        if (!firstTurnOf(s)) {
          const opp = s.players[other(p)];
          const targets = [opp.leader, ...opp.characters];
          for (const a of [ps.leader, ...ps.characters]) {
            if (s.cards[a]!.rested) continue;
            for (const t of targets) {
              if (checkAttack(s, p, a, t) === null)
                out.push({ type: 'attack', attacker: a, target: t, player: p });
            }
          }
        }
        out.push({ type: 'endTurn', player: p });
        break;
      }
      case 'block':
        for (const id of [ps.leader, ...ps.characters]) {
          if (check(s, p, { type: 'block', blocker: id }) === null)
            out.push({ type: 'block', blocker: id, player: p });
        }
        out.push({ type: 'block', blocker: null, player: p });
        break;
      case 'counter': {
        const targets = [ps.leader, ...ps.characters];
        for (const id of ps.hand) {
          const def = s.defs[s.cards[id]!.card]!;
          if (def.category === 'Event') {
            const ab = eventAbility(s, def.id, 'counter');
            if (ab && check(s, p, { type: 'activate', card: id, ability: ab.id }) === null)
              out.push({ type: 'activate', card: id, ability: ab.id, player: p });
            continue;
          }
          if (def.category !== 'Character' || !counterOf(s, id)) continue;
          for (const t of targets) out.push({ type: 'counter', card: id, target: t, player: p });
        }
        out.push({ type: 'endCounter', player: p });
        break;
      }
      case 'trigger': {
        const card = pendingLife(s);
        if (card !== null && hasScriptedTrigger(s, card) && triggerPayable(s, p, card))
          out.push({ type: 'trigger', activate: true, player: p });
        out.push({ type: 'trigger', activate: false, player: p });
        break;
      }
      case 'optional':
        if (!dec.noAccept) out.push({ type: 'optional', accept: true, player: p });
        out.push({ type: 'optional', accept: false, player: p });
        break;
      case 'choose':
        for (const c of dec.candidates ?? []) {
          if (checkPick(s, c) === null) out.push({ type: 'pick', choice: c, player: p });
        }
        if ((dec.picked?.length ?? 0) >= (dec.min ?? 0)) out.push({ type: 'done', player: p });
        break;
      case 'order':
        for (const c of dec.candidates ?? [])
          if (typeof c === 'string') out.push({ type: 'order', first: c, player: p });
        break;
    }
  }
  // CR 1-2-3: a player may concede at any time. The list holds the decider's actions only;
  // `reduce` also accepts a concession from the other player.
  if (dec) out.push({ type: 'concede', player: dec.player });
  return out;
}

// ---------------------------------------------------------------------------------------------
// Applying an action
// ---------------------------------------------------------------------------------------------

export function apply(d: Draft, a: Action): void {
  const s = d.s;
  const p = a.player;
  if (a.type === 'concede') {
    d.emit({ type: 'Conceded', player: p });
    endGame(d, { winner: other(p), reason: 'concede' });
    return;
  }
  const dec = s.decision!;
  s.decision = null;
  switch (a.type) {
    case 'chooseFirst': {
      s.first = a.goFirst ? p : other(p);
      s.active = s.first;
      d.emit({ type: 'FirstPlayerChosen', chooser: p, first: s.first });
      const f = top(d);
      if (f?.f === 'setup') f.step = 'startOfGame';
      break;
    }
    case 'mulligan': {
      s.setup = { ...s.setup, mulliganed: { ...s.setup.mulliganed, [p]: true } };
      d.emit({ type: 'Mulligan', player: p, redraw: a.redraw });
      if (a.redraw) {
        // CR 5-2-1-6-1: return the whole hand, reshuffle, draw 5.
        for (const id of d.ro(p).hand.slice())
          moveCard(d, id, 'deck', { extra: { reason: 'mulligan' } });
        shuffleDeck(d, p);
        draw(d, p, OPENING_HAND);
      }
      break;
    }
    case 'playCard':
      push(d, { f: 'play', card: a.card, player: p, step: 'pay' });
      break;
    case 'giveDon':
      giveDon(d, p, a.target);
      break;
    case 'activate': {
      if (dec.kind === 'counter') {
        // An Event [Counter]: reveal, pay, trash, then resolve (CR 7-1-3-1-2, 8-4-2); afterwards
        // the Counter Step asks again.
        push(d, { f: 'play', card: a.card, player: p, step: 'pay', counter: true });
        break;
      }
      const c = d.card(a.card);
      const ab = s.defs[c.card]!.abilities.find((x) => x.id === a.ability)!;
      d.emit({ type: 'EffectActivated', instance: a.card, card: c.card, ability: ab.id });
      pushEffect(d, a.card, c.card, ab, p, 'effect');
      break;
    }
    case 'attack': {
      // CR 7-1-1-1: rest the attacker to declare; then the target.
      rest(d, a.attacker);
      s.battle = {
        attacker: a.attacker,
        attackerOwner: p,
        target: a.target,
        step: 'attack',
        blocker: null,
        attackerWon: null,
        keys: { attacker: d.card(a.attacker).key, target: d.card(a.target).key },
      };
      d.emit({
        type: 'AttackDeclared',
        attacker: a.attacker,
        target: a.target,
        player: p,
        card: d.card(a.attacker).card,
        targetCard: d.card(a.target).card,
      });
      push(d, { f: 'battle' });
      break;
    }
    case 'endTurn':
      d.emit({ type: 'MainPhaseEnded', player: p, turn: s.turn });
      beginEndPhase(d);
      break;
    case 'block': {
      const b = { ...s.battle! };
      s.battle = b;
      b.step = 'blockEnd';
      if (a.blocker !== null) {
        rest(d, a.blocker);
        b.blocker = a.blocker;
        b.target = a.blocker;
        b.keys = { ...b.keys, target: d.card(a.blocker).key };
        d.emit({
          type: 'BlockerActivated',
          blocker: a.blocker,
          card: d.card(a.blocker).card,
          player: p,
        });
        fireFor(d, [p], 'onBlock', () => [a.blocker!]);
      } else {
        d.emit({ type: 'NoBlock', player: p });
      }
      break;
    }
    case 'counter': {
      const c = d.card(a.card);
      const amount = counterOf(s, a.card, true) ?? 0;
      moveCard(d, a.card, 'trash', { revealed: true, extra: { reason: 'counter' } });
      addModifier(d, {
        kind: 'power',
        target: a.target,
        amount,
        duration: { kind: 'battle' },
        controller: p,
        source: null,
      });
      d.emit({ type: 'CounterPlayed', card: c.card, target: a.target, amount, player: p });
      break;
    }
    case 'endCounter':
      s.battle = { ...s.battle!, step: 'counterEnd' };
      break;
    case 'trigger':
      answerTrigger(d, a.activate);
      break;
    case 'optional':
      if (dec.purpose === 'replacement') {
        if (a.accept) applyReplacement(d, dec.replacement!);
        else d.emit({ type: 'ReplacementDeclined', ability: dec.replacement!.ability, player: p });
      } else if (dec.purpose === 'effect') {
        answerEffect(d, a.accept);
      } else {
        answerAbilityOptional(d, a.accept);
      }
      break;
    case 'pick': {
      const picked = [...(dec.picked ?? []), a.choice];
      if (picked.length >= (dec.max ?? 1)) completeChoice(d, dec.purpose, picked);
      else s.decision = { ...dec, picked };
      break;
    }
    case 'done':
      completeChoice(d, dec.purpose, dec.picked ?? []);
      break;
    case 'order':
      if (dec.purpose === 'pending') choosePending(d, a.first);
      else answerEffect(d, a.first);
      break;
  }
}

function completeChoice(
  d: Draft,
  purpose: NonNullable<State['decision']>['purpose'],
  picked: Choice[],
): void {
  if (purpose === 'characterLimit') {
    makeRoom(d, picked[0] as InstanceId);
    return;
  }
  if (purpose === 'effect') {
    answerEffect(d, picked);
    return;
  }
  throw new Error(`No handler for choice ${String(purpose)}`);
}

export { advance };
