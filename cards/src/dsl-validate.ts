/**
 * The script schema (effect-dsl.md E-D1). `validateScript` checks a `CardScript` structurally (every
 * union member, every field, no unknown keys) and lints it:
 * - every `{ ref }` names a selection bound earlier in the same ability;
 * - every `ifDid` / `{ did }` names a `may` label earlier in the same ability;
 * - every pick inside a cost is `exactly` (E-D6);
 * - ability ids are unique, lower-case and never start with `$` (instance ids do, M2-22);
 * - nothing outside `IMPLEMENTED` is used, so a script never silently does nothing.
 * It has no dependencies, so it runs in tests, scripts and CI.
 */
import { ATTRIBUTES, CATEGORIES, COLORS, KEYWORDS } from './validate.ts';

/**
 * What the engine runtime implements (M4a: the Rocks and Kaido archetypes plus the general
 * machinery). The rest of the §4.14 vocabulary is accepted by the types but rejected here until
 * the runtime implements it (M4b).
 */
export const IMPLEMENTED = {
  timings: [
    'onPlay',
    'whenAttacking',
    'onOpponentAttack',
    'onBlock',
    'onKO',
    'endOfYourTurn',
    'endOfOpponentsTurn',
    'startOfYourTurn',
    'startOfGame',
    'event:attack',
    'event:donReturned',
    'event:cardPlayed',
    'event:eventActivated',
    'event:blockerActivated',
    'event:lifeRemoved',
    'event:lifeBecameZero',
    'event:koed',
  ],
  zones: [
    'leader',
    'characters',
    'stage',
    'field',
    'hand',
    'trash',
    'deckTop',
    'self',
    'donCostArea',
    // Only as the source of a `move` (the top Life card to a hand): see `selector`.
    'lifeTop',
  ],
  picks: ['upTo', 'exactly', 'any'],
  costs: [
    'donMinus',
    'restDon',
    'trash',
    'reveal',
    'restSelf',
    'trashSelf',
    'returnDon',
    'lifeToHand',
    'turnLifeFaceUp',
    'turnLifeFaceDown',
    'giveDon',
    'ko',
    'mill',
    'rest',
    'move',
    'oneOf',
  ],
  steps: ['do', 'if', 'may', 'ifDid', 'chooseOne', 'delayed', 'forEach'],
  actions: [
    'draw',
    'trashFromHand',
    'mill',
    'lookAtTop',
    'reveal',
    'move',
    'play',
    'ko',
    'rest',
    'setActive',
    'power',
    'setBasePower',
    'addDon',
    'returnDon',
    'grant',
    'negate',
    'restrict',
    'activate',
    'select',
    'cost',
    'playCost',
    'giveDon',
    'skipRefresh',
    'trashLifeUntil',
  ],
  continuous: [
    'counter',
    'lockAttackTarget',
    'power',
    'setBasePower',
    'cost',
    'grant',
    'restrict',
    'tiers',
  ],
  restrictions: [
    'cannotAttack',
    'cannotActivateBlockerAgainstIt',
    'cannotDrawByOwnEffects',
    'cannotBeRemovedByOpponentEffects',
    'cannotBeKOd',
    'cannotBeRested',
    'cannotActivateBlocker',
  ],
  nums: [
    'count',
    'life',
    'hand',
    'trash',
    'deck',
    'donOnField',
    'donGiven',
    'turnIndex',
    'refCount',
    'refStat',
    'sum',
    'mul',
  ],
} as const;

type Obj = Record<string, unknown>;
interface Ctx {
  errors: string[];
  bound: Set<string>;
  labels: Set<string>;
  inCost: boolean;
  /** Inside a replacement's `instead`: no alternative costs (G19). */
  noAlt?: boolean;
  /** A selector may name the top Life card (only a `move` can read it). */
  lifeOk?: boolean;
}

const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const has = (list: readonly string[], v: string) => list.includes(v);

function err(c: Ctx, path: string, msg: string): void {
  c.errors.push(`${path}: ${msg}`);
}

/** Exactly one key from `keys` (the discriminator), and every other key in `extra`. */
function oneOf(
  c: Ctx,
  path: string,
  v: unknown,
  keys: readonly string[],
  extra: Record<string, readonly string[]> = {},
): string | null {
  if (!isObj(v)) {
    err(c, path, 'expected an object');
    return null;
  }
  const found = Object.keys(v).filter((k) => keys.includes(k));
  if (found.length !== 1) {
    err(c, path, `expected exactly one of ${keys.join(', ')}; got ${Object.keys(v).join(', ')}`);
    return null;
  }
  const k = found[0]!;
  const allowed = extra[k] ?? [];
  for (const other of Object.keys(v))
    if (other !== k && !allowed.includes(other)) err(c, path, `unknown key "${other}" with ${k}`);
  return k;
}

function fields(c: Ctx, path: string, v: unknown, required: string[], optional: string[] = []) {
  if (!isObj(v)) return err(c, path, 'expected an object');
  for (const k of required) if (!(k in v)) err(c, path, `missing "${k}"`);
  for (const k of Object.keys(v))
    if (!required.includes(k) && !optional.includes(k)) err(c, path, `unknown key "${k}"`);
}

function int(c: Ctx, path: string, v: unknown): void {
  if (typeof v !== 'number' || !Number.isInteger(v)) err(c, path, 'expected an integer');
}
function str(c: Ctx, path: string, v: unknown): void {
  if (typeof v !== 'string' || v.length === 0) err(c, path, 'expected a non-empty string');
}
function arr<T>(c: Ctx, path: string, v: unknown, each: (x: unknown, p: string) => T): void {
  if (!Array.isArray(v)) return err(c, path, 'expected an array');
  v.forEach((x, i) => each(x, `${path}[${i}]`));
}
function enumOf(c: Ctx, path: string, v: unknown, values: readonly string[]): void {
  if (typeof v !== 'string' || !values.includes(v))
    err(c, path, `expected one of ${values.join(', ')}; got ${JSON.stringify(v)}`);
}

const P = ['you', 'opponent'];
const ZONES = [
  'leader',
  'characters',
  'stage',
  'field',
  'hand',
  'trash',
  'deckTop',
  'lifeTop',
  'lifeTopOrBottom',
  'looked',
  'self',
  'donCostArea',
  'donGiven',
  'donField',
  'donDeck',
];
const DURATIONS = ['battle', 'thisTurn', 'untilEndOfOpponentsNextTurn', 'untilStartOfYourNextTurn'];
const NAMED = [
  'onPlay',
  'whenAttacking',
  'onOpponentAttack',
  'onBlock',
  'onKO',
  'endOfYourTurn',
  'endOfOpponentsTurn',
  'startOfYourTurn',
  'startOfGame',
];

