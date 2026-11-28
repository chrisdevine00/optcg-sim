/**
 * OP18-045 Mr.Prince (Character, Blue, cost 3, 4000, Counter +2000, {Alabasta}/{Straw Hat Crew}).
 *
 * Card text (cards/data):
 *   "Also treat this card's name as [Sanji] according to the rules.
 *    This Character gains +1000 power for every 5 Events in your trash."
 *
 * Rules: the static power is floor(Events in my trash / 5) * 1000, counted continuously on either
 * turn; only Event cards in MY trash count. The extra name [Sanji] is read by card effects that
 * look for a name (OP12-071 Charlotte Pudding: "reveal up to 1 [Sanji] or Event card").
 *
 * Scenery: ST01-014 Guard Point (Red Event, cost 1); OP01-012 Sai (Character); OP12-071 Charlotte
 * Pudding (Yellow, cost 1): [On Play] look at 4, reveal up to 1 [Sanji] or Event card.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  cardIds,
  accept,
  choose,
  LEAD,
  offered,
  payDon,
  playCard,
  choiceCards,
  fill,
  kind,
  LDR,
  mine,
  need,
  RED,
  side,
  theirTurn,
  VAN,
} from './kit-d.ts';

const PRINCE = 'OP18-045';
const EVENT = 'ST01-014';
const PUDDING = 'OP12-071';

function game(trash: string[], p2: Partial<PlayerSpec> = {}): TestGame {
  return mine(LDR.luffy, { characters: [PRINCE], trash }, p2);
}

const power = (g: TestGame) => g.power(g.find('p1', 'characters', PRINCE));

describe('OP18-045 Mr.Prince: +1000 power for every 5 Events in your trash', () => {
  it('with no Event in the trash it has its printed 4000', () => {
    expect(power(game([]))).toBe(4000);
  });

  it('4 Events: still 4000; 5 Events: 5000 (boundary)', () => {
    expect(power(game(fill(EVENT, 4)))).toBe(4000);
    expect(power(game(fill(EVENT, 5)))).toBe(5000);
  });

  it('9 Events: 5000; 10 Events: 6000 (every 5, not every Event)', () => {
    expect(power(game(fill(EVENT, 9)))).toBe(5000);
    expect(power(game(fill(EVENT, 10)))).toBe(6000);
  });

  it('only Events count: 5 Characters in the trash give nothing; 3 Characters + 5 Events give +1000', () => {
    expect(power(game(fill(VAN.sai, 5)))).toBe(4000);
    expect(power(game([...fill(VAN.sai, 3), ...fill(EVENT, 5)]))).toBe(5000);
  });

  it('only my trash: 5 Events in the opponent’s trash give nothing', () => {
    const g = game([], { trash: fill(EVENT, 5) });
    expect(power(g)).toBe(4000);
  });

  it('it applies on the opponent’s turn too (no [Your Turn] restriction)', () => {
    const g = theirTurn(
      side(LDR.luffy, RED, { characters: [PRINCE], trash: fill(EVENT, 5) }),
      side(LDR.luffy, RED),
    );
    expect(power(g)).toBe(5000);
  });

  it('it is a continuing effect: the 5th Event arriving in the trash (a played Main Event) raises it at once', () => {
    // OP09-077 Gum-Gum Lightning (Purple Event, cost 2): [Main] DON!! -2: K.O. up to 1 Character with 6000 power or less.
    const g = mine(
      LEAD.kaido,
      {
        characters: [PRINCE],
        trash: fill(EVENT, 4),
        hand: ['OP09-077'],
        costArea: { active: 5, rested: 0 },
      },
      { characters: [VAN.hajrudin] },
    );
    expect(power(g)).toBe(4000);
    playCard(g, 'OP09-077');
    if (offered(g, 'p1')) accept(g);
    payDon(g, 2);
    choose(g, [g.find('p2', 'characters', VAN.hajrudin)]);
    expect(cardIds(g, 'p1', 'trash').filter((c) => c === 'OP09-077' || c === EVENT)).toHaveLength(
      5,
    );
    expect(power(g)).toBe(5000);
  });
});

describe('OP18-045 Mr.Prince: its name is also [Sanji]', () => {
  const look = (top: string) => {
    const g = mine(LDR.luffy, {
      hand: [PUDDING],
      deck: [top, VAN.sai, VAN.marco, VAN.kingdew, VAN.thatch, VAN.thatch],
    });
    play(g, g.find('p1', 'hand', PUDDING));
    return g;
  };

  it('a card looking for [Sanji] (OP12-071 Pudding) offers Mr.Prince from the top of the deck', () => {
    const g = look(PRINCE);
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).toEqual([PRINCE]);
    act(g, { type: 'pick', choice: g.find('p1', 'deck', PRINCE) });
    expect(cardIds(g, 'p1', 'hand')).toEqual([PRINCE]);
  });

  it('control: a Character with no Sanji name and no Event type is not offered by the same look', () => {
    const g = look(VAN.gordon);
    if (kind(g) === 'choose') expect(choiceCards(g)).toEqual([]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
  });
});
