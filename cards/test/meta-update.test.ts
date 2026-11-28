/**
 * `meta:update`'s pure half (cards/scripts/meta.ts): Limitless standings → counts, lists, the
 * play-frequency table and the report. Fixtures are built from the sourced meta lists, in the
 * decklist shape the live API returned on 2026-11-23.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import metaJson from '../../docs/research/meta-lists.json';
import {
  candidate,
  cardIdOf,
  DEFAULTS,
  deckOf,
  enrichFrequency,
  frequency,
  pickLists,
  report,
  standardProblem,
  tally,
  type EventData,
  type FrequencyFile,
  type LimitlessStanding,
  type MetaFile,
  type MetaList,
  type Options,
} from '../scripts/meta.ts';
import { readSnapshot } from '../scripts/update.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const snapshot = readSnapshot(join(ROOT, 'cards/data'))!;
const lookup = (id: string) => snapshot.get(id);
const meta = metaJson as unknown as MetaFile;
const OPTS: Options = { ...DEFAULTS, from: '2026-10-01', to: '2026-11-23' };

const ref = (id: string, count?: number) => {
  const [set, number] = id.split('-') as [string, string];
  return { ...(count === undefined ? {} : { count }), name: lookup(id)?.name ?? '?', set, number };
};

/** A sourced list in the Limitless shape (every main card under `character`; the category is ignored). */
function standing(list: MetaList, placing: number, player = `p${placing}`): LimitlessStanding {
  return {
    name: player,
    player,
    placing,
    record: { wins: 5, losses: 1, ties: 0 },
    decklist: { leader: ref(list.leader), character: list.main.map((m) => ref(m.id, m.count)) },
  };
}

const lists = meta.archetypes.flatMap((a) => a.lists);
const rocks = meta.archetypes.find((a) => a.leaderId === 'OP17-039')!.lists;
const kaido = meta.archetypes.find((a) => a.leaderId === 'OP09-062')?.lists ?? lists.slice(3, 6);

function event(id: string, date: string, standings: LimitlessStanding[], over = {}): EventData {
  return {
    tournament: {
      id,
      name: `Event ${id}`,
      date: `${date}T18:00:00.000Z`,
      players: 40,
      format: null,
      ...over,
    },
    standings,
  };
}

describe('meta:update parsing', () => {
  it('maps Limitless set and number to our card numbers', () => {
    expect(cardIdOf({ set: 'OP17', number: '039' })).toBe('OP17-039');
    expect(cardIdOf({ set: 'eb05', number: '28' })).toBe('EB05-028');
    expect(cardIdOf({ set: 'P', number: '001' })).toBe('P-001');
    expect(cardIdOf({ set: 'OP05', number: '119_p1' })).toBe('OP05-119');
  });

  it('reads a decklist: leader apart, every other category summed into the 50', () => {
    const d = deckOf({
      leader: ref('OP17-039'),
      character: [ref('OP17-040', 4), ref('OP17-045', 2)],
      event: [ref('OP17-045', 2), ref('OP17-055', 4)],
      stage: 'not a list',
    })!;
    expect(d.leader).toBe('OP17-039');
    expect(Object.fromEntries(d.main)).toEqual({ 'OP17-040': 4, 'OP17-045': 4, 'OP17-055': 4 });
    expect(deckOf({ character: [] })).toBeNull();
  });

  it('every sourced list is Standard-legal now; a banned Leader or a fifth copy of a restricted card is not', () => {
    for (const l of lists)
      expect(
        standardProblem(l.leader, new Map(l.main.map((m) => [m.id, m.count])), lookup),
        l.url,
      ).toBeNull();
    const main = new Map(rocks[0]!.main.map((m) => [m.id, m.count]));
    expect(standardProblem('OP14-020', main, lookup)).toMatch(/OP14-020 banned/);
    expect(standardProblem('OP17-039', new Map([...main, ['OP99-001', 1]]), lookup)).toMatch(
      /unknown/,
    );
    const short = new Map(main);
    short.delete('OP17-040');
    expect(standardProblem('OP17-039', short, lookup)).toMatch(/46 cards/);
  });
});

