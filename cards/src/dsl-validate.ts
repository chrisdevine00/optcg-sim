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
import { PRINTED_TIMINGS } from './printed.ts';
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
    // M6b wave 5 (G43).
    'event:damageTaken',
    // M6b wave 6 (G56).
    'event:triggerActivated',
    // M6b wave 3 (G22, G24, G29).
    'event:trashedFromHand',
    'event:rested',
    'event:removed',
    'event:leftField',
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
    // Only as the source of a `move` to your hand (G45): you choose the top or the bottom.
    'lifeTopOrBottom',
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
    'returnGivenDon',
    'lifeToHand',
    'turnLifeFaceUp',
    'turnLifeFaceDown',
    'giveDon',
    'ko',
    'mill',
    'rest',
    'move',
    'oneOf',
    // M6b wave 4 (G30).
    'trashLife',
    // M6b wave 7 (G62).
    'power',
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
    // M6b wave 5 (G41, G44).
    'turnLifeFaceDown',
    'chooseNumber',
    // M6b wave 4 (G33, G32, G35, G36, D6).
    'damage',
    'winGame',
    'swapBasePower',
    'canAttackActive',
    'addReplacement',
    // M6b wave 7 (G64, G65, D3).
    'lookAtLife',
    'moveDon',
    'redirectAttack',
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
    // M6b wave 6 (G50).
    'playRested',
    // M6b wave 7 (G66).
    'negate',
    // OP-18 wave G5: "the cost of playing <cards> from your hand will be reduced by N".
    'playCost',
  ],
  restrictions: [
    'cannotAttack',
    'cannotActivateBlockerAgainstIt',
    'cannotDrawByOwnEffects',
    'cannotBeRemovedByOpponentEffects',
    'cannotBeKOd',
    'cannotBeRested',
    'cannotActivateBlocker',
    // M6b wave 7 (G60, G63).
    'cannotAddLifeToHandByOwnEffects',
    'cannotBePlayedByEffects',
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
    'div',
    'eventCount',
    'donGivenToTarget',
    'targetPower',
    // M6b wave 5 (G41, G44).
    'lifeFaceUp',
    'chosen',
    // M6b wave 7 (G67).
    'statOf',
    'totalCost',
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
  /** The ability watches `trashedFromHand`, so `{ eventCount }` has a count to read (G22). */
  evCount?: boolean;
  /** The ability is an `onKO` auto, so `{ koCause }` has a K.O. to read (G28). */
  koOk?: boolean;
  /** Inside the amount of a `power` or `cost` action, which has a target to read (G34). */
  perTarget?: boolean;
  /** Names a `chooseNumber` action has bound so far (G44). */
  chosen: Set<string>;
  /** Names a `reveal` action has bound so far: the top card of the deck or Life, known to both (G53). */
  revealed: Set<string>;
  /** The kind of the ability being validated (a move of "this card" means different things). */
  abKind?: string;
  /** The ability is a permanent that works from the hand (G63). */
  abHand?: boolean;
  /** The ability is an auto on [On Your Opponent's Attack] (D3: only it has an attack to redirect). */
  onOppAttack?: boolean;
  /** Every timing of the auto ability is `onOpponentAttack`, so there is an attacker to read (G71). */
  attackerOk?: boolean;
  /** Every timing of the auto ability is a `cardPlayed` event, so the played card is the subject (D9). */
  subjectOk?: boolean;
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
      'div',
      'eventCount',
      'donGivenToTarget',
      'targetPower',
      'lifeFaceUp',
      'chosen',
      'statOf',
      'totalCost',
    ],
    { donOnField: ['state'], refStat: ['stat'], count: ['distinctNames'], statOf: ['stat'] },
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
    case 'lifeFaceUp':
    case 'turnIndex':
      return enumOf(c, `${path}.${k}`, o[k], P);
    case 'donOnField':
      enumOf(c, `${path}.donOnField`, o.donOnField, P);
      if (o.state !== undefined) enumOf(c, `${path}.state`, o.state, ['active', 'rested']);
      return;
    case 'refCount':
      return ref(c, `${path}.refCount`, o.refCount);
    case 'chosen':
      // The number a `chooseNumber` bound (G44).
      str(c, `${path}.chosen`, o.chosen);
      if (typeof o.chosen === 'string' && !c.chosen.has(o.chosen))
        err(c, `${path}.chosen`, `refers to "${o.chosen}", which no earlier chooseNumber binds`);
      return;
    case 'refStat':
      ref(c, `${path}.refStat`, o.refStat);
      return enumOf(c, `${path}.stat`, o.stat, ['cost', 'power', 'basePower', 'donGiven']);
    case 'statOf': {
      // A stat of the one card a zone holds (G67): the Leader, or this card. No pick, nothing bound.
      selector(c, `${path}.statOf`, o.statOf);
      enumOf(c, `${path}.stat`, o.stat, ['cost', 'power', 'basePower']);
      const sel = o.statOf;
      if (isObj(sel)) {
        const zs = Array.isArray(sel.from) ? sel.from : [sel.from];
        if (zs.length !== 1 || (zs[0] !== 'leader' && zs[0] !== 'self'))
          err(c, `${path}.statOf.from`, "statOf reads one card: from 'leader' or 'self'");
        if (sel.pick !== undefined || sel.bind !== undefined)
          err(c, `${path}.statOf`, 'statOf names its card by zone: no pick, no bind');
        if (sel.owner === 'any') err(c, `${path}.statOf.owner`, 'owner is "you" or "opponent"');
      }
      return;
    }
    case 'totalCost': {
      // The costs of every card the selector names (G67): a count over the field, no choice.
      selector(c, `${path}.totalCost`, o.totalCost);
      zonesIn(c, `${path}.totalCost`, o.totalCost, FIELD_ZONES, 'a total cost reads the field');
      const sel = o.totalCost;
      if (isObj(sel) && (sel.pick !== undefined || sel.bind !== undefined))
        err(c, `${path}.totalCost`, 'totalCost adds up every match: no pick, no bind');
      return;
    }
    case 'sum':
      return arr(c, `${path}.sum`, o.sum, (x, p) => num(c, p, x));
    case 'mul': {
      const m = o.mul;
      if (!Array.isArray(m) || m.length !== 2) return err(c, `${path}.mul`, 'expected [Num, int]');
      num(c, `${path}.mul[0]`, m[0]);
      return int(c, `${path}.mul[1]`, m[1]);
    }
    case 'div': {
      // Integer floor of a division (G23): the divisor is a whole number of 1 or more.
      const m = o.div;
      if (!Array.isArray(m) || m.length !== 2) return err(c, `${path}.div`, 'expected [Num, int]');
      num(c, `${path}.div[0]`, m[0]);
      int(c, `${path}.div[1]`, m[1]);
      if (typeof m[1] === 'number' && m[1] < 1)
        err(c, `${path}.div[1]`, 'the divisor is 1 or more');
      return;
    }
    case 'donGivenToTarget':
      // The DON!! given to the card an amount applies to (G34): only `power` and `cost` have one.
      if (o.donGivenToTarget !== true) err(c, `${path}.donGivenToTarget`, 'expected true');
      else if (!c.perTarget)
        err(c, path, 'donGivenToTarget is read in the amount of a power or cost action');
      return;
    case 'targetPower':
      // The current power of the card an amount applies to (B4T-R1): only `power` and `cost` have one.
      if (o.targetPower !== true) err(c, `${path}.targetPower`, 'expected true');
      else if (!c.perTarget)
        err(c, path, 'targetPower is read in the amount of a power or cost action');
      return;
    case 'eventCount':
      // The number of cards the triggering event moved (G22): only an auto ability has one.
      if (o.eventCount !== true) err(c, `${path}.eventCount`, 'expected true');
      else if (!c.evCount)
        err(c, path, 'eventCount is read by an auto ability that watches trashedFromHand');
      return;
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
    'hasBaseEffect',
    'hasTiming',
    'keyword',
    'state',
    'isSelf',
    'playedThisTurn',
    'donGiven',
    'ref',
    'sameNameAs',
    'all',
    'any',
    'not',
  ]);
  if (!k) return;
  const x = (v as Obj)[k];
  const p = `${path}.${k}`;
  switch (k) {
    case 'hasTiming':
      return enumOf(c, p, x, PRINTED_TIMINGS);
    case 'sameNameAs':
      // The name of a card an earlier selector bound (G54).
      return ref(c, p, x);
    case 'donGiven':
      return cmp(c, p, x);
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
    case 'hasBaseEffect':
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
    upTo: ['totalCost', 'totalPower', 'distinctNames'],
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
  if (o.totalPower !== undefined) {
    // "With a total power of 4000 or less" (G55): only an upper bound, and not beside a cost bound
    // (one budget per pick), counted over the chosen cards' current power.
    fields(c, `${path}.totalPower`, o.totalPower, ['lte']);
    if (isObj(o.totalPower)) num(c, `${path}.totalPower.lte`, o.totalPower.lte);
    if (o.totalCost !== undefined)
      err(c, `${path}.totalPower`, 'a pick has one budget: totalCost or totalPower');
    if (o.distinctNames !== undefined)
      err(c, `${path}.totalPower`, 'totalPower and distinctNames are not combined');
  }
  if (o.distinctNames !== undefined && o.distinctNames !== true)
    err(c, `${path}.distinctNames`, 'expected true');
}

