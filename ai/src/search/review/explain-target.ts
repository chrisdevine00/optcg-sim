/**
 * The words of a `target` flag (M8 WP4, explanations.md E08 and E09; learning-ui §4). Second person.
 *
 * Built from feature differences, never from visit counts or search values: the target's text from
 * its public script, the battle as arithmetic (attack power, the target's power once your own effects
 * have settled, what the defender needs), their Life and what a hit on it gives them, their hand
 * size and the biggest Counter their deck has (the sourced lists, public). Nothing here reads a card
 * the seat cannot see: the inputs are the seat's `SearchView`, public card data and the numbers
 * `target.ts` read from the battle's first window.
 */
import { SCRIPTS, type Card } from '@optcg/cards';
import type { SearchView, ViewCard } from '@optcg/engine';
import type { Explanation, Move } from '../../explanation.ts';
import { LESSON, MINUS } from '../../explain.ts';
import { biggestCounter } from '../../knowledge.ts';

/** The numbers of one attack as the defender's first window shows them. */
export interface TargetBattle {
  attackPower: number;
  /** The target's power once your own [When Attacking] effects have settled. */
  targetPower: number;
  /** Its power before them. */
  targetPowerBefore: number;
  /** The optional effects of yours the line uses, in order, in the prompts' own words. */
  uses: { source: string; cost: string; effect: string }[];
}

/** One attack your side made later in the same turn, in the card ids a reader sees. */
export interface LaterAttack {
  attacker: string;
  /** A card id, or `leader`. */
  target: string;
}

export interface TargetFacts {
  view: SearchView;
  cards: ReadonlyMap<string, Card>;
  /** The attacker (your card) and the two targets, as they stand in the view. */
  attacker: ViewCard;
  chosen: ViewCard;
  best: ViewCard;
  chosenBattle: TargetBattle;
  bestBattle: TargetBattle;
  /** Your other attacks that turn after this one, as the record shows them. */
  later: LaterAttack[];
  /** Your attacks at their Leader this turn from this one on (the flagged one included). */
  hitsAtLeader: number;
}

const W = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

/** "Edward.Newgate" is "Newgate"; other names are kept whole. */
export function shortName(name: string): string {
  const parts = name.split('.').filter((p) => p.length > 0);
  return name.includes('.') ? (parts.at(-1) ?? name) : name;
}

const nameOf = (id: string | null, cards: ReadonlyMap<string, Card>): string =>
  id ? shortName(cards.get(id)?.name ?? id) : 'a card';

/** Plain facts about a Character's text, from its script (public). */
export interface TextFacts {
  /**
   * No ongoing ability and no printed keyword ([Blocker], [Rush], [Double Attack], [Banish],
   * [Unblockable], [Rush: Character]; M8-R2): only [On Play] and [Trigger] text, or none at all.
   * A keyword acts on the board (a Blocker is the card that stops the next lethal).
   */
  nothingOnBoard: boolean;
  /** No script text and no keyword. */
  noText: boolean;
  /** The printed keywords, from the card data and the script. */
  keywords: string[];
  /** The ongoing abilities' labels, "[Once Per Turn]" first where it applies. */
  labels: string[];
  /** The biggest power amount an ongoing ability gives, or null. */
  boost: number | null;
  /** An ongoing ability that gives its owner's Leader power (Newgate's +3000 in a battle). */
  boostsLeader: boolean;
}

