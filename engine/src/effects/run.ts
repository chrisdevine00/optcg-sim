/**
 * The effect interpreter (ARCHITECTURE §2.4, effect-dsl.md §4). An `effect` frame runs one compiled
 * instruction per call. A choice posts a decision and returns; the answer lands in the frame's
 * `got`, and the next call resumes the same instruction. Zone transfers that replacements can see
 * (K.O., removal, play) push their own frames above this one, so they run before the next
 * instruction, as the CR orders them.
 */
import type { Cost, Duration as DslDuration, EffectAction, Selector } from '@optcg/cards';
import type { DonClass, InstanceId, PlayerId } from '../api.ts';
import type { Ability, InternalStep } from '../abilities.ts';
import { hasTiming, optionalCost } from '../abilities.ts';
import type { Draft } from '../draft.ts';
import { abilityOf, fireEvent, pop, push, pushKo, pushRemove, sourceInfo, top } from '../flow.ts';
import {
  addModifier,
  draw,
  leaveField,
  lifeToHand,
  markKnown,
  moveCard,
  payDon,
  rest,
  setActive,
} from '../ops/index.ts';
import { other, type DecisionState, type Duration, type Frame, type Got } from '../state.ts';
import { program, type Instr } from './compile.ts';
import {
  allHold,
  costIsSecret,
  hiddenPool,
  holds,
  matches,
  num,
  payable,
  pool,
  rel,
  reservedActive,
  type Ctx,
} from './eval.ts';

type EffectFrame = Extract<Frame, { f: 'effect' }>;
const WAIT = Symbol('wait');
type Out = 'next' | 'jump' | typeof WAIT | 'stop';

export function ctxOf(d: Draft, f: EffectFrame): Ctx {
  return { s: d.s, you: f.controller, self: f.card, b: f.b, did: f.did, live: true };
}

/** Push an effect frame for an ability (an activation, a pending auto, a payload). */
export function pushEffect(
  d: Draft,
  card: InstanceId,
  cardId: string,
  ab: Ability,
  controller: PlayerId,
  part: 'effect' | 'instead',
  opts: { start?: number; delayed?: boolean } = {},
): void {
  // An optional auto, an auto with a cost, or an Event whose activation cost is worded "you
  // may" (CR 8-3-1-4): ask first.
  const optionalAuto =
    part === 'effect' &&
    ((ab.kind === 'auto' && (ab.optional === true || (ab.cost?.length ?? 0) > 0)) ||
      optionalCost(ab));
  const f: EffectFrame = {
    f: 'effect',
    card,
    cardId,
    ability: ab.id,
    part,
    controller,
    ip: opts.start ?? 0,
    stage: optionalAuto && !opts.delayed ? 'ask' : 'run',
  };
  if (opts.delayed) f.delayed = true;
  push(d, f);
}

function take(f: EffectFrame): Got | undefined {
  const g = f.got;
  if (g !== undefined) delete f.got;
  return g;
}

function ask(
  d: Draft,
  f: EffectFrame,
  dec: Omit<DecisionState, 'purpose' | 'source'>,
): typeof WAIT {
  const ab = abilityOf(d.s, f.cardId, f.ability);
  d.s.decision = {
    ...dec,
    purpose: 'effect',
    source: sourceInfo(d.s, f.card, f.cardId, f.ability, ab?.label),
  };
  return WAIT;
}

const nameOf = (d: Draft, f: EffectFrame): string => d.s.defs[f.cardId]?.name ?? f.cardId;

export function runEffect(d: Draft, f: EffectFrame): void {
  const ab = abilityOf(d.s, f.cardId, f.ability);
  if (!ab) {
    pop(d);
    return;
  }
  d.ops++;
  if (f.stage === 'ask') {
    askUse(d, f, ab);
    return;
  }
  const prog = program(ab, f.part);
  if (f.ip === 0 && !f.delayed && f.ph === undefined && f.got === undefined && !f.did) {
    // Start of resolution: [Once Per Turn] is spent now (CR 10-2-13-1, E-D9); conditions are
    // checked again on resolution (CR 8-3-2-3, 8-4-1).
    if (f.part === 'effect' && ab.kind !== 'replacement' && ab.kind !== 'permanent') {
      if (ab.kind === 'auto' && !allHold(ctxOf(d, f), ab.conditions)) {
        pop(d);
        return;
      }
      if (ab.oncePerTurn) {
        const key = `${f.card}/${ab.id}`;
        if (d.s.oncePerTurn.includes(key)) {
          pop(d);
          return;
        }
        d.opt().push(key);
      }
    }
    f.did = [];
  }
  const ins = prog[f.ip];
  if (!ins) {
    pop(d);
    return;
  }
  const out = exec(d, f, ins, ab);
  if (out === 'next') {
    f.ip += 1;
    delete f.ph;
    delete f.tmp;
  } else if (out === 'stop') {
    pop(d);
  }
}

