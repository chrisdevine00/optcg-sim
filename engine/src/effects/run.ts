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
import type { Dest, Restriction } from '@optcg/cards';
import { other, type DecisionState, type Duration, type Frame, type Got } from '../state.ts';
import { restBlocked } from '../derive.ts';
import { program, type Instr } from './compile.ts';
import { restrictionMod } from './layers.ts';
import {
  allHold,
  cannotDrawByEffect,
  costIsSecret,
  dvOf,
  hiddenPool,
  holds,
  matches,
  num,
  payable,
  playBlocked,
  pool,
  rel,
  reservedActive,
  type Ctx,
} from './eval.ts';

type EffectFrame = Extract<Frame, { f: 'effect' }>;
const WAIT = Symbol('wait');
type Out = 'next' | 'jump' | typeof WAIT | 'stop';

export function ctxOf(d: Draft, f: EffectFrame): Ctx {
  return { s: d.s, you: f.controller, self: f.card, b: f.b, did: f.did, n: f.n, live: true };
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
    delete f.acted;
  } else if (out === 'stop') {
    pop(d);
  }
}

/** A cost in the card's words, for prompts (flows F8d): "DON!! −1", "trash 1 card from your hand". */
export function costText(costs: readonly Cost[] | undefined): string {
  const words = (costs ?? []).map((k) => {
    if ('donMinus' in k) return `DON!! −${k.donMinus}`;
    if ('returnDon' in k)
      return typeof k.returnDon === 'number'
        ? `return ${k.returnDon} DON!!`
        : `return ${k.returnDon.n} active DON!!`;
    if ('giveDon' in k) return `give ${k.giveDon.n} active DON!!`;
    if ('ko' in k) return 'K.O. 1 of your Characters';
    if ('turnLifeFaceDown' in k) return `turn ${k.turnLifeFaceDown} of your Life cards face-down`;
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
      if ('trash' in k && !hiddenPool(sel)) return `trash ${n} of your Characters${what}`;
      return `${'trash' in k ? 'trash' : 'reveal'} ${n} card${n === 1 ? '' : 's'}${what} from your hand`;
    }
    if ('restSelf' in k) return 'rest this card';
    if ('trashSelf' in k) return 'trash this card';
    if ('lifeToHand' in k) return `add ${k.lifeToHand.n} of your Life cards to your hand`;
    if ('turnLifeFaceUp' in k) return `turn ${k.turnLifeFaceUp} of your Life cards face-up`;
    if ('mill' in k) return `trash ${k.mill} cards from the top of your deck`;
    if ('rest' in k) {
      const n = k.rest.pick && 'exactly' in k.rest.pick ? k.rest.pick.exactly : 1;
      return `rest ${n} of your cards`;
    }
    if ('move' in k) return 'move cards';
    if ('oneOf' in k) return k.oneOf.map((a) => costText(a)).join(' or ');
    return '';
  });
  return words.filter(Boolean).join(' and ');
}

/** One alternative of an "A or B" cost, in words: the costs of the list that differ from the others. */
function altText(list: readonly Cost[], ab: Ability): string {
  const all = ab.kind === 'auto' || ab.kind === 'activate' || ab.kind === 'trigger' ? ab.cost : [];
  const common = (all ?? []).filter((k) => !('oneOf' in k));
  return costText(list.filter((k) => !common.includes(k)));
}

