/**
 * EB02-018 Buggy (Character, Green, cost 4, 6000, no Counter, {Buggy Pirates}/{East Blue}).
 *
 * Card text: "[On Play] If you have no other [Buggy] Characters, up to 1 of your Leader gains
 * [Double Attack] during this turn.
 * [Trigger] Rest up to 1 of your opponent's Characters with a cost of 4 or less."
 *
 * Rules: [Double Attack] (CR 10-1-4: 2 damage), "other" excludes the card itself, an activated
 * [Trigger] resolves and the card is then trashed (CR 10-1-5), declining adds it to the hand.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  canFinish,
  choices,
  choose,
  chooseNone,
  declineTrigger,
  E2C,
  E2L,
  attack,
  hitLeader,
  kind,
  kw,
  mine,
  need,
  noDefence,
  offers,
  playRaw,
  theirs,
  toMyNextMain,
  fill,
} from './kit-eb02a.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const BUGGY = 'EB02-018';

function pos(chars: (string | { card: string; rested?: boolean })[] = [], oppChars: string[] = []) {
  return mine(E2L.shc, { hand: [BUGGY], characters: chars }, { characters: oppChars });
}

/** Play Buggy and give the Leader the keyword if the engine asks for the target. */
function play(g: TestGame) {
  playRaw(g, BUGGY);
  if (kind(g) === 'choose' && choices(g).includes(g.leader('p1'))) choose(g, [g.leader('p1')]);
}

describe('EB02-018 Buggy: [On Play] with no other [Buggy], my Leader gains [Double Attack]', () => {
  it('with no other [Buggy] Character the Leader gains [Double Attack] this turn', () => {
    const g = pos();
    play(g);
    expect(kw(g, g.leader('p1'))).toContain('Double Attack');
  });

  it('the keyword is real: an unblocked Leader attack deals 2 damage', () => {
    const g = pos();
    play(g);
    const life = g.life('p2');
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(life - 2);
  });

  it('without it a Leader attack deals 1 damage (control)', () => {
    const g = pos([E2C.buggy3]);
    play(g);
    const life = g.life('p2');
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(life - 1);
  });

  it('another [Buggy] Character on my field (a different card) switches it off', () => {
    const g = pos([E2C.buggy3]);
    play(g);
    expect(kw(g, g.leader('p1'))).not.toContain('Double Attack');
  });

  it('another copy of EB02-018 on my field counts as another [Buggy]', () => {
    const g = pos([BUGGY]);
    play(g);
    expect(kw(g, g.leader('p1'))).not.toContain('Double Attack');
  });

  it('a rested [Buggy] still counts as "you have" one', () => {
    const g = pos([{ card: E2C.buggy3, rested: true }]);
    play(g);
    expect(kw(g, g.leader('p1'))).not.toContain('Double Attack');
  });

  it('a [Buggy] in my hand, or on the opponent’s field, does not count', () => {
    const g = mine(E2L.shc, { hand: [BUGGY, E2C.buggy3] }, { characters: [E2C.buggy3] });
    play(g);
    expect(kw(g, g.leader('p1'))).toContain('Double Attack');
  });

  it('[Double Attack] lasts this turn only', () => {
    const g = pos();
    play(g);
    toMyNextMain(g);
    expect(kw(g, g.leader('p1'))).not.toContain('Double Attack');
  });

  it('only the Leader gains it: the new Buggy does not', () => {
    const g = pos();
    play(g);
    expect(kw(g, g.find('p1', 'characters', BUGGY))).not.toContain('Double Attack');
  });
});

describe('EB02-018 Buggy: [Trigger] rest up to 1 of the opponent’s Characters with cost 4 or less', () => {
  /** p2 attacks my Leader; my top Life card is Buggy. Stops at my [Trigger] decision. */
  function hit(oppChars: string[] = [E2C.hajrudin, E2C.kingdew]) {
    const g = theirs(E2L.shc, { life: [BUGGY, ...fill(E2C.mohji, 3)] }, { characters: oppChars });
    hitLeader(g);
    return g;
  }

  it('the [Trigger] is offered when Buggy is the Life card taken', () => {
    const g = hit();
    expect(kind(g)).toBe('trigger');
  });

  it('activating it rests a Character with cost 4 and trashes Buggy', () => {
    const g = hit();
    activateTrigger(g);
    const hajrudin = g.find('p2', 'characters', E2C.hajrudin);
    expect(offers(g, hajrudin)).toBe(true);
    choose(g, [hajrudin]);
    expect(g.card(hajrudin).rested).toBe(true);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(BUGGY);
    expect(g.zone('p1', 'hand').map((c) => c.card)).not.toContain(BUGGY);
  });

  it('the cost boundary: a cost 5 Character is not offered', () => {
    const g = hit();
    activateTrigger(g);
    expect(offers(g, g.find('p2', 'characters', E2C.kingdew))).toBe(false);
  });

  it('"up to 1": nothing needs to be rested', () => {
    const g = hit();
    activateTrigger(g);
    expect(canFinish(g)).toBe(true);
    chooseNone(g);
    expect(g.card(g.find('p2', 'characters', E2C.hajrudin)).rested).toBe(false);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(BUGGY);
  });

  it('declining the [Trigger] adds Buggy to my hand and rests nothing', () => {
    const g = hit();
    declineTrigger(g);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain(BUGGY);
    expect(g.card(g.find('p2', 'characters', E2C.hajrudin)).rested).toBe(false);
  });

  it('the [Trigger] does not give a [Double Attack] (that is the [On Play])', () => {
    const g = hit();
    activateTrigger(g);
    chooseNone(g);
    need(g, 'main', 'p2');
    expect(kw(g, g.leader('p1'))).not.toContain('Double Attack');
  });
});
