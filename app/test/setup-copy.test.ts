/**
 * The Setup automation copy (review M4a-15, M4b): per seat, counted by different card numbers, never
 * claiming more than the scripts do. Cards with no effect text or only keywords need no script and
 * count as fully playing, but are never called scripted. A planted deck makes the counts exact.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCRIPTED_IDS, automation, type Card, type SetFile } from '@optcg/cards';
import { automationLine, deckCoverage, type DeckOption } from '../src/play/setup/decks.ts';

const load = (code: string) =>
  (
    JSON.parse(
      readFileSync(new URL(`../../cards/data/sets/${code}.json`, import.meta.url), 'utf8'),
    ) as SetFile
  ).cards;
const real = [...load('OP-17'), ...load('OP-08'), ...load('OP-12')];
const byId = new Map(real.map((c) => [c.id, c]));
const scripted = [...SCRIPTED_IDS].filter((id) => byId.has(id));
// A card nobody scripted and with effect text: it does not play fully.
const base = real.find((c) => !SCRIPTED_IDS.has(c.id) && automation(c) === 'not-automated')!;
const unscripted = { ...base, id: 'ZZ99-001' } as Card;
const unscripted2 = { ...base, id: 'ZZ99-002' } as Card;
// A card with no effect text at all.
const vanilla = {
  ...base,
  id: 'ZZ99-003',
  effectText: '',
  triggerText: null,
  keywords: [],
} as Card;
const cards = new Map<string, Card>([
  ...byId,
  [unscripted.id, unscripted],
  [unscripted2.id, unscripted2],
  [vanilla.id, vanilla],
]);

const deck = (leader: string, main: string[]): DeckOption => ({
  id: 'x#1',
  archetype: 'x',
  leader,
  name: 'Planted',
  colors: [],
  source: '',
  url: '',
  spec: { leader, main },
});
const line = (d: DeckOption) => automationLine(d, 'Your deck', cards);

describe('automationLine (M4a-15, M4b)', () => {
  it('counts different card numbers, not copies', () => {
    // Four copies of one scripted card and three of one unscripted card, plus a scripted Leader.
    const d = deck(scripted[0]!, [
      scripted[1]!,
      scripted[1]!,
      scripted[1]!,
      scripted[1]!,
      'ZZ99-001',
      'ZZ99-001',
      'ZZ99-001',
    ]);
    expect(deckCoverage(d, cards)).toEqual({
      total: 3,
      scripted: 2,
      noScriptNeeded: 0,
      notAutomated: 1,
      fully: 2,
    });
    expect(line(d)).toContain('2 of 3 different cards play fully');
  });

  it('counts a card with no effect text as fully playing, not as scripted', () => {
    const d = deck(scripted[0]!, [scripted[1]!, 'ZZ99-003', 'ZZ99-001']);
    expect(deckCoverage(d, cards)).toMatchObject({ scripted: 2, noScriptNeeded: 1, fully: 3 });
    expect(line(d)).toContain(
      '3 of 4 different cards play fully (2 with scripted effects, 1 with no effect to script)',
    );
    expect(line(d)).toContain('the other 1 play for their power');
  });

  it('says all play fully when the rest need no script, and never calls them scripted', () => {
    const d = deck(scripted[0]!, [scripted[1]!, 'ZZ99-003']);
    expect(line(d)).toContain('all 3 different cards play fully');
    expect(line(d)).not.toContain('are scripted');
  });

  it('counts a real vanilla card from the data (OP08-099) as fully playing', () => {
    expect(automation(byId.get('OP08-099')!, SCRIPTED_IDS)).toBe('vanilla');
    expect(deckCoverage(deck(scripted[0]!, ['OP08-099']), cards)).toMatchObject({
      noScriptNeeded: 1,
      notAutomated: 0,
    });
  });

  it('names the seat, and says whose deck in hotseat', () => {
    const d = deck(scripted[0]!, [scripted[1]!]);
    expect(automationLine(d, 'Ann’s deck', cards)).toMatch(/^Ann’s deck \(Planted\): /);
    expect(automationLine(d, 'Bo’s deck', cards)).toMatch(/^Bo’s deck \(Planted\): /);
  });

  it('says plainly when nothing plays fully and when everything is scripted', () => {
    expect(line(deck('ZZ99-001', ['ZZ99-002']))).toContain('no card effects are scripted yet');
    expect(line(deck(scripted[0]!, [scripted[1]!]))).toContain(
      'all 2 different cards are scripted',
    );
  });

  it('treats a card the data does not know as not automated', () => {
    expect(deckCoverage(deck(scripted[0]!, ['ZZ00-404']), cards)).toMatchObject({
      total: 2,
      notAutomated: 1,
    });
  });

  it('never claims every effect is automated, and says what other cards still do', () => {
    for (const d of [
      deck(scripted[0]!, [scripted[1]!]),
      deck(scripted[0]!, ['ZZ99-001']),
      deck(scripted[0]!, ['ZZ99-003']),
      deck('ZZ99-001', ['ZZ99-002']),
    ]) {
      expect(line(d)).not.toMatch(/automated|every card/i);
    }
    expect(line(deck(scripted[0]!, ['ZZ99-001']))).toContain(
      'play for their power, cost, Counter and verified keywords only',
    );
  });
});