function selector(c: Ctx, path: string, v: unknown): void {
  fields(
    c,
    path,
    v,
    ['from', 'owner'],
    ['filter', 'pick', 'chooser', 'blind', 'reveal', 'bind', 'lki'],
  );
  if (!isObj(v)) return;
  const zones = Array.isArray(v.from) ? v.from : [v.from];
  for (const z of zones) {
    enumOf(c, `${path}.from`, z, ZONES);
    if (typeof z === 'string' && ZONES.includes(z) && !has(IMPLEMENTED.zones, z))
      err(c, `${path}.from`, `zone ${z} is not implemented in the runtime yet`);
    if ((z === 'lifeTop' || z === 'lifeTopOrBottom') && !c.lifeOk)
      err(c, `${path}.from`, `${z} can only be the source of a move to a hand or the trash`);
  }
  enumOf(c, `${path}.owner`, v.owner, [...P, 'any']);
  if (v.filter !== undefined) filter(c, `${path}.filter`, v.filter);
  if (v.pick !== undefined) pick(c, `${path}.pick`, v.pick);
  if (v.chooser !== undefined) enumOf(c, `${path}.chooser`, v.chooser, P);
  if (v.blind !== undefined && v.blind !== true) err(c, `${path}.blind`, 'expected true');
  if (v.reveal !== undefined) {
    if (v.reveal !== true) err(c, `${path}.reveal`, 'expected true');
    else if (v.from !== 'hand' || v.owner !== 'you')
      err(c, `${path}.reveal`, "only for cards in your own hand ({ from: 'hand', owner: 'you' })");
  }
  if (v.lki !== undefined) {
    // The event's subject (D9): "that Character" after a card is played. Only an auto whose timings
    // are all `cardPlayed` has a played card to read, and the one card needs no choice.
    if (v.lki !== 'subject') err(c, `${path}.lki`, "expected 'subject'");
    else if (!c.subjectOk)
      err(
        c,
        `${path}.lki`,
        "lki 'subject' is read by an auto ability whose timings are all cardPlayed",
      );
    if (isObj(v.pick) && v.pick.exactly !== 1)
      err(c, `${path}.pick`, 'the subject is one card: no pick, or exactly 1');
    if (v.blind !== undefined) err(c, `${path}.blind`, 'the subject is not chosen blind');
  }
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
      'koCause',
      'koedThisTurn',
      'handTrashedThisTurn',
      'attackerIs',
      'eventsActivatedThisTurn',
    ],
    { ref: ['matches'], eventsActivatedThisTurn: ['baseCost'] },
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
    case 'koCause':
      enumOf(c, p, o.koCause, ['opponentEffect', 'effect']);
      if (!c.koOk) err(c, p, 'koCause is read by an [On K.O.] auto ability (timing "onKO")');
      return;
    case 'koedThisTurn':
      return enumOf(c, p, o.koedThisTurn, P);
    case 'attackerIs':
      if (!c.attackerOk)
        err(c, p, "attackerIs is read by an auto ability whose timings are all 'onOpponentAttack'");
      return filter(c, p, o.attackerIs);
    case 'handTrashedThisTurn':
      return enumOf(c, p, o.handTrashedThisTurn, P);
    case 'eventsActivatedThisTurn':
      enumOf(c, p, o.eventsActivatedThisTurn, P);
      if (o.baseCost !== undefined) cmp(c, `${path}.baseCost`, o.baseCost);
      return;
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
      'returnGivenDon',
      'giveDon',
      'ko',
      'move',
      'oneOf',
      'trashLife',
      'power',
    ],
    { move: ['to'] },
  );
  if (!k) return;
  const o = v as Obj;
  const p = `${path}.${k}`;
  if (!has(IMPLEMENTED.costs, k)) err(c, path, `cost ${k} is not implemented in the runtime yet`);
  switch (k) {
    case 'turnLifeFaceUp':
    case 'turnLifeFaceDown':
      if (isObj(o[k])) {
        // "Turn 1 card from the top or bottom of your Life cards face-up/down" (G68).
        const spec = o[k] as Obj;
        fields(c, p, spec, ['n', 'from']);
        enumOf(c, `${p}.from`, spec.from, ['top', 'bottom', 'topOrBottom']);
        int(c, `${p}.n`, spec.n);
        if (spec.n !== 1) err(c, `${p}.n`, 'only n = 1 is implemented');
        return;
      }
      int(c, p, o[k]);
      if (k === 'turnLifeFaceDown' && (o[k] as number) < 1) err(c, p, 'must be at least 1');
      return;
    case 'trashLife':
      // A number of Life cards, or 'all' of them (OP-18 wave G4).
      if (o[k] === 'all') return;
      int(c, p, o[k]);
      if ((o[k] as number) < 1) err(c, p, 'must be at least 1 (or "all")');
      return;
    case 'donMinus':
    case 'mill':
      int(c, p, o[k]);
      return;
    case 'returnDon':
      // A number: DON!! from anywhere on the field. `{ n, state: 'active' }`: active cost-area DON!! (G9).
      if (isObj(o.returnDon) && 'atLeast' in o.returnDon) {
        // "Return 1 or more DON!! cards" (G42): the player chooses how many. A cost of an ability
        // (it is chosen, which a replacement's payload does not ask).
        fields(c, p, o.returnDon, ['atLeast']);
        int(c, `${p}.atLeast`, o.returnDon.atLeast);
        if (typeof o.returnDon.atLeast === 'number' && o.returnDon.atLeast < 1)
          err(c, `${p}.atLeast`, 'must be at least 1');
        if (c.noAlt) err(c, p, 'a replacement payload returns a fixed number of DON!!');
      } else if (isObj(o.returnDon)) {
        fields(c, p, o.returnDon, ['n', 'state']);
        int(c, `${p}.n`, o.returnDon.n);
        enumOf(c, `${p}.state`, o.returnDon.state, ['active']);
      } else int(c, p, o.returnDon);
      return;
    case 'returnGivenDon':
      int(c, p, o.returnGivenDon);
      if (typeof o.returnGivenDon === 'number' && o.returnGivenDon < 1)
        err(c, p, 'must be at least 1');
      if (c.noAlt) err(c, p, 'a replacement payload does not return given DON!!');
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
      // "K.O. 1 of your Characters": a real K.O. of one of your own Characters (G1), or "K.O. 1 of
      // your Stages" (OP18-066, OP-18 wave G2; effects K.O. Stages as they do Characters).
      selector(c, p, o.ko);
      if (isObj(o.ko) && !(o.ko as Obj).pick) err(c, p, 'a cost selector needs a pick');
      zonesIn(c, p, o.ko, ['characters', 'stage'], 'a K.O. cost K.O.s Characters or a Stage');
      ownerYou(c, p, o.ko, 'a K.O. cost K.O.s your own Characters or Stage');
      return;
    case 'giveDon': {
      fields(c, p, o.giveDon, ['n', 'state', 'to'], ['from']);
      const g = o.giveDon;
      if (!isObj(g)) return;
      int(c, `${p}.n`, g.n);
      if (typeof g.n === 'number' && g.n < 1) err(c, `${p}.n`, 'must be at least 1');
      // The opponent's rested DON!! go to the opponent's own card (G20); yours go to yours (G7).
      const opp = g.from === 'opponent';
      if (g.from !== undefined && !opp) err(c, `${p}.from`, 'expected "opponent"');
      enumOf(c, `${p}.state`, g.state, [opp ? 'rested' : 'active']);
      selector(c, `${p}.to`, g.to);
      if (isObj(g.to) && !(g.to as Obj).pick) err(c, `${p}.to`, 'a cost selector needs a pick');
      zonesIn(c, `${p}.to`, g.to, ['leader', 'characters'], 'DON!! go to a Leader or Character');
      if (opp) {
        if (isObj(g.to) && g.to.owner !== 'opponent')
          err(
            c,
            `${p}.to.owner`,
            'the opponent\'s DON!! go to the opponent\'s cards: owner must be "opponent"',
          );
      } else ownerYou(c, `${p}.to`, g.to, 'a giveDon cost gives DON!! to your own cards');
      if (isObj(g.to) && isObj(g.to.pick) && g.to.pick.exactly !== 1)
        err(c, `${p}.to.pick`, 'a giveDon cost gives to exactly 1 card');
      return;
    }
    case 'restSelf':
    case 'trashSelf':
      if (o[k] !== true) err(c, p, 'expected true');
      return;
    case 'power': {
      // "Give your active Leader -5000 power during this turn" (G62): a power change paid on your
      // Leader. Narrow on purpose: your Leader, one card, a fixed amount.
      fields(c, p, o.power, ['target', 'amount', 'duration']);
      const g = o.power;
      if (!isObj(g)) return;
      selector(c, `${p}.target`, g.target);
      zonesIn(c, `${p}.target`, g.target, ['leader'], 'a power cost is paid on your Leader');
      ownerYou(c, `${p}.target`, g.target, 'a power cost is paid on your own Leader');
      if (isObj(g.target) && !(isObj(g.target.pick) && g.target.pick.exactly === 1))
        err(c, `${p}.target.pick`, 'a power cost takes pick { exactly: 1 }');
      int(c, `${p}.amount`, g.amount);
      if (g.amount === 0) err(c, `${p}.amount`, 'a power cost changes the power');
      enumOf(c, `${p}.duration`, g.duration, DURATIONS);
      return;
    }
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
      // One card, or 'all' of them from the top (OP-18 wave G4).
      if (spec.n === 'all') {
        if (spec.from !== 'top') err(c, `${p}.from`, 'n "all" takes every card from the top');
        return;
      }
      int(c, `${p}.n`, spec.n);
      if (spec.n !== 1) err(c, `${p}.n`, 'only n = 1 or "all" is implemented');
      return;
    }
    case 'move': {
      selector(c, p, o.move);
      if (isObj(o.move) && !(o.move as Obj).pick) err(c, p, 'a cost selector needs a pick');
      // A Character may also go into its owner's Life, an opponent's too (G61, OP09-101).
      const toLife = isObj(o.to) && o.to.zone === 'life';
      const fieldSide = fieldOrHand(c, p, o.move, 'a move cost', ['hand', 'trash'], true, toLife);
      dest(c, `${path}.to`, o.to);
      if (fieldSide && isObj(o.to)) {
        // Your own Character or Stage goes to your hand, to the top or bottom of your deck, or to
        // the trash (a removal with the cause `cost`, G1). One card only: several cards going to a
        // deck would need an order, which a cost does not ask for.
        if (o.to.zone === 'life') {
          const pk = isObj(o.move) && isObj(o.move.pick) ? o.move.pick : undefined;
          if (pk?.exactly !== 1)
            err(c, `${p}.pick`, 'a cost that puts a Character into Life takes exactly 1');
        }
        const pk = isObj(o.move) && isObj(o.move.pick) ? o.move.pick : undefined;
        if (o.to.zone === 'deck' && pk?.exactly !== 1)
          err(c, `${p}.pick`, 'a cost that puts a field card into the deck takes exactly 1');
        if (o.to.zone === 'deck' && o.to.position === 'topOrBottom')
          err(c, `${path}.to.position`, 'a field cost picks the top or the bottom');
      }
      // "Place this Character or Stage at the bottom of the owner's deck" (G52): the card itself,
      // alone in the selector, taken whole (a filter on "this card" says nothing).
      if (isObj(o.move)) {
        const zs = Array.isArray(o.move.from) ? o.move.from : [o.move.from];
        if (zs.includes('self')) {
          if (zs.length !== 1) err(c, `${p}.from`, 'this card cannot be mixed with other zones');
          if (o.move.filter !== undefined) err(c, `${p}.filter`, 'this card takes no filter');
        }
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
  self = false,
  /** The cards may be your opponent's: a Character placed into its owner's Life (G61). */
  anyOwner = false,
): boolean {
  if (!isObj(sel)) return false;
  const zones = (Array.isArray(sel.from) ? sel.from : [sel.from]) as string[];
  const hand = zones.every((z) => handSide.includes(z));
  // `self` is "this Character or Stage" (G52): it is on the field when the cost is paid.
  const field = zones.every((z) => z === 'characters' || z === 'stage' || (self && z === 'self'));
  if (!hand && !field)
    err(
      c,
      `${path}.from`,
      `${what} reads ${handSide.join(' or ')}, or your Characters or Stage, not ${zones.join(', ')}`,
    );
  if (field && anyOwner) {
    if (sel.owner === 'any')
      err(c, `${path}.owner`, `${what} names a player: owner must be "you" or "opponent"`);
    if (zones.some((z) => z !== 'characters'))
      err(c, `${path}.from`, `${what} into Life moves Characters only`);
  } else if (field) ownerYou(c, path, sel, `${what} from the field takes your own cards`);
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
      if (isObj(o.delayed))
        enumOf(c, `${path}.delayed.at`, o.delayed.at, [
          'endOfThisTurn',
          'startOfOpponentsNextMainPhase',
        ]);
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
      'turnLifeFaceDown',
      'chooseNumber',
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
      'damage',
      'winGame',
      'swapBasePower',
      'canAttackActive',
      'addReplacement',
      'lookAtLife',
      'moveDon',
      'redirectAttack',
    ],
    { draw: ['player', 'upTo'], addDon: ['player'] },
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
      selector(c, p, x);
      return skipRefreshDon(c, p, x);
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
      // The opponent's deck is look-only (G31): nothing is taken and the cards stay where they are.
      if (x.player !== undefined) enumOf(c, `${p}.player`, x.player, P);
      if (
        x.player === 'opponent' &&
        (!Array.isArray(x.take) || x.take.length > 0 || x.rest !== 'stay')
      )
        err(
          c,
          `${p}.player`,
          "a look at the opponent's deck takes nothing: take is [] and rest is 'stay'",
        );
      if (x.rest === 'stay' && Array.isArray(x.take) && x.take.length > 0)
        err(c, `${p}.rest`, "'stay' leaves every card where it is, so nothing can be taken");
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
      return enumOf(c, `${p}.rest`, x.rest, [
        'bottomAnyOrder',
        'topOrBottomAnyOrder',
        'topAnyOrder',
        'stay',
        'trash',
      ]);
    }
    case 'reveal':
      fields(c, p, x, ['from', 'n', 'bind'], ['player']);
      if (!isObj(x)) return;
      enumOf(c, `${p}.from`, x.from, ['deckTop', 'lifeTop']);
      if (x.n !== 1) err(c, `${p}.n`, 'only n = 1 is implemented');
      // The top card of the opponent's deck, shown to both (G44): never the opponent's Life.
      if (x.player !== undefined) {
        if (x.player !== 'opponent') err(c, `${p}.player`, 'expected "opponent"');
        else if (x.from !== 'deckTop')
          err(c, `${p}.player`, "only the top card of the opponent's deck is revealed");
      }
      str(c, `${p}.bind`, x.bind);
      if (typeof x.bind === 'string') {
        c.bound.add(x.bind);
        c.revealed.add(x.bind);
      }
      return;
    case 'chooseNumber':
      // "Choose a cost" (G44): a whole number in a small range, bound by name.
      fields(c, p, x, ['min', 'max', 'bind']);
      if (!isObj(x)) return;
      int(c, `${p}.min`, x.min);
      int(c, `${p}.max`, x.max);
      if (typeof x.min === 'number' && typeof x.max === 'number') {
        if (x.min < 0 || x.max > 10 || x.min > x.max)
          err(c, p, 'the range is 0 to 10, with min no more than max');
      }
      str(c, `${p}.bind`, x.bind);
      if (typeof x.bind === 'string') {
        if (c.chosen.has(x.bind) || c.bound.has(x.bind))
          err(c, `${p}.bind`, `"${x.bind}" is already bound`);
        c.chosen.add(x.bind);
      }
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
    case 'turnLifeFaceDown':
      // G41: only "all of your Life cards" (the cost form turns the top N).
      if (x !== 'all') err(c, p, "expected 'all'");
      return;
    case 'play': {
      fields(c, p, x, ['what'], ['rested', 'player']);
      if (!isObj(x)) return;
      // The top of the deck or Life is only the card an earlier `reveal` showed (G53).
      c.lifeOk = true;
      selector(c, `${p}.what`, x.what);
      c.lifeOk = false;
      zonesIn(
        c,
        `${p}.what`,
        x.what,
        ['hand', 'trash', 'self', 'deckTop', 'lifeTop'],
        'the runtime plays cards from hand, trash, "this card" ([Trigger]) or a revealed top card only',
      );
      if (x.rested !== undefined && x.rested !== true) err(c, `${p}.rested`, 'expected true');
      const w = x.what;
      if (isObj(w)) {
        const zs = (Array.isArray(w.from) ? w.from : [w.from]) as string[];
        const pk = isObj(w.pick) ? w.pick : undefined;
        if (zs.includes('deckTop') || zs.includes('lifeTop')) {
          if (zs.length !== 1 || w.owner !== 'you' || w.chooser !== undefined)
            err(c, `${p}.what`, 'the revealed top card is yours alone: one zone, owner "you"');
          if (!readsRevealed(w.filter, c.revealed))
            err(
              c,
              `${p}.what.filter`,
              'only the card a reveal bound can be played from the top: the filter needs { ref } naming it',
            );
          if (!pk || (pk.exactly !== 1 && pk.upTo !== 1))
            err(
              c,
              `${p}.what.pick`,
              'the revealed card is played with { exactly: 1 } or { upTo: 1 }',
            );
        }
        if (x.player !== undefined) {
          // Your opponent plays a card from their own hand and chooses it (G51).
          if (x.player !== 'opponent') err(c, `${p}.player`, 'expected "opponent"');
          else {
            if (zs.length !== 1 || zs[0] !== 'hand' || w.owner !== 'opponent')
              err(
                c,
                `${p}.what`,
                "your opponent plays from their own hand: from 'hand', owner 'opponent'",
              );
            if (w.chooser !== 'opponent')
              err(
                c,
                `${p}.what.chooser`,
                'your opponent chooses the card: chooser must be "opponent"',
              );
            if (!pk || (pk.exactly === undefined && pk.upTo === undefined))
              err(c, `${p}.what.pick`, 'a play by the opponent picks upTo or exactly a number');
          }
        }
      }
      return;
    }
    case 'power':
    case 'cost':
      fields(c, p, x, ['target', 'amount', 'duration']);
      if (!isObj(x)) return;
      selector(c, `${p}.target`, x.target);
      zonesIn(c, `${p}.target`, x.target, FIELD_ZONES, 'modifiers apply to cards on the field');
      c.perTarget = true;
      num(c, `${p}.amount`, x.amount);
      c.perTarget = false;
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
      fields(c, p, x, ['n', 'state', 'to'], ['each', 'from', 'upTo']);
      if (!isObj(x)) return;
      num(c, `${p}.n`, x.n);
      // "up to N ... each" (OP-18 review R8): each target's count may be 0; only with `each`.
      if (x.upTo !== undefined && (x.upTo !== true || x.each !== true))
        err(c, `${p}.upTo`, 'expected true, with each');
      if (x.from !== undefined && x.from !== 'opponent') err(c, `${p}.from`, 'expected "opponent"');
      // The opponent's DON!! go to the opponent's own card, one target (G20); `any` (active or
      // rested, the giver's choice) is only for that form.
      if (x.from === 'opponent') {
        enumOf(c, `${p}.state`, x.state, ['rested', 'active', 'any']);
        if (x.each !== undefined) err(c, `${p}.each`, "not implemented for the opponent's DON!!");
        if (isObj(x.to)) {
          if (x.to.owner !== 'opponent')
            err(
              c,
              `${p}.to.owner`,
              'the opponent\'s DON!! go to the opponent\'s cards: owner must be "opponent"',
            );
          const pk = x.to.pick;
          if (!isObj(pk) || (pk.upTo !== 1 && pk.exactly !== 1))
            err(c, `${p}.to.pick`, "the opponent's DON!! go to 1 card: pick upTo 1 or exactly 1");
        }
      } else enumOf(c, `${p}.state`, x.state, ['rested', 'active']);
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
      // The opponent adds DON!! from their DON!! deck (G51), chosen by them when it is optional.
      if (o.player !== undefined && o.player !== 'opponent')
        err(c, `${path}.player`, 'expected "opponent"');
      return arr(c, p, x, (y, q) => {
        fields(c, q, y, ['n', 'state'], ['upTo']);
        if (!isObj(y)) return;
        int(c, `${q}.n`, y.n);
        enumOf(c, `${q}.state`, y.state, ['active', 'rested']);
      });
    case 'returnDon':
      fields(c, p, x, ['n'], ['player', 'from']);
      if (!isObj(x)) return;
      if (x.player !== undefined && x.player !== 'opponent')
        err(c, `${p}.player`, 'expected "opponent"');
      // The opponent returns their own DON!! (G27); `from: "active"` is for that form only.
      if (x.player === undefined && x.from !== undefined)
        err(c, `${p}.from`, "from applies to the opponent's returning");
      if (x.from !== undefined && x.from !== 'active') err(c, `${p}.from`, 'expected "active"');
      if (x.player === 'opponent' && x.n === 'toMatchOpponent')
        err(c, `${p}.n`, 'toMatchOpponent is for your own DON!!');
      if (x.n !== 'toMatchOpponent') num(c, `${p}.n`, x.n);
      return;
    case 'grant':
      fields(c, p, x, ['target', 'duration'], ['keyword', 'attribute']);
      if (!isObj(x)) return;
      selector(c, `${p}.target`, x.target);
      zonesIn(c, `${p}.target`, x.target, FIELD_ZONES, 'modifiers apply to cards on the field');
      // A keyword and/or an attribute (G59): at least one, or the grant says nothing.
      if (x.keyword === undefined && x.attribute === undefined)
        err(c, p, 'a grant gives a keyword, an attribute, or both');
      if (x.keyword !== undefined) enumOf(c, `${p}.keyword`, x.keyword, KEYWORDS);
      if (x.attribute !== undefined) enumOf(c, `${p}.attribute`, x.attribute, ATTRIBUTES);
      return enumOf(c, `${p}.duration`, x.duration, DURATIONS);
    case 'lookAtLife': {
      // Two shapes (G64): look at one card of either Life area and place it top or bottom, or look
      // at all of your own Life cards and put them back in any order.
      fields(c, p, x, ['owner', 'n', 'place']);
      if (!isObj(x)) return;
      if (x.n === 'all') {
        if (x.owner !== 'you' || x.place !== 'anyOrder')
          err(c, p, "looking at all Life cards is { owner: 'you', n: 'all', place: 'anyOrder' }");
      } else {
        enumOf(c, `${p}.owner`, x.owner, [...P, 'any']);
        if (x.n !== 1) err(c, `${p}.n`, "expected 1 or 'all'");
        if (x.place !== 'topOrBottom')
          err(c, `${p}.place`, "a look at one card places it 'topOrBottom'");
      }
      return;
    }
    case 'moveDon': {
      // Give DON!! that are already given to another of your cards (G65): never the same card.
      fields(c, p, x, ['n', 'from', 'to']);
      if (!isObj(x)) return;
      int(c, `${p}.n`, x.n);
      if (typeof x.n === 'number' && x.n < 1) err(c, `${p}.n`, 'must be at least 1');
      for (const side of ['from', 'to'] as const) {
        selector(c, `${p}.${side}`, x[side]);
        zonesIn(
          c,
          `${p}.${side}`,
          x[side],
          ['leader', 'characters'],
          'only a Leader or Character has DON!! given',
        );
        ownerYou(c, `${p}.${side}`, x[side], 'DON!! move between your own cards');
      }
      const f = x.from;
      if (isObj(f) && !(isObj(f.pick) && (f.pick.exactly === 1 || f.pick.upTo === 1)))
        err(c, `${p}.from.pick`, 'the source is one card: pick { upTo: 1 } or { exactly: 1 }');
      const t = x.to;
      if (isObj(t) && !(isObj(t.pick) && t.pick.exactly === 1))
        err(c, `${p}.to.pick`, 'the DON!! go to one card: pick { exactly: 1 }');
      return;
    }
    case 'redirectAttack': {
      // Only an [On Your Opponent's Attack] has an attack whose target can change (D3).
      fields(c, p, x, ['to']);
      if (!isObj(x)) return;
      if (!c.onOppAttack) err(c, p, "redirectAttack is for an auto ability on 'onOpponentAttack'");
      selector(c, `${p}.to`, x.to);
      zonesIn(c, `${p}.to`, x.to, ['leader', 'characters'], 'only your Leader or a Character');
      ownerYou(c, `${p}.to`, x.to, 'the attack is redirected to your own card');
      if (isObj(x.to) && !(isObj(x.to.pick) && x.to.pick.exactly === 1))
        err(c, `${p}.to.pick`, 'the new target is chosen: pick { exactly: 1 }');
      return;
    }
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
        if (
          w !== 'cannotDrawByOwnEffects' &&
          w !== 'cannotAddLifeToHandByOwnEffects' &&
          !(isObj(w) && ('cannotPlay' in w || 'cannotSetDonActive' in w))
        )
          err(
            c,
            `${p}.what`,
            'a restriction on a player is cannotDrawByOwnEffects, cannotAddLifeToHandByOwnEffects, cannotPlay or cannotSetDonActive',
          );
        // Your own effects (G60): only you can be barred from your own effects' Life moves.
        if (w === 'cannotAddLifeToHandByOwnEffects' && x.target !== 'you')
          err(c, `${p}.target`, 'cannotAddLifeToHandByOwnEffects restricts you');
      } else {
        selector(c, `${p}.target`, x.target);
        zonesIn(c, `${p}.target`, x.target, FIELD_ZONES, 'modifiers apply to cards on the field');
        if (
          x.what === 'cannotDrawByOwnEffects' ||
          x.what === 'cannotAddLifeToHandByOwnEffects' ||
          (isObj(x.what) && ('cannotPlay' in x.what || 'cannotSetDonActive' in x.what))
        )
          err(c, `${p}.what`, 'that restriction applies to a player, not to cards');
        // A card in a hand is barred by its own permanent, never by an effect for a while (G63).
        if (x.what === 'cannotBePlayedByEffects')
          err(c, `${p}.what`, 'cannotBePlayedByEffects is a permanent of a card in your hand');
      }
      restriction(c, `${p}.what`, x.what);
      if (isObj(x.what) && 'cannotAttackTarget' in x.what && typeof x.target !== 'string')
        zonesIn(
          c,
          `${p}.target`,
          x.target,
          ['leader', 'characters', 'field', 'self'],
          'only a Leader or Character attacks',
        );
      return enumOf(c, `${p}.duration`, x.duration, DURATIONS);
    case 'damage':
      // Real damage (G36): the Life card taken may carry a [Trigger], and 0 Life defeats (RL-22).
      fields(c, p, x, ['player', 'n']);
      if (!isObj(x)) return;
      enumOf(c, `${p}.player`, x.player, P);
      return num(c, `${p}.n`, x.n);
    case 'winGame':
      if (x !== true) err(c, p, 'expected true');
      return;
    case 'swapBasePower': {
      // Two chosen cards, one after the other (G33): each selector picks exactly 1 card.
      fields(c, p, x, ['a', 'b', 'duration']);
      if (!isObj(x)) return;
      for (const side of ['a', 'b'] as const) {
        selector(c, `${p}.${side}`, x[side]);
        zonesIn(
          c,
          `${p}.${side}`,
          x[side],
          ['leader', 'characters'],
          'only a Leader or Character has a base power',
        );
        const sel = x[side];
        if (isObj(sel) && !(isObj(sel.pick) && sel.pick.exactly === 1))
          err(c, `${p}.${side}.pick`, 'each card of a swap is chosen with pick { exactly: 1 }');
      }
      return enumOf(c, `${p}.duration`, x.duration, ['thisTurn', 'battle']);
    }
    case 'canAttackActive':
      fields(c, p, x, ['target', 'duration']);
      if (!isObj(x)) return;
      selector(c, `${p}.target`, x.target);
      zonesIn(
        c,
        `${p}.target`,
        x.target,
        ['leader', 'characters', 'field', 'self'],
        'only a Leader or Character attacks',
      );
      return enumOf(c, `${p}.duration`, x.duration, ['thisTurn']);
    case 'addReplacement': {
      // A replacement that lasts to the end of the turn (D6): K.O. and removal events only.
      fields(c, p, x, ['replaces', 'optional', 'instead', 'duration']);
      if (!isObj(x)) return;
      if (c.noAlt) err(c, p, 'a replacement does not create another replacement');
      enumOf(c, `${p}.duration`, x.duration, ['thisTurn']);
      const rp = x.replaces;
      if (!isObj(rp) || !('ko' in rp || 'leaveField' in rp))
        err(
          c,
          `${p}.replaces`,
          'a created replacement replaces a K.O. or a removal (ko, leaveField)',
        );
      else replacesEvent(c, `${p}.replaces`, rp);
      replacementBody(c, p, x.optional, x.instead);
      return;
    }
    case 'activate':
      fields(c, p, x, ['ability', 'of']);
      if (!isObj(x)) return;
      enumOf(c, `${p}.ability`, x.ability, ['main', 'onPlay', 'onKO', 'counter', 'trigger']);
      if (x.ability === 'trigger') {
        // The [Trigger] of one card in your hand, named by a bound selection (G6).
        if (!isObj(x.of))
          return err(c, `${p}.of`, 'a [Trigger] is activated on a selected hand card');
        selector(c, `${p}.of`, x.of);
        if (x.of.from !== 'hand' || x.of.owner !== 'you')
          err(c, `${p}.of`, "the [Trigger] of a card in your own hand ('hand', 'you')");
        if (x.of.pick !== undefined)
          err(c, `${p}.of.pick`, 'name the card with a bound { ref } filter, no pick');
        return;
      }
      if (isObj(x.of)) return activateEvent(c, p, x);
      return enumOf(c, `${p}.of`, x.of, ['self']);
  }
}

