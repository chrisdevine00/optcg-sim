/**
 * OP11-025 Ishilly (Character, Green, cost 2, 0 power, Counter +1000, {Merfolk}/{Fish-Man Island}).
 *
 * Card text: "[On Your Opponent's Attack] [Once Per Turn] You may rest 1 of your DON!! cards and this
 * Character: Up to 1 of your Leader or Character cards gains +1000 power during this battle."
 *
 * Rules: [On Your Opponent's Attack] fires after the opponent declares an attack, before the Block
 * Step (CR 10-2-?). The costs are an ACTIVE DON!! and this Character (which must be active). "During
 * this battle" ends with the battle. "Up to 1" may be none. It does not fire on my own attacks.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  chr,
  decision,
  donOf,
  kind,
  L11,
  mine,
  N11,
  need,
  no,
  none,
  noDefence,
  offeredIds,
  passBlock,
  payCosts,
  pickInst,
  theirs,
  unusable,
  yes,
  act,
} from './kit-op11a.ts';

const ISH = 'OP11-025';

function game(opts: { active?: number; ishRested?: boolean; attacker?: string } = {}) {
  const attacker = opts.attacker ?? N11.marco;
  const g = theirs(
    L11.luffy,
    {
      characters: [{ card: ISH, rested: opts.ishRested ?? false }, N11.navy3],
      costArea: { active: opts.active ?? 3, rested: 0 },
    },
    { characters: [attacker, N11.thatch] },
  );
  attack(g, chr(g, 'p2', attacker), g.leader('p1'));
  return g;
}

describe('OP11-025 Ishilly: [On Your Opponent’s Attack] [Once Per Turn] rest 1 DON!! and this Character: +1000 this battle', () => {
  it('printed values: cost 2, 0 power, Counter +1000', () => {
    const g = theirs(L11.luffy, { characters: [ISH] }, {});
    const i = chr(g, 'p1', ISH);
    expect(g.card(i).cost).toBe(2);
    expect(g.power(i)).toBe(0);
    expect(g.card(i).counter).toBe(1000);
  });

  it('is offered when the opponent attacks; paying rests 1 DON!! and Ishilly, and the Leader gains +1000', () => {
    const g = game();
    need(g, 'optional', 'p1');
    yes(g);
    payCosts(g);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.card(chr(g, 'p1', ISH)).rested).toBe(true);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
  });

  it('the +1000 decides a tie: a 5000 attacker no longer beats my 5000 Leader', () => {
    const g = game();
    yes(g);
    payCosts(g);
    pickInst(g, [g.leader('p1')]);
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
  });

  it('without it a 5000 attacker beats the 5000 Leader (control)', () => {
    const g = game();
    need(g, 'optional', 'p1');
    no(g);
    noDefence(g);
    expect(g.life('p1')).toBe(3);
  });

  it('may be declined: nothing is rested and no power changes', () => {
    const g = game();
    need(g, 'optional', 'p1');
    no(g);
    expect(g.card(chr(g, 'p1', ISH)).rested).toBe(false);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('offers my Leader and my Characters, never an opposing card', () => {
    const g = game();
    yes(g);
    payCosts(g);
    need(g, 'choose', 'p1');
    const ids = offeredIds(g);
    expect(ids).toContain(L11.luffy);
    expect(ids).toContain(N11.navy3);
    expect(ids).not.toContain(N11.marco);
    expect(ids).not.toContain(N11.thatch);
  });

  it('a Character can be the one boosted (+1000 power during this battle)', () => {
    const g = game();
    yes(g);
    payCosts(g);
    pickInst(g, [chr(g, 'p1', N11.navy3)]);
    expect(g.power(chr(g, 'p1', N11.navy3))).toBe(6000);
  });

  it('"up to 1": choosing no one still rests the DON!! and Ishilly', () => {
    const g = game();
    yes(g);
    payCosts(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.card(chr(g, 'p1', ISH)).rested).toBe(true);
    expect(donOf(g, 'p1').rested).toBe(1);
  });

  it('the +1000 ends with the battle', () => {
    const g = game();
    yes(g);
    payCosts(g);
    pickInst(g, [g.leader('p1')]);
    noDefence(g);
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a rested Ishilly cannot pay the cost: not offered', () => {
    const g = game({ ishRested: true });
    expect(decision(g)?.kind).not.toBe('optional');
  });

  it('with no active DON!! the cost cannot be paid', () => {
    const g = game({ active: 0 });
    unusable(g, 'p1');
    expect(g.card(chr(g, 'p1', ISH)).rested).toBe(false);
  });

  it('does not fire on my own attack', () => {
    const g = mine(L11.luffy, { characters: [ISH, N11.navy3] }, { characters: [N11.marco] });
    attack(g, chr(g, 'p1', N11.navy3), g.leader('p2'));
    expect(decision(g)?.player).toBe('p2');
    expect(at(g, 'p1', 'characters', ISH)).toBeTruthy();
  });
});
