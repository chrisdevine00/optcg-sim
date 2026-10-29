/**
 * The interpreter loop (ARCHITECTURE §2.3, §2.4, ADR 0003). `advance` runs frames from the top of
 * the stack until some player owes a decision or the game is over. Every frame is plain data, so a
 * suspended choice is just a frame waiting for its next action.
 */
import type { InstanceId, PlayerId } from './api.ts';
import type { Ability, AutoTiming, InternalStep } from './abilities.ts';
import { deriveLive } from './derive.ts';
import type { Draft } from './draft.ts';
import { OPENING_HAND } from './defs.ts';
import { summaryHash } from './hash.ts';
import {
  draw,
  endGame,
  expireModifiers,
  leaveField,
  lifeToHand,
  markDamagedAtZero,
  moveCard,
  placeDon,
  returnGivenDon,
  ruleProcessing,
  setActive,
  untapAll,
} from './ops/index.ts';
import {
  other,
  type DecisionState,
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
      // 6-6-1-1: [End of Your Turn] (turn player) then [End of Your Opponent's Turn] (non-turn).
      f.step = 'endExpire';
      fireFor(d, [p], 'endOfYourTurn', (q) => fieldCards(d, q));
      fireFor(d, [other(p)], 'endOfOpponentsTurn', (q) => fieldCards(d, q));
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
  const c = d.card(f.card);
  const def = d.s.defs[c.card]!;
  const ps = d.ro(f.player);
  switch (f.step) {
    case 'pay':
      // Reveal, then pay the cost (CR 2-7-2..2-7-4, RL-04).
      d.emit({ type: 'CardRevealed', instance: f.card, card: c.card, player: f.player });
      if (def.category === 'Event') {
        const cost = deriveLive(d.s, f.card).cost ?? 0;
        payCost(d, f.player, cost);
        // CR 8-4-2: trash the Event, then carry out its effect.
        const nid = moveCard(d, f.card, 'trash', { revealed: true, extra: { reason: 'event' } });
        d.emit({ type: 'EventActivated', instance: nid, card: c.card, player: f.player });
        pop(d);
        const main = def.abilities.find((a) => a.kind === 'activate' && a.when === 'main');
        if (main) pushEffect(d, nid, c.card, main, f.player, 'effect');
        return;
      }
      payCost(d, f.player, deriveLive(d.s, f.card).cost ?? 0);
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
      moveCard(d, f.card, to, { revealed: true, extra: { reason: 'play' } });
      const w = d.wcard(f.card);
      w.played = d.s.turn;
      d.emit({ type: 'CardPlayed', instance: f.card, card: c.card, player: f.player, zone: to });
      f.step = 'done';
      fireFor(d, [f.player], 'onPlay', () => [f.card]);
      return;
    }
    case 'done':
      pop(d);
      return;
  }
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
      // CR 7-1-1-3, 10-2-16-1: [When Attacking] first, then [On Your Opponent's Attack].
      b.step = 'attackEnd';
      fireFor(d, [b.attackerOwner], 'whenAttacking', () => [b.attacker]);
      fireFor(d, [defender], 'onOpponentAttack', (q) => fieldCards(d, q));
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
        if (d.ro(defender).life.length === 0) {
          // CR 7-1-4-1-1-1: damage determined against 0 Life: the attacker wins.
          markDamagedAtZero(d, defender);
          return;
        }
        push(d, {
          f: 'damage',
          player: defender,
          remaining: n,
          banish,
          battle: true,
          by: b.attackerOwner,
          pending: null,
        });
      } else {
        // CR 7-1-4-1-2.
        push(d, {
          f: 'ko',
          card: b.target,
          cause: { kind: 'battle', by: b.attackerOwner },
          considered: [],
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
      d.emit({ type: 'BattleEnded', attacker: b.attacker, target: b.target });
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
  push(d, { f: 'trigger', card: nid, player: f.player, step: 'run' });
}

function runTrigger(d: Draft, f: Extract<Frame, { f: 'trigger' }>): void {
  const c = d.s.cards[f.card];
  if (f.step === 'run') {
    // Run the [Trigger] effect; the printed cost is never paid (RL-25).
    f.step = 'finish';
    const ab = c && d.s.defs[c.card]!.abilities.find((a) => a.kind === 'trigger');
    if (c && ab) pushEffect(d, f.card, c.card, ab, f.player, 'effect');
    return;
  }
  // CR 10-1-5-3: afterwards it is trashed unless the effect moved it.
  if (c && c.zone === 'resolving') moveCard(d, f.card, 'trash', { extra: { reason: 'trigger' } });
  pop(d);
}

// ---------------------------------------------------------------------------------------------
// K.O. with replacement hooks (CR 8-1-3-4, 10-2-1; ADR 0013)
// ---------------------------------------------------------------------------------------------

/** Push a K.O. of a Character by battle or effect. */
export function pushKo(
  d: Draft,
  card: InstanceId,
  cause: { kind: 'battle' | 'effect'; by: PlayerId },
): void {
  push(d, { f: 'ko', card, cause, considered: [] });
}

function runKo(d: Draft, f: Extract<Frame, { f: 'ko' }>): void {
  const c = d.s.cards[f.card];
  if (!c || c.zone !== 'characters') {
    pop(d); // it already left; nothing to K.O.
    return;
  }
  if (deriveLive(d.s, f.card).cannotBeKOd) {
    d.emit({ type: 'KOPrevented', instance: f.card, card: c.card });
    pop(d);
    return;
  }
  const reps = collectKoReplacements(d.s, f.card, f.considered);
  const r = reps[0];
  if (r) {
    f.considered = [...f.considered, `${r.card}/${r.ability}`];
    const ab = abilityOf(d.s, d.card(r.card).card, r.ability);
    if (ab?.kind === 'replacement' && ab.optional) {
      ask(d, {
        kind: 'optional',
        player: r.controller,
        prompt: `Use ${d.s.defs[d.card(r.card).card]!.name}'s effect instead of the K.O. of ${d.s.defs[c.card]!.name}?`,
        replacement: r,
        purpose: 'replacement',
      });
      return;
    }
    applyReplacement(d, r);
    return;
  }
  // No replacement: the K.O. happens (to its owner's trash, CR 10-2-1-2).
  const owner = c.owner;
  d.emit({ type: 'KO', instance: f.card, card: c.card, owner, cause: f.cause });
  const nid = leaveField(d, f.card, 'trash', f.cause);
  pop(d);
  // [On K.O.] resolves from the trash, following the rename (CR 10-2-17-2).
  fireFor(d, [owner], 'onKO', () => [nid]);
}

/**
 * Replacements that apply to the K.O. of `card`, in CR 8-1-3-4-2 order: the K.O.'d card's own
 * first, then the turn player's, then the non-turn player's. Skips spent Once Per Turn, ones already
 * applied to this event (CR 8-1-3-4-3) and impossible ones (CR 8-1-3-4-5).
 */
export function collectKoReplacements(
  s: State,
  card: InstanceId,
  considered: string[],
): ReplacementRef[] {
  const target = s.cards[card]!;
  const tdef = s.defs[target.card]!;
  const out: (ReplacementRef & { rank: number })[] = [];
  for (const p of [s.active, other(s.active)]) {
    const ps = s.players[p];
    for (const id of [ps.leader, ...ps.characters, ...ps.stage]) {
      const def = s.defs[s.cards[id]!.card]!;
      for (const ab of def.abilities) {
        if (ab.kind !== 'replacement') continue;
        const key = `${id}/${ab.id}`;
        if (considered.includes(key)) continue;
        if (ab.oncePerTurn && s.oncePerTurn.includes(key)) continue;
        const m = ab.replaces.ko;
        if (m.self && id !== card) continue;
        if (m.owner === 'you' && target.owner !== p) continue;
        if (m.owner === 'opponent' && target.owner === p) continue;
        if (m.name !== undefined && tdef.name !== m.name) continue;
        if (!possible(s, p, ab.instead)) continue;
        const rank = id === card ? 0 : p === s.active ? 1 : 2;
        out.push({ card: id, ability: ab.id, controller: p, rank });
      }
    }
  }
  out.sort((a, b) => a.rank - b.rank);
  return out.map(({ rank: _r, ...r }) => r);
}

/** An impossible replacement cannot be applied (CR 8-1-3-4-5), e.g. Life to hand at 0 Life. */
function possible(s: State, p: PlayerId, steps: InternalStep[]): boolean {
  for (const st of steps) {
    if (st.op === 'lifeToHand' && s.players[p].life.length < st.n) return false;
  }
  return true;
}

export function applyReplacement(d: Draft, r: ReplacementRef): void {
  const f = top(d);
  if (!f || f.f !== 'ko') throw new Error('No K.O. to replace');
  const c = d.card(r.card);
  const ab = abilityOf(d.s, c.card, r.ability)!;
  if (ab.oncePerTurn) d.opt().push(`${r.card}/${r.ability}`);
  d.emit({
    type: 'ReplacementApplied',
    instance: r.card,
    card: c.card,
    ability: r.ability,
    replaced: 'ko',
    target: f.card,
    controller: r.controller,
  });
  pop(d); // the K.O. does not happen
  pushEffect(d, r.card, c.card, ab, r.controller, 'instead');
}

// ---------------------------------------------------------------------------------------------
// Ability hooks (placeholder runner until the M4 DSL interpreter)
// ---------------------------------------------------------------------------------------------

export function fieldCards(d: Draft, p: PlayerId): InstanceId[] {
  const ps = d.ro(p);
  return [ps.leader, ...ps.characters, ...ps.stage];
}

/**
 * Activate every auto ability with `timing` on the given cards: they join the pending queue in
 * `order` (players listed in resolution order; pass the turn player first, CR 8-6-1).
 */
export function fireFor(
  d: Draft,
  order: PlayerId[],
  timing: AutoTiming,
  cardsOf: (p: PlayerId) => InstanceId[],
): void {
  let added: State['pending'] | null = null;
  for (const p of order) {
    for (const id of cardsOf(p)) {
      const c = d.s.cards[id];
      if (!c) continue;
      for (const ab of d.s.defs[c.card]!.abilities) {
        if (ab.kind !== 'auto' || !ab.when.includes(timing)) continue;
        if (ab.oncePerTurn && d.s.oncePerTurn.includes(`${id}/${ab.id}`)) continue;
        (added ??= []).push({ card: id, cardId: c.card, ability: ab.id, controller: p, timing });
      }
    }
  }
  if (added) d.s.pending = [...d.s.pending, ...added];
}

/**
 * Resolve the next pending auto effect, if the game is at a point where effects may resolve:
 * no activation, damage processing, K.O. or play is in progress (CR 8.6.3, 8-6-2).
 */
function drainPending(d: Draft): boolean {
  if (d.s.pending.length === 0) return false;
  const f = top(d);
  if (!f || (f.f !== 'turn' && f.f !== 'battle' && f.f !== 'setup')) return false;
  const [next, ...rest] = d.s.pending;
  d.s.pending = rest;
  const ab = abilityOf(d.s, next!.cardId, next!.ability);
  if (!ab) return true;
  d.emit({
    type: 'EffectActivated',
    instance: next!.card,
    card: next!.cardId,
    ability: next!.ability,
    timing: next!.timing,
  });
  pushEffect(d, next!.card, next!.cardId, ab, next!.controller, 'effect');
  return true;
}

export function pushEffect(
  d: Draft,
  card: InstanceId,
  cardId: string,
  ab: Ability,
  controller: PlayerId,
  part: 'effect' | 'instead',
): void {
  push(d, {
    f: 'effect',
    card,
    cardId,
    ability: ab.id,
    part,
    controller,
    ip: 0,
    ask: ab.kind === 'auto' && ab.optional === true,
  });
}

function runEffect(d: Draft, f: Extract<Frame, { f: 'effect' }>): void {
  const ab = abilityOf(d.s, f.cardId, f.ability);
  if (!ab) {
    pop(d);
    return;
  }
  if (f.ask) {
    ask(d, {
      kind: 'optional',
      player: f.controller,
      prompt: `Use the effect of ${d.s.defs[f.cardId]!.name}?`,
      purpose: 'ability',
    });
    return;
  }
  const steps: InternalStep[] =
    f.part === 'instead' && ab.kind === 'replacement'
      ? ab.instead
      : ab.kind !== 'replacement'
        ? ab.effect
        : [];
  if (f.ip === 0 && ab.oncePerTurn && ab.kind !== 'replacement') {
    const key = `${f.card}/${ab.id}`;
    if (!d.s.oncePerTurn.includes(key)) d.opt().push(key);
  }
  const st = steps[f.ip];
  if (!st) {
    pop(d);
    return;
  }
  f.ip += 1;
  runStep(d, f.card, f.controller, st);
}

function runStep(d: Draft, self: InstanceId, you: PlayerId, st: InternalStep): void {
  d.ops++;
  switch (st.op) {
    case 'emit':
      d.emit({ type: 'EffectResolved', label: st.label, instance: self, player: you });
      return;
    case 'draw':
      draw(d, you, st.n);
      return;
    case 'lifeToHand':
      lifeToHand(d, you, st.n);
      return;
    case 'damage': {
      const p = st.player === 'you' ? you : other(you);
      d.emit({ type: 'DamageDealt', player: p, amount: st.n, by: you, effect: true });
      push(d, {
        f: 'damage',
        player: p,
        remaining: st.n,
        banish: false,
        battle: false,
        by: you,
        pending: null,
      });
      return;
    }
    case 'ko':
      pushKo(d, st.target, { kind: 'effect', by: you });
      return;
    case 'setActive':
      if (d.s.cards[self]) setActive(d, self);
      return;
  }
}

/** Answer to an `optional` decision for an optional auto ability. */
export function answerAbilityOptional(d: Draft, accept: boolean): void {
  const f = top(d);
  if (!f || f.f !== 'effect' || !f.ask) throw new Error('No optional ability is pending');
  if (accept) f.ask = false;
  else pop(d);
}