/** Does the filter require an Event card (top level, or inside `all`)? */
function requiresEvent(f: unknown): boolean {
  if (!isObj(f)) return false;
  if (Array.isArray(f.category)) return f.category.length === 1 && f.category[0] === 'Event';
  return Array.isArray(f.all) && f.all.some(requiresEvent);
}

/**
 * `activate` of an Event chosen by a selector (D2): only the [Main] of one Event card you own, from
 * your hand or your trash. Anything else would do something other than the card says: a second
 * zone, the opponent's cards, a count other than one, a [Counter] or [Trigger] (official OP12-041
 * Q&A: only [Main] effects), or a filter that could name a Character.
 */
function activateEvent(c: Ctx, path: string, x: Obj): void {
  const o = `${path}.of`;
  const sel = x.of as Obj;
  selector(c, o, sel);
  if (x.ability !== 'main')
    err(c, `${path}.ability`, 'an Event chosen by a selector is activated by its [Main] only');
  if (sel.from !== 'hand' && sel.from !== 'trash')
    err(c, `${o}.from`, "activating an Event takes it from 'hand' or from 'trash' (one zone)");
  if (sel.owner !== 'you') err(c, `${o}.owner`, "only your own cards ('you')");
  const pk = sel.pick;
  if (!isObj(pk) || !(pk.upTo === 1 || pk.exactly === 1))
    err(c, `${o}.pick`, 'activate one Event: pick { upTo: 1 } or { exactly: 1 }');
  else if (
    pk.totalCost !== undefined ||
    pk.totalPower !== undefined ||
    pk.distinctNames !== undefined
  )
    err(c, `${o}.pick`, 'no totals on a single Event');
  if (!requiresEvent(sel.filter))
    err(
      c,
      `${o}.filter`,
      "the filter must name Event cards ({ category: ['Event'] }, alone or in an all)",
    );
  if (c.inCost) err(c, path, 'activating an Event is an effect, not a cost');
  for (const k of ['chooser', 'blind', 'reveal', 'bind', 'lki'])
    if (k in sel) err(c, `${o}.${k}`, `${k} does not apply to an activated Event`);
}

