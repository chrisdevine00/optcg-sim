/**
 * The interpreter loop (ARCHITECTURE §2.3, §2.4, ADR 0003). `advance` runs frames from the top of
 * the stack until some player owes a decision or the game is over. Every frame is plain data, so a
 * suspended choice is just a frame waiting for its next action.
 */
import type { Cost, Filter, ReplaceEvent } from '@optcg/cards';
import { isEffect } from '@optcg/cards';
import type { InstanceId, PlayerId } from './api.ts';
import type { Ability, AutoTiming, InternalStep } from './abilities.ts';
import { hasTiming, isInternal } from './abilities.ts';
import { deriveLive, isNegated, koProtected, restBlocked } from './derive.ts';
import {
  allHold,
  costIsSecret,
  matches,
  payable,
  playCostOf,
  playsRested,
  pool,
  type Ctx,
} from './effects/eval.ts';
import { answerEffect, pushEffect, runEffect } from './effects/run.ts';
import type { Draft } from './draft.ts';
import { OPENING_HAND } from './defs.ts';
import { summaryHash } from './hash.ts';
import {
  draw,
  endGame,
  expireModifiers,
  hooks,
  lastKnown,
  leaveField,
  markDamagedAtZero,
  markKnown,
  moveCard,
  placeDon,
  rest,
  returnGivenDon,
  ruleProcessing,
  untapAll,
} from './ops/index.ts';
import { recordEvent, recordKo } from './history.ts';
import {
  other,
  type Cause,
  type DecisionState,
  type Ev,
  type Frame,
  type Modifier,
  type ReplacementRef,
  type State,
} from './state.ts';

export const MAX_CHARACTERS = 5;
/** Steps one `advance` may take before the loop detector starts hashing states (CR 11-1). */
const LOOP_CHECK_AFTER = 2000;
const HARD_STEP_LIMIT = 200000;

// ---------------------------------------------------------------------------------------------
// Stack helpers
// ---------------------------------------------------------------------------------------------

export function top(d: Draft): Frame | undefined {
  const st = d.stack();
  return st[st.length - 1];
}

export function push(d: Draft, f: Frame): void {
  d.stack().push(f);
}

export function pop(d: Draft): void {
  d.stack().pop();
}

export function ask(d: Draft, dec: DecisionState): void {
  d.s.decision = dec;
}

export function abilityOf(s: State, cardId: string, abilityId: string): Ability | undefined {
  // A replacement an effect created lives in its modifier, as the ability `mod-<id>` (D6).
  if (abilityId.startsWith('mod-')) {
    const id = Number(abilityId.slice(4));
    return s.mods.find((m) => m.kind === 'replacement' && m.id === id)?.ab;
  }
  return s.defs[cardId]?.abilities.find((a) => a.id === abilityId);
}

// ---------------------------------------------------------------------------------------------
// The loop
// ---------------------------------------------------------------------------------------------

export function advance(d: Draft): void {
  let steps = 0;
  let seen: Set<string> | null = null;
  while (!d.s.result && !d.s.decision) {
    if (!drainPending(d)) {
      const f = top(d);
      if (!f) throw new Error('Engine stack is empty with no decision pending');
      runFrame(d, f);
    }
    ruleProcessing(d);
    steps++;
    if (steps > LOOP_CHECK_AFTER) {
      // A mandatory loop nobody can stop is a draw (CR 11-1-1-1): the same game summary repeats
      // within one step with no decision in between (ARCHITECTURE §2.6).
      seen ??= new Set();
      const h = summaryHash(d.s);
      if (seen.has(h)) {
        d.emit({ type: 'LoopDetected', steps });
        endGame(d, { draw: 'loop' });
        return;
      }
      seen.add(h);
      if (steps > HARD_STEP_LIMIT) throw new Error('Engine step limit exceeded');
    }
  }
}

function runFrame(d: Draft, f: Frame): void {
  switch (f.f) {
    case 'setup':
      return runSetup(d, f);
    case 'turn':
      return runTurn(d, f);
    case 'play':
      return runPlay(d, f);
    case 'battle':
      return runBattle(d);
    case 'damage':
      return runDamage(d, f);
    case 'ko':
      return runKo(d, f);
    case 'trigger':
      return runTrigger(d, f);
    case 'effect':
      return runEffect(d, f);
    case 'remove':
      return runRemove(d, f);
    case 'rest':
      return runRest(d, f);
    case 'loop':
      // Test-only mandatory loop: does nothing and stays on the stack forever.
      d.ops++;
      return;
  }
}

// ---------------------------------------------------------------------------------------------
// Setup (CR 5-2-1, rules-digest section F)
// ---------------------------------------------------------------------------------------------

function runSetup(d: Draft, f: Extract<Frame, { f: 'setup' }>): void {
  const s = d.s;
  switch (f.step) {
    case 'chooseFirst':
      ask(d, {
        kind: 'chooseFirst',
        player: s.setup.chooser,
        prompt: 'You choose who plays first. Go first or second?',
      });
      return;
    case 'startOfGame': {
      // CR 5-2-1-5-1: the chooser processes "at the start of the game" effects first (RL-30).
      f.step = 'draw';
      const c = s.setup.chooser;
      fireFor(d, [c, other(c)], 'startOfGame', (p) => [d.ro(p).leader]);
      return;
    }
    case 'draw':
      // CR 5-2-1-6: each player draws 5.
      for (const p of [s.first, other(s.first)]) draw(d, p, OPENING_HAND);
      f.step = 'mulligan';
      return;
    case 'mulligan': {
      // CR 5-2-1-6-1: starting with the player going first, each may redraw once.
      const p = !s.setup.mulliganed[s.first]
        ? s.first
        : !s.setup.mulliganed[other(s.first)]
          ? other(s.first)
          : null;
      if (p) {
        ask(d, { kind: 'mulligan', player: p, prompt: 'Keep this hand, or redraw 5 new cards?' });
        return;
      }
      f.step = 'life';
      return;
    }
    case 'life':
      // CR 5-2-1-7, 2-9-2-1: Life from the top of the deck, the top card ending at the bottom.
      for (const p of [s.first, other(s.first)]) {
        const n = s.defs[s.cards[d.ro(p).leader]!.card]!.life ?? 0;
        for (let i = 0; i < n; i++) {
          const topCard = d.ro(p).deck[0];
          if (topCard === undefined) break;
          moveCard(d, topCard, 'life', { position: 'top', extra: { reason: 'setup' } });
        }
        d.emit({ type: 'LifePlaced', player: p, count: d.ro(p).life.length });
      }
      f.step = 'begin';
      return;
    case 'begin':
      pop(d);
      s.turn = 1;
      s.active = s.first;
      // CR 5-2-1-8: the first player starts their turn.
      push(d, { f: 'turn', step: 'refresh' });
      d.emit({ type: 'TurnStarted', turn: 1, player: s.first });
      return;
  }
}

// ---------------------------------------------------------------------------------------------
// Turn structure (CR 6)
// ---------------------------------------------------------------------------------------------

function setPhase(d: Draft, phase: State['phase']): void {
  if (d.s.phase === phase) return;
  d.s.phase = phase;
  d.emit({ type: 'PhaseChanged', phase, turn: d.s.turn, player: d.s.active });
}

