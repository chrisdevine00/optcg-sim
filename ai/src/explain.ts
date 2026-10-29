/**
 * The `Explanation` builder for AI decisions (ARCHITECTURE §4.5, docs/design/explanations.md).
 *
 * Input is **public facts only** (flows D9): powers and cards on the field, Life and hand counts,
 * cards revealed by the move itself, the archetype's sourced lists, and which heuristic term the
 * chosen move changed most compared with its best alternative. Nothing here can name a card in the
 * AI's hand, deck or Life: the facts never carry one. Copy follows explanations.md: claims of at
 * most 12 words, evidence lines with every number in `figures`, the real minus sign, "DON!!", the AI
 * named by its Leader, "you" for the player.
 */
import type { Explanation, Evidence, Move } from './explanation.ts';
import type { LeaderTrickCopy } from './playbook.ts';
import type { WeightKey } from './playbook.ts';

export const MINUS = '−';
const signed = (n: number): string => (n < 0 ? `${MINUS}${-n}` : `+${n}`);

/** Each concept's curriculum lesson (docs/content/curriculum.md). */
export const LESSON: Record<string, string> = {
  tempo: 'L17-tempo-and-rush',
  'don-efficiency': 'L09-don-efficiency',
  'life-as-resource': 'L11-life-as-resource',
  'counter-or-take': 'L10-counter-or-take',
  'counters-and-blockers': 'L05-block-and-counter',
  'board-vs-face': 'L14-board-vs-face',
  'rush-tempo-swings': 'L17-tempo-and-rush',
  'lethal-math': 'L15-lethal-math',
  mulligan: 'L12-mulligan',
  'turn-order': 'L13-turn-order',
  'hand-management': 'L18-hand-management',
  'leader-identity': 'L19-leader-identity',
  'card-advantage': 'L20-card-advantage',
  'removal-timing': 'L21-removal-and-denial',
  'resource-denial': 'L21-removal-and-denial',
  'hand-reading': 'L16-reading-counters',
};

/** A card in a fact: its id, printed name and current power. */
export interface CardFact {
  card: string;
  name: string;
  power: number;
  isLeader: boolean;
}

/** The battle the AI is defending, as both players can see it. */
export interface BattleFacts {
  aiName: string;
  aiLife: number;
  aiHand: number;
  attacker: CardFact;
  target: CardFact;
  /** attack − defence + 1000 (CR 7-1-4-1: ties go to the attacker). */
  need: number;
  /** The player's other attackers still able to attack this turn. */
  readyOthers: CardFact[];
  /** Its archetype's biggest Counter, from the sourced lists (public). */
  biggestCounter: number;
  /** The AI Leader's once-per-turn defensive trick, if it has one. */
  leaderTrick?: { name: string; used: boolean };
}

/** The first word of a card name as a figure key: "Sanji" → "sanji", "Monkey.D.Luffy" → "monkey". */
export function figureKey(name: string): string {
  const w = (name.split(/[^A-Za-z]+/).find((x) => x.length > 0) ?? 'card').toLowerCase();
  return w;
}
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
const word = (n: number): string => WORDS[n] ?? String(n);

function stopText(attack: number, defence: number): string {
  return `${attack} ${MINUS} ${defence} + 1000 = ${attack - defence + 1000}`;
}

/** "your Leader", or the Character's name. */
const attackerRef = (a: CardFact): string => (a.isLeader ? 'your Leader' : a.name);

function base(
  conceptId: string,
  claim: string,
  evidence: Evidence[],
  line: Move[] | null,
  outcome: string,
  nextTime: string,
  sources: string[],
  lessonId = LESSON[conceptId] ?? 'L08-first-full-game',
): Explanation {
  return {
    conceptId,
    claim,
    evidence,
    line,
    outcome,
    certainty: 'any-hand',
    nextTime,
    lessonId,
    sources,
  };
}