/**
 * `skipRefresh` of DON!! (G48): your opponent's rested cost-area DON!!, a count of 1 or more. A
 * mixed zone list, another owner or state, or a pick that chooses cards would do something other
 * than the card says, so they are refused.
 */
function skipRefreshDon(c: Ctx, path: string, sel: unknown): void {
  if (!isObj(sel)) return;
  const zones = Array.isArray(sel.from) ? sel.from : [sel.from];
  if (!zones.includes('donCostArea')) return;
  if (zones.length !== 1) err(c, `${path}.from`, 'DON!! and cards cannot be skipped together');
  if (sel.owner !== 'opponent')
    err(
      c,
      `${path}.owner`,
      'only your opponent\'s rested DON!! are held back: owner must be "opponent"',
    );
  const f = sel.filter;
  if (!isObj(f) || f.state !== 'rested' || Object.keys(f).length !== 1)
    err(
      c,
      `${path}.filter`,
      "DON!! held back are the rested ones: filter must be { state: 'rested' }",
    );
  const pk = sel.pick;
  if (!isObj(pk) || !('upTo' in pk || 'exactly' in pk))
    err(c, `${path}.pick`, 'a count of DON!!: pick { upTo: n } or { exactly: n }');
}

/** Does the filter name (top level, or inside `all`) a card an earlier `reveal` bound (G53)? */
function readsRevealed(f: unknown, revealed: Set<string>): boolean {
  if (!isObj(f)) return false;
  if (typeof f.ref === 'string') return revealed.has(f.ref);
  return Array.isArray(f.all) && f.all.some((g) => readsRevealed(g, revealed));
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
  if (zones.includes('self')) {
    // A cost moves this Character or Stage off the field (G52). An effect moves "this card" only
    // from a [Trigger]'s resolving slot to your hand: "add this card to your hand" (G57).
    if (c.inCost) return;
    const pk = what.pick as Record<string, unknown> | undefined;
    if (
      zones.length !== 1 ||
      c.abKind !== 'trigger' ||
      dz !== 'hand' ||
      pos !== undefined ||
      to.faceUp !== undefined
    )
      return err(
        c,
        path,
        'a move of this card is a cost, or the "add this card to your hand" of a [Trigger]',
      );
    if (what.owner !== 'you')
      err(c, `${path}.what.owner`, 'this card is yours: owner must be "you"');
    if (!pk || pk.exactly !== 1)
      err(c, `${path}.what.pick`, 'adding this card to your hand needs { exactly: 1 }');
    if (what.filter !== undefined) err(c, `${path}.what.filter`, 'this card takes no filter');
    return;
  }
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
  if (zones.includes('lifeTopOrBottom')) {
    // "Add 1 card from the top or bottom of your Life cards to your hand" (G45): your own Life, to
    // your hand, exactly 1 (the choice of end is the controller's).
    const pk = what.pick as Record<string, unknown> | undefined;
    if (zones.length !== 1 || dz !== 'hand' || pos !== undefined || to.faceUp !== undefined)
      return err(c, path, 'a move from the top or bottom of Life is implemented only to your hand');
    if (what.owner !== 'you')
      err(c, `${path}.what.owner`, 'the top or bottom of your own Life cards: owner must be "you"');
    if (!pk || pk.exactly !== 1)
      err(c, `${path}.what.pick`, 'a move from the top or bottom of Life needs { exactly: 1 }');
    return;
  }
  if (zones.includes('lifeTop')) {
    // To the owner's hand, or (G30) to the trash: not damage, so no [Trigger] either way.
    if (
      zones.length !== 1 ||
      (dz !== 'hand' && dz !== 'trash') ||
      pos !== undefined ||
      to.faceUp !== undefined
    )
      return err(
        c,
        path,
        "a move from the top of Life is implemented only to the owner's hand or to the trash",
      );
    const pk = what.pick as Record<string, unknown> | undefined;
    if (!pk || (pk.upTo !== 1 && pk.exactly !== 1))
      err(
        c,
        `${path}.what.pick`,
        'a move from the top of Life needs { upTo: 1 } or { exactly: 1 }',
      );
    // Both players' top Life cards at once is for the trash, and is never optional (OP11-102).
    if (what.owner === 'any' && (dz !== 'trash' || pk?.exactly !== 1))
      err(
        c,
        `${path}.what.owner`,
        'owner "any" trashes the top Life card of each player: only to the trash, with { exactly: 1 }',
      );
    return;
  }
  if (to.faceUp !== undefined && dz !== 'life')
    err(c, `${path}.to.faceUp`, 'faceUp applies only to Life');
  if (!all(['hand', 'trash']) && !all(['characters', 'stage']))
    return err(c, `${path}.what.from`, `moving from ${zones.join(', ')} is not implemented yet`);
  // A Stage does not go into Life (G61); a replaced card names itself with { ref: 'replaced' }.
  if (dz === 'life' && zones.includes('stage'))
    return err(c, `${path}.what.from`, 'only a Character moves into Life');
  if (dz === 'life') {
    if (all(['characters'])) {
      // A Character into its owner's Life (G61): at an end of the Life area, face-down unless the
      // text says face-up (rules-digest 107). One card; an opponent's goes to the opponent's Life.
      const pk = what.pick as Record<string, unknown> | undefined;
      if (pos !== 'top' && pos !== 'bottom' && pos !== 'topOrBottom')
        err(
          c,
          `${path}.to.position`,
          'a Character enters Life at the "top", "bottom" or "topOrBottom"',
        );
      if (!pk || (pk.exactly !== 1 && pk.upTo !== 1))
        err(c, `${path}.what.pick`, 'a Character moved into Life is { upTo: 1 } or { exactly: 1 }');
      return;
    }
    if (!all(['hand', 'trash']))
      return err(c, `${path}.to`, 'only a hand, trash or Character card moves into Life');
    // From a hand or trash: the top, or the end the controller picks (OP-18 wave G3).
    if (pos !== undefined && pos !== 'top' && pos !== 'topOrBottom')
      err(
        c,
        `${path}.to.position`,
        'a hand or trash card enters Life at the "top" or "topOrBottom"',
      );
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
    'cannotAddLifeToHandByOwnEffects',
    'cannotBePlayedByEffects',
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
  const k = oneOf(
    c,
    path,
    v,
    ['cannotPlay', 'cannotBeKOd', 'cannotBeRested', 'cannotSetDonActive', 'cannotAttackTarget'],
    { cannotPlay: ['from'] },
  );
  if (!k || !isObj(v)) return;
  if (k === 'cannotPlay') {
    filter(c, `${path}.cannotPlay`, v.cannotPlay);
    if ('from' in v) enumOf(c, `${path}.from`, v.from, ['hand']);
  } else if (k === 'cannotAttackTarget') {
    // G47: the card cannot attack a card matching the filter (read on that card alone).
    deckFilter(
      c,
      `${path}.cannotAttackTarget`,
      v.cannotAttackTarget,
      SOURCE_FILTER_KEYS,
      'a target filter reads only the card that would be attacked',
    );
  } else if (k === 'cannotSetDonActive') {
    // A player restriction (G21): only "using Character effects" is implemented.
    fields(c, `${path}.cannotSetDonActive`, v.cannotSetDonActive, ['by']);
    if (isObj(v.cannotSetDonActive))
      enumOf(c, `${path}.cannotSetDonActive.by`, v.cannotSetDonActive.by, ['characterEffects']);
  } else if (k === 'cannotBeKOd') {
    // Scoped by cause (G6): "by effects", "by your opponent's effects", "in battle".
    fields(c, `${path}.cannotBeKOd`, v.cannotBeKOd, ['cause'], ['by']);
    if (isObj(v.cannotBeKOd)) {
      enumOf(c, `${path}.cannotBeKOd.cause`, v.cannotBeKOd.cause, [
        'effect',
        'opponentEffect',
        'battle',
      ]);
      // G46: only K.O.s by a source matching the filter; it reads that card alone.
      if (v.cannotBeKOd.by !== undefined)
        deckFilter(
          c,
          `${path}.cannotBeKOd.by`,
          v.cannotBeKOd.by,
          SOURCE_FILTER_KEYS,
          "a source filter reads only the K.O.'s source card",
        );
    }
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
    'playRested',
    'negate',
  ]);
  if (!k) return;
  const x = (v as Obj)[k];
  const p = `${path}.${k}`;
  if (!has(IMPLEMENTED.continuous, k))
    return err(c, path, `permanent ${k} is not implemented in the runtime yet`);
  switch (k) {
    case 'negate': {
      // "Your Leader and Characters without a type including X have their effects negated" (G66):
      // read before any other stage, so the filter reads printed values and nothing chosen.
      fields(c, p, x, ['target']);
      if (!isObj(x)) return;
      selector(c, `${p}.target`, x.target);
      zonesIn(c, `${p}.target`, x.target, FIELD_ZONES, 'a permanent negates cards on the field');
      const t = x.target;
      if (isObj(t)) {
        if (t.pick !== undefined || t.bind !== undefined || t.chooser !== undefined)
          err(c, `${p}.target`, 'a permanent negation names every match: no pick, bind or chooser');
        if (t.filter !== undefined)
          deckFilter(
            c,
            `${p}.target.filter`,
            t.filter,
            DECK_FILTER_KEYS,
            'a negation filter reads printed values: it is read before the layers',
          );
      }
      return;
    }
    case 'playRested':
      // "Your Character cards are played rested" (G50): read on the card being played, in hand or
      // trash or wherever it comes from, so printed values only (nothing relative, no state).
      return deckFilter(
        c,
        p,
        x,
        DECK_FILTER_KEYS,
        'a play filter reads the printed values of the card being played',
      );
    case 'playCost':
      // A permanent reduction (or increase) of the cost of playing cards from your hand (G5).
      fields(c, p, x, ['target', 'amount']);
      if (!isObj(x)) return;
      selector(c, `${p}.target`, x.target);
      zonesIn(
        c,
        `${p}.target`,
        x.target,
        ['hand'],
        'a play-cost change applies to cards in your hand',
      );
      ownerYou(c, `${p}.target`, x.target, 'a play-cost change applies to your own hand');
      if (isObj(x.target) && x.target.pick !== undefined)
        err(c, `${p}.target`, 'a play-cost change names every match: no pick');
      return num(c, `${p}.amount`, x.amount);
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
      if (x.what === 'cannotBePlayedByEffects') {
        // A card in your hand bars itself (G63): `zone: 'hand'`, the card alone.
        if (!c.abHand) err(c, `${p}.what`, "cannotBePlayedByEffects is a permanent of zone 'hand'");
        const t = x.target;
        if (isObj(t) && (t.from !== 'self' || t.filter !== undefined || t.pick !== undefined))
          err(
            c,
            `${p}.target`,
            "cannotBePlayedByEffects names this card: { from: 'self', owner: 'you' }",
          );
      } else if (x.what === 'cannotAddLifeToHandByOwnEffects')
        err(c, `${p}.what`, 'a permanent cannot restrict adding Life to the hand');
      else if (isObj(x.what) && 'cannotPlay' in x.what)
        err(c, `${p}.what`, 'a permanent cannot restrict what a player may play');
      else if (isObj(x.what) && 'cannotSetDonActive' in x.what)
        err(c, `${p}.what`, 'a permanent cannot restrict setting DON!! active');
      else if (x.what === 'cannotDrawByOwnEffects')
        err(c, `${p}.what`, 'a permanent cannot restrict drawing');
      else if (isObj(x.what) && 'cannotAttackTarget' in x.what) {
        restriction(c, `${p}.what`, x.what);
        zonesIn(
          c,
          `${p}.target`,
          x.target,
          ['leader', 'characters', 'field', 'self'],
          'only a Leader or Character attacks',
        );
      } else restriction(c, `${p}.what`, x.what);
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
  fields(
    c,
    path,
    v,
    ['event'],
    [
      'by',
      'filter',
      'attacker',
      'target',
      'owner',
      'from',
      'via',
      'sourceFilter',
      'includeCosts',
      'cause',
      'to',
      'min',
    ],
  );
  if (!isObj(v)) return;
  const e = `event:${String(v.event)}`;
  if (!has(IMPLEMENTED.timings, e))
    return err(c, path, `${e} is not implemented in the runtime yet`);
  // The wave 3 qualifiers belong to one event each; anywhere else they would silently do nothing.
  const own: Record<string, string[]> = {
    cardPlayed: ['from', 'via'],
    trashedFromHand: ['sourceFilter', 'includeCosts', 'by'],
    rested: ['sourceFilter', 'by'],
    removed: ['cause', 'to'],
    leftField: ['cause', 'to'],
    donReturned: ['min', 'cause'],
  };
  for (const k of ['from', 'via', 'sourceFilter', 'includeCosts', 'cause', 'to', 'min'])
    if (k in v && !(own[String(v.event)] ?? []).includes(k))
      err(c, `${path}.${k}`, `${k} does not apply to a ${String(v.event)} event`);
  if (v.event === 'attack') {
    if (v.attacker === undefined && v.target === undefined)
      err(c, path, 'an attack event needs an attacker or a target');
    if (v.attacker !== undefined) selector(c, `${path}.attacker`, v.attacker);
    if (v.target !== undefined) selector(c, `${path}.target`, v.target);
  } else if (v.event === 'cardPlayed') {
    enumOf(c, `${path}.by`, v.by, P);
    if (v.filter !== undefined) filter(c, `${path}.filter`, v.filter);
    if (v.from !== undefined) enumOf(c, `${path}.from`, v.from, ['hand', 'trash']);
    if (v.via !== undefined) enumOf(c, `${path}.via`, v.via, ['rule', 'effect', 'characterEffect']);
  } else if (v.event === 'eventActivated' || v.event === 'blockerActivated') {
    enumOf(c, `${path}.by`, v.by, P);
  } else if (v.event === 'triggerActivated') {
    // G56: whose [Trigger]; `any` is either player's.
    enumOf(c, `${path}.by`, v.by, [...P, 'any']);
  } else if (v.event === 'trashedFromHand') {
    enumOf(c, `${path}.owner`, v.owner, P);
    if (v.by !== undefined) enumOf(c, `${path}.by`, v.by, P);
    if (v.sourceFilter !== undefined) filter(c, `${path}.sourceFilter`, v.sourceFilter);
    if (v.includeCosts !== undefined && v.includeCosts !== true)
      err(c, `${path}.includeCosts`, 'expected true');
    if (v.filter !== undefined)
      err(c, `${path}.filter`, 'use sourceFilter: the cards trashed are not read');
  } else if (v.event === 'rested') {
    enumOf(c, `${path}.owner`, v.owner, [...P, 'any']);
    if (v.filter !== undefined) filter(c, `${path}.filter`, v.filter);
    if (v.by !== undefined)
      enumOf(c, `${path}.by`, v.by, ['effect', 'yourEffect', 'opponentEffect']);
    if (v.sourceFilter !== undefined) {
      filter(c, `${path}.sourceFilter`, v.sourceFilter);
      if (v.by === undefined)
        err(c, `${path}.sourceFilter`, 'sourceFilter needs a "by" (an effect)');
    }
  } else if (v.event === 'removed' || v.event === 'leftField') {
    enumOf(c, `${path}.owner`, v.owner, P);
    if (v.filter !== undefined) filter(c, `${path}.filter`, v.filter);
    if (v.cause !== undefined)
      enumOf(c, `${path}.cause`, v.cause, ['effect', 'yourEffect', 'opponentEffect']);
    if (v.to !== undefined) enumOf(c, `${path}.to`, v.to, ['hand', 'deck', 'trash']);
  } else if (v.event === 'koed') {
    if (v.filter === undefined) err(c, path, 'a koed event needs a filter');
    else filter(c, `${path}.filter`, v.filter);
    // G38: whose Characters. Absent means the watcher's own, as before.
    if (v.owner !== undefined) enumOf(c, `${path}.owner`, v.owner, P);
  } else if (v.event === 'lifeRemoved') {
    enumOf(c, `${path}.owner`, v.owner, [...P, 'any']);
  } else if (v.event === 'donReturned') {
    // G40: 2 or more returned at once, and whose effect returned them.
    enumOf(c, `${path}.owner`, v.owner, P);
    if (v.min !== undefined) {
      int(c, `${path}.min`, v.min);
      if (typeof v.min === 'number' && v.min < 2)
        err(c, `${path}.min`, 'min is 2 or more (every return is at least 1)');
    }
    if (v.cause !== undefined)
      enumOf(c, `${path}.cause`, v.cause, ['effect', 'yourEffect', 'opponentEffect']);
  } else {
    enumOf(c, `${path}.owner`, v.owner, P);
  }
}

const ID = /^[a-z][a-z0-9-]*$/;

function ability(c: Ctx, path: string, v: unknown, ids: Set<string>): void {
  if (!isObj(v)) return err(c, path, 'expected an object');
  c.bound = new Set();
  c.labels = new Set();
  c.chosen = new Set();
  c.revealed = new Set();
  c.abKind = typeof v.kind === 'string' ? v.kind : undefined;
  c.abHand = v.kind === 'permanent' && v.zone === 'hand';
  c.onOppAttack = v.kind === 'auto' && Array.isArray(v.when) && v.when.includes('onOpponentAttack');
  c.attackerOk =
    v.kind === 'auto' &&
    Array.isArray(v.when) &&
    v.when.length > 0 &&
    v.when.every((w) => w === 'onOpponentAttack');
  c.subjectOk =
    v.kind === 'auto' &&
    Array.isArray(v.when) &&
    v.when.length > 0 &&
    v.when.every((w) => isObj(w) && w.event === 'cardPlayed');
  c.evCount =
    v.kind === 'auto' &&
    Array.isArray(v.when) &&
    v.when.some((w) => isObj(w) && w.event === 'trashedFromHand');
  c.koOk = v.kind === 'auto' && Array.isArray(v.when) && v.when.includes('onKO');
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
      if (Array.isArray(v.replaces)) {
        // One ability covering several events with one Once Per Turn (G14 b, OP13-046).
        if (v.replaces.length < 2) err(c, `${path}.replaces`, 'a list covers at least 2 events');
        v.replaces.forEach((r, i) => {
          if (!isObj(r) || !('ko' in r || 'leaveField' in r))
            err(
              c,
              `${path}.replaces[${i}]`,
              'a list holds K.O. and removal events (ko, leaveField)',
            );
          else replacesEvent(c, `${path}.replaces[${i}]`, r);
        });
      } else replacesEvent(c, `${path}.replaces`, v.replaces);
      replacementBody(c, path, v.optional, v.instead);
      return;
    }
    default:
      err(c, `${path}.kind`, `unknown ability kind ${JSON.stringify(v.kind)}`);
  }
}

