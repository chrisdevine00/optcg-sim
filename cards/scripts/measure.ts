/**
 * The effect tagger and coverage measurement (effect-dsl E-D10, PLAN §2a M6b-0). A port of the Track E
 * tooling (`tagger.py`, `stats.py`, `dsl_map.py`). It measures vocabulary and coverage only; it never
 * produces scripts and never drives behaviour (ADR 0006).
 *
 * Everything here is pure: cards, the scripted-id set and the weights come in as arguments, so the tests
 * run it on a small synthetic pool. `measure-effects.ts` does the file reading.
 */
import type { Card } from '../src/schema.ts';
import { automation } from '../src/coverage.ts';
import { IMPLEMENTED } from '../src/dsl-validate.ts';
import { ACTION_SRC, COND_SRC, COST_SRC, DURATION_SRC, REMINDER_SRC } from './measure-patterns.ts';

// ---------------------------------------------------------------- normalization

const REMINDERS = REMINDER_SRC.map((p) => new RegExp(p, 'g'));

export function normalize(raw: string | null | undefined): { text: string; fixes: string[] } {
  const fixes: string[] = [];
  let t = raw ?? '';
  if (['NULL', '-', 'N/A'].includes(t.trim())) return { text: '', fixes: ['blank:NULL'] };
  t = t.replace(/This card has been officially errata'd\./g, '');
  t = t.replace(/Disclaimer:.*/gs, '');
  for (const r of REMINDERS) t = t.replace(r, ' ');
  t = t.replace(/−/g, '-').replace(/－/g, '-').replace(/–/g, '-');
  t = t.replace(/＜/g, '<').replace(/＞/g, '>');
  t = t.replace(/\[Activate: ?Main\]/g, '[Activate: Main]');
  t = t.replace(/\[DON!! ?[x×] ?(\d+)\]/g, '[DON!! x$1]');
  t = t.replace(/\bK\.O (?=up)/g, 'K.O. ');
  t = t.replace(/DON!!-(\d)/g, 'DON!! -$1');
  t = t.replace(/\((\d+)\)(?=\s*[:,]|\s+\()/g, '①$1');
  t = t.replace(/\((\d+)\)/g, '①$1');
  t = t.replace(/(?<=DON!! )(\d+)(?=\s*[:,])/g, (_m, n: string) => {
    fixes.push(`sign:DON!! -${n}`);
    return `-${n}`;
  });
  t = t.replace(
    /((?:[Gg]ive|[Gg]ives)\b[^.:]*?(?:opponent's|their)[^.:]*?\s)(\d+) power/g,
    (_m, pre: string, n: string) => {
      fixes.push(`sign:power -${n}`);
      return `${pre}-${n} power`;
    },
  );
  t = t.replace(
    /((?:[Gg]ive|[Gg]ives)\b[^.:]*?(?:opponent's|their)[^.:]*?\s)(\d+) cost/g,
    (_m, pre: string, n: string) => {
      fixes.push(`sign:cost -${n}`);
      return `${pre}-${n} cost`;
    },
  );
  t = t.replace(/[ \t]+/g, ' ');
  return { text: t.trim(), fixes };
}

// ---------------------------------------------------------------- abilities

const TIMING_TAGS = new Map<string, string>([
  ['[On Play]', 'onPlay'],
  ['[When Attacking]', 'whenAttacking'],
  ['[Activate: Main]', 'activateMain'],
  ['[Main]', 'main'],
  ['[Counter]', 'counter'],
  ['[Trigger]', 'trigger'],
  ['[On Block]', 'onBlock'],
  ['[On K.O.]', 'onKO'],
  ['[End of Your Turn]', 'endOfYourTurn'],
  ["[End of Your Opponent's Turn]", 'endOfOpponentTurn'],
  ["[On Your Opponent's Attack]", 'onOpponentAttack'],
]);
const COND_TAGS = new Map<string, string>([
  ['[Your Turn]', 'yourTurn'],
  ["[Opponent's Turn]", 'opponentTurn'],
  ['[Once Per Turn]', 'oncePerTurn'],
]);
const KEYWORDS = new Map<string, string>([
  ['[Blocker]', 'Blocker'],
  ['[Rush]', 'Rush'],
  ['[Double Attack]', 'DoubleAttack'],
  ['[Banish]', 'Banish'],
  ['[Rush: Character]', 'RushCharacter'],
  ['[Unblockable]', 'Unblockable'],
]);
const TAG_RE =
  /\[(?:On Play|When Attacking|Activate: Main|Main|Counter|Trigger|On Block|On K\.O\.|End of Your Turn|End of Your Opponent's Turn|On Your Opponent's Attack|Your Turn|Opponent's Turn|Once Per Turn|DON!! x\d+|Blocker|Rush|Double Attack|Banish|Rush: Character|Unblockable)\]/g;

/** Python's `str.strip(chars)` for the two-character set `' /'`. */
const stripSlash = (s: string): string => s.replace(/^[ /]+|[ /]+$/g, '');

/** Split text into abilities: a leading tag run and its body. A tag starts an ability only at a boundary. */
export function splitAbilities(t: string): Array<[string[], string]> {
  const marks: RegExpExecArray[] = [];
  for (const m of t.matchAll(TAG_RE)) {
    const pre = t.slice(0, m.index).replace(/[ /]+$/, '');
    if (pre === '' || '.)\n]!'.includes(pre.at(-1)!) || pre.endsWith('•')) marks.push(m);
  }
  if (marks.length === 0) return t ? [[[], t]] : [];
  const abilities: Array<[string[], string]> = [];
  if (t.slice(0, marks[0]!.index).trim()) abilities.push([[], t.slice(0, marks[0]!.index).trim()]);
  let i = 0;
  while (i < marks.length) {
    const tags = [marks[i]![0]];
    let end = marks[i]!.index + marks[i]![0].length;
    let j = i + 1;
    while (j < marks.length && stripSlash(t.slice(end, marks[j]!.index)) === '') {
      tags.push(marks[j]![0]);
      end = marks[j]!.index + marks[j]![0].length;
      j++;
    }
    const nxt = j < marks.length ? marks[j]!.index : t.length;
    abilities.push([tags, t.slice(end, nxt).trim()]);
    i = j;
  }
  // Untagged newline-separated paragraphs (permanent effects) split away from tagged bodies.
  const out: Array<[string[], string]> = [];
  for (const [tags, body] of abilities) {
    const parts = body
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) {
      out.push([tags, '']);
      continue;
    }
    const merged: string[] = [];
    for (const p of parts) {
      if (merged.length > 0 && (p.startsWith('•') || merged.at(-1)!.trimEnd().endsWith(':'))) {
        merged[merged.length - 1] += ` ${p}`;
      } else merged.push(p);
    }
    out.push([tags, merged[0]!]);
    for (const p of merged.slice(1)) out.push([[], p]);
  }
  return out;
}

// ---------------------------------------------------------------- timing classification

export function classifyTiming(
  tags: string[],
  b: string,
): { timings: string[]; conds: string[]; kws: string[] } {
  let timings: string[] = [];
  const conds: string[] = [];
  const kws: string[] = [];
  for (const tg of tags) {
    const tm = TIMING_TAGS.get(tg);
    if (tm) timings.push(tm);
    else if (COND_TAGS.has(tg)) conds.push(COND_TAGS.get(tg)!);
    else if (KEYWORDS.has(tg)) kws.push(KEYWORDS.get(tg)!);
    else if (tg.startsWith('[DON!! x')) conds.push('donX');
  }
  const replacement = /\binstead\b/.test(b) && /\bwould\b/.test(b);
  if (timings.length === 0) {
    if (replacement) timings.push('replacement');
    else if (/^at the start of the game/i.test(b)) timings.push('startOfGame');
    else if (/^at the (start|beginning) of (your|each|your opponent's) turn/i.test(b))
      timings.push('startOfTurn');
    else if (/^at the end of (your|this|each|your opponent's) turn/i.test(b))
      timings.push('endOfTurnAuto');
    else if (/^(when|whenever|after)\b/i.test(b) || /^if [^,]*,? when\b/i.test(b))
      timings.push('autoEvent');
    else if (
      /\bthis card in your hand\b|\bthis card in your trash\b|in your hand (have|has|gain)/.test(b)
    )
      timings.push('fromHand');
    else if (/under the rules of this game/i.test(b)) timings.push('rulesModifier');
    else if (b) timings.push('permanent');
    else if (kws.length > 0) timings.push('keyword');
  } else if (replacement) timings.push('replacement');
  if (tags.length > 0 && !tags.some((x) => TIMING_TAGS.has(x)) && b && /^when(ever)?\b/i.test(b)) {
    timings = [...timings.filter((x) => x !== 'permanent'), 'autoEvent'];
  }
  if (
    (conds.includes('oncePerTurn') ||
      conds.includes('yourTurn') ||
      conds.includes('opponentTurn') ||
      conds.includes('donX')) &&
    timings.length === 0
  ) {
    timings.push(b ? 'permanent' : 'keyword');
  }
  return { timings, conds, kws };
}

// ---------------------------------------------------------------- cost / effect split

export function splitCost(body: string): [string, string] {
  const m = /^(.*?):\s*(.*)$/is.exec(body);
  if (!m) return ['', body];
  const head = m[1]!;
  if (/choose one|following effects|as follows/i.test(head)) return ['', body];
  if (head.length > 220) return ['', body];
  if (/(you may|DON!! -\d|①\d|^\s*trash this|^\s*rest this)/i.test(head)) {
    return [head.trim(), m[2]!.trim()];
  }
  return ['', body];
}

export function splitClauses(text: string): string[] {
  let t = text.replace(/\s*•\s*/g, ' • ');
  t = t.replaceAll('K.O.', 'K․O․');
  const parts = t
    .split(/(?<=[a-z0-9)\]}"!][.!])\s+(?=[A-Z•"[{])|\s*•\s*/)
    .map((p) => p.replaceAll('K․O․', 'K.O.'));
  const out: string[] = [];
  for (const raw of parts) {
    const p = raw.trim();
    if (!p) continue;
    for (const s of p.split(/(?:,| and)?\s+[Tt]hen,\s+/)) if (s.trim()) out.push(s.trim());
  }
  return out;
}

// ---------------------------------------------------------------- tagging

const compile = (src: ReadonlyArray<readonly [string, string]>, flags: string) =>
  src.map(([n, p]) => [n, new RegExp(p, flags)] as const);
const ACTIONS = compile(ACTION_SRC, 'i');
const CONDS = compile(COND_SRC, 'i');
const DURATIONS = compile(DURATION_SRC, '');
const COSTS = compile(COST_SRC, 'i');

export interface ClauseTags {
  text: string;
  actions: string[];
  conds: string[];
  durations: string[];
}

export function tagClause(c: string): Omit<ClauseTags, 'text'> {
  let acts = ACTIONS.filter(([, rx]) => rx.test(c)).map(([n]) => n);
  const drop = (n: string) => {
    acts = acts.filter((a) => a !== n);
  };
  const has = (n: string) => acts.includes(n);
  if (
    has('searchGeneric') &&
    ['searchToHand', 'addFromTrash', 'lifeToHand', 'oppLifeToHand', 'addFromDeckToHand'].some(has)
  )
    drop('searchGeneric');
  if (
    has('addDon') &&
    has('setActive') &&
    !/set (?:up to \d+ of )?(?:your |this |the |that )[^.]*?as active/i.test(c)
  )
    drop('setActive');
  if (has('addLifeFromDeck') && has('placeToLife')) drop('placeToLife');
  if (has('oppLifeToHand') && has('placeToLife') && !/to the top of your Life/i.test(c))
    drop('placeToLife');
  if (has('oppLifeToHand') && has('addLifeFromDeck') && !/to the top of your Life/i.test(c))
    drop('addLifeFromDeck');
  if (has('selectTarget') && has('select')) drop('select');
  return {
    actions: [...new Set(acts)],
    conds: CONDS.filter(([, rx]) => rx.test(c)).map(([n]) => n),
    durations: DURATIONS.filter(([, rx]) => rx.test(c)).map(([n]) => n),
  };
}

export const tagCost = (c: string): string[] =>
  COSTS.filter(([, rx]) => rx.test(c)).map(([n]) => n);

export interface AbilityTags {
  tags: string[];
  timings: string[];
  conds: string[];
  keywords: string[];
  cost: string;
  costActions: string[];
  clauses: ClauseTags[];
}

export interface Analysis {
  text: string;
  fixes: string[];
  abilities: AbilityTags[];
}

export function analyse(raw: string | null | undefined): Analysis {
  const { text, fixes } = normalize(raw);
  const res: Analysis = { text, fixes, abilities: [] };
  if (!text) return res;
  for (const [tags, body] of splitAbilities(text)) {
    const { timings, conds, kws } = classifyTiming(tags, body);
    const [cost, eff] = splitCost(body);
    const clauses = splitClauses(eff).map((c) => ({ text: c, ...tagClause(c) }));
    if (timings.includes('replacement')) {
      for (const cl of clauses) cl.actions = ['replacement', ...cl.actions];
    }
    res.abilities.push({
      tags,
      timings,
      conds,
      keywords: kws,
      cost,
      costActions: cost ? tagCost(cost) : [],
      clauses,
    });
  }
  return res;
}

/** A card's printed text as the tagger saw it in Track E: effect text, then the trigger with its marker. */
export function cardText(card: Pick<Card, 'effectText' | 'triggerText'>): string {
  return card.triggerText ? `${card.effectText}\n[Trigger] ${card.triggerText}` : card.effectText;
}

// ---------------------------------------------------------------- tagger tag -> DSL primitive

/** Fine tagger tag to DSL action family (stats.py FAM). `null` marks a tag that is not an action. */
const FAM = new Map<string, string | null>(
  Object.entries({
    draw: 'draw',
    drawTo: 'draw',
    trashFromHand: 'discard',
    handSizeTrash: 'discard',
    trashAnyNumber: 'discard',
    opponentDiscards: 'opponentDiscard',
    mill: 'mill',
    lookTop: 'lookAtTop',
    revealTop: 'revealTop',
    searchToHand: 'lookAtTop:addToHand',
    searchGeneric: 'addToHand(other)',
    addFromDeckToHand: 'lookAtTop:addToHand',
    deckBottomRest: 'lookAtTop:restToBottom',
    reorderTopBottom: 'lookAtTop:reorder',
    addFromTrash: 'trashToHand',
    addSelfToHand: 'trashToHand',
    handToDeck: 'handToDeck',
    trashToDeck: 'trashToDeck',
    shuffleDeck: 'shuffle',
    massToDeck: 'handToDeck',
    oppPlacesToDeck: 'opponentHandOrTrashToDeck',
    ko: 'ko',
    bounceToHand: 'bounceToHand',
    oppReturnsOwn: 'bounceToHand',
    returnToHandMass: 'bounceToHand',
    toDeckBottom: 'toDeckBottom',
    trashFromField: 'trashFromField',
    restTarget: 'rest',
    restOwn: 'restOwn',
    freeze: 'skipRefresh',
    setActive: 'setActive',
    powerPlus: 'powerMod',
    powerMinus: 'powerMod',
    powerPerCount: 'powerMod(scaled)',
    basePowerSet: 'setBasePower',
    setPower: 'setBasePower',
    swapPower: 'swapBasePower',
    costPlus: 'costMod',
    costMinus: 'costMod',
    setCost: 'costMod',
    counterValue: 'counterValueMod',
    giveDon: 'giveDon',
    addDon: 'addDon',
    returnDon: 'returnDon',
    restDon: 'restDon',
    playFromHand: 'play:hand',
    playFromTrash: 'play:trash',
    playFromDeck: 'play:deck',
    playThis: 'play:self',
    playFromLife: 'play:life',
    playSelected: 'play:selected',
    playedRested: 'play:rested',
    activateEventFromHand: 'activateEventFromHand',
    addLifeFromDeck: 'addLife',
    placeToLife: 'addLife',
    lifeToHand: 'lifeToHand',
    oppLifeToHand: 'opponentLifeToHand',
    trashLife: 'trashLife',
    lifeFaceUp: 'turnLifeFace',
    lifeReorder: 'lookAtLife',
    damage: 'damage',
    cannotBeKO: 'restrict:cannotBeKO',
    cannotBeRemoved: 'restrict:cannotBeRemoved',
    cannotAttack: 'restrict:cannotAttack',
    attackTargetLock: 'restrict:attackTargetLock',
    blockerDisable: 'restrict:cannotActivateBlocker',
    cannotPlay: 'restrict:cannotPlay',
    cannotDraw: 'restrict:cannotDraw',
    cannotActivate: 'restrict:cannotActivate',
    cannotAddLife: 'restrict:cannotAddLife',
    cannotRest: 'restrict:cannotBeRested',
    restrictAttackAgainst: 'restrict:cannotAttack',
    gainKeyword: 'grantKeyword',
    rushCharacterGrant: 'grantKeyword',
    loseKeyword: 'removeAbilities',
    negate: 'negateEffects',
    canAttackActive: 'grant:canAttackActive',
    extraAttack: 'grant:extraAttack',
    modal: 'chooseOne',
    giveOpponentChoice: 'opponentChooses',
    activateOther: 'activateOwnAbility',
    revealFromHand: 'revealFromHand',
    nameAlias: 'nameAlias',
    typeAlias: 'typeAlias',
    donDeckSize: 'rules:donDeckSize',
    rulesModifier: 'rules:other',
    deckRule: 'rules:deck',
    copyStats: 'copyStats',
    delayed: 'delayed',
    attackRedirect: 'redirectAttack',
    endBattle: 'endBattle',
    preventLifeLoss: 'replacement',
    replacement: 'replacement',
    trashSelfCost: 'trashFromField',
    placeToStage: 'play:stage',
    winLose: 'winLose',
    extraTurn: 'extraTurn',
    select: 'select',
    selectTarget: 'select',
    activationWindow: 'activationWindow',
  }),
);
for (const k of ['donMinusCost', 'circledCost', 'restDonCost', 'donCountCheck', 'lifeCountCheck'])
  FAM.set(k, null);

/** Families that carry no action of their own and so do not make a clause "tagged" (stats.py). */
const NONACTION_FAMS = new Set<string | null>([
  'select',
  'activationWindow',
  'delayed',
  'rules:other',
  'rules:deck',
  null,
]);

const fam = (x: string): string | null => (FAM.has(x) ? FAM.get(x)! : x);

/** DSL-level primitive for a family (dsl_map.py P). `null` drops it; unlisted families pass through unmapped. */
const PRIM = new Map<string, string | null>(
  Object.entries({
    powerMod: 'powerMod',
    'powerMod(scaled)': 'powerMod',
    draw: 'draw',
    lookAtTop: 'lookAtTop',
    'lookAtTop:addToHand': 'lookAtTop',
    'lookAtTop:restToBottom': 'lookAtTop',
    'lookAtTop:reorder': 'lookAtTop',
    addLife: 'move',
    opponentLifeToHand: 'move',
    lifeToHand: 'move',
    trashToHand: 'move',
    toDeckBottom: 'move',
    bounceToHand: 'move',
    trashToDeck: 'move',
    handToDeck: 'move',
    trashLife: 'move',
    opponentHandOrTrashToDeck: 'move',
    trashFromField: 'move',
    shuffle: 'move',
    lookAtLife: 'move',
    'play:self': 'play',
    'play:hand': 'play',
    'play:trash': 'play',
    'play:deck': 'play',
    'play:selected': 'play',
    'play:rested': 'play',
    'play:stage': 'play',
    'play:life': 'play',
    ko: 'ko',
    addDon: 'addDon',
    discard: 'trashFromHand',
    opponentDiscard: 'trashFromHand',
    mill: 'mill',
    costMod: 'costMod',
    giveDon: 'giveDon',
    rest: 'rest',
    restOwn: 'rest',
    setActive: 'setActive',
    replacement: '(replacement ability)',
    setBasePower: 'setBasePower',
    swapBasePower: 'swapBasePower',
    negateEffects: 'negateEffects',
    chooseOne: 'chooseOne',
    opponentChooses: 'chooseOne',
    returnDon: 'returnDon',
    skipRefresh: 'skipRefresh',
    restDon: 'rest',
    counterValueMod: 'counterMod',
    delayed: 'delayed',
    activateOwnAbility: 'activateAbility',
    revealTop: 'reveal',
    turnLifeFace: 'turnLifeFace',
    damage: 'damage',
    extraTurn: 'extraTurn',
    nameAlias: '(rules: nameAlias)',
    typeAlias: '(rules: typeAlias)',
    'rules:donDeckSize': '(rules: donDeckSize)',
    'rules:other': null,
    'rules:deck': '(rules: deckConstruction)',
    select: null,
    activationWindow: null,
    winLose: '(rules: winLose)',
    redirectAttack: 'redirectAttack',
    activateEventFromHand: 'activateAbility',
    'grant:canAttackActive': 'grantAbility',
    'grant:extraAttack': 'grantAbility',
    removeAbilities: 'negateEffects',
    revealFromHand: 'reveal',
  }),
);

function prim(f: string): string | null {
  if (f.startsWith('grantKeyword')) return 'grantKeyword';
  if (f.startsWith('restrict:')) return f; // kept fine-grained: the DSL's restrictions are individually implemented
  return PRIM.has(f) ? PRIM.get(f)! : f;
}

export interface Features {
  /** DSL-level action primitives. */
  prims: string[];
  /** Cost kinds, `cost:` prefixed as the tagger names them. */
  costs: string[];
  /** Timings, tagger names. */
  timings: string[];
  /** Clauses with no action tag. */
  clauses: number;
  untaggedClauses: number;
}

export function features(a: Analysis): Features {
  const prims = new Set<string>();
  const costs = new Set<string>();
  const timings = new Set<string>();
  let clauses = 0;
  let untagged = 0;
  for (const ab of a.abilities) {
    for (const t of ab.timings) timings.add(t);
    for (const c of ab.costActions) costs.add(c);
    if (ab.cost && ab.costActions.length === 0) costs.add('cost:other');
    for (const cl of ab.clauses) {
      const all = new Set<string | null>(cl.actions.map(fam));
      clauses++;
      if (![...all].some((f) => !NONACTION_FAMS.has(f))) untagged++;
      for (const f of all) {
        const p = f ? prim(f) : null;
        if (p) prims.add(p);
      }
      if (
        /gains? \[(Rush|Blocker|Double Attack|Banish|Rush: Character|Unblockable)\]/.test(cl.text)
      )
        prims.add('grantKeyword');
    }
  }
  return {
    prims: [...prims].sort(),
    costs: [...costs].sort(),
    timings: [...timings].sort(),
    clauses,
    untaggedClauses: untagged,
  };
}

// ---------------------------------------------------------------- DSL names

type DslKind = 'action' | 'cost' | 'timing' | 'restriction';

/** Tagger primitive to the DSL's name for it, where the mapping is clear. Unlisted means "unknown". */
const DSL_ACTION: Record<string, string> = {
  powerMod: 'power',
  draw: 'draw',
  lookAtTop: 'lookAtTop',
  move: 'move',
  play: 'play',
  ko: 'ko',
  rest: 'rest',
  setActive: 'setActive',
  setBasePower: 'setBasePower',
  addDon: 'addDon',
  returnDon: 'returnDon',
  giveDon: 'giveDon',
  skipRefresh: 'skipRefresh',
  negateEffects: 'negate',
  grantKeyword: 'grant',
  grantAbility: 'grant',
  activateAbility: 'activate',
  reveal: 'reveal',
  trashFromHand: 'trashFromHand',
  costMod: 'cost',
};
/** Names that live under `IMPLEMENTED.steps` or `.continuous` rather than `.actions`. */
const DSL_STEP: Record<string, string> = { chooseOne: 'chooseOne', delayed: 'delayed' };
const DSL_CONTINUOUS: Record<string, string> = { counterMod: 'counter' };
const DSL_RESTRICTION: Record<string, string> = {
  'restrict:cannotAttack': 'cannotAttack',
  'restrict:cannotActivateBlocker': 'cannotActivateBlockerAgainstIt',
  'restrict:cannotDraw': 'cannotDrawByOwnEffects',
  'restrict:cannotBeRemoved': 'cannotBeRemovedByOpponentEffects',
  'restrict:cannotBeKO': 'cannotBeKOd',
};
const DSL_COST: Record<string, string> = {
  'cost:donMinus': 'donMinus',
  'cost:restDon': 'restDon',
  'cost:trashFromHand': 'trash',
  'cost:restSelf': 'restSelf',
  'cost:trashSelf': 'trashSelf',
  'cost:revealFromHand': 'reveal',
  'cost:lifeToHand': 'lifeToHand',
  'cost:lifeFaceUp': 'turnLifeFaceUp',
  'cost:mill': 'mill',
  'cost:restOwnCharacters': 'rest',
  'cost:returnOwnCharacter': 'move',
  'cost:trashOwnCharacter': 'trash',
  'cost:trashFromTrash': 'move',
  'cost:returnDon': 'returnDon',
};
const DSL_TIMING: Record<string, string> = {
  onPlay: 'onPlay',
  whenAttacking: 'whenAttacking',
  onOpponentAttack: 'onOpponentAttack',
  onBlock: 'onBlock',
  onKO: 'onKO',
  endOfYourTurn: 'endOfYourTurn',
  endOfOpponentTurn: 'endOfOpponentsTurn',
  startOfGame: 'startOfGame',
};
/** Ability shapes the DSL expresses structurally, not as a timing name, so they are not gaps. */
const STRUCTURAL_TIMINGS = new Set([
  'activateMain',
  'main',
  'counter',
  'trigger',
  'permanent',
  'keyword',
]);

const inList = (list: readonly string[], name: string) => list.includes(name);

export type Implemented = 'yes' | 'no' | 'unknown';

export interface Resolved {
  kind: DslKind;
  /** The DSL name, or null when the tagger primitive has no clear DSL name. */
  dsl: string | null;
  implemented: Implemented;
}

/** Resolve a tag (an action primitive, a `cost:` name or a `timing:` name) to its DSL name. */
export function resolveTag(tag: string): Resolved {
  if (tag.startsWith('cost:')) {
    const dsl = DSL_COST[tag] ?? null;
    return {
      kind: 'cost',
      dsl,
      implemented: dsl === null ? 'unknown' : inList(IMPLEMENTED.costs, dsl) ? 'yes' : 'no',
    };
  }
  if (tag.startsWith('timing:')) {
    const dsl = DSL_TIMING[tag.slice(7)] ?? null;
    return {
      kind: 'timing',
      dsl,
      implemented: dsl === null ? 'unknown' : inList(IMPLEMENTED.timings, dsl) ? 'yes' : 'no',
    };
  }
  if (tag.startsWith('restrict:')) {
    const dsl = DSL_RESTRICTION[tag] ?? null;
    return {
      kind: 'restriction',
      dsl,
      implemented: dsl === null ? 'unknown' : inList(IMPLEMENTED.restrictions, dsl) ? 'yes' : 'no',
    };
  }
  if (tag in DSL_ACTION) {
    const dsl = DSL_ACTION[tag]!;
    return { kind: 'action', dsl, implemented: inList(IMPLEMENTED.actions, dsl) ? 'yes' : 'no' };
  }
  if (tag in DSL_STEP) {
    const dsl = DSL_STEP[tag]!;
    return { kind: 'action', dsl, implemented: inList(IMPLEMENTED.steps, dsl) ? 'yes' : 'no' };
  }
  if (tag in DSL_CONTINUOUS) {
    const dsl = DSL_CONTINUOUS[tag]!;
    return { kind: 'action', dsl, implemented: inList(IMPLEMENTED.continuous, dsl) ? 'yes' : 'no' };
  }
  return { kind: 'action', dsl: null, implemented: 'unknown' };
}

/** The tags stored on a card entry: action primitives, `cost:` names, and mapped-or-unmapped `timing:` names. */
export function cardTags(f: Features): string[] {
  const timings = f.timings.filter((t) => !STRUCTURAL_TIMINGS.has(t)).map((t) => `timing:${t}`);
  return [...f.prims, ...f.costs, ...timings].sort();
}

// ---------------------------------------------------------------- coverage

export type Status = 'scripted' | 'vanilla' | 'keywords' | 'unscripted';

export interface MeasureInput {
  cards: readonly Card[];
  scripted: ReadonlySet<string>;
  /** Play weight per card id; absent ids weigh 0. */
  weights: ReadonlyMap<string, number>;
  weightSource: string;
  asOf: string;
}

export function statusOf(card: Card, scripted: ReadonlySet<string>): Status {
  const a = automation(card, scripted);
  return a === 'not-automated' ? 'unscripted' : a;
}

export interface Tally {
  total: number;
  scripted: number;
  vanilla: number;
  keywords: number;
  unscripted: number;
  /** Scripted, vanilla or keyword-only: cards that play fully. */
  playingFully: number;
  /** `playingFully / total` as a percentage to two decimals. */
  pct: number;
}

const emptyTally = (): Tally => ({
  total: 0,
  scripted: 0,
  vanilla: 0,
  keywords: 0,
  unscripted: 0,
  playingFully: 0,
  pct: 0,
});

function add(t: Tally, s: Status): void {
  t.total++;
  t[s]++;
  if (s !== 'unscripted') t.playingFully++;
  t.pct = t.total === 0 ? 0 : Math.round((t.playingFully / t.total) * 10000) / 100;
}

export interface BacklogEntry {
  id: string;
  set: string;
  block: number | string | null;
  category: string;
  legality: string;
  status: Status;
  tags: string[];
  /** Clauses with no action tag. */
  untagged: number;
  weight: number;
  /** Block 2: held until the rotation is announced (ADR 0014). */
  held?: true;
}

export interface GapEntry {
  primitive: string;
  kind: DslKind;
  dsl: string | null;
  implemented: Implemented;
  cards: number;
  weight: number;
}

export interface CoverageReport {
  asOf: string;
  weightSource: string;
  tagger: {
    cards: number;
    cardsWithText: number;
    clauses: number;
    clausesTagged: number;
    /** `clausesTagged / clauses` as a percentage to two decimals (Track E reported 97.7). */
    clauseTagRate: number;
  };
  standard: {
    overall: Tally;
    byBlock: Record<string, Tally>;
    bySet: Record<string, Tally>;
    /** Cards whose Standard legality is unknown (no block): listed, not counted above. */
    unknown: { count: number; ids: string[] };
  };
  backlog: BacklogEntry[];
  gaps: GapEntry[];
}

/** Rank of a block in the backlog: 5, then 4, then 3, then 2 last (ADR 0014). */
function blockRank(b: number | string | null): number {
  switch (b) {
    case 5:
      return 0;
    case 4:
      return 1;
    case 3:
      return 2;
    case 'X':
      return 3;
    case 2:
      return 4;
    default:
      return 5;
  }
}

/** `OP-17` sorts newer than `OP-09`; boosters before extras before starters (same key as `setOrder`). */
function setKey(code: string): number {
  const m = /^([A-Z]+)-?(\d*)$/.exec(code);
  if (!m) return -1;
  return ['OP', 'EB', 'PRB', 'ST', 'P'].indexOf(m[1]!) * 1000 + Number(m[2] || 0);
}

const cmpStr = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const isStandard = (c: Card): boolean =>
  c.legality.standard.status === 'legal' || c.legality.standard.status === 'restricted';

export function compareBacklog(a: BacklogEntry, b: BacklogEntry): number {
  return (
    blockRank(a.block) - blockRank(b.block) ||
    setKey(b.set) - setKey(a.set) ||
    cmpStr(a.set, b.set) ||
    Number(b.category === 'Leader') - Number(a.category === 'Leader') ||
    b.weight - a.weight ||
    cmpStr(a.id, b.id)
  );
}

export function measure(input: MeasureInput): CoverageReport {
  const overall = emptyTally();
  const byBlock = new Map<string, Tally>();
  const bySet = new Map<string, Tally>();
  const unknownIds: string[] = [];
  const backlog: BacklogEntry[] = [];
  const gapAcc = new Map<string, { cards: number; weight: number }>();
  let cardsWithText = 0;
  let clauses = 0;
  let untagged = 0;

  for (const card of input.cards) {
    const text = cardText(card);
    const analysis = analyse(text);
    if (analysis.text) cardsWithText++;
    const f = features(analysis);
    clauses += f.clauses;
    untagged += f.untaggedClauses;

    if (card.legality.standard.status === 'unknown') unknownIds.push(card.id);
    if (!isStandard(card)) continue;
    const status = statusOf(card, input.scripted);
    add(overall, status);
    const blockKey = String(card.block);
    if (!byBlock.has(blockKey)) byBlock.set(blockKey, emptyTally());
    add(byBlock.get(blockKey)!, status);
    if (!bySet.has(card.set)) bySet.set(card.set, emptyTally());
    add(bySet.get(card.set)!, status);
    if (status !== 'unscripted') continue;

    const tags = cardTags(f);
    const weight = input.weights.get(card.id) ?? 0;
    const entry: BacklogEntry = {
      id: card.id,
      set: card.set,
      block: card.block,
      category: card.category,
      legality: card.legality.standard.status,
      status,
      tags,
      untagged: f.untaggedClauses,
      weight,
    };
    if (card.block === 2) entry.held = true;
    backlog.push(entry);
    for (const t of tags) {
      const g = gapAcc.get(t) ?? { cards: 0, weight: 0 };
      g.cards++;
      g.weight += weight;
      gapAcc.set(t, g);
    }
  }

  backlog.sort(compareBacklog);
  const gaps: GapEntry[] = [...gapAcc].map(([tag, g]) => {
    const r = resolveTag(tag);
    return {
      primitive: tag,
      kind: r.kind,
      dsl: r.dsl,
      implemented: r.implemented,
      cards: g.cards,
      weight: g.weight,
    };
  });
  gaps.sort((a, b) => b.cards - a.cards || b.weight - a.weight || cmpStr(a.primitive, b.primitive));

  const sortedObj = <T>(m: Map<string, T>, order: (a: string, b: string) => number) =>
    Object.fromEntries([...m].sort(([a], [b]) => order(a, b)));
  return {
    asOf: input.asOf,
    weightSource: input.weightSource,
    tagger: {
      cards: input.cards.length,
      cardsWithText,
      clauses,
      clausesTagged: clauses - untagged,
      clauseTagRate: clauses === 0 ? 0 : Math.round(((clauses - untagged) / clauses) * 10000) / 100,
    },
    standard: {
      overall,
      byBlock: sortedObj(byBlock, (a, b) => blockRank(Number(a) || a) - blockRank(Number(b) || b)),
      bySet: sortedObj(bySet, (a, b) => setKey(a) - setKey(b) || cmpStr(a, b)),
      unknown: { count: unknownIds.length, ids: unknownIds.sort() },
    },
    backlog,
    gaps,
  };
}

// ---------------------------------------------------------------- weights

export interface PlayFrequencyFile {
  cards: Array<{ id: string; decks?: number; copies: number; share?: number }>;
  /** Leaders appear once per deck, so `decks` is their copies. */
  leaders?: Array<{ id: string; decks: number }>;
}
export interface MetaListsFile {
  archetypes: Array<{
    lists: Array<{ leader: string; main: Array<{ id: string; count: number }> }>;
  }>;
}

/**
 * Play weight per card. Prefers `play-frequency.json` (copies played); falls back to the meta lists
 * (the Track E meta weight: a leader counts 1 per list, a main-deck card its copies); else all 0.
 */
export function loadWeights(
  playFrequency: PlayFrequencyFile | null,
  metaLists: MetaListsFile | null,
): { weights: Map<string, number>; source: string } {
  const weights = new Map<string, number>();
  if (playFrequency) {
    for (const c of playFrequency.cards) weights.set(c.id, (weights.get(c.id) ?? 0) + c.copies);
    for (const l of playFrequency.leaders ?? [])
      weights.set(l.id, (weights.get(l.id) ?? 0) + l.decks);
    return { weights, source: 'play-frequency.json (copies; leaders by decks)' };
  }
  if (metaLists) {
    for (const a of metaLists.archetypes)
      for (const l of a.lists) {
        weights.set(l.leader, (weights.get(l.leader) ?? 0) + 1);
        for (const m of l.main) weights.set(m.id, (weights.get(m.id) ?? 0) + m.count);
      }
    return { weights, source: 'docs/research/meta-lists.json (copies; fallback)' };
  }
  return { weights, source: 'none (all weights 0)' };
}

// ---------------------------------------------------------------- output

/** Deterministic JSON: sorted object keys, one array element per line, no timestamps beyond `asOf`. */
export function formatReport(report: CoverageReport): string {
  const sort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === 'object')
      return Object.fromEntries(
        Object.entries(v as Record<string, unknown>)
          .sort(([a], [b]) => cmpStr(a, b))
          .map(([k, x]) => [k, sort(x)]),
      );
    return v;
  };
  const emit = (v: unknown, indent: string): string => {
    if (Array.isArray(v)) {
      if (v.length === 0) return '[]';
      return `[\n${v.map((x) => `${indent} ${JSON.stringify(x)}`).join(',\n')}\n${indent}]`;
    }
    if (v && typeof v === 'object') {
      const e = Object.entries(v as Record<string, unknown>);
      if (e.length === 0) return '{}';
      const flat = e.every(([, x]) => x === null || typeof x !== 'object');
      if (flat && indent !== '') return JSON.stringify(v);
      return `{\n${e.map(([k, x]) => `${indent} ${JSON.stringify(k)}: ${emit(x, `${indent} `)}`).join(',\n')}\n${indent}}`;
    }
    return JSON.stringify(v);
  };
  return `${emit(sort(report), '')}\n`;
}