function num(c: Ctx, path: string, v: unknown): void {
  if (typeof v === 'number') return int(c, path, v);
  const k = oneOf(
    c,
    path,
    v,
    [
      'count',
      'life',
      'hand',
      'trash',
      'deck',
      'donOnField',
      'donGiven',
      'turnIndex',
      'refCount',
      'refStat',
      'sum',
      'mul',
    ],
    { donOnField: ['state'], refStat: ['stat'], count: ['distinctNames'] },
  );
  if (!k) return;
  const o = v as Obj;
  if (!has(IMPLEMENTED.nums, k)) err(c, path, `${k} is not implemented in the runtime yet`);
  switch (k) {
    case 'count':
      // `distinctNames`: the number of different card names among the matches (G15).
      if (o.distinctNames !== undefined && o.distinctNames !== true)
        err(c, `${path}.distinctNames`, 'expected true');
      return selector(c, `${path}.count`, o.count);
    case 'life':
      return enumOf(c, `${path}.life`, o.life, [...P, 'both']);
    case 'hand':
    case 'trash':
    case 'deck':
    case 'donGiven':
    case 'turnIndex':
      return enumOf(c, `${path}.${k}`, o[k], P);
    case 'donOnField':
      enumOf(c, `${path}.donOnField`, o.donOnField, P);
      if (o.state !== undefined) enumOf(c, `${path}.state`, o.state, ['active', 'rested']);
      return;
    case 'refCount':
      return ref(c, `${path}.refCount`, o.refCount);
    case 'refStat':
      ref(c, `${path}.refStat`, o.refStat);
      return enumOf(c, `${path}.stat`, o.stat, ['cost', 'power', 'basePower']);
    case 'sum':
      return arr(c, `${path}.sum`, o.sum, (x, p) => num(c, p, x));
    case 'mul': {
      const m = o.mul;
      if (!Array.isArray(m) || m.length !== 2) return err(c, `${path}.mul`, 'expected [Num, int]');
      num(c, `${path}.mul[0]`, m[0]);
      return int(c, `${path}.mul[1]`, m[1]);
    }
  }
}

function ref(c: Ctx, path: string, name: unknown): void {
  str(c, path, name);
  if (typeof name === 'string' && !c.bound.has(name))
    err(c, path, `refers to "${name}", which no earlier selector binds`);
}

function cmp(c: Ctx, path: string, v: unknown): void {
  const k = oneOf(c, path, v, ['lte', 'gte', 'eq']);
  if (k) num(c, `${path}.${k}`, (v as Obj)[k]);
}

function filter(c: Ctx, path: string, v: unknown): void {
  const k = oneOf(c, path, v, [
    'category',
    'cost',
    'baseCost',
    'power',
    'basePower',
    'hasCounter',
    'type',
    'typeIncludes',
    'name',
    'nameIncludes',
    'color',
    'attribute',
    'multicolor',
    'hasTrigger',
    'keyword',
    'state',
    'isSelf',
    'playedThisTurn',
    'ref',
    'all',
    'any',
    'not',
  ]);
  if (!k) return;
  const x = (v as Obj)[k];
  const p = `${path}.${k}`;
  switch (k) {
    case 'attribute':
      return enumOf(c, p, x, ATTRIBUTES);
    case 'category':
      return arr(c, p, x, (y, q) => enumOf(c, q, y, CATEGORIES));
    case 'cost':
    case 'baseCost':
    case 'power':
    case 'basePower':
      return cmp(c, p, x);
    case 'hasCounter':
    case 'hasTrigger':
    case 'isSelf':
      if (typeof x !== 'boolean') err(c, p, 'expected a boolean');
      return;
    case 'multicolor':
    case 'playedThisTurn':
      if (x !== true) err(c, p, 'expected true');
      return;
    case 'type':
    case 'typeIncludes':
    case 'name':
    case 'nameIncludes':
      return str(c, p, x);
    case 'color':
      return enumOf(c, p, x, COLORS);
    case 'keyword':
      return enumOf(c, p, x, KEYWORDS);
    case 'state':
      return enumOf(c, p, x, ['active', 'rested']);
    case 'ref':
      return ref(c, p, x);
    case 'all':
    case 'any':
      return arr(c, p, x, (y, q) => filter(c, q, y));
    case 'not':
      return filter(c, p, x);
  }
}

function pick(c: Ctx, path: string, v: unknown): void {
  const k = oneOf(c, path, v, ['upTo', 'exactly', 'any', 'groups'], {
    upTo: ['totalCost', 'distinctNames'],
  });
  if (!k) return;
  const o = v as Obj;
  if (!has(IMPLEMENTED.picks, k)) err(c, path, `pick ${k} is not implemented in the runtime yet`);
  if (c.inCost && k !== 'exactly') err(c, path, 'a pick inside a cost must be "exactly" (E-D6)');
  if (k === 'upTo' || k === 'exactly') {
    int(c, `${path}.${k}`, o[k]);
    if ((o[k] as number) < 1) err(c, `${path}.${k}`, 'must be at least 1');
  }
  if (o.totalCost !== undefined) cmp(c, `${path}.totalCost`, o.totalCost);
  if (o.distinctNames !== undefined && o.distinctNames !== true)
    err(c, `${path}.distinctNames`, 'expected true');
}

function selector(c: Ctx, path: string, v: unknown): void {
  fields(c, path, v, ['from', 'owner'], ['filter', 'pick', 'chooser', 'blind', 'bind', 'lki']);
  if (!isObj(v)) return;
  const zones = Array.isArray(v.from) ? v.from : [v.from];
  for (const z of zones) {
    enumOf(c, `${path}.from`, z, ZONES);
    if (typeof z === 'string' && ZONES.includes(z) && !has(IMPLEMENTED.zones, z))
      err(c, `${path}.from`, `zone ${z} is not implemented in the runtime yet`);
    if (z === 'lifeTop' && !c.lifeOk)
      err(c, `${path}.from`, 'lifeTop can only be the source of a move to a hand');
  }
  enumOf(c, `${path}.owner`, v.owner, [...P, 'any']);
  if (v.filter !== undefined) filter(c, `${path}.filter`, v.filter);
  if (v.pick !== undefined) pick(c, `${path}.pick`, v.pick);
  if (v.chooser !== undefined) enumOf(c, `${path}.chooser`, v.chooser, P);
  if (v.blind !== undefined && v.blind !== true) err(c, `${path}.blind`, 'expected true');
  if (v.lki !== undefined) err(c, `${path}.lki`, 'lki is not implemented in the runtime yet');
  if (v.bind !== undefined) {
    str(c, `${path}.bind`, v.bind);
    if (typeof v.bind === 'string') c.bound.add(v.bind);
  }
}

