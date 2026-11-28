/**
 * OP18-081 Oars (Character, Black, cost 10, 11000, {Giant}/{Thriller Bark Pirates}).
 *
 * Card text (cards/data):
 *   "If you have a [Gecko Moria] Character, this Character gains [Double Attack] and [Blocker].
 *    [Trigger] Play up to 1 {Thriller Bark Pirates} type Character card with a cost of 4 or less
 *    from your trash rested."
 *
 * Rules: the static grant is on while I control a Character named [Gecko Moria] (a Leader or a card
 * of the opponent does not count); [Double Attack] deals 2 damage (CR 10-1-3); [Trigger] fires when
 * Oars is revealed from Life, plays up to 1 matching Character from the trash RESTED, cost 4 is
 * allowed, cost 5 or more is not.
 *
 * Scenery: OP02-054 Gecko Moria (Blue, cost 4, 6000, {Thriller Bark Pirates}, vanilla); OP06-094
 * Lola (Black, cost 4, 6000, {Thriller Bark Pirates}, vanilla); OP14-101 Oars (Yellow, cost 8,
 * {Giant}/{Thriller Bark Pirates}); OP01-012 Sai (no type); OP01-018 Hajrudin (6000, attacker).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, attack, blockers, passBlock } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  canAttackAnything,
  cardIds,
  choiceCards,
  choices,
  fill,
  kind,
  kw,
  LDR,
  mine,
  myTurn,
  need,
  offered,
  RED,
  side,
  theirTurn,
  VAN,
} from './kit-d.ts';

const OARS = 'OP18-081';
const MORIA = 'OP02-054';
const LOLA = 'OP06-094';
const OARS_Y = 'OP14-101';
const BLACK = 'OP02-107';

describe('OP18-081 Oars: if you have a [Gecko Moria] Character, this Character gains [Double Attack] and [Blocker]', () => {
  const state = (chars: string[], p2: Partial<PlayerSpec> = {}, leader: string = LDR.luffy) =>
    mine(leader, { characters: chars }, p2);

  it('with a [Gecko Moria] Character: it has [Double Attack] and [Blocker]', () => {
    const g = state([OARS, MORIA]);
    const o = g.find('p1', 'characters', OARS);
    expect(kw(g, o)).toContain('Double Attack');
    expect(kw(g, o)).toContain('Blocker');
  });

  it('without one: neither keyword', () => {
    const g = state([OARS, VAN.sai]);
    const o = g.find('p1', 'characters', OARS);
    expect(kw(g, o)).not.toContain('Double Attack');
    expect(kw(g, o)).not.toContain('Blocker');
  });

  it('a Character with another {Thriller Bark Pirates} name (Lola) does not count', () => {
    const g = state([OARS, LOLA]);
    expect(kw(g, g.find('p1', 'characters', OARS))).not.toContain('Blocker');
  });

  it('the opponent’s [Gecko Moria] Character does not count', () => {
    const g = state([OARS], { characters: [MORIA] });
    expect(kw(g, g.find('p1', 'characters', OARS))).not.toContain('Double Attack');
  });

  it('it blocks on the opponent’s turn when I have a [Gecko Moria] Character', () => {
    const g = theirTurn(
      side(LDR.luffy, RED, { characters: [OARS, MORIA] }),
      side(LDR.luffy, RED, { characters: [VAN.hajrudin] }),
    );
    attack(g, g.find('p2', 'characters', VAN.hajrudin), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', OARS)]);
  });

  it('[Double Attack] in play: an unblocked attack on the Leader deals 2 damage', () => {
    const g = myTurn(
      side(LDR.luffy, RED, { characters: [OARS, MORIA] }),
      side(LDR.luffy, RED, { life: fill(VAN.gordon, 4) }),
    );
    attack(g, g.find('p1', 'characters', OARS), g.leader('p2'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    for (let i = 0; i < 3 && kind(g) === 'trigger'; i++)
      act(g, { type: 'trigger', activate: false });
    expect(g.life('p2')).toBe(2);
    expect(canAttackAnything(g, g.find('p1', 'characters', OARS))).toBe(false);
  });
});

describe('OP18-081 Oars: [Trigger] play up to 1 {Thriller Bark Pirates} Character (cost 4 or less) from the trash rested', () => {
  /** p2's Hajrudin attacks p1's Leader whose top Life card is Oars; p1 holds the given cards in the trash. */
  function revealed(trash: string[]): TestGame {
    const g = theirTurn(
      side(LDR.luffy, RED, { life: [OARS, BLACK, BLACK], trash }),
      side(LDR.luffy, RED, { characters: [VAN.hajrudin] }),
    );
    attack(g, g.find('p2', 'characters', VAN.hajrudin), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p1');
    act(g, { type: 'trigger', activate: true });
    return g;
  }

  it('plays the chosen card from the trash, rested', () => {
    const g = revealed([LOLA, VAN.sai]);
    if (offered(g, 'p1')) accept(g);
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).toEqual([LOLA]);
    act(g, { type: 'pick', choice: g.find('p1', 'trash', LOLA) });
    expect(cardIds(g, 'p1', 'characters')).toEqual([LOLA]);
    expect(g.card(g.find('p1', 'characters', LOLA)).rested).toBe(true);
    expect(cardIds(g, 'p1', 'trash')).toContain(OARS);
  });

  it('cost boundary: cost 4 (Lola, Gecko Moria) is offered, cost 8 (the other Oars) is not', () => {
    const g = revealed([LOLA, MORIA, OARS_Y]);
    if (offered(g, 'p1')) accept(g);
    expect(choiceCards(g)).toEqual([LOLA, MORIA].sort());
  });

  it('a Character without the {Thriller Bark Pirates} type is not offered: nothing is played', () => {
    const g = revealed([VAN.sai]);
    if (kind(g) === 'optional') accept(g);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('"up to 1": picking none plays nothing', () => {
    const g = revealed([LOLA]);
    if (offered(g, 'p1')) accept(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(cardIds(g, 'p1', 'trash')).toContain(LOLA);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });
});
