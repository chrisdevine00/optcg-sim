/**
 * M6b wave 6, G51: effects your opponent performs. "Your opponent plays up to 1 Character card with
 * a cost of 4 or less from their hand" (OP13-119 Ace) and "your opponent may add 1 DON!! card from
 * their DON!! deck and set it as active" (OP12-075 Ms. All Sunday). The opponent chooses, from their
 * own hand, and the card or DON!! goes to their own field. Planted on vanilla cards; each test fails
 * with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { project, projectEvents } from '@optcg/engine';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  don,
  expectDecision,
  game,
  hand,
  none,
  option,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  times,
  V,
} from '../helpers.ts';
import { errorsOf, main, run } from '../m6b-w1/probe.ts';

const oppHand = (over: object = {}) => ({
  from: 'hand',
  owner: 'opponent',
  chooser: 'opponent',
  filter: { all: [{ category: ['Character'] }, { cost: { lte: 4 } }] },
  pick: { upTo: 1 },
  ...over,
});
const oppPlay = (what: object = oppHand(), over: object = {}) => ({
  do: { play: { what, player: 'opponent', ...over } },
});

/** p1's probe plays for p2; p2 holds a cost 3 and a cost 6 Character. */
const mk = (p2Hand: string[] = [V.c3, V.c6], effect: unknown[] = [oppPlay()]) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [BLUE] },
    { leader: PLAIN_BLUE, hand: p2Hand, characters: [PURPLE] },
  );
  g.state = withAbilities(g.state, BLUE, [main(effect as never)]);
  return g;
};

describe('G51 your opponent plays a card', () => {
  it('validates, and refuses the nonsense', () => {
    main([oppPlay()] as never);
    const bad = (e: unknown) =>
      errorsOf({ id: 'a', kind: 'activate', when: 'activateMain', effect: [e] });
    expect(bad(oppPlay(oppHand({ owner: 'you' })))).not.toEqual([]);
    expect(bad(oppPlay(oppHand({ chooser: 'you' })))).not.toEqual([]);
    expect(bad(oppPlay(oppHand({ chooser: undefined })))).not.toEqual([]);
    expect(bad(oppPlay(oppHand({ from: 'trash' })))).not.toEqual([]);
    expect(bad(oppPlay(oppHand({ pick: undefined })))).not.toEqual([]);
    expect(bad(oppPlay(oppHand(), { player: 'you' }))).not.toEqual([]);
  });

  it('is asked of the opponent, who picks from their own hand within the filter', () => {
    const g = mk();
    run(g);
    expectDecision(g, 'choose', 'p2');
    // The cost 3 Character, not the cost 6.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'hand', V.c3)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([PURPLE, V.c3]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([BLUE]);
    expect(hand(g, 'p2')).toEqual([V.c6]);
    expect(dec(g)?.kind).toBe('main');
    expect(dec(g)?.player).toBe('p1');
  });

  it('is played by the opponent: their [On Play] fires for them, the play is theirs', () => {
    const g = mk();
    g.state = withAbilities(g.state, V.c3, [
      { id: 'o', kind: 'auto', when: ['onPlay'], effect: [{ do: { draw: 1 } }] } as Ability,
    ]);
    const before = hand(g, 'p2').length;
    run(g);
    pick(g, [g.find('p2', 'hand', V.c3)]);
    // They played one card and drew one.
    expect(hand(g, 'p2').length).toBe(before - 1 + 1);
    const played = g.eventsOfType('CardPlayed').pop()!;
    expect(played.player).toBe('p2');
    expect(g.card(g.find('p2', 'characters', V.c3)).owner).toBe('p2');
  });

  it('"up to": they may play nothing', () => {
    const g = mk();
    run(g);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(hand(g, 'p2')).toHaveLength(2);
  });

  it('with no card to play they are still asked, so nothing is told about their hand', () => {
    const g = mk([V.c6, V.c7]);
    run(g);
    expectDecision(g, 'choose', 'p2');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('a full Character area: they trash one of their own first', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, hand: [V.c3], characters: times(5, PURPLE) },
    );
    g.state = withAbilities(g.state, BLUE, [main([oppPlay()] as never)]);
    run(g);
    pick(g, [g.find('p2', 'hand', V.c3)]);
    const d = expectDecision(g, 'choose', 'p2');
    expect(d.purpose).toBe('characterLimit');
  });

  it('is blind to the other player: a hand with a match and one without look the same to them', () => {
    const a = mk([V.c3, V.c6]);
    const b = mk([V.c6, V.c7]);
    run(a);
    run(b);
    expect(JSON.stringify(project(a.state, 'p1').decision)).toBe(
      JSON.stringify(project(b.state, 'p1').decision),
    );
    expect(JSON.stringify(projectEvents(a.events, 'p1'))).toBe(
      JSON.stringify(projectEvents(b.events, 'p1')),
    );
  });
});

