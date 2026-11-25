/**
 * OP09-025 Crocodile (Character, Green, cost 4, 5000, Counter +1000, Special, {Baroque Works}/
 * {The Seven Warlords of the Sea}/{ODYSSEY}).
 *
 * Card text: "If your Leader has the "ODYSSEY" type, this Character cannot be K.O.'d in battle by
 * Leaders." (The type is the exact {ODYSSEY} type; the data prints it with quotes.)
 *
 * Rules: CR 2-4-3 (type match), CR 8-1-3-3 / 8-2-1-2 (a permanent effect that is valid only while
 * its condition holds), CR 10-2-1-3 ("in battle" does not cover K.O. by an effect), CR 7-1-4-1-2.
 */
import { describe, expect, it } from 'vitest';
import type { CardId } from '@optcg/engine';
import { act, attack, passBlock, passCounter } from '../../helpers.ts';
import { side, theirTurn } from '../kit.ts';
import { BLUE, LW, need, put, RED, returnDon, SW, yes } from './kit-w5a.ts';

const ID = 'OP09-025';

/** p2's turn: p2 attacks p1's rested Crocodile with `attacker` ('leader' or a Character card). */
function hit(o: { mineLeader: string; theirLeader?: string; attacker: 'leader' | CardId }) {
  const g = theirTurn(
    side(o.mineLeader, BLUE, { characters: [{ card: ID, rested: true }] }),
    side(
      o.theirLeader ?? LW.luffy,
      RED,
      o.attacker === 'leader' ? {} : { characters: [o.attacker] },
    ),
  );
  const croc = g.find('p1', 'characters', ID);
  const from = o.attacker === 'leader' ? g.leader('p2') : g.find('p2', 'characters', o.attacker);
  attack(g, from, croc);
  passBlock(g);
  passCounter(g);
  return g;
}

const alive = (g: ReturnType<typeof hit>) => g.zone('p1', 'characters').some((c) => c.card === ID);

describe("OP09-025 Crocodile: with an ODYSSEY Leader it cannot be K.O.'d in battle by Leaders", () => {
  it('ODYSSEY Leader (Lim): the opponent Leader wins the battle (5000 against 5000) but does not K.O. Crocodile', () => {
    const g = hit({ mineLeader: LW.lim, attacker: 'leader' });
    expect(alive(g)).toBe(true);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
  });

  it('a Leader with more power (5000 + 2 DON!!) still cannot K.O. it', () => {
    const g = theirTurn(side(LW.lim, BLUE, { characters: [{ card: ID, rested: true }] }), {
      ...side(LW.luffy, RED, {}),
      leader: { card: LW.luffy, don: 2 },
    });
    expect(g.power(g.leader('p2'))).toBe(7000);
    attack(g, g.leader('p2'), g.find('p1', 'characters', ID));
    passBlock(g);
    passCounter(g);
    expect(alive(g)).toBe(true);
  });

  it('a Leader that is not ODYSSEY (Luffy): the opponent Leader K.O.s Crocodile', () => {
    const g = hit({ mineLeader: LW.luffy, attacker: 'leader' });
    expect(alive(g)).toBe(false);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(ID);
  });

  it('only Leaders are held off: an opposing Character with more power K.O.s Crocodile even with an ODYSSEY Leader', () => {
    const g = hit({ mineLeader: LW.lim, attacker: SW.kingdew });
    expect(alive(g)).toBe(false);
  });

  it('an opposing Character with less power does not K.O. it (the ordinary power check, as a control)', () => {
    const g = hit({ mineLeader: LW.lim, attacker: SW.c1 });
    expect(alive(g)).toBe(true);
  });

  it('only battle is covered: a K.O. by an Event (Gum-Gum Lightning, 5000 power) still K.O.s Crocodile', () => {
    const g = theirTurn(
      side(LW.lim, BLUE, { characters: [{ card: ID, rested: true }] }),
      side(LW.luffy, RED, { hand: [SW.lightning], costArea: { active: 4, rested: 0 } }),
    );
    put(g, SW.lightning, 'p2');
    yes(g, 'p2');
    returnDon(g, 2, 'costActive', 'p2');
    need(g, 'choose', 'p2');
    act(g, { type: 'pick', choice: g.find('p1', 'characters', ID), player: 'p2' });
    expect(alive(g)).toBe(false);
  });

  it("the condition reads MY Leader: when only the opponent's Leader is ODYSSEY (Lim attacks), Crocodile is K.O.'d", () => {
    const g = hit({ mineLeader: LW.luffy, theirLeader: LW.lim, attacker: 'leader' });
    expect(alive(g)).toBe(false);
  });

  it('a Leader of another type with several types (Four Emperors / Big Mom Pirates) does not qualify', () => {
    const g = hit({ mineLeader: 'OP17-099', attacker: 'leader' });
    expect(alive(g)).toBe(false);
  });

  it('the battle otherwise goes on as normal: Crocodile stays on the field, rested, and no Life is lost', () => {
    const g = hit({ mineLeader: LW.lim, attacker: 'leader' });
    const croc = g.find('p1', 'characters', ID);
    expect(g.card(croc).rested).toBe(true);
    expect(g.life('p1')).toBe(4);
  });
});