function runTurn(d: Draft, f: Extract<Frame, { f: 'turn' }>): void {
  const s = d.s;
  const p = s.active;
  switch (f.step) {
    case 'refresh':
      setPhase(d, 'refresh');
      // 6-2-1: "until the start of your next turn" effects end.
      expireModifiers(
        d,
        (m) => m.duration.kind === 'untilStartOfNextTurn' && m.duration.player === p,
        '6-2-1',
      );
      // 6-2-2: start-of-turn effects activate.
      f.step = 'refreshDon';
      fireFor(d, [p], 'startOfYourTurn', (q) => fieldCards(d, q));
      return;
    case 'refreshDon':
      // 6-2-3 then 6-2-4.
      returnGivenDon(d, p);
      untapAll(d, p);
      // "Will not become active in your next Refresh Phase" has done its job (6-2-4).
      expireModifiers(
        d,
        (m) => m.duration.kind === 'afterRefresh' && m.duration.player === p,
        '6-2-4',
      );
      f.step = 'draw';
      return;
    case 'draw':
      setPhase(d, 'draw');
      // CR 6-3-1: the first player does not draw on their first turn.
      if (s.turn !== 1) draw(d, p, 1);
      f.step = 'don';
      return;
    case 'don':
      setPhase(d, 'don');
      // CR 6-4-1: 2 DON!!, or 1 for the first player's first turn (fewer if the deck is short).
      placeDon(d, p, s.turn === 1 ? 1 : 2);
      f.step = 'mainStart';
      return;
    case 'mainStart':
      setPhase(d, 'main');
      f.step = 'main';
      fireFor(d, [p, other(p)], 'startOfMainPhase', (q) => fieldCards(d, q));
      // "At the start of your opponent's next Main Phase" (D8): after the Main Phase's own start effects.
      fireDelayedMain(d, p, d.s.nextMod++);
      return;
    case 'main':
      ask(d, {
        kind: 'main',
        player: p,
        prompt: 'Main Phase: play a card, give DON!!, attack, or end your turn.',
      });
      return;
    case 'endTriggers':
      setPhase(d, 'end');
      // 6-6-1-1, 8-6-1: a player's [End of Your Turn] (or [End of Your Opponent's Turn]) effects are
      // activated at once, one batch per player, the turn player's first. "At the end of this turn"
      // delayed effects resolve after ALL of that player's [End of Your Turn] effects (official
      // ST-23 to ST-28 Q&A for ST24-005, LF-R2), so they are a later batch of the same player,
      // still before the other player's effects.
      f.step = 'endExpire';
      for (const q of [p, other(p)]) {
        const w = q === p ? 'endOfYourTurn' : 'endOfOpponentsTurn';
        fire(
          d,
          [q],
          (x) => fieldCards(d, x),
          (t) => t === w,
          w,
          d.s.nextMod++,
        );
        fireDelayed(d, q, d.s.nextMod++);
      }
      return;
    case 'endExpire':
      // 6-6-1-2: "until the end of the turn / End Phase" effects end, turn player's first; this
      // includes "until the end of your opponent's next End Phase" for the non-turn player (RL-11).
      expireModifiers(d, (m) => endsAtEndPhase(s, m), '6-6-1-2');
      f.step = 'endThisTurn';
      return;
    case 'endThisTurn':
      // 6-6-1-3: "during this turn" effects end.
      expireModifiers(
        d,
        (m) => m.duration.kind === 'thisTurn' && m.duration.turn <= s.turn,
        '6-6-1-3',
      );
      f.step = 'endPass';
      return;
    case 'endPass':
      // 6-6-1-4: the other player becomes the turn player.
      d.emit({ type: 'TurnEnded', turn: s.turn, player: p });
      if (s.oncePerTurn.length) s.oncePerTurn = [];
      s.turn += 1;
      s.active = other(p);
      d.emit({ type: 'TurnStarted', turn: s.turn, player: s.active });
      f.step = 'refresh';
      return;
  }
}

function endsAtEndPhase(s: State, m: Modifier): boolean {
  const du = m.duration;
  if (du.kind === 'untilEndOfTurn') return du.turn <= s.turn;
  if (du.kind === 'untilEndOfOpponentsNextEndPhase')
    return s.active !== du.player && s.turn > du.after;
  return false;
}

/** Ending the Main Phase (CR 6-5-2-1). */
export function beginEndPhase(d: Draft): void {
  const f = top(d);
  if (!f || f.f !== 'turn') throw new Error('Not in the Main Phase');
  f.step = 'endTriggers';
}

// ---------------------------------------------------------------------------------------------
// Playing cards (CR 2-7, 3-7-6, 3-8-5, 6-5-3)
// ---------------------------------------------------------------------------------------------

function runPlay(d: Draft, f: Extract<Frame, { f: 'play' }>): void {
  const s = d.s;
  const c = d.card(f.card);
  const def = d.s.defs[c.card]!;
  const ps = d.ro(f.player);
  switch (f.step) {
    case 'pay':
      // Reveal, then pay the cost (CR 2-7-2..2-7-4, RL-04).
      d.emit({
        type: 'CardRevealed',
        instance: f.card,
        card: c.card,
        player: f.player,
        reason: 'play',
      });
      if (def.category === 'Event') {
        // An Event activated by an effect (D2) does not pay the cost printed on it, only the
        // activation costs of its [Main] (official OP12-041 Q&A).
        if (!f.free) {
          const pc = playCostOf(d.s, f.player, f.card, true);
          payCost(d, f.player, pc.cost);
          spendPlayCost(d, pc.used);
        }
        // CR 8-4-2: trash the Event, then carry out its effect: [Main] in the Main Phase, [Counter]
        // in the Counter Step (CR 7-1-3-1-2). Its activation costs are paid by the effect frame.
        const nid = moveCard(d, f.card, 'trash', { revealed: true, extra: { reason: 'event' } });
        const timing = f.counter ? 'counter' : 'main';
        d.emit({ type: 'EventActivated', instance: nid, card: c.card, player: f.player, timing });
        // "When your opponent activates an Event" (OP11-012, OP15-119).
        recordEvent(d, f.player, def.cost);
        fireActor(d, 'eventActivated', f.player);
        pop(d);
        const ab = def.abilities.find((a) => hasTiming(a, timing));
        if (ab) pushEffect(d, nid, c.card, ab, f.player, 'effect');
        return;
      }
      // A card played by an effect is played without paying its cost.
      if (!f.free) {
        const pc = playCostOf(d.s, f.player, f.card, true);
        payCost(d, f.player, pc.cost);
        spendPlayCost(d, pc.used);
      }
      if (def.category === 'Character' && ps.characters.length >= MAX_CHARACTERS) {
        // CR 3-7-6-1: trash 1 of your Characters, then play (rule processing, not a K.O.).
        f.step = 'make-room';
        ask(d, {
          kind: 'choose',
          player: f.player,
          prompt: 'Your Character area is full. Choose 1 of your Characters to trash.',
          min: 1,
          max: 1,
          candidates: ps.characters.slice().sort(),
          picked: [],
          purpose: 'characterLimit',
        });
        return;
      }
      if (def.category === 'Stage' && ps.stage.length > 0) {
        // CR 3-8-5-1: trash the Stage already there, then place the new one (RL-07).
        leaveField(d, ps.stage[0]!, 'trash', { kind: 'rule', by: f.player });
      }
      f.step = 'place';
      return;
    case 'make-room':
      // Waiting for the `choose` decision; the pick handler trashes and moves on.
      f.step = 'place';
      return;
    case 'place': {
      const to = def.category === 'Stage' ? 'stage' : 'characters';
      // Where it is played from (G25): a card taken from a look at the deck is in the deck.
      const origin = c.zone;
      // "Your Character cards are played rested" (G50) is read before the card moves.
      const enters = f.rested === true || playsRested(d.s, f.player, f.card);
      moveCard(d, f.card, to, { revealed: true, extra: { reason: 'play' } });
      const w = d.wcard(f.card);
      w.played = d.s.turn;
      if (enters) w.rested = true;
      d.emit({ type: 'CardPlayed', instance: f.card, card: c.card, player: f.player, zone: to });
      f.step = 'done';
      fire(
        d,
        [f.player],
        () => [f.card],
        (w) => w === 'onPlay',
        'onPlay',
        f.batch,
      );
      // "When you play a Character" (OP14-041): the cards on both fields that watch for it.
      fire(
        d,
        [s.active, other(s.active)],
        (q) => fieldCards(d, q),
        (w, card, p) =>
          typeof w === 'object' &&
          w.event === 'cardPlayed' &&
          (w.by === 'you') === (p === f.player) &&
          (w.from === undefined || w.from === origin) &&
          (w.via === undefined ||
            (w.via === 'rule'
              ? f.via === undefined
              : w.via === 'effect'
                ? f.via !== undefined
                : f.via === 'characterEffect')) &&
          (!w.filter || matches({ s: d.s, you: p, self: card, live: true }, f.card, w.filter)),
        'cardPlayed',
        undefined,
        undefined,
        f.card,
      );
      return;
    }
    case 'done':
      pop(d);
      return;
  }
}

/** A one-shot play-cost change is spent by the play it applied to (OP12-061). */
function spendPlayCost(d: Draft, used: number[]): void {
  if (used.length === 0) return;
  d.s.mods = d.mods().flatMap((m) => {
    if (!used.includes(m.id)) return [m];
    const left = (m.uses ?? 1) - 1;
    return left > 0 ? [{ ...m, uses: left }] : [];
  });
}