/** An optional auto, or an auto with a cost (CR 8-1-2, 8-3-1-4): ask before anything else. */
function askUse(d: Draft, f: EffectFrame, ab: Ability): void {
  const g = take(f);
  if (g !== undefined) {
    if (g === true) {
      f.stage = 'run';
    } else {
      d.emit({
        type: 'EffectDeclined',
        player: f.controller,
        instance: f.card,
        card: f.cardId,
        ability: f.ability,
      });
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
      // An alternative's payments carry their own straight list (G19).
      if (ins.list) return payCost(d, f, ins.cost, reservedActive(ins.list, (ins.at ?? 0) + 1));
      const idx = costs.indexOf(ins.cost);
      return payCost(d, f, ins.cost, reservedActive(costs, idx + 1));
    }
    case 'alt': {
      // "A or B" (G19): the alternatives that can be paid now; one is taken without asking.
      const c = ctxOf(d, f);
      const ok = ins.alts.map((_, i) => i).filter((i) => payable(c, ins.alts[i]));
      if (ok.length === 0) {
        d.emit({
          type: 'EffectDeclined',
          player: f.controller,
          instance: f.card,
          card: f.cardId,
          ability: f.ability,
          reason: 'costNotPaid',
        });
        return 'stop';
      }
      let pick = ok[0]!;
      if (ok.length > 1) {
        const g = take(f);
        if (g === undefined || !Array.isArray(g)) {
          const options = ok.map((i) => ({
            id: String(i),
            label: altText(ins.alts[i]!, ab),
          }));
          return ask(d, f, {
            kind: 'choose',
            player: f.controller,
            prompt: `${nameOf(d, f)}: choose how to pay.`,
            min: 1,
            max: 1,
            candidates: options.map((o) => ({ option: o.id }) as never),
            picked: [],
            role: 'mode',
            options,
          });
        }
        pick = Number((g[0] as { option: string }).option);
      }
      f.ip = ins.to[pick]!;
      return 'jump';
    }
    case 'paid':
      return 'next';
    case 'op':
      runInternal(d, f, ins.a);
      return 'next';
    case 'do': {
      const out = action(d, f, ins.a);
      // "If you do" after an action (not a "you may"): the action did something (OP08-098).
      if (out === 'next' && ins.label && f.acted) f.did = [...(f.did ?? []), ins.label];
      return out;
    }
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
    case 'fe': {
      const count = num(ctxOf(d, f), ins.n);
      if (count <= 0) {
        f.ip = ins.to;
        return 'jump';
      }
      f.loops = [...(f.loops ?? []), { start: f.ip + 1, left: count }];
      return 'next';
    }
    case 'feEnd': {
      const loops = [...(f.loops ?? [])];
      const lp = loops[loops.length - 1];
      if (!lp) return 'next';
      if (lp.left > 1) {
        loops[loops.length - 1] = { start: lp.start, left: lp.left - 1 };
        f.loops = loops;
        f.ip = ins.start;
        delete f.ph;
        delete f.tmp;
        return 'jump';
      }
      loops.pop();
      if (loops.length) f.loops = loops;
      else delete f.loops;
      return 'next';
    }
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
  } else if (cands.length === 0 && !sel.filter && !o.restrict) {
    // The whole zone is empty, and a hand or deck size is public: no decision to hide (effect-dsl
    // 4.11: "with 0 candidates there is no decision"). With a filter an empty result stays asked,
    // so the opponent cannot tell a hand with no match from one with a match (CR 8-4-4-2).
    return bind(f, sel, []);
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
    // "Total cost" is the current cost (CR 2-7-6): +12 cost cards are far over any budget.
    dec.limits = { costs: cands.map((id) => dvOf(c, id).cost ?? 0) };
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
    donCostArea: 'DON!! cards',
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
  if ('returnDon' in k) {
    // The object form returns active cost-area DON!! only (G9).
    if (typeof k.returnDon !== 'number')
      return returnDon(d, f, k.returnDon.n, reserve, 'cost', true);
    return returnDon(d, f, k.returnDon, reserve, 'cost');
  }
  if ('restDon' in k) {
    const n = k.restDon === 'any' ? 0 : k.restDon;
    if (d.ro(f.controller).donActive < n) return anomaly(d, f, 'restDon');
    payDon(d, f.controller, n);
    return 'next';
  }
  if ('giveDon' in k) {
    // "Give N active DON!! cards to your Leader or 1 of your Characters" (G7): the DON!! leave the
    // cost area for the card and return at the next Refresh Phase like any given DON!! (CR 6-2-3).
    const g = k.giveDon;
    if (d.ro(f.controller).donActive - reserve < g.n) return anomaly(d, f, 'giveDon');
    const ids = select(d, f, g.to, { role: 'cost', verb: 'give DON!! to' });
    if (ids === WAIT) return WAIT;
    const id = ids[0];
    if (id === undefined) return anomaly(d, f, 'giveDon');
    d.pl(f.controller).donActive -= g.n;
    d.wcard(id).don += g.n;
    d.emit({
      type: 'DonGiven',
      player: f.controller,
      target: id,
      card: d.card(id).card,
      count: g.n,
      rested: false,
      by: 'cost',
    });
    return 'next';
  }
  if ('trash' in k) {
    if (!hiddenPool(k.trash)) return fieldCost(d, f, k.trash, { remove: 'trash' });
    const ids = select(d, f, k.trash, { role: 'cost', verb: 'trash' });
    if (ids === WAIT) return WAIT;
    for (const id of ids) moveCard(d, id, 'trash', { revealed: true, extra: { reason: 'cost' } });
    return 'next';
  }
  if ('ko' in k) return fieldCost(d, f, k.ko, { ko: true });
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
  if ('lifeToHand' in k) return lifeToHandCost(d, f, k.lifeToHand);
  if ('turnLifeFaceUp' in k) {
    for (let i = 0; i < k.turnLifeFaceUp; i++) {
      const top = d.ro(f.controller).life[i];
      if (top === undefined || d.card(top).faceUp) return anomaly(d, f, 'turnLifeFaceUp');
      turnFaceUp(d, top, f.controller);
    }
    return 'next';
  }
  if ('turnLifeFaceDown' in k) {
    // The top N Life cards, all face-up, go face-down (G8). A fresh key: the card is hidden again,
    // and nothing the viewers saw while it was face-up links to it (CR 3-2-6-1 areas).
    const ids = d.ro(f.controller).life.slice(0, k.turnLifeFaceDown);
    if (ids.length < k.turnLifeFaceDown || ids.some((id) => !d.card(id).faceUp))
      return anomaly(d, f, 'turnLifeFaceDown');
    for (const id of ids) {
      const w = d.wcard(id);
      w.faceUp = false;
      w.key = d.newKey();
    }
    d.emit({ type: 'LifeTurnedFaceDown', player: f.controller, count: ids.length });
    return 'next';
  }
  if ('mill' in k) {
    if (d.ro(f.controller).deck.length < k.mill) return anomaly(d, f, 'mill');
    for (let i = 0; i < k.mill; i++)
      moveCard(d, d.ro(f.controller).deck[0]!, 'trash', {
        revealed: true,
        extra: { reason: 'cost' },
      });
    return 'next';
  }
  if ('rest' in k) {
    const got = selectRest(d, f, k.rest, 'cost', reserve);
    if (got === WAIT) return WAIT;
    for (const id of got.ids) rest(d, id, 'cost');
    if (got.don > 0) payDon(d, f.controller, got.don);
    return 'next';
  }
  if ('move' in k) {
    // Your own Character or Stage to your hand, the deck or the trash (G1): a removal with the
    // cause `cost`, so replacements and last-known information see it.
    if (onFieldZones(k.move))
      return fieldCost(d, f, k.move, {
        remove: k.to.zone as 'hand' | 'deck' | 'trash',
        ...(k.to.zone === 'deck' ? { position: k.to.position === 'top' ? 'top' : 'bottom' } : {}),
      } as FieldCostHow);
    const bottom = k.to.zone === 'deck' && k.to.position === 'bottom';
    let ids: InstanceId[];
    if (bottom && f.tmp?.sel) {
      ids = f.tmp.sel; // already chosen; waiting for the owner's order
    } else {
      const picked = select(d, f, k.move, { role: 'cost', verb: 'move' });
      if (picked === WAIT) return WAIT;
      ids = picked;
    }
    if (bottom && ids.length > 1) return placeHandTrash(d, f, ids, k.to as Dest, 'cost');
    placeCards(d, ids, k.to, 'cost');
    return 'next';
  }
  void c;
  return anomaly(d, f, Object.keys(k)[0] ?? 'cost');
}

type FieldCostHow =
  { ko: true } | { remove: 'hand' | 'deck' | 'trash'; position?: 'top' | 'bottom' };

/** Does the selector read only Characters and Stage (a cost paid from the field)? */
function onFieldZones(sel: Selector): boolean {
  const zones = Array.isArray(sel.from) ? sel.from : [sel.from];
  return zones.every((z) => z === 'characters' || z === 'stage');
}

/** The `ph` marker of a field cost whose removal frames have been pushed (see `fieldCost`). */
const FIELD_COST_PUSHED = 90;

/**
 * A cost that takes one of your own Characters or Stage off the field: trash, return to hand, the
 * deck, or a K.O. (M6b wave 1 G1). Each card goes through a `ko` or `remove` frame with the cause
 * `cost`, so a K.O. cost fires [On K.O.], a removal watcher sees it, replacements and last-known
 * information apply, and its given DON!! return. The frames run before the paying ability resumes
 * on this same instruction, which then checks that every chosen card left the field: a card that
 * "cannot be K.O.'d by effects" or whose K.O. was replaced did not pay (RL-16, CR 8-3-1-3), so the
 * effect after the colon does not resolve. Earlier costs stay paid, as in the official ruling.
 */
function fieldCost(d: Draft, f: EffectFrame, sel: Selector, how: FieldCostHow): Out {
  if (f.ph === FIELD_COST_PUSHED) {
    const chosen = f.tmp?.sel ?? [];
    if (chosen.every((id) => !d.s.cards[id])) return 'next';
    d.emit({
      type: 'EffectDeclined',
      player: f.controller,
      instance: f.card,
      card: f.cardId,
      ability: f.ability,
      reason: 'costNotPaid',
    });
    return 'stop';
  }
  const ids = select(d, f, sel, { role: 'cost', verb: 'ko' in how ? 'K.O.' : 'move' });
  if (ids === WAIT) return WAIT;
  if (ids.length === 0) return anomaly(d, f, 'field cost');
  const group = ids.length > 1 ? d.s.nextMod++ : undefined;
  for (const id of ids.slice().reverse()) {
    const cause = { kind: 'cost', by: f.controller } as const;
    if ('ko' in how) pushKo(d, id, cause, group);
    else pushRemove(d, id, how.remove, cause, how.position, group);
  }
  f.ph = FIELD_COST_PUSHED;
  f.tmp = { ...f.tmp, sel: ids };
  return 'jump';
}

/** "Add N cards from the top (or top or bottom) of your Life cards to your hand" (CR 8-3-1; not damage). */
function lifeToHandCost(
  d: Draft,
  f: EffectFrame,
  spec: { from: 'top' | 'topOrBottom'; n: number },
): Out {
  const p = f.controller;
  let done = f.ph ?? 0;
  while (done < spec.n) {
    const life = d.ro(p).life;
    if (life.length === 0) return anomaly(d, f, 'lifeToHand');
    let bottom = false;
    if (spec.from === 'topOrBottom' && life.length > 1) {
      const g = take(f);
      if (!Array.isArray(g)) {
        f.ph = done;
        return ask(d, f, {
          kind: 'choose',
          player: p,
          prompt: `${nameOf(d, f)}: add the top or the bottom card of your Life cards to your hand?`,
          min: 1,
          max: 1,
          candidates: [{ option: 'top' }, { option: 'bottom' }] as never,
          picked: [],
          role: 'mode',
          options: [
            { id: 'top', label: 'Top Life card' },
            { id: 'bottom', label: 'Bottom Life card' },
          ],
        });
      }
      bottom = (g[0] as { option: string }).option === 'bottom';
    }
    moveCard(d, bottom ? life[life.length - 1]! : life[0]!, 'hand', { extra: { reason: 'life' } });
    done++;
  }
  return 'next';
}

/** Turn a face-down Life card face-up: now public, under a fresh handle (CR 3-2-6-1 areas). */
function turnFaceUp(d: Draft, id: InstanceId, player: PlayerId): void {
  const w = d.wcard(id);
  w.faceUp = true;
  w.key = d.newKey();
  d.emit({
    type: 'CardRevealed',
    instance: id,
    card: w.card,
    player,
    from: 'life',
    reason: 'faceUp',
  });
}

/** Put cards in a destination, in the order given (hand and trash take the default order). */
function placeCards(d: Draft, ids: InstanceId[], to: Dest, reason: string): void {
  for (const id of ids) {
    const opts: {
      revealed: boolean;
      extra: Record<string, unknown>;
      position?: 'top' | 'bottom';
      faceUp?: boolean;
    } = {
      revealed: to.zone !== 'life' && to.zone !== 'deck',
      extra: { reason },
    };
    if (to.zone === 'deck' || to.zone === 'life')
      opts.position = to.position === 'bottom' ? 'bottom' : 'top';
    if (to.zone === 'life') opts.faceUp = to.faceUp === true;
    moveCard(d, id, to.zone, opts);
  }
}

/**
 * A choice among cards and DON!! cards in the cost area ("Rest up to a total of 2 of your
 * opponent's Characters or DON!! cards", "rest 2 of your cards", "rest any number of your DON!!").
 * Only active cards can be rested (CR 1-3-2-1). DON!! are chosen by class, as in a DON!! cost (E-D4).
 * `reserve` active DON!! stay for later costs. Returns the cards and how many DON!! were picked.
 */
function selectRest(
  d: Draft,
  f: EffectFrame,
  sel: Selector,
  role: 'cost' | 'target',
  reserve = 0,
): { ids: InstanceId[]; don: number } | typeof WAIT {
  const c = ctxOf(d, f);
  const zones = Array.isArray(sel.from) ? sel.from : [sel.from];
  const withDon = zones.includes('donCostArea');
  const donOwner = rel(c, sel.owner === 'opponent' ? 'opponent' : 'you');
  const split = (picks: (InstanceId | DonClass | { option: string })[]) => {
    const ids = picks.filter((x): x is InstanceId => typeof x === 'string');
    const don = picks.length - ids.length;
    if (sel.bind) {
      f.b = { ...f.b, [sel.bind]: ids };
      f.n = { ...f.n, [sel.bind]: picks.length };
    }
    return { ids, don };
  };
  const g = take(f);
  if (Array.isArray(g)) return split(g);
  const cards = pool(c, { ...sel, from: zones.filter((z) => z !== 'donCostArea') as never }).filter(
    // A card that cannot be rested cannot pay a rest cost (rules-digest 57).
    (id) =>
      !d.card(id).rested &&
      (role !== 'cost' || !restBlocked(dvOf(c, id), d.card(id).owner, 'cost')),
  );
  const don = withDon
    ? Math.max(0, d.ro(donOwner).donActive - (donOwner === f.controller ? reserve : 0))
    : 0;
  const total = cards.length + don;
  const pk = sel.pick;
  const exact = !!pk && 'exactly' in pk;
  const want = !pk ? total : 'exactly' in pk ? pk.exactly : 'upTo' in pk ? pk.upTo : total;
  const max = Math.min(want, total);
  if (max === 0) return split([]);
  if (exact && total <= want) {
    return split([
      ...cards,
      ...Array.from({ length: don }, () => ({ from: 'costActive' }) as DonClass),
    ]);
  }
  const dec: Omit<DecisionState, 'purpose' | 'source'> = {
    kind: 'choose',
    player: rel(c, sel.chooser ?? 'you'),
    prompt: `${nameOf(d, f)}: rest ${exact ? max : `up to ${want}`} ${describe(sel, true)}.`,
    min: exact ? max : 0,
    max,
    candidates: [...cards, ...(don > 0 ? [{ from: 'costActive' } as DonClass] : [])],
    picked: [],
    role,
  };
  if (don > 0) dec.counts = [...cards.map(() => 1), don];
  return ask(d, f, dec);
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
  /** Only active cost-area DON!! may go ("return 2 of your active DON!! cards", G9). */
  activeOnly = false,
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
    if (!activeOnly) {
      add({ from: 'costRested' }, ps.donRested);
      for (const id of [ps.leader, ...ps.characters].slice().sort())
        add({ from: 'given', card: id }, d.card(id).don);
    }
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
    const who = rel(c, a.player ?? 'you');
    // "You cannot draw cards using your own effects" (OP12-099) stops a draw the player's effect
    // makes for themselves; a rule draw (the Draw Phase) is not an effect.
    if (who === you && cannotDrawByEffect(d.s, you)) return 'next';
    draw(d, who, num(c, a.draw));
    return 'next';
  }
  if ('mill' in a) {
    // "Trash N cards from the top of your (opponent's) deck" (G4): as many as the deck holds, face
    // up. The cards leave one at a time, so a deck emptied by it is a defeat at once (RL-26,
    // CR 9-1-2): milling does not wait for a later draw. The cost form needs all N (CR 8-3-1-3).
    const who = rel(c, a.mill.player);
    const k = Math.min(Math.max(0, num(c, a.mill.n)), d.ro(who).deck.length);
    for (let i = 0; i < k; i++)
      moveCard(d, d.ro(who).deck[0]!, 'trash', { revealed: true, extra: { reason: 'effect' } });
    if (k > 0) f.acted = true;
    return 'next';
  }
  if ('trashFromHand' in a) {
    const ids = select(d, f, a.trashFromHand, { role: 'target', verb: 'trash' });
    if (ids === WAIT) return WAIT;
    for (const id of ids) moveCard(d, id, 'trash', { revealed: true, extra: { reason: 'effect' } });
    if (ids.length) f.acted = true;
    return 'next';
  }
  if ('lookAtTop' in a) return lookAtTop(d, f, a.lookAtTop);
  if ('reveal' in a) {
    const fromLife = a.reveal.from === 'lifeTop';
    const top = fromLife ? d.ro(you).life[0] : d.ro(you).deck[0];
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
      from: fromLife ? 'life' : 'deck',
      reason: 'effect',
    });
    markKnown(d, top, ['p1', 'p2']);
    f.b = { ...f.b, [a.reveal.bind]: [top] };
    return 'next';
  }
  if ('move' in a) return move(d, f, a.move.what, a.move.to);
  if ('play' in a) {
    const ids = select(d, f, a.play.what, {
      role: 'target',
      verb: 'play',
      // Only Characters and Stages are played; Events are activated (CR 2-7-3). A card an effect
      // bars you from playing ("you cannot play Character cards with a base cost of 5 or more")
      // cannot be chosen.
      restrict: (id) => {
        const cat = d.s.defs[d.card(id).card]!.category;
        return (cat === 'Character' || cat === 'Stage') && !playBlocked(d.s, you, id);
      },
    });
    if (ids === WAIT) return WAIT;
    // Several cards played by one effect: their [On Play]s activate as one event, so the
    // player orders them (M4a-04), whatever order the cards are placed in.
    const batch = ids.length > 1 ? d.s.nextMod++ : undefined;
    if (ids.length) f.acted = true;
    for (const id of ids.slice().reverse()) {
      const pf: Frame = { f: 'play', card: id, player: you, step: 'pay', free: true };
      if (batch !== undefined) pf.batch = batch;
      if (a.play.rested) pf.rested = true;
      push(d, pf);
    }
    return 'next';
  }
  if ('ko' in a) {
    const ids = select(d, f, a.ko, { role: 'target', verb: 'K.O.' });
    if (ids === WAIT) return WAIT;
    const group = ids.length > 1 ? d.s.nextMod++ : undefined;
    if (ids.length) f.acted = true;
    for (const id of ids.slice().reverse()) pushKo(d, id, { kind: 'effect', by: you }, group);
    return 'next';
  }
  if ('rest' in a) {
    const zones = Array.isArray(a.rest.from) ? a.rest.from : [a.rest.from];
    if (zones.includes('donCostArea')) {
      // Cards and DON!! together; DON!! rest by class (E-D4). Only active DON!! can be rested.
      const got = selectRest(d, f, a.rest, 'target');
      if (got === WAIT) return WAIT;
      for (const id of got.ids) if (FIELD.has(d.card(id).zone)) rest(d, id, 'effect', you);
      if (got.don > 0) {
        const p = rel(c, a.rest.owner === 'opponent' ? 'opponent' : 'you');
        const k = Math.min(got.don, d.ro(p).donActive);
        if (k > 0) payDon(d, p, k);
      }
      return 'next';
    }
    const ids = select(d, f, a.rest, { role: 'target', verb: 'rest' });
    if (ids === WAIT) return WAIT;
    for (const id of ids)
      if (FIELD.has(d.card(id).zone) && rest(d, id, 'effect', you)) f.acted = true;
    return 'next';
  }
  if ('skipRefresh' in a) {
    const ids = select(d, f, a.skipRefresh, { role: 'target', verb: 'choose' });
    if (ids === WAIT) return WAIT;
    for (const id of ids) {
      if (!FIELD.has(d.card(id).zone)) continue;
      addModifier(d, {
        kind: 'skipRefresh',
        target: id,
        amount: 0,
        duration: { kind: 'afterRefresh', player: d.card(id).owner },
        controller: you,
        source: f.card,
      });
    }
    return 'next';
  }
  if ('cost' in a) {
    if (a.cost.duration === 'battle' && !d.s.battle) return 'next'; // see `restrict` below
    const ids = select(d, f, a.cost.target, { role: 'target', verb: 'choose' });
    if (ids === WAIT) return WAIT;
    const du = duration(d, f, a.cost.duration);
    const amount = num(c, a.cost.amount);
    for (const id of ids)
      if (FIELD.has(d.card(id).zone))
        addModifier(d, {
          kind: 'cost',
          target: id,
          amount,
          duration: du,
          controller: you,
          source: f.card,
        });
    return 'next';
  }
  if ('playCost' in a) {
    // "The next time you play [Trafalgar Law] ... from your hand during this turn, the cost will be
    // reduced by 2": a one-shot change on the Leader, spent by the play it applies to (E-Q2).
    addModifier(d, {
      kind: 'playCost',
      target: d.ro(you).leader,
      amount: a.playCost.amount,
      filter: a.playCost.next,
      uses: a.playCost.uses,
      duration: { kind: 'thisTurn', turn: d.s.turn },
      controller: you,
      source: f.card,
    });
    return 'next';
  }
  if ('giveDon' in a) return giveDon(d, f, a.giveDon);
  if ('trashLifeUntil' in a) {
    // "Trash cards from the top of your Life cards until you have 1 Life card."
    while (d.ro(you).life.length > a.trashLifeUntil)
      moveCard(d, d.ro(you).life[0]!, 'trash', { revealed: true, extra: { reason: 'life' } });
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
    for (const id of ids) if (setActive(d, id)) f.acted = true;
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
    if (typeof spec.target === 'string') {
      // A restriction on a player is a modifier on their Leader (see `playBlocked`).
      const what = (a as { restrict: { what: Restriction } }).restrict.what;
      const leader = d.ro(rel(c, spec.target)).leader;
      const base = {
        target: leader,
        duration: duration(d, f, spec.duration),
        controller: you,
        source: f.card,
      };
      if (what === 'cannotDrawByOwnEffects')
        addModifier(d, { ...base, kind: 'cannotDraw', amount: 0 });
      else if (typeof what === 'object' && 'cannotPlay' in what)
        addModifier(d, { ...base, kind: 'cannotPlay', amount: 0, filter: what.cannotPlay });
      else return unsupported(d, f, `restriction ${JSON.stringify(what)} on a player`);
      return 'next';
    }
    // "During this battle" with no battle going on (a [Counter] effect activated from a [Trigger]
    // by effect damage, G5) has nothing to last through: it does nothing, and nothing is chosen.
    if (spec.duration === 'battle' && !d.s.battle) return 'next';
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
      else {
        const what = (a as { restrict: { what: Restriction } }).restrict.what;
        const spec = restrictionMod(what);
        if (!spec) return unsupported(d, f, `restriction ${JSON.stringify(what)}`);
        addModifier(d, {
          ...base,
          kind: spec.kind,
          amount: 0,
          ...(spec.scope ? { scope: spec.scope } : {}),
        });
      }
    }
    return 'next';
  }
  if ('addDon' in a) {
    // "Add N" adds exactly N (or what the DON!! deck holds). "Add up to N" (`upTo`) may add any
    // number from 0 to N (CR 4-8-1, QA-GR): a count is asked, most first, as `giveDon` does
    // (E-Q11, reopened by the OP-17 review). A multi-part add asks per part, in order.
    const ps = d.pl(you);
    for (let i = f.tmp?.add ?? 0; i < a.addDon.length; i++) {
      const part = a.addDon[i]!;
      let k = Math.min(part.n, ps.donDeck);
      if (part.upTo && k > 0) {
        const got = take(f);
        if (!Array.isArray(got)) {
          const counts = Array.from({ length: k + 1 }, (_, j) => k - j);
          return ask(d, f, {
            kind: 'choose',
            player: you,
            prompt: `${nameOf(d, f)}: how many ${part.state} DON!! cards will you add (up to ${k})?`,
            min: 1,
            max: 1,
            candidates: counts.map((j) => ({ option: String(j) })) as never,
            picked: [],
            role: 'mode',
            options: counts.map((j) => ({
              id: String(j),
              label: j === 0 ? 'None' : `${j} DON!!`,
            })),
          });
        }
        k = Math.min(k, Math.max(0, Number((got[0] as { option: string }).option)));
      }
      f.tmp = { ...f.tmp, add: i + 1 };
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
    if (a.activate.ability === 'onPlay') {
      // "Activate this card's [On Play] effect" (OP13-113): its conditions are checked when it
      // resolves and an optional cost is asked, as for any activation.
      const onPlay = def.abilities.find((x) => x.kind === 'auto' && x.when.includes('onPlay'));
      if (onPlay) pushEffect(d, f.card, f.cardId, onPlay, you, 'effect');
      return 'next';
    }
    if (a.activate.ability === 'onKO') {
      // "[Trigger] Activate this card's [On K.O.] effect" (G5): like [On Play], its conditions are
      // checked when it resolves and an optional or costed one is asked first.
      const onKO = def.abilities.find((x) => x.kind === 'auto' && x.when.includes('onKO'));
      if (onKO) pushEffect(d, f.card, f.cardId, onKO, you, 'effect');
      return 'next';
    }
    // "Activate this card's [Counter] effect" (G5) and "[Main]": the effect's own activation cost
    // must still be paid (rules-digest 105), so an unpayable one does not activate. A cost paid
    // from a hidden zone is asked anyway, accept unavailable, so the pause leaks nothing.
    const timing = a.activate.ability === 'counter' ? 'counter' : 'main';
    const own = def.abilities.find((x) => hasTiming(x, timing));
    if (own && own.kind === 'activate' && (payable(c, own.cost) || costIsSecret(own.cost)))
      pushEffect(d, f.card, f.cardId, own, you, 'effect');
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

/**
 * "Give up to N rested DON!! cards to ...". The DON!! come from the cost area (rested or active as
 * the card says) and stay with the card until the next Refresh (CR 6-2-3). "Up to" allows any
 * number from 0 to N (ST01-011 Q&A, QA-GR, CR 4-8-1), asked with decisions the app already draws:
 * with more than one DON!! available a mode choice of the count (0 to N), then the target; with
 * one, the target choice itself may end with `done` (give none). With `each`, every target in the
 * selector gets up to N; when there are fewer DON!! than targets the player picks which targets.
 */
function giveDon(
  d: Draft,
  f: EffectFrame,
  g: Extract<EffectAction, { giveDon: unknown }>['giveDon'],
): Out {
  const you = f.controller;
  const c = ctxOf(d, f);
  const key = g.state === 'rested' ? 'donRested' : 'donActive';
  const per = num(c, g.n);
  const give = (id: InstanceId, k: number) => {
    if (d.card(id).zone !== 'leader' && d.card(id).zone !== 'characters') return;
    d.pl(you)[key] -= k;
    d.wcard(id).don += k;
    d.emit({
      type: 'DonGiven',
      player: you,
      target: id,
      card: d.card(id).card,
      count: k,
      rested: g.state === 'rested',
      by: 'effect',
    });
  };
  if (g.each) {
    // "up to N of your Characters ... M DON!! each" (G16, STB5-R1): "up to" allows fewer than M to a
    // target and fewer targets, so the DON!! on hand cap the targets only at one each. The player
    // picks up to min(N, DON!! available) targets, then a count 1 to min(M, DON!! left minus the
    // targets still to serve) for each, most first; a one-value range is not asked (M = 1).
    let ids = f.tmp?.sel;
    if (!ids) {
      const left = d.ro(you)[key];
      if (per <= 0 || left <= 0) return 'next';
      const cap = g.to.pick && 'upTo' in g.to.pick ? g.to.pick.upTo : Infinity;
      const sel: Selector =
        !g.to.pick && pool(c, g.to).length <= left
          ? g.to
          : { ...g.to, pick: { upTo: Math.min(left, cap) } };
      const picked = select(d, f, sel, { role: 'target', verb: 'give DON!! to' });
      if (picked === WAIT) return WAIT;
      ids = picked;
      f.tmp = { ...f.tmp, sel: ids, give: 0 };
    }
    for (let i = f.tmp?.give ?? 0; i < ids.length; i++) {
      const id = ids[i]!;
      const hi = Math.min(per, d.ro(you)[key] - (ids.length - i - 1));
      if (hi <= 0) break;
      let k = hi;
      if (hi > 1) {
        const got = take(f);
        if (!Array.isArray(got)) {
          const counts = Array.from({ length: hi }, (_, j) => hi - j);
          return ask(d, f, {
            kind: 'choose',
            player: you,
            prompt: `${nameOf(d, f)}: how many ${g.state} DON!! cards will you give to ${d.s.defs[d.card(id).card]?.name ?? id} (up to ${hi})?`,
            min: 1,
            max: 1,
            candidates: counts.map((j) => ({ option: String(j) })) as never,
            picked: [],
            role: 'mode',
            options: counts.map((j) => ({ id: String(j), label: `${j} DON!!` })),
          });
        }
        k = Math.min(hi, Math.max(1, Number((got[0] as { option: string }).option)));
      }
      give(id, k);
      f.tmp = { ...f.tmp, give: i + 1 };
    }
    return 'next';
  }
  const avail = Math.min(per, d.ro(you)[key]);
  const wanted = f.tmp?.give;
  if (wanted === undefined && (avail <= 0 || pool(c, g.to).length === 0)) return 'next';
  let count = wanted ?? 1;
  if (wanted === undefined && avail > 1) {
    const got = take(f);
    if (!Array.isArray(got)) {
      // Most first: the first legal pick (and the AI's default) gives all.
      const counts = Array.from({ length: avail + 1 }, (_, i) => avail - i);
      return ask(d, f, {
        kind: 'choose',
        player: you,
        prompt: `${nameOf(d, f)}: how many ${g.state} DON!! cards will you give (up to ${avail})?`,
        min: 1,
        max: 1,
        candidates: counts.map((i) => ({ option: String(i) })) as never,
        picked: [],
        role: 'mode',
        options: counts.map((i) => ({
          id: String(i),
          label: i === 0 ? 'None' : `${i} DON!!`,
        })),
      });
    }
    count = Number((got[0] as { option: string }).option);
    if (count <= 0) return 'next';
    f.tmp = { ...f.tmp, give: count };
  }
  // With a count chosen the target is owed; with one DON!! the player may still give none.
  const pk = g.to.pick;
  const n = !pk ? 1 : 'exactly' in pk ? pk.exactly : 'upTo' in pk ? pk.upTo : 1;
  const sel: Selector =
    avail > 1 || wanted !== undefined
      ? { ...g.to, pick: { exactly: n } }
      : { ...g.to, pick: { upTo: n } };
  const ids = select(d, f, sel, { role: 'target', verb: 'give DON!! to' });
  if (ids === WAIT) return WAIT;
  for (const id of ids) {
    const k = Math.min(count, d.ro(you)[key]);
    if (k <= 0) break;
    give(id, k);
  }
  return 'next';
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
    // Only "up to" / "may" is optional (CR 8-1-2): `exactly` (or no pick) adds the card (OP05-098).
    const mandatory = !what.pick || 'exactly' in what.pick;
    const g = mandatory ? true : take(f);
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
  if (zones.length === 1 && zones[0] === 'lifeTop') {
    // "Add up to 1 card from the top of your opponent's Life cards to the owner's hand." Not damage:
    // no [Trigger] (QA-GR). "Up to" may be declined, and it reveals nothing, so it is asked.
    const owner = rel(ctxOf(d, f), what.owner === 'opponent' ? 'opponent' : 'you');
    const life = d.ro(owner).life;
    if (life.length === 0) return 'next';
    const mandatory = !what.pick || 'exactly' in what.pick;
    const g = mandatory ? true : take(f);
    if (g === undefined)
      return ask(d, f, {
        kind: 'optional',
        player: you,
        prompt: `${nameOf(d, f)}: add the top card of ${owner === you ? 'your' : "your opponent's"} Life cards to ${owner === you ? 'your' : 'their'} hand?`,
        role: 'use',
      });
    if (g === true) {
      moveCard(d, life[0]!, 'hand', { extra: { reason: 'life' } });
      f.acted = true;
    }
    return 'next';
  }
  let ids: InstanceId[];
  if (
    to.zone === 'deck' &&
    (to.position === 'topOrBottom' || to.position === 'bottom') &&
    f.tmp?.sel
  ) {
    ids = f.tmp.sel; // already chosen; waiting for the top or bottom answer, or the order
  } else {
    const picked = select(d, f, what, {
      role: 'target',
      verb: to.zone === 'hand' ? 'return' : 'choose',
    });
    if (picked === WAIT) return WAIT;
    ids = picked;
  }
  if (ids.length) f.acted = true;
  if (to.zone === 'deck' && to.position === 'topOrBottom') {
    // "Place 2 cards from your hand at the top or bottom of your deck in any order" (OP11-054):
    // one choice for all of them, then they go in the order picked.
    if (ids.length === 0) return 'next';
    const g = take(f);
    if (!Array.isArray(g)) {
      f.tmp = { ...f.tmp, sel: ids };
      return ask(d, f, {
        kind: 'choose',
        player: you,
        prompt: `${nameOf(d, f)}: place the ${ids.length} cards at the top or the bottom of your deck?`,
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
    const top = (g[0] as { option: string }).option === 'top';
    for (const id of top ? ids.slice().reverse() : ids)
      moveCard(d, id, 'deck', { position: top ? 'top' : 'bottom', extra: { reason: 'effect' } });
    return 'next';
  }
  if (to.zone === 'life') {
    // Hand or trash to the top of Life (OP06-106; OP14-104 face-up).
    placeCards(d, ids, to as Dest, 'effect');
    return 'next';
  }
  if (zones.every((z) => z === 'trash' || z === 'hand')) {
    return placeHandTrash(d, f, ids, to as Dest, 'effect');
  }
  if (!zones.every((z) => z === 'characters' || z === 'stage') || to.zone === 'life')
    return unsupported(d, f, `move from ${zones.join('/')} to ${to.zone}`);
  const dest = to.zone as 'hand' | 'deck' | 'trash';
  const group = ids.length > 1 ? d.s.nextMod++ : undefined;
  // Several cards of one player placed at the bottom of their deck "in any order" (OP06-058): the
  // owner orders them (official OP06 Q&A), and the other player must not learn the order. The
  // cards leave in a fixed order, so the events say nothing; each is slotted above the ones owed
  // below it (`rank`). With cards of both players there is one each: nothing to order.
  let ranks: Map<InstanceId, number> | undefined;
  if (dest === 'deck' && to.position === 'bottom' && ids.length > 1) {
    const o = bottomOrder(d, f, ids);
    if (o === WAIT) return WAIT;
    ranks = o;
  }
  for (const id of ids.slice().reverse()) {
    if (!FIELD.has(d.card(id).zone)) continue;
    pushRemove(
      d,
      id,
      dest,
      { kind: 'effect', by: you },
      dest === 'deck' ? (to.position === 'top' ? 'top' : 'bottom') : undefined,
      group,
      ranks?.get(id),
    );
  }
  return 'next';
}

/**
 * Cards from a hand or trash to a zone, for a cost or an effect. Several to a deck bottom: the
 * owner orders them, hidden from the other player. The cards move in a fixed order, each slotted
 * above those owed below it, so neither the event order nor a revealed identity (a hand card going
 * into the deck is not revealed) leaks it.
 */
function placeHandTrash(
  d: Draft,
  f: EffectFrame,
  ids: InstanceId[],
  to: Dest,
  reason: string,
): Out {
  let ranks: Map<InstanceId, number> | undefined;
  if (to.zone === 'deck' && to.position === 'bottom' && ids.length > 1) {
    const o = bottomOrder(d, f, ids);
    if (o === WAIT) return WAIT;
    ranks = o;
  }
  const placed: InstanceId[] = [];
  for (const id of ranks ? ids.slice().sort() : ids) {
    const above = ranks ? placed.filter((p) => ranks!.get(p)! > ranks!.get(id)!).length : 0;
    const wasHand = d.card(id).zone === 'hand';
    moveCard(d, id, to.zone as 'hand', {
      revealed: !(wasHand && to.zone === 'deck'),
      // The declared deck position is honoured (M4a-07); hand and trash take the default.
      position: to.zone === 'deck' ? (to.position === 'bottom' ? 'bottom' : 'top') : undefined,
      ...(above > 0 ? { above } : {}),
      extra: { reason },
    });
    placed.push(id);
  }
  return 'next';
}

/**
 * Several of one player's cards placed at the bottom of their deck "in any order" (OP06-058, and
 * from a hand or trash: OP16-047, OP17-053, OP17-095): the owner orders them (official OP06 Q&A),
 * and the other player must not learn the order. The cards leave in a fixed order, so the events
 * say nothing; each is slotted above the ones owed below it (`rank`). With cards of both players
 * there is one each: nothing to order. Returns the ranks, undefined when there is nothing to
 * order, or WAIT after asking the owner for the next card.
 */
function bottomOrder(
  d: Draft,
  f: EffectFrame,
  ids: InstanceId[],
): Map<InstanceId, number> | undefined | typeof WAIT {
  const owner = d.card(ids[0]!).owner;
  if (!ids.every((id) => d.card(id).owner === owner)) return undefined;
  const order = [...(f.tmp?.order ?? [])];
  const g = take(f);
  if (typeof g === 'string') order.push(g);
  const left = ids.filter((id) => !order.includes(id));
  if (left.length >= 2) {
    f.tmp = { ...f.tmp, sel: ids, order };
    ask(d, f, {
      kind: 'order',
      player: owner,
      prompt: `${nameOf(d, f)}: choose the next card to place at the bottom of your deck (it ends up above the ones after it).`,
      candidates: left.slice().sort(),
      role: 'order',
      options: left
        .slice()
        .sort()
        .map((id) => ({ id, label: d.s.defs[d.card(id).card]!.name })),
    });
    return WAIT;
  }
  order.push(...left);
  return new Map(order.map((id, i) => [id, i]));
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
      if (tk.to === 'play') {
        // Play the cards taken, for free (G17): the same frames as the `play` action, with the
        // batch rule for several. The effect resumes here once they are played.
        const ids = g as InstanceId[];
        look = look.filter((id) => !ids.includes(id));
        f.look = look;
        tmp.take = (tmp.take ?? 0) + 1;
        f.tmp = tmp;
        const batch = ids.length > 1 ? d.s.nextMod++ : undefined;
        if (ids.length) f.acted = true;
        for (const id of ids.slice().reverse()) {
          const pf: Frame = { f: 'play', card: id, player: f.controller, step: 'pay', free: true };
          if (batch !== undefined) pf.batch = batch;
          if (tk.rested) pf.rested = true;
          push(d, pf);
        }
        return 'jump';
      }
      for (const id of g as InstanceId[]) {
        if (tk.reveal)
          d.emit({
            type: 'CardRevealed',
            instance: id,
            card: d.card(id).card,
            player: f.controller,
            reason: 'search',
          });
        if (tk.to === 'lifeTop')
          moveCard(d, id, 'life', { position: 'top', faceUp: false, extra: { reason: 'search' } });
        else moveCard(d, id, 'hand', { revealed: tk.reveal === true, extra: { reason: 'search' } });
      }
      look = look.filter((id) => !(g as InstanceId[]).includes(id));
      f.look = look;
      tmp.take = (tmp.take ?? 0) + 1;
      f.tmp = tmp;
      continue;
    }
    const cands = look
      .filter((id) => !tk.filter || matches(c, id, tk.filter))
      // Only Characters and Stages are played, and not one an effect bars you from playing.
      .filter((id) => {
        if (tk.to !== 'play') return true;
        const cat = d.s.defs[d.card(id).card]!.category;
        return (cat === 'Character' || cat === 'Stage') && !playBlocked(d.s, f.controller, id);
      })
      .sort();
    const n = 'upTo' in tk.pick ? tk.pick.upTo : 'exactly' in tk.pick ? tk.pick.exactly : 1;
    if (look.length === 0) {
      // Nothing was looked at (the deck is empty, which is public): nothing to choose (M4b-05,
      // effect-dsl 4.11). With cards looked at but none eligible the choice is still asked, with
      // max 0 (the UI answers `done`): skipping it would tell the opponent the top cards hold no
      // match (CR 8-4-4-2, ADR 0005).
      tmp.take = (tmp.take ?? 0) + 1;
      f.tmp = tmp;
      continue;
    }
    f.tmp = tmp;
    return ask(d, f, {
      kind: 'choose',
      player: f.controller,
      prompt: `${nameOf(d, f)}: choose up to ${n} of the cards you are looking at to ${tk.to === 'play' ? 'play' : `add to your ${tk.to === 'lifeTop' ? 'Life cards' : 'hand'}`}.`,
      min: 0,
      max: Math.min(n, cands.length),
      candidates: cands,
      picked: [],
      role: 'target',
      secret: true,
    });
  }
  if (spec.rest === 'trash') {
    // "Then, trash the rest" (OP17-080): face up, public.
    for (const id of look) moveCard(d, id, 'trash', { revealed: true, extra: { reason: 'look' } });
    delete f.look;
    return 'next';
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
