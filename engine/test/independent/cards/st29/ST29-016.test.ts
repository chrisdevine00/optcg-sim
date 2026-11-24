/**
 * ST29-016 Kizaru!! Compared to Two Years Ago We're a Hundred Times Stronger Now!! (Event, Yellow, cost
 * 1, {Straw Hat Crew}/{The Four Emperors}/{Egghead}).
 *
 * Card text: "[Main] Your [Monkey.D.Luffy] Leader gains [Unblockable] during this turn.
 * (This card cannot be blocked.)
 * [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: [Main] is played in my Main Phase for its cost; the condition is that MY Leader is named
 * Monkey.D.Luffy; [Unblockable] stops the opponent from declaring a Blocker against that attack;
 * "during this turn" ends with the turn. [Counter] (CR 10-2-4) boosts only my Leader, during this
 * battle only, and needs no target choice.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  C29,
  canCounterNow,
  counterEvent,
  don,
  fill,
  ids29,
  inst,
  isMain,
  kind,
  L29,
  mine,
  need,
  passBlock,
  playRaw,
  theirs,
  trash,
} from './kit-st29a.ts';

const ID = 'ST29-016';
const BLOCKER = C29.blockerFranky; // OP09-072 Franky: Purple [Blocker], 5000

/** p1's Main Phase: Kizaru in hand; p2 has an active Blocker. */
function main(leader: string, chars: string[] = []) {
  return mine(
    leader,
    { hand: [ID], characters: chars, life: fill(C29.c1, 4) },
    { characters: [BLOCKER], life: fill(C29.c1, 4) },
  );
}

/** My Leader attacks p2's Leader; true if p2 is offered at least one Blocker to declare. */
function attackLeader(g: ReturnType<typeof main>): boolean {
  act(g, { type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
  return g.legal().some((a) => a.type === 'block' && a.blocker !== null);
}

describe('ST29-016 Kizaru [Main]: my [Monkey.D.Luffy] Leader gains [Unblockable] this turn', () => {
  it('printed values: Event, cost 1; costs 1 DON!! to play from hand', () => {
    const g = main(L29.luffy);
    expect(g.card(inst(g, 'p1', 'hand', ID)).cost).toBe(1);
    playRaw(g, ID);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
    expect(trash(g)).toEqual([ID]);
  });

  it('with ST01-001 Luffy as Leader the Leader gains [Unblockable]: the opposing Blocker cannot be declared', () => {
    const g = main(L29.luffy);
    playRaw(g, ID);
    expect(isMain(g, 'p1')).toBe(true);
    expect(g.card(g.leader('p1')).keywords).toContain('Unblockable');
    expect(attackLeader(g)).toBe(false);
  });

  it('with ST29-001 Luffy as Leader it works as well', () => {
    const g = main(L29.st29Luffy);
    playRaw(g, ID);
    expect(g.card(g.leader('p1')).keywords).toContain('Unblockable');
    expect(attackLeader(g)).toBe(false);
  });

  it('control: without the card the opposing Blocker may block the same attack', () => {
    const g = main(L29.luffy);
    expect(attackLeader(g)).toBe(true);
  });

  it('with a Leader not named Monkey.D.Luffy nothing is gained and the Blocker may block', () => {
    const g = main(L29.croc);
    playRaw(g, ID);
    expect(g.card(g.leader('p1')).keywords).not.toContain('Unblockable');
    expect(attackLeader(g)).toBe(true);
  });

  it('only the Leader gains it: a Monkey.D.Luffy Character stays blockable', () => {
    const g = mine(
      L29.luffy,
      { hand: [ID], characters: ['ST29-012'] },
      { characters: [{ card: C29.c1, rested: true }, BLOCKER] },
    );
    playRaw(g, ID);
    expect(g.card(inst(g, 'p1', 'characters', 'ST29-012')).keywords).not.toContain('Unblockable');
  });

  it('the opponent\'s Monkey.D.Luffy Leader does not benefit (it is "your" Leader)', () => {
    const g = main(L29.luffy);
    playRaw(g, ID);
    expect(g.card(g.leader('p2')).keywords).not.toContain('Unblockable');
  });

  it('"during this turn": the Leader is blockable again in my next turn', () => {
    const g = main(L29.luffy);
    playRaw(g, ID);
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' });
    expect(isMain(g, 'p1')).toBe(true);
    expect(g.card(g.leader('p1')).keywords).not.toContain('Unblockable');
    expect(attackLeader(g)).toBe(true);
  });
});

describe('ST29-016 Kizaru [Counter]: my Leader gains +3000 power during this battle', () => {
  /** p2's Leader (5000) attacks my Leader (or a rested Character); the Counter Step is pending. */
  function defend(active = 3, target: 'leader' | 'char' = 'leader') {
    const g = theirs(
      L29.croc,
      {
        hand: [ID],
        costArea: { active, rested: 0 },
        characters: [{ card: C29.c1, rested: true }],
        life: fill(C29.c1, 4),
      },
      {},
    );
    act(g, {
      type: 'attack',
      attacker: g.leader('p2'),
      target: target === 'leader' ? g.leader('p1') : inst(g, 'p1', 'characters', C29.c1),
    });
    passBlock(g);
    need(g, 'counter', 'p1');
    return g;
  }

  it('Leader 5000 -> 8000 with no target question; the 5000 attack fails; the Event is trashed', () => {
    const g = defend();
    counterEvent(g, ID);
    expect(kind(g)).toBe('counter');
    expect(g.power(g.leader('p1'))).toBe(8000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([ID]);
    expect(don(g)).toMatchObject({ active: 2, rested: 1 });
  });

  it('the boost ends with the battle', () => {
    const g = defend();
    counterEvent(g, ID);
    act(g, { type: 'endCounter' });
    expect(isMain(g, 'p2')).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('it boosts the Leader only: when a Character is attacked the Character is not helped', () => {
    const g = defend(3, 'char');
    counterEvent(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(g.power(inst(g, 'p1', 'characters', C29.c1))).toBe(3000);
    act(g, { type: 'endCounter' });
    expect(ids29(g, 'p1', 'characters')).toEqual([]);
  });

  it('it cannot be used as a Counter without 1 active DON!!', () => {
    const g = defend(0);
    expect(canCounterNow(g, inst(g, 'p1', 'hand', ID))).toBe(false);
  });
});