function payCost(d: Draft, p: PlayerId, cost: number): void {
  if (cost <= 0) return;
  const ps = d.pl(p);
  ps.donActive -= cost;
  ps.donRested += cost;
  d.emit({ type: 'DonRested', player: p, count: cost });
}

/** Called when the Character-limit `choose` completes. */
export function makeRoom(d: Draft, chosen: InstanceId): void {
  const f = top(d);
  if (!f || f.f !== 'play') throw new Error('No play is waiting for room');
  leaveField(d, chosen, 'trash', { kind: 'rule', by: f.player });
  f.step = 'place';
}

// ---------------------------------------------------------------------------------------------
// Battle (CR 7-1)
// ---------------------------------------------------------------------------------------------

const ON_FIELD = new Set(['leader', 'characters']);

function moved(d: Draft): boolean {
  const b = d.s.battle!;
  const a = d.s.cards[b.attacker];
  const t = d.s.cards[b.target];
  return !a || !ON_FIELD.has(a.zone) || !t || !ON_FIELD.has(t.zone);
}

function runBattle(d: Draft): void {
  const s = d.s;
  const b = (s.battle = { ...s.battle! });
  const defender = other(b.attackerOwner);
  switch (b.step) {
    case 'attack':
      // CR 7-1-1-3, 10-2-16-1: [When Attacking] and "when … attacks" first, then [On Your
      // Opponent's Attack] and "when … is attacked" (QA-OP17 OP17-040: same timing).
      b.step = 'attackEnd';
      fire(
        d,
        [b.attackerOwner, defender],
        (q) => fieldCards(d, q),
        (w, card, p) =>
          p === b.attackerOwner
            ? (w === 'whenAttacking' && card === b.attacker) ||
              attackMatch(s, w, card, p, 'attacker')
            : w === 'onOpponentAttack' || attackMatch(s, w, card, p, 'target'),
        'attack',
      );
      return;
    case 'attackEnd':
      // CR 7-1-1-4.
      b.step = moved(d) ? 'end' : 'block';
      return;
    case 'block':
      ask(d, {
        kind: 'block',
        player: defender,
        prompt: 'Your opponent is attacking. Choose a Blocker, or do not block.',
      });
      return;
    case 'blockEnd':
      // CR 7-1-2-3.
      b.step = moved(d) ? 'end' : 'counter';
      return;
    case 'counter':
      ask(d, {
        kind: 'counter',
        player: defender,
        prompt: 'Counter Step: use Counters from your hand, or finish.',
      });
      return;
    case 'counterEnd':
      // CR 7-1-3-1-3.
      b.step = moved(d) ? 'end' : 'damage';
      return;
    case 'damage': {
      // CR 7-1-4: compare once; the attacker wins ties. Damage processing and the K.O. run in
      // frames pushed above this one, still inside the Damage Step.
      b.step = 'damageEnd';
      const ap = deriveLive(s, b.attacker).power ?? 0;
      const tp = deriveLive(s, b.target).power ?? 0;
      const target = d.card(b.target);
      b.attackerWon = ap >= tp;
      d.emit({
        type: 'DamageStep',
        attacker: b.attacker,
        target: b.target,
        attackerPower: ap,
        targetPower: tp,
        attackerWins: b.attackerWon,
      });
      if (!b.attackerWon) return; // CR 7-1-4-2
      if (target.zone === 'leader') {
        const kw = deriveLive(s, b.attacker).keywords;
        const n = kw.includes('Double Attack') ? 2 : 1;
        const banish = kw.includes('Banish');
        d.emit({ type: 'DamageDealt', player: defender, amount: n, by: b.attackerOwner });
        const atZero = d.ro(defender).life.length === 0;
        if (atZero && collectDamageReplacements(d.s, defender, []).length === 0) {
          // CR 7-1-4-1-1-1: damage determined against 0 Life: the attacker wins.
          markDamagedAtZero(d, defender);
          return;
        }
        // A replacement of damage may still stop it, at 0 Life too (D4): the damage frame offers it.
        push(d, {
          f: 'damage',
          player: defender,
          remaining: n,
          banish,
          battle: true,
          by: b.attackerOwner,
          pending: null,
          ...(atZero ? { zero: true as const } : {}),
        });
      } else {
        // CR 7-1-4-1-2.
        push(d, {
          f: 'ko',
          card: b.target,
          cause: { kind: 'battle', by: b.attackerOwner },
          considered: [],
          src: b.attacker,
        });
      }
      return;
    }
    case 'damageEnd':
      b.step = 'end';
      return;
    case 'end':
      // CR 7-1-5-1, 7-1-5-2: the battle ends; end-of-battle effects activate.
      b.step = 'endExpire';
      fireFor(d, [s.active, other(s.active)], 'endOfBattle', (q) => fieldCards(d, q));
      return;
    case 'endExpire':
      // CR 7-1-5-3, 7-1-5-4: battle effects end, turn player's first; then back to Main.
      expireModifiers(d, (m) => m.duration.kind === 'battle', '7-1-5-3');
      d.emit({ type: 'BattleEnded', attacker: b.attacker, target: b.target, keys: b.keys });
      s.battle = null;
      pop(d);
      return;
  }
}

// ---------------------------------------------------------------------------------------------
// Damage processing (CR 4-6, 7-1-4-1-1)
// ---------------------------------------------------------------------------------------------

function runDamage(d: Draft, f: Extract<Frame, { f: 'damage' }>): void {
  if (f.pending !== null) return; // waiting on the trigger decision
  if (f.remaining <= 0) {
    pop(d);
    // "When you take damage" (G43): after the damage processing, the [Trigger] included, ends.
    if (f.taken) fireDamageTaken(d, f.player);
    return;
  }
  // "If you would take damage, ... instead" (D4): offered before the Life card moves; applying it
  // ends the whole damage, so no Life card is taken and no [Trigger] activates (CR 4-6-3-1).
  if (offerDamageReplacement(d, f)) return;
  if (f.zero) {
    // Battle damage determined against 0 Life that no replacement stopped (CR 7-1-4-1-1-1).
    markDamagedAtZero(d, f.player);
    pop(d);
    return;
  }
  f.remaining -= 1;
  const life = d.ro(f.player).life;
  if (life.length === 0) {
    // Battle damage checks 0 Life once, when determined (CR 7-1-4-1-1-1; Double Attack at 1 Life
    // does not win, RL-20). Effect damage at 0 Life defeats (CR 1-2-1-1-1, RL-22).
    if (!f.battle) markDamagedAtZero(d, f.player);
    return;
  }
  const card = life[0]!;
  const def = d.s.defs[d.card(card).card]!;
  f.taken = (f.taken ?? 0) + 1;
  if (f.banish) {
    // CR 10-1-3-1: trashed instead, no [Trigger].
    moveCard(d, card, 'trash', { revealed: true, extra: { reason: 'banish' } });
    return;
  }
  // CR 4-6-3, 10-1-5-1: the damaged player may reveal a [Trigger] and activate it instead. The
  // decision is asked for every Life card taken, [Trigger] or not, so the opponent cannot tell
  // the two apart (ADR 0005, M2-01); "activate" is offered only for a scripted [Trigger] (E-D8).
  f.pending = card;
  ask(d, {
    kind: 'trigger',
    player: f.player,
    prompt: hasScriptedTrigger(d.s, card)
      ? `Damage: activate the [Trigger] of ${def.name}, or add it to your hand?`
      : `Damage: add ${def.name} to your hand.`,
  });
}

/** `player` took damage and its processing is over: the watchers on both fields (G43). */
function fireDamageTaken(d: Draft, player: PlayerId): void {
  fire(
    d,
    [d.s.active, other(d.s.active)],
    (q) => fieldCards(d, q),
    (w, _card, p) =>
      typeof w === 'object' && w.event === 'damageTaken' && (w.owner === 'you') === (player === p),
    'damageTaken',
  );
}

export function hasScriptedTrigger(s: State, id: InstanceId): boolean {
  const c = s.cards[id];
  return !!c && s.defs[c.card]!.abilities.some((a) => a.kind === 'trigger');
}