/** A cost in the card's words, for prompts (flows F8d): "DON!! −1", "trash 1 card from your hand". */
export function costText(costs: readonly Cost[] | undefined): string {
  const words = (costs ?? []).map((k) => {
    if ('donMinus' in k) return `DON!! −${k.donMinus}`;
    if ('returnDon' in k) return `return ${k.returnDon} DON!!`;
    if ('restDon' in k) return `rest ${String(k.restDon)} DON!!`;
    if ('trash' in k || 'reveal' in k) {
      const sel = 'trash' in k ? k.trash : k.reveal;
      const n = sel.pick && 'exactly' in sel.pick ? sel.pick.exactly : 1;
      const f = sel.filter;
      const what =
        f && 'typeIncludes' in f
          ? ` with a type including "${f.typeIncludes}"`
          : f && 'type' in f
            ? ` {${f.type}}`
            : '';
      return `${'trash' in k ? 'trash' : 'reveal'} ${n} card${n === 1 ? '' : 's'}${what} from your hand`;
    }
    if ('restSelf' in k) return 'rest this card';
    if ('trashSelf' in k) return 'trash this card';
    return '';
  });
  return words.filter(Boolean).join(' and ');
}

/** An optional auto, or an auto with a cost (CR 8-1-2, 8-3-1-4): ask before anything else. */
function askUse(d: Draft, f: EffectFrame, ab: Ability): void {
  const g = take(f);
  if (g !== undefined) {
    if (g === true) {
      f.stage = 'run';
    } else {
      d.emit({ type: 'EffectDeclined', instance: f.card, card: f.cardId, ability: f.ability });
      pop(d);
    }
    return;
  }
  const costs = ab.kind === 'auto' || ab.kind === 'activate' ? ab.cost : undefined;
  const ok = payable(ctxOf(d, f), costs);
  const secret = costIsSecret(costs);
  // A cost that cannot be paid on public information: nothing happens. If payability depends on
  // the hand, ask anyway (with "use" unavailable) so the opponent learns nothing (ADR 0005). An
  // Event's optional cost is always asked, so playing it for no effect is visible (B-1).
  const eventCost = ab.kind === 'activate';
  if (!ok && !secret && !eventCost) {
    pop(d);
    return;
  }
  const dec: Omit<DecisionState, 'purpose' | 'source'> = {
    kind: 'optional',
    player: f.controller,
    prompt: `${nameOf(d, f)}: ${costText(costs) ? `pay ${costText(costs)} to ` : ''}use this effect${ab.label ? ` (${ab.label})` : ''}?${ok ? '' : " You can't pay its cost."}`,
    role: 'use',
  };
  if (!ok) dec.noAccept = true;
  if (secret) dec.secret = true;
  ask(d, f, dec);
}

