/**
 * The pure half of `npm run meta:update` (PLAN §2a M6b-0, ADR 0014): turns Limitless tournament
 * standings into a candidate `docs/research/meta-lists.json` and a per-card play-frequency table.
 * Fetching lives in `scripts/meta-update.ts`; nothing here touches the network or the disk.
 *
 * Counting follows `meta-lists.json` `countingMethod`: Standard events with published decklists and
 * enough players, top-8 placings per Leader card number, meta share over every counted decklist. An
 * event is skipped when any decklist uses a card our snapshot does not know (not yet released in
 * English, or a source gap); a decklist is skipped when it breaks the current Standard list (banned,
 * rotated, over a restricted limit).
 */
import type { Card } from '../src/schema.ts';

/** `GET /tournaments?game=OP` entry. */
export interface LimitlessTournament {
  id: string;
  name: string;
  date: string;
  players: number;
  format: string | null;
}

interface LimitlessCardRef {
  count?: number;
  name?: string;
  set: string;
  number: string;
}

/** `GET /tournaments/{id}/standings` entry (One Piece decklist shape, checked live 2026-11-23). */
export interface LimitlessStanding {
  name?: string;
  player?: string;
  placing?: number | null;
  record?: { wins: number; losses: number; ties: number };
  drop?: number | null;
  decklist?: ({ leader?: LimitlessCardRef } & Record<string, unknown>) | null;
}

export interface EventData {
  tournament: LimitlessTournament;
  standings: LimitlessStanding[];
}

export interface MetaList {
  event: string;
  date: string;
  placing: string;
  player: string;
  url: string;
  leader: string;
  main: { id: string; count: number }[];
  players: number;
  record: { wins: number; losses: number; ties: number } | null;
  source: string;
}

export interface Archetype {
  id: string;
  leaderId: string;
  name: string;
  colors: string[];
  top8Count: number;
  metaShare: number;
  lists: MetaList[];
  [hand: string]: unknown;
}

export interface MetaFile {
  asOf: string;
  window: { from: string; to: string };
  countingMethod: string;
  archetypes: Archetype[];
  [hand: string]: unknown;
}

export interface Options {
  /** Inclusive window, ISO dates. */
  from: string;
  to: string;
  minPlayers: number;
  /** How many Leaders make the candidate's archetype list (by top-8 count). */
  archetypes: number;
  listsPerArchetype: number;
}

export const DEFAULTS: Omit<Options, 'from' | 'to'> = {
  minPlayers: 24,
  archetypes: 12,
  listsPerArchetype: 3,
};

export interface Skipped {
  event: string;
  reason: string;
}

export interface Tally {
  events: { id: string; name: string; date: string; players: number; decks: number }[];
  skipped: Skipped[];
  decks: number;
  decksSkipped: number;
  leaders: Map<string, LeaderTally>;
  /** Card numbers of known sets that the snapshot lacks (a source gap; their decks were skipped). */
  missing: Map<string, number>;
  /** Card number → decks that run it and total copies, over every counted decklist. */
  cards: Map<string, { decks: number; copies: number }>;
}

interface LeaderTally {
  decks: number;
  top8: number;
  entries: MetaList[];
}

/** Limitless `{set, number}` to our card number: `OP17`/`039` → `OP17-039`, `P`/`001` → `P-001`. */
export function cardIdOf(ref: { set: string; number: string }): string {
  const n = String(ref.number).split(/[_-]/)[0]!.padStart(3, '0');
  return `${ref.set.toUpperCase()}-${n}`;
}

/** Leader and main deck of a Limitless decklist; categories other than `leader` hold the 50. */
export function deckOf(
  decklist: NonNullable<LimitlessStanding['decklist']>,
): { leader: string; main: Map<string, number> } | null {
  if (!decklist.leader?.set || !decklist.leader.number) return null;
  const main = new Map<string, number>();
  for (const [k, v] of Object.entries(decklist)) {
    if (k === 'leader' || !Array.isArray(v)) continue;
    for (const ref of v as LimitlessCardRef[]) {
      if (!ref?.set || !ref.number) continue;
      const id = cardIdOf(ref);
      main.set(id, (main.get(id) ?? 0) + Math.max(0, Math.trunc(ref.count ?? 1)));
    }
  }
  return { leader: cardIdOf(decklist.leader), main };
}

