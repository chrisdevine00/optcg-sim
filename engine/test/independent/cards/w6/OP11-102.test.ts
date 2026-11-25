/**
 * OP11-102 Camie (Character, Yellow, cost 1, 1000 power, Counter +2000, {Merfolk}/{Fish-Man Island}).
 *
 * Card text: "[Your Turn] [Once Per Turn] This effect can be activated when your opponent activates an
 * Event or [Trigger]. If your opponent has 2 or more Life cards, trash 1 card from the top of each of
 * your and your opponent's Life cards."
 *
 * Rules: [Your Turn] works only during my turn; "activates an Event" is the opponent using an Event
 * ([Counter] during my battle); "activates a [Trigger]" is the damaged player choosing to activate a
 * revealed [Trigger] (a declined one goes to the hand and is not an activation); [Once Per Turn] is
 * spent when the effect fires; the colon-less "If" is an effect condition read when it resolves (CR
 * 8-3); Life cards trashed by an effect do not activate their [Trigger]; having 0 Life is not a defeat
 * (only damage at 0 Life is, CR 1-2-1-1). M6b-Q72: when the watcher resolves relative to the [Trigger]
 * is not asserted, only the state after everything has resolved.
 */
import { describe, expect, it } from 'vitest';
import { act, result } from '../../helpers.ts';
import {
  activateCounter,
  at,
  atMain,
  attack,
  canUse,
  chars,
  donChoices,
  kind,
  LW,
  mine,
  need,
  none,
  passBlock,
  payDon,
  playCard,
  pickInst,
  sorted,
  theirs,
  trash,
  V13,
  W6,
  yes,
  hand,
  snap,
} from './kit-w6b.ts';

const CAMIE = 'OP11-102';
/** Distinguishable Life cards (none has a [Trigger]); the first listed is the top. */
const LIFE_P1 = ['OP01-010', 'OP01-012', 'OP01-023', 'OP01-018'];
const LIFE_P2 = ['OP02-060', 'OP02-020', 'OP02-007', 'OP02-006'];

/** p1: Camie and two 6000 attackers; p2: Slow-Slow Beam Sword (Counter, DON!! -1) x2, DON!! to pay, Purple Leader. */
function game(o: { p2Life?: string[]; p1Life?: string[]; beams?: number } = {}) {
  return mine(
    LW.luffy,
    {
      characters: [CAMIE, V13.hajrudin, V13.hajrudin],
      life: o.p1Life ?? LIFE_P1,
    },
    {
      hand: Array.from({ length: o.beams ?? 1 }, () => W6.beamSword),
      costArea: { active: 5, rested: 0 },
      life: o.p2Life ?? LIFE_P2,
    },
    LW.shanks,
  );
}

type G = ReturnType<typeof game>;

/** p1's nth Hajrudin attacks p2's Leader; p2 does not block and is now in the Counter Step. */
function attackLeader(g: G, nth = 0) {
  attack(g, at(g, 'p1', 'characters', V13.hajrudin, nth), g.leader('p2'));
  passBlock(g);
  need(g, 'counter', 'p2');
}

/** p2 activates Slow-Slow Beam Sword as a Counter (pays DON!! -1, rests nothing) and ends the Counter Step. */
function beamCounter(g: G) {
  activateCounter(g, g.find('p2', 'hand', W6.beamSword));
  yes(g, 'p2');
  // DON!! -1, then +2000 to my Leader (so the attack is stopped) and no Character of theirs rested.
  if (donChoices(g).length) payDon(g, 1);
  pickInst(g, [g.leader('p2')]);
  none(g);
}

function endCounter(g: G) {
  if (kind(g) === 'counter') act(g, { type: 'endCounter' });
}

