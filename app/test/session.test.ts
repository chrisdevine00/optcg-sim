import { describe, expect, it } from 'vitest';
import { rookie } from '@optcg/ai';
import type { Action, PlayerId } from '@optcg/engine';
import { GameSession, type SessionRecord } from '../src/session/index.ts';
import { cardMap, lookup, metaDecks } from './support.ts';

const counterOf = (id: string) => cardMap().get(id)?.counter ?? null;

function newSession(seed = 11) {
  const decks = metaDecks();
  return new GameSession(
    lookup,
    { setup: { seed, decks: { p1: decks[0]!, p2: decks[4]! }, chooser: 'p1' } },
    { p1: 'human', p2: 'ai' },
  );
}

/** Plays `n` actions with Rookie on both sides; returns both views after each action. */
function play(s: GameSession, n: number) {
  const views: string[] = [];
  for (let i = 0; i < n; i++) {
    const p = s.decider();
    if (!p) break;
    const v = s.view(p);
    const a = rookie(v, { seed: i * 31 + 7, counterOf }).action;
    expect(s.apply(p, a).ok).toBe(true);
    views.push(JSON.stringify([s.view('p1'), s.view('p2')]));
  }
  return views;
}

describe('session store (ARCHITECTURE §5)', () => {
  it('keeps a checkpoint every 20 actions and rewinds to any index exactly', () => {
    const s = newSession();
    const views = play(s, 70);
    expect(s.actionCount).toBe(70);
    expect(s.checkpointIndexes()).toEqual([0, 20, 40, 60]);
    for (const k of [69, 41, 40, 39, 21, 5]) {
      s.rewindTo(k);
      expect(JSON.stringify([s.view('p1'), s.view('p2')])).toBe(views[k - 1]);
      expect(s.verify()).toBe(true);
    }
    // Checkpoints past the rewind point are dropped.
    expect(s.checkpointIndexes()).toEqual([0]);
    expect(s.rewound).toBe(true);
  });

  it('rewinds by player-level move: three DON!! given in one move undo together', () => {
    const s = newSession(3);
    // Play until p1 owes a Main Phase decision with DON!! to give.
    for (let i = 0; i < 400; i++) {
      const p = s.decider()!;
      const v = s.view(p);
      if (p === 'p1' && v.decision?.kind === 'main' && v.don.p1.active >= 3) break;
      const a =
        v.decision?.kind === 'main'
          ? v.actions.find((x) => x.type === 'endTurn')!
          : rookie(v, { seed: i, counterOf }).action;
      s.apply(p, a);
    }
    const v = s.view('p1');
    expect(v.decision?.kind).toBe('main');
    const before = JSON.stringify(v);
    const leader = v.zones.p1.leader[0]!.handle;
    const give: Action = { type: 'giveDon', target: leader, player: 'p1' };
    for (let i = 0; i < 3; i++) expect(s.apply('p1', give, 'burst-1').ok).toBe(true);
    expect(s.view('p1').zones.p1.leader[0]!.don).toBe(3);
    const moves = s.moves();
    expect(moves.at(-1)).toMatchObject({ intentId: 'burst-1', end: moves.at(-1)!.start + 3 });
    const undone = s.rewindMove(['p1']);
    expect(undone?.intentId).toBe('burst-1');
    expect(JSON.stringify(s.view('p1'))).toBe(before);
    // Forward replays the move exactly.
    expect(s.canForward).toBe(true);
    s.forward();
    expect(s.view('p1').zones.p1.leader[0]!.don).toBe(3);
    expect(s.canForward).toBe(false);
  });

  it('back to my last decision steps over the opponent’s moves', () => {
    const s = newSession(5);
    play(s, 30);
    const humanMoves = s.moves().filter((m) => m.player === 'p1' && !m.auto);
    const last = humanMoves.at(-1)!;
    const m = s.backToLastDecision('p1');
    expect(m?.start).toBe(last.start);
    expect(s.actionCount).toBe(last.start);
    expect(s.decider()).toBe('p1');
  });

  it('marks rewinds in the record and round-trips it', () => {
    const s = newSession(8);
    play(s, 50);
    s.rewindTo(30);
    play(s, 10);
    const rec = JSON.parse(JSON.stringify(s.exportRecord())) as SessionRecord;
    expect(rec.rewinds).toHaveLength(1);
    expect(rec.rewinds[0]).toMatchObject({ from: 50, to: 30 });
    expect(rec.rewinds[0]!.undone).toHaveLength(20);
    expect(rec.actions).toHaveLength(40);
    const back = GameSession.fromRecord(lookup, rec);
    for (const p of ['p1', 'p2'] as PlayerId[])
      expect(JSON.stringify(back.view(p))).toBe(JSON.stringify(s.view(p)));
    expect(back.exportRecord().rewinds).toEqual(rec.rewinds);
    expect(back.verify()).toBe(true);
  });

  it('auto-skips only one-answer windows and records them as auto', () => {
    const s = newSession(21);
    let skipped = 0;
    for (let i = 0; i < 300 && s.decider(); i++) {
      if (s.autoSkip(false)) {
        skipped++;
        continue;
      }
      const p = s.decider()!;
      s.apply(p, rookie(s.view(p), { seed: i, counterOf }).action);
    }
    expect(skipped).toBeGreaterThan(0);
    const rec = s.exportRecord();
    expect(rec.auto.length).toBe(skipped);
    expect(s.moves().filter((m) => m.auto)).toHaveLength(skipped);
  });

  it('keeps Characters in fixed slots, filling from the centre', () => {
    const s = newSession(13);
    for (let i = 0; i < 600 && s.decider(); i++) {
      const p = s.decider()!;
      const v = s.view(p);
      const slots = s.characterSlots(p);
      expect(slots).toHaveLength(v.zones[p].characters.length);
      expect(new Set(slots).size).toBe(slots.length);
      for (const x of slots) expect(x).toBeGreaterThanOrEqual(0);
      s.apply(p, rookie(v, { seed: i, counterOf }).action);
    }
  });
});

