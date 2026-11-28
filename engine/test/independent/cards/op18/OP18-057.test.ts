/**
 * OP18-057 Atomic Dicer (Event, Blue, cost 1, {Baroque Works}).
 *
 * Card text (cards/data):
 *   "[Main] You may rest 3 of your DON!! cards: Return up to 1 Character with a cost of 5 or less
 *    to the owner's hand.
 *    [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: [Main] is an optional cost-effect (CR 8-3-1): the cost is 3 more active DON!! beyond the
 * 1 to play the Event; the target is any Character (either side) with cost 5 or less; "up to 1"
 * may pick none. [Counter] boosts only my Leader, for this battle (CR 7-1-3-2).
 *
 * Scenery: OP02-006 Kingdew (cost 5, 7000), OP02-007 Thatch (cost 6, 8000), OP01-012 Sai (cost 2),
 * OP01-018 Hajrudin (cost 4, 6000), all vanilla. ST03-001 Crocodile is the Leader.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, attack, passBlock, passCounter, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  canCounterWith,
  cardIds,
  CH,
  choices,
  decline,
  donOf,
  eventCounterTargets,
  kind,
  LDR,
  mine,
  need,
  offered,
  RED,
  side,
  theirTurn,
  useCounter,
  VAN,
} from './kit-d.ts';

const DICER = 'OP18-057';
const CROC = 'ST03-001';

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}): TestGame {
  return mine(
    CROC,
    { hand: [DICER], characters: [VAN.sai], costArea: { active: 6, rested: 0 }, ...p1 },
    p2,
  );
}

function start(g: TestGame) {
  play(g, g.find('p1', 'hand', DICER));
  need(g, 'optional', 'p1');
  accept(g);
}

describe('OP18-057 Atomic Dicer: [Main] you may rest 3 DON!!: return up to 1 Character (cost 5 or less) to its owner’s hand', () => {
  it('rests 3 DON!! (plus 1 for the Event) and returns the chosen opposing Character to its owner’s hand', () => {
    const g = game({}, { characters: [CH.kingdew5] });
    start(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p2', 'characters', CH.kingdew5) });
    expect(cardIds(g, 'p2', 'hand')).toEqual([CH.kingdew5]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 4 });
    expect(cardIds(g, 'p1', 'trash')).toEqual([DICER]);
    expect(kind(g)).toBe('main');
  });

  it('cost boundary: cost 5 is offered, cost 6 (Thatch) is not', () => {
    const g = game({}, { characters: [CH.kingdew5, CH.thatch6] });
    start(g);
    expect(choices(g)).toContain(g.find('p2', 'characters', CH.kingdew5));
    expect(choices(g)).not.toContain(g.find('p2', 'characters', CH.thatch6));
  });

  it('"Character" is not limited to the opponent’s: my own Character can be returned to my hand', () => {
    const g = game();
    start(g);
    expect(choices(g)).toContain(g.find('p1', 'characters', VAN.sai));
    act(g, { type: 'pick', choice: g.find('p1', 'characters', VAN.sai) });
    expect(cardIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
  });

  it('"up to 1": picking none returns nothing, the 3 DON!! stay rested', () => {
    const g = game({}, { characters: [CH.kingdew5] });
    start(g);
    act(g, { type: 'done' });
    expect(cardIds(g, 'p2', 'characters')).toEqual([CH.kingdew5]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 4 });
  });

  it('declining the cost: nothing is rested beyond the Event’s own cost and nothing is returned', () => {
    const g = game({}, { characters: [CH.kingdew5] });
    play(g, g.find('p1', 'hand', DICER));
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([CH.kingdew5]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 1 });
  });

  it('with fewer than 3 active DON!! left after paying 1, the cost cannot be paid', () => {
    const g = game({ costArea: { active: 3, rested: 0 } }, { characters: [CH.kingdew5] });
    play(g, g.find('p1', 'hand', DICER));
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(cardIds(g, 'p2', 'characters')).toEqual([CH.kingdew5]);
  });
});

describe('OP18-057 Atomic Dicer: [Counter] your Leader gains +3000 power during this battle', () => {
  /** p2's Hajrudin (6000) attacks p1's Crocodile Leader (5000); p1 holds the Event with 1 active DON!!. */
  function attacked(): TestGame {
    const g = theirTurn(
      side(CROC, 'OP02-060', {
        hand: [DICER],
        characters: [VAN.sai],
        costArea: { active: 1, rested: 0 },
      }),
      side(LDR.luffy, RED, { characters: [VAN.hajrudin] }),
    );
    attack(g, g.find('p2', 'characters', VAN.hajrudin), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('the Leader is 8000 for the battle and the 6000 attack does not damage it', () => {
    const g = attacked();
    const event = g.find('p1', 'hand', DICER);
    expect(canCounterWith(g, event)).toBe(true);
    useCounter(g, event, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(8000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(cardIds(g, 'p1', 'trash')).toEqual([DICER]);
  });

  it('it only boosts the Leader: a Character is not an available target', () => {
    const g = attacked();
    const targets = eventCounterTargets(g, g.find('p1', 'hand', DICER));
    // Either the target is fixed (no question) or the only offered target is the Leader.
    expect(targets.filter((t) => t !== g.leader('p1'))).toEqual([]);
  });

  it('without the Counter the same attack damages the Leader (control)', () => {
    const g = attacked();
    passCounter(g);
    expect(g.life('p1')).toBe(3);
    expect(cardIds(g, 'p1', 'hand')).toContain(DICER);
  });

  it('the Event cannot be used as a Counter without 1 active DON!! to pay its cost', () => {
    const g = theirTurn(
      side(CROC, 'OP02-060', { hand: [DICER], costArea: { active: 0, rested: 1 } }),
      side(LDR.luffy, RED, { characters: [VAN.hajrudin] }),
    );
    attack(g, g.find('p2', 'characters', VAN.hajrudin), g.leader('p1'));
    passBlock(g);
    expect(canCounterWith(g, g.find('p1', 'hand', DICER))).toBe(false);
  });
});
