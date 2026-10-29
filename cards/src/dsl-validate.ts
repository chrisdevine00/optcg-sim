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
import { CATEGORIES, COLORS, KEYWORDS } from './validate.ts';

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
  ],
  picks: ['upTo', 'exactly'],
  costs: ['donMinus', 'restDon', 'trash', 'reveal', 'restSelf', 'trashSelf', 'returnDon'],
  steps: ['do', 'if', 'may', 'ifDid', 'chooseOne', 'delayed'],
  actions: [
    'draw',
    'trashFromHand',
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
  ],
  continuous: ['counter', 'lockAttackTarget'],
  restrictions: ['cannotAttack'],
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
    { donOnField: ['state'], refStat: ['stat'] },
  );
  if (!k) return;
  const o = v as Obj;
  if (!has(IMPLEMENTED.nums, k)) err(c, path, `${k} is not implemented in the runtime yet`);
  switch (k) {
    case 'count':
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
    'color',
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
      'mill',
      'returnDon',
      'move',
    ],
    { move: ['to'] },
  );
  if (!k) return;
  const o = v as Obj;
  const p = `${path}.${k}`;
  if (!has(IMPLEMENTED.costs, k)) err(c, path, `cost ${k} is not implemented in the runtime yet`);
  switch (k) {
    case 'donMinus':
    case 'returnDon':
    case 'turnLifeFaceUp':
    case 'mill':
      return int(c, p, o[k]);
    case 'restDon':
      if (o.restDon !== 'any') int(c, p, o.restDon);
      return;
    case 'trash':
    case 'reveal':
    case 'rest':
      selector(c, p, o[k]);
      if (isObj(o[k]) && !(o[k] as Obj).pick) err(c, p, 'a cost selector needs a pick');
      return;
    case 'restSelf':
    case 'trashSelf':
      if (o[k] !== true) err(c, p, 'expected true');
      return;
    case 'lifeToHand':
      fields(c, p, o[k], ['from', 'n']);
      return;
    case 'move':
      selector(c, p, o.move);
      return dest(c, `${path}.to`, o.to);
  }
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
    chooseOne: ['chooser', 'labels'],
    forEach: ['do'],
    delayed: ['do'],
  });
  if (!k) return;
  const o = v as Obj;
  if (!has(IMPLEMENTED.steps, k)) err(c, path, `step ${k} is not implemented in the runtime yet`);
  switch (k) {
    case 'do':
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
    case 'ko':
    case 'rest':
    case 'setActive':
    case 'skipRefresh':
    case 'select':
      return selector(c, p, x);
    case 'mill':
      return fields(c, p, x, ['player', 'n']);
    case 'lookAtTop': {
      fields(c, p, x, ['n', 'take', 'rest'], ['player']);
      if (!isObj(x)) return;
      int(c, `${p}.n`, x.n);
      if (x.player !== undefined) enumOf(c, `${p}.player`, x.player, P);
      arr(c, `${p}.take`, x.take, (t, q) => {
        fields(c, q, t, ['pick', 'to'], ['filter', 'reveal']);
        if (!isObj(t)) return;
        pick(c, `${q}.pick`, t.pick);
        if (t.filter !== undefined) filter(c, `${q}.filter`, t.filter);
        enumOf(c, `${q}.to`, t.to, ['hand']);
        if (t.reveal !== undefined && t.reveal !== true) err(c, `${q}.reveal`, 'expected true');
      });
      return enumOf(c, `${p}.rest`, x.rest, ['bottomAnyOrder', 'topOrBottomAnyOrder']);
    }
    case 'reveal':
      fields(c, p, x, ['from', 'n', 'bind']);
      if (!isObj(x)) return;
      enumOf(c, `${p}.from`, x.from, ['deckTop']);
      if (x.n !== 1) err(c, `${p}.n`, 'only n = 1 is implemented');
      str(c, `${p}.bind`, x.bind);
      if (typeof x.bind === 'string') c.bound.add(x.bind);
      return;
    case 'move':
      fields(c, p, x, ['what', 'to']);
      if (!isObj(x)) return;
      selector(c, `${p}.what`, x.what);
      return dest(c, `${p}.to`, x.to);
    case 'trashLifeUntil':
      return int(c, p, x);
    case 'play':
      fields(c, p, x, ['what'], ['rested']);
      if (isObj(x)) selector(c, `${p}.what`, x.what);
      return;
    case 'power':
    case 'cost':
      fields(c, p, x, ['target', 'amount', 'duration']);
      if (!isObj(x)) return;
      selector(c, `${p}.target`, x.target);
      num(c, `${p}.amount`, x.amount);
      return enumOf(c, `${p}.duration`, x.duration, DURATIONS);
    case 'setBasePower':
      fields(c, p, x, ['target', 'value', 'duration']);
      if (!isObj(x)) return;
      selector(c, `${p}.target`, x.target);
      num(c, `${p}.value`, x.value);
      return enumOf(c, `${p}.duration`, x.duration, DURATIONS);
    case 'playCost':
      return fields(c, p, x, ['next', 'from', 'amount', 'window', 'uses']);
    case 'giveDon':
      return fields(c, p, x, ['n', 'state', 'to'], ['each']);
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
      enumOf(c, `${p}.keyword`, x.keyword, KEYWORDS);
      return enumOf(c, `${p}.duration`, x.duration, DURATIONS);
    case 'negate':
      fields(c, p, x, ['target', 'duration']);
      if (!isObj(x)) return;
      selector(c, `${p}.target`, x.target);
      return enumOf(c, `${p}.duration`, x.duration, DURATIONS);
    case 'restrict':
      fields(c, p, x, ['target', 'what', 'duration']);
      if (!isObj(x)) return;
      if (typeof x.target === 'string') enumOf(c, `${p}.target`, x.target, P);
      else selector(c, `${p}.target`, x.target);
      restriction(c, `${p}.what`, x.what);
      return enumOf(c, `${p}.duration`, x.duration, DURATIONS);
    case 'activate':
      fields(c, p, x, ['ability', 'of']);
      if (!isObj(x)) return;
      enumOf(c, `${p}.ability`, x.ability, ['main']);
      return enumOf(c, `${p}.of`, x.of, ['self']);
  }
}

