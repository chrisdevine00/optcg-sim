/** PRB02-012 Nami. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play, times, V } from './helpers.ts';
import { cardsIn, mk, orderAll, SHC4, trigGame } from './helpers-prbst.ts';

const ID = 'PRB02-012';

describe('PRB02-012 Nami', () => {
  // Top 5: a Straw Hat Crew card, another [Nami], a plain card, a {FILM}{Straw Hat Crew} card, a
  // plain card; the 6th is a Straw Hat Crew card too.
  const FILM = 'OP02-028';
  const top5 = [SHC4, ID, V.c1, FILM, V.c2];
  const deck = [...top5, SHC4, ...times(4, BLUE)];

  it('[On Play]: looks at 5 and offers "Straw Hat Crew" cards other than [Nami]', () => {
    const g = mk({ hand: [ID], deck });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(offered.sort()).toEqual([g.find('p1', 'deck', SHC4), g.find('p1', 'deck', FILM)].sort());
    pick(g, [g.find('p1', 'deck', FILM)]);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([FILM]);
    const d = cardsIn(g, 'p1', 'deck');
    expect(d[0]).toBe(SHC4); // the 6th card was not looked at
    expect(d.slice(-4).sort()).toEqual([SHC4, ID, V.c1, V.c2].sort());
  });

  it('"up to 1": may take nothing; all 5 go to the bottom', () => {
    const g = mk({ hand: [ID], deck });
    play(g, ID);
    none(g);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsIn(g, 'p1', 'deck').slice(-5).sort()).toEqual([...top5].sort());
  });

  it('[Trigger]: plays this card when it is the revealed Life card and the player activates it', () => {
    const g = trigGame(ID);
    expectDecision(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: true });
    expect(cardsIn(g, 'p1', 'characters')).toContain(ID);
  });

  it('[Trigger] declined: the card goes to the hand and is not played', () => {
    const g = trigGame(ID);
    g.act({ type: 'trigger', activate: false });
    expect(cardsIn(g, 'p1', 'characters')).not.toContain(ID);
    expect(hand(g, 'p1')).toContain(ID);
  });
});
