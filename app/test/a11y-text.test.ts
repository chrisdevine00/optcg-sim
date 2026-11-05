import { describe, expect, it } from 'vitest';
import { confirmSentence } from '../src/play/rail/Decision.tsx';
import { statusSummary, turnSummary, type LogLine } from '../src/play/game/text.ts';

const line = (
  text: string,
  actor: 'p1' | 'p2' = 'p2',
  kind: 'move' | 'turn' = 'move',
): LogLine => ({
  kind,
  actor,
  text,
  cards: [],
  auto: false,
  index: 0,
});

describe('the AI end-of-turn summary (M3 pass F5)', () => {
  it('says what was played, how often it attacked, and what you lost', () => {
    const s = turnSummary(
      [
        line('Turn 4 · Opp', 'p2', 'turn'),
        line('Play Black Maria · 3 DON!! · Play Yamato'),
        line('King attacks your Leader'),
        line('Hit · 7000 vs 5000 · your Life 3 → 2 · Life card trashed'),
        line('Kaido attacks your Leader'),
        line('Hit · 5000 vs 5000 · your Life 2 → 1'),
        line('K.O. · Your Drake'),
        line('End of turn'),
      ],
      4,
      'Opponent’s',
    );
    expect(s).toBe(
      'Opponent’s turn 4: played Black Maria and Yamato; 2 attacks; you took 2 damage, Life 3 to 1; your Drake was K.O.’d.',
    );
  });

  it('says so when nothing happened', () => {
    expect(turnSummary([line('End of turn')], 6, 'Kaido’s')).toBe(
      'Kaido’s turn 6: played no cards; 0 attacks; you took no damage.',
    );
  });
});

describe('the attack confirm sentence (F4)', () => {
  it('does not claim a verdict while an attack effect is pending', () => {
    const t = confirmSentence(
      5000,
      5000,
      'Kaido',
      'their Leader',
      true,
      'Result depends on [When Attacking]',
    );
    expect(t).toContain('Result depends on [When Attacking]');
    expect(t).not.toMatch(/hits|fails/);
  });
  it('gives the maths otherwise', () => {
    expect(confirmSentence(5000, 5000, 'Kaido', 'their Leader', false, '')).toMatch(
      /Kaido 5000 against their Leader 5000: hits unless they counter/,
    );
  });
});

describe('status summary plurals (F13)', () => {
  it('says "1 card in hand"', () => {
    const z = (n: number) => ({ life: [], hand: Array(n).fill(0), characters: [] });
    const view = {
      player: 'p1',
      turn: { number: 3 },
      zones: { p1: z(1), p2: z(2) },
      don: { p1: { active: 1, rested: 0, given: 0 }, p2: { active: 0, rested: 0, given: 0 } },
    } as never;
    const t = statusSummary(
      view,
      { me: 'p1', player: { p1: 'You', p2: 'Kaido' }, hotseat: false },
      'your main phase',
    );
    expect(t).toContain('1 card in hand');
    expect(t).toContain('2 cards in hand');
  });
});
