/**
 * OP18-071 Trebol (Character, Purple, cost 5, 6000, Counter +1000, {Donquixote Pirates}).
 *
 * Card text (cards/data):
 *   "[Once Per Turn] If your {Donquixote Pirates} type Character would be removed from the field by
 *    your opponent's effect, you may DON!! −1 instead.
 *    [Opponent's Turn] If your Leader is {Sugar}, this Characters gains [Blocker] and +2000 power."
 *
 * Readings (docs/OPEN-QUESTIONS.md M6b-Q96): "{Sugar}" means a Leader named [Sugar] (OP10-003, the
 * only reading under which the line can be true). The replacement covers Trebol himself (M6b-Q4);
 * it applies to the opponent's EFFECTS only (a battle K.O. is not an effect), once per turn, and
 * needs 1 DON!! on the field to return. The second ability works on the opponent's turn only.
 *
 * Scenery: OP10-073 Buffalo (Purple, cost 4, 6000, {Donquixote Pirates}, vanilla); OP01-012 Sai (no
 * type); OP09-077 Gum-Gum Lightning (K.O. up to 1 Character with 6000 power or less); OP10-003 Sugar
 * (Purple/Red Leader, {Donquixote Pirates}).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, attack, blockers } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  cardIds,
  CH,
  decline,
  donOf,
  KO_EVENT,
  kind,
  kw,
  LDR,
  LEAD,
  lightningKo,
  mine,
  offered,
  PURPLE,
  RED,
  side,
  strike,
  theirTurn,
  VAN,
} from './kit-d.ts';

const TREBOL = 'OP18-071';
const BUFFALO = 'OP10-073';
const SUGAR = 'OP10-003';

/** p2's turn: p2 (Kaido) holds `events` Gum-Gum Lightnings; p1 has `chars` and 3 active DON!!. */
function threatened(
  chars: string[],
  p1: Partial<PlayerSpec> = {},
  events = 1,
  leader: string = LDR.luffy,
): TestGame {
  return theirTurn(
    side(leader, RED, { characters: chars, costArea: { active: 3, rested: 0 }, ...p1 }),
    side(LEAD.kaido, PURPLE, {
      hand: Array.from({ length: events }, () => KO_EVENT),
      costArea: { active: 10, rested: 0 },
    }),
  );
}

const pay = (g: TestGame) => {
  if (kind(g) === 'choose') act(g, { type: 'pick', choice: { from: 'costActive' } });
};

describe('OP18-071 Trebol: [Once Per Turn] if your {Donquixote Pirates} Character would be removed by an opponent’s effect, you may DON!! −1 instead', () => {
  it('accepting: another {Donquixote Pirates} Character survives the opponent’s K.O. effect; 1 DON!! returns', () => {
    const g = threatened([TREBOL, BUFFALO]);
    lightningKo(g, g.find('p1', 'characters', BUFFALO));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    pay(g);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([BUFFALO, TREBOL].sort());
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, deck: 8 });
  });

  it('declining: the Character is K.O.’d and no DON!! returns', () => {
    const g = threatened([TREBOL, BUFFALO]);
    lightningKo(g, g.find('p1', 'characters', BUFFALO));
    decline(g);
    expect(cardIds(g, 'p1', 'trash')).toEqual([BUFFALO]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3 });
  });

  it('it covers Trebol himself (M6b-Q4): a K.O. effect on Trebol can be replaced', () => {
    const g = threatened([TREBOL]);
    lightningKo(g, g.find('p1', 'characters', TREBOL));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    pay(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([TREBOL]);
  });

  it('only {Donquixote Pirates} Characters: a Character without the type is K.O.’d with no offer', () => {
    const g = threatened([TREBOL, VAN.sai]);
    lightningKo(g, g.find('p1', 'characters', VAN.sai));
    expect(offered(g, 'p1')).toBe(false);
    expect(cardIds(g, 'p1', 'trash')).toEqual([VAN.sai]);
  });

  it('[Once Per Turn]: a second removal by an opponent’s effect in the same turn is not offered', () => {
    const g = threatened([TREBOL, BUFFALO, BUFFALO], {}, 2);
    lightningKo(g, g.find('p1', 'characters', BUFFALO, 0));
    accept(g);
    pay(g);
    lightningKo(g, g.find('p1', 'characters', BUFFALO, 1));
    expect(offered(g, 'p1')).toBe(false);
    expect(cardIds(g, 'p1', 'trash')).toEqual([BUFFALO]);
  });

  it('a K.O. in battle is not an effect: no offer', () => {
    const g = theirTurn(
      side(LDR.luffy, RED, {
        characters: [TREBOL, { card: BUFFALO, rested: true }],
        costArea: { active: 3, rested: 0 },
      }),
      side(LDR.luffy, RED, { characters: [CH.thatch6] }),
    );
    strike(g, g.find('p2', 'characters', CH.thatch6), g.find('p1', 'characters', BUFFALO));
    expect(offered(g, 'p1')).toBe(false);
    expect(cardIds(g, 'p1', 'trash')).toEqual([BUFFALO]);
  });

  it('with no DON!! on the field the DON!! −1 cannot be paid: no offer', () => {
    const g = threatened([TREBOL, BUFFALO], { costArea: { active: 0, rested: 0 } });
    lightningKo(g, g.find('p1', 'characters', BUFFALO));
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(cardIds(g, 'p1', 'trash')).toEqual([BUFFALO]);
  });
});

describe('OP18-071 Trebol: [Opponent’s Turn] if your Leader is {Sugar}, this Character gains [Blocker] and +2000 power', () => {
  const opp = (leader: string) =>
    theirTurn(
      side(leader, RED, { characters: [TREBOL] }),
      side(LDR.luffy, RED, { characters: [CH.kingdew5] }),
    );

  it('with the [Sugar] Leader on the opponent’s turn: 8000 power and [Blocker]', () => {
    const g = opp(SUGAR);
    const t = g.find('p1', 'characters', TREBOL);
    expect(g.power(t)).toBe(8000);
    expect(kw(g, t)).toContain('Blocker');
    attack(g, g.find('p2', 'characters', CH.kingdew5), g.leader('p1'));
    expect(blockers(g)).toEqual([t]);
  });

  it('with another Leader (Luffy) on the opponent’s turn: 6000 power and no [Blocker]', () => {
    const g = opp(LDR.luffy);
    const t = g.find('p1', 'characters', TREBOL);
    expect(g.power(t)).toBe(6000);
    expect(kw(g, t)).not.toContain('Blocker');
  });

  it('on my own turn, even with the [Sugar] Leader: 6000 power and no [Blocker]', () => {
    const g = mine(SUGAR, { characters: [TREBOL] });
    const t = g.find('p1', 'characters', TREBOL);
    expect(g.power(t)).toBe(6000);
    expect(kw(g, t)).not.toContain('Blocker');
  });
});
