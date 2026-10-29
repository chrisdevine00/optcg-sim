/**
 * "Why?" for AI decisions (ARCHITECTURE §4.5, flows F10, D9; review M5a-01 to M5a-07).
 *
 * **The rule.** An AI explanation is a function of what the player may know and nothing else:
 * the position as the player sees it, the AI's move (public once made) and the AI's playbook
 * (public: it is written from the archetype guide). So:
 * - it never says whether a move was forced: forcedness can depend on the AI's hidden hand (a Life
 *   card with or without a usable [Trigger], a hand with or without a Counter);
 * - it never cites the heuristic term a move gained on: the search that ranked the moves played out
 *   the AI's hidden cards;
 * - it names only cards on the field, in a trash, or revealed by the move itself;
 * - when the move follows a playbook line whose condition is public, it cites that line and the
 *   guide's source; otherwise a main move says only that its search ranked it first.
 * Every function here reads a determinized state, but only its public parts: the board, powers,
 * Life and hand counts, DON!!, Once Per Turn marks, summoning sickness and the public decision.
 * A differential test holds it to that (ai/test/why-differential.test.ts).
 */
import { SCRIPTS, type Card } from '@optcg/cards';
import { legalActions, queries, type Action, type GameState, type PlayerId } from '@optcg/engine';
import type { Explanation, Move } from '../explanation.ts';
import {
  explainBlock,
  explainCounter,
  explainLeaderTrick,
  explainMove,
  explainTake,
  stopText,
  type BattleFacts,
  type CardFact,
} from '../explain.ts';
import { biggestCounter, eventCounterOf } from '../knowledge.ts';
import { ownTurn, type Bias, type Playbook } from '../playbook.ts';
import { battleNumbers } from './sim.ts';

export interface WhyContext {
  cards: ReadonlyMap<string, Card>;
  playbook: Playbook | null;
  /** Did the AI go first (its own turn count, for the playbook's turn windows). */
  first: boolean;
}

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

/**
 * An effect label in the AI's voice: card text says "your" for the card's owner and "your
 * opponent's" for the player; "Why?" speaks to the player ("its", "your").
 */
export function aiVoice(label: string): string {
  return label
    .split(/(\b[Yy]our opponent's\b)/)
    .map((part, i) =>
      i % 2 === 1
        ? part.charAt(0) === 'Y'
          ? 'Your'
          : 'your'
        : part.replace(/\bYour\b/g, 'Its').replace(/\byour\b/g, 'its'),
    )
    .join('');
}
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function cardFact(s: GameState, id: string, cards: ReadonlyMap<string, Card>): CardFact {
  const c = queries.card(s, id);
  return {
    card: c.card,
    name: cards.get(c.card)?.name ?? c.card,
    power: c.power ?? 0,
    isLeader: c.zone === 'leader',
  };
}

/** The battle the AI is defending, as both players can see it. */
export function battleFacts(s: GameState, me: PlayerId, ctx: WhyContext): BattleFacts | null {
  const n = battleNumbers(s);
  if (!n) return null;
  const foe = n.attacker.owner;
  const turn = queries.turn(s).number;
  const ready = [...queries.zone(s, foe, 'leader'), ...queries.zone(s, foe, 'characters')].filter(
    (c) =>
      c.instance !== n.b.attacker &&
      !c.rested &&
      !c.cannotAttack &&
      (c.zone === 'leader' || (c.played ?? -1) < turn || c.keywords.includes('Rush')),
  );
  const pb = ctx.playbook;
  const myLeader = queries.zone(s, me, 'leader')[0]!;
  const trick = pb?.leaderTrick;
  return {
    aiName: pb?.aiName ?? ctx.cards.get(myLeader.card)?.name ?? 'The AI',
    aiLife: queries.zone(s, me, 'life').length,
    aiHand: queries.zone(s, me, 'hand').length,
    attacker: cardFact(s, n.b.attacker, ctx.cards),
    target: cardFact(s, n.b.target, ctx.cards),
    need: n.need,
    readyOthers: ready.map((c) => cardFact(s, c.instance, ctx.cards)),
    biggestCounter: biggestCounter(myLeader.card, ctx.cards),
    ...(trick
      ? {
          leaderTrick: {
            name: trick.name,
            used: queries
              .usedThisTurn(s)
              .some((u) => u.card === myLeader.instance && u.ability === trick.ability),
          },
        }
      : {}),
  };
}

const hasOnPlay = (cardId: string): boolean =>
  (SCRIPTS[cardId]?.abilities ?? []).some((a) => {
    const when = (a as { when?: unknown }).when;
    return Array.isArray(when) ? when.includes('onPlay') : when === 'onPlay';
  });

/** A script ability's power amount and DON!! −X cost (the Leader's trick, for copy). */
function abilityNumbers(cardId: string, ability: string): { amount: number; donCost: number } {
  const a = SCRIPTS[cardId]?.abilities.find((x) => x.id === ability) as
    { cost?: { donMinus?: number }[]; effect?: unknown } | undefined;
  let amount = 0;
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      const p = o.power as { amount?: number } | undefined;
      if (p && typeof p.amount === 'number' && amount === 0) amount = p.amount;
      Object.values(o).forEach(walk);
    }
  };
  walk(a?.effect);
  const donCost = (a?.cost ?? []).reduce((t, c) => t + (c.donMinus ?? 0), 0);
  return { amount, donCost };
}

