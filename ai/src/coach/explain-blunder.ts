/**
 * The words of a `gap` blunder warning (explanations.md E17; learning-ui §2.8). Second person.
 * Every number is read from the seat's own view or its DON!! ledger; the generic case states the
 * heuristic's own difference, by the term that moved most, and says it is an estimate.
 */
import type { Card } from '@optcg/cards';
import type { Action, SearchView } from '@optcg/engine';
import type { Explanation, Move } from '../explanation.ts';
import { MINUS } from '../explain.ts';
import type { Breakdown } from '../search/heuristic.ts';
import { donLedger, type DonLedger } from './tempo.ts';

export interface GapInput {
  view: SearchView;
  cards: ReadonlyMap<string, Card>;
  action: Action;
  better: Action;
  value: number;
  bestValue: number;
  breakdown: Breakdown;
  bestBreakdown: Breakdown;
  /** The seat's DON!! ledger after each choice settled, when one was taken. */
  ledger: DonLedger | null;
  bestLedger: DonLedger | null;
}

/** Plain words for a heuristic term ("scores N lower, mostly in ..."). */
const TERMS: Record<string, string> = {
  life: 'Life',
  hand: 'cards in hand',
  counter: 'counters in hand',
  board: 'your board',
  don: 'DON!!',
  threat: 'lethal threats',
  deck: 'your deck',
  result: 'the result',
};

/** What the option is called on the decision ("4", "Activate"), or a plain description of the action. */
export function labelOf(view: SearchView, a: Action): string {
  if (a.type === 'pick' && typeof a.choice === 'object' && 'option' in a.choice) {
    const id = a.choice.option;
    return view.decision?.options?.find((o) => o.id === id)?.label ?? id;
  }
  switch (a.type) {
    case 'optional':
      return a.accept ? 'to use it' : 'to skip it';
    case 'trigger':
      return a.activate ? 'to activate it' : 'to add it to your hand';
    case 'done':
      return 'to stop here';
    default:
      return 'this choice';
  }
}

const nameOf = (id: string, cards: ReadonlyMap<string, Card>): string => cards.get(id)?.name ?? id;

