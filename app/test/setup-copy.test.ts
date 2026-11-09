/**
 * The Setup automation copy (review M4a-15): per seat, counted by different card numbers, never
 * claiming more than the scripts do. A planted deck makes the counts exact.
 */
import { describe, expect, it } from 'vitest';
import { SCRIPTED_IDS } from '@optcg/cards';
import { automationLine, scriptedCount, type DeckOption } from '../src/play/setup/decks.ts';

const scripted = [...SCRIPTED_IDS];
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

describe('automationLine (M4a-15)', () => {
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
    expect(scriptedCount(d)).toEqual({ scripted: 2, total: 3 });
    expect(automationLine(d, 'Your deck')).toContain('2 of 3 different cards are scripted');
  });

  it('names the seat, and says whose deck in hotseat', () => {
    const d = deck(scripted[0]!, [scripted[1]!]);
    expect(automationLine(d, 'Ann’s deck')).toMatch(/^Ann’s deck \(Planted\): /);
    expect(automationLine(d, 'Bo’s deck')).toMatch(/^Bo’s deck \(Planted\): /);
  });

  it('says plainly when nothing is scripted and when everything is', () => {
    expect(automationLine(deck('ZZ99-001', ['ZZ99-002']), 'Your deck')).toContain(
      'no card effects are scripted yet',
    );
    expect(automationLine(deck(scripted[0]!, [scripted[1]!]), 'Your deck')).toContain(
      'all 2 different cards are scripted',
    );
  });

  it('never claims every effect is automated, and says what unscripted cards still do', () => {
    for (const d of [
      deck(scripted[0]!, [scripted[1]!]),
      deck(scripted[0]!, ['ZZ99-001']),
      deck('ZZ99-001', ['ZZ99-002']),
    ]) {
      const line = automationLine(d, 'Your deck');
      expect(line).not.toMatch(/automated|every card/i);
    }
    expect(automationLine(deck(scripted[0]!, ['ZZ99-001']), 'Your deck')).toContain(
      'play for their power, cost, Counter and verified keywords only',
    );
  });
});