/** The Life card waiting on the damaged player's decision, if any. */
export function pendingLife(s: State): InstanceId | null {
  const f = s.stack[s.stack.length - 1];
  return f?.f === 'damage' ? f.pending : null;
}

/** The `trigger` decision's answer. */
export function answerTrigger(d: Draft, activate: boolean): void {
  const f = top(d);
  if (!f || f.f !== 'damage' || f.pending === null) throw new Error('No [Trigger] is pending');
  const card = f.pending;
  f.pending = null;
  const c = d.card(card);
  if (!activate) {
    // CR 10-1-5-2: to hand unrevealed.
    moveCard(d, card, 'hand', { extra: { reason: 'damage' } });
    return;
  }
  const nid = moveCard(d, card, 'resolving', { revealed: true, extra: { reason: 'trigger' } });
  d.emit({ type: 'TriggerRevealed', instance: nid, card: c.card, player: f.player });
  // "When a [Trigger] activates" (G56): the watchers queue now and resolve after the [Trigger] has.
  fire(
    d,
    [d.s.active, other(d.s.active)],
    (q) => fieldCards(d, q),
    (w, _card, p) =>
      typeof w === 'object' &&
      w.event === 'triggerActivated' &&
      (w.by === 'any' || (w.by === 'you') === (p === f.player)),
    'triggerActivated',
  );
  push(d, { f: 'trigger', card: nid, player: f.player, step: 'run' });
}

function runTrigger(d: Draft, f: Extract<Frame, { f: 'trigger' }>): void {
  const c = d.s.cards[f.card];
  if (f.step === 'run') {
    // Run the [Trigger] effect; the printed cost is never paid (RL-25).
    f.step = 'finish';
    const ab = c && d.s.defs[c.card]!.abilities.find((a) => a.kind === 'trigger');
    // Its own activation cost, if any, is paid by the effect frame (OP17-076).
    if (c && ab) pushEffect(d, f.card, c.card, ab, f.player, 'effect');
    return;
  }
  // CR 10-1-5-3: afterwards it is trashed unless the effect moved it.
  if (c && c.zone === 'resolving') moveCard(d, f.card, 'trash', { extra: { reason: 'trigger' } });
  pop(d);
}

// ---------------------------------------------------------------------------------------------
// K.O. and removal with replacement hooks (CR 8-1-3-4, 10-2-1; ADR 0013; E-D3)
// ---------------------------------------------------------------------------------------------

/**
 * Push a K.O. of a Character by battle, by effect, or as a cost ("K.O. 1 of your Characters:",
 * M6b wave 1 G1). A cost is part of the effect (CR 8-1-1), so protection against effects stops it.
 */
export function pushKo(
  d: Draft,
  card: InstanceId,
  cause: { kind: 'battle' | 'effect' | 'cost'; by: PlayerId },
  group?: number,
  /** The card whose effect or cost K.O.s, for a protection that names its source (G46). */
  src?: InstanceId,
  /** The source's last-known power and cost, when it left the field before the K.O. (G46). */
  srcLki?: { power: number | null; basePower: number | null; cost: number | null },
): void {
  const f: Frame = { f: 'ko', card, cause, considered: [] };
  if (group !== undefined) f.group = group;
  if (src !== undefined) f.src = src;
  if (srcLki) f.srcLki = { power: srcLki.power, basePower: srcLki.basePower, cost: srcLki.cost };
  push(d, f);
}

/** Push a removal from the field by an effect: to hand, to deck, or trashed (not a K.O.). */
export function pushRemove(
  d: Draft,
  card: InstanceId,
  dest: 'hand' | 'deck' | 'trash' | 'life',
  cause: Cause,
  position?: 'top' | 'bottom',
  group?: number,
  rank?: number,
  /** A Character placed into its owner's Life (G61): face-up, or face-down (the default). */
  faceUp?: boolean,
): void {
  const f: Frame = { f: 'remove', card, dest, cause, considered: [] };
  if (faceUp !== undefined) f.faceUp = faceUp;
  if (position) f.position = position;
  if (group !== undefined) f.group = group;
  if (rank !== undefined) f.rank = rank;
  push(d, f);
}

/** Offer the next applicable replacement for the event on top of the stack, if any. */
function offerReplacement(
  d: Draft,
  f: Extract<Frame, { f: 'ko' | 'remove' | 'rest' }>,
  event: 'ko' | 'remove' | 'rest',
): boolean {
  const cause: Cause = f.f === 'rest' ? { kind: 'effect', by: f.by } : f.cause;
  const reps = collectReplacements(
    d.s,
    f.card,
    event,
    cause,
    f.considered,
    f.f === 'rest' ? f.source : undefined,
  );
  const r = reps[0];
  if (!r) return false;
  f.considered = [...f.considered, `${r.card}/${r.ability}`];
  const ab = abilityOf(d.s, d.card(r.card).card, r.ability);
  if (ab?.kind === 'replacement' && ab.optional) {
    const target = d.s.defs[d.card(f.card).card]!.name;
    ask(d, {
      kind: 'optional',
      player: r.controller,
      prompt: `Use ${d.s.defs[d.card(r.card).card]!.name}'s effect instead of ${event === 'ko' ? 'the K.O. of' : event === 'rest' ? 'resting' : 'removing'} ${target}?`,
      replacement: r,
      purpose: 'replacement',
      role: 'replacement',
      source: sourceInfo(d.s, r.card, d.card(r.card).card, r.ability, ab.label),
      ...secretCostFlags(d, r, ab),
    });
    return true;
  }
  applyReplacement(d, r);
  return true;
}

function runKo(d: Draft, f: Extract<Frame, { f: 'ko' }>): void {
  const c = d.s.cards[f.card];
  // A Character, or a Stage (G18); anything else already left.
  if (!c || (c.zone !== 'characters' && c.zone !== 'stage')) {
    pop(d); // it already left; nothing to K.O.
    return;
  }
  const dv = deriveLive(d.s, f.card);
  // A protection that names the K.O.'s source reads the source card where it is now (G46): in the
  // trash for an [On K.O.] source or one that trashed itself as a cost (then by its last-known power
  // and cost); a source that left the game some other way matches nothing.
  const src = f.src;
  const source = (by: Filter): boolean =>
    src !== undefined &&
    d.s.cards[src] !== undefined &&
    matches(
      {
        s: d.s,
        you: c.owner,
        self: f.card,
        live: true,
        ...(f.srcLki ? { lki: { id: src, ...f.srcLki } } : {}),
      },
      src,
      by,
    );
  if (
    koProtected(dv, f.cause, c.owner, source) ||
    (dv.removalProof && byOpponentEffect(f.cause, c.owner))
  ) {
    d.emit({ type: 'KOPrevented', instance: f.card, card: c.card });
    pop(d);
    return;
  }
  if (offerReplacement(d, f, 'ko')) return;
  // No replacement: the K.O. happens (to its owner's trash, CR 10-2-1-2).
  const owner = c.owner;
  // `[DON!! xN] [On K.O.]` reads the DON!! the card had when it left (OP14-051): kept only when the
  // card has such a condition, so every other game's pending effects are as before.
  const don = c.don;
  const readsDon = d.s.defs[c.card]!.abilities.some(
    (a) =>
      a.kind === 'auto' &&
      a.when.includes('onKO') &&
      (a.conditions ?? []).some((k) => 'donGiven' in k),
  );
  d.emit({ type: 'KO', instance: f.card, card: c.card, owner, cause: f.cause });
  if (d.s.defs[c.card]!.category === 'Character') recordKo(d, owner);
  const lki = lastKnown(d, f.card, f.cause);
  const nid = leaveField(d, f.card, 'trash', f.cause);
  pop(d);
  // [On K.O.] activates on the field and resolves from the trash, following the rename
  // (CR 10-2-17-1/-2). A negated card's [On K.O.] does not activate (CR 8-2-1-1; E-Q1). The cause
  // goes with it, for "K.O.'d by your opponent's effect" (G28).
  if (!dv.negated)
    fire(
      d,
      [owner],
      () => [nid],
      (w) => w === 'onKO',
      'onKO',
      undefined,
      readsDon ? { cause: f.cause, don } : { cause: f.cause },
    );
  // "When one of your Characters is K.O.'d" (OP14-041, OP13-002): the filter reads the card as it
  // was on the field, its last-known information, not the printed values it has in the trash (the
  // official Q&A for OP14-053 Vista: K.O.'d with its base power set to 6000 counts as 6000).
  fire(
    d,
    [d.s.active, other(d.s.active)],
    (q) => fieldCards(d, q),
    (w, card, p) =>
      typeof w === 'object' &&
      w.event === 'koed' &&
      // `owner: 'opponent'` watches the other player's Characters (G38).
      (w.owner === 'opponent' ? p !== owner : p === owner) &&
      // "When one of your Characters is K.O.'d": a K.O.'d Stage is not a Character.
      d.s.defs[d.s.cards[nid]!.card]!.category === 'Character' &&
      matches({ s: d.s, you: p, self: card, live: true, lki: { id: nid, ...lki } }, nid, w.filter),
    'koed',
  );
}