function exec(d: Draft, f: EffectFrame, ins: Instr, ab: Ability): Out {
  switch (ins.k) {
    case 'pay': {
      const costs = (
        f.part === 'instead' && ab.kind === 'replacement'
          ? ab.instead
          : ab.kind !== 'permanent' && ab.kind !== 'replacement'
            ? (ab.cost ?? [])
            : []
      ) as Cost[];
      const idx = costs.indexOf(ins.cost);
      return payCost(d, f, ins.cost, reservedActive(costs, idx + 1));
    }
    case 'paid':
      return 'next';
    case 'op':
      runInternal(d, f, ins.a);
      return 'next';
    case 'do':
      return action(d, f, ins.a);
    case 'jf':
      if (holds(ctxOf(d, f), ins.c)) return 'next';
      f.ip = ins.to;
      return 'jump';
    case 'jmp':
      f.ip = ins.to;
      return 'jump';
    case 'may': {
      const g = take(f);
      if (g === undefined)
        return ask(d, f, {
          kind: 'optional',
          player: f.controller,
          prompt: `${nameOf(d, f)}: ${ins.prompt ?? 'do this?'}`,
          role: 'use',
        });
      if (g === true) {
        f.did = [...(f.did ?? []), ins.label];
        return 'next';
      }
      f.ip = ins.to;
      return 'jump';
    }
    case 'mode': {
      const g = take(f);
      if (g === undefined) {
        const chooser = rel(ctxOf(d, f), ins.chooser);
        const options = ins.labels.map((label, i) => ({ id: String(i), label }));
        return ask(d, f, {
          kind: 'choose',
          player: chooser,
          prompt:
            chooser === f.controller
              ? `${nameOf(d, f)}: choose one.`
              : `Your opponent's ${nameOf(d, f)}: you choose one.`,
          min: 1,
          max: 1,
          candidates: options.map((o) => ({ option: o.id }) as never),
          picked: [],
          role: 'mode',
          options,
        });
      }
      const i = Number((Array.isArray(g) && (g[0] as { option: string }).option) || 0);
      d.emit({
        type: 'ModeChosen',
        instance: f.card,
        card: f.cardId,
        mode: i,
        // Both players see this event: the neutral wording, not the chooser's (M4a-11).
        label: ins.neutral?.[i] ?? ins.labels[i],
        player: rel(ctxOf(d, f), ins.chooser),
      });
      f.ip = ins.to[i]!;
      return 'jump';
    }
    case 'delay':
      d.s.delayed = [
        ...d.s.delayed,
        {
          turn: d.s.turn,
          card: f.card,
          key: d.s.cards[f.card]?.key ?? '',
          cardId: f.cardId,
          ability: f.ability,
          controller: f.controller,
          start: f.ip + 1,
        },
      ];
      f.ip = ins.to;
      return 'jump';
    case 'end':
      return 'stop';
  }
}

// ---------------------------------------------------------------------------------------------
// Selecting cards (effect-dsl §4.4, §4.11)
// ---------------------------------------------------------------------------------------------

interface SelectOpts {
  role: 'cost' | 'target';
  verb: string;
  /** Extra restriction the engine owns (a play from hand can only play Characters and Stages). */
  restrict?: (id: InstanceId) => boolean;
}

/**
 * The cards a selector picks. With a `pick`, the chooser is asked (one pick at a time, then
 * `done`); the answer arrives in `got`. Picks from a secret area are always asked, even with no
 * match, so the opponent cannot tell (CR 8-4-4-2, ADR 0005).
 */
function select(
  d: Draft,
  f: EffectFrame,
  sel: Selector,
  o: SelectOpts,
): InstanceId[] | typeof WAIT {
  const c = ctxOf(d, f);
  const g = take(f);
  if (Array.isArray(g))
    return bind(
      f,
      sel,
      g.filter((x): x is InstanceId => typeof x === 'string'),
    );
  let cands = pool(c, sel);
  if (o.restrict) cands = cands.filter(o.restrict);
  if (!sel.pick) return bind(f, sel, cands);
  const pk = sel.pick;
  const exact = 'exactly' in pk;
  const n = 'exactly' in pk ? pk.exactly : 'upTo' in pk ? pk.upTo : cands.length;
  const chooser = rel(c, sel.chooser ?? 'you');
  if (sel.blind) {
    // Chosen face-down (QA-OP17 OP17-075): uniformly at random with the seeded RNG.
    const left = cands.slice();
    const out: InstanceId[] = [];
    while (out.length < n && left.length) out.push(left.splice(d.rand(left.length), 1)[0]!);
    return bind(f, sel, out);
  }
  const secret = hiddenPool(sel);
  if (!secret) {
    if (cands.length === 0) return bind(f, sel, []);
    if (exact && cands.length <= n) return bind(f, sel, cands);
  }
  const max = Math.min(n, cands.length);
  const dec: Omit<DecisionState, 'purpose' | 'source'> = {
    kind: 'choose',
    player: chooser,
    prompt: `${nameOf(d, f)}: ${o.verb} ${exact ? max : `up to ${n}`} ${describe(sel, chooser === f.controller)}.`,
    min: exact ? max : 0,
    max,
    candidates: cands,
    picked: [],
    role: o.role,
  };
  if (secret) dec.secret = true;
  const zones = Array.isArray(sel.from) ? sel.from : [sel.from];
  if (secret && !sel.filter && zones.length === 1 && zones[0] === 'hand' && !o.restrict)
    dec.publicCount = true;
  if ('upTo' in pk && (pk.totalCost || pk.distinctNames)) {
    dec.limits = { costs: cands.map((id) => d.s.defs[d.s.cards[id]!.card]!.cost ?? 0) };
    if (pk.totalCost && 'lte' in pk.totalCost) dec.limits.total = num(c, pk.totalCost.lte);
    if (pk.distinctNames) dec.limits.names = cands.map((id) => d.s.defs[d.s.cards[id]!.card]!.name);
  }
  return ask(d, f, dec);
}