// ------------------------------------------------------------------------------------------------
// Playbook citations: public conditions only
// ------------------------------------------------------------------------------------------------

type Cite = { text: string; source: string } | null;

const citeOf = (b: Bias, hold = false): Cite => {
  const text = hold ? b.citeHold : b.cite;
  return text ? { text, source: b.citeSource ?? 'archetype guide' } : null;
};

/** The playbook line this move follows, if its condition is public (see the file comment). */
export function citation(s: GameState, a: Action, me: PlayerId, ctx: WhyContext): Cite {
  const pb = ctx.playbook;
  if (!pb) return null;
  const own = ownTurn(queries.turn(s).number, ctx.first);
  const leader = queries.zone(s, me, 'leader')[0]!;
  const dec = queries.decision(s);
  const src = dec?.source;
  const battle = battleNumbers(s);
  for (const b of pb.biases) {
    switch (b.kind) {
      case 'attackWith':
        if (a.type === 'attack' && own >= b.fromOwnTurn) {
          const by =
            b.card === 'leader'
              ? a.attacker === leader.instance
              : queries.card(s, a.attacker).card === b.card;
          if (by) return citeOf(b);
        }
        break;
      case 'acceptOptional':
        if (
          a.type === 'optional' &&
          a.accept &&
          src?.card === b.source &&
          src.ability === b.ability &&
          queries.zone(s, me, 'hand').length >= b.minHand
        )
          return citeOf(b);
        break;
      case 'play':
        if (a.type === 'playCard' && b.cards.includes(queries.card(s, a.card).card)) {
          if ((b.fromOwnTurn ?? 0) <= own && own <= (b.byOwnTurn ?? 99)) return citeOf(b);
        }
        break;
      case 'targetHighestPower':
        if (
          a.type === 'pick' &&
          typeof a.choice === 'string' &&
          src?.card === b.source &&
          src.ability === b.ability
        ) {
          const powers = legalActions(s)
            .filter(
              (x): x is Extract<Action, { type: 'pick' }> =>
                x.type === 'pick' && typeof x.choice === 'string',
            )
            .map((x) => queries.card(s, x.choice as string).power ?? 0);
          if ((queries.card(s, a.choice).power ?? 0) === Math.max(...powers)) return citeOf(b);
        }
        break;
      case 'useOnAttacker':
        if (
          src?.card === b.source &&
          src.ability === b.ability &&
          battle &&
          battle.attacker.owner !== me
        ) {
          const onChar = battle.attacker.zone === 'characters';
          if (a.type === 'optional' && a.accept && onChar && battle.need > 0) return citeOf(b);
          if (a.type === 'optional' && !a.accept && (!onChar || battle.need <= 0))
            return citeOf(b, true);
          if (a.type === 'pick' && a.choice === battle.b.attacker) return citeOf(b);
        }
        break;
      case 'playAfterLeaderAttack':
        // Public: the card is revealed by its play, and the Leader is rested from its attack.
        if (a.type === 'playCard' && queries.card(s, a.card).card === b.card && leader.rested)
          return citeOf(b);
        break;
      case 'avoidPlay':
        // Its condition (a card held in hand) is hidden: never cited.
        break;
    }
  }
  return null;
}

// ------------------------------------------------------------------------------------------------
// The builder
// ------------------------------------------------------------------------------------------------

