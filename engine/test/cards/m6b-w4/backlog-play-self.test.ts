/**
 * BACKLOG OP-15 (c): `play { from: 'self' }` plays the source card from the place its text names (the
 * `resolving` slot of a [Trigger], the trash for an [On K.O.]), not from wherever a cost left it
 * (found on OP15-080 Oars, paying a deck-bottom cost with Oars itself). Planted on vanilla cards;
 * each test fails with the check reverted.
 */
import { describe, expect, it } from 'vitest';
import { applyOp, withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, expectDecision, game, PLAIN_BLUE, PLAIN_PURPLE, V } from '../helpers.ts';
import { errorsOf, expectValid } from '../m6b-w1/probe.ts';

const playSelf = { do: { play: { what: { from: 'self', owner: 'you' } } } };

describe('play from self checks where the source is', () => {
  /** An [On K.O.] whose cost puts the card itself (now in the trash) somewhere else, then "play this card". */
  const oars = (to: object) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c2] },
      { leader: PLAIN_BLUE, characters: [BLUE] },
    );
    const onKO = {
      id: 'k',
      kind: 'auto',
      when: ['onKO'],
      cost: [
        {
          move: { from: 'trash', owner: 'you', filter: { isSelf: true }, pick: { exactly: 1 } },
          to,
        },
      ],
      effect: [playSelf],
    } as Ability;
    expectValid([onKO]);
    g.state = withAbilities(g.state, V.c2, [onKO]);
    g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p1', 'characters', V.c2),
      by: 'p2',
    }).state;
    g.act({ type: 'optional', accept: true });
    return g;
  };

  it('a cost that put the card at the deck bottom leaves nothing to play (OP15-080 Oars)', () => {
    const g = oars({ zone: 'deck', position: 'bottom' });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'deck').at(-1)?.card).toBe(V.c2);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
    expectDecision(g, 'main', 'p1');
  });

  it('... and one that put it in the hand', () => {
    const g = oars({ zone: 'hand' });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'hand').some((c) => c.card === V.c2)).toBe(true);
  });

  it('a [Trigger] still plays its own card (the `resolving` slot)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, life: [V.c2, V.c3] },
      { leader: PLAIN_BLUE, characters: [V.c3] },
      { activePlayer: 'p2', turn: 4 },
    );
    const trigger = { id: 't', kind: 'trigger', effect: [playSelf] } as Ability;
    expectValid([trigger]);
    g.state = withAbilities(g.state, V.c2, [trigger]);
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c2]);
  });

  it('an [On K.O.] still plays its own card from the trash', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c2] },
      { leader: PLAIN_BLUE, characters: [BLUE] },
    );
    const onKO = { id: 'k', kind: 'auto', when: ['onKO'], effect: [playSelf] } as Ability;
    expectValid([onKO]);
    g.state = withAbilities(g.state, V.c2, [onKO]);
    g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p1', 'characters', V.c2),
      by: 'p2',
    }).state;
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c2]);
  });

  it('the validator still accepts a [Trigger] and an [On K.O.] shape, and refuses a bad zone', () => {
    expect(
      errorsOf({
        id: 'x',
        kind: 'activate',
        when: 'activateMain',
        effect: [{ do: { play: { what: { from: 'deckTop', owner: 'you' } } } }],
      }),
    ).not.toEqual([]);
  });
});
