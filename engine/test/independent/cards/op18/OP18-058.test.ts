/**
 * OP18-058 This Kingdom is Doomed. You Can't Save It! (Event, Blue, cost 3, {The Seven Warlords of
 * the Sea}/{Baroque Works}).
 *
 * Card text (cards/data):
 *   "[Main] You may return 1 of your Characters to the owner's hand: Place up to 1 Character with a
 *    cost of 4 or less at the bottom of the owner's deck.
 *    [Trigger] Activate this card's [Main] effect."
 *
 * Rules: the cost (return one of MY Characters to my hand) is optional and all-or-nothing; the
 * target is any Character with cost 4 or less, placed at the bottom of ITS owner's deck; "up to 1"
 * may pick none; [Trigger] activates the [Main] effect for free when the card is revealed from Life
 * (CR 10-1-5-?; its cost part is still paid).
 *
 * Scenery: OP01-018 Hajrudin (cost 4, 6000), OP02-006 Kingdew (cost 5, 7000), OP01-012 Sai (cost 2),
 * OP01-023 Marco (cost 3): vanilla.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, attack, passBlock, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  cardIds,
  CH,
  choices,
  decline,
  fill,
  kind,
  LDR,
  mine,
  need,
  offered,
  RED,
  side,
  theirTurn,
  VAN,
} from './kit-d.ts';

const DOOMED = 'OP18-058';
const CROC = 'ST03-001';

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}): TestGame {
  return mine(
    CROC,
    { hand: [DOOMED], characters: [VAN.sai, VAN.marco], deck: fill('OP02-060', 8), ...p1 },
    { characters: [CH.hajrudin4, CH.kingdew5], deck: fill(VAN.sunny, 8), ...p2 },
  );
}

/** Play the Event, accept the cost and return `ret` (my Character) to my hand. */
function pay(g: TestGame, ret: string) {
  const r = g.find('p1', 'characters', ret);
  play(g, g.find('p1', 'hand', DOOMED));
  need(g, 'optional', 'p1');
  accept(g);
  need(g, 'choose', 'p1');
  act(g, { type: 'pick', choice: r });
}

describe('OP18-058 This Kingdom is Doomed: [Main] you may return 1 of your Characters to hand: bottom-deck a Character (cost 4 or less)', () => {
  it('returns my Character to my hand and places the chosen opposing Character at the bottom of its owner’s deck', () => {
    const g = game();
    pay(g, VAN.sai);
    expect(cardIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p2', 'characters', CH.hajrudin4) });
    expect(cardIds(g, 'p2', 'characters')).toEqual([CH.kingdew5]);
    expect(cardIds(g, 'p2', 'deck').slice(-1)).toEqual([CH.hajrudin4]);
    expect(cardIds(g, 'p2', 'deck')).toHaveLength(9);
    expect(kind(g)).toBe('main');
  });

  it('cost boundary: cost 4 is offered, cost 5 is not', () => {
    const g = game();
    pay(g, VAN.sai);
    expect(choices(g)).toContain(g.find('p2', 'characters', CH.hajrudin4));
    expect(choices(g)).not.toContain(g.find('p2', 'characters', CH.kingdew5));
  });

  it('my other Character is a legal target too and goes to the bottom of my deck', () => {
    const g = game();
    pay(g, VAN.sai);
    expect(choices(g)).toContain(g.find('p1', 'characters', VAN.marco));
    act(g, { type: 'pick', choice: g.find('p1', 'characters', VAN.marco) });
    expect(cardIds(g, 'p1', 'deck').slice(-1)).toEqual([VAN.marco]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('the returned Character is no longer a target (it is already in my hand)', () => {
    const g = game();
    pay(g, VAN.sai);
    expect(choices(g)).toHaveLength(2);
    expect(
      choices(g)
        .map((i) => g.card(i).card)
        .sort(),
    ).toEqual([CH.hajrudin4, VAN.marco].sort());
  });

  it('"up to 1": picking none places nothing; the Character stays returned (the cost was paid)', () => {
    const g = game();
    pay(g, VAN.sai);
    act(g, { type: 'done' });
    expect(cardIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('declining the cost: no Character is returned and nothing is placed', () => {
    const g = game();
    play(g, g.find('p1', 'hand', DOOMED));
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(cardIds(g, 'p1', 'characters')).toHaveLength(2);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(2);
    expect(kind(g)).toBe('main');
  });

  it('with no Character of mine the cost cannot be paid', () => {
    const g = game({ characters: [] });
    play(g, g.find('p1', 'hand', DOOMED));
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(2);
  });
});

describe('OP18-058 This Kingdom is Doomed: [Trigger] activate this card’s [Main] effect', () => {
  it('revealed from Life by an attack: the [Main] effect can be used for free (return my Character, bottom-deck theirs)', () => {
    const g = theirTurn(
      side(CROC, 'OP02-060', { life: [DOOMED, 'OP02-060', 'OP02-060'], characters: [VAN.sai] }),
      side(LDR.luffy, RED, { characters: [VAN.hajrudin, CH.hajrudin4], deck: fill(VAN.sunny, 8) }),
    );
    const sai = g.find('p1', 'characters', VAN.sai);
    attack(g, g.find('p2', 'characters', VAN.hajrudin), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p1');
    act(g, { type: 'trigger', activate: true });
    need(g, 'optional', 'p1');
    accept(g);
    // Mr. Sai is my only Character: paying with it may be automatic.
    if (cardIds(g, 'p1', 'characters').length) act(g, { type: 'pick', choice: sai });
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p2', 'characters', CH.hajrudin4, 0) });
    expect(cardIds(g, 'p1', 'hand')).toContain(VAN.sai);
    expect(cardIds(g, 'p2', 'deck').slice(-1)).toEqual([CH.hajrudin4]);
    expect(cardIds(g, 'p1', 'trash')).toContain(DOOMED);
  });
});