const ordinal = (n: number) => {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');
  return `${n}${s}`;
};

/** Why a deck is not counted under the current Standard list, or null when it is. */
export function standardProblem(
  leader: string,
  main: Map<string, number>,
  lookup: (id: string) => Card | undefined,
): string | null {
  for (const [id, n] of [[leader, 1] as const, ...main]) {
    const l = lookup(id)?.legality.standard;
    if (!l) return `unknown card ${id}`;
    if (l.status === 'banned' || l.status === 'rotated') return `${id} ${l.status}`;
    if (l.status === 'restricted' && n > (l.limit ?? 1)) return `${id} over its limit`;
    for (const other of l.bannedWith ?? [])
      if (other === leader || main.has(other)) return `${id} banned with ${other}`;
  }
  const size = [...main.values()].reduce((a, b) => a + b, 0);
  if (size !== 50) return `${size} cards`;
  return null;
}

/**
 * Counts every event in the window. `knownSets` holds the set prefixes the snapshot has (`OP17`,
 * `P`, …): an unknown card from a set the snapshot lacks entirely means the event used a set not yet
 * released in English, so the event is skipped; an unknown card of a known set is a source gap, so
 * only that decklist is skipped and the card is reported.
 */
export function tally(
  events: EventData[],
  lookup: (id: string) => Card | undefined,
  opts: Options,
  knownSets: ReadonlySet<string> = new Set(),
): Tally {
  const out: Tally = {
    events: [],
    skipped: [],
    decks: 0,
    decksSkipped: 0,
    leaders: new Map(),
    missing: new Map(),
    cards: new Map(),
  };
  for (const { tournament: t, standings } of events) {
    const day = t.date.slice(0, 10);
    if (day < opts.from || day > opts.to) continue;
    const label = `${t.name} (${day})`;
    if (/extra/i.test(t.format ?? '') || /extra reg/i.test(t.name)) {
      out.skipped.push({ event: label, reason: 'Extra Regulation' });
      continue;
    }
    if (t.players < opts.minPlayers) continue;
    const decks = standings.flatMap((s) => {
      const d = s.decklist ? deckOf(s.decklist) : null;
      return d ? [{ s, ...d }] : [];
    });
    if (decks.length === 0) {
      out.skipped.push({ event: label, reason: 'no published decklists' });
      continue;
    }
    const unreleased = new Set(
      decks.flatMap((d) =>
        [d.leader, ...d.main.keys()].filter(
          (id) => !lookup(id) && !knownSets.has(id.split('-')[0]!),
        ),
      ),
    );
    if (unreleased.size > 0) {
      out.skipped.push({
        event: label,
        reason: `cards of a set not in the snapshot: ${[...unreleased].sort().slice(0, 5).join(', ')}${unreleased.size > 5 ? ', …' : ''}`,
      });
      continue;
    }
    let counted = 0;
    for (const d of decks) {
      const gaps = [d.leader, ...d.main.keys()].filter((id) => !lookup(id));
      for (const id of gaps) out.missing.set(id, (out.missing.get(id) ?? 0) + 1);
      if (gaps.length > 0 || standardProblem(d.leader, d.main, lookup)) {
        out.decksSkipped++;
        continue;
      }
      counted++;
      out.decks++;
      const lt = out.leaders.get(d.leader) ?? { decks: 0, top8: 0, entries: [] };
      out.leaders.set(d.leader, lt);
      lt.decks++;
      const placing = d.s.placing ?? null;
      if (placing !== null && placing >= 1 && placing <= 8) {
        lt.top8++;
        lt.entries.push({
          event: t.name,
          date: day,
          placing: ordinal(placing),
          player: d.s.name ?? d.s.player ?? '',
          url: `https://play.limitlesstcg.com/tournament/${t.id}/player/${d.s.player ?? ''}/decklist`,
          leader: d.leader,
          main: [...d.main].map(([id, count]) => ({ id, count })),
          players: t.players,
          record: d.s.record ?? null,
          source: 'Limitless platform API /tournaments/{id}/standings',
        });
      }
      for (const [id, n] of d.main) {
        const c = out.cards.get(id) ?? { decks: 0, copies: 0 };
        c.decks++;
        c.copies += n;
        out.cards.set(id, c);
      }
    }
    out.events.push({ id: t.id, name: t.name, date: day, players: t.players, decks: counted });
  }
  return out;
}

