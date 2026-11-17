/** OP17-093 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { expectBigCondition, GIANT } from './helpers-sabo.ts';

describe('OP17-093 Monkey.D.Luffy', () => {
  it('gains [Rush] only while a Character with a cost of 12 or more exists', () => {
    expectBigCondition('OP17-093', (g, id) => g.card(id).keywords.includes('Rush'), false, true);
  });

  it('with the granted [Rush] it can attack the turn it is played', () => {
    const mk = (chars: string[]) =>
      game(
        {
          leader: PLAIN_PURPLE,
          hand: ['OP17-093'],
          characters: chars,
          deck: [BLUE, BLUE],
          costArea: { active: 8, rested: 0 },
        },
        { leader: PLAIN_BLUE },
      );
    const on = mk([GIANT]);
    play(on, 'OP17-093');
    // [On Play]: no Character with cost 2 or less in the trash: draws 1, then nothing to play.
    if (on.legal().some((a) => a.type === 'done')) on.act({ type: 'done' });
    const luffy = on.find('p1', 'characters', 'OP17-093');
    expect(on.legal().some((a) => a.type === 'attack' && a.attacker === luffy)).toBe(true);
    const off = mk([]);
    play(off, 'OP17-093');
    if (off.legal().some((a) => a.type === 'done')) off.act({ type: 'done' });
    expect(
      off
        .legal()
        .some(
          (a) => a.type === 'attack' && a.attacker === off.find('p1', 'characters', 'OP17-093'),
        ),
    ).toBe(false);
  });

  const setup = (trash: string[]) =>
    game(
      {
        leader: PLAIN_PURPLE,
        hand: ['OP17-093'],
        trash,
        deck: [BLUE, BLUE],
        costArea: { active: 8, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: draw 1 and play up to 1 Character with a cost of 2 or less from your trash', () => {
    const g = setup([V.c3, V.c2, V.c1, 'OP17-096']);
    play(g, 'OP17-093');
    expect(hand(g, 'p1')).toEqual([BLUE]);
    // Only the cost 1 and 2 Characters are candidates (not cost 3, not the Event).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'trash', V.c2)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(V.c2);
    expect(g.zone('p1', 'trash').map((c) => c.card)).not.toContain(V.c2);
  });

  it('[On Play]: "up to 1" may be declined after the draw', () => {
    const g = setup([V.c2]);
    play(g, 'OP17-093');
    none(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['OP17-093']);
  });

  it('[On Play]: with nothing to play it still draws', () => {
    const g = setup([V.c3]);
    play(g, 'OP17-093');
    if (g.legal().some((a) => a.type === 'done')) g.act({ type: 'done' });
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });
});