/** E12: a block. */
export function explainBlock(
  f: BattleFacts,
  blocker: CardFact & { hasOnPlay: boolean },
): Explanation {
  const cardsNeeded = f.biggestCounter > 0 ? Math.ceil(f.need / f.biggestCounter) : f.need / 1000;
  const evidence: Evidence[] = [
    {
      text: `${f.aiName} was at ${f.aiLife} Life with ${f.aiHand} cards in hand.`,
      figures: { aiLife: f.aiLife, aiHandSize: f.aiHand },
    },
    {
      text: `Stopping ${f.attacker.isLeader ? "your Leader's attack" : `${f.attacker.name} at its Leader`} takes ${stopText(f.attacker.power, f.target.power)}: at least ${cardsNeeded} ${cardsNeeded === 1 ? 'card' : 'cards'}, since its deck's biggest counter is +${f.biggestCounter}.`,
      figures: { stopNeeded: f.need, biggestCounter: f.biggestCounter, cardsNeeded },
    },
  ];
  const dies = f.attacker.power >= blocker.power;
  const key = `${figureKey(blocker.name)}Power`;
  if (dies)
    evidence.push({
      text: `${blocker.hasOnPlay ? `${blocker.name}'s [On Play] was already used. ` : ''}Blocking cost one ${blocker.power}-power Character instead of cards.`,
      figures: { [key]: blocker.power },
    });
  else
    evidence.push({
      text: `${blocker.name} (${blocker.power}) holds against ${f.attacker.power}, so blocking cost nothing.`,
      figures: { [key]: blocker.power, attackPower: f.attacker.power },
    });
  if (f.leaderTrick?.used)
    evidence.push({
      text: `Its Leader's ${f.leaderTrick.name} was already used this turn.`,
      figures: {},
    });
  return base(
    'counters-and-blockers',
    `It blocked with ${blocker.name}: the cheapest way to keep its Life.`,
    evidence,
    [{ kind: 'block', text: `Block with ${blocker.name}.`, card: blocker.card }],
    dies
      ? `Kept ${f.aiLife} Life and all ${f.aiHand} cards, for one ${blocker.power}-power Character.`
      : `Kept ${f.aiLife} Life, all ${f.aiHand} cards and ${blocker.name}.`,
    'Expect a Blocker whose job is done to be thrown in front of your biggest attack. Attack with something smaller first to draw it out.',
    ['CR 7-1-2-1', 'CR 10-1-4-1', 'SH-CTR', 'SH-MIS'],
  );
}

/** E13: a Counter (the first card of the defence; it is revealed by being played). */
export function explainCounter(
  f: BattleFacts,
  counter: { card: string; name: string; value: number; event: boolean; cost: number },
): Explanation {
  const after = f.target.power + counter.value;
  const evidence: Evidence[] = [];
  const life = f.aiLife;
  if (life <= 1)
    evidence.push({
      text:
        life === 1
          ? `${f.aiName} was at 1 Life: one hit leaves 0, and the next hit wins for you.`
          : `${f.aiName} was at 0 Life: this hit would win the game for you.`,
      figures: { aiLife: life },
    });
  else
    evidence.push({
      text: `${f.aiName} was at ${life} Life with ${f.aiHand} cards in hand.`,
      figures: { aiLife: life, aiHandSize: f.aiHand },
    });
  const others = f.readyOthers;
  if (others.length > 0) {
    const figures: Record<string, number> = {};
    const names: string[] = [];
    const stops: string[] = [];
    for (const o of others) {
      const k = figureKey(o.name);
      const stop = o.power - f.target.power + 1000;
      figures[`${k}Power`] = o.power;
      figures[`stop${cap(k)}`] = Math.max(0, stop);
      names.push(`${o.isLeader ? 'your Leader' : o.name} (${o.power})`);
      stops.push(String(Math.max(0, stop)));
    }
    const join = (xs: string[]) =>
      xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
    evidence.push({
      text: `You still had ${join(names)} ready. Stopping ${others.length === 1 ? 'it' : 'them'} takes ${join(stops)}.`,
      figures,
    });
  }
  evidence.push({
    text: counter.event
      ? `${counter.name} costs ${counter.cost} and made its Leader ${after} against your ${f.attacker.power}.`
      : `${counter.name}'s +${counter.value} Counter made its ${f.target.isLeader ? 'Leader' : f.target.name} ${after} against your ${f.attacker.power}.`,
    figures: {
      [f.target.isLeader ? 'leaderAfter' : 'defenceAfter']: after,
      attackPower: f.attacker.power,
    },
  });
  if (life === 1 && others.length > 0)
    evidence.push({
      text: `Taking this hit would mean stopping ${others.length === 2 ? 'both' : `all ${word(others.length)}`} of your next attacks. Countering now leaves it a Life card to spend on one of them.`,
      figures: {},
    });
  const claim =
    life === 1
      ? 'It countered because at 1 Life it can take only one more hit.'
      : life === 0
        ? 'It countered because at 0 Life this hit would lose.'
        : f.target.isLeader
          ? `It countered to stay at ${life} Life.`
          : `It countered to keep ${f.target.name} on the board.`;
  const outcome =
    life === 1 && others.length > 0
      ? `Stays at 1 Life, with one hit to spare against your last ${others.length === 1 ? 'attack' : `${word(others.length)} attacks`}.`
      : f.target.isLeader
        ? `Stays at ${life} Life.`
        : `${f.target.name} stays on the board.`;
  return base(
    'counter-or-take',
    claim,
    evidence,
    [
      {
        kind: 'counter',
        text: counter.event
          ? `Play ${counter.name}: +${counter.value} to its ${f.target.isLeader ? 'Leader' : f.target.name}.`
          : `Counter with ${counter.name}: +${counter.value} to its ${f.target.isLeader ? 'Leader' : f.target.name}.`,
        card: counter.card,
      },
    ],
    outcome,
    life <= 1
      ? 'When they are at 1 Life, they must stop all but one of your attacks. Send the one that is hardest to stop last.'
      : 'A counter has to put them above your power, not level with it. Size your attacks to what their hand can stop.',
    ['CR 7-1-4-1', 'CR 7-1-4-1-1-1', 'SH-CTR'],
  );
}

