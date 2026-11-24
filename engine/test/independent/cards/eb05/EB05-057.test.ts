/**
 * EB05-057 Nojiko (Character, Yellow, cost 2, 0 power, Counter +2000, {East Blue}, Wisdom).
 *
 * Card text: "[Activate: Main] [Once Per Turn] Give up to 1 rested DON!! card to 1 of your Leader or
 * Character cards with the "Special" or "Wisdom" Attribute.
 * [Trigger] If you have 2 or less Life cards, play up to 1 Character card with 6000 power or less
 * and a [Trigger] from your hand."
 *
 * Rules: CR 6-5-5-1 (DON!! may be given to a Leader or Character; the given card leaves the cost
 * area), RL-23 (only a rested DON!! is taken), CR 8-4-4-1 ("up to"), "once per turn" (one activation per
 * turn), CR 8-3-3 (failed "if"), RL-25 (Trigger resolution), CR 6-5-5-2 (given
 * DON!! add +1000 power on my turn).
 */
import { describe, expect, it } from 'vitest';
import { endTurn } from '../../helpers.ts';
import {
  abilities,
  activate,
  activateTrigger,
  BLUE,
  canActivate,
  CH,
  chars,
  choiceCards,
  choices,
  choose,
  chooseNone,
  declineTrigger,
  don,
  fill,
  hand,
  hitLeader,
  kind,
  LD,
  mine,
  RED,
  side,
  theirTurn,
  theirs,
} from './kit-b.ts';

const ID = 'EB05-057';

function board(leader: string = LD.bw, rested = 2, active = 3) {
  return mine(
    leader,
    {
      characters: [ID, CH.marco, CH.mohji, CH.komachiyo, CH.sai],
      costArea: { active, rested },
    },
    { characters: [CH.marco] },
  );
}

describe('EB05-057 Nojiko [Activate: Main] [Once Per Turn]: give up to 1 rested DON!! to a Special/Wisdom Leader or Character', () => {
  it('gives a rested DON!! to my Special Leader: +1 given, -1 rested, power +1000', () => {
    const g = board();
    const before = don(g);
    activate(g, g.find('p1', 'characters', ID));
    choose(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g).rested).toBe(before.rested - 1);
    expect(don(g).active).toBe(before.active);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('candidates are only Special or Wisdom cards: Leader (Special), Marco (Special), Mohji (Wisdom), Nojiko herself (Wisdom)', () => {
    const g = board();
    activate(g, g.find('p1', 'characters', ID));
    expect(choiceCards(g)).toEqual([LD.bw, CH.marco, CH.mohji, ID].sort());
  });

  it('a Strike Leader (ST01-001) is not a candidate', () => {
    const g = board(LD.shc);
    activate(g, g.find('p1', 'characters', ID));
    expect(choiceCards(g)).toEqual([CH.marco, CH.mohji, ID].sort());
  });

  it('gives to a Wisdom Character: Mohji gets the DON!! (3000 -> 4000)', () => {
    const g = board();
    const mohji = g.find('p1', 'characters', CH.mohji);
    activate(g, g.find('p1', 'characters', ID));
    choose(g, [mohji]);
    expect(g.card(mohji).don).toBe(1);
    expect(g.power(mohji)).toBe(4000);
  });

  it('only my own cards: the opponent’s Characters are never candidates', () => {
    const g = board();
    activate(g, g.find('p1', 'characters', ID));
    const opp = g.find('p2', 'characters', CH.marco);
    expect(choices(g)).not.toContain(opp);
    expect(choices(g)).toHaveLength(4);
  });

  it('"up to 1": choosing nothing gives nothing, and the rested DON!! stays rested', () => {
    const g = board();
    const before = don(g);
    activate(g, g.find('p1', 'characters', ID));
    chooseNone(g);
    expect(don(g)).toEqual(before);
  });

  it('only a RESTED DON!! can be given: with every DON!! active nothing is given', () => {
    const g = board(LD.bw, 0, 5);
    const nojiko = g.find('p1', 'characters', ID);
    if (canActivate(g, nojiko)) {
      activate(g, nojiko);
      if (kind(g) === 'choose') chooseNone(g);
    }
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(don(g).active).toBe(5);
  });

  it('once per turn: after one use the ability is not offered again', () => {
    const g = board();
    const nojiko = g.find('p1', 'characters', ID);
    activate(g, nojiko);
    choose(g, [g.leader('p1')]);
    expect(kind(g)).toBe('main');
    expect(abilities(g, nojiko)).toEqual([]);
  });

  it('it is [Activate: Main]: not offered on the opponent’s turn', () => {
    const g = theirs(LD.bw, { characters: [ID], costArea: { active: 0, rested: 2 } });
    expect(abilities(g, g.find('p1', 'characters', ID))).toEqual([]);
  });

  it('a new turn re-arms it: usable again on my next turn', () => {
    const g = board();
    const nojiko = g.find('p1', 'characters', ID);
    activate(g, nojiko);
    choose(g, [g.leader('p1')]);
    endTurn(g);
    endTurn(g);
    expect(canActivate(g, nojiko)).toBe(true);
  });
});

describe('EB05-057 Nojiko [Trigger]: 2 or less Life: play up to 1 Character (power <= 6000, with a [Trigger]) from hand', () => {
  function hit(lifeBefore: number, handCards: string[]) {
    const g = theirTurn(
      side(LD.shc, BLUE, { life: [ID, ...fill(BLUE, lifeBefore - 1)], hand: handCards }),
      side(LD.shc, RED),
    );
    hitLeader(g, g.leader('p2'));
    return g;
  }

  it('3 Life before the hit (2 after): only Characters with a Trigger and power <= 6000 are candidates', () => {
    const g = hit(3, [CH.trigSpeed, CH.daifuku, CH.trig7000, CH.marco]);
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    expect(choiceCards(g)).toEqual([CH.trigSpeed, CH.daifuku].sort());
  });

  it('plays the chosen Character for free; Nojiko ends in the trash', () => {
    const g = hit(3, [CH.trigSpeed]);
    activateTrigger(g);
    choose(g, [g.find('p1', 'hand', CH.trigSpeed)]);
    expect(chars(g)).toEqual([CH.trigSpeed]);
  });

  it('boundary: 4 Life before the hit (3 after): nothing is played', () => {
    const g = hit(4, [CH.trigSpeed]);
    activateTrigger(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([CH.trigSpeed]);
  });

  it('"up to 1": may play nothing', () => {
    const g = hit(3, [CH.trigSpeed]);
    activateTrigger(g);
    chooseNone(g);
    expect(chars(g)).toEqual([]);
  });

  it('declining the Trigger puts Nojiko in hand', () => {
    const g = hit(3, [CH.trigSpeed]);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID, CH.trigSpeed].sort());
  });
});