/** "Why?" for the AI's action `a` (in the determinized state's ids) at the decision in `s`. */
export function explainAction(s: GameState, a: Action, me: PlayerId, ctx: WhyContext): Explanation {
  const dec = queries.decision(s)!;
  return dec.kind === 'main' ? explainMain(s, a, me, ctx) : explainAnswer(s, a, me, ctx);
}

function explainMain(s: GameState, a: Action, me: PlayerId, ctx: WhyContext): Explanation {
  const name = (id: string) => cardFact(s, id, ctx.cards).name;
  const opp = other(me);
  const yourLife = queries.zone(s, opp, 'life').length;
  const yourHand = queries.zone(s, opp, 'hand').length;
  const cite = citation(s, a, me, ctx);
  switch (a.type) {
    case 'playCard': {
      const c = queries.card(s, a.card);
      const cost = c.cost ?? 0;
      const don = queries.don(s, me).active;
      const after = Math.max(0, don - cost);
      if (ctx.cards.get(c.card)?.category === 'Event') {
        const raw = SCRIPTS[c.card]?.abilities.find(
          (x) => (x as { when?: unknown }).when === 'main',
        ) as { label?: string } | undefined;
        const main = raw?.label ? { label: aiVoice(raw.label) } : undefined;
        return explainMove({
          claim: `It played ${name(a.card)}.`,
          evidence: [
            {
              text: `${main?.label ?? 'Its [Main] effect'}. It cost ${cost} DON!!; ${after} stayed active.`,
              figures: { cost, donAfter: after },
            },
          ],
          line: [{ kind: 'play', text: `Play ${name(a.card)}.`, card: c.card }],
          outcome: `${main?.label ?? 'Its effect'}.`,
          concept: 'tempo',
          cite,
          ranked: true,
        });
      }
      const kw = c.keywords.length ? `, ${c.keywords.map((k) => `[${k}]`).join(' ')}` : '';
      return explainMove({
        claim: `It played ${name(a.card)} for ${cost} DON!!.`,
        evidence: [
          {
            text: `${name(a.card)} has ${c.power ?? 0} power${kw}.`,
            figures: { power: c.power ?? 0 },
          },
          {
            text: `It had ${don} active DON!! and kept ${after}.`,
            figures: { donBefore: don, donAfter: after },
          },
        ],
        line: [{ kind: 'play', text: `Play ${name(a.card)}.`, card: c.card }],
        outcome: `${name(a.card)} is on its board.`,
        concept: 'tempo',
        cite,
        ranked: true,
      });
    }
    case 'attack': {
      const at = cardFact(s, a.attacker, ctx.cards);
      const tg = cardFact(s, a.target, ctx.cards);
      const need = at.power - tg.power + 1000;
      const by = at.isLeader ? 'its Leader' : at.name;
      const line: Move[] = [
        {
          kind: 'attack',
          text: `Attack ${tg.isLeader ? 'your Leader' : tg.name} with ${by}.`,
          card: at.card,
          target: tg.isLeader ? 'leader' : tg.card,
        },
      ];
      // The result rests on the player's hidden hand: "depends on your hand" (review M5a-07).
      const certainty = 'needed-hidden-info' as const;
      if (tg.isLeader) {
        const ready = new Set(
          legalActions(s).flatMap((x) =>
            x.type === 'attack' && x.target === a.target ? [x.attacker] : [],
          ),
        ).size;
        const blockers = queries
          .zone(s, opp, 'characters')
          .filter((c) => !c.rested && c.keywords.includes('Blocker')).length;
        return explainMove({
          claim: `It attacked your Leader with ${by} at ${at.power}.`,
          evidence: [
            {
              text: `Stopping it with counters takes ${stopText(at.power, tg.power)}.`,
              figures: { attackPower: at.power, defencePower: tg.power, stopNeeded: need },
            },
            {
              text: `You were at ${yourLife} Life with ${plural(yourHand, 'card')} in hand; it had ${plural(ready, 'attacker')} ready.`,
              figures: { yourLife, yourHandSize: yourHand, attackers: ready },
            },
          ],
          line,
          outcome:
            need <= 0
              ? 'You can let it fail without a card.'
              : blockers > 0
                ? `You block it, spend ${need} of counters or effects, or lose 1 Life.`
                : `You spend ${need} of counters or effects, or lose 1 Life.`,
          concept: yourLife + 1 <= ready ? 'lethal-math' : 'board-vs-face',
          sources: ['CR 7-1-4-1', 'CR 7-1-4-1-1-2', 'SH-MIS'],
          cite,
          ranked: true,
          certainty,
        });
      }
      return explainMove({
        claim: `It attacked ${tg.name} with ${by}.`,
        evidence: [
          {
            text: `Saving ${tg.name} (${tg.power}) from ${at.power} takes ${stopText(at.power, tg.power)}.`,
            figures: { attackPower: at.power, defencePower: tg.power, stopNeeded: need },
          },
        ],
        line,
        outcome: `${tg.name} is K.O.'d unless you stop the attack.`,
        concept: 'board-vs-face',
        sources: ['CR 7-1-1-2', 'CR 7-1-4-1', 'SH-MIS'],
        cite,
        ranked: true,
        certainty,
      });
    }
    case 'giveDon': {
      // Only this step: never the attack it may be for (review M5a-06, flows F10.2).
      const t = cardFact(s, a.target, ctx.cards);
      const by = t.isLeader ? 'its Leader' : t.name;
      const Who = t.isLeader ? 'Its Leader' : t.name;
      return explainMove({
        claim: `It gave DON!! to ${by}.`,
        evidence: [
          {
            text: `${Who} goes from ${t.power} to ${t.power + 1000}: given DON!! add +1000 each, on its own turn only.`,
            figures: { powerBefore: t.power, powerAfter: t.power + 1000 },
          },
        ],
        line: [{ kind: 'giveDon', text: `Give 1 DON!! to ${by}.`, card: t.card, count: 1 }],
        outcome: `${Who} is 1000 stronger this turn.`,
        concept: 'don-efficiency',
        sources: ['CR 6-5-5-2', 'SH-DON'],
        cite,
        ranked: true,
      });
    }
    case 'activate': {
      const c = cardFact(s, a.card, ctx.cards);
      const raw = (
        SCRIPTS[c.card]?.abilities.find((x) => x.id === a.ability) as { label?: string } | undefined
      )?.label;
      const label = raw ? aiVoice(raw) : 'its ability';
      return explainMove({
        claim: `It used ${c.isLeader ? 'its Leader' : c.name}'s ability.`,
        evidence: [{ text: `${label}.`, figures: {} }],
        line: [{ kind: 'activate', text: `Use ${c.name}: ${label}.`, card: c.card }],
        outcome: `${label}.`,
        concept: c.isLeader ? 'leader-identity' : 'tempo',
        cite,
        ranked: true,
      });
    }
    default: {
      // Ending the turn: it may have been the only move (a hidden fact), so no ranking is claimed.
      const don = queries.don(s, me).active;
      const hand = queries.zone(s, me, 'hand').length;
      return explainMove({
        claim: 'It ended its turn.',
        evidence: [
          {
            text: `It kept ${don} DON!! active and ${plural(hand, 'card')} in hand.`,
            figures: { activeDon: don, aiHandSize: hand },
          },
        ],
        line: [{ kind: 'endTurn', text: 'End the turn.' }],
        outcome: 'Its turn is over.',
        concept: 'don-efficiency',
      });
    }
  }
}

