/** ST31-005 Thousand Sunny. RL-35 (DON!! go to a Leader or Character only). */
import { describe, expect, it } from 'vitest';
import {
  don,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
} from './helpers.ts';
import {
  cardsOf,
  donArea,
  EVENTS,
  finishOrder,
  LUFFY_C,
  SHC,
  SHC_LEADER,
} from './helpers-luffyace.ts';

const ID = 'ST31-005';

describe('ST31-005 Thousand Sunny', () => {
  const deck = [PURPLE, SHC.sanji1, EVENTS[1], PURPLE, PURPLE, SHC.zoro4];

  it('[On Play]: look at 5; any {Straw Hat Crew} card (Event included) may be added; the rest go to the bottom', () => {
    const g = game({ leader: SHC_LEADER, hand: [ID], deck, ...donArea(1) }, { leader: PLAIN_BLUE });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    const offered = g.legal().filter((a) => a.type === 'pick');
    expect(offered).toHaveLength(2);
    pick(g, [g.find('p1', 'deck', EVENTS[1])]);
    expect(hand(g, 'p1')).toEqual([EVENTS[1]]);
    finishOrder(g);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(SHC.zoro4);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([ID]);
  });

  it('[On Play]: may add nothing', () => {
    const g = game({ leader: SHC_LEADER, hand: [ID], deck, ...donArea(1) }, { leader: PLAIN_BLUE });
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  const active = (extra: Parameters<typeof game>[0] = { leader: SHC_LEADER }) =>
    game(
      { stage: ID, characters: [LUFFY_C, SHC.franky4], ...donArea(0, 2), ...extra },
      { leader: PLAIN_BLUE },
    );

  it('[Activate: Main]: rest this Stage to give a rested DON!! to a [Monkey.D.Luffy] Character', () => {
    const g = active();
    const luffy = g.find('p1', 'characters', LUFFY_C);
    g.act({ type: 'activate', card: g.find('p1', 'stage', ID), ability: 'give-don' });
    // Both the Leader (named [Monkey.D.Luffy]) and the Character are offered; Franky is not.
    expectDecision(g, 'choose', 'p1');
    const offered = g.legal().filter((a) => a.type === 'pick');
    expect(offered).toHaveLength(2);
    pick(g, [luffy]);
    expect(g.card(luffy).don).toBe(1);
    expect(don(g, 'p1').rested).toBe(1);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
  });

  it('the Leader named [Monkey.D.Luffy] may receive it too', () => {
    const g = active();
    g.act({ type: 'activate', card: g.find('p1', 'stage', ID), ability: 'give-don' });
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('is not offered once the Stage is rested (cost), and gives nothing with no [Monkey.D.Luffy]', () => {
    const rested = game(
      {
        leader: SHC_LEADER,
        stage: { card: ID, rested: true },
        characters: [LUFFY_C],
        ...donArea(0, 1),
      },
      { leader: PLAIN_BLUE },
    );
    expect(rested.legal().some((a) => a.type === 'activate')).toBe(false);
    // A Leader that is not [Monkey.D.Luffy] and no Luffy Character: the cost is paid, nothing is given.
    const none_ = game(
      { leader: 'ST03-001', stage: ID, characters: [SHC.franky4], ...donArea(0, 1) },
      { leader: PLAIN_BLUE },
    );
    none_.act({ type: 'activate', card: none_.find('p1', 'stage', ID), ability: 'give-don' });
    expect(don(none_, 'p1').rested).toBe(1);
    expect(none_.card(none_.find('p1', 'characters', SHC.franky4)).don).toBe(0);
  });
});