function bind(f: EffectFrame, sel: Selector, ids: InstanceId[]): InstanceId[] {
  if (sel.bind) f.b = { ...f.b, [sel.bind]: ids };
  return ids;
}

function describe(sel: Selector, mine: boolean): string {
  const zones = Array.isArray(sel.from) ? sel.from : [sel.from];
  const whose =
    sel.owner === 'any' ? '' : (sel.owner === 'you') === mine ? 'your ' : "your opponent's ";
  const words: Record<string, string> = {
    leader: 'Leader',
    characters: 'Characters',
    stage: 'Stage',
    field: 'cards on the field',
    hand: 'cards in hand',
    trash: 'cards in trash',
    deckTop: 'top card of the deck',
    self: 'this card',
  };
  return `of ${whose}${zones.map((z) => words[z] ?? z).join(' or ')}`.replace(
    'of your this',
    'of this',
  );
}

// ---------------------------------------------------------------------------------------------
// Costs (CR 8-3-1)
// ---------------------------------------------------------------------------------------------

function payCost(d: Draft, f: EffectFrame, k: Cost, reserve: number): Out {
  const c = ctxOf(d, f);
  if ('donMinus' in k) return returnDon(d, f, k.donMinus, reserve, 'cost');
  if ('returnDon' in k) return returnDon(d, f, k.returnDon, reserve, 'cost');
  if ('restDon' in k) {
    const n = k.restDon === 'any' ? 0 : k.restDon;
    if (d.ro(f.controller).donActive < n) return anomaly(d, f, 'restDon');
    payDon(d, f.controller, n);
    return 'next';
  }
  if ('trash' in k) {
    const ids = select(d, f, k.trash, { role: 'cost', verb: 'trash' });
    if (ids === WAIT) return WAIT;
    for (const id of ids) moveCard(d, id, 'trash', { revealed: true, extra: { reason: 'cost' } });
    return 'next';
  }
  if ('reveal' in k) {
    const ids = select(d, f, k.reveal, { role: 'cost', verb: 'reveal' });
    if (ids === WAIT) return WAIT;
    for (const id of ids)
      d.emit({
        type: 'CardRevealed',
        instance: id,
        card: d.card(id).card,
        player: f.controller,
        reason: 'cost',
      });
    return 'next';
  }
  if ('restSelf' in k) {
    if (!d.s.cards[f.card]) return anomaly(d, f, 'restSelf');
    rest(d, f.card, 'cost');
    return 'next';
  }
  if ('trashSelf' in k) {
    const me = d.s.cards[f.card];
    if (!me || (me.zone !== 'characters' && me.zone !== 'stage')) return anomaly(d, f, 'trashSelf');
    leaveField(d, f.card, 'trash', { kind: 'cost', by: f.controller });
    return 'next';
  }
  void c;
  return anomaly(d, f, Object.keys(k)[0] ?? 'cost');
}

/** CR 8-3-1-3-1: a cost that cannot be paid in full: the effect does not resolve. */
function anomaly(d: Draft, f: EffectFrame, what: string): Out {
  d.emit({ type: 'Anomaly', what: `cost ${what} could not be paid`, card: f.cardId });
  return 'stop';
}

/**
 * Return `n` DON!! from the controller's field to the DON!! deck, chosen by location class (E-D4).
 * `reserve` active cost-area DON!! stay for later costs (the lookahead of E-D6). When only one
 * class can supply them, or every DON!! must go, nothing is asked.
 */
