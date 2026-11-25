/**
 * ST21-007 Sentomaru (Red Character, cost 2, 2000, Counter +1000, {Navy}/{Egghead}, [Blocker]).
 * Its whole text is [Blocker]: after the opponent declares an attack, it may be rested to become the
 * new target of the attack.
 * Rules: only an ACTIVE Blocker can be declared; the attack then hits the Blocker; a Character
 * that loses the Damage Step is K.O.'d; the printed Counter +1000 can be used from hand.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  BLUE,
  decision,
  hand,
  inst,
  kind,
  LD,
  many,
  noDefence,
  need,
  passBlock,
  SC,
  theirs,
  trash,
  canCounterWith,
  useCounter,
} from './kit-st1821a.ts';

const ID = 'ST21-007';

function pos(opts: { rested?: boolean; hand?: string[]; attacker?: string } = {}) {
  return theirs(
    LD.luffy,
    {
      characters: [{ card: ID, rested: opts.rested ?? false }],
      life: many(BLUE, 4),
      hand: opts.hand ?? [],
    },
    { characters: [opts.attacker ?? SC.c3] },
  );
}

describe('ST21-007 Sentomaru: [Blocker]', () => {
  it('it carries the Blocker keyword', () => {
    const g = pos();
    expect(g.card(inst(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('when my Leader is attacked, declaring it as the blocker is legal', () => {
    const g = pos();
    attack(g, inst(g, 'p2', 'characters', SC.c3), g.leader('p1'));
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([inst(g, 'p1', 'characters', ID)]);
  });

  it('blocking rests it and the attack no longer reaches the Leader: no Life is lost', () => {
    const g = pos();
    const s = inst(g, 'p1', 'characters', ID);
    attack(g, inst(g, 'p2', 'characters', SC.c3), g.leader('p1'));
    act(g, { type: 'block', blocker: s });
    expect(g.card(s).rested).toBe(true);
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });

  it('the blocker takes the battle: 2000 power loses to a 5000-power attacker and is K.O.d', () => {
    const g = pos();
    attack(g, inst(g, 'p2', 'characters', SC.c3), g.leader('p1'));
    act(g, { type: 'block', blocker: inst(g, 'p1', 'characters', ID) });
    noDefence(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g)).toEqual([ID]);
  });

  it('it can also be declared when one of my rested Characters is the attack target', () => {
    const g = theirs(
      LD.luffy,
      { characters: [ID, { card: SC.c4, rested: true }] },
      { characters: [SC.c3] },
    );
    attack(g, inst(g, 'p2', 'characters', SC.c3), inst(g, 'p1', 'characters', SC.c4));
    expect(blockers(g)).toEqual([inst(g, 'p1', 'characters', ID)]);
  });

  it('a rested Sentomaru cannot block', () => {
    const g = pos({ rested: true });
    attack(g, inst(g, 'p2', 'characters', SC.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('not blocking: the attack hits the Leader and Sentomaru stays active', () => {
    const g = pos();
    attack(g, inst(g, 'p2', 'characters', SC.c3), g.leader('p1'));
    passBlock(g);
    noDefence(g);
    expect(g.life('p1')).toBe(3);
    expect(g.card(inst(g, 'p1', 'characters', ID)).rested).toBe(false);
  });

  it('Counter +1000 from hand: 5000 + 1000 beats a 5000-power attacker, so no Life is lost', () => {
    // Sentomaru in hand is the Counter; none is on the field.
    const h = theirs(
      LD.luffy,
      { characters: [], life: many(BLUE, 4), hand: [ID] },
      { characters: [SC.c3] },
    );
    attack(h, inst(h, 'p2', 'characters', SC.c3), h.leader('p1'));
    passBlock(h);
    need(h, 'counter', 'p1');
    const card = inst(h, 'p1', 'hand', ID);
    expect(canCounterWith(h, card)).toBe(true);
    useCounter(h, card, h.leader('p1'));
    expect(decision(h)?.kind).toBe('counter');
    act(h, { type: 'endCounter' });
    expect(h.life('p1')).toBe(4);
    expect(hand(h)).toEqual([]);
  });

  it('Counter step: without the counter the same attack takes a Life card', () => {
    const h = theirs(
      LD.luffy,
      { characters: [], life: many(BLUE, 4), hand: [ID] },
      { characters: [SC.c3] },
    );
    attack(h, inst(h, 'p2', 'characters', SC.c3), h.leader('p1'));
    noDefence(h);
    expect(h.life('p1')).toBe(3);
  });
});
