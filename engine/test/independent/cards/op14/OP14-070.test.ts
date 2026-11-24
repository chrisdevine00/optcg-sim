/**
 * OP14-070 Buffalo (Character, Purple, cost 2, 1000, Counter +1000, {Donquixote Pirates}, [Blocker]).
 *
 * Card text: "When this Character becomes rested by your opponent's Character's effect, you may return
 * 1 DON!! card from your field to your DON!! deck. If you do, set this Character as active.
 * [Blocker]"
 *
 * Rules: CR 10-1-4 ([Blocker]; blocking rests the Blocker), RL-23 (DON!! on the field means the cost
 * area and DON!! given to cards), CR 8-3-1-4 ("you may" cost: if it is not paid, "if you do" does not
 * happen). Whether a rest paid as a cost or by attacking counts is M6b-Q30/Q41 (open): only the cases
 * every reading shares are asserted (the Blocker's own block never counts; a Character effect of the
 * opponent does).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  backToMain,
  blockers,
  CAMIE,
  donOf14,
  kind,
  LD14,
  need,
  no,
  onField,
  payDon,
  pickInst,
  playRaw,
  SC14,
  theirs,
  unusable,
  yes,
  chr,
} from './kit-op14c.ts';

const ID = 'OP14-070';

/** p2 plays Camie (cost 6 or less) and rests Buffalo; stops after the target is chosen. */
function camieRestsBuffalo(o: { rested?: boolean; active?: number; don?: number } = {}) {
  const g = theirs(
    LD14.dp,
    {
      characters: [{ card: ID, rested: o.rested ?? false, don: o.don ?? 0 }],
      costArea: { active: o.active ?? 3, rested: 0 },
    },
    { hand: [CAMIE] },
  );
  playRaw(g, CAMIE);
  need(g, 'choose', 'p2');
  pickInst(g, [at(g, 'p1', 'characters', ID)]);
  return g;
}

describe('OP14-070 Buffalo: set active after an opposing Character effect rests it', () => {
  it('has [Blocker]', () => {
    const g = theirs(LD14.dp, { characters: [ID] }, {});
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('rested by their Character’s effect, I am asked; paying 1 DON!! returns it to the DON!! deck and sets Buffalo active', () => {
    const g = camieRestsBuffalo();
    need(g, 'optional', 'p1');
    const before = donOf14(g);
    yes(g, 'p1');
    payDon(g, 1);
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(false);
    expect(onField(g)).toBe(2);
    expect(donOf14(g).deck).toBe(before.deck + 1);
    backToMain(g, 'p2');
  });

  it('"you may": declining leaves Buffalo rested and keeps my DON!!', () => {
    const g = camieRestsBuffalo();
    no(g, 'p1');
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
    expect(onField(g)).toBe(3);
    backToMain(g, 'p2');
  });

  it('with no DON!! on my field the cost cannot be paid: Buffalo stays rested', () => {
    const g = camieRestsBuffalo({ active: 0 });
    // The engine may ask "do this?" (the DON!! return is public, not a hidden cost); either way no
    // DON!! can be returned, so Buffalo is not set active.
    if (kind(g) === 'optional') {
      if (g.legal().some((a) => a.type === 'optional' && a.accept)) yes(g, 'p1');
      else unusable(g, 'p1');
    }
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
    backToMain(g, 'p2');
  });

  it('a DON!! given to a card counts as a DON!! on my field: it may pay the cost', () => {
    const g = camieRestsBuffalo({ active: 0, don: 1 });
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payDon(g, 1, 'given', at(g, 'p1', 'characters', ID));
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(false);
    expect(onField(g)).toBe(0);
  });

  it('"If you do": the set-active only follows a paid cost (DON!! returned = Buffalo active, none = rested)', () => {
    const paid = camieRestsBuffalo();
    yes(paid, 'p1');
    payDon(paid, 1);
    const unpaid = camieRestsBuffalo();
    no(unpaid, 'p1');
    expect(paid.card(at(paid, 'p1', 'characters', ID)).rested).toBe(false);
    expect(unpaid.card(at(unpaid, 'p1', 'characters', ID)).rested).toBe(true);
  });

  it('it can block again after being set active (it is a fresh [Blocker] for the attack)', () => {
    const g = camieRestsBuffalo();
    yes(g, 'p1');
    payDon(g, 1);
    backToMain(g, 'p2');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
  });

  it('must not trigger on its own block: blocking rests it and nothing is offered', () => {
    const g = theirs(
      LD14.dp,
      { characters: [ID], costArea: { active: 3, rested: 0 } },
      { characters: [SC14.c3] },
    );
    attack(g, chr(g, 'p2', SC14.c3), g.leader('p1'));
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    expect(kind(g)).not.toBe('optional');
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
    expect(onField(g)).toBe(3);
  });

  it('must not trigger when it is already rested: the Character effect rests nothing new', () => {
    const g = camieRestsBuffalo({ rested: true });
    expect(kind(g)).not.toBe('optional');
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
    expect(onField(g)).toBe(3);
  });
});