/** Best lists first: placing, then newest; at most one per event while others remain. */
export function pickLists(entries: readonly MetaList[], n: number): MetaList[] {
  const place = (l: MetaList) => Number.parseInt(l.placing, 10);
  const sorted = [...entries].sort(
    (a, b) => place(a) - place(b) || b.date.localeCompare(a.date) || a.url.localeCompare(b.url),
  );
  const out: MetaList[] = [];
  const events = new Set<string>();
  for (const l of sorted)
    if (out.length < n && !events.has(l.event + l.date)) {
      out.push(l);
      events.add(l.event + l.date);
    }
  for (const l of sorted) if (out.length < n && !out.includes(l)) out.push(l);
  return out;
}

const round1 = (x: number) => Math.round(x * 10) / 10;

export interface Candidate {
  meta: MetaFile;
  added: string[];
  dropped: string[];
  /** Archetypes kept from the current file with no new list in the window (old lists kept). */
  stale: string[];
  /** The N of "top N" (Options.archetypes). */
  top: number;
}

/**
 * The candidate file. Hand-kept fields of a current archetype (tiers, sources, notes) are kept; the
 * counts and lists are replaced. Leaders that enter the top N are added with those fields empty, for
 * a person to fill. Current archetypes that leave the top N are kept and reported, not removed: a
 * guide and playbook depend on them, and a person decides.
 */
export function candidate(
  current: MetaFile,
  t: Tally,
  lookup: (id: string) => Card | undefined,
  opts: Options,
  today: string,
): Candidate {
  const ranked = [...t.leaders]
    .sort(([a, x], [b, y]) => y.top8 - x.top8 || y.decks - x.decks || a.localeCompare(b))
    .slice(0, opts.archetypes)
    .map(([id]) => id);
  const share = (id: string) => round1(((t.leaders.get(id)?.decks ?? 0) / (t.decks || 1)) * 100);
  const byLeader = new Map(current.archetypes.map((a) => [a.leaderId, a]));
  const added = ranked.filter((id) => !byLeader.has(id));
  const dropped = current.archetypes.map((a) => a.leaderId).filter((id) => !ranked.includes(id));
  const stale: string[] = [];
  const update = (a: Archetype): Archetype => {
    const lt = t.leaders.get(a.leaderId);
    const lists = pickLists(lt?.entries ?? [], opts.listsPerArchetype);
    if (lists.length === 0) stale.push(a.leaderId);
    return {
      ...a,
      top8Count: lt?.top8 ?? 0,
      metaShare: share(a.leaderId),
      lists: lists.length > 0 ? lists : a.lists,
    };
  };
  const fresh = (id: string): Archetype => {
    const c = lookup(id);
    const slug = (c?.name ?? id)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return update({
      id: `${id}-${slug}`,
      leaderId: id,
      name: c?.name ?? id,
      colors: c?.colors ?? [],
      top8Count: 0,
      metaShare: 0,
      tier: null,
      sources: ['https://play.limitlesstcg.com/api/tournaments?game=OP'],
      lists: [],
    });
  };
  const archetypes = [...current.archetypes.map(update), ...added.map(fresh)].sort(
    (a, b) => b.top8Count - a.top8Count || a.leaderId.localeCompare(b.leaderId),
  );
  return {
    meta: {
      ...current,
      asOf: today,
      window: { from: opts.from, to: opts.to },
      countingMethod: `Sum of final placings 1-8 per leader card ID across ${t.events.length} Limitless-platform online Standard events (${opts.minPlayers}+ players, decklists published) from ${opts.from} to ${opts.to}, written by npm run meta:update. Skipped: Extra Regulation events, events with a card not in the card snapshot (not yet released in English), and decklists that break the current Standard list (banned, rotated, over a restricted limit). metaShare = percent of all ${t.decks} counted decklists. Archetypes: the top ${opts.archetypes} leaders by top-8 count, plus any earlier archetype (kept until a person removes it).`,
      archetypes,
    },
    added,
    dropped,
    stale,
    top: opts.archetypes,
  };
}

export interface FrequencyFile {
  asOf: string;
  window: { from: string; to: string };
  events: number;
  decks: number;
  /** Sorted by decks, then copies. `share` is the percent of counted decks that run the card. */
  cards: { id: string; decks: number; copies: number; share: number }[];
  leaders: { id: string; decks: number; top8: number; share: number }[];
}

