/** OP12-027 Koushirou. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, passBlock, pick, PLAIN_BLUE, V } from './helpers.ts';
import {
  koBy,
  OTHER_LEADER,
  plantOpponentEffect,
  SLASH3,
  SLASH4,
  SLASH5,
  SLASH6,
  STRIKE2,
  theirs,
} from './helpers-lfa.ts';

const ID = 'OP12-027';
type G = ReturnType<typeof theirs>;
const koOne = { ko: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } };
const chars = (g: G) => g.zone('p1', 'characters').map((c) => c.card);
const koushirou = (g: G) => g.find('p1', 'characters', ID);

/** p2's turn: p1 has Koushirou and `others`; p2's effect K.O.s `target`. Stops at the first decision. */
const hit = (others: string[], target: string, koushirouRested = false) => {
  const g = theirs(
    OTHER_LEADER,
    { characters: [{ card: ID, rested: koushirouRested }, ...others] },
    { leader: PLAIN_BLUE },
  );
  plantOpponentEffect(g, koOne);
  if (dec(g)?.kind === 'choose') pick(g, [g.find('p1', 'characters', target)]);
  return g;
};

describe('OP12-027 Koushirou', () => {
  it("you may rest him instead of an opponent's effect K.O.ing your other <Slash> Character with cost 5 or less", () => {
    const g = hit([SLASH5, V.c3], SLASH5);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(chars(g)).toContain(SLASH5);
    expect(g.card(koushirou(g)).rested).toBe(true);
  });

  it('declining lets the K.O. happen and keeps him active', () => {
    const g = hit([SLASH5, V.c3], SLASH5);
    decline(g);
    expect(chars(g)).not.toContain(SLASH5);
    expect(g.card(koushirou(g)).rested).toBe(false);
  });

  it('boundaries: cost 5 is covered, cost 6 is not', () => {
    const six = hit([SLASH6, V.c3], SLASH6);
    expectDecision(six, 'main', 'p2');
    expect(chars(six)).not.toContain(SLASH6);
    const four = hit([SLASH4, V.c3], SLASH4);
    expectDecision(four, 'optional', 'p1');
  });

  it('must not cover a Character without the <Slash> attribute', () => {
    const g = hit([STRIKE2, V.c3], STRIKE2);
    expectDecision(g, 'main', 'p2');
    expect(chars(g)).not.toContain(STRIKE2);
  });

  it('"other than this Character": he does not protect himself', () => {
    const g = hit([SLASH3], ID);
    expectDecision(g, 'main', 'p2');
    expect(chars(g)).toEqual([SLASH3]);
  });

  it('is not offered while he is rested (resting him is the cost)', () => {
    const g = hit([SLASH5, V.c3], SLASH5, true);
    expect(chars(g)).not.toContain(SLASH5);
    expect(dec(g)?.kind).not.toBe('optional');
  });

  it("must not cover your own effect's K.O. or a battle K.O.", () => {
    const own = theirs(OTHER_LEADER, { characters: [ID, SLASH5] });
    koBy(own, 'p1', SLASH5, 'p1');
    expect(chars(own)).toEqual([ID]);
    const g = theirs(
      OTHER_LEADER,
      { characters: [ID, { card: SLASH5, rested: true }] },
      { characters: [V.c7] },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', SLASH5),
    });
    passBlock(g);
    g.act({ type: 'endCounter' });
    expect(chars(g)).toEqual([ID]);
  });

  it('has [Blocker]', () => {
    const g = theirs(OTHER_LEADER, { characters: [ID] });
    expect(g.card(koushirou(g)).keywords).toContain('Blocker');
  });
});