describe('meta:update counting', () => {
  const events = [
    event('a', '2026-11-20', [
      standing(rocks[0]!, 1),
      standing(kaido[0]!, 2),
      standing(rocks[1]!, 9),
    ]),
    event('b', '2026-11-10', [standing(kaido[1]!, 1), standing(rocks[2]!, 3)]),
    // Skipped: too small, Extra Regulation, an unknown card, no decklists, outside the window.
    event('small', '2026-11-12', [standing(rocks[0]!, 1)], { players: 8 }),
    event('extra', '2026-11-12', [standing(rocks[0]!, 1)], { name: 'Extra Regulation cup' }),
    event('new', '2026-11-12', [
      standing(rocks[0]!, 1),
      {
        ...standing(kaido[0]!, 2),
        decklist: {
          leader: ref('OP17-039'),
          character: [{ set: 'OP19', number: '001', count: 4 }],
        },
      },
    ]),
    event('nolists', '2026-11-12', [{ name: 'x', placing: 1, decklist: null }]),
    event('old', '2026-09-01', [standing(rocks[0]!, 1)]),
    // A banned Leader's deck is skipped; the event counts.
    event('ban', '2026-11-01', [
      standing(rocks[0]!, 1),
      {
        ...standing(rocks[1]!, 2),
        decklist: {
          leader: ref('OP14-020'),
          character: rocks[1]!.main.map((m) => ref(m.id, m.count)),
        },
      },
    ]),
  ];
  const KNOWN = new Set([...snapshot.keys()].map((id) => id.split('-')[0]!));
  const t = tally(events, lookup, OPTS, KNOWN);

  it('counts only Standard events in the window with published lists and known cards', () => {
    expect(t.events.map((e) => e.id).sort()).toEqual(['a', 'b', 'ban']);
    expect(t.skipped.map((s) => s.reason)).toEqual([
      'Extra Regulation',
      'cards of a set not in the snapshot: OP19-001',
      'no published decklists',
    ]);
    expect(t.decks).toBe(6);
    expect(t.decksSkipped).toBe(1);
  });

  it('a card of a known set that the snapshot lacks skips only its decklist, and is reported', () => {
    const withGap = (l: MetaList) => ({
      ...standing(l, 2),
      decklist: {
        leader: ref(l.leader),
        character: [
          ...l.main.map((m) => ref(m.id, m.count)),
          { set: 'P', number: '999', count: 1 },
        ],
      },
    });
    const g = tally(
      [event('gap', '2026-11-20', [standing(rocks[0]!, 1), withGap(rocks[1]!)])],
      lookup,
      OPTS,
      KNOWN,
    );
    expect(g.events.map((e) => e.id)).toEqual(['gap']);
    expect(g.decks).toBe(1);
    expect(g.decksSkipped).toBe(1);
    expect([...g.missing]).toEqual([['P-999', 1]]);
    // Without the known sets, the same card means an unreleased set: the event is skipped.
    expect(tally([event('gap', '2026-11-20', [withGap(rocks[1]!)])], lookup, OPTS).events).toEqual(
      [],
    );
  });

  it('top 8 per Leader, and the share of all counted decks', () => {
    expect(t.leaders.get('OP17-039')).toMatchObject({ decks: 4, top8: 3 });
    expect(t.leaders.get(kaido[0]!.leader)).toMatchObject({ decks: 2, top8: 2 });
    const f = frequency(t, OPTS, '2026-11-23', snapshot);
    expect(f.leaders[0]).toEqual({ id: 'OP17-039', decks: 4, top8: 3, share: 66.7 });
    expect(f.cards.find((c) => c.id === 'OP17-040')).toMatchObject({ decks: 4 });
    expect(f.cards[0]!.decks).toBeGreaterThanOrEqual(f.cards.at(-1)!.decks);
  });

  it('the play-frequency table carries colours, category and Standard status (M6b-7)', () => {
    const f = frequency(t, OPTS, '2026-11-23', snapshot);
    for (const row of f.cards) {
      const c = snapshot.get(row.id)!;
      expect(row.colors).toEqual(c.colors);
      expect(row.category).toBe(c.category);
      expect(row.standard).toBe(c.legality.standard.status);
    }
    // Every Standard-usable Leader of the snapshot has its colours, played or not.
    expect(f.leaderColors!['OP09-081']).toEqual(snapshot.get('OP09-081')!.colors);
    for (const id of Object.keys(f.leaderColors!)) {
      expect(snapshot.get(id)!.category).toBe('Leader');
      expect(['legal', 'restricted']).toContain(snapshot.get(id)!.legality.standard.status);
    }
  });

  it('the committed play-frequency file is the enriched table of the snapshot', () => {
    const file = JSON.parse(
      readFileSync(join(ROOT, 'cards/data/play-frequency.json'), 'utf8'),
    ) as FrequencyFile;
    expect(enrichFrequency(file, snapshot)).toEqual(file);
    expect(file.cards.every((r) => r.colors && r.category && r.standard)).toBe(true);
  });

  it('picks the best-placed lists, one per event first', () => {
    const picked = pickLists(t.leaders.get('OP17-039')!.entries, 3);
    expect(picked.map((l) => [l.event, l.placing])).toEqual([
      ['Event a', '1st'],
      ['Event ban', '1st'],
      ['Event b', '3rd'],
    ]);
    expect(picked[0]!.url).toBe('https://play.limitlesstcg.com/tournament/a/player/p1/decklist');
    expect(picked[0]!.main.reduce((n, m) => n + m.count, 0)).toBe(50);
  });

  it('the candidate keeps hand fields, replaces counts and lists, adds and reports Leaders', () => {
    const opts = { ...OPTS, archetypes: 2 };
    const c = candidate(meta, t, lookup, opts, '2026-11-23');
    const r = c.meta.archetypes.find((a) => a.leaderId === 'OP17-039')!;
    const before = meta.archetypes.find((a) => a.leaderId === 'OP17-039')!;
    expect(r.tierOpmetagame).toBe(before.tierOpmetagame);
    expect(r.top8Count).toBe(3);
    expect(r.metaShare).toBe(66.7);
    expect(r.lists[0]!.event).toBe('Event a');
    expect(c.meta.archetypes).toHaveLength(meta.archetypes.length);
    expect(c.added).toEqual([]);
    expect(c.dropped).toHaveLength(meta.archetypes.length - 2);
    // An archetype with no list in the window keeps its old lists and is reported stale.
    const stale = c.meta.archetypes.find((a) => a.leaderId === c.stale[0])!;
    expect(stale.lists).toEqual(meta.archetypes.find((a) => a.leaderId === stale.leaderId)!.lists);
    expect(c.meta.asOf).toBe('2026-11-23');

    const fewer = { ...meta, archetypes: meta.archetypes.filter((a) => a.leaderId !== 'OP17-039') };
    const c2 = candidate(fewer, t, lookup, opts, '2026-11-23');
    expect(c2.added).toEqual(['OP17-039']);
    const added = c2.meta.archetypes.find((a) => a.leaderId === 'OP17-039')!;
    expect(added).toMatchObject({
      id: 'OP17-039-rocks-d-xebec',
      name: 'Rocks.D.Xebec',
      tier: null,
      guidePending: true,
    });
    expect(added.lists).toHaveLength(3);
    // An archetype already in the file keeps its own flags (a written guide has no flag).
    expect(c2.meta.archetypes.find((a) => a.leaderId !== 'OP17-039')!.guidePending).toBeUndefined();
  });

  it('hand-added archetypes (EB02-010 Luffy, OP18-021 Franky; M11 Track C) survive a refresh with no top-8', () => {
    const hand = ['EB02-010', 'OP18-021'];
    for (const id of hand) expect(meta.archetypes.some((a) => a.leaderId === id)).toBe(true);
    // The standings in this file's fixtures hold no top-8 for them: the refresh must keep them.
    const c = candidate(meta, t, lookup, { ...OPTS, archetypes: 2 }, '2026-11-23');
    for (const id of hand) {
      const before = meta.archetypes.find((a) => a.leaderId === id)!;
      const kept = c.meta.archetypes.find((a) => a.leaderId === id);
      expect(kept, id).toBeDefined();
      expect(kept!.lists, id).toEqual(before.lists);
      expect(kept!.handAdded, id).toBe(before.handAdded);
      expect(c.stale).toContain(id);
      expect(c.dropped).toContain(id); // reported for a person, not removed
    }
  });

  it('the report lists new and stale archetypes, old guides, unscripted cards and missing playbooks', () => {
    const fewer = { ...meta, archetypes: meta.archetypes.filter((a) => a.leaderId !== 'OP17-039') };
    const c = candidate(fewer, t, lookup, { ...OPTS, archetypes: 2 }, '2026-11-23');
    const body = report({
      cand: c,
      t,
      guides: new Map([
        ['OP09-062', '2026-08-01'],
        ['OP17-039', '2026-11-01'],
      ]),
      playbooks: new Set(['OP09-062']),
      scripted: new Set(),
      lookup,
      today: '2026-11-23',
    });
    expect(body).toContain('## New archetypes');
    expect(body).toMatch(/- OP17-039 Rocks\.D\.Xebec/);
    expect(body).toMatch(/OP09-062 .*: as of 2026-08-01/);
    expect(body).toContain('(**114 days old**)');
    expect(body).toMatch(/## Meta-list cards not yet scripted[\s\S]*- OP17-040/);
    expect(body).toMatch(/## Leaders with no playbook[\s\S]*- OP17-039/);
    expect(body).toContain('Extra Regulation cup (2026-11-12): Extra Regulation');
  });
});
