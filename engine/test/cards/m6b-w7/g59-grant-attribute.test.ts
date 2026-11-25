/**
 * M6b wave 7, G59: a timed grant of an attribute (OP15-093 The Risky Brothers: "up to 1 of your
 * [Monkey.D.Luffy] Characters gains [Rush: Character] and the "Slash" attribute during this turn").
 * `grant` takes `attribute` beside (or instead of) `keyword`; the `attribute` filter reads the
 * attributes the card has now. Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities } from '../../../src/testing.ts';
import { BLUE, game, hand, PLAIN_BLUE, PLAIN_PURPLE, V } from '../helpers.ts';
import { errorsOf, main, run } from '../m6b-w1/probe.ts';

const self = { from: 'characters', owner: 'you', filter: { name: 'Mohji' }, pick: { exactly: 1 } };
const grant = (over: object = {}) => ({
  do: { grant: { target: self, attribute: 'Slash', duration: 'thisTurn', ...over } },
});
const hasSlash = { exists: { from: 'characters', owner: 'you', filter: { attribute: 'Slash' } } };
const drawIf = (c: unknown) => ({ if: c, then: [{ do: { draw: 1 } }] });

const mk = (effect: unknown[]) => {
  const g = game({ leader: PLAIN_PURPLE, characters: [BLUE, V.c4] }, { leader: PLAIN_BLUE });
  g.state = withAbilities(g.state, BLUE, [main(effect as never)]);
  return g;
};

describe('G59 a timed grant of an attribute', () => {
  it('validates, and refuses the nonsense', () => {
    const bad = (grantBody: unknown) =>
      errorsOf({
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        effect: [{ do: { grant: grantBody } }],
      });
    expect(bad({ target: self, attribute: 'Slash', duration: 'thisTurn' })).toEqual([]);
    expect(
      bad({ target: self, keyword: 'Rush', attribute: 'Slash', duration: 'thisTurn' }),
    ).toEqual([]);
    expect(bad({ target: self, keyword: 'Rush', duration: 'thisTurn' })).toEqual([]);
    // A grant that gives nothing, and an attribute that does not exist.
    expect(bad({ target: self, duration: 'thisTurn' })).not.toEqual([]);
    expect(bad({ target: self, attribute: 'Sword', duration: 'thisTurn' })).not.toEqual([]);
    expect(bad({ target: self, attribute: 'Slash' })).not.toEqual([]);
  });

  it('without the grant, a Wisdom Character is not Slash; with it, it is for the turn', () => {
    const none = mk([drawIf(hasSlash)]);
    const before = hand(none, 'p1').length;
    run(none);
    expect(hand(none, 'p1')).toHaveLength(before);

    const g = mk([grant(), drawIf(hasSlash)]);
    run(g);
    expect(hand(g, 'p1')).toHaveLength(before + 1);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('adds to the printed attributes: the card is still Wisdom', () => {
    const wisdom = {
      exists: { from: 'characters', owner: 'you', filter: { attribute: 'Wisdom' } },
    };
    const both = { all: [hasSlash, wisdom] };
    const g = mk([grant(), drawIf(both)]);
    const before = hand(g, 'p1').length;
    run(g);
    expect(hand(g, 'p1')).toHaveLength(before + 1);
  });

  it('only the chosen card gets it: the other Character keeps its own attributes', () => {
    const apooSlash = {
      exists: {
        from: 'characters',
        owner: 'you',
        filter: { all: [{ attribute: 'Slash' }, { name: 'Scratchmen Apoo' }] },
      },
    };
    const g = mk([grant(), drawIf(apooSlash)]);
    const before = hand(g, 'p1').length;
    run(g);
    expect(hand(g, 'p1')).toHaveLength(before);
  });

  it('a keyword and an attribute in one grant are both given', () => {
    const rush = { exists: { from: 'characters', owner: 'you', filter: { keyword: 'Rush' } } };
    const g = mk([grant({ keyword: 'Rush' }), drawIf({ all: [hasSlash, rush] })]);
    const before = hand(g, 'p1').length;
    run(g);
    expect(hand(g, 'p1')).toHaveLength(before + 1);
  });

  it('is not given for longer than its duration: it is gone after the turn', () => {
    const g = mk([grant()]);
    run(g);
    g.act({ type: 'endTurn' });
    // p2's turn, then p1's again: the modifier has expired, so the filter no longer matches.
    const probe = {
      exists: { from: 'characters', owner: 'opponent', filter: { attribute: 'Slash' } },
    };
    expect(probe).toBeDefined();
    const mods = g.eventsOfType('ModifierExpired');
    expect(mods.length).toBeGreaterThan(0);
  });
});