function returnDon(
  d: Draft,
  f: EffectFrame,
  n: number,
  reserve: number,
  role: 'cost' | 'target',
): Out {
  if (n <= 0) return 'next';
  const p = f.controller;
  const g = take(f);
  let picks: DonClass[];
  if (Array.isArray(g)) {
    picks = g as DonClass[];
  } else {
    const ps = d.ro(p);
    const classes: DonClass[] = [];
    const counts: number[] = [];
    const add = (cl: DonClass, k: number) => {
      if (k > 0) {
        classes.push(cl);
        counts.push(k);
      }
    };
    add({ from: 'costActive' }, ps.donActive - reserve);
    add({ from: 'costRested' }, ps.donRested);
    for (const id of [ps.leader, ...ps.characters].slice().sort())
      add({ from: 'given', card: id }, d.card(id).don);
    const total = counts.reduce((a, b) => a + b, 0);
    if (total < n) return anomaly(d, f, 'DON!! −');
    if (classes.length === 1 || total === n) {
      picks = [];
      classes.forEach((cl, i) => {
        for (let j = 0; j < counts[i]! && picks.length < n; j++) picks.push(cl);
      });
    } else {
      return ask(d, f, {
        kind: 'choose',
        player: p,
        prompt: `${nameOf(d, f)}: choose ${n} DON!! to return to your DON!! deck.`,
        min: n,
        max: n,
        candidates: classes,
        counts,
        picked: [],
        role,
      });
    }
  }
  const ps = d.pl(p);
  for (const cl of picks) {
    if (cl.from === 'costActive') ps.donActive -= 1;
    else if (cl.from === 'costRested') ps.donRested -= 1;
    else d.wcard(cl.card).don -= 1;
  }
  ps.donDeck += picks.length;
  d.emit({ type: 'DonReturned', player: p, count: picks.length, to: 'donDeck' });
  // "When a DON!! card on your field is returned to your DON!! deck" (OP17-062).
  fireEvent(d, p, (w) => typeof w === 'object' && w.event === 'donReturned', 'donReturned');
  return 'next';
}

// ---------------------------------------------------------------------------------------------
// Actions (effect-dsl §4.6)
// ---------------------------------------------------------------------------------------------

function duration(d: Draft, f: EffectFrame, du: DslDuration): Duration {
  switch (du) {
    case 'battle':
      return { kind: 'battle' };
    case 'thisTurn':
      return { kind: 'thisTurn', turn: d.s.turn };
    case 'untilEndOfOpponentsNextTurn':
      return { kind: 'untilEndOfOpponentsNextEndPhase', player: f.controller, after: d.s.turn };
    case 'untilStartOfYourNextTurn':
      return { kind: 'untilStartOfNextTurn', player: f.controller };
  }
}

const FIELD = new Set(['leader', 'characters', 'stage']);

