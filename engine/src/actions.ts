/**
 * Legal actions, their reasons, and how each one changes the game (ARCHITECTURE §2.3).
 *
 * One function, `check`, decides whether an intent is legal and, if not, why (`whyNot`). The
 * enumeration in `legalActions` produces exactly the intents `check` accepts; a property test holds
 * the two together. `reduce` validates with `check`, so it never has to enumerate.
 */
import type { Action, DonClass, InstanceId, Intent, PlayerId, Reason } from './api.ts';
import { derive } from './derive.ts';
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
  makeRoom,
  pendingLife,
  push,
  pushEffect,
  top,
} from './flow.ts';
import { addModifier, draw, endGame, giveDon, moveCard, rest, shuffleDeck } from './ops/index.ts';
import { other, type State } from './state.ts';

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

function eventMain(s: State, cardId: string) {
  return s.defs[cardId]!.abilities.find((a) => a.kind === 'activate' && a.when === 'main');
}

function sick(s: State, id: InstanceId): boolean {
  const c = s.cards[id]!;
  return c.zone === 'characters' && c.played === s.turn;
}

// ---------------------------------------------------------------------------------------------
// check: null when legal, otherwise the first reason it is not
// ---------------------------------------------------------------------------------------------

export function check(s: State, player: PlayerId, a: Intent): Reason | null {
  if (s.result) return r('The game is over.');
  if (player !== 'p1' && player !== 'p2') return r('That is not a player in this game.');
  if (!a || typeof a !== 'object' || typeof a.type !== 'string') return r('That is not an action.');
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
  if (kindOf[a.type] !== dec.kind) return wrongWindow(a.type);
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
      if (def.category === 'Event' && !eventMain(s, c.card))
        return r(
          def.abilities.length === 0
            ? "This card's effect is not automated yet."
            : 'This Event has no [Main] effect to activate in your Main Phase.',
          def.abilities.length === 0 ? 'effect-dsl E-D8' : 'CR 6-5-3-1',
        );
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
      if (!c || c.owner !== player || !['leader', 'characters', 'stage'].includes(c.zone))
        return r('Only cards on your field have [Activate: Main] effects.', 'CR 10-2-2-1');
      const ab = s.defs[c.card]!.abilities.find((x) => x.id === a.ability);
      if (!ab || ab.kind !== 'activate' || ab.when !== 'activateMain')
        return r("This card's effect is not automated yet.", 'effect-dsl E-D8');
      if (ab.oncePerTurn && s.oncePerTurn.includes(`${a.card}/${ab.id}`))
        return r('[Once Per Turn]: already used this turn.', 'CR 10-2-13-1');
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
          "This card's [Counter] effect is not automated yet.",
          'CR 7-1-3-1-2, effect-dsl E-D8',
        );
      if (def.category !== 'Character' || !def.counter)
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
      return null;
    }
    case 'optional':
      return typeof a.accept === 'boolean' ? null : r('Yes or no.');
    case 'pick':
      return checkPick(s, a.choice);
    case 'done': {
      const picked = dec.picked?.length ?? 0;
      if (picked < (dec.min ?? 0))
        return r(`Choose ${(dec.min ?? 0) - picked} more.`, 'CR 8-4-4-1');
      return null;
    }
    case 'order':
      return r('There is nothing to order.');
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
  const kw = derive(s, attacker).keywords;
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
  return null;
}

function donKey(x: InstanceId | DonClass): string {
  return typeof x === 'string' ? x : x.from === 'given' ? `given:${x.card}` : x.from;
}

function checkPick(s: State, choice: InstanceId | DonClass): Reason | null {
  const dec = s.decision!;
  if (
    typeof choice !== 'string' &&
    (choice === null || typeof choice !== 'object' || !('from' in choice))
  )
    return r('That card cannot be chosen here.');
  const cands = dec.candidates ?? [];
  const picked = dec.picked ?? [];
  const key = donKey(choice);
  const i = cands.findIndex((c) => donKey(c) === key);
  if (i < 0) return r('That card cannot be chosen here.');
  // Canonical order: picks of an unordered set go in candidate order (ADR 0003).
  const last = picked.length ? cands.findIndex((c) => donKey(c) === donKey(picked.at(-1)!)) : -1;
  if (i <= last) return r('Choose cards in the listed order (they are an unordered set).');
  if (picked.length >= (dec.max ?? 1)) return r('You have already chosen as many as allowed.');
  // Completability lookahead: enough candidates must remain to reach the minimum.
  const need = (dec.min ?? 0) - picked.length - 1;
  if (cands.length - 1 - i < need) return r('That choice could not be completed.');
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
            if (ab.kind === 'activate' && ab.when === 'activateMain') {
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
          if (def.category !== 'Character' || !def.counter) continue;
          for (const t of targets) out.push({ type: 'counter', card: id, target: t, player: p });
        }
        out.push({ type: 'endCounter', player: p });
        break;
      }
      case 'trigger': {
        const card = pendingLife(s);
        if (card !== null && hasScriptedTrigger(s, card))
          out.push({ type: 'trigger', activate: true, player: p });
        out.push({ type: 'trigger', activate: false, player: p });
        break;
      }
      case 'optional':
        out.push({ type: 'optional', accept: true, player: p });
        out.push({ type: 'optional', accept: false, player: p });
        break;
      case 'choose':
        for (const c of dec.candidates ?? []) {
          if (checkPick(s, c) === null) out.push({ type: 'pick', choice: c, player: p });
        }
        if ((dec.picked?.length ?? 0) >= (dec.min ?? 0)) out.push({ type: 'done', player: p });
        break;
      case 'order':
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
      const amount = s.defs[c.card]!.counter ?? 0;
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
      throw new Error('order decisions are not used before M4');
  }
}

function completeChoice(
  d: Draft,
  purpose: NonNullable<State['decision']>['purpose'],
  picked: (InstanceId | DonClass)[],
): void {
  if (purpose === 'characterLimit') {
    makeRoom(d, picked[0] as InstanceId);
    return;
  }
  throw new Error(`No handler for choice ${String(purpose)}`);
}

export { advance };