function restriction(c: Ctx, path: string, v: unknown): void {
  const all = [
    'cannotAttack',
    'cannotActivateBlockerAgainstIt',
    'cannotDrawByOwnEffects',
    'cannotBeRemovedByOpponentEffects',
    'cannotBeKOd',
  ];
  if (typeof v === 'string') {
    enumOf(c, path, v, all);
    if (all.includes(v) && !has(IMPLEMENTED.restrictions, v))
      err(c, path, `restriction ${v} is not implemented in the runtime yet`);
    return;
  }
  err(c, path, 'restriction cannotPlay is not implemented in the runtime yet');
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
  if (k === 'counter') {
    fields(c, p, x, ['target', 'value'], ['onlyIfNone']);
    if (!isObj(x)) return;
    selector(c, `${p}.target`, x.target);
    return int(c, `${p}.value`, x.value);
  }
  fields(c, p, x, ['attacker', 'only']);
  if (!isObj(x)) return;
  enumOf(c, `${p}.attacker`, x.attacker, P);
  selector(c, `${p}.only`, x.only);
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
      const k = oneOf(c, `${path}.replaces`, v.replaces, ['ko', 'leaveField'], {
        leaveField: ['cause'],
      });
      if (k) {
        selector(c, `${path}.replaces.${k}`, (v.replaces as Obj)[k]);
        if (k === 'leaveField')
          enumOf(c, `${path}.replaces.cause`, (v.replaces as Obj).cause, ['opponentEffect']);
      }
      if (typeof v.optional !== 'boolean') err(c, `${path}.optional`, 'expected a boolean');
      if (!Array.isArray(v.instead)) return err(c, `${path}.instead`, 'expected an array');
      if (isEffect(v.instead)) steps(c, `${path}.instead`, v.instead);
      else costs(c, `${path}.instead`, v.instead);
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
  if (script.rules !== undefined) err(c, `${path}.rules`, 'rules clauses are not implemented yet');
  if (script.rulings !== undefined)
    arr(c, `${path}.rulings`, script.rulings, (r, p) => str(c, p, r));
  const ids = new Set<string>();
  arr(c, `${path}.abilities`, script.abilities, (a, p) => ability(c, p, a, ids));
  return c.errors;
}
