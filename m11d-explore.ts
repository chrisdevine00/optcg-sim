import './test-setup/scripts.ts';
import { legalActions, queries, reduce } from '@optcg/engine';
import { cardMap } from './ai/test/support.ts';
import { startOf } from './ai/src/search/drills/play.ts';
import type { ScenarioJson } from './ai/src/search/drills/types.ts';
const cards = cardMap();
const sc = (
  leader: string,
  hand: string[],
  board: string[],
  active: number,
  rested: number,
): ScenarioJson =>
  ({
    seed: 1,
    turn: 7,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader,
      hand,
      life: ['OP01-081', 'OP01-081', 'OP01-081', 'OP01-081'],
      characters: board,
      costArea: { active, rested },
      decklist: ['OP01-081'],
    },
    p2: {
      leader: 'OP17-039',
      characters: [],
      life: ['OP01-081', 'OP01-081', 'OP01-081'],
      hand: [],
      costArea: { active: 6, rested: 0 },
      decklist: ['OP01-081'],
    },
  }) as never;
function show(label: string, s0: any) {
  let s = s0;
  console.log('==', label);
  const acts = legalActions(s).filter((a) => a.player === 'p1');
  console.log(acts.map((a) => JSON.stringify(a)).join('\n'));
  const act = acts.find((a) => a.type === 'activate');
  if (!act) return;
  s = reduce(s, act).state;
  for (let i = 0; i < 6; i++) {
    const d = queries.decision(s);
    console.log('decision', JSON.stringify(d)?.slice(0, 500));
    if (!d || d.player !== 'p1' || d.kind === 'main') break;
    const la = legalActions(s).filter((a) => a.player === 'p1');
    console.log(la.map((a) => JSON.stringify(a)).join('\n'));
    const pick = la[0]!;
    console.log('->', JSON.stringify(pick));
    s = reduce(s, pick).state;
  }
  console.log(
    'don',
    JSON.stringify(queries.don(s, 'p1')),
    'stage',
    JSON.stringify(queries.zone(s, 'p1', 'stage').map((c) => c.card)),
  );
}
show('luffy', startOf(sc('EB02-010', ['ST18-004'], ['EB02-035'], 1, 5), cards));
show('franky', startOf(sc('OP18-021', ['OP18-075'], [], 1, 5), cards));