describe('G51 your opponent adds a DON!! card', () => {
  /** "Your opponent may add 1 DON!! card from their DON!! deck and set it as active." */
  const mayAdd = {
    chooseOne: [[{ do: { addDon: [{ n: 1, state: 'active' }], player: 'opponent' } }], []],
    chooser: 'opponent',
    labels: ['Add 1 DON!! (active)', 'Do not add'],
  };

  const mkDon = (effect: unknown[] = [mayAdd]) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], costArea: { active: 2, rested: 1 } },
      { leader: PLAIN_BLUE, costArea: { active: 3, rested: 0 }, donDeck: 7 },
    );
    g.state = withAbilities(g.state, BLUE, [main(effect as never)]);
    return g;
  };

  it('validates, and refuses the nonsense', () => {
    main([mayAdd] as never);
    const bad = (e: unknown) =>
      errorsOf({ id: 'a', kind: 'activate', when: 'activateMain', effect: [e] });
    expect(bad({ do: { addDon: [{ n: 1, state: 'active' }], player: 'you' } })).not.toEqual([]);
    expect(bad({ do: { addDon: [{ n: 1, state: 'active' }], player: 'both' } })).not.toEqual([]);
  });

  it('the opponent chooses, and takes the DON!! from their own DON!! deck, active', () => {
    const g = mkDon();
    const p1 = don(g, 'p1');
    run(g);
    const d = expectDecision(g, 'choose', 'p2');
    expect(d.options?.map((o) => o.label)).toEqual(['Add 1 DON!! (active)', 'Do not add']);
    option(g, '0');
    expect(don(g, 'p2').active).toBe(4);
    expect(don(g, 'p2').deck).toBe(6);
    expect(don(g, 'p1')).toEqual(p1);
  });

  it('they may decline', () => {
    const g = mkDon();
    run(g);
    option(g, '1');
    expect(don(g, 'p2').active).toBe(3);
    expect(don(g, 'p2').deck).toBe(7);
  });

  it('a rested DON!! for the opponent is rested', () => {
    const g = mkDon([{ do: { addDon: [{ n: 2, state: 'rested' }], player: 'opponent' } }]);
    run(g);
    expect(don(g, 'p2').rested).toBe(2);
    expect(don(g, 'p2').deck).toBe(5);
    expect(g.eventsOfType('DonPlaced').pop()?.player).toBe('p2');
  });

  it('"up to" asks the opponent how many', () => {
    const g = mkDon([
      { do: { addDon: [{ n: 2, state: 'active', upTo: true }], player: 'opponent' } },
    ]);
    run(g);
    expectDecision(g, 'choose', 'p2');
    option(g, '1');
    expect(don(g, 'p2').active).toBe(4);
  });

  it('with an empty DON!! deck nothing is added and nothing breaks', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, costArea: { active: 10, rested: 0 }, donDeck: 0 },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([{ do: { addDon: [{ n: 1, state: 'active' }], player: 'opponent' } }] as never),
    ]);
    run(g);
    expect(don(g, 'p2').active).toBe(10);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });
});