/** Answers to every other decision kind, on either turn. */
function explainAnswer(s: GameState, a: Action, me: PlayerId, ctx: WhyContext): Explanation {
  const dec = queries.decision(s)!;
  const f = battleFacts(s, me, ctx);
  const pb = ctx.playbook;
  const cite = citation(s, a, me, ctx);
  if (a.type === 'block' && f) {
    if (a.blocker === null)
      return explainMove({
        claim: 'It did not block this attack.',
        evidence: [
          {
            text: `${f.aiName} was at ${f.aiLife} Life with ${plural(f.aiHand, 'card')} in hand.`,
            figures: { aiLife: f.aiLife, aiHandSize: f.aiHand },
          },
        ],
        line: [{ kind: 'take', text: 'No block.' }],
        outcome: 'The attack goes on to the Counter Step.',
        concept: 'counters-and-blockers',
        sources: ['CR 7-1-2-1'],
      });
    const b = cardFact(s, a.blocker, ctx.cards);
    return explainBlock(f, { ...b, hasOnPlay: hasOnPlay(b.card) });
  }
  if ((a.type === 'counter' || (a.type === 'activate' && a.ability === 'counter')) && f) {
    const c = queries.card(s, a.card);
    const card = ctx.cards.get(c.card);
    const event = card?.category === 'Event';
    return explainCounter(f, {
      card: c.card,
      name: card?.name ?? c.card,
      value: event ? eventCounterOf(c.card) : (c.counter ?? 0),
      event,
      cost: c.cost ?? 0,
    });
  }
  if (a.type === 'endCounter' && f) return explainTake(f);
  const src = dec.source;
  const myLeader = queries.zone(s, me, 'leader')[0]!;
  if (a.type === 'optional' && src) {
    const trick = pb?.leaderTrick;
    if (
      a.accept &&
      trick &&
      f &&
      src.card === trick.source &&
      src.ability === trick.ability &&
      src.instance === myLeader.instance &&
      !f.attacker.isLeader
    ) {
      const { amount, donCost } = abilityNumbers(src.card, src.ability);
      return explainLeaderTrick(
        f,
        trick,
        myLeader.card,
        amount,
        donCost,
        queries.don(s, me).deck + donCost,
      );
    }
    const srcName = ctx.cards.get(src.card)?.name ?? src.card;
    const own = src.instance === myLeader.instance ? 'its Leader' : srcName;
    const voiced = src.label ? aiVoice(src.label) : null;
    const effect = voiced ? `${voiced.charAt(0).toLowerCase()}${voiced.slice(1)}` : null;
    // "Did not use" is true whether it chose to or could not pay a hidden cost (review M5a-01).
    return explainMove({
      claim: a.accept ? `It used ${own}'s effect.` : `It did not use ${own}'s effect.`,
      evidence: effect ? [{ text: `The effect: ${effect}.`, figures: {} }] : [],
      line: [
        {
          kind: 'activate',
          text: a.accept
            ? `Use ${own}'s effect.`
            : `${own.charAt(0).toUpperCase()}${own.slice(1)}'s effect is not used.`,
          card: src.card,
        },
      ],
      outcome: a.accept
        ? effect
          ? `It chose to ${effect}.`
          : 'The effect resolves.'
        : 'The effect is not used.',
      concept: src.instance === myLeader.instance ? 'leader-identity' : 'tempo',
      cite,
    });
  }
  if (a.type === 'trigger') {
    // Adding the Life card to hand reads the same whether or not it had a [Trigger] (M2-01).
    return explainMove({
      claim: a.activate
        ? 'It used the [Trigger] on its Life card.'
        : 'It added its Life card to its hand.',
      evidence: [
        {
          text: `${pb?.aiName ?? 'It'} has ${plural(queries.zone(s, me, 'life').length, 'Life card')} left.`,
          figures: { aiLife: queries.zone(s, me, 'life').length },
        },
      ],
      line: [{ kind: 'trigger', text: a.activate ? 'Use the [Trigger].' : 'Add it to hand.' }],
      outcome: a.activate ? 'The [Trigger] resolves.' : 'One more card in its hand.',
      concept: 'life-as-resource',
      sources: ['CR 10-1-5'],
    });
  }
  if (a.type === 'pick') {
    const ch = a.choice;
    let what: string;
    if (typeof ch === 'string') {
      const c = queries.card(s, ch);
      // Only cards both players can see are named (flows D9).
      what = ['characters', 'leader', 'stage', 'trash'].includes(c.zone)
        ? c.zone === 'leader'
          ? c.owner === me
            ? 'its Leader'
            : 'your Leader'
          : (ctx.cards.get(c.card)?.name ?? 'a card')
        : 'a card';
    } else if ('option' in ch)
      what = dec.options?.find((o) => o.id === ch.option)?.label ?? 'an option';
    else
      what =
        ch.from === 'given'
          ? 'a given DON!!'
          : ch.from === 'costRested'
            ? 'a rested DON!!'
            : 'an active DON!!';
    const srcName = src ? (ctx.cards.get(src.card)?.name ?? src.card) : 'its effect';
    return explainMove({
      claim: `It chose ${what}.`,
      evidence: [
        {
          text: src?.label ? `For ${srcName}: ${aiVoice(src.label)}.` : `For ${srcName}.`,
          figures: {},
        },
      ],
      line: [{ kind: 'choose', text: `Choose ${what}.` }],
      outcome: `${what.charAt(0).toUpperCase() + what.slice(1)} chosen.`,
      concept: 'tempo',
      cite,
    });
  }
  return explainMove({
    claim: a.type === 'done' ? 'It finished choosing.' : 'It chose the order of its effects.',
    evidence: [],
    line: [{ kind: 'choose', text: a.type === 'done' ? 'Done.' : 'Choose the order.' }],
    outcome: a.type === 'done' ? 'Its choice is made.' : 'Its effects resolve in that order.',
    concept: 'tempo',
  });
}