export function textFacts(cardId: string | null, cards: ReadonlyMap<string, Card>): TextFacts {
  const script = cardId ? SCRIPTS[cardId] : undefined;
  const abilities = script?.abilities ?? [];
  const keywords = [
    ...new Set<string>([
      ...((cardId ? cards.get(cardId)?.keywords : undefined) ?? []),
      ...(script?.keywords ?? []),
    ]),
  ];
  const keywordLabels = keywords.map((k) => `[${k}]`);
  if (abilities.length === 0)
    return {
      nothingOnBoard: keywords.length === 0,
      noText: keywords.length === 0,
      keywords,
      labels: keywordLabels,
      boost: null,
      boostsLeader: false,
    };
  const timed = (a: (typeof abilities)[number]): boolean =>
    a.kind === 'trigger' || (a.kind === 'auto' && a.when.every((w) => w === 'onPlay'));
  const ongoing = abilities.filter((a) => !timed(a));
  let boost: number | null = null;
  let boostsLeader = false;
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      const power = o.power as { amount?: unknown; target?: { from?: unknown } } | undefined;
      if (power && typeof power.amount === 'number') {
        boost = Math.max(boost ?? 0, Math.abs(power.amount));
        if (power.amount > 0 && power.target?.from === 'leader') boostsLeader = true;
      }
      Object.values(o).forEach(walk);
    }
  };
  for (const a of ongoing) walk('apply' in a ? a.apply : 'effect' in a ? a.effect : null);
  return {
    nothingOnBoard: ongoing.length === 0 && keywords.length === 0,
    noText: false,
    keywords,
    labels: [
      ...keywordLabels,
      ...ongoing.map((a) => `${a.oncePerTurn ? '[Once Per Turn] ' : ''}${a.label ?? a.id}`),
    ],
    boost,
    boostsLeader,
  };
}

/** What the defender needs to stop an attack (CR 7-1-4-1: ties go to the attacker). */
export const stopNeeded = (attack: number, defence: number): number => attack - defence + 1000;

/** Cards it takes at `perCard` each, or null when the deck has no Counter at all. */
export const cardsToStop = (need: number, perCard: number): number | null =>
  perCard > 0 ? Math.max(1, Math.ceil(need / perCard)) : null;

/** What a defender can do about `need` with `hand` cards of at most `perCard`: spend N, or nothing works. */
function spendWords(
  need: number,
  perCard: number,
  hand: number,
): { n: number | null; text: string } {
  const n = cardsToStop(need, perCard);
  if (n === null || n > hand) return { n, text: '' };
  return { n, text: n === 2 && hand === 2 ? 'Both their cards' : `${n} of their cards` };
}

const usesText = (b: TargetBattle): string =>
  b.uses.length === 0
    ? ''
    : `, paying for ${b.uses.map((u) => `${shortName(u.source)}'s effect (${u.effect})`).join(' and ')}`;

/** One attack as a line step: "Attack Newgate with your Leader, paying for ...". */
function attackMove(
  f: TargetFacts,
  attacker: ViewCard,
  target: ViewCard,
  battle: TargetBattle | null,
): Move {
  const me = f.view.player;
  const isLeaderAttacker = f.view.zones[me].leader.some((c) => c.handle === attacker.handle);
  const opp = me === 'p1' ? 'p2' : 'p1';
  const isLeaderTarget = f.view.zones[opp].leader.some((c) => c.handle === target.handle);
  const who = isLeaderAttacker ? 'your Leader' : nameOf(attacker.card, f.cards);
  const tname = isLeaderTarget ? 'their Leader' : nameOf(target.card, f.cards);
  return {
    kind: 'attack',
    text: `Attack ${tname} with ${who}${battle ? usesText(battle) : ''}.`,
    ...(attacker.card ? { card: attacker.card } : {}),
    target: isLeaderTarget ? 'leader' : (target.card ?? 'leader'),
  };
}

/** The flagged attack as "What you did". */
export function didMove(f: TargetFacts, target: ViewCard, battle: TargetBattle): Move {
  return attackMove(f, f.attacker, target, battle);
}

