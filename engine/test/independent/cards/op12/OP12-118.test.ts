/**
 * OP12-118 Jewelry Bonney (Character, Green, cost 5, 6000, Counter +1000, {Bonney Pirates}/{Supernovas}).
 *
 * Card text: "[Blocker] [On Play] If you have 8 or more rested cards, draw 2 cards and trash 1 card from
 * your hand. Then, set up to 1 of your DON!! cards as active."
 *
 * Rules: "rested cards" are my own rested Leader, Characters, Stage and DON!! cards (CR 3-1-2: the field),
 * counted when the [On Play] resolves, so the 5 DON!! rested to play Bonney count; M4b-5 (a "Then" after
 * a failed "If" does not resolve); setting DON!! active asks a count (most first; engine convention).
 */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import {
  at,
  atMain,
  attack,
  blockers,
  decision,
  deck,
  hand,
  kind,
  LDR,
  mine,
  need,
  offeredIds,
  optionChoicesOf,
  pickCards,
  playRaw,
  SCN,
  theirs,
  topDeck,
  trash,
} from './kit-op12c.ts';

const ID = 'OP12-118';

const restedChars = (n: number) =>
  Array.from({ length: n }, () => ({ card: SCN.c1, rested: true }));

function played(opts: {
  rested?: number;
  active?: number;
  restedDon?: number;
  oppRested?: number;
  handExtra?: string[];
}) {
  const g = mine(
    LDR.neutral,
    {
      hand: [ID, ...(opts.handExtra ?? [SCN.c2])],
      characters: restedChars(opts.rested ?? 0) as never,
      costArea: { active: opts.active ?? 10, rested: opts.restedDon ?? 0 },
      deck: topDeck([SCN.c6, SCN.c7]),
    },
    { characters: restedChars(opts.oppRested ?? 0) as never },
  );
  playRaw(g, ID);
  return g;
}

const donNow = (g: ReturnType<typeof played>) => queries.don(g.state, 'p1');

describe('OP12-118 Jewelry Bonney: [On Play] with 8 or more rested cards, draw 2 and trash 1, then set 1 DON!! active', () => {
  it('boundary: 8 rested cards (5 DON!! rested to pay + 3 rested Characters): draw 2, then trash 1 of the hand', () => {
    const g = played({ rested: 3 });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c2, SCN.c6, SCN.c7].sort());
    pickCards(g, [SCN.c2]);
    expect(trash(g)).toEqual([SCN.c2]);
    expect(hand(g)).toEqual([SCN.c6, SCN.c7].sort());
    expect(deck(g)).toHaveLength(10);
  });

  it('boundary: 7 rested cards: nothing is drawn, nothing is trashed', () => {
    const g = played({ rested: 2 });
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCN.c2]);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(12);
  });

  it('"Then" does not resolve after a failed "If": with 7 rested cards no DON!! is set active either', () => {
    const g = played({ rested: 2 });
    expect(donNow(g)).toMatchObject({ active: 5, rested: 5 });
  });

  it('rested DON!! count: 5 active + 3 rested DON!! before, 8 rested after paying (no rested Characters)', () => {
    const g = played({ active: 5, restedDon: 3 });
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c2]);
    expect(hand(g)).toHaveLength(2);
  });

  it("the opponent's rested cards do not count", () => {
    const g = played({ rested: 2, oppRested: 4 });
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCN.c2]);
  });

  it('after the trash, up to 1 of my DON!! is set active (one rested DON!! becomes active)', () => {
    const g = played({ rested: 3 });
    pickCards(g, [SCN.c2]);
    // "set up to 1 DON!! as active" asks a count (most first) or is applied; take the most when asked.
    if (kind(g) === 'choose') {
      const options = optionChoicesOf(g);
      expect(options.length).toBeGreaterThan(0);
      g.act({ type: 'pick', choice: { option: options[0]! } });
    }
    expect(atMain(g)).toBe(true);
    expect(donNow(g)).toMatchObject({ active: 6, rested: 4 });
  });

  it('"set up to 1": it is never more than one DON!!', () => {
    const g = played({ rested: 3 });
    pickCards(g, [SCN.c2]);
    if (kind(g) === 'choose') {
      const d = decision(g)!;
      expect((d.options ?? []).map((o) => o.label).join(' ')).not.toMatch(/\b[2-9]\b/);
    }
  });

  it('the trash is exactly 1 card (the drawn cards may be the ones trashed)', () => {
    const g = played({ rested: 3 });
    pickCards(g, [SCN.c7]);
    expect(trash(g)).toEqual([SCN.c7]);
    expect(hand(g)).toEqual([SCN.c2, SCN.c6].sort());
  });
});

describe('OP12-118 Jewelry Bonney: [Blocker]', () => {
  it('has [Blocker] and blocks an attack on my Leader', () => {
    const g = theirs(LDR.neutral, { characters: [ID] }, { characters: [SCN.c3] });
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
  });
});