/** Took a hit it could have stopped, or had nothing to stop it with (no card is named). */
export function explainTake(f: BattleFacts): Explanation {
  const evidence: Evidence[] = [
    {
      text: `${f.aiName} was at ${f.aiLife} Life with ${f.aiHand} cards in hand.`,
      figures: { aiLife: f.aiLife, aiHandSize: f.aiHand },
    },
  ];
  if (f.need <= 0) {
    evidence.push({
      text: `${cap(attackerRef(f.attacker))} attacked at ${f.attacker.power} into ${f.target.power}: the attack already fails.`,
      figures: { attackPower: f.attacker.power, defencePower: f.target.power },
    });
    return base(
      'counters-and-blockers',
      'It played no counter: the attack already failed.',
      evidence,
      null,
      'Kept every card.',
      'An attack that does not reach their power needs no answer. Give DON!! before you attack, not after.',
      ['CR 7-1-4-1'],
    );
  }
  evidence.push({
    text: `Stopping ${attackerRef(f.attacker)} took ${stopText(f.attacker.power, f.target.power)}.`,
    figures: { stopNeeded: f.need },
  });
  if (f.target.isLeader)
    return base(
      'counter-or-take',
      `It took the hit: at ${f.aiLife} Life a hit is also a card.`,
      evidence,
      [{ kind: 'take', text: 'Take the hit.' }],
      'Lost 1 Life, and the Life card went to its hand.',
      'At high Life, let a lone hit through. Keep counters for hits that would cost you the game or a Character you need.',
      ['CR 7-1-4-1-1-2', 'SH-CTR', 'SH-MIS'],
    );
  return base(
    'counter-or-take',
    `It let ${f.target.name} go rather than spend cards.`,
    evidence,
    [{ kind: 'take', text: `Let ${f.target.name} be K.O.'d.` }],
    `Kept its cards; ${f.target.name} is K.O.'d.`,
    'Countering to save a Character pays only if it will matter next turn.',
    ['CR 7-1-4-1', 'SH-CTR'],
  );
}

