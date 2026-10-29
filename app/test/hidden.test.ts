import { describe, expect, it } from 'vitest';
import { rookie } from '@optcg/ai';
import { aiInitCards } from '../src/play/game/controller.ts';
import { GameSession } from '../src/session/index.ts';
import { cardMap, lookup, metaDecks } from './support.ts';

const counterOf = (id: string) => cardMap().get(id)?.counter ?? null;

describe('hidden information (review M3-01..04, M3-09)', () => {
  it('the public view and log name no card that only one player can see', () => {
    const decks = metaDecks();
    const s = new GameSession(
      lookup,
      { setup: { seed: 202, decks: { p1: decks[0]!, p2: decks[5]! }, chooser: 'p1' } },
      { p1: 'human', p2: 'human' },
    );
    for (let i = 0; i < 250 && s.decider(); i++) {
      for (const viewer of ['p1', 'p2'] as const) {
        const other = viewer === 'p1' ? 'p2' : 'p1';
        const pub = s.publicView(viewer);
        const theirs = s.view(other);
        // Every card id the public view shows, the other player can see in the same place.
        for (const p of ['p1', 'p2'] as const)
          for (const [z, cards] of Object.entries(pub.zones[p]))
            cards.forEach((c, k) => {
              if (c.card !== null)
                expect(theirs.zones[p][z as keyof typeof theirs.zones.p1][k]!.card).toBe(c.card);
            });
        expect(pub.actions).toEqual([]);
        // Fields that can carry hidden cards are emptied or intersected (review M3-37).
        expect(pub.looking).toEqual([]);
        expect(pub.known).toEqual({});
        for (const [k, c] of pub.resolving.entries())
          if (c.card !== null) expect(theirs.resolving[k]?.card).toBe(c.card);
        const own = s.view(viewer);
        if (pub.decision && own.decision?.player === viewer) {
          // The viewer's own decision: no options, and a source only when it is a public card.
          expect(pub.decision.options).toBeUndefined();
          if (pub.decision.source?.handle) {
            const onBoard = Object.values(pub.zones)
              .flatMap((z) => Object.values(z).flat())
              .some((c) => c.handle === pub.decision!.source!.handle && c.card !== null);
            expect(onBoard).toBe(true);
          }
          expect(pub.decision.prompt).not.toMatch(/^Your opponent/);
        }
        // The public log holds no draw's card: compare with the other player's own projection.
        const mine = s.publicLog(viewer).events.flat();
        const theirsLog = s.log(other).events.flat();
        mine.forEach((e, k) => {
          if (e.type === 'CardMoved' && typeof e.card === 'string')
            expect(theirsLog[k]!.card).toBe(e.card);
        });
      }
      const p = s.decider()!;
      s.apply(p, rookie(s.view(p), { seed: i, counterOf }).action);
    }
  });

  it('the AI worker receives only its own deck’s cards', () => {
    const decks = metaDecks();
    const human = decks[0]!;
    const ai = decks[6]!;
    const all = new Map(
      [human.leader, ...human.main, ai.leader, ...ai.main].map((id) => [id, cardMap().get(id)!]),
    );
    const sent = aiInitCards(all, [ai.leader, ...ai.main]).map((c) => c.id);
    const aiIds = new Set([ai.leader, ...ai.main]);
    for (const id of sent) expect(aiIds.has(id)).toBe(true);
    const humanOnly = [human.leader, ...human.main].filter((id) => !aiIds.has(id));
    expect(humanOnly.length).toBeGreaterThan(0);
    for (const id of humanOnly) expect(sent).not.toContain(id);
  });
});
