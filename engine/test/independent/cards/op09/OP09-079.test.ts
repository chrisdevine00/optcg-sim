/**
 * OP09-079 Gum-Gum Jump Rope (Event, Purple, cost 2, {Straw Hat Crew}/{The Four Emperors}).
 *
 * Card text: "[Main] DON!! -2 (You may return the specified number of DON!! cards from your field to
 * your DON!! deck.): Rest up to 1 of your opponent's Characters with a cost of 5 or less. Then, draw 1
 * card.
 * [Trigger] Add up to 1 DON!! card from your DON!! deck and set it as active."
 *
 * Rules: CR 8-3 (an optional DON!! -N cost is offered; declining it means the effect does not
 * happen), CR 8-4-4 ("up to"), "add up to N DON!!" asks a count (most first).
 */
import { describe, expect, it } from 'vitest';
import {
  accept,
  activateTrigger,
  asksDonCount,
  atMain,
  BLUE,
  C9,
  chars,
  choices,
  decline,
  deck,
  don,
  donCountOptions,
  hand,
  hitLeader,
  kind,
  L9,
  mine,
  need,
  none,
  offeredIds,
  payDon,
  pickInst,
  playCard,
  reachablePickSets,
  takeDon,
  theirs,
  trash,
} from './kit-op09d.ts';

const ID = 'OP09-079';

function start(o: { opp?: string[]; active?: number; rested?: number } = {}) {
  const g = mine(
    L9.neutral,
    {
      hand: [ID],
      costArea: { active: o.active ?? 10, rested: o.rested ?? 0 },
      deck: [C9.c7, C9.c6, ...Array(10).fill(BLUE)],
    },
    { characters: o.opp ?? [C9.c4, C9.c5, C9.c6] },
  );
  playCard(g, ID);
  return g;
}

const fieldDon = (g: ReturnType<typeof start>) => {
  const d = don(g, 'p1');
  return d.active + d.rested + d.given;
};

describe('OP09-079 Gum-Gum Jump Rope: [Main] DON!! -2: rest up to 1 opposing Character with cost 5 or less, then draw 1', () => {
  it('printed effect: the DON!! -2 is offered; paying it returns 2 DON!! to the DON!! deck, rests the chosen Character and draws 1', () => {
    const g = start();
    need(g, 'optional', 'p1');
    expect(fieldDon(g)).toBe(10);
    accept(g);
    payDon(g, 2, 'costRested');
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', C9.c5)]);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.find('p2', 'characters', C9.c5)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', C9.c4)).rested).toBe(false);
    expect(hand(g)).toEqual([C9.c7]);
    expect(fieldDon(g)).toBe(8);
    expect(don(g, 'p1').deck).toBe(2);
    expect(trash(g)).toEqual([ID]);
  });

  it('cost boundary: cost 5 is offered, cost 6 is not', () => {
    const g = start();
    accept(g);
    payDon(g, 2, 'costRested');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.c4, C9.c5].sort());
  });

  it('declining the DON!! -2: no Character is rested, nothing is drawn, no DON!! is returned; the Event is spent', () => {
    const g = start();
    need(g, 'optional', 'p1');
    decline(g);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.find('p2', 'characters', C9.c5)).rested).toBe(false);
    expect(hand(g)).toEqual([]);
    expect(fieldDon(g)).toBe(10);
    expect(trash(g)).toEqual([ID]);
  });

  it('"up to 1": choosing nothing rests nothing; the DON!! cost has been paid regardless', () => {
    const g = start();
    accept(g);
    payDon(g, 2, 'costRested');
    need(g, 'choose', 'p1');
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
    none(g);
    expect(chars(g, 'p2').every((c) => !g.card(g.find('p2', 'characters', c)).rested)).toBe(true);
    expect(fieldDon(g)).toBe(8);
  });

  it("only the opponent's Characters are candidates (never the Leader, never mine)", () => {
    const g = mine(
      L9.neutral,
      { hand: [ID], characters: [C9.c2], costArea: { active: 10, rested: 0 } },
      { characters: [C9.c3] },
    );
    playCard(g, ID);
    accept(g);
    payDon(g, 2, 'costRested');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.c3]);
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('only one DON!! -2 is paid: the field loses exactly 2 DON!!, not more', () => {
    const g = start();
    accept(g);
    payDon(g, 2, 'costRested');
    pickInst(g, [g.find('p2', 'characters', C9.c4)]);
    expect(fieldDon(g)).toBe(8);
    expect(don(g, 'p1').deck).toBe(2);
  });

  it('with no opposing Character the DON!! cost can still be paid and the effect ends cleanly', () => {
    const g = start({ opp: [] });
    accept(g);
    payDon(g, 2, 'costRested');
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(fieldDon(g)).toBe(8);
  });

  it('it costs 2 DON!!: with 1 active DON!! it cannot be played', () => {
    const g = mine(
      L9.neutral,
      { hand: [ID], costArea: { active: 1, rested: 0 } },
      { characters: [C9.c4] },
    );
    expect(
      g.legal().some((a) => a.type === 'playCard' && a.card === g.find('p1', 'hand', ID)),
    ).toBe(false);
    expect(deck(g)).toHaveLength(15);
  });
});

describe('OP09-079 [Trigger] add up to 1 DON!! card from the DON!! deck and set it as active', () => {
  function hit(o: { donDeck?: number; active?: number } = {}) {
    const g = theirs(L9.neutral, {
      life: [ID, BLUE, BLUE, BLUE],
      costArea: { active: o.active ?? 2, rested: 0 },
      donDeck: o.donDeck ?? 8,
    });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('the count is asked (1 or 0, most first); taking 1 adds an ACTIVE DON!! from the DON!! deck', () => {
    const g = hit();
    activateTrigger(g);
    expect(asksDonCount(g, 'p1')).toBe(true);
    expect(donCountOptions(g, 'p1')).toEqual(['1', '0']);
    takeDon(g, 1);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 0, deck: 7 });
    expect(trash(g)).toEqual([ID]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('"up to 1": taking 0 adds nothing', () => {
    const g = hit();
    activateTrigger(g);
    takeDon(g, 0);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 0, deck: 8 });
  });

  it('with an empty DON!! deck there is nothing to add', () => {
    const g = hit({ donDeck: 0, active: 10 });
    activateTrigger(g);
    if (asksDonCount(g)) takeDon(g, 0);
    expect(don(g, 'p1')).toMatchObject({ active: 10, deck: 0 });
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('declining the [Trigger] puts the Event into my hand and adds no DON!!', () => {
    const g = hit();
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ID]);
    expect(don(g, 'p1')).toMatchObject({ active: 2, deck: 8 });
  });
});