/** Is this removal an effect of the card's owner's opponent (a protected card ignores it)? */
function byOpponentEffect(cause: Cause, owner: PlayerId): boolean {
  // A cost is part of the effect (RL-16): the opponent's cost that moves your card is their effect's.
  return (cause.kind === 'effect' || cause.kind === 'cost') && cause.by !== owner;
}

function runRemove(d: Draft, f: Extract<Frame, { f: 'remove' }>): void {
  const c = d.s.cards[f.card];
  if (!c || (c.zone !== 'characters' && c.zone !== 'stage')) {
    pop(d);
    return;
  }
  if (deriveLive(d.s, f.card).removalProof && byOpponentEffect(f.cause, c.owner)) {
    d.emit({ type: 'KOPrevented', instance: f.card, card: c.card, removal: true });
    pop(d);
    return;
  }
  if (offerReplacement(d, f, 'remove')) return;
  const opts: { position?: 'top' | 'bottom'; above?: number; faceUp?: boolean } = f.position
    ? { position: f.position }
    : {};
  if (f.rank !== undefined && f.position === 'bottom')
    opts.above = (f.placed ?? []).filter((r) => r > f.rank!).length;
  if (f.dest === 'life') opts.faceUp = f.faceUp === true;
  const nid = leaveField(d, f.card, f.dest, f.cause, opts);
  // A Character placed face-down in Life is hidden from then on, but both players saw it come from
  // the field: they still know which card it is (G61).
  if (f.dest === 'life' && f.faceUp !== true) markKnown(d, nid, ['p1', 'p2']);
  if (f.rank !== undefined && f.group !== undefined) {
    // Tell the rest of the group where this one went, so each lands above the ones owed below it.
    for (const o of d.stack())
      if (o.f === 'remove' && o !== f && o.group === f.group)
        o.placed = [...(o.placed ?? []), f.rank];
  }
  pop(d);
}

/** The rest by an effect, once no replacement stops it (G37). */
function runRest(d: Draft, f: Extract<Frame, { f: 'rest' }>): void {
  const c = d.s.cards[f.card];
  if (!c || c.rested || !['leader', 'characters', 'stage'].includes(c.zone)) {
    pop(d);
    return;
  }
  // A card that cannot be rested is not rested, so there is nothing to replace.
  if (restBlocked(deriveLive(d.s, f.card), c.owner, 'effect', f.by)) {
    pop(d);
    return;
  }
  if (offerReplacement(d, f, 'rest')) return;
  rest(d, f.card, 'effect', f.by, f.source);
  pop(d);
}

/**
 * Replacements that apply to the K.O. (`ko`) or other removal (`remove`) of `card`, in
 * CR 8-1-3-4-2 order: the card's own first, then the turn player's, then the non-turn player's.
 * Skips negated sources, spent Once Per Turn, ones already applied to this event (CR 8-1-3-4-3)
 * and impossible ones (CR 8-1-3-4-5). A `leaveField` replacement watches removal by the opponent's
 * effect, which includes a K.O. by an opponent's effect but never a battle K.O. (E-D3, E-Q7).
 */
export function collectReplacements(
  s: State,
  card: InstanceId,
  event: 'ko' | 'remove' | 'rest',
  cause: Cause,
  considered: string[],
  /** For `rest`: the card whose effect rests it. */
  source?: InstanceId,
): ReplacementRef[] {
  const target = s.cards[card]!;
  const out: (ReplacementRef & { rank: number })[] = [];
  /** Does this replaced event cover the event under way? (`p` controls the replacement.) */
  const covers = (rp: ReplaceEvent, c: Ctx, p: PlayerId): boolean => {
    if ('ko' in rp) {
      if (event !== 'ko') return false;
      if (rp.cause && !causeMatches(rp.cause, cause, target.owner)) return false;
      return pool(c, rp.ko).includes(card);
    }
    if ('leaveField' in rp) {
      if (event === 'rest') return false;
      // "removed from the field by your opponent's effect" (`opponentEffect`), or by anything
      // that takes it off the field, a battle K.O. and your own effects too (`any`, G14).
      if (rp.cause === 'opponentEffect' && (cause.kind !== 'effect' || cause.by === p))
        return false;
      return pool(c, rp.leaveField).includes(card);
    }
    if ('rest' in rp) {
      // "rested by your opponent's Character's effect" (G37).
      if (event !== 'rest' || cause.kind !== 'effect' || cause.by === p) return false;
      const src = source === undefined ? undefined : s.cards[source];
      if (!src || s.defs[src.card]!.category !== 'Character') return false;
      return pool(c, rp.rest).includes(card);
    }
    return false; // a damage replacement
  };
  const consider = (
    id: InstanceId,
    p: PlayerId,
    ab: Extract<Ability, { kind: 'replacement' }>,
    c: Ctx,
    snap?: InstanceId[],
  ): void => {
    if (snap && !snap.includes(card)) return;
    const key = `${id}/${ab.id}`;
    if (considered.includes(key)) return;
    if (ab.oncePerTurn && s.oncePerTurn.includes(key)) return;
    // One ability may cover several events (G14 b): it applies once, whichever one it is.
    const rps = Array.isArray(ab.replaces) ? ab.replaces : [ab.replaces];
    if (!rps.some((rp) => covers(rp, c, p))) return;
    if (!allHold(c, ab.conditions)) return;
    if (!possible(c, ab.instead, ab.optional)) return;
    const rank = id === card ? 0 : p === s.active ? 1 : 2;
    out.push({ card: id, ability: ab.id, controller: p, rank });
  };
  for (const p of [s.active, other(s.active)]) {
    const ps = s.players[p];
    for (const id of [ps.leader, ...ps.characters, ...ps.stage]) {
      const def = s.defs[s.cards[id]!.card]!;
      if (!def.abilities.some((a) => a.kind === 'replacement')) continue;
      if (isNegated(s, id)) continue;
      const c: Ctx = { s, you: p, self: id, live: true };
      for (const ab of def.abilities) if (ab.kind === 'replacement') consider(id, p, ab, c);
    }
  }
  // Replacements an effect created for the turn (D6): the source is the card that made them, or
  // the controller's Leader once that card has gone.
  for (const m of s.mods) {
    if (m.kind !== 'replacement' || !m.ab || m.ab.kind !== 'replacement') continue;
    const p = m.controller;
    const id = m.source && s.cards[m.source] ? m.source : s.players[p].leader;
    consider(id, p, m.ab, { s, you: p, self: id, live: true }, m.covers);
  }
  out.sort((a, b) => a.rank - b.rank);
  return out.map(({ rank: _r, ...r }) => r);
}

/**
 * Does the K.O. cause match a `ko` replacement's `cause`? `effect`: an effect of either player, a
 * cost included (it is part of the effect, RL-16); `opponentEffect`: an effect of the K.O.'d
 * card's owner's opponent (RL-14); `battle`.
 */
function causeMatches(
  want: 'opponentEffect' | 'effect' | 'battle',
  cause: Cause,
  owner: PlayerId,
): boolean {
  if (want === 'battle') return cause.kind === 'battle';
  if (want === 'opponentEffect') return byOpponentEffect(cause, owner);
  return cause.kind === 'effect' || cause.kind === 'cost';
}

/**
 * Replacements of the damage `player` would take (D4): `damage` replacements on that player's own
 * Leader, Characters and Stage, in field order. Same filters as the removal ones: not negated,
 * Once Per Turn unspent, not already offered for this damage, conditions hold, payload possible.
 */
