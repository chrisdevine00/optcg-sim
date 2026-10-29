/**
 * OP17-055 There's No Authority in the World That Lasts Forever!!! (Event, Blue, cost 0, type
 * Rocks Pirates).
 *
 * Card text (cards/data):
 *   "[Main] You may rest 1 of your DON!! cards: Up to 1 of your [Rocks.D.Xebec] gains [Unblockable]
 *    during this turn.
 *
 *    [Counter] Up to 1 of your Leader with a type including "Rocks Pirates" or up to 1 of your
 *    Character with a type including "Rocks Pirates" gains +2000 power during this battle."
 *
 * Reading: the [Counter] boosts one card in total, either a Rocks Pirates Leader or a Rocks
 * Pirates Character ("or"). [Rocks.D.Xebec] is an exact name (CR 2-1-2): the Leader OP17-039 and
 * the Character OP17-118 both qualify. [Unblockable]: the opponent cannot activate [Blocker]
 * (CR 10-1-7-1). Event [Counter]s work only in the opponent's Counter Step (CR 7-1-3-1-2, 10-2-4-1).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, blockers, endTurn, K, passBlock, takeDamage } from '../helpers.ts';
import {
  accept,
  BLUE,
  canCounterWith,
  choiceCards,
  choose,
  chooseIfAsked,
  donOf,
  eventCounterTargets,
  LEAD,
  myTurn,
  offered,
  payDon,
  RED,
  ROCKS,
  side,
  sortedIds,
  theirTurn,
  useCounter,
  VAN,
  settleNo,
} from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

function mainPhase(p1: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LEAD.rocks, BLUE, {
      hand: [ROCKS.noAuthority],
      costArea: { active: 1, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED, { characters: [K.blockerFranky] }),
  );
}

function castMain(g: TestGame) {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', ROCKS.noAuthority) });
  // Playing the Event is choosing to use its [Main]; accept a "use" question only if asked.
  if (offered(g, 'p1')) accept(g);
  payDon(g, 1);
}

function defending(p1: Partial<PlayerSpec> = {}, leader: string = LEAD.rocks) {
  return theirTurn(side(leader, BLUE, { hand: [ROCKS.noAuthority], ...p1 }), side(LEAD.luffy, RED));
}

describe('OP17-055: [Main] rest 1 DON!!: a [Rocks.D.Xebec] gains [Unblockable] during this turn', () => {
  it('happy path: the Rocks Leader gains [Unblockable]; the opponent’s [Blocker] cannot block it', () => {
    const g = mainPhase();
    castMain(g);
    choose(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).keywords).toContain('Unblockable');
    expect(sortedIds(g, 'p1', 'trash')).toEqual([ROCKS.noAuthority]);
    attack(g, g.leader('p1'), g.leader('p2'));
    settleNo(g, 'p1'); // the Rocks Leader's own [When Attacking]: not part of this test
    expect(blockers(g)).toEqual([]);
  });

  it('control: without the Event, OP09-072 Franky can block the Leader', () => {
    const g = mainPhase();
    attack(g, g.leader('p1'), g.leader('p2'));
    settleNo(g, 'p1'); // the Rocks Leader's own [When Attacking]: not part of this test
    expect(blockers(g)).toEqual([g.find('p2', 'characters', K.blockerFranky)]);
  });

  it('CR 8-3-1-5: the cost rests 1 active DON!!', () => {
    const g = mainPhase({ costArea: { active: 2, rested: 0 } });
    castMain(g);
    choose(g, [g.leader('p1')]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 1 });
  });

  it('CR 2-1-2: target restriction is the exact name [Rocks.D.Xebec]: Leader OP17-039 and Character OP17-118, not other Rocks Pirates', () => {
    const g = mainPhase({ characters: [ROCKS.xebec, ROCKS.kyo] });
    castMain(g);
    expect(choiceCards(g)).toEqual([LEAD.rocks, ROCKS.xebec].sort());
  });

  it('"during this turn": [Unblockable] is gone on later turns', () => {
    const g = mainPhase();
    castMain(g);
    choose(g, [g.leader('p1')]);
    endTurn(g);
    expect(g.card(g.leader('p1')).keywords).not.toContain('Unblockable');
    endTurn(g);
    expect(g.card(g.leader('p1')).keywords).not.toContain('Unblockable');
  });
});

describe('OP17-055: [Counter] +2000 to a Rocks Pirates Leader or Character during this battle', () => {
  it('happy path: costs 0 DON!!; the Rocks Leader goes to 7000 and the 5000 attack fails; the boost ends with the battle', () => {
    const g = defending();
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    const event = g.find('p1', 'hand', ROCKS.noAuthority);
    expect(canCounterWith(g, event)).toBe(true);
    useCounter(g, event, g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([ROCKS.noAuthority]);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('target restriction: Rocks Pirates Leader or Characters only (OP17-045 Kyo yes, OP02-060 Mohji no)', () => {
    const g = defending({ characters: [ROCKS.kyo, VAN.mohji] });
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    const targets = eventCounterTargets(g, g.find('p1', 'hand', ROCKS.noAuthority));
    expect(targets).toContain(g.leader('p1'));
    expect(targets).toContain(g.find('p1', 'characters', ROCKS.kyo));
    expect(targets).not.toContain(g.find('p1', 'characters', VAN.mohji));
  });

  it('target restriction: a Leader without "Rocks Pirates" (ST03-001 Crocodile) cannot get the +2000', () => {
    const g = defending({ characters: [ROCKS.kyo] }, LEAD.crocodile);
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    const targets = eventCounterTargets(g, g.find('p1', 'hand', ROCKS.noAuthority));
    expect(targets).not.toContain(g.leader('p1'));
    expect(targets).toContain(g.find('p1', 'characters', ROCKS.kyo));
  });

  it('interaction: +2000 on an attacked rested Rocks Character saves it from K.O.', () => {
    // p2's OP01-023 Marco (5000) attacks rested OP17-045 Kyo (4000 → 6000).
    const g = theirTurn(
      side(LEAD.rocks, BLUE, {
        hand: [ROCKS.noAuthority],
        characters: [{ card: ROCKS.kyo, rested: true }],
      }),
      side(LEAD.luffy, RED, { characters: [VAN.marco] }),
    );
    const kyo = g.find('p1', 'characters', ROCKS.kyo);
    attack(g, g.find('p2', 'characters', VAN.marco), kyo);
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', ROCKS.noAuthority), kyo);
    chooseIfAsked(g, [kyo]);
    act(g, { type: 'endCounter' });
    expect(g.card(kyo).zone).toBe('characters');
  });

  it('CR 10-2-4-1: in p1’s own Main Phase only the [Main] is usable; there is no Counter Step', () => {
    const g = mainPhase();
    expect(g.legal().some((a) => a.type === 'counter')).toBe(false);
  });
});