function condition(c: Ctx, path: string, v: unknown): void {
  const k = oneOf(
    c,
    path,
    v,
    [
      'yourTurn',
      'opponentsTurn',
      'donGiven',
      'cmp',
      'exists',
      'none',
      'leader',
      'self',
      'ref',
      'did',
      'all',
      'any',
      'not',
    ],
    { ref: ['matches'] },
  );
  if (!k) return;
  const o = v as Obj;
  const p = `${path}.${k}`;
  switch (k) {
    case 'yourTurn':
    case 'opponentsTurn':
      if (o[k] !== true) err(c, p, 'expected true');
      return;
    case 'donGiven':
      return int(c, p, o[k]);
    case 'cmp': {
      const t = o.cmp;
      if (!Array.isArray(t) || t.length !== 3) return err(c, p, 'expected [Num, op, Num]');
      num(c, `${p}[0]`, t[0]);
      enumOf(c, `${p}[1]`, t[1], ['<=', '>=', '=', '<', '>']);
      return num(c, `${p}[2]`, t[2]);
    }
    case 'exists':
    case 'none':
      return selector(c, p, o[k]);
    case 'leader':
    case 'self':
      return filter(c, p, o[k]);
    case 'ref':
      ref(c, p, o.ref);
      return filter(c, `${path}.matches`, o.matches);
    case 'did':
      str(c, p, o.did);
      if (typeof o.did === 'string' && !c.labels.has(o.did))
        err(c, p, `no earlier "may" step is labelled "${o.did}"`);
      return;
    case 'all':
    case 'any':
      return arr(c, p, o[k], (y, q) => condition(c, q, y));
    case 'not':
      return condition(c, p, o.not);
  }
}

function dest(c: Ctx, path: string, v: unknown): void {
  fields(c, path, v, ['zone'], ['position', 'faceUp']);
  if (!isObj(v)) return;
  enumOf(c, `${path}.zone`, v.zone, ['hand', 'trash', 'deck', 'life']);
  if (v.position !== undefined)
    enumOf(c, `${path}.position`, v.position, ['top', 'bottom', 'topOrBottom']);
  if (v.faceUp !== undefined && typeof v.faceUp !== 'boolean')
    err(c, `${path}.faceUp`, 'expected a boolean');
}

function costs(c: Ctx, path: string, v: unknown): void {
  const was = c.inCost;
  c.inCost = true;
  arr(c, path, v, (x, p) => cost(c, p, x));
  if (Array.isArray(v) && v.filter((x) => isObj(x) && 'oneOf' in x).length > 1)
    err(c, path, 'at most one "A or B" cost per cost list');
  c.inCost = was;
}

function cost(c: Ctx, path: string, v: unknown): void {
  const k = oneOf(
    c,
    path,
    v,
    [
      'donMinus',
      'restDon',
      'trash',
      'reveal',
      'rest',
      'restSelf',
      'trashSelf',
      'lifeToHand',
      'turnLifeFaceUp',
      'turnLifeFaceDown',
      'mill',
      'returnDon',
      'giveDon',
      'ko',
      'move',
      'oneOf',
    ],
    { move: ['to'] },
  );
  if (!k) return;
  const o = v as Obj;
  const p = `${path}.${k}`;
  if (!has(IMPLEMENTED.costs, k)) err(c, path, `cost ${k} is not implemented in the runtime yet`);
  switch (k) {
    case 'donMinus':
    case 'turnLifeFaceUp':
    case 'turnLifeFaceDown':
    case 'mill':
      int(c, p, o[k]);
      if (k === 'turnLifeFaceDown' && (o[k] as number) < 1) err(c, p, 'must be at least 1');
      return;
    case 'returnDon':
      // A number: DON!! from anywhere on the field. `{ n, state: 'active' }`: active cost-area DON!! (G9).
      if (isObj(o.returnDon)) {
        fields(c, p, o.returnDon, ['n', 'state']);
        int(c, `${p}.n`, o.returnDon.n);
        enumOf(c, `${p}.state`, o.returnDon.state, ['active']);
      } else int(c, p, o.returnDon);
      return;
    case 'restDon':
      if (o.restDon !== 'any') int(c, p, o.restDon);
      return;
    case 'trash':
    case 'reveal':
    case 'rest':
      selector(c, p, o[k]);
      if (isObj(o[k]) && !(o[k] as Obj).pick) err(c, p, 'a cost selector needs a pick');
      if (k === 'rest')
        zonesIn(
          c,
          p,
          o[k],
          [...FIELD_ZONES, 'donCostArea'],
          'a rest cost rests cards on the field or DON!! in the cost area',
        );
      // A trash cost takes cards from a hand or from your own Characters or Stage (a removal with
      // the cause `cost`, M6b wave 1 G1); the two are never mixed in one cost.
      if (k === 'trash') fieldOrHand(c, p, o[k], 'a trash cost');
      return;
    case 'ko':
      // "K.O. 1 of your Characters": a real K.O. of one of your own Characters (G1).
      selector(c, p, o.ko);
      if (isObj(o.ko) && !(o.ko as Obj).pick) err(c, p, 'a cost selector needs a pick');
      zonesIn(c, p, o.ko, ['characters'], "only Characters are K.O.'d (CR 10-2-1)");
      ownerYou(c, p, o.ko, 'a K.O. cost K.O.s your own Characters');
      return;
    case 'giveDon': {
      fields(c, p, o.giveDon, ['n', 'state', 'to']);
      const g = o.giveDon;
      if (!isObj(g)) return;
      int(c, `${p}.n`, g.n);
      if (typeof g.n === 'number' && g.n < 1) err(c, `${p}.n`, 'must be at least 1');
      enumOf(c, `${p}.state`, g.state, ['active']);
      selector(c, `${p}.to`, g.to);
      if (isObj(g.to) && !(g.to as Obj).pick) err(c, `${p}.to`, 'a cost selector needs a pick');
      zonesIn(c, `${p}.to`, g.to, ['leader', 'characters'], 'DON!! go to a Leader or Character');
      ownerYou(c, `${p}.to`, g.to, 'a giveDon cost gives DON!! to your own cards');
      if (isObj(g.to) && isObj(g.to.pick) && g.to.pick.exactly !== 1)
        err(c, `${p}.to.pick`, 'a giveDon cost gives to exactly 1 card');
      return;
    }
    case 'restSelf':
    case 'trashSelf':
      if (o[k] !== true) err(c, p, 'expected true');
      return;
    case 'oneOf': {
      // "A or B" (G19): a list of at least two alternatives, each a list of plain costs. Only an
      // ability's own cost may offer a choice: a replacement's payload has no place to ask.
      if (c.noAlt) err(c, p, 'a replacement payload does not offer alternative costs');
      const alts = o.oneOf;
      if (!Array.isArray(alts) || alts.length < 2)
        return err(c, p, 'expected at least 2 alternatives, each a list of costs');
      alts.forEach((alt, i) => {
        if (!Array.isArray(alt) || alt.length === 0)
          return err(c, `${p}[${i}]`, 'an alternative is a non-empty list of costs');
        alt.forEach((x, j) => {
          if (isObj(x) && 'oneOf' in x) err(c, `${p}[${i}][${j}]`, 'alternatives do not nest');
          else cost(c, `${p}[${i}][${j}]`, x);
        });
      });
      return;
    }
    case 'lifeToHand': {
      fields(c, p, o[k], ['from', 'n']);
      const spec = o[k];
      if (!isObj(spec)) return;
      enumOf(c, `${p}.from`, spec.from, ['top', 'topOrBottom']);
      int(c, `${p}.n`, spec.n);
      if (spec.n !== 1) err(c, `${p}.n`, 'only n = 1 is implemented');
      return;
    }
    case 'move': {
      selector(c, p, o.move);
      if (isObj(o.move) && !(o.move as Obj).pick) err(c, p, 'a cost selector needs a pick');
      const fieldSide = fieldOrHand(c, p, o.move, 'a move cost', ['hand', 'trash']);
      dest(c, `${path}.to`, o.to);
      if (fieldSide && isObj(o.to)) {
        // Your own Character or Stage goes to your hand, to the top or bottom of your deck, or to
        // the trash (a removal with the cause `cost`, G1). One card only: several cards going to a
        // deck would need an order, which a cost does not ask for.
        if (o.to.zone === 'life')
          err(c, `${path}.to`, 'a cost does not move a field card into Life');
        const pk = isObj(o.move) && isObj(o.move.pick) ? o.move.pick : undefined;
        if (o.to.zone === 'deck' && pk?.exactly !== 1)
          err(c, `${p}.pick`, 'a cost that puts a field card into the deck takes exactly 1');
        if (o.to.zone === 'deck' && o.to.position === 'topOrBottom')
          err(c, `${path}.to.position`, 'a field cost picks the top or the bottom');
      }
      return moveShape(c, p, o.move, o.to);
    }
  }
}