function action(d: Draft, f: EffectFrame, a: EffectAction): Out {
  const c = ctxOf(d, f);
  const you = f.controller;
  if ('draw' in a) {
    if (a.upTo) return unsupported(d, f, 'draw up to');
    draw(d, rel(c, a.player ?? 'you'), num(c, a.draw));
    return 'next';
  }
  if ('trashFromHand' in a) {
    const ids = select(d, f, a.trashFromHand, { role: 'target', verb: 'trash' });
    if (ids === WAIT) return WAIT;
    for (const id of ids) moveCard(d, id, 'trash', { revealed: true, extra: { reason: 'effect' } });
    return 'next';
  }
  if ('lookAtTop' in a) return lookAtTop(d, f, a.lookAtTop);
  if ('reveal' in a) {
    const top = d.ro(you).deck[0];
    if (top === undefined) {
      f.b = { ...f.b, [a.reveal.bind]: [] };
      return 'next';
    }
    // A fresh key: the reveal handle never links to an earlier sighting of this card.
    d.wcard(top).key = d.newKey();
    d.emit({
      type: 'CardRevealed',
      instance: top,
      card: d.card(top).card,
      player: you,
      from: 'deck',
      reason: 'effect',
    });
    markKnown(d, top, ['p1', 'p2']);
    f.b = { ...f.b, [a.reveal.bind]: [top] };
    return 'next';
  }
  if ('move' in a) return move(d, f, a.move.what, a.move.to);
  if ('play' in a) {
    if (a.play.rested) return unsupported(d, f, 'play rested');
    const ids = select(d, f, a.play.what, {
      role: 'target',
      verb: 'play',
      // Only Characters and Stages are played; Events are activated (CR 2-7-3).
      restrict: (id) => {
        const cat = d.s.defs[d.card(id).card]!.category;
        return cat === 'Character' || cat === 'Stage';
      },
    });
    if (ids === WAIT) return WAIT;
    // Several cards played by one effect: their [On Play]s activate as one event, so the
    // player orders them (M4a-04), whatever order the cards are placed in.
    const batch = ids.length > 1 ? d.s.nextMod++ : undefined;
    for (const id of ids.slice().reverse()) {
      const pf: Frame = { f: 'play', card: id, player: you, step: 'pay', free: true };
      if (batch !== undefined) pf.batch = batch;
      push(d, pf);
    }
    return 'next';
  }
  if ('ko' in a) {
    const ids = select(d, f, a.ko, { role: 'target', verb: 'K.O.' });
    if (ids === WAIT) return WAIT;
    for (const id of ids.slice().reverse()) pushKo(d, id, { kind: 'effect', by: you });
    return 'next';
  }
  if ('rest' in a) {
    const ids = select(d, f, a.rest, { role: 'target', verb: 'rest' });
    if (ids === WAIT) return WAIT;
    for (const id of ids) if (FIELD.has(d.card(id).zone)) rest(d, id, 'effect');
    return 'next';
  }
  if ('setActive' in a) {
    const sel = a.setActive;
    const zones = Array.isArray(sel.from) ? sel.from : [sel.from];
    if (zones.includes('donCostArea')) {
      // DON!! are interchangeable within a class (E-D4): "set up to N active" sets as many as it can.
      const p = rel(c, sel.owner === 'opponent' ? 'opponent' : 'you');
      const want =
        sel.pick && 'upTo' in sel.pick
          ? sel.pick.upTo
          : sel.pick && 'exactly' in sel.pick
            ? sel.pick.exactly
            : 99;
      const k = Math.min(want, d.ro(p).donRested);
      if (k > 0) {
        const ps = d.pl(p);
        ps.donRested -= k;
        ps.donActive += k;
        d.emit({ type: 'SetActive', player: p, don: k });
      }
      return 'next';
    }
    const ids = select(d, f, sel, { role: 'target', verb: 'set active' });
    if (ids === WAIT) return WAIT;
    for (const id of ids) setActive(d, id);
    return 'next';
  }
  if ('power' in a || 'setBasePower' in a || 'grant' in a || 'negate' in a || 'restrict' in a) {
    const spec =
      'power' in a
        ? a.power
        : 'setBasePower' in a
          ? a.setBasePower
          : 'grant' in a
            ? a.grant
            : 'negate' in a
              ? a.negate
              : a.restrict;
    if (typeof spec.target === 'string') return unsupported(d, f, 'restriction on a player');
    const ids = select(d, f, spec.target, { role: 'target', verb: 'choose' });
    if (ids === WAIT) return WAIT;
    const du = duration(d, f, spec.duration);
    for (const id of ids) {
      if (!FIELD.has(d.card(id).zone)) continue;
      const base = { target: id, duration: du, controller: you, source: f.card };
      if ('power' in a) addModifier(d, { ...base, kind: 'power', amount: num(c, a.power.amount) });
      else if ('setBasePower' in a)
        addModifier(d, { ...base, kind: 'basePower', amount: num(c, a.setBasePower.value) });
      else if ('grant' in a)
        addModifier(d, { ...base, kind: 'grant', amount: 0, keyword: a.grant.keyword });
      else if ('negate' in a) addModifier(d, { ...base, kind: 'negate', amount: 0 });
      else addModifier(d, { ...base, kind: 'cannotAttack', amount: 0 });
    }
    return 'next';
  }
  if ('addDon' in a) {
    // "Add up to N": as many as the DON!! deck holds (DECISIONS M4a: adding fewer is never asked).
    const ps = d.pl(you);
    for (const part of a.addDon) {
      const k = Math.min(part.n, ps.donDeck);
      if (k <= 0) continue;
      ps.donDeck -= k;
      if (part.state === 'active') ps.donActive += k;
      else ps.donRested += k;
      d.emit({
        type: 'DonPlaced',
        player: you,
        count: k,
        rested: part.state === 'rested',
        by: 'effect',
      });
    }
    return 'next';
  }
  if ('returnDon' in a) {
    const n =
      a.returnDon.n === 'toMatchOpponent'
        ? Math.max(0, donField(d, you) - donField(d, other(you)))
        : num(c, a.returnDon.n);
    return returnDon(d, f, n, 0, 'target');
  }
  if ('activate' in a) {
    // "[Trigger] Activate this card's [Main] effect" (QA-OP03 OP03-074: its own costs are paid).
    const def = d.s.defs[f.cardId]!;
    const main = def.abilities.find((x) => hasTiming(x, 'main'));
    if (main && main.kind === 'activate' && payable(c, main.cost))
      pushEffect(d, f.card, f.cardId, main, you, 'effect');
    return 'next';
  }
  if ('select' in a) {
    const ids = select(d, f, a.select, { role: 'target', verb: 'choose' });
    return ids === WAIT ? WAIT : 'next';
  }
  return unsupported(d, f, `action ${Object.keys(a)[0]}`);
}