export function collectDamageReplacements(
  s: State,
  player: PlayerId,
  considered: readonly string[],
): ReplacementRef[] {
  const out: ReplacementRef[] = [];
  const ps = s.players[player];
  for (const id of [ps.leader, ...ps.characters, ...ps.stage]) {
    const def = s.defs[s.cards[id]!.card]!;
    if (!def.abilities.some((a) => a.kind === 'replacement')) continue;
    if (isNegated(s, id)) continue;
    const c: Ctx = { s, you: player, self: id, live: true };
    for (const ab of def.abilities) {
      if (ab.kind !== 'replacement' || Array.isArray(ab.replaces) || !('damage' in ab.replaces))
        continue;
      const key = `${id}/${ab.id}`;
      if (considered.includes(key)) continue;
      if (ab.oncePerTurn && s.oncePerTurn.includes(key)) continue;
      if (!allHold(c, ab.conditions)) continue;
      if (!possible(c, ab.instead, ab.optional)) continue;
      out.push({ card: id, ability: ab.id, controller: player });
    }
  }
  return out;
}

/** Offer the next damage replacement (D4); true when a decision is waiting or one was applied. */
function offerDamageReplacement(d: Draft, f: Extract<Frame, { f: 'damage' }>): boolean {
  const r = collectDamageReplacements(d.s, f.player, f.considered ?? [])[0];
  if (!r) return false;
  f.considered = [...(f.considered ?? []), `${r.card}/${r.ability}`];
  const ab = abilityOf(d.s, d.card(r.card).card, r.ability);
  if (ab?.kind === 'replacement' && ab.optional) {
    ask(d, {
      kind: 'optional',
      player: r.controller,
      prompt: `Use ${d.s.defs[d.card(r.card).card]!.name}'s effect instead of taking the damage?`,
      replacement: r,
      purpose: 'replacement',
      role: 'replacement',
      source: sourceInfo(d.s, r.card, d.card(r.card).card, r.ability, ab.label),
      ...secretCostFlags(d, r, ab),
    });
    return true;
  }
  applyReplacement(d, r);
  return true;
}

/** An impossible replacement cannot be applied (CR 8-1-3-4-5): its payload must be payable. */
function possible(c: Ctx, instead: readonly unknown[], optional?: boolean): boolean {
  if (instead.some(isInternal)) {
    for (const st of instead as InternalStep[]) {
      if (st.op === 'lifeToHand' && c.s.players[c.you].life.length < st.n) return false;
    }
    return true;
  }
  if (isEffect(instead)) return true;
  const costs = instead as Cost[];
  // An optional replacement paid from a hidden zone is offered whenever its public conditions hold
  // (accept unavailable if the cost cannot be paid), so whether the game pauses never tells the
  // opponent what the hand holds (ADR 0005, `costIsSecret`). Only the public part gates the offer.
  if (optional && costIsSecret(costs))
    return payable(
      c,
      costs.filter((k) => !costIsSecret([k])),
    );
  return payable(c, costs);
}

/** Flags for an offered replacement whose cost is secret: `secret`, and `noAccept` if unpayable. */
function secretCostFlags(
  d: Draft,
  r: ReplacementRef,
  ab: Ability,
): { secret?: true; noAccept?: true } {
  if (ab.kind !== 'replacement' || isEffect(ab.instead) || !costIsSecret(ab.instead as Cost[]))
    return {};
  return replacementPayable(d, r, ab) ? { secret: true } : { secret: true, noAccept: true };
}

/** Can this replacement's cost be paid now? An unpayable secret cost is offered with accept off. */
function replacementPayable(d: Draft, r: ReplacementRef, ab: Ability): boolean {
  if (ab.kind !== 'replacement' || isEffect(ab.instead)) return true;
  if (ab.instead.some(isInternal)) return true;
  return payable({ s: d.s, you: r.controller, self: r.card, live: true }, ab.instead as Cost[]);
}

export function applyReplacement(d: Draft, r: ReplacementRef): void {
  const f = top(d);
  if (f?.f === 'damage') {
    const c = d.card(r.card);
    const ab = abilityOf(d.s, c.card, r.ability)!;
    if (ab.oncePerTurn) d.opt().push(`${r.card}/${r.ability}`);
    d.emit({
      type: 'ReplacementApplied',
      instance: r.card,
      card: c.card,
      ability: r.ability,
      replaced: 'damage',
      player: f.player,
      controller: r.controller,
    });
    pop(d); // the damage does not happen: no Life card is taken (CR 4-6-3-1)
    pushEffect(d, r.card, c.card, ab, r.controller, 'instead');
    return;
  }
  if (f?.f === 'rest') {
    // The rest does not happen (G37); the payload takes its place.
    const c = d.card(r.card);
    const ab = abilityOf(d.s, c.card, r.ability)!;
    if (ab.oncePerTurn) d.opt().push(`${r.card}/${r.ability}`);
    d.emit({
      type: 'ReplacementApplied',
      instance: r.card,
      card: c.card,
      ability: r.ability,
      replaced: 'rest',
      target: f.card,
      controller: r.controller,
    });
    pop(d);
    pushEffect(d, r.card, c.card, ab, r.controller, 'instead');
    return;
  }
  if (!f || (f.f !== 'ko' && f.f !== 'remove')) throw new Error('No K.O. or removal to replace');
  const c = d.card(r.card);
  const ab = abilityOf(d.s, c.card, r.ability)!;
  const mates = groupMates(d.stack(), d.s, f, r);
  if (ab.oncePerTurn) d.opt().push(`${r.card}/${r.ability}`);
  d.emit({
    type: 'ReplacementApplied',
    instance: r.card,
    card: c.card,
    ability: r.ability,
    replaced: f.f === 'ko' ? 'ko' : 'remove',
    target: f.card,
    controller: r.controller,
  });
  pop(d); // the K.O. or removal does not happen
  // One removal event over several Characters: the same replacement covers every other one of the
  // event it applies to, answered once (QA-OP15 OP15-069: one DON!! return keeps both).
  for (const mate of mates) {
    d.emit({
      type: 'ReplacementApplied',
      instance: r.card,
      card: c.card,
      ability: r.ability,
      replaced: mate.f === 'ko' ? 'ko' : 'remove',
      target: mate.card,
      controller: r.controller,
    });
    d.stack().splice(d.stack().indexOf(mate), 1);
  }
  // A payload that names "the replaced card" reads it as `{ ref: 'replaced' }` (G61, OP11-101).
  pushEffect(
    d,
    r.card,
    c.card,
    ab,
    r.controller,
    'instead',
    readsReplaced(ab) ? { b: { replaced: [f.card] } } : {},
  );
}

const replacedMemo = new WeakMap<object, boolean>();
/** Does the payload of this replacement refer to the card it replaced (`{ ref: 'replaced' }`)? */
function readsReplaced(ab: Ability): boolean {
  if (ab.kind !== 'replacement') return false;
  let v = replacedMemo.get(ab.instead);
  if (v === undefined) {
    v = JSON.stringify(ab.instead).includes('"ref":"replaced"');
    replacedMemo.set(ab.instead, v);
  }
  return v;
}

type RemovalFrame = Extract<Frame, { f: 'ko' | 'remove' }>;

/** The other removals of `f`'s event (same effect, same kind) that replacement `r` also covers. */
function groupMates(
  stack: State['stack'],
  s: State,
  f: RemovalFrame,
  r: ReplacementRef,
): RemovalFrame[] {
  if (f.group === undefined) return [];
  return stack.filter(
    (x): x is RemovalFrame =>
      x !== f &&
      (x.f === 'ko' || x.f === 'remove') &&
      x.f === f.f &&
      x.group === f.group &&
      s.cards[x.card] !== undefined &&
      collectReplacements(s, x.card, x.f, x.cause, x.considered).some(
        (y) => y.card === r.card && y.ability === r.ability,
      ),
  );
}

/** Declining a replacement declines it for the whole event: its other Characters are not asked. */
export function declineReplacement(d: Draft, r: ReplacementRef): void {
  const f = top(d);
  if (!f || (f.f !== 'ko' && f.f !== 'remove')) return;
  for (const mate of groupMates(d.stack(), d.s, f, r))
    mate.considered = [...mate.considered, `${r.card}/${r.ability}`];
}

