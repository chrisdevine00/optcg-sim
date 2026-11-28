/**
 * M9 WP1: the Meta Explorer's data. Tiles and the header read `meta-lists.json` (pinned in tests), the
 * grid reads the guides; names, strings and the disagreement rule are the learning-ui §5 examples.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { setCodeOf, type Card, type SetFile } from '@optcg/cards';
import { DECKS } from '../src/play/setup/decks.ts';
import { loadGuides } from '../src/meta/guides.ts';
import {
  archetypeIdOf,
  automationLine,
  cellLabel,
  cellMarker,
  colorsOf,
  filterByColor,
  gridMove,
  header,
  matchupGrid,
  matchupHref,
  sortTiles,
  tileLabel,
  tiles,
} from '../src/meta/model.ts';

const T = tiles();
const byLeader = (id: string) => T.find((t) => t.leaderId === id)!;

describe('tiles and names', () => {
  it('has fourteen tiles, one name each, told apart by colour where a Leader name repeats', () => {
    expect(T).toHaveLength(14);
    expect(new Set(T.map((t) => t.name)).size).toBe(14);
    expect(byLeader('OP17-079').name).toBe('Luffy (Black)');
    expect(byLeader('OP13-001').name).toBe('Luffy (Red/Green)');
    expect(byLeader('OP15-058').name).toBe('Enel (Purple)');
    expect(byLeader('OP05-098').name).toBe('Enel (Yellow)');
    expect(byLeader('OP17-039').name).toBe('Rocks.D.Xebec');
    expect(byLeader('EB02-010').name).toBe('Luffy (Green/Purple)');
    expect(byLeader('OP18-021').name).toBe('Franky');
  });
  it('the Rocks tile reads the learning-ui example', () => {
    const rocks = byLeader('OP17-039');
    expect(tileLabel(rocks)).toBe(
      'Rocks.D.Xebec, Blue, tier S on opmetagame, 11.2% of lists, 16.1% since the ban. Guide and 3 lists.',
    );
    expect(rocks.tier).toBe('S');
    expect(rocks.tierSource).toContain('opmetagame');
    expect(rocks.listDates).toEqual(['2026-10-13', '2026-10-12', '2026-10-08']);
  });
  it('a two-colour deck is spoken with "and"', () => {
    expect(tileLabel(byLeader('OP09-062'))).toMatch(/^Nico Robin, Purple and Yellow, tier S/);
  });
  it('deckId is the id of the first list in DECKS, and archetypeIdOf agrees', () => {
    for (const t of T) {
      expect(t.deckId).not.toBeNull();
      expect(DECKS.some((d) => d.id === t.deckId && d.leader === t.leaderId)).toBe(true);
      expect(`${archetypeIdOf(t.leaderId)}#1`).toBe(t.deckId);
      expect(t.archetypeId).toBe(archetypeIdOf(t.leaderId));
    }
  });
});

describe('header', () => {
  it('reads the learning-ui example from the file', () => {
    expect(header()).toBe(
      'English Standard · as of 2026-10-28 · 33 online events, 30 Jul to 28 Oct',
    );
  });
});

describe('sort and filter', () => {
  it('sorts by share (default), share since the ban, tier, colour and name', () => {
    expect(sortTiles(T, 'share')[0]!.leaderId).toBe('OP17-039');
    expect(sortTiles(T, 'postban')[0]!.leaderId).toBe('OP17-039');
    expect(sortTiles(T, 'postban')[1]!.leaderId).toBe('ST30-001');
    const tiers = sortTiles(T, 'tier').map((t) => t.tier);
    expect(tiers).toEqual([...tiers].sort());
    expect(sortTiles(T, 'color')[0]!.colors[0]).toBe('Black');
    const names = sortTiles(T, 'name').map((t) => t.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(T.map((t) => t.leaderId)).toEqual(tiles().map((t) => t.leaderId)); // the input keeps its order
  });
  it('filters by colour', () => {
    const blue = filterByColor(T, 'Blue');
    expect(blue.map((t) => t.leaderId).sort()).toEqual(['OP14-041', 'OP17-039']);
    expect(filterByColor(T, null)).toHaveLength(14);
    expect(colorsOf(T)).toEqual(['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow']);
  });
});

describe('automation line', () => {
  const t = (n: number, of: number) => ({ ...T[0]!, automated: { n, of } });
  it('says the consequence when a deck does not play fully', () => {
    expect(automationLine(t(50, 50))).toBe('50 of 50 cards automated');
    expect(automationLine(t(43, 50))).toBe('Plays with a generic AI; 7 card effects not automated');
  });
  it('counts the first list from the scripts index, and vanilla cards from the card data', () => {
    const sets = new Map<string, Card[]>();
    const cards = new Map<string, Card>();
    for (const d of DECKS.filter((x) => x.id.endsWith('#1')))
      for (const id of d.spec.main) {
        const code = setCodeOf(id);
        if (!sets.has(code))
          sets.set(
            code,
            (
              JSON.parse(
                readFileSync(
                  new URL(`../../cards/data/sets/${code}.json`, import.meta.url),
                  'utf8',
                ),
              ) as SetFile
            ).cards,
          );
        const c = sets.get(code)!.find((x) => x.id === id);
        if (c) cards.set(id, c);
      }
    const withCards = tiles(cards);
    for (const w of withCards) {
      expect(w.automated.of).toBe(50);
      expect(w.automated.n).toBeLessThanOrEqual(50);
      // Card data can only add cards that need no script.
      expect(w.automated.n).toBeGreaterThanOrEqual(byLeader(w.leaderId).automated.n);
    }
  });
});

describe('matchup grid', () => {
  it('is 14 by 14 with a mirror on the diagonal and 182 plans elsewhere', async () => {
    const grid = matchupGrid(await loadGuides());
    expect(grid).toHaveLength(14);
    let plans = 0;
    grid.forEach((row, r) =>
      row.forEach((c, i) => {
        expect(c.mirror).toBe(r === i);
        if (!c.mirror && c.entry) plans++;
      }),
    );
    expect(plans).toBe(182);
  });
  it('shows a record or "plan", never a percentage', async () => {
    const grid = matchupGrid(await loadGuides()).flat();
    for (const c of grid) expect(cellMarker(c)).toMatch(/^(\d+–\d+|plan|mirror)$/);
  });
  it('reads the screen-reader example for a plan with no record', async () => {
    const grid = matchupGrid(await loadGuides());
    const ids = T.map((t) => t.leaderId);
    const cell = grid[ids.indexOf('OP17-039')]![ids.indexOf('OP05-098')]!;
    expect(cellLabel(cell)).toBe(
      'Rocks against Enel (Yellow): plan available, inference. Enter for details.',
    );
    const kaido = grid[ids.indexOf('OP17-039')]![ids.indexOf('OP17-058')]!;
    expect(cellLabel(kaido)).toBe(
      'Rocks against Kaido: record 16–20, Rocks W–L, plan available, inference. Enter for details.',
    );
    expect(cellLabel(grid[0]![0]!)).toBe('Rocks against Rocks: mirror. Enter for details.');
  });
  it('marks two sources that give different records for one pairing, with both views', async () => {
    const grid = matchupGrid(await loadGuides());
    const ids = T.map((t) => t.leaderId);
    // Rocks's row says 11-12 against Robin; Robin's row says 35-39 against Rocks: not each other's reverse.
    const cell = grid[ids.indexOf('OP17-039')]![ids.indexOf('OP09-062')]!;
    expect(cell.disagree).toBe(true);
    expect(cell.entry!.record).toMatchObject({ w: 11, l: 12 });
    expect(cell.other!.record).toMatchObject({ w: 35, l: 39 });
    expect(cell.entry!.owner).toBe('OP17-039');
    expect(cell.other!.owner).toBe('OP09-062');
    expect(cellLabel(cell)).toContain('sources disagree');
    // The mirrored cell shows the same marker and the same disagreement.
    const back = grid[ids.indexOf('OP09-062')]![ids.indexOf('OP17-039')]!;
    expect(back.disagree).toBe(true);
    expect(cellMarker(back)).toBe('35–39');
  });
  it('does not mark a pairing whose two records are each other’s reverse', async () => {
    const grid = matchupGrid(await loadGuides());
    const ids = T.map((t) => t.leaderId);
    // Rocks 16-20 against Kaido; Kaido's guide has 20-16 against Rocks (one source, read from both sides).
    const cell = grid[ids.indexOf('OP17-039')]![ids.indexOf('OP17-058')]!;
    expect(cell.entry!.record).toMatchObject({ w: 16, l: 20 });
    expect(cell.other!.record).toMatchObject({ w: 20, l: 16 });
    expect(cell.disagree).toBe(false);
  });
  it('a cell with a record on one side only is not a disagreement', async () => {
    const grid = matchupGrid(await loadGuides()).flat();
    for (const c of grid)
      if (c.disagree) {
        expect(c.entry?.record).toBeTruthy();
        expect(c.other?.record).toBeTruthy();
      }
  });
  it('Play this matchup loads both first lists through Setup’s presets', () => {
    expect(matchupHref('OP17-039', 'OP17-058')).toBe(
      '/play?p1=OP17-039-rocks%231&p2=OP17-058-kaido%231',
    );
    const q = new URLSearchParams(matchupHref('OP17-039', 'OP09-062').split('?')[1]);
    expect(DECKS.some((d) => d.id === q.get('p2'))).toBe(true);
  });
});

describe('gridMove: arrows across wrapped tiles', () => {
  // Three rows of four, then one more on a fourth row.
  const pos = Array.from({ length: 13 }, (_, i) => ({
    x: (i % 4) * 100,
    y: Math.floor(i / 4) * 80,
  }));
  it('left and right step through grid order, stopping at the ends', () => {
    expect(gridMove(pos, 3, 'ArrowRight')).toBe(4);
    expect(gridMove(pos, 4, 'ArrowLeft')).toBe(3);
    expect(gridMove(pos, 0, 'ArrowLeft')).toBe(0);
    expect(gridMove(pos, 12, 'ArrowRight')).toBe(12);
    expect(gridMove(pos, 5, 'Home')).toBe(0);
    expect(gridMove(pos, 5, 'End')).toBe(12);
  });
  it('up and down go to the nearest tile in the next row', () => {
    expect(gridMove(pos, 5, 'ArrowDown')).toBe(9);
    expect(gridMove(pos, 9, 'ArrowUp')).toBe(5);
    expect(gridMove(pos, 10, 'ArrowDown')).toBe(12); // the short last row
    expect(gridMove(pos, 2, 'ArrowUp')).toBe(2);
    expect(gridMove(pos, 12, 'ArrowDown')).toBe(12);
  });
});
