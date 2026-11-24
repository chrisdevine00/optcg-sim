/**
 * OP14-078 Bullet String (Event, Purple, cost 2, {Donquixote Pirates}/{The Seven Warlords of the Sea}).
 *
 * Card text: "[Counter] DON!! −1 (You may return the specified number of DON!! cards from your field
 * to your DON!! deck.): If your Leader has the {Donquixote Pirates} type, up to 1 of your Leader or
 * Character cards gains +2000 power during this battle. Then, that card gains an additional +2000
 * power during this turn."
 *
 * Rules: RL-52 (an Event's DON!! −X may be declined: the Event is spent, nothing happens), CR 8-3-1-4
 * (an unpayable cost cannot be paid), RL-08 ("during this battle" ends with the battle), RL-09
 * ("during this turn" ends in the End Phase, so it outlives the battle), "that card" is the one chosen.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateCounter,
  at,
  attack,
  backToMain,
  chr,
  donOf14,
  kind,
  LD14,
  mayChooseNone,
  need,
  no,
  none,
  offeredIds,
  onField,
  passBlock,
  payDon,
  pickInst,
  SC14,
  theirs,
  trash,
  yes,
  endTurn,
} from './kit-op14c.ts';

const ID = 'OP14-078';

/** p2's Leader attacks my Leader (or my rested Sai); I reach the Counter Step. */
function defend(
  o: { leader?: string; active?: number; target?: 'leader' | 'char'; p2chars?: string[] } = {},
) {
  const g = theirs(
    o.leader ?? LD14.dp,
    {
      hand: [ID],
      characters: [{ card: SC14.c2, rested: true }],
      costArea: { active: o.active ?? 4, rested: 0 },
    },
    { characters: o.p2chars ?? [] },
  );
  const target = o.target === 'char' ? chr(g, 'p1', SC14.c2) : g.leader('p1');
  attack(g, g.leader('p2'), target);
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}

/** Use the Counter: accept, pay DON!! −1, and stop at the target choice. */
function use(g: ReturnType<typeof defend>) {
  activateCounter(g, at(g, 'p1', 'hand', ID));
  yes(g, 'p1');
  payDon(g, 1, 'costActive');
}

describe('OP14-078 Bullet String [Counter] DON!! −1: +2000 this battle and +2000 this turn', () => {
  it('pays DON!! −1 (a DON!! returns to the DON!! deck), then boosts my Leader by +4000 for the battle', () => {
    const g = defend();
    use(g);
    // The Event's own cost only RESTS 2 DON!!; the DON!! −1 returns one to the DON!! deck.
    expect(onField(g)).toBe(3);
    expect(donOf14(g).deck).toBe(7);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([ID]);
  });

  it('after the battle the battle part (+2000) is gone but the turn part (+2000) remains: Leader 7000', () => {
    const g = defend();
    use(g);
    pickInst(g, [g.leader('p1')]);
    act(g, { type: 'endCounter' });
    backToMain(g, 'p2');
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('the turn part lasts only this turn: back to 5000 on my turn', () => {
    const g = defend();
    use(g);
    pickInst(g, [g.leader('p1')]);
    act(g, { type: 'endCounter' });
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the turn part still counts in a later battle of the same turn (7000 beats a 5000 attacker)', () => {
    const g = defend({ p2chars: [SC14.c3] });
    use(g);
    pickInst(g, [g.leader('p1')]);
    act(g, { type: 'endCounter' });
    attack(g, at(g, 'p2', 'characters', SC14.c3), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
  });

  it('"that card": both bonuses go to the same card, a Character here (4000 -> 8000 in battle, 6000 after)', () => {
    const g = defend({ target: 'char' });
    use(g);
    pickInst(g, [chr(g, 'p1', SC14.c2)]);
    expect(g.power(chr(g, 'p1', SC14.c2))).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(5000);
    act(g, { type: 'endCounter' });
    backToMain(g, 'p2');
    expect(g.power(chr(g, 'p1', SC14.c2))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('only my Leader or Characters are offered', () => {
    const g = defend({ p2chars: [SC14.c3] });
    use(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LD14.dp, SC14.c2].sort());
  });

  it('"up to 1": the target may be skipped; nothing is boosted', () => {
    const g = defend();
    use(g);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(kind(g)).toBe('counter');
  });

  it('"may": declining the DON!! −1 spends the Event and does nothing else', () => {
    const g = defend();
    activateCounter(g, at(g, 'p1', 'hand', ID));
    no(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(onField(g)).toBe(4);
    expect(trash(g)).toEqual([ID]);
  });

  it('rested DON!! are DON!! on the field: with only the 2 DON!! rested for the Event cost, DON!! −1 is still payable', () => {
    const g = defend({ active: 2 });
    activateCounter(g, at(g, 'p1', 'hand', ID));
    yes(g, 'p1');
    payDon(g, 1, 'costRested');
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(onField(g)).toBe(1);
  });

  it('the Leader must have {Donquixote Pirates}: with another Leader the DON!! −1 is paid but nothing is boosted', () => {
    const g = defend({ leader: LD14.plain });
    activateCounter(g, at(g, 'p1', 'hand', ID));
    yes(g, 'p1');
    payDon(g, 1, 'costActive');
    if (kind(g) === 'choose') none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(kind(g)).toBe('counter');
  });
});