// ---------------------------------------------------------------------------------------------
// Auto effects: activation and the pending queue (CR 8-1-3-1, 8-6)
// ---------------------------------------------------------------------------------------------

export function fieldCards(d: Draft, p: PlayerId): InstanceId[] {
  const ps = d.ro(p);
  return [ps.leader, ...ps.characters, ...ps.stage];
}

type TimingMatch = (when: AutoTiming, card: InstanceId, controller: PlayerId) => boolean;

const subjectMemo = new WeakMap<object, boolean>();
/** Does an ability select the event's subject (`lki: 'subject'`, D9)? Read once per ability. */
function readsSubject(ab: Ability): boolean {
  let r = subjectMemo.get(ab);
  if (r === undefined) {
    r = JSON.stringify(ab).includes('"lki":"subject"');
    subjectMemo.set(ab, r);
  }
  return r;
}

/**
 * Activate every auto ability on the given cards whose timing matches: they join the pending queue
 * as one batch, players in `order` (pass the turn player first, CR 8-6-1). An ability whose
 * conditions fail at the event does not activate (CR 8-3-2-3), nor one on a negated card (8-2-1-1),
 * nor a spent [Once Per Turn] (CR 10-2-13-3).
 */
export function fire(
  d: Draft,
  order: PlayerId[],
  cardsOf: (p: PlayerId) => InstanceId[],
  match: TimingMatch,
  label: string,
  shared?: number,
  ev?: Ev,
  subject?: InstanceId,
): void {
  let added: State['pending'] | null = null;
  let batch = shared ?? -1;
  for (const p of order) {
    for (const id of cardsOf(p)) {
      const c = d.s.cards[id];
      if (!c) continue;
      const abilities = d.s.defs[c.card]!.abilities;
      if (!abilities.some((a) => a.kind === 'auto')) continue;
      if (c.zone !== 'trash' && isNegated(d.s, id)) continue;
      for (const ab of abilities) {
        if (ab.kind !== 'auto' || !ab.when.some((w) => match(w, id, p))) continue;
        if (ab.oncePerTurn && d.s.oncePerTurn.includes(`${id}/${ab.id}`)) continue;
        // The card the event is about travels with the pending effect only when the ability reads it
        // (`lki: 'subject'`, D9), so the state of every other game is exactly as it was.
        const here = subject !== undefined && readsSubject(ab) ? { ...ev, subject } : ev;
        if (!allHold({ s: d.s, you: p, self: id, live: true, ev: here }, ab.conditions)) continue;
        if (batch < 0) batch = d.s.nextMod++;
        (added ??= []).push({
          batch,
          card: id,
          key: c.key,
          cardId: c.card,
          ability: ab.id,
          controller: p,
          timing: label,
          ...(here ? { ev: here } : {}),
        });
      }
    }
  }
  if (added) d.s.pending = [...d.s.pending, ...added];
}

/**
 * "When you / your opponent activates an Event or [Blocker]": `by` in the ability is relative to
 * its own controller, `actor` is who did it. The turn player's watchers queue first (CR 8-6-1).
 */
export function fireActor(
  d: Draft,
  event: 'eventActivated' | 'blockerActivated',
  actor: PlayerId,
): void {
  fire(
    d,
    [d.s.active, other(d.s.active)],
    (q) => fieldCards(d, q),
    (w, _card, p) =>
      typeof w === 'object' && w.event === event && (w.by === 'you') === (p === actor),
    event,
  );
}

// A card left a Life area (damage, an effect, a cost): "when a card is removed from your or your
// opponent's Life cards" (OP12-099) and "when your number of Life cards becomes 0" (OP05-098).
hooks.lifeRemoved = (d, owner) => {
  const zero = d.ro(owner).life.length === 0;
  fire(
    d,
    [d.s.active, other(d.s.active)],
    (q) => fieldCards(d, q),
    (w, _card, p) =>
      typeof w === 'object' &&
      ((w.event === 'lifeRemoved' &&
        (w.owner === 'any' || (w.owner === 'you') === (p === owner))) ||
        (zero && w.event === 'lifeBecameZero' && (w.owner === 'you') === (p === owner))),
    'lifeRemoved',
  );
};

// A card became rested (G24): "[Your Turn] When this Character becomes rested", "when a Character is
// rested by your effect". `reason` says how (a rest by an effect, a cost, or the rules: attacking,
// blocking); `by` is the player whose effect rested it and `source` that effect's card.
hooks.rested = (d, id, reason, by, source) => {
  const owner = d.card(id).owner;
  fire(
    d,
    [d.s.active, other(d.s.active)],
    (q) => fieldCards(d, q),
    (w, card, p) => {
      if (typeof w !== 'object' || w.event !== 'rested') return false;
      if (w.owner !== 'any' && (w.owner === 'you') !== (owner === p)) return false;
      if (w.by) {
        if (reason !== 'effect' || by === undefined) return false;
        if (w.by === 'yourEffect' && by !== p) return false;
        if (w.by === 'opponentEffect' && by === p) return false;
      }
      const c: Ctx = { s: d.s, you: p, self: card, live: true };
      if (w.sourceFilter) {
        if (reason !== 'effect' || source === undefined || !d.s.cards[source]) return false;
        if (!matches(c, source, w.sourceFilter)) return false;
      }
      return !w.filter || matches(c, id, w.filter);
    },
    'rested',
  );
};

// A Character or Stage left the field (G29): "when your Character is removed from the field". The
// card is read by its last-known information (M6b-Q20, M4b-14); the watchers are the cards still on a field.
hooks.removed = (d, info) => {
  fire(
    d,
    [d.s.active, other(d.s.active)],
    (q) => fieldCards(d, q),
    (w, card, p) => {
      if (typeof w !== 'object' || (w.event !== 'removed' && w.event !== 'leftField')) return false;
      if ((w.owner === 'you') !== (info.owner === p)) return false;
      if (w.to && w.to !== info.to) return false;
      if (w.cause) {
        const c = info.cause;
        // An effect, or a cost (part of the effect, RL-16); a rule move or a battle is neither.
        if (c.kind !== 'effect' && c.kind !== 'cost') return false;
        if (w.cause === 'yourEffect' && c.by !== p) return false;
        if (w.cause === 'opponentEffect' && (c.kind !== 'effect' || c.by === p)) return false;
      }
      return (
        !w.filter ||
        matches(
          { s: d.s, you: p, self: card, live: true, lki: { id: info.card, ...info.lki } },
          info.card,
          w.filter,
        )
      );
    },
    'removed',
  );
};

/**
 * `n` cards were trashed from `owner`'s hand by the effect (or, with `cost`, the cost) of `source`,
 * controlled by `by` (G22). One event per instruction, so the watchers see the whole number.
 */
export function fireTrashedFromHand(
  d: Draft,
  owner: PlayerId,
  n: number,
  source: InstanceId,
  by: PlayerId,
  cost: boolean,
): void {
  if (n <= 0) return;
  fire(
    d,
    [d.s.active, other(d.s.active)],
    (q) => fieldCards(d, q),
    (w, card, p) => {
      if (typeof w !== 'object' || w.event !== 'trashedFromHand') return false;
      if ((w.owner === 'you') !== (owner === p)) return false;
      if (cost && !w.includeCosts) return false;
      if (w.by && (w.by === 'you') !== (by === p)) return false;
      if (w.sourceFilter) {
        if (!d.s.cards[source]) return false;
        if (!matches({ s: d.s, you: p, self: card, live: true }, source, w.sourceFilter))
          return false;
      }
      return true;
    },
    'trashedFromHand',
    undefined,
    { n },
  );
}

/**
 * `n` DON!! cards of `returner` were returned from the field to the DON!! deck by the effect (or
 * cost, part of the effect, RL-16) of the ability's controller `by` (G40). One event per
 * instruction, so "2 or more returned" reads the whole number. The watchers are the cards on both
 * fields: `owner` is relative to the watcher, `cause` limits it to the watcher's own effects or
 * the other player's.
 */
export function fireDonReturned(d: Draft, returner: PlayerId, n: number, by: PlayerId): void {
  if (n <= 0) return;
  fire(
    d,
    [d.s.active, other(d.s.active)],
    (q) => fieldCards(d, q),
    (w, _card, p) => {
      if (typeof w !== 'object' || w.event !== 'donReturned') return false;
      if ((w.owner === 'you') !== (returner === p)) return false;
      if (w.min !== undefined && n < w.min) return false;
      if (w.cause === 'yourEffect' && by !== p) return false;
      if (w.cause === 'opponentEffect' && by === p) return false;
      return true;
    },
    'donReturned',
  );
}

