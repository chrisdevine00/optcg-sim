/**
 * OP09-004 Shanks (Character, Red, cost 10, 12000, no Counter, {The Four Emperors}/{Red-Haired
 * Pirates}).
 *
 * Card text: "Give all of your opponent's Characters −1000 power. [Rush] (This card can attack on the
 * turn in which it is played.)"
 *
 * Reading: the first sentence has no timing tag, so it is a permanent effect of this card while it
 * is on the field (CR 8-1-3-3): it applies on both players' turns, to Characters that are played
 * later, and stops when the card leaves the field (CR 8-1-3-3-3 / RL-12). It reaches only the
 * opponent's Characters, not their Leader and not my own cards. A Character at 0 power or below
 * stays on the field (CR 4-12-2). [Rush] lets it attack on the turn it is played (CR 10-1-1).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, endTurn, noDefence, passBlock, passCounter } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  BLUE,
  kind,
  L9,
  mine,
  need,
  play,
  S9,
  side,
  theirTurn,
  type Place,
} from './kit-op09a.ts';

const SHANKS = 'OP09-004';

function board(p2chars: Place[], own: Place[] = [SHANKS]): TestGame {
  return mine(L9.luffy, { characters: own }, { characters: p2chars });
}

describe('OP09-004 Shanks: all opposing Characters −1000 power; [Rush]', () => {
  it('printed values: cost 10, 12000, no Counter, has [Rush]', () => {
    const g = board([]);
    const s = at(g, 'p1', 'characters', SHANKS);
    expect(g.card(s).cost).toBe(10);
    expect(g.power(s)).toBe(12000);
    expect(g.card(s).counter).toBeNull();
    expect(g.card(s).keywords).toContain('Rush');
  });

  it('every opposing Character gets −1000 power', () => {
    const g = board([S9.c4, S9.c1, S9.c7]);
    expect(g.power(at(g, 'p2', 'characters', S9.c4))).toBe(5000);
    expect(g.power(at(g, 'p2', 'characters', S9.c1))).toBe(2000);
    expect(g.power(at(g, 'p2', 'characters', S9.c7))).toBe(8000);
  });

  it('the opponent’s Leader and my own Characters are not affected', () => {
    const g = board([S9.c4], [SHANKS, S9.c3]);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(at(g, 'p1', 'characters', S9.c3))).toBe(5000);
    expect(g.power(at(g, 'p1', 'characters', SHANKS))).toBe(12000);
  });

  it('it is not an [On Play]: a Shanks already on the field and one played from hand both apply with no prompt', () => {
    const g = mine(L9.luffy, { hand: [SHANKS] }, { characters: [S9.c4] });
    expect(g.power(at(g, 'p2', 'characters', S9.c4))).toBe(6000);
    play(g, g.find('p1', 'hand', SHANKS));
    expect(kind(g)).toBe('main');
    expect(g.power(at(g, 'p2', 'characters', S9.c4))).toBe(5000);
  });

  it('it keeps applying on the opponent’s turn (and into later turns), not only "during this turn"', () => {
    const g = board([S9.c4]);
    const t = at(g, 'p2', 'characters', S9.c4);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(t)).toBe(5000);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.power(t)).toBe(5000);
  });

  it('a Character the opponent plays later is reduced too', () => {
    const h = theirTurn(
      side(L9.luffy, BLUE, { characters: [SHANKS] }),
      side(L9.luffy, BLUE, { hand: [S9.c4], costArea: { active: 10, rested: 0 } }),
    );
    play(h, h.find('p2', 'hand', S9.c4));
    expect(h.power(at(h, 'p2', 'characters', S9.c4))).toBe(5000);
  });

  it('two Shanks stack: −2000', () => {
    const g = board([S9.c4], [SHANKS, SHANKS]);
    expect(g.power(at(g, 'p2', 'characters', S9.c4))).toBe(4000);
  });

  it('a 0-power Character goes to −1000 and stays on the field (CR 4-12-2)', () => {
    const g = board([S9.cobra]);
    const c = at(g, 'p2', 'characters', S9.cobra);
    expect(g.power(c)).toBe(-1000);
    expect(g.zone('p2', 'characters').map((x) => x.card)).toEqual([S9.cobra]);
  });

  it('boundary: my 5000 Character now K.O.s a rested 6000 Character (it is 5000), which it could not before', () => {
    const g = board([{ card: S9.c4, rested: true }], [SHANKS, S9.c3]);
    attack(g, at(g, 'p1', 'characters', S9.c3), at(g, 'p2', 'characters', S9.c4));
    noDefence(g);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it('the effect ends when Shanks leaves the field: K.O.ed in battle, the opposing Character is back to full power', () => {
    // p2's Leader with 8 DON!! given is 13000 on their turn and attacks my rested Shanks (12000).
    const g = theirTurn(
      side(L9.luffy, BLUE, { characters: [{ card: SHANKS, rested: true }] }),
      side(L9.luffy, BLUE, {
        leader: { card: L9.luffy, don: 8 },
        characters: [S9.c4],
        costArea: { active: 2, rested: 0 },
      }),
    );
    const t = at(g, 'p2', 'characters', S9.c4);
    expect(g.power(t)).toBe(5000);
    attack(g, g.leader('p2'), at(g, 'p1', 'characters', SHANKS));
    passBlock(g);
    passCounter(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.power(t)).toBe(6000);
  });

  it('[Rush]: played from hand with 10 DON!!, it can attack the opponent’s Leader that turn', () => {
    const g = mine(L9.luffy, { hand: [SHANKS] }, { characters: [] });
    play(g, g.find('p1', 'hand', SHANKS));
    const s = at(g, 'p1', 'characters', SHANKS);
    expect(
      g.legal().some((a) => a.type === 'attack' && a.attacker === s && a.target === g.leader('p2')),
    ).toBe(true);
    act(g, { type: 'attack', attacker: s, target: g.leader('p2') });
    expect(kind(g)).toBe('block');
  });

  it('must not happen: [Rush] does not let it attack an ACTIVE opposing Character', () => {
    const g = mine(L9.luffy, { hand: [SHANKS] }, { characters: [S9.c4] });
    play(g, g.find('p1', 'hand', SHANKS));
    const s = at(g, 'p1', 'characters', SHANKS);
    const t = at(g, 'p2', 'characters', S9.c4);
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === s && a.target === t)).toBe(
      false,
    );
  });
});