/** One replaced event: `ko`, `leaveField`, `damage` or `rest`, with its qualifiers. */
function replacesEvent(c: Ctx, path: string, v: unknown): void {
  const k = oneOf(c, path, v, ['ko', 'leaveField', 'damage', 'rest'], {
    ko: ['cause'],
    leaveField: ['cause'],
    rest: ['cause'],
  });
  if (!k || !isObj(v)) return;
  if (k === 'damage') {
    // D4: "if you would take damage": the damage to the replacing card's controller.
    if (v.damage !== 'you') err(c, `${path}.damage`, 'expected "you"');
  } else if (k === 'rest') {
    // G37: only "by your opponent's Character's effect" is implemented.
    selector(c, `${path}.rest`, v.rest);
    enumOf(c, `${path}.cause`, v.cause, ['opponentCharacterEffect']);
  } else {
    selector(c, `${path}.${k}`, v[k]);
    if (k === 'leaveField') enumOf(c, `${path}.cause`, v.cause, ['opponentEffect', 'any']);
    else if (v.cause !== undefined)
      enumOf(c, `${path}.cause`, v.cause, ['opponentEffect', 'effect', 'battle']);
  }
}

/** The `optional` flag and the payload of a replacement, written or created by an effect. */
function replacementBody(c: Ctx, path: string, optional: unknown, instead: unknown): void {
  const was = c.noAlt;
  c.noAlt = true;
  // The card the replacement covers is "the replaced card" of its payload: `{ ref: 'replaced' }`
  // names it (G61, OP11-101: "add it to the top of your Life cards face-down instead").
  const hadReplaced = c.bound.has('replaced');
  c.bound.add('replaced');
  if (typeof optional !== 'boolean') err(c, `${path}.optional`, 'expected a boolean');
  if (!Array.isArray(instead)) err(c, `${path}.instead`, 'expected an array');
  else if (isEffect(instead)) steps(c, `${path}.instead`, instead);
  else costs(c, `${path}.instead`, instead);
  c.noAlt = was;
  if (!hadReplaced) c.bound.delete('replaced');
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

/**
 * A `cannotBeKOd` source filter (G46) reads the card that K.O.s, wherever it is: the printed
 * values, its keywords and whether it is rested, and nothing relative to the protected card.
 */
const SOURCE_FILTER_KEYS = [...DECK_FILTER_KEYS, 'keyword', 'state'];

function deckFilter(
  c: Ctx,
  path: string,
  v: unknown,
  keys: readonly string[] = DECK_FILTER_KEYS,
  why = 'a deck restriction reads printed card values only',
): void {
  if (!isObj(v)) return err(c, path, 'expected a filter');
  const k = Object.keys(v)[0];
  if (k !== undefined && !keys.includes(k)) return err(c, path, `${k}: ${why}`);
  filter(c, path, v);
  if (k === 'all' || k === 'any')
    (v[k] as unknown[]).forEach((x, i) => deckFilter(c, `${path}.${k}[${i}]`, x, keys, why));
  else if (k === 'not') deckFilter(c, `${path}.not`, v.not, keys, why);
  else if (k && ['cost', 'baseCost', 'power', 'basePower'].includes(k)) {
    const cm = v[k];
    const kind = isObj(cm) ? Object.keys(cm)[0] : undefined;
    if (!isObj(cm) || kind === undefined || typeof cm[kind] !== 'number')
      err(c, `${path}.${k}`, 'a deck restriction compares to a number');
  }
}

/** Problems with a script; an empty list means it is valid. */
export function validateScript(script: unknown): string[] {
  const c: Ctx = {
    errors: [],
    bound: new Set(),
    labels: new Set(),
    chosen: new Set(),
    revealed: new Set(),
    inCost: false,
  };
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