/** Named-timing shorthand (CR 10-2). */
export function fireFor(
  d: Draft,
  order: PlayerId[],
  timing: AutoTiming,
  cardsOf: (p: PlayerId) => InstanceId[],
): void {
  fire(d, order, cardsOf, (w) => w === timing, typeof timing === 'string' ? timing : 'event');
}

/**
 * Does the battle's attacker (or target) match an `attack` event's selector for `p`? `side` is the
 * selector that decides which player's cards watch the event; when the timing also names the other
 * side ("when this Leader attacks your opponent's Leader", OP12-081), that one must match too.
 */
export function attackMatch(
  s: State,
  w: AutoTiming,
  card: InstanceId,
  p: PlayerId,
  side: 'attacker' | 'target',
): boolean {
  if (typeof w !== 'object' || w.event !== 'attack' || !s.battle) return false;
  const sel = side === 'attacker' ? w.attacker : w.target;
  if (!sel) return false;
  const ctx = { s, you: p, self: card, live: true };
  const subject = side === 'attacker' ? s.battle.attacker : s.battle.target;
  if (!pool(ctx, sel).includes(subject)) return false;
  const other = side === 'attacker' ? w.target : w.attacker;
  const otherSubject = side === 'attacker' ? s.battle.target : s.battle.attacker;
  return !other || pool(ctx, other).includes(otherSubject);
}

/**
 * A delayed effect's registration point: "at the end of this turn" (CR 6-6-1-1). `controller`'s
 * delayed effects of this turn form the End Phase batch after the [End of Your Turn] one (see `endTriggers`).
 */
function fireDelayed(d: Draft, controller: PlayerId, batch: number): void {
  const now = d.s.delayed.filter(
    (x) => !x.at && x.turn === d.s.turn && x.controller === controller,
  );
  if (now.length === 0) return;
  d.s.delayed = d.s.delayed.filter((x) => !now.includes(x));
  d.s.pending = [
    ...d.s.pending,
    ...now.map((x) => ({
      batch,
      card: x.card,
      key: x.key,
      cardId: x.cardId,
      ability: x.ability,
      controller: x.controller,
      timing: 'endOfThisTurn',
      start: x.start,
      ...(x.b ? { b: x.b } : {}),
    })),
  ];
}

/**
 * "At the start of your opponent's next Main Phase" (D8): the delayed effects of the player whose
 * opponent `active` is, made in an earlier turn, run now. Their conditions were read when they
 * were created (official PRB02 Q&A for PRB02-005), so nothing is checked here.
 */
function fireDelayedMain(d: Draft, active: PlayerId, batch: number): void {
  const now = d.s.delayed.filter(
    (x) => x.at === 'startOfOpponentsNextMainPhase' && x.controller !== active && x.turn < d.s.turn,
  );
  if (now.length === 0) return;
  d.s.delayed = d.s.delayed.filter((x) => !now.includes(x));
  d.s.pending = [
    ...d.s.pending,
    ...now.map((x) => ({
      batch,
      card: x.card,
      key: x.key,
      cardId: x.cardId,
      ability: x.ability,
      controller: x.controller,
      timing: 'startOfOpponentsNextMainPhase',
      start: x.start,
      ...(x.b ? { b: x.b } : {}),
    })),
  ];
}

/** The pending effects a player must order now: the head batch's run for one controller. */
export function orderGroup(s: State): State['pending'] {
  const h = s.pending[0];
  if (!h) return [];
  const out: State['pending'] = [];
  for (const e of s.pending) {
    if (e.batch !== h.batch || e.controller !== h.controller) break;
    out.push(e);
  }
  return out;
}

/** Printed timing words for prompts (flows F8b: name the timing). */
const TIMING_WORDS: Record<string, string> = {
  onPlay: '[On Play]',
  onKO: '[On K.O.]',
  attack: "[When Attacking] / [On Your Opponent's Attack]",
  endOfYourTurn: '[End of Your Turn]',
  endOfOpponentsTurn: "[End of Your Opponent's Turn]",
  endOfThisTurn: '(at the end of this turn)',
  donReturned: '(DON!! returned)',
  onBlock: '[On Block]',
  startOfYourTurn: '(start of turn)',
  rested: '(when rested)',
  removed: '(removed from the field)',
  triggerActivated: '(a [Trigger] activated)',
  trashedFromHand: '(card trashed from hand)',
};

export const pendingKey = (e: { card: InstanceId; ability: string }): string =>
  `${e.card}#${e.ability}`;

/**
 * Resolve the next pending auto effect, if the game is at a point where effects may resolve:
 * no activation, damage processing, K.O. or play is in progress (CR 8.6.3, 8-6-2). When a player
 * has two or more effects from one event waiting, they choose which resolves first (an `order`
 * decision; Rule Manual "Effect Activation Order", CR 8-6-1-1).
 */
function drainPending(d: Draft): boolean {
  if (d.s.pending.length === 0) return false;
  const f = top(d);
  if (!f || (f.f !== 'turn' && f.f !== 'battle' && f.f !== 'setup')) return false;
  const group = orderGroup(d.s);
  if (group.length >= 2 && !group[0]!.chosen) {
    const p = group[0]!.controller;
    ask(d, {
      kind: 'order',
      player: p,
      prompt: 'Several of your effects activated at once. Choose the one to resolve first.',
      candidates: group.map(pendingKey),
      purpose: 'pending',
      role: 'order',
      options: group.map((e) => ({
        id: pendingKey(e),
        label:
          `${d.s.defs[e.cardId]?.name ?? e.cardId} ${TIMING_WORDS[e.timing] ?? ''}: ${abilityOf(d.s, e.cardId, e.ability)?.label ?? 'effect'}`.replace(
            '  ',
            ' ',
          ),
      })),
    });
    return true;
  }
  const [next, ...rest] = d.s.pending;
  d.s.pending = rest;
  const ab = abilityOf(d.s, next!.cardId, next!.ability);
  if (!ab) return true;
  // An effect whose source is negated before it resolves does nothing (CR 8-2-1-1). A delayed
  // effect (`start` set) was created by an earlier resolution and does not depend on its source:
  // negating the source afterwards, or its leaving the field, does not stop it (M4a-10).
  const src = d.s.cards[next!.card];
  if (
    next!.start === undefined &&
    src &&
    src.zone !== 'trash' &&
    src.zone !== 'resolving' &&
    isNegated(d.s, next!.card)
  )
    return true;
  d.emit({
    type: 'EffectActivated',
    player: next!.controller,
    instance: next!.card,
    card: next!.cardId,
    ability: next!.ability,
    timing: next!.timing,
    keys: { instance: next!.key },
  });
  const opts: { start?: number; delayed?: boolean; ev?: Ev; b?: Record<string, InstanceId[]> } = {};
  if (next!.start !== undefined) {
    opts.start = next!.start;
    opts.delayed = true;
  }
  if (next!.ev) opts.ev = next!.ev;
  if (next!.b) opts.b = next!.b;
  pushEffect(d, next!.card, next!.cardId, ab, next!.controller, 'effect', opts);
  return true;
}

/** The `order` answer for pending effects: that one resolves next. */
export function choosePending(d: Draft, first: string): void {
  const i = d.s.pending.findIndex((e) => pendingKey(e) === first);
  if (i < 0) throw new Error('No such pending effect');
  const e = { ...d.s.pending[i]!, chosen: true as const };
  d.s.pending = [e, ...d.s.pending.filter((_, j) => j !== i)];
}

/** Who and what a decision belongs to (public `Decision.source`). */
export function sourceInfo(
  s: State,
  card: InstanceId,
  cardId: string,
  ability: string,
  label?: string,
): NonNullable<DecisionState['source']> {
  const out: NonNullable<DecisionState['source']> = { card, cardId, ability };
  if (label) out.label = label;
  return out;
}

export { runEffect, runRemove };

/** Answer to an `optional` decision for an optional auto ability (legacy path). */
export function answerAbilityOptional(d: Draft, accept: boolean): void {
  answerEffect(d, accept);
}

export { fireDelayed };