/**
 * A cost selector reads either hand-side zones (`handSide`) or your own Characters and Stage, never
 * a mix: the two run differently. Returns true for the field side.
 */
function fieldOrHand(
  c: Ctx,
  path: string,
  sel: unknown,
  what: string,
  handSide: string[] = ['hand'],
): boolean {
  if (!isObj(sel)) return false;
  const zones = (Array.isArray(sel.from) ? sel.from : [sel.from]) as string[];
  const hand = zones.every((z) => handSide.includes(z));
  const field = zones.every((z) => z === 'characters' || z === 'stage');
  if (!hand && !field)
    err(
      c,
      `${path}.from`,
      `${what} reads ${handSide.join(' or ')}, or your Characters or Stage, not ${zones.join(', ')}`,
    );
  if (field) ownerYou(c, path, sel, `${what} from the field takes your own cards`);
  return field && !hand;
}

function ownerYou(c: Ctx, path: string, sel: unknown, why: string): void {
  if (isObj(sel) && sel.owner !== 'you') err(c, `${path}.owner`, `${why}: owner must be "you"`);
}

function steps(c: Ctx, path: string, v: unknown): void {
  arr(c, path, v, (x, p) => step(c, p, x));
}

function step(c: Ctx, path: string, v: unknown): void {
  // `forEach` and `delayed` carry a `do` list of their own, so they win over the `do` step.
  const wrapper = isObj(v) && ('forEach' in v || 'delayed' in v);
  const keys = wrapper ? ['forEach', 'delayed'] : ['do', 'if', 'may', 'ifDid', 'chooseOne'];
  const k = oneOf(c, path, v, keys, {
    do: ['label'],
    if: ['then', 'else'],
    may: ['label', 'prompt'],
    ifDid: ['then'],
    chooseOne: ['chooser', 'labels', 'neutral'],
    forEach: ['do'],
    delayed: ['do'],
  });
  if (!k) return;
  const o = v as Obj;
  if (!has(IMPLEMENTED.steps, k)) err(c, path, `step ${k} is not implemented in the runtime yet`);
  switch (k) {
    case 'do':
      if (o.label !== undefined) {
        str(c, `${path}.label`, o.label);
        if (typeof o.label === 'string') c.labels.add(o.label);
      }
      return action(c, `${path}.do`, o.do);
    case 'if':
      condition(c, `${path}.if`, o.if);
      steps(c, `${path}.then`, o.then);
      if (o.else !== undefined) steps(c, `${path}.else`, o.else);
      return;
    case 'may':
      str(c, `${path}.label`, o.label);
      steps(c, `${path}.may`, o.may);
      if (typeof o.label === 'string') c.labels.add(o.label);
      return;
    case 'ifDid':
      str(c, `${path}.ifDid`, o.ifDid);
      if (typeof o.ifDid === 'string' && !c.labels.has(o.ifDid))
        err(c, `${path}.ifDid`, `no earlier "may" step is labelled "${o.ifDid}"`);
      return steps(c, `${path}.then`, o.then);
    case 'chooseOne': {
      const modes = o.chooseOne;
      arr(c, `${path}.chooseOne`, modes, (m, p) => steps(c, p, m));
      if (o.chooser !== undefined) enumOf(c, `${path}.chooser`, o.chooser, P);
      arr(c, `${path}.labels`, o.labels, (l, p) => str(c, p, l));
      if (Array.isArray(modes) && (!Array.isArray(o.labels) || o.labels.length !== modes.length))
        err(c, `${path}.labels`, 'needs one label per mode');
      if (o.neutral !== undefined) {
        arr(c, `${path}.neutral`, o.neutral, (l, p) => str(c, p, l));
        if (
          Array.isArray(modes) &&
          (!Array.isArray(o.neutral) || o.neutral.length !== modes.length)
        )
          err(c, `${path}.neutral`, 'needs one neutral label per mode');
      }
      return;
    }
    case 'forEach':
      num(c, `${path}.forEach`, o.forEach);
      return steps(c, `${path}.do`, o.do);
    case 'delayed':
      fields(c, `${path}.delayed`, o.delayed, ['at']);
      if (isObj(o.delayed)) enumOf(c, `${path}.delayed.at`, o.delayed.at, ['endOfThisTurn']);
      return steps(c, `${path}.do`, o.do);
  }
}