/** E16: the Leader's defensive trick on the player's attacker. */
export function explainLeaderTrick(
  f: BattleFacts,
  trick: LeaderTrickCopy,
  leaderCard: string,
  amount: number,
  donCost: number,
  donDeckAfter: number,
): Explanation {
  const after = f.attacker.power + amount;
  const fails = after < f.target.power;
  const evidence: Evidence[] = [
    {
      text: `Your ${f.attacker.name} attacked at ${f.attacker.power} into its ${f.target.power} ${f.target.isLeader ? 'Leader' : f.target.name}.`,
      figures: { attackPower: f.attacker.power, defencePower: f.target.power },
    },
  ];
  const ret = `${f.aiName} returned ${donCost} DON!! to give ${f.attacker.name} ${signed(amount)}.`;
  if (fails)
    evidence.push({
      text: `${ret} At ${after} the attack failed, and no card left its hand.`,
      figures: { attackAfter: after, cardsSpent: 0 },
    });
  else
    evidence.push({
      text: `${ret} At ${after} stopping it takes ${stopText(after, f.target.power)}, ${-amount} less.`,
      figures: { attackAfter: after, stopNeeded: after - f.target.power + 1000 },
    });
  evidence.push({
    text:
      donDeckAfter <= 2
        ? `That DON!! went back to its DON!! deck and returns in its next DON!! Phase. A counter card would have been gone for good.`
        : `That DON!! went back to its DON!! deck. A counter card would have been gone for good.`,
    figures: { donReturned: donCost },
  });
  evidence.push({
    text: "The effect works once per turn, so your next attacker won't face it.",
    figures: {},
  });
  return base(
    'leader-identity',
    fails ? trick.claim : 'It shrank your attacker to make it cheaper to stop.',
    evidence,
    [
      {
        kind: 'activate',
        text: `Return ${donCost} DON!!: ${f.attacker.name} ${signed(amount)} this turn.`,
        card: leaderCard,
        target: f.attacker.card,
      },
    ],
    fails
      ? `Stopped the attack for ${donCost} DON!! instead of a card.`
      : `Cut the counter it needs by ${-amount} for ${donCost} DON!!.`,
    trick.nextTime,
    trick.sources,
    trick.lessonId,
  );
}

/** What a heuristic term means in a sentence (the term the chosen move changed most). */
export const TERM_TEXT: Record<WeightKey | 'deck' | 'result', { concept: string; text: string }> = {
  life: { concept: 'board-vs-face', text: 'It expects this to bring your Life down sooner.' },
  hand: { concept: 'card-advantage', text: 'It expects to come out ahead on cards.' },
  counter: { concept: 'hand-management', text: 'It keeps more counters in hand for your turn.' },
  board: { concept: 'tempo', text: 'It expects this to leave it the stronger board.' },
  don: { concept: 'don-efficiency', text: 'It expects to have more DON!! next turn.' },
  threat: {
    concept: 'lethal-math',
    text: 'It expects this to change who threatens lethal next turn.',
  },
  deck: { concept: 'card-advantage', text: 'It is protecting its deck from running out.' },
  result: { concept: 'lethal-math', text: 'It expects this to decide the game.' },
};

const NEXT_TIME: Record<string, string> = {
  'board-vs-face':
    'Count what each attack costs you to stop before you counter. At high Life, a lone hit is often worth taking.',
  'card-advantage':
    'Every hit on your Leader hands you a card; trade cards only when the board or your Life needs it.',
  'hand-management': 'Before you attack, count their hand: each card can be a counter.',
  tempo: 'Answer a new body before it attacks, or plan your next turn around it.',
  'don-efficiency': 'Watch what each DON!! buys: a play, an attack or a counter on your turn.',
  'lethal-math': 'Count Life + 1 hits each turn, for both sides.',
  'leader-identity': 'Learn what the Leader does on each turn: it shapes every attack.',
  'removal-timing': 'Expect removal on the Character that matters most to your next turn.',
};

/** A main-phase move (or an own-turn choice), from the public view and the term it moved most. */
export function explainMove(input: {
  claim: string;
  evidence: Evidence[];
  line: Move[] | null;
  outcome: string;
  term: WeightKey | 'deck' | 'result' | null;
  concept?: string;
  sources?: string[];
}): Explanation {
  const evidence = input.evidence.slice();
  const t = input.term ? TERM_TEXT[input.term] : null;
  if (t) evidence.push({ text: t.text, figures: {} });
  const concept = input.concept ?? t?.concept ?? 'tempo';
  return base(
    concept,
    input.claim,
    evidence,
    input.line,
    input.outcome,
    NEXT_TIME[concept] ?? NEXT_TIME.tempo!,
    input.sources ?? ['SH-MIS'],
  );
}

export { stopText, attackerRef, cap };
