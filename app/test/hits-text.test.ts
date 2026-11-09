import { describe, expect, it } from 'vitest';
import { hitsText } from '../src/play/coach/badge.ts';
import { spokenArrows } from '../src/play/arrows.tsx';
import { confirmSentence } from '../src/play/rail/Decision.tsx';

describe('L-SR13 and L-SR7 wording', () => {
  it('says "1 hit", not "1 hits"', () => {
    expect(hitsText(1)).toBe('1 hit');
    expect(hitsText(2)).toBe('2 hits');
  });
  it('speaks an arrow as "to"', () => {
    expect(spokenArrows('their Life 1 → 0')).toBe('their Life 1 to 0');
  });
});

describe('the attack confirm description (L-SR1 round 2)', () => {
  it('carries the gap, what they need and the keys', () => {
    const t = confirmSentence(7000, 5000, 'Kaido', 'their Leader', false, '', {
      need: 3000,
      hand: 1,
    });
    expect(t).toContain('Gap: ahead by 2000.');
    expect(t).toContain('They need plus 3000 to survive, 1 card in hand.');
    expect(t).toContain('Enter to attack');
  });
});
