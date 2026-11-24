/**
 * EB05-030 Take Care, Everybody. (Event, Blue, cost 2, {Straw Hat Crew}/{East Blue}).
 *
 * Card text: "[Main] If your Leader is [Nami], return up to 1 Character with a cost of 5 or less to
 * the owner's hand. [Counter] Draw 1 card, and up to 1 of your Leader or Characters gains +1000
 * power during this turn."
 *
 * Rules: CR 8-3-3 (a failed "if" stops the text), CR 8-4-4-1 ("up to" may choose 0), CR 2-1-2 (a
 * card name is exact; "Leader is [Nami]" is the name), CR 1-3-6-2 (cost read at resolution),
 * RL-08 (the [Counter] says "during this turn", so the boost outlives the battle).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  act,
  attack,
  BLUE,
  CH,
  choiceCards,
  choices,
  chooseIfAsked,
  drive,
  hand,
  kind,
  LD,
  mine,
  passBlock,
  passCounter,
  play,
  reachablePickSets,
  RED,
  side,
  theirTurn,
  trash,
  useCounter,
} from './kit-b.ts';

const EVT = 'EB05-030';

function main(leader: string, own: string[], opp: string[]) {
  const g = mine(leader, { hand: [EVT], characters: own }, { characters: opp });
  play(g, g.find('p1', 'hand', EVT));
  return g;
}

describe('EB05-030 Take Care, Everybody. [Main]: Leader [Nami]: return up to 1 Character cost <= 5 to hand', () => {
  it('Leader [Nami]: an opposing cost-5 Character goes to its owner’s hand and the Event is trashed', () => {
    const g = main(LD.nami, [], [CH.kingdew]);
    expect(choiceCards(g)).toEqual([CH.kingdew]);
    drive(g, 'p1', { picks: [[g.find('p2', 'characters', CH.kingdew)]] });
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(hand(g, 'p2')).toEqual([CH.kingdew]);
    expect(trash(g)).toEqual([EVT]);
  });

  it('the other [Nami] Leader (P-117) satisfies the condition too (same name)', () => {
    const g = main(LD.nami2, [], [CH.marco]);
    expect(choiceCards(g)).toEqual([CH.marco]);
  });

  it('boundary: a cost-6 Character is not a candidate, a cost-5 one is', () => {
    const g = main(LD.nami, [], [CH.thatch, CH.kingdew, CH.hajrudin]);
    expect(choiceCards(g)).toEqual([CH.kingdew, CH.hajrudin].sort());
  });

  it('either player’s Characters qualify: my own Character can be returned to my hand', () => {
    const g = main(LD.nami, [CH.marco], [CH.kingdew]);
    expect(choiceCards(g)).toEqual([CH.kingdew, CH.marco].sort());
    drive(g, 'p1', { picks: [[g.find('p1', 'characters', CH.marco)]] });
    expect(hand(g, 'p1')).toEqual([CH.marco]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('"up to 1": nothing may be chosen, and at most one Character is returned', () => {
    const g = main(LD.nami, [], [CH.kingdew, CH.marco]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    drive(g, 'p1', {});
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('CR 8-3-3: Leader not [Nami] (ST01-001): the Event resolves but returns nothing', () => {
    const g = main(LD.shc, [], [CH.kingdew]);
    if (kind(g) === 'choose') expect(choices(g)).toEqual([]);
    drive(g, 'p1', {});
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(hand(g, 'p2')).toEqual([]);
    expect(trash(g)).toEqual([EVT]);
  });

  it('a Leader that merely has the {East Blue} type but another name is not [Nami] (ST01-001 with Nami elsewhere)', () => {
    // A [Nami] Character on the field does not count: the text asks for the Leader.
    const g = main(LD.shc, ['EB05-055'], [CH.kingdew]);
    drive(g, 'p1', {});
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });
});

describe('EB05-030 Take Care, Everybody. [Counter]: draw 1; Leader or Character +1000 during this turn', () => {
  function defending(extra: Partial<Parameters<typeof side>[2]> = {}) {
    return theirTurn(
      side(LD.shc, BLUE, { hand: [EVT], costArea: { active: 2, rested: 0 }, ...extra }),
      side(LD.shc, RED, { characters: [CH.marco] }),
    );
  }

  it('draws 1 and the +1000 Leader (6000) stops a 5000 attacker', () => {
    const g = defending();
    const before = g.zone('p1', 'hand').length;
    attack(g, g.find('p2', 'characters', CH.marco), g.leader('p1'));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', EVT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.zone('p1', 'hand')).toHaveLength(before - 1 + 1);
    expect(g.power(g.leader('p1'))).toBe(6000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('without the Event the same 5000 attacker connects (control)', () => {
    const g = defending();
    attack(g, g.find('p2', 'characters', CH.marco), g.leader('p1'));
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('RL-08: "during this turn" means the +1000 is still there after the battle', () => {
    const g = defending();
    attack(g, g.find('p2', 'characters', CH.marco), g.leader('p1'));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', EVT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    passCounter(g);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('a Character may take the +1000 instead of the Leader', () => {
    const g = defending({ characters: [CH.sai] });
    const sai = g.find('p1', 'characters', CH.sai);
    attack(g, g.find('p2', 'characters', CH.marco), g.leader('p1'));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', EVT), sai);
    chooseIfAsked(g, [sai]);
    expect(g.power(sai)).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('no Leader condition: usable as a Counter with a non-[Nami] Leader and draws 1', () => {
    const g = defending({ deck: [CH.thatch, ...fill(BLUE, 10)] });
    attack(g, g.find('p2', 'characters', CH.marco), g.leader('p1'));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', EVT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(hand(g, 'p1')).toEqual([CH.thatch]);
    act(g, { type: 'endCounter' });
  });
});
