/** ST33-005 Monkey.D.Garp (Character). */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, hand, pick, play, PLAIN_BLUE } from './helpers.ts';
import { idsOf, NAVY, NAVY_LEADER, offers, SUPERNOVAS_LEADER } from './helpers-stg2.ts';

const ID = 'ST33-005';
const start = (leader: string, cards: string[]) =>
  game(
    { leader, hand: [ID, ...cards], costArea: { active: 6, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('ST33-005 Monkey.D.Garp', () => {
  it('[On Play] with a {Navy} Leader: plays a blue {Navy} Character with 8000 power (boundary) from hand', () => {
    const g = start(NAVY_LEADER, [NAVY.jango]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', NAVY.jango)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID, NAVY.jango]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('10000 power, a non-blue {Navy} Character and another [Monkey.D.Garp] are not candidates', () => {
    const g = start(NAVY_LEADER, [NAVY.giant, NAVY.doberman, ID, NAVY.fullbody]);
    play(g, ID);
    expect(new Set(offers(g))).toEqual(new Set([g.find('p1', 'hand', NAVY.fullbody)]));
  });

  it('with a Leader that is not {Navy} nothing happens', () => {
    const g = start(SUPERNOVAS_LEADER, [NAVY.fullbody]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([NAVY.fullbody]);
  });

  it('"up to 1": may be skipped', () => {
    const g = start(NAVY_LEADER, [NAVY.fullbody]);
    play(g, ID);
    g.act({ type: 'done' });
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([NAVY.fullbody]);
  });

  it('with no candidate in hand the effect ends without a prompt', () => {
    const g = start(NAVY_LEADER, [NAVY.giant]);
    play(g, ID);
    // The engine still shows the empty "up to 1" choice (min 0, max 0): only `done` is legal.
    expect(g.legal().filter((a) => a.type === 'pick')).toEqual([]);
    g.act({ type: 'done' });
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([NAVY.giant]);
  });
});