export function frequency(t: Tally, opts: Options, today: string): FrequencyFile {
  const pct = (n: number) => round1((n / (t.decks || 1)) * 100);
  return {
    asOf: today,
    window: { from: opts.from, to: opts.to },
    events: t.events.length,
    decks: t.decks,
    cards: [...t.cards]
      .map(([id, c]) => ({ id, ...c, share: pct(c.decks) }))
      .sort((a, b) => b.decks - a.decks || b.copies - a.copies || a.id.localeCompare(b.id)),
    leaders: [...t.leaders]
      .map(([id, l]) => ({ id, decks: l.decks, top8: l.top8, share: pct(l.decks) }))
      .sort((a, b) => b.top8 - a.top8 || b.decks - a.decks || a.id.localeCompare(b.id)),
  };
}

/** Days between two ISO dates. */
export const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / 86_400_000);

export interface ReportInput {
  cand: Candidate;
  t: Tally;
  /** Leader → guide `asOf`, for every guide in docs/content/archetypes/. */
  guides: Map<string, string>;
  playbooks: Set<string>;
  scripted: ReadonlySet<string>;
  lookup: (id: string) => Card | undefined;
  today: string;
}

/** The meta PR body (ARCHITECTURE §3 "Update pipeline"). */
export function report(r: ReportInput): string {
  const { cand, t } = r;
  const name = (id: string) => `${id} ${r.lookup(id)?.name ?? ''}`.trim();
  const lines: string[] = [
    `# Meta update ${r.today}`,
    '',
    `Window ${cand.meta.window.from} to ${cand.meta.window.to}: ${t.events.length} events counted, ${t.decks} decklists (${t.decksSkipped} skipped: not Standard-legal now, or a card the snapshot lacks), ${t.skipped.length} events skipped.`,
    '',
    '## Archetypes',
    '',
    '| Leader | Top 8 | Share | Lists | Guide | Playbook |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  for (const a of cand.meta.archetypes) {
    const g = r.guides.get(a.leaderId);
    const age = g ? daysBetween(g, r.today) : null;
    lines.push(
      `| ${name(a.leaderId)} | ${a.top8Count} | ${a.metaShare}% | ${a.lists.map((l) => l.date).join(', ')} | ${g ? `${g}${age! > 60 ? ` (**${age} days old**)` : ''}` : '**none**'} | ${r.playbooks.has(a.leaderId) ? 'yes' : '**none**'} |`,
    );
  }
  const list = (title: string, xs: string[], empty = 'None.') =>
    lines.push('', `## ${title}`, '', ...(xs.length ? xs.map((x) => `- ${x}`) : [empty]));
  list('New archetypes (need a guide, a playbook and assertions)', cand.added.map(name));
  list(
    `Archetypes that left the top ${cand.top}`,
    cand.dropped.map(name),
    'None. Kept in the file until a person removes them.',
  );
  list('Archetypes with no list in the window (old lists kept)', cand.stale.map(name));
  const old = [...r.guides]
    .filter(([, d]) => daysBetween(d, r.today) > 60)
    .map(([id, d]) => `${name(id)}: as of ${d}`);
  list('Guides older than 60 days', old);
  const metaCards = new Set(
    cand.meta.archetypes.flatMap((a) => [
      a.leaderId,
      ...a.lists.flatMap((l) => l.main.map((m) => m.id)),
    ]),
  );
  const unscripted = [...metaCards]
    .filter((id) => !r.scripted.has(id) && (r.lookup(id)?.effectText ?? '').trim() !== '')
    .sort();
  list('Meta-list cards not yet scripted (next scripting batch)', unscripted.map(name));
  list(
    'Leaders with no playbook',
    cand.meta.archetypes
      .map((a) => a.leaderId)
      .filter((id) => !r.playbooks.has(id))
      .map(name),
  );
  list(
    'Cards the snapshot lacks (their decklists skipped; check the card source)',
    [...t.missing].sort().map(([id, n]) => `${id}: ${n} decklist${n === 1 ? '' : 's'}`),
  );
  list(
    'Skipped events',
    t.skipped.map((s) => `${s.event}: ${s.reason}`),
  );
  return lines.join('\n') + '\n';
}