describe('defence simulation (flows F6: chained previews, nothing reaches the game)', () => {
  const start = {
    scenario: {
      seed: 2,
      turn: 4,
      activePlayer: 'p2' as const,
      firstPlayer: 'p1' as const,
      p1: {
        leader: 'ST01-001',
        life: ['OP01-010', 'OP01-012'],
        hand: ['OP01-010', 'ST01-003', 'OP01-012'],
        characters: ['OP09-072'],
        costArea: { active: 0, rested: 0 },
      },
      p2: {
        leader: { card: 'ST04-001', don: 2 },
        life: ['OP01-010'],
        costArea: { active: 0, rested: 0 },
      },
    },
  };

  function attacked() {
    const s = new GameSession(lookup, start, { p1: 'human', p2: 'human' });
    const v = s.view('p2');
    const atk = v.actions.find(
      (a) => a.type === 'attack' && a.target === v.zones.p1.leader[0]!.handle,
    )!;
    expect(s.apply('p2', atk).ok).toBe(true);
    return s;
  }

  it('predicts the hit, a staged block and staged counters without changing the game', () => {
    const s = attacked();
    const v = s.view('p1');
    expect(v.decision?.kind).toBe('block');
    const before = JSON.stringify(v);
    // Nothing staged: 7000 vs 5000, the hit lands, Life 2 -> 1.
    const none = s.simulate('p1', [{ type: 'block', blocker: null, player: 'p1' }]);
    expect(none.damage).toEqual({ attackerPower: 7000, targetPower: 5000, attackerWins: true });
    expect(none.lifeAfter.p1).toBe(1);
    // Two +1000 Counters: 7000 vs 7000, ties go to the attacker.
    const counters = (
      n: number,
      view = s.simulate('p1', [{ type: 'block', blocker: null, player: 'p1' }]).view,
    ) =>
      view.actions
        .filter((a) => a.type === 'counter' && a.target === view.zones.p1.leader[0]!.handle)
        .slice(0, n);
    const tie = s.simulate('p1', [{ type: 'block', blocker: null, player: 'p1' }, ...counters(2)]);
    expect(tie.damage?.targetPower).toBe(7000);
    expect(tie.damage?.attackerWins).toBe(true);
    const stop = s.simulate('p1', [{ type: 'block', blocker: null, player: 'p1' }, ...counters(3)]);
    expect(stop.damage).toMatchObject({ targetPower: 8000, attackerWins: false });
    expect(stop.lifeAfter.p1).toBe(2);
    // Blocking with Franky (5000): Franky is K.O.'d, Life stays.
    const franky = v.zones.p1.characters[0]!.handle;
    const block = s.simulate('p1', [{ type: 'block', blocker: franky, player: 'p1' }]);
    expect(block.ko).toEqual([franky]);
    expect(block.lifeAfter.p1).toBe(2);
    // The real game did not move.
    expect(JSON.stringify(s.view('p1'))).toBe(before);
  });
});