describe('OP11-102 Camie: when the opponent activates an Event or [Trigger], trash the top Life card of each side', () => {
  it('printed values: cost 1, 1000 power, Counter +2000', () => {
    const g = game();
    const c = g.card(at(g, 'p1', 'characters', CAMIE));
    expect(c.cost).toBe(1);
    expect(g.power(c.instance)).toBe(1000);
    expect(c.counter).toBe(2000);
  });

  it('the opponent activating a [Counter] Event on my turn trashes the top Life card of both players', () => {
    const g = game();
    attackLeader(g);
    beamCounter(g);
    endCounter(g);
    expect(sorted(g, 'p1', 'life'), snap(g)).toEqual(LIFE_P1.slice(1).sort());
    expect(sorted(g, 'p2', 'life')).toEqual(LIFE_P2.slice(1).sort());
    expect(trash(g, 'p1')).toEqual([LIFE_P1[0]]);
    expect(trash(g, 'p2')).toEqual([LIFE_P2[0], W6.beamSword].sort());
  });

  it('boundary: the opponent has exactly 2 Life cards when it resolves: it fires; with 1 it does nothing', () => {
    const two = game({ p2Life: LIFE_P2.slice(0, 2) });
    attackLeader(two);
    beamCounter(two);
    endCounter(two);
    expect(two.life('p2')).toBe(1);
    expect(two.life('p1')).toBe(3);

    const one = game({ p2Life: LIFE_P2.slice(0, 1) });
    attackLeader(one);
    beamCounter(one);
    endCounter(one);
    expect(one.life('p2')).toBe(1);
    expect(one.life('p1')).toBe(4);
  });

  it('the opponent activating a [Trigger] when my attack damages them fires it (Life counted after the damage)', () => {
    // 3 Life: the attack takes the top card (Speed, played by its [Trigger]), leaving 2 -> fires.
    const g = game({ p2Life: [W6.trig, ...LIFE_P2.slice(1, 3)] });
    attack(g, at(g, 'p1', 'characters', V13.hajrudin), g.leader('p2'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p2');
    act(g, { type: 'trigger', activate: true });
    // Everything pending resolves; whoever owes a decision, no prompt belongs to Camie (no "may").
    expect(atMain(g), snap(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([W6.trig]);
    expect(g.life('p2')).toBe(1);
    expect(g.life('p1')).toBe(3);
  });

  it('boundary for a [Trigger]: with 1 Life left after the damage it does nothing', () => {
    const g = game({ p2Life: [W6.trig, LIFE_P2[1]!] });
    attack(g, at(g, 'p1', 'characters', V13.hajrudin), g.leader('p2'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p2');
    act(g, { type: 'trigger', activate: true });
    expect(atMain(g), snap(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([W6.trig]);
    expect(g.life('p2')).toBe(1);
    expect(g.life('p1')).toBe(4);
  });

  it('a declined [Trigger] (the card is added to the hand) is not an activation', () => {
    const g = game({ p2Life: [W6.trig, ...LIFE_P2.slice(1, 3)] });
    attack(g, at(g, 'p1', 'characters', V13.hajrudin), g.leader('p2'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p2');
    act(g, { type: 'trigger', activate: false });
    expect(atMain(g), snap(g)).toBe(true);
    expect(hand(g, 'p2')).toContain(W6.trig);
    expect(chars(g, 'p2')).toEqual([]);
    expect(g.life('p2')).toBe(2);
    expect(g.life('p1')).toBe(4);
  });

  it('[Once Per Turn]: a second Event in the same turn does nothing', () => {
    const g = game({ beams: 2, p2Life: [...LIFE_P2, ...LIFE_P2.slice(0, 1)] });
    attackLeader(g, 0);
    beamCounter(g);
    endCounter(g);
    expect(g.life('p2')).toBe(4);
    expect(g.life('p1')).toBe(3);
    expect(atMain(g)).toBe(true);
    attackLeader(g, 1);
    beamCounter(g);
    endCounter(g);
    expect(g.life('p2')).toBe(4);
    expect(g.life('p1')).toBe(3);
  });

  it('[Once Per Turn]: an Event and then a [Trigger] in the same turn trash Life only once', () => {
    const g = game({ p2Life: [W6.trig, ...LIFE_P2.slice(1, 4)] });
    attackLeader(g, 0);
    beamCounter(g);
    endCounter(g);
    // The top Life card (Speed) was trashed by Camie: 3 Life left, p1 has 3.
    expect(g.life('p2')).toBe(3);
    expect(g.life('p1')).toBe(3);
    attack(g, at(g, 'p1', 'characters', V13.hajrudin, 1), g.leader('p2'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p2');
    act(g, { type: 'trigger', activate: false });
    expect(g.life('p1')).toBe(3);
    expect(g.life('p2')).toBe(2);
  });

  it('Life cards trashed by Camie do not activate their [Trigger]', () => {
    const g = game({ p2Life: [W6.trig, ...LIFE_P2.slice(1, 4)] });
    attackLeader(g);
    beamCounter(g);
    endCounter(g);
    expect(trash(g, 'p2')).toContain(W6.trig);
    expect(chars(g, 'p2')).toEqual([]);
    expect(atMain(g)).toBe(true);
  });

  it('my own Event does not fire it', () => {
    const g = mine(
      LW.luffy,
      {
        characters: [CAMIE],
        hand: [W6.gammaKnife],
        costArea: { active: 5, rested: 0 },
        life: LIFE_P1,
      },
      { characters: [V13.hajrudin], life: LIFE_P2 },
    );
    playCard(g, W6.gammaKnife);
    yes(g, 'p1');
    payDon(g, 1);
    pickInst(g, [at(g, 'p2', 'characters', V13.hajrudin)]);
    while (kind(g) === 'choose') none(g);
    expect(g.life('p1')).toBe(4);
    expect(g.life('p2')).toBe(4);
  });

  it('[Your Turn] only: an Event the opponent plays on their own turn does nothing', () => {
    const g = theirs(
      LW.luffy,
      { characters: [CAMIE], life: LIFE_P1 },
      {
        hand: [W6.gammaKnife],
        characters: [V13.hajrudin],
        costArea: { active: 5, rested: 0 },
        life: LIFE_P2,
      },
      LW.shanks,
    );
    playCard(g, W6.gammaKnife);
    yes(g, 'p2');
    payDon(g, 1);
    pickInst(g, [at(g, 'p1', 'characters', CAMIE)]);
    while (kind(g) === 'choose') none(g);
    expect(g.life('p1')).toBe(4);
    expect(g.life('p2')).toBe(4);
  });

  it('with 1 Life of my own the last Life card is trashed too: 0 Life is not a defeat', () => {
    const g = game({ p1Life: [LIFE_P1[0]!] });
    attackLeader(g);
    beamCounter(g);
    endCounter(g);
    expect(g.life('p1')).toBe(0);
    expect(g.life('p2')).toBe(3);
    expect(result(g)).toBeNull();
    expect(canUse(g)).toBe(false);
  });
});
