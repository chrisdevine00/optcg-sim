/**
 * The lethal detector's "how often does it answer" measure (L-03), the reviewer's way: Rookie-versus-
 * Rookie games over all four Rocks/Kaido pairings; at every Main-phase decision of either seat, `lethal`
 * in `public` mode at the app's 1.5 s cap. Reports Unknown as a share of the positions that needed a
 * search (the attackers bound answers some at once), per defender, and the E20 / E01 timings.
 *
 *   npx tsx ai/bench/rate.ts            # 3 seeds per pairing, 1,500 ms (the app's cap)
 *   RATE_SEEDS=4 RATE_MS=3000 npx tsx ai/bench/rate.ts
 *   RATE_NODES=40000 ...                # a deterministic node cap instead of the clock
 *   RATE_OUT=file.json ...              # every position's row, for diffing two runs
 */
import { writeFileSync } from 'node:fs';
import { projectForSearch, queries } from '@optcg/engine';
import { lethal } from '../src/index.ts';
import { playMatch } from '../test/support/match.ts';
import { cardMap, metaDecks } from '../test/support.ts';
import { lifeOf, listOf, start } from '../test/support/scenario.ts';

const cards = cardMap();
const decksOf = (leader: string) => metaDecks().filter((d) => d.leader === leader);
const KAIDO = 'OP17-058';
const ROCKS = 'OP17-039';
const MATCHES: [string, string][] = [
  [KAIDO, ROCKS],
  [ROCKS, KAIDO],
  [KAIDO, KAIDO],
  [ROCKS, ROCKS],
];
const SEEDS = Number(process.env.RATE_SEEDS ?? 3);
const MS = Number(process.env.RATE_MS ?? 1500);
const NODES = process.env.RATE_NODES ? Number(process.env.RATE_NODES) : undefined;
const cap = NODES !== undefined ? { nodes: NODES } : { ms: MS };

interface Row {
  pairing: string;
  seed: number;
  turn: number;
  defender: string;
  status: string;
  reason: string;
  ms: number;
  nodes: number;
}
const rows: Row[] = [];
for (const [l1, l2] of MATCHES)
  for (let seed = 1; seed <= SEEDS; seed++) {
    const d1 = decksOf(l1)[seed % decksOf(l1).length]!;
    const d2 = decksOf(l2)[(seed + 1) % decksOf(l2).length]!;
    playMatch({
      seed: seed * 31 + 5,
      decks: { p1: d1, p2: d2 },
      tiers: { p1: 'rookie', p2: 'rookie' },
      cap: 800,
      onDecision: (d) => {
        const dec = queries.decision(d.before);
        if (!dec || dec.kind !== 'main') return;
        const me = dec.player;
        const opp = me === 'p1' ? 'p2' : 'p1';
        const t0 = performance.now();
        const r = lethal({ mode: 'public', view: projectForSearch(d.before, me) }, cards, cap);
        rows.push({
          pairing: `${l1}v${l2}`,
          seed,
          turn: queries.turn(d.before).number,
          defender: queries.zone(d.before, opp, 'leader')[0]!.card,
          status: r.status,
          reason: r.defence?.reason ?? r.reason ?? '',
          ms: Math.round(performance.now() - t0),
          nodes: r.nodes,
        });
      },
    });
  }

const searched = rows.filter((r) => r.reason !== 'attackers');
const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(0)}%` : 'n/a');
const line = (name: string, rs: Row[]) => {
  const c = (s: string) => rs.filter((r) => r.status === s).length;
  const ms = rs.map((r) => r.ms).sort((a, b) => a - b);
  console.log(
    `${name.padEnd(9)} searched ${String(rs.length).padStart(4)}  proven ${String(c('proven')).padStart(3)}  refuted ${String(c('refuted')).padStart(3)}  unknown ${String(c('unknown')).padStart(3)} (${pct(c('unknown'), rs.length)})  median ${ms[ms.length >> 1] ?? 0} ms`,
  );
};
console.log(
  `decisions ${rows.length}; answered at once by the attackers bound ${rows.length - searched.length}; cap ${NODES !== undefined ? `${NODES} nodes` : `${MS} ms`}`,
);
line('all', searched);
line(
  'Rocks def',
  searched.filter((r) => r.defender === ROCKS),
);
line(
  'Kaido def',
  searched.filter((r) => r.defender === KAIDO),
);

// E20 and E01 (explanations.md), at the app's caps.
const e20 = () =>
  start({
    seed: 3,
    turn: 11,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: KAIDO,
      characters: ['OP17-060', 'OP17-062'],
      life: lifeOf(3, 'EB04-007'),
      hand: [],
      costArea: { active: 10, rested: 0 },
      decklist: listOf(KAIDO),
    },
    p2: {
      leader: ROCKS,
      characters: [{ card: 'OP17-040', rested: true }],
      life: lifeOf(2, 'EB04-007'),
      hand: ['OP17-055'],
      costArea: { active: 0, rested: 0 },
      decklist: listOf(ROCKS),
    },
  } as never);
const e01 = () =>
  start({
    seed: 11,
    turn: 9,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: KAIDO,
      characters: ['OP17-062'],
      life: lifeOf(3, 'EB04-007'),
      hand: [],
      costArea: { active: 4, rested: 0 },
      decklist: listOf(KAIDO),
    },
    p2: {
      leader: ROCKS,
      characters: [],
      life: lifeOf(1, 'EB04-007'),
      hand: ['OP17-056', 'OP17-055'],
      costArea: { active: 0, rested: 0 },
      decklist: listOf(ROCKS),
    },
  } as never);
for (const [name, mk] of [
  ['E01', e01],
  ['E20', e20],
] as const) {
  const t0 = performance.now();
  const r = lethal({ mode: 'public', view: projectForSearch(mk(), 'p1') }, cards, cap);
  console.log(
    `${name}: ${r.status} ${r.certainty} nodes ${r.nodes} in ${Math.round(performance.now() - t0)} ms`,
  );
}
if (process.env.RATE_OUT) writeFileSync(process.env.RATE_OUT, JSON.stringify(rows, null, 1));