/** The explanation of one flagged attack against the better one. */
export function explainTarget(f: TargetFacts): { explanation: Explanation; line: Move[] } {
  const me = f.view.player;
  const opp = me === 'p1' ? 'p2' : 'p1';
  const oppZones = f.view.zones[opp];
  const leaderHandle = oppZones.leader[0]?.handle;
  const bestIsLeader = f.best.handle === leaderHandle;
  const chosenIsLeader = f.chosen.handle === leaderHandle;
  const myLeader = f.view.zones[me].leader[0]?.handle === f.attacker.handle;
  const who = myLeader ? 'your Leader' : nameOf(f.attacker.card, f.cards);
  const Who = who.charAt(0).toUpperCase() + who.slice(1);
  const life = oppZones.life.length;
  const hand = oppZones.hand.length;
  const perCard = biggestCounter(oppZones.leader[0]?.card ?? '', f.cards);

  const bestName = bestIsLeader ? 'their Leader' : nameOf(f.best.card, f.cards);
  const bb = f.bestBattle;
  const need = stopNeeded(bb.attackPower, bb.targetPower);
  const spend = spendWords(need, perCard, hand);
  const bestText = textFacts(f.best.card, f.cards);
  const chosenText = textFacts(f.chosen.card, f.cards);
  const chosenName = chosenIsLeader ? 'their Leader' : nameOf(f.chosen.card, f.cards);

  const evidence: Explanation['evidence'] = [];
  // Other attackers of yours that turn, as the record shows them (their attack on the target we
  // would have K.O.'d is not repeated).
  const others = f.later.filter((l) => l.target !== f.best.card || bestIsLeader);
  const line: Move[] = [attackMove(f, f.attacker, f.best, bb)];
  for (const l of others) {
    const lAttacker = nameOf(l.attacker, f.cards);
    line.push({
      kind: 'attack',
      text: `Attack ${l.target === 'leader' ? 'their Leader' : nameOf(l.target, f.cards)} with ${lAttacker}.`,
      card: l.attacker,
      target: l.target,
    });
  }

  const arithmetic = (name: string, b: TargetBattle): Explanation['evidence'][number] => {
    const defence = b.targetPower;
    const n = cardsToStop(stopNeeded(b.attackPower, defence), perCard);
    const gives =
      b.uses.length > 0 ? ` once ${shortName(b.uses[0]!.source)}'s effect has settled` : '';
    const sentence = `${Who} is at ${b.attackPower} and ${name} at ${defence}${gives}: to save it they need ${b.attackPower} ${MINUS} ${defence} + 1000 = ${stopNeeded(b.attackPower, defence)}${
      n === null
        ? ', and their deck has no Counter to find it with.'
        : `: ${n === 1 ? 'one card' : `${W[n]!.toLowerCase()} cards`} at their deck's biggest Counter, +${perCard}.`
    }`;
    return {
      text: sentence,
      figures: {
        attackPower: b.attackPower,
        targetPower: defence,
        ...(b.targetPowerBefore !== defence ? { targetPowerBefore: b.targetPowerBefore } : {}),
        stopNeeded: stopNeeded(b.attackPower, defence),
        maxPerCard: perCard,
        ...(n !== null ? { cardsToSave: n } : {}),
      },
    };
  };

  if (!bestIsLeader) {
    // Board over face: the Character was the better target (E08).
    if (bestText.labels.length > 0)
      evidence.push({
        text: `${bestName}: ${bestText.labels.join('; ')}. It acts every turn it stays on their board.`,
        figures: bestText.boost !== null ? { effectBoost: bestText.boost } : {},
      });
    else
      evidence.push({
        text: `${bestName} is a ${bb.targetPowerBefore}-power Character you can K.O. now; its text does nothing on the board.`,
        figures: { targetPower: bb.targetPowerBefore },
      });
    evidence.push(arithmetic(bestName, bb));
    if (chosenIsLeader)
      evidence.push({
        text: `At ${life} Life, each hit on their Leader that lands gives them a card. You sent ${f.hitsAtLeader} ${f.hitsAtLeader === 1 ? 'attack' : 'attacks'} at it.`,
        figures: { opponentLife: life, attacksAtLeader: f.hitsAtLeader },
      });
    else
      evidence.push({
        text: `${chosenName} is ${f.chosenBattle.targetPower} power${chosenText.nothingOnBoard ? ' and its text does nothing on the board' : `: ${chosenText.labels.join('; ')}`}.`,
        figures: { chosenPower: f.chosenBattle.targetPower },
      });
    const saved = spend.text
      ? `${bestName} K.O.'d, or ${spend.text} spent to save it`
      : spend.n === null
        ? `${bestName} K.O.'d, with nothing in their deck to save it`
        : `${bestName} K.O.'d: their ${hand} ${hand === 1 ? 'card' : 'cards'} cannot save it`;
    const still = others.find((l) => l.target === 'leader');
    const outcome = `${saved}${still ? `; ${nameOf(still.attacker, f.cards)} still takes 1 Life` : ''}.`;
    const nextTime =
      life >= 3
        ? 'At high Life, hit the Character that pays them every turn. Turn to their Leader once the hits start setting up lethal.'
        : 'Even at low Life, a hit they can stop is not lethal. Clear the Character that keeps helping them, then turn to their Leader.';
    return {
      explanation: {
        conceptId: 'board-vs-face',
        claim: `${shortName(bestName)} was the better target for ${who}.`,
        evidence,
        line,
        outcome,
        certainty: 'any-hand',
        nextTime,
        lessonId: LESSON['board-vs-face']!,
        sources: ['CR 7-1-1-2', 'CR 7-1-4-1', 'RL-45', 'SH-MIS'],
      },
      line,
    };
  }

  // Face over board: their Leader was the better target (E09).
  evidence.push(
    chosenText.nothingOnBoard
      ? {
          text: chosenText.noText
            ? `${chosenName} has no effect text. On the board it is a ${f.chosenBattle.targetPower}-power Character.`
            : `${chosenName}'s only text is its [On Play] or [Trigger]: it does nothing on the board. It is a ${f.chosenBattle.targetPower}-power Character.`,
          figures: { chosenPower: f.chosenBattle.targetPower },
        }
      : {
          text: `${chosenName}: ${chosenText.labels.join('; ')}. It is a ${f.chosenBattle.targetPower}-power Character.`,
          figures: {
            chosenPower: f.chosenBattle.targetPower,
            ...(chosenText.boost !== null ? { effectBoost: chosenText.boost } : {}),
          },
        },
  );
  evidence.push({
    text: `At their Leader, ${who === 'your Leader' ? 'it' : who} needs them to find ${bb.attackPower} ${MINUS} ${bb.targetPower} + 1000 = ${need}.`,
    figures: { attackPower: bb.attackPower, targetPower: bb.targetPower, stopNeeded: need },
  });
  const n = cardsToStop(need, perCard);
  evidence.push({
    text:
      n === null
        ? `They have ${hand} ${hand === 1 ? 'card' : 'cards'} and no Counter in their deck to stop it with.`
        : n > hand
          ? `They have ${hand} ${hand === 1 ? 'card' : 'cards'} and their biggest Counter is +${perCard}: stopping it takes ${n}, so it lands.`
          : `They have ${hand} ${hand === 1 ? 'card' : 'cards'} and their biggest Counter is +${perCard}: stopping it takes ${n}.`,
    figures: {
      handSize: hand,
      biggestCounter: perCard,
      ...(n !== null ? { cardsToSave: n } : {}),
    },
  });
  const outcome = spend.text
    ? `${spend.text} spent, or 1 Life lost, instead of a ${f.chosenBattle.targetPower}-power Character.`
    : `They lose 1 Life, with no way to stop it, instead of you K.O.'ing a ${f.chosenBattle.targetPower}-power Character.`;
  return {
    explanation: {
      conceptId: 'board-vs-face',
      claim: `${Who === 'Your Leader' ? 'Your Leader' : Who} should have attacked their Leader.`,
      evidence,
      line,
      outcome,
      certainty: 'any-hand',
      nextTime:
        'Before attacking a Character, ask what it will do next turn. If the answer is "not much", hit the Leader.',
      lessonId: LESSON['board-vs-face']!,
      sources: ['CR 7-1-4-1', 'RL-45', 'SH-MIS'],
    },
    line,
  };
}
