/**
 * OP18-082 Catarina Devon (Character, Black, cost 5, 3000, Counter +2000, {Egghead}/{Blackbeard Pirates}).
 *
 * Card text (cards/data):
 *   "[When Attacking] This Character's base power becomes the same as your opponent's Leader's power
 *    during this turn.
 *    [On K.O.] You may trash 1 card from your hand: If your Leader has the {Blackbeard Pirates}
 *    type, play this Character card from your trash rested."
 *
 * Readings (docs/research/m6b-audit/OP-18.md Q13): the base power is set once, as the effect
 * resolves, to the opponent Leader's current power; DON!! given to Catarina still add on top of the
 * new base on my turn. The [On K.O.] cost is paid first (an optional trash); the "If" is an effect
 * condition, so with a non-{Blackbeard Pirates} Leader the cost is still paid but nothing is played.
 *
 * Scenery: OP02-001 Newgate (Red Leader, 6000 power, 6 Life, [End of Your Turn] only); ST01-001 Luffy
 * (5000); OP09-081 Marshall.D.Teach (Black Leader, {Blackbeard Pirates}; unscripted, inert); OP02-007
 * Thatch (8000) attacks and kills her; OP01-012 Sai and OP01-023 Marco are hand fodder.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, attack, passBlock } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  cardIds,
  CH,
  decline,
  donOf,
  endTurn,
  kind,
  LDR,
  mine,
  need,
  offered,
  RED,
  side,
  theirTurn,
  toMyNextMain,
  VAN,
} from './kit-d.ts';

const CAT = 'OP18-082';
const NEWGATE = 'OP02-001';
const TEACH = 'OP09-081';

describe('OP18-082 Catarina Devon: [When Attacking] base power becomes the same as the opponent’s Leader’s power this turn', () => {
  const swing = (p1: Partial<PlayerSpec> = {}, p2Leader: string = NEWGATE) => {
    const g = mine(LDR.luffy, { characters: [CAT], ...p1 }, {}, p2Leader);
    const c = g.find('p1', 'characters', CAT);
    return { g, c };
  };

  it('attacking a 6000 Leader: her base power becomes 6000', () => {
    const { g, c } = swing();
    expect(g.power(c)).toBe(3000);
    attack(g, c, g.leader('p2'));
    expect(g.power(c)).toBe(6000);
  });

  it('attacking a 5000 Leader: 5000', () => {
    const { g, c } = swing({}, LDR.luffy);
    attack(g, c, g.leader('p2'));
    expect(g.power(c)).toBe(5000);
  });

  it('given DON!! still add +1000 each on top of the new base power (my turn)', () => {
    const { g, c } = swing({
      characters: [{ card: CAT, don: 2 }],
      costArea: { active: 8, rested: 0 },
    });
    expect(g.power(c)).toBe(5000);
    attack(g, c, g.leader('p2'));
    expect(g.power(c)).toBe(8000);
  });

  it('it lasts the whole turn: after the battle her power is still 6000', () => {
    const { g, c } = swing();
    attack(g, c, g.leader('p2'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    for (let i = 0; i < 6 && kind(g) === 'trigger'; i++)
      act(g, { type: 'trigger', activate: false });
    expect(g.power(c)).toBe(6000);
  });

  it('"during this turn": on my next turn she is back to her printed 3000', () => {
    const { g, c } = swing();
    attack(g, c, g.leader('p2'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    for (let i = 0; i < 6 && kind(g) === 'trigger'; i++)
      act(g, { type: 'trigger', activate: false });
    toMyNextMain(g);
    expect(g.power(c)).toBe(3000);
  });

  it('it only triggers when attacking: before the attack the power is the printed 3000', () => {
    const { g, c } = swing();
    expect(g.power(c)).toBe(3000);
    expect(kind(g)).toBe('main');
    void endTurn;
  });
});

describe('OP18-082 Catarina Devon: [On K.O.] you may trash 1 card: if your Leader is {Blackbeard Pirates}, play this card from the trash rested', () => {
  /** p2's Thatch (8000) attacks p1's rested Catarina (3000); the K.O. prompt is pending. */
  function ko(leader: string, p1: Partial<PlayerSpec> = {}): TestGame {
    const g = theirTurn(
      side(leader, RED, {
        characters: [{ card: CAT, rested: true }],
        hand: [VAN.sai, VAN.marco],
        ...p1,
      }),
      side(LDR.luffy, RED, { characters: [CH.thatch6] }),
    );
    attack(g, g.find('p2', 'characters', CH.thatch6), g.find('p1', 'characters', CAT));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  }

  it('with a {Blackbeard Pirates} Leader: trash 1 card, she returns from the trash rested', () => {
    const g = ko(TEACH);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    expect(cardIds(g, 'p1', 'characters')).toEqual([CAT]);
    expect(g.card(g.find('p1', 'characters', CAT)).rested).toBe(true);
    expect(cardIds(g, 'p1', 'trash')).toEqual([VAN.sai]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([VAN.marco]);
  });

  it('declining: she stays in the trash and nothing is discarded', () => {
    const g = ko(TEACH);
    decline(g);
    expect(cardIds(g, 'p1', 'trash')).toEqual([CAT]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(2);
  });

  it('with a Leader that is not {Blackbeard Pirates} the cost is still paid but she is not played', () => {
    const g = ko(LDR.luffy);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(cardIds(g, 'p1', 'trash').sort()).toEqual([CAT, VAN.sai].sort());
  });

  it('with an empty hand the cost cannot be paid: she stays in the trash', () => {
    const g = ko(TEACH, { hand: [] });
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(cardIds(g, 'p1', 'trash')).toEqual([CAT]);
    expect(donOf(g, 'p1')).toBeTruthy();
  });
});