function action(c: Ctx, path: string, v: unknown): void {
  const k = oneOf(
    c,
    path,
    v,
    [
      'draw',
      'trashFromHand',
      'mill',
      'lookAtTop',
      'reveal',
      'move',
      'trashLifeUntil',
      'play',
      'ko',
      'rest',
      'setActive',
      'skipRefresh',
      'power',
      'setBasePower',
      'cost',
      'playCost',
      'giveDon',
      'addDon',
      'returnDon',
      'grant',
      'negate',
      'restrict',
      'activate',
      'select',
    ],
    { draw: ['player', 'upTo'] },
  );
  if (!k) return;
  const o = v as Obj;
  const x = o[k];
  const p = `${path}.${k}`;
  if (!has(IMPLEMENTED.actions, k))
    err(c, path, `action ${k} is not implemented in the runtime yet`);
  switch (k) {
    case 'draw':
      num(c, p, x);
      if (o.player !== undefined) enumOf(c, `${path}.player`, o.player, P);
      if (o.upTo !== undefined) err(c, `${path}.upTo`, '"draw up to" is not implemented yet');
      return;
    case 'trashFromHand':
      selector(c, p, x);
      return zonesIn(c, p, x, ['hand'], 'trashFromHand works on a hand');
    case 'ko':
      selector(c, p, x);
      // Characters, and (G18) Stages: a Stage K.O. goes to the trash through the same K.O. event.
      return zonesIn(
        c,
        p,
        x,
        ['characters', 'stage'],
        "only Characters and Stages are K.O.'d (CR 10-2-1)",
      );
    case 'rest':
      selector(c, p, x);
      return zonesIn(
        c,
        p,
        x,
        [...FIELD_ZONES, 'donCostArea'],
        'the runtime rests cards on the field, or DON!! in the cost area',
      );
    case 'setActive':
      selector(c, p, x);
      return zonesIn(
        c,
        p,
        x,
        [...FIELD_ZONES, 'donCostArea'],
        'the runtime sets active field cards or cost-area DON!! only',
      );
    case 'skipRefresh':
    case 'select':
      return selector(c, p, x);
    case 'mill':
      fields(c, p, x, ['player', 'n']);
      if (!isObj(x)) return;
      enumOf(c, `${p}.player`, x.player, P);
      return num(c, `${p}.n`, x.n);
    case 'lookAtTop': {
      fields(c, p, x, ['n', 'take', 'rest'], ['player']);
      if (!isObj(x)) return;
      int(c, `${p}.n`, x.n);
      if (x.player !== undefined && x.player !== 'you')
        err(
          c,
          `${p}.player`,
          "looking at the opponent's deck is not implemented in the runtime yet",
        );
      arr(c, `${p}.take`, x.take, (t, q) => {
        fields(c, q, t, ['pick', 'to'], ['filter', 'reveal', 'rested']);
        if (!isObj(t)) return;
        pick(c, `${q}.pick`, t.pick);
        if (t.filter !== undefined) filter(c, `${q}.filter`, t.filter);
        enumOf(c, `${q}.to`, t.to, ['hand', 'lifeTop', 'play']);
        if (t.reveal !== undefined && t.reveal !== true) err(c, `${q}.reveal`, 'expected true');
        if (t.rested !== undefined && t.rested !== true) err(c, `${q}.rested`, 'expected true');
        if (t.rested === true && t.to !== 'play')
          err(c, `${q}.rested`, 'only a take that plays the card can place it rested');
        if (t.to === 'play' && isObj(t.pick) && !('upTo' in t.pick || 'exactly' in t.pick))
          err(c, `${q}.pick`, 'a take that plays cards picks upTo or exactly');
      });
      return enumOf(c, `${p}.rest`, x.rest, ['bottomAnyOrder', 'topOrBottomAnyOrder', 'trash']);
    }
    case 'reveal':
      fields(c, p, x, ['from', 'n', 'bind']);
      if (!isObj(x)) return;
      enumOf(c, `${p}.from`, x.from, ['deckTop', 'lifeTop']);
      if (x.n !== 1) err(c, `${p}.n`, 'only n = 1 is implemented');
      str(c, `${p}.bind`, x.bind);
      if (typeof x.bind === 'string') c.bound.add(x.bind);
      return;
    case 'move':
      fields(c, p, x, ['what', 'to']);
      if (!isObj(x)) return;
      c.lifeOk = true;
      selector(c, `${p}.what`, x.what);
      c.lifeOk = false;
      dest(c, `${p}.to`, x.to);
      return moveShape(c, p, x.what, x.to);
    case 'trashLifeUntil':
      return int(c, p, x);
    case 'play':
      fields(c, p, x, ['what'], ['rested']);
      if (!isObj(x)) return;
      selector(c, `${p}.what`, x.what);
      zonesIn(
        c,
        `${p}.what`,
        x.what,
        ['hand', 'trash', 'self'],
        'the runtime plays cards from hand, trash or "this card" ([Trigger]) only',
      );
      if (x.rested !== undefined && x.rested !== true) err(c, `${p}.rested`, 'expected true');
      return;
    case 'power':
    case 'cost':
      fields(c, p, x, ['target', 'amount', 'duration']);
      if (!isObj(x)) return;
      selector(c, `${p}.target`, x.target);
      zonesIn(c, `${p}.target`, x.target, FIELD_ZONES, 'modifiers apply to cards on the field');
      num(c, `${p}.amount`, x.amount);
      return enumOf(c, `${p}.duration`, x.duration, DURATIONS);
    case 'setBasePower':
      fields(c, p, x, ['target', 'value', 'duration']);
      if (!isObj(x)) return;
      selector(c, `${p}.target`, x.target);
      zonesIn(c, `${p}.target`, x.target, FIELD_ZONES, 'modifiers apply to cards on the field');
      num(c, `${p}.value`, x.value);
      return enumOf(c, `${p}.duration`, x.duration, DURATIONS);
    case 'playCost':
      fields(c, p, x, ['next', 'from', 'amount', 'window', 'uses']);
      if (!isObj(x)) return;
      filter(c, `${p}.next`, x.next);
      enumOf(c, `${p}.from`, x.from, ['hand']);
      int(c, `${p}.amount`, x.amount);
      enumOf(c, `${p}.window`, x.window, ['thisTurn']);
      if (x.uses !== 1) err(c, `${p}.uses`, 'only uses = 1 is implemented');
      return;
    case 'giveDon':
      fields(c, p, x, ['n', 'state', 'to'], ['each']);
      if (!isObj(x)) return;
      num(c, `${p}.n`, x.n);
      enumOf(c, `${p}.state`, x.state, ['rested', 'active']);
      selector(c, `${p}.to`, x.to);
      zonesIn(c, `${p}.to`, x.to, ['leader', 'characters'], 'DON!! go to a Leader or Character');
      if (x.each !== undefined && x.each !== true) err(c, `${p}.each`, 'expected true');
      // With `each`, no pick means every match gets DON!!; `pick: { upTo }` caps the targets (G16).
      if (
        x.each === true &&
        isObj(x.to) &&
        isObj((x.to as Obj).pick) &&
        !('upTo' in (x.to.pick as Obj))
      )
        err(c, `${p}.to.pick`, 'with each, the selector has no pick, or an upTo pick');
      return;
    case 'addDon':
      return arr(c, p, x, (y, q) => {
        fields(c, q, y, ['n', 'state'], ['upTo']);
        if (!isObj(y)) return;
        int(c, `${q}.n`, y.n);
        enumOf(c, `${q}.state`, y.state, ['active', 'rested']);
      });
    case 'returnDon':
      fields(c, p, x, ['n']);
      if (isObj(x) && x.n !== 'toMatchOpponent') num(c, `${p}.n`, x.n);
      return;
    case 'grant':
      fields(c, p, x, ['target', 'keyword', 'duration']);
      if (!isObj(x)) return;
      selector(c, `${p}.target`, x.target);
      zonesIn(c, `${p}.target`, x.target, FIELD_ZONES, 'modifiers apply to cards on the field');
      enumOf(c, `${p}.keyword`, x.keyword, KEYWORDS);
      return enumOf(c, `${p}.duration`, x.duration, DURATIONS);
    case 'negate':
      fields(c, p, x, ['target', 'duration']);
      if (!isObj(x)) return;
      selector(c, `${p}.target`, x.target);
      zonesIn(c, `${p}.target`, x.target, FIELD_ZONES, 'modifiers apply to cards on the field');
      return enumOf(c, `${p}.duration`, x.duration, DURATIONS);
    case 'restrict':
      fields(c, p, x, ['target', 'what', 'duration']);
      if (!isObj(x)) return;
      if (typeof x.target === 'string') {
        enumOf(c, `${p}.target`, x.target, P);
        const w = x.what;
        if (w !== 'cannotDrawByOwnEffects' && !(isObj(w) && 'cannotPlay' in w))
          err(c, `${p}.what`, 'a restriction on a player is cannotDrawByOwnEffects or cannotPlay');
      } else {
        selector(c, `${p}.target`, x.target);
        zonesIn(c, `${p}.target`, x.target, FIELD_ZONES, 'modifiers apply to cards on the field');
        if (x.what === 'cannotDrawByOwnEffects' || (isObj(x.what) && 'cannotPlay' in x.what))
          err(c, `${p}.what`, 'that restriction applies to a player, not to cards');
      }
      restriction(c, `${p}.what`, x.what);
      return enumOf(c, `${p}.duration`, x.duration, DURATIONS);
    case 'activate':
      fields(c, p, x, ['ability', 'of']);
      if (!isObj(x)) return;
      enumOf(c, `${p}.ability`, x.ability, ['main', 'onPlay', 'onKO', 'counter']);
      return enumOf(c, `${p}.of`, x.of, ['self']);
  }
}

