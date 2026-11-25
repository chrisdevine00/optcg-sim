/** OP09-064 Killer. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, don, expectDecision, none, pick, play } from './helpers.ts';
import { canPick, KID_LEADER, mk, OTHER_LEADER } from './helpers-a09g2.ts';
import { payDonMinus } from './helpers-st2627.ts';

const ID = 'OP09-064';
const restedLeader = (leader: string) => ({ card: leader, rested: true });
const go = (g: ReturnType<typeof mk>) => {
  play(g, ID);
  accept(g);
  payDonMinus(g, 1);
};

describe('OP09-064 Killer', () => {
  it('[On Play] DON!! -1: sets your rested {Kid Pirates} Leader as active', () => {
    const g = mk({ leader: restedLeader(KID_LEADER) as never, hand: [ID] });
    go(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p1'))).toBe(true);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    // 10 active, 5 for Killer, 1 returned to the DON!! deck
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 5 });
    expect(don(g, 'p1').deck).toBe(1);
  });

  it('"you may": declining pays no DON!! and sets nothing', () => {
    const g = mk({ leader: restedLeader(KID_LEADER) as never, hand: [ID] });
    play(g, ID);
    decline(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(don(g, 'p1').deck).toBe(0);
  });

  it('"up to 1": the DON!! -1 is paid and the Leader may be left rested', () => {
    const g = mk({ leader: restedLeader(KID_LEADER) as never, hand: [ID] });
    go(g);
    none(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(don(g, 'p1').deck).toBe(1);
  });

  it('a Leader without the {Kid Pirates} type is never a candidate', () => {
    const g = mk({ leader: restedLeader(OTHER_LEADER) as never, hand: [ID] });
    go(g);
    if (dec(g)?.kind === 'choose') {
      expect(canPick(g, g.leader('p1'))).toBe(false);
      none(g);
    }
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(don(g, 'p1').deck).toBe(1);
  });

  it('a rested DON!! can be returned: with all 5 DON!! spent on Killer the cost is still payable', () => {
    const g = mk({
      leader: restedLeader(KID_LEADER) as never,
      hand: [ID],
      costArea: { active: 5, rested: 0 },
    });
    play(g, ID);
    accept(g);
    // every DON!! is rested and alike: nothing to choose, one is returned
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 4 });
    expect(don(g, 'p1').deck).toBe(6);
  });
});