/** The explanation of one flagged choice against the best one. */
export function explainGap(g: GapInput): Explanation {
  const here = labelOf(g.view, g.action);
  const there = labelOf(g.view, g.better);
  const quote = (l: string): string => (/^\d+$/.test(l) ? l : `"${l}"`);

  // The DON!! rule: the best choice keeps an opponent-turn effect working and this one switches it off.
  const eff = g.bestLedger?.held.reasons.find((r) => r.kind === 'opponent-turn-effect');
  const effHere = g.ledger?.held.reasons.some((r) => r.kind === 'opponent-turn-effect');
  if (eff && g.ledger && g.bestLedger && !effHere) {
    const name = nameOf(eff.card, g.cards);
    const owner = g.view.zones[g.view.player].leader[0]?.card === eff.card ? 'Leader' : name;
    const defence = eff.perDon !== null ? g.bestLedger.held.n * eff.perDon : null;
    // "How many DON!! will you set as active": the choice reads as a count (E17).
    const setting = /set as active/i.test(g.view.decision?.prompt ?? '');
    const count = (l: string): number | null => {
      const m = /^(\d+)(?: DON!!)?$/.exec(l);
      return m ? Number(m[1]) : null;
    };
    const nHere = setting ? count(here) : null;
    const nThere = setting ? count(there) : null;
    if (nHere !== null && nThere !== null) {
      const now = donLedger(g.view, g.cards);
      const W = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
      const w = (n: number): string => W[n] ?? String(n);
      return {
        conceptId: 'don-efficiency',
        claim: `Setting ${nHere} DON!! active switches your ${owner}'s defence off.`,
        evidence: [
          {
            text: `Your ${owner}'s defence needs ${eff.limit} or fewer active DON!! when they attack. It is checked before any Counter, so you can't spend down to ${eff.limit} on their turn.`,
            figures: { limit: eff.limit ?? 0 },
          },
          {
            text: `You have ${now.active} active and ${now.paid} rested. Setting ${nHere} makes ${g.ledger.active} active: no defence. Setting ${nThere} makes ${g.bestLedger.active}: up to +${defence ?? 0}.`,
            figures: {
              activeNow: now.active,
              restedNow: now.paid,
              [`activeIf${w(nHere)}`]: g.ledger.active,
              [`activeIf${w(nThere)}`]: g.bestLedger.active,
              [`defenceIf${w(nThere)}`]: defence ?? 0,
            },
          },
        ],
        line: [
          {
            kind: 'choose',
            text: `Set ${nThere} DON!! active (${g.bestLedger.active} active in total).`,
            count: nThere,
          },
        ],
        outcome: `Up to +${defence ?? 0} of defence on their turn, instead of none from your ${owner}.`,
        certainty: 'any-hand',
        nextTime: `With this ${owner}, more active DON!! is not better past ${eff.limit}. Stop at ${eff.limit}.`,
        lessonId: 'L27-opponent-turn-timing',
        sources: ['RL-46', 'CR 10-2-16-1', 'SH-RGL'],
      };
    }
    const line: Move[] = [
      {
        kind: 'choose',
        text: `Choose ${quote(there)} (${g.bestLedger.active} active DON!! in total).`,
        ...(/^\d+$/.test(there) ? { count: Number(there) } : {}),
      },
    ];
    return {
      conceptId: 'don-efficiency',
      claim: `Choosing ${quote(here)} switches your ${owner}'s defence off.`,
      evidence: [
        {
          text:
            eff.limit !== null
              ? `Your ${owner}'s defence needs ${eff.limit} or fewer active DON!! when they attack. It is checked before any Counter, so you can't spend down to ${eff.limit} on their turn.`
              : `Your ${owner}'s defence needs active DON!! when they attack.`,
          figures: eff.limit !== null ? { limit: eff.limit } : {},
        },
        {
          text: `Choosing ${quote(here)} leaves ${g.ledger.active} active: no defence. Choosing ${quote(there)} leaves ${g.bestLedger.active}${defence !== null ? `: up to +${defence}` : ''}.`,
          figures: {
            activeIfThis: g.ledger.active,
            activeIfBetter: g.bestLedger.active,
            ...(defence !== null ? { defenceIfBetter: defence } : {}),
          },
        },
      ],
      line,
      outcome:
        defence !== null
          ? `Up to +${defence} of defence on their turn, instead of none from your ${owner}.`
          : `Your ${owner}'s defence stays on for their turn.`,
      certainty: 'any-hand',
      nextTime: `With this ${owner}, more active DON!! is not better${eff.limit !== null ? ` past ${eff.limit}. Stop at ${eff.limit}` : ''}.`,
      lessonId: 'L27-opponent-turn-timing',
      sources: ['RL-46', 'CR 10-2-16-1', 'SH-RGL'],
    };
  }

  // The general case: the estimate's biggest difference, said as it is.
  const terms = (Object.keys(g.bestBreakdown) as (keyof Breakdown)[])
    .map((k) => [k, g.bestBreakdown[k] - g.breakdown[k]] as const)
    .filter(([, d]) => d > 0.05)
    .sort((a, b) => b[1] - a[1]);
  const gap = Math.round((g.bestValue - g.value) * 10) / 10;
  const main = terms[0] ? TERMS[terms[0][0]] : 'the position';
  return {
    conceptId: 'tempo',
    claim: `Choosing ${quote(here)} looks clearly worse than ${quote(there)}.`,
    evidence: [
      {
        text: `Played out to your next turn against likely hands, the position after ${quote(there)} is worth about ${gap} cards more to you ${MINUS} mostly in ${main}.`,
        figures: {
          gap,
          ...Object.fromEntries(terms.slice(0, 2).map(([k, d]) => [k, Math.round(d * 10) / 10])),
        },
      },
    ],
    line: [{ kind: 'choose', text: `Choose ${quote(there)}.` }],
    outcome: 'An estimate from guessed hands, not a proof.',
    certainty: 'needed-hidden-info',
    nextTime:
      'Before you confirm a choice, say what each option does to your hand, Life and board.',
    lessonId: 'L17-tempo-and-rush',
    sources: [],
  };
}