/**
 * A shape the runtime does not implement: `validateScript` rejects these, so reaching one is a
 * bug. It emits an `Anomaly` (the property tests fail on any) and skips the step (M4a-07).
 */
function unsupported(d: Draft, f: EffectFrame, what: string): Out {
  d.emit({ type: 'Anomaly', what: `not implemented: ${what}`, card: f.cardId });
  return 'next';
}

function donField(d: Draft, p: PlayerId): number {
  const ps = d.ro(p);
  let n = ps.donActive + ps.donRested;
  for (const id of [ps.leader, ...ps.characters]) n += d.card(id).don;
  return n;
}

function move(
  d: Draft,
  f: EffectFrame,
  what: Selector,
  to: { zone: string; position?: string; faceUp?: boolean },
): Out {
  const zones = Array.isArray(what.from) ? what.from : [what.from];
  const you = f.controller;
  if (zones.includes('deckTop') && (zones.length !== 1 || to.zone !== 'life'))
    return unsupported(d, f, `move from the deck top to ${to.zone}`);
  if (zones.length === 1 && zones[0] === 'deckTop') {
    // "Add up to 1 card from the top of your deck to the top of your Life cards."
    const g = take(f);
    const deck = d.ro(rel(ctxOf(d, f), what.owner === 'opponent' ? 'opponent' : 'you')).deck;
    if (deck.length === 0) return 'next';
    if (g === undefined)
      return ask(d, f, {
        kind: 'optional',
        player: you,
        prompt: `${nameOf(d, f)}: add the top card of your deck to the top of your Life cards?`,
        role: 'use',
      });
    if (g === true)
      moveCard(d, deck[0]!, 'life', {
        position: 'top',
        faceUp: to.faceUp ?? false,
        extra: { reason: 'effect' },
      });
    return 'next';
  }
  const ids = select(d, f, what, {
    role: 'target',
    verb: to.zone === 'hand' ? 'return' : 'choose',
  });
  if (ids === WAIT) return WAIT;
  if (zones.every((z) => z === 'trash' || z === 'hand')) {
    for (const id of ids)
      moveCard(d, id, to.zone as 'hand', {
        revealed: true,
        // The declared deck position is honoured (M4a-07); hand and trash take the default.
        position: to.zone === 'deck' ? (to.position === 'bottom' ? 'bottom' : 'top') : undefined,
        extra: { reason: 'effect' },
      });
    return 'next';
  }
  if (!zones.every((z) => z === 'characters' || z === 'stage') || to.zone === 'life')
    return unsupported(d, f, `move from ${zones.join('/')} to ${to.zone}`);
  const dest = to.zone as 'hand' | 'deck' | 'trash';
  for (const id of ids.slice().reverse()) {
    if (!FIELD.has(d.card(id).zone)) continue;
    pushRemove(
      d,
      id,
      dest,
      { kind: 'effect', by: you },
      dest === 'deck' ? (to.position === 'top' ? 'top' : 'bottom') : undefined,
    );
  }
  return 'next';
}

/**
 * "Look at N cards from the top of your deck; reveal up to K … and add them to your hand. Then,
 * place the rest at the bottom of your deck in any order." The looked-at cards stay in the deck and
 * are visible to the controller only (`frame.look`, CR 11-3-1).
 */