const FIELD_ZONES = ['leader', 'characters', 'stage', 'field', 'self'];

/** Every zone of a selector must be one of `allowed` (the runtime would mishandle others, M4a-07). */
function zonesIn(c: Ctx, path: string, sel: unknown, allowed: string[], why: string): void {
  if (!isObj(sel)) return;
  const zones = Array.isArray(sel.from) ? sel.from : [sel.from];
  for (const z of zones)
    if (typeof z === 'string' && !allowed.includes(z)) err(c, `${path}.from`, `${z}: ${why}`);
}

/**
 * The (from, to) pairs the runtime's `move` implements (E-D5, M4a-07). Anything else is rejected,
 * so a script can never be silently misexecuted:
 * - the deck top to the top of Life ("add up to 1 card from the top of your deck to your Life");
 * - hand or trash to hand, trash, or the top or bottom of the deck;
 * - Characters or Stage to hand, trash, or the top or bottom of the deck (a removal, E-D3).
 */
function moveShape(c: Ctx, path: string, what: unknown, to: unknown): void {
  if (!isObj(what) || !isObj(to)) return;
  const zones = (Array.isArray(what.from) ? what.from : [what.from]) as string[];
  const dz = to.zone;
  const pos = to.position;
  const all = (set: string[]) => zones.every((z) => set.includes(z));
  if (zones.includes('deckTop')) {
    if (zones.length !== 1 || dz !== 'life' || pos !== 'top')
      return err(c, path, 'a move from the deck top is implemented only to the top of Life');
    const pk = what.pick as Record<string, unknown> | undefined;
    if (!pk || (pk.upTo !== 1 && pk.exactly !== 1))
      err(
        c,
        `${path}.what.pick`,
        'a move from the deck top needs { upTo: 1 } or { exactly: 1 } (exactly: mandatory, CR 8-1-2)',
      );
    return;
  }
  if (zones.includes('lifeTop')) {
    if (zones.length !== 1 || dz !== 'hand' || pos !== undefined || to.faceUp !== undefined)
      return err(c, path, "a move from the top of Life is implemented only to the owner's hand");
    const pk = what.pick as Record<string, unknown> | undefined;
    if (!pk || (pk.upTo !== 1 && pk.exactly !== 1))
      err(
        c,
        `${path}.what.pick`,
        'a move from the top of Life needs { upTo: 1 } or { exactly: 1 }',
      );
    return;
  }
  if (to.faceUp !== undefined && dz !== 'life')
    err(c, `${path}.to.faceUp`, 'faceUp applies only to Life');
  if (!all(['hand', 'trash']) && !all(['characters', 'stage']))
    return err(c, `${path}.what.from`, `moving from ${zones.join(', ')} is not implemented yet`);
  if (dz === 'life') {
    if (!all(['hand', 'trash']))
      return err(c, `${path}.to`, 'only a hand or trash card moves into Life');
    if (pos !== undefined && pos !== 'top')
      err(c, `${path}.to.position`, 'a card enters Life at the top');
    return;
  }
  if (dz === 'deck' && pos !== 'top' && pos !== 'bottom' && pos !== 'topOrBottom')
    err(
      c,
      `${path}.to.position`,
      'a move to the deck needs position "top", "bottom" or "topOrBottom"',
    );
  if (pos === 'topOrBottom' && !all(['hand', 'trash']))
    err(c, `${path}.to.position`, 'topOrBottom is implemented for cards from a hand or trash');
  if (dz !== 'deck' && pos !== undefined)
    err(c, `${path}.to.position`, 'position applies only to the deck');
}

function restriction(c: Ctx, path: string, v: unknown): void {
  const all = [
    'cannotAttack',
    'cannotActivateBlockerAgainstIt',
    'cannotDrawByOwnEffects',
    'cannotBeRemovedByOpponentEffects',
    'cannotBeKOd',
    'cannotBeRested',
    'cannotActivateBlocker',
  ];
  if (typeof v === 'string') {
    enumOf(c, path, v, all);
    if (all.includes(v) && !has(IMPLEMENTED.restrictions, v))
      err(c, path, `restriction ${v} is not implemented in the runtime yet`);
    return;
  }
  const k = oneOf(c, path, v, ['cannotPlay', 'cannotBeKOd', 'cannotBeRested']);
  if (!k || !isObj(v)) return;
  if (k === 'cannotPlay') filter(c, `${path}.cannotPlay`, v.cannotPlay);
  else if (k === 'cannotBeKOd') {
    // Scoped by cause (G6): "by effects", "by your opponent's effects", "in battle".
    fields(c, `${path}.cannotBeKOd`, v.cannotBeKOd, ['cause']);
    if (isObj(v.cannotBeKOd))
      enumOf(c, `${path}.cannotBeKOd.cause`, v.cannotBeKOd.cause, [
        'effect',
        'opponentEffect',
        'battle',
      ]);
  } else {
    // Scoped by source (G2): only "by your opponent's effects" is implemented.
    fields(c, `${path}.cannotBeRested`, v.cannotBeRested, ['by']);
    if (isObj(v.cannotBeRested))
      enumOf(c, `${path}.cannotBeRested.by`, v.cannotBeRested.by, ['opponentEffect']);
  }
}

