/**
 * Print one game's decisions for a tier (debugging aid): `npx tsx ai/bench/trace.ts tier seed [leaderA leaderB]`.
 */
import '../../test-setup/scripts.ts'; // every effect script (they load per set; M6b-0)
import type { AiTier } from '../src/index.ts';
import { cardMap, metaDecks } from '../test/support.ts';
import { playMatch } from '../test/support/match.ts';

const [tier = 'warlord', seedArg = '1', la = 'OP17-039', lb = 'OP17-058'] = process.argv.slice(2);
const all = metaDecks();
const a = all.find((d) => d.leader === la)!;
const b = all.filter((d) => d.leader === lb).at(-1)!;
const cards = cardMap();
const r = playMatch({
  seed: Number(seedArg),
  decks: { p1: a, p2: b },
  tiers: { p1: tier as AiTier, p2: 'pirate' },
  onDecision: (d) => {
    if (d.player !== 'p1') return;
    const act = d.action;
    const name = (h: string | undefined) => {
      const all = [...Object.values(d.view.zones.p1), ...Object.values(d.view.zones.p2)].flat() as {
        handle: string;
        card: string | null;
      }[];
      const c = all.find((x) => x.handle === h);
      return c?.card ? (cards.get(c.card)?.name ?? c.card) : (h ?? '');
    };
    const what =
      act.type === 'playCard'
        ? `play ${name(act.card)}`
        : act.type === 'attack'
          ? `attack ${name(act.attacker)} -> ${name(act.target)}`
          : act.type === 'giveDon'
            ? `don -> ${name(act.target)}`
            : act.type;
    console.log(
      `T${d.view.turn.number} ${d.view.decision?.kind} ${what} r=${d.rollouts}${d.planned ? ' (plan)' : ''} :: ${d.explanation.claim}`,
    );
  },
});
console.log(JSON.stringify(r.result), r.turns);
