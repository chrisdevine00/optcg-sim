/** OP11-102 Camie. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { withAbilities, type Ability } from '../../src/testing.ts';
import {
  BLUE,
  dec,
  endCounter,
  expectDecision,
  game,
  hand,
  passBlock,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { COUNTER_EVENT, ids } from './helpers-w6c2.ts';
import { acceptUse, declineUse } from './helpers-w57.ts';

const ID = 'OP11-102';
const trigger = { id: 't', kind: 'trigger', effect: [{ do: { draw: 1 } }] } as Ability;

/** p1 (Camie on the field) attacks p2's Leader; p2 holds a [Counter] Event and 3 active DON!!. */
const mk = (p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) => {
  const g = game(
    {
      leader: PLAIN_PURPLE,
      characters: [ID],
      life: [V.c2, V.c3, V.c4],
      costArea: { active: 3, rested: 0 },
      ...p1,
    },
    {
      leader: PLAIN_BLUE,
      hand: [COUNTER_EVENT, COUNTER_EVENT],
      life: [PURPLE, BLUE, V.c1],
      costArea: { active: 3, rested: 0 },
      ...p2,
    },
  );
  g.state = withAbilities(g.state, PURPLE, [trigger]);
  g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
  if (dec(g)?.kind === 'block') passBlock(g);
  return g;
};
const counterOnly = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'activate', card: g.find('p2', 'hand', COUNTER_EVENT), ability: 'counter' });
/** The Event, then yes to the optional use ("This effect can be activated when ...", W57-R5). */
const counter = (g: ReturnType<typeof mk>) => {
  counterOnly(g);
  acceptUse(g, ID);
};

describe('OP11-102 Camie', () => {
  it('when the opponent activates an Event on your turn, the top Life card of each player is trashed', () => {
    const g = mk();
    expectDecision(g, 'counter', 'p2');
    counter(g);
    expect(g.zone('p1', 'life').map((c) => c.card)).toEqual([V.c3, V.c4]);
    expect(g.zone('p2', 'life').map((c) => c.card)).toEqual([BLUE, V.c1]);
    expect(trash(g, 'p1')).toEqual([V.c2]);
    expect(trash(g, 'p2')).toContain(PURPLE);
    // Not damage: no [Trigger] was asked for the trashed top card.
    expect(g.eventsOfType('TriggerRevealed')).toHaveLength(0);
  });

  it('[Once Per Turn]: a second Event the same turn trashes nothing more', () => {
    const g = mk({}, { life: [PURPLE, BLUE, V.c1, V.c1] });
    counter(g);
    expect(g.zone('p2', 'life')).toHaveLength(3);
    expectDecision(g, 'counter', 'p2');
    counter(g);
    expect(g.zone('p2', 'life')).toHaveLength(3);
    expect(g.zone('p1', 'life')).toHaveLength(2);
  });

  it('W57-R5: "can be activated" is optional: declining trashes no Life card and does not spend the Once Per Turn', () => {
    const g = mk({}, { life: [PURPLE, BLUE, V.c1, V.c1] });
    counterOnly(g);
    declineUse(g, ID);
    expect(g.zone('p1', 'life')).toHaveLength(3);
    expect(g.zone('p2', 'life')).toHaveLength(4);
    expectDecision(g, 'counter', 'p2');
    counterOnly(g);
    expect(acceptUse(g, ID)).toBe(true);
    expect(g.zone('p1', 'life')).toHaveLength(2);
    expect(g.zone('p2', 'life')).toHaveLength(3);
  });

  it('needs 2 or more Life cards for the opponent: at 2 it fires (to 1), at 1 nothing happens', () => {
    const two = mk({}, { life: [PURPLE, BLUE] });
    counter(two);
    expect(two.zone('p2', 'life')).toHaveLength(1);
    expect(two.zone('p1', 'life')).toHaveLength(2);

    const one = mk({}, { life: [PURPLE] });
    counter(one);
    expect(one.zone('p2', 'life')).toHaveLength(1);
    expect(one.zone('p1', 'life')).toHaveLength(3);
    expect(one.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('with no Life of your own only the opponent’s top Life card is trashed', () => {
    const g = mk({ life: [] });
    counter(g);
    expect(g.zone('p1', 'life')).toHaveLength(0);
    expect(g.zone('p2', 'life')).toHaveLength(2);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('an activated [Trigger] counts, after the [Trigger] resolved; a declined one does not', () => {
    // p1's Leader hits p2's Leader and p2 activates the [Trigger] (draw 1).
    const g = mk();
    endCounter(g);
    expectDecision(g, 'trigger', 'p2');
    const handBefore = hand(g, 'p2').length;
    g.act({ type: 'trigger', activate: true });
    acceptUse(g, ID);
    // The [Trigger] drew; then 3 - 1 (damage) = 2 Life cards were left: Camie fires.
    expect(hand(g, 'p2').length).toBe(handBefore + 1);
    expect(g.zone('p2', 'life')).toHaveLength(1);
    expect(g.zone('p1', 'life')).toHaveLength(2);

    const declined = mk();
    endCounter(declined);
    declined.act({ type: 'trigger', activate: false });
    expect(declined.zone('p2', 'life')).toHaveLength(2);
    expect(declined.zone('p1', 'life')).toHaveLength(3);
    expect(hand(declined, 'p2')).toContain(PURPLE);
  });

  it('does not fire for your own Event, nor on the opponent’s turn', () => {
    // p1's own Event in its Main Phase (a planted [Main] on the counter Event).
    const own = game(
      {
        leader: PLAIN_PURPLE,
        characters: [ID],
        hand: [COUNTER_EVENT],
        life: [V.c2, V.c3, V.c4],
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_BLUE, life: [PURPLE, BLUE, V.c1] },
    );
    own.state = withAbilities(own.state, COUNTER_EVENT, [
      { id: 'm', kind: 'activate', when: 'main', effect: [{ do: { draw: 1 } }] } as Ability,
    ]);
    own.act({ type: 'playCard', card: own.find('p1', 'hand', COUNTER_EVENT) });
    expect(own.zone('p1', 'life')).toHaveLength(3);
    expect(own.zone('p2', 'life')).toHaveLength(3);

    // On p2's turn p1 counters with an Event: [Your Turn] is false.
    const theirs = game(
      {
        leader: PLAIN_PURPLE,
        characters: [ID],
        hand: [COUNTER_EVENT],
        life: [V.c2, V.c3, V.c4],
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c5], life: [PURPLE, BLUE, V.c1] },
      { turn: 4, activePlayer: 'p2' },
    );
    theirs.act({
      type: 'attack',
      attacker: theirs.find('p2', 'characters', V.c5),
      target: theirs.leader('p1'),
    });
    passBlock(theirs);
    theirs.act({
      type: 'activate',
      card: theirs.find('p1', 'hand', COUNTER_EVENT),
      ability: 'counter',
    });
    expect(theirs.zone('p1', 'life')).toHaveLength(3);
    expect(theirs.zone('p2', 'life')).toHaveLength(3);
    expect(ids(theirs, 'p1', 'trash')).toEqual([COUNTER_EVENT]);
  });
});