function continuous(c: Ctx, path: string, v: unknown): void {
  const k = oneOf(c, path, v, [
    'power',
    'setBasePower',
    'cost',
    'playCost',
    'counter',
    'grant',
    'restrict',
    'lockAttackTarget',
    'tiers',
  ]);
  if (!k) return;
  const x = (v as Obj)[k];
  const p = `${path}.${k}`;
  if (!has(IMPLEMENTED.continuous, k))
    return err(c, path, `permanent ${k} is not implemented in the runtime yet`);
  switch (k) {
    case 'counter':
      fields(c, p, x, ['target', 'value'], ['onlyIfNone']);
      if (!isObj(x)) return;
      selector(c, `${p}.target`, x.target);
      return int(c, `${p}.value`, x.value);
    case 'lockAttackTarget':
      fields(c, p, x, ['attacker', 'only']);
      if (!isObj(x)) return;
      enumOf(c, `${p}.attacker`, x.attacker, P);
      return selector(c, `${p}.only`, x.only);
    case 'power':
    case 'cost':
      fields(c, p, x, ['target', 'amount']);
      if (!isObj(x)) return;
      selector(c, `${p}.target`, x.target);
      zonesIn(
        c,
        `${p}.target`,
        x.target,
        FIELD_ZONES,
        'a permanent changes cards on the field (or this card)',
      );
      return num(c, `${p}.amount`, x.amount);
    case 'setBasePower':
      fields(c, p, x, ['target', 'value']);
      if (!isObj(x)) return;
      selector(c, `${p}.target`, x.target);
      zonesIn(c, `${p}.target`, x.target, FIELD_ZONES, 'a permanent changes cards on the field');
      return num(c, `${p}.value`, x.value);
    case 'grant':
      fields(c, p, x, ['target', 'keyword']);
      if (!isObj(x)) return;
      selector(c, `${p}.target`, x.target);
      zonesIn(c, `${p}.target`, x.target, FIELD_ZONES, 'a permanent changes cards on the field');
      return enumOf(c, `${p}.keyword`, x.keyword, KEYWORDS);
    case 'restrict':
      fields(c, p, x, ['target', 'what']);
      if (!isObj(x)) return;
      if (typeof x.target === 'string')
        err(c, `${p}.target`, 'a permanent restricts cards, not players');
      else {
        selector(c, `${p}.target`, x.target);
        zonesIn(
          c,
          `${p}.target`,
          x.target,
          FIELD_ZONES,
          'a permanent restricts cards on the field',
        );
      }
      // A permanent restriction is a card restriction: a player restriction ({ cannotPlay }) and
      // the draw restriction are modifiers on a Leader, which a permanent does not produce.
      if (isObj(x.what) && 'cannotPlay' in x.what)
        err(c, `${p}.what`, 'a permanent cannot restrict what a player may play');
      else if (x.what === 'cannotDrawByOwnEffects')
        err(c, `${p}.what`, 'a permanent cannot restrict drawing');
      else restriction(c, `${p}.what`, x.what);
      return;
    case 'tiers':
      return arr(c, p, x, (t, q) => {
        fields(c, q, t, ['when', 'apply']);
        if (!isObj(t)) return;
        condition(c, `${q}.when`, t.when);
        arr(c, `${q}.apply`, t.apply, (y, r) => {
          if (isObj(y) && 'tiers' in y) err(c, r, 'tiers do not nest');
          else continuous(c, r, y);
        });
      });
  }
}

function timing(c: Ctx, path: string, v: unknown): void {
  if (typeof v === 'string') return enumOf(c, path, v, NAMED);
  fields(c, path, v, ['event'], ['by', 'filter', 'attacker', 'target', 'owner']);
  if (!isObj(v)) return;
  const e = `event:${String(v.event)}`;
  if (!has(IMPLEMENTED.timings, e))
    return err(c, path, `${e} is not implemented in the runtime yet`);
  if (v.event === 'attack') {
    if (v.attacker === undefined && v.target === undefined)
      err(c, path, 'an attack event needs an attacker or a target');
    if (v.attacker !== undefined) selector(c, `${path}.attacker`, v.attacker);
    if (v.target !== undefined) selector(c, `${path}.target`, v.target);
  } else if (v.event === 'cardPlayed') {
    enumOf(c, `${path}.by`, v.by, P);
    if (v.filter !== undefined) filter(c, `${path}.filter`, v.filter);
  } else if (v.event === 'eventActivated' || v.event === 'blockerActivated') {
    enumOf(c, `${path}.by`, v.by, P);
  } else if (v.event === 'koed') {
    if (v.filter === undefined) err(c, path, 'a koed event needs a filter');
    else filter(c, `${path}.filter`, v.filter);
  } else if (v.event === 'lifeRemoved') {
    enumOf(c, `${path}.owner`, v.owner, [...P, 'any']);
  } else {
    enumOf(c, `${path}.owner`, v.owner, P);
  }
}

const ID = /^[a-z][a-z0-9-]*$/;

