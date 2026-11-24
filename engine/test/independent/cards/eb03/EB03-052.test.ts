/**
 * EB03-052 Shirahoshi (Character, Yellow, cost 3, 0 power, Counter +1000, {Merfolk}/{Fish-Man Island}).
 *
 * Card text: "[Activate: Main] You may trash this Character: If your Leader is [Shirahoshi], add 1
 * card from the top of your deck to the top of your Life cards. Then, all of your {Neptunian} type
 * Characters gain +1000 power during this turn."
 *
 * Rules: CR 8-3-1 (the cost is paid whatever the "If" says), CR 4-10-1 and M4b-5 (a "Then" after a
 * failed "If" does not resolve), CR 3-10 (cards added to Life are face-down), "during this turn"
 * ends with the turn, [Activate: Main] has no summoning sickness (CR 3-7-4 concerns attacks only).
 * Scenery: OP11-022 Shirahoshi (Leader, named [Shirahoshi]); OP11-033 Bird Neptunian (Green, cost 6,
 * 7000, {Neptunian}, vanilla); OP11-026 Scaled Neptunian (cost 6, 8000, {Neptunian}, vanilla).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  activate,
  BLUE,
  C14,
  canActivate,
  chars,
  deck,
  LB,
  mine,
  need,
  put,
  trash,
  atMain,
} from './kit-eb03b.ts';

const ID = 'EB03-052';
const BIRD = 'OP11-033'; // {Neptunian}, cost 6, 7000, vanilla
const SCALED = 'OP11-026'; // {Neptunian}, cost 6, 8000, vanilla
const MARCO = C14.marco; // not {Neptunian}, 5000
const TOP = 'OP01-018'; // a distinctive deck-top card

function start(o: {
  leader?: string;
  mine?: string[];
  hand?: string[];
  p2?: string[];
  life?: string[];
}) {
  return mine(
    o.leader ?? LB.shirahoshi,
    {
      hand: o.hand ?? [],
      characters: [ID, ...(o.mine ?? [])],
      deck: [TOP, BLUE, BLUE, BLUE],
      life: o.life ?? [BLUE, BLUE, BLUE],
    },
    { characters: o.p2 ?? [] },
  );
}

function use(g: ReturnType<typeof start>) {
  activate(g, g.find('p1', 'characters', ID));
}

describe('EB03-052 Shirahoshi: [Activate: Main] trash this Character: with a [Shirahoshi] Leader, add the top deck card to Life, then my {Neptunian} Characters gain +1000 this turn', () => {
  it('with a [Shirahoshi] Leader: the top card of the deck goes on top of my Life and every {Neptunian} Character gains +1000', () => {
    const g = start({ mine: [BIRD, SCALED, MARCO] });
    use(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g).sort()).toEqual([BIRD, MARCO, SCALED].sort());
    expect(trash(g)).toEqual([ID]);
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life')[0]!.card).toBe(TOP);
    expect(deck(g)).toHaveLength(3);
    expect(g.power(g.find('p1', 'characters', BIRD))).toBe(8000);
    expect(g.power(g.find('p1', 'characters', SCALED))).toBe(9000);
    expect(g.power(g.find('p1', 'characters', MARCO))).toBe(5000);
  });

  it('the Life card is added face-down', () => {
    const g = start({});
    use(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
  });

  it('with another Leader: the Character is still trashed (cost), but no card is added to Life and nothing is boosted', () => {
    const g = start({ leader: LB.luffy, mine: [BIRD] });
    use(g);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([ID]);
    expect(g.life('p1')).toBe(3);
    expect(deck(g)).toHaveLength(4);
    expect(g.power(g.find('p1', 'characters', BIRD))).toBe(7000);
  });

  it('the "If your Leader is [Shirahoshi]" is checked when the effect resolves, not when it is activated: the ability is offered with any Leader', () => {
    const g = start({ leader: LB.luffy });
    expect(canActivate(g, g.find('p1', 'characters', ID))).toBe(true);
  });

  it("the boost is for this turn only: gone on the opponent's turn", () => {
    const g = start({ mine: [BIRD] });
    use(g);
    expect(g.power(g.find('p1', 'characters', BIRD))).toBe(8000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(g.find('p1', 'characters', BIRD))).toBe(7000);
  });

  it("only my own {Neptunian} Characters: the opponent's are not boosted, and neither is a {Neptunian} Leader's own power", () => {
    const g = start({ p2: [BIRD] });
    use(g);
    expect(g.power(g.find('p2', 'characters', BIRD))).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"all of your {Neptunian} Characters" means the ones in play when it resolves: one played afterwards is not boosted', () => {
    const g = start({ mine: [BIRD], hand: [BIRD] });
    use(g);
    put(g, BIRD);
    expect(atMain(g)).toBe(true);
    const powers = g
      .zone('p1', 'characters')
      .filter((c) => c.card === BIRD)
      .map((c) => g.power(c.instance))
      .sort();
    expect(powers).toEqual([7000, 8000]);
  });

  it('it can be activated the turn it was played (no summoning sickness for [Activate: Main])', () => {
    const g = mine(LB.shirahoshi, {
      characters: [{ card: ID, playedThisTurn: true }],
      deck: [TOP, BLUE, BLUE],
      life: [BLUE, BLUE],
    });
    expect(canActivate(g, g.find('p1', 'characters', ID))).toBe(true);
    use(g);
    expect(g.life('p1')).toBe(3);
  });

  it('it is not offered when it is not in play (in hand it has no [Activate: Main])', () => {
    const g = mine(LB.shirahoshi, { hand: [ID], deck: [TOP, BLUE] });
    expect(
      g.legal().some((a) => a.type === 'activate' && a.card === g.find('p1', 'hand', ID)),
    ).toBe(false);
  });
});