function lookAtTop(
  d: Draft,
  f: EffectFrame,
  spec: Extract<EffectAction, { lookAtTop: unknown }>['lookAtTop'],
): Out {
  const c = ctxOf(d, f);
  const owner = rel(c, spec.player ?? 'you');
  if (f.ph === undefined) {
    const look = d.ro(owner).deck.slice(0, spec.n);
    f.look = look;
    f.ph = 1;
    f.tmp = { take: 0 };
    d.emit({ type: 'CardsLooked', player: f.controller, owner, count: look.length });
  }
  let look = f.look ?? [];
  const tmp = { ...(f.tmp ?? {}) };
  while ((tmp.take ?? 0) < spec.take.length) {
    const tk = spec.take[tmp.take ?? 0]!;
    const g = take(f);
    if (Array.isArray(g)) {
      for (const id of g as InstanceId[]) {
        if (tk.reveal)
          d.emit({
            type: 'CardRevealed',
            instance: id,
            card: d.card(id).card,
            player: f.controller,
            reason: 'search',
          });
        moveCard(d, id, 'hand', { revealed: tk.reveal === true, extra: { reason: 'search' } });
      }
      look = look.filter((id) => !(g as InstanceId[]).includes(id));
      f.look = look;
      tmp.take = (tmp.take ?? 0) + 1;
      f.tmp = tmp;
      continue;
    }
    const cands = look.filter((id) => !tk.filter || matches(c, id, tk.filter)).sort();
    const n = 'upTo' in tk.pick ? tk.pick.upTo : 'exactly' in tk.pick ? tk.pick.exactly : 1;
    f.tmp = tmp;
    return ask(d, f, {
      kind: 'choose',
      player: f.controller,
      prompt: `${nameOf(d, f)}: choose up to ${n} of the cards you are looking at to add to your hand.`,
      min: 0,
      max: Math.min(n, cands.length),
      candidates: cands,
      picked: [],
      role: 'target',
      secret: true,
    });
  }
  // The rest: optionally top or bottom (OP17-050: all together, QA-OP17), in an order chosen.
  if (spec.rest === 'topOrBottomAnyOrder' && tmp.top === undefined && look.length > 0) {
    const g = take(f);
    if (!Array.isArray(g)) {
      f.tmp = tmp;
      return ask(d, f, {
        kind: 'choose',
        player: f.controller,
        prompt: `${nameOf(d, f)}: place the ${look.length} cards at the top or the bottom of your deck?`,
        min: 1,
        max: 1,
        candidates: [{ option: 'top' }, { option: 'bottom' }] as never,
        picked: [],
        role: 'mode',
        options: [
          { id: 'top', label: 'Top of the deck' },
          { id: 'bottom', label: 'Bottom of the deck' },
        ],
      });
    }
    tmp.top = (g[0] as { option: string }).option === 'top';
  }
  const order = [...(tmp.order ?? [])];
  const g = take(f);
  if (typeof g === 'string') order.push(g);
  const left = look.filter((id) => !order.includes(id));
  if (left.length >= 2) {
    tmp.order = order;
    f.tmp = tmp;
    const top = tmp.top === true;
    return ask(d, f, {
      kind: 'order',
      player: f.controller,
      prompt: top
        ? `${nameOf(d, f)}: choose the next card from the top of your deck.`
        : `${nameOf(d, f)}: choose the next card to place at the bottom of your deck (it ends up above the ones after it).`,
      candidates: left.slice().sort(),
      role: 'order',
      options: left
        .slice()
        .sort()
        .map((id) => ({ id, label: d.s.defs[d.card(id).card]!.name })),
    });
  }
  order.push(...left);
  if (tmp.top === true) {
    for (const id of order.slice().reverse())
      moveCard(d, id, 'deck', { position: 'top', extra: { reason: 'look' } });
  } else {
    for (const id of order)
      moveCard(d, id, 'deck', { position: 'bottom', extra: { reason: 'look' } });
  }
  if (owner === f.controller) markKnown(d, order, [f.controller]);
  delete f.look;
  return 'next';
}

function runInternal(d: Draft, f: EffectFrame, st: InternalStep): void {
  const you = f.controller;
  switch (st.op) {
    case 'emit':
      d.emit({ type: 'EffectResolved', label: st.label, instance: f.card, player: you });
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
      if (d.s.cards[f.card]) setActive(d, f.card);
      return;
  }
}

/** Route a decision's answer to the effect frame waiting on it. */
export function answerEffect(d: Draft, got: Got): void {
  const f = top(d);
  if (!f || f.f !== 'effect') throw new Error('No effect is waiting for a decision');
  f.got = got;
}