function ability(c: Ctx, path: string, v: unknown, ids: Set<string>): void {
  if (!isObj(v)) return err(c, path, 'expected an object');
  c.bound = new Set();
  c.labels = new Set();
  const base = ['id', 'label', 'oncePerTurn', 'conditions'];
  str(c, `${path}.id`, v.id);
  if (typeof v.id === 'string') {
    if (!ID.test(v.id)) err(c, `${path}.id`, `ability id "${v.id}" must match ${ID}`);
    if (ids.has(v.id)) err(c, `${path}.id`, `duplicate ability id "${v.id}"`);
    ids.add(v.id);
  }
  if (v.label !== undefined) str(c, `${path}.label`, v.label);
  if (v.oncePerTurn !== undefined && v.oncePerTurn !== true)
    err(c, `${path}.oncePerTurn`, 'expected true');
  if (v.conditions !== undefined)
    arr(c, `${path}.conditions`, v.conditions, (x, p) => condition(c, p, x));
  switch (v.kind) {
    case 'auto':
      fields(c, path, v, ['kind', 'when', 'effect', 'id'], [...base, 'optional', 'cost']);
      arr(c, `${path}.when`, v.when, (x, p) => timing(c, p, x));
      if (v.optional !== undefined && v.optional !== true)
        err(c, `${path}.optional`, 'expected true');
      if (v.cost !== undefined) costs(c, `${path}.cost`, v.cost);
      return steps(c, `${path}.effect`, v.effect);
    case 'activate': {
      fields(c, path, v, ['kind', 'when', 'effect', 'id'], [...base, 'cost', 'costOptional']);
      if (v.costOptional !== undefined && (v.costOptional !== true || !v.cost))
        err(c, `${path}.costOptional`, 'expected true, with a cost');
      const when = Array.isArray(v.when) ? v.when : [v.when];
      for (const w of when) enumOf(c, `${path}.when`, w, ['activateMain', 'main', 'counter']);
      if (v.cost !== undefined) costs(c, `${path}.cost`, v.cost);
      return steps(c, `${path}.effect`, v.effect);
    }
    case 'trigger':
      fields(c, path, v, ['kind', 'effect', 'id'], [...base, 'cost']);
      if (v.cost !== undefined) costs(c, `${path}.cost`, v.cost);
      return steps(c, `${path}.effect`, v.effect);
    case 'permanent':
      fields(c, path, v, ['kind', 'apply', 'id'], [...base, 'zone']);
      if (v.zone !== undefined) enumOf(c, `${path}.zone`, v.zone, ['field', 'hand']);
      return arr(c, `${path}.apply`, v.apply, (x, p) => continuous(c, p, x));
    case 'replacement': {
      fields(c, path, v, ['kind', 'replaces', 'optional', 'instead', 'id'], base);
      const k = oneOf(c, `${path}.replaces`, v.replaces, ['ko', 'leaveField', 'damage'], {
        ko: ['cause'],
        leaveField: ['cause'],
      });
      if (k === 'damage') {
        // D4: "if you would take damage": the damage to the replacing card's controller.
        if ((v.replaces as Obj).damage !== 'you')
          err(c, `${path}.replaces.damage`, 'expected "you"');
      } else if (k) {
        selector(c, `${path}.replaces.${k}`, (v.replaces as Obj)[k]);
        const cause = (v.replaces as Obj).cause;
        if (k === 'leaveField')
          enumOf(c, `${path}.replaces.cause`, cause, ['opponentEffect', 'any']);
        else if (cause !== undefined)
          enumOf(c, `${path}.replaces.cause`, cause, ['opponentEffect', 'effect', 'battle']);
      }
      c.noAlt = true;
      if (typeof v.optional !== 'boolean') err(c, `${path}.optional`, 'expected a boolean');
      if (!Array.isArray(v.instead)) err(c, `${path}.instead`, 'expected an array');
      else if (isEffect(v.instead)) steps(c, `${path}.instead`, v.instead);
      else costs(c, `${path}.instead`, v.instead);
      c.noAlt = false;
      return;
    }
    default:
      err(c, `${path}.kind`, `unknown ability kind ${JSON.stringify(v.kind)}`);
  }
}

const STEP_KEYS = ['do', 'if', 'may', 'ifDid', 'chooseOne', 'forEach', 'delayed'];
/** A replacement's `instead` is an effect when its elements are steps, else a cost list. */
export function isEffect(list: readonly unknown[]): boolean {
  return list.length > 0 && list.every((x) => isObj(x) && STEP_KEYS.some((k) => k in x));
}

/**
 * A `deckRestriction` filter (G12) is read over the cards of a deck, whose data is printed values
 * only: no state, no `ref`, no `Num` inside a comparison. These keys are the ones the deck check
 * (`engine/src/deck.ts` `cardMatchesDeckFilter`) implements.
 */
const DECK_FILTER_KEYS = [
  'category',
  'cost',
  'baseCost',
  'power',
  'basePower',
  'hasCounter',
  'type',
  'typeIncludes',
  'name',
  'nameIncludes',
  'color',
  'attribute',
  'multicolor',
  'hasTrigger',
  'all',
  'any',
  'not',
];

function deckFilter(c: Ctx, path: string, v: unknown): void {
  if (!isObj(v)) return err(c, path, 'expected a filter');
  const k = Object.keys(v)[0];
  if (k !== undefined && !DECK_FILTER_KEYS.includes(k))
    return err(c, path, `${k}: a deck restriction reads printed card values only`);
  filter(c, path, v);
  if (k === 'all' || k === 'any')
    (v[k] as unknown[]).forEach((x, i) => deckFilter(c, `${path}.${k}[${i}]`, x));
  else if (k === 'not') deckFilter(c, `${path}.not`, v.not);
  else if (k && ['cost', 'baseCost', 'power', 'basePower'].includes(k)) {
    const cm = v[k];
    const kind = isObj(cm) ? Object.keys(cm)[0] : undefined;
    if (!isObj(cm) || kind === undefined || typeof cm[kind] !== 'number')
      err(c, `${path}.${k}`, 'a deck restriction compares to a number');
  }
}

/** Problems with a script; an empty list means it is valid. */
export function validateScript(script: unknown): string[] {
  const c: Ctx = { errors: [], bound: new Set(), labels: new Set(), inCost: false };
  const path = isObj(script) && typeof script.cardId === 'string' ? script.cardId : 'script';
  fields(
    c,
    path,
    script,
    ['cardId', 'textHash', 'verified', 'abilities'],
    ['keywords', 'rules', 'rulings'],
  );
  if (!isObj(script)) return c.errors;
  if (
    typeof script.cardId !== 'string' ||
    !/^(OP\d{2}|ST\d{2}|EB\d{2}|PRB\d{2}|P)-\d{3}$/.test(script.cardId)
  )
    err(c, path, 'bad cardId');
  str(c, `${path}.textHash`, script.textHash);
  fields(c, `${path}.verified`, script.verified, ['source', 'date'], ['note']);
  if (script.keywords !== undefined)
    arr(c, `${path}.keywords`, script.keywords, (k, p) => enumOf(c, p, k, KEYWORDS));
  if (script.rules !== undefined)
    arr(c, `${path}.rules`, script.rules, (r, p) => {
      const k = oneOf(c, p, r, ['donDeckSize', 'alsoNamed', 'anyNumberInDeck', 'deckRestriction']);
      if (!k) return;
      if (k === 'donDeckSize') int(c, `${p}.donDeckSize`, (r as Obj).donDeckSize);
      else if (k === 'alsoNamed')
        arr(c, `${p}.alsoNamed`, (r as Obj).alsoNamed, (n, q) => str(c, q, n));
      else if (k === 'anyNumberInDeck') {
        // G12: "you may have any number of this card in your deck" (deck construction, CR 5-1-2-3).
        if ((r as Obj).anyNumberInDeck !== true) err(c, `${p}.anyNumberInDeck`, 'expected true');
      } else deckFilter(c, `${p}.deckRestriction`, (r as Obj).deckRestriction);
    });
  if (script.rulings !== undefined)
    arr(c, `${path}.rulings`, script.rulings, (r, p) => str(c, p, r));
  const ids = new Set<string>();
  arr(c, `${path}.abilities`, script.abilities, (a, p) => ability(c, p, a, ids));
  return c.errors;
}
