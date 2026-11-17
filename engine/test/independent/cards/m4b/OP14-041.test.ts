/**
 * OP14-041 Boa Hancock (Leader, Blue/Yellow, 5000, 4 Life; Kuja Pirates / The Seven Warlords of the Sea).
 *
 * Card text:
 *   "[Opponent's Turn] When you play a Character, draw 1 card.
 *    [DON!!x1] [Once Per Turn] When one of your {Amazon Lily} or {Kuja Pirates} type Characters with
 *    5000 base power or more is K.O.'d add up to 1 card from the top of your opponent's Life cards to
 *    the owner's hand."
 *
 * Rulings: RL-47 (QA-OP14 OP14-041): the draw is mandatory; once per Character played, including
 * several played at once (OP16-105 Gecko Moria's [Trigger] playing 3 draws 3). The K.O. effect needs
 * a real K.O. (CR 10-2-1), "base power" ignores modifiers (CR 4-9-2); the Life card goes to hand
 * without a [Trigger] (QA-GR). [Once Per Turn]: CR 10-2-13.
 * Scenery: OP16-112 Boa Hancock (Kuja, 8000), OP08-048 Sweetpea (Amazon Lily, 6000),
 * OP14-114 Ran (Kuja, 5000), OP07-043 Salome (Kuja, 2000), OP01-018 Hajrudin (6000, no such type),
 * OP02-020 LittleOars Jr. (9000), OP02-007 Thatch (8000), OP01-104 Speed ([Trigger] play this card).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { attack, noDefence, passBlock, passCounter } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  hitLeader,
  kind,
  decider,
  LD,
  LEAD,
  myTurn,
  playFromHand,
  RED,
  rep,
  settleYes,
  side,
  sortedIds,
  theirTurn,
  TR,
  V,
  VAN,
  zoneCards,
} from './kit-d.ts';

const HANCOCK = LD.hancock;

describe('OP14-041: [Opponent’s Turn] draw 1 when you play a Character', () => {
  it('RL-47: a Character played from a [Trigger] on the opponent’s turn draws 1, with no question', () => {
    // OP14-114 Ran: [Trigger] If your Leader has the {Kuja Pirates} type, play this card.
    const g = theirTurn(
      side(HANCOCK, BLUE, { life: [TR.ran, ...rep(BLUE, 3)], deck: [VAN.sai, ...rep(BLUE, 10)] }),
      side(LEAD.luffy, RED),
    );
    hitLeader(g);
    activateTrigger(g);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([TR.ran]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
    expect(kind(g)).toBe('main');
    expect(decider(g)).toBe('p2');
  });

  it('it is the opponent’s turn only: playing a Character on your own turn draws nothing', () => {
    const g = myTurn(
      side(HANCOCK, BLUE, { hand: [VAN.komachiyo], costArea: { active: 1, rested: 0 } }),
      side(LEAD.luffy, RED),
    );
    playFromHand(g, VAN.komachiyo);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.zone('p1', 'deck')).toHaveLength(15);
  });
});

/** p2's turn; p1 (Hancock with 1 DON!! given) has rested Characters for p2 to knock out. */
function ko(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}, don = 1) {
  return theirTurn(
    side({ card: HANCOCK, don }, BLUE, p1),
    side(LEAD.luffy, RED, { life: [TR.speed, ...rep(RED, 3)], ...p2 }),
  );
}

describe('OP14-041: when your Kuja/Amazon Lily Character with 5000+ base power is K.O.’d', () => {
  it('Kuja 8000 K.O.’d in battle: the top card of the opponent’s Life goes to its owner’s hand', () => {
    const g = ko(
      { characters: [{ card: V.kuja8, rested: true }] },
      { characters: [VAN.littleOars] },
    );
    attack(g, g.find('p2', 'characters', VAN.littleOars), g.find('p1', 'characters', V.kuja8));
    noDefence(g);
    settleYes(g, 'p1');
    expect(sortedIds(g, 'p1', 'characters')).toEqual([]);
    expect(g.life('p2')).toBe(3);
    expect(sortedIds(g, 'p2', 'hand')).toEqual([TR.speed]);
    // Not damage: no [Trigger] decision for the added Life card (QA-GR).
    expect(kind(g)).toBe('main');
    expect(decider(g)).toBe('p2');
  });

  it('Amazon Lily (Sweetpea, 6000) works too', () => {
    const g = ko(
      { characters: [{ card: V.sweetpea, rested: true }] },
      { characters: [VAN.littleOars] },
    );
    attack(g, g.find('p2', 'characters', VAN.littleOars), g.find('p1', 'characters', V.sweetpea));
    noDefence(g);
    settleYes(g, 'p1');
    expect(g.life('p2')).toBe(3);
    expect(g.zone('p2', 'hand')).toHaveLength(1);
  });

  it('boundary: exactly 5000 base power (Ran) qualifies', () => {
    const g = ko(
      { characters: [{ card: 'OP14-114', rested: true }] },
      { characters: [VAN.littleOars] },
    );
    attack(g, g.find('p2', 'characters', VAN.littleOars), g.find('p1', 'characters', 'OP14-114'));
    noDefence(g);
    settleYes(g, 'p1');
    expect(g.life('p2')).toBe(3);
  });

  it('base power below 5000 (Salome, 2000) does nothing', () => {
    const g = ko(
      { characters: [{ card: V.salomeKuja, rested: true }] },
      { characters: [VAN.littleOars] },
    );
    attack(g, g.find('p2', 'characters', VAN.littleOars), g.find('p1', 'characters', V.salomeKuja));
    noDefence(g);
    settleYes(g, 'p1');
    expect(g.life('p2')).toBe(4);
    expect(kind(g)).toBe('main');
  });

  it('a Character of another type (Hajrudin, 6000) does nothing', () => {
    const g = ko(
      { characters: [{ card: VAN.hajrudin, rested: true }] },
      { characters: [VAN.littleOars] },
    );
    attack(g, g.find('p2', 'characters', VAN.littleOars), g.find('p1', 'characters', VAN.hajrudin));
    noDefence(g);
    expect(g.life('p2')).toBe(4);
    expect(kind(g)).toBe('main');
  });

  it('[DON!!x1]: without a DON!! on the Leader it does nothing', () => {
    const g = ko(
      { characters: [{ card: V.kuja8, rested: true }] },
      { characters: [VAN.littleOars] },
      0,
    );
    attack(g, g.find('p2', 'characters', VAN.littleOars), g.find('p1', 'characters', V.kuja8));
    noDefence(g);
    expect(g.life('p2')).toBe(4);
    expect(kind(g)).toBe('main');
  });

  it('a Character that is not K.O. (the attacker is weaker) does nothing', () => {
    const g = ko(
      { characters: [{ card: V.kuja8, rested: true }] },
      { characters: [VAN.marco] }, // 5000 < 8000
    );
    attack(g, g.find('p2', 'characters', VAN.marco), g.find('p1', 'characters', V.kuja8));
    noDefence(g);
    expect(g.life('p2')).toBe(4);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([V.kuja8]);
  });

  it('CR 10-2-13: [Once Per Turn]: a second K.O. in the same turn adds no second Life card', () => {
    const g = ko(
      {
        characters: [
          { card: V.sweetpea, rested: true },
          { card: V.kuja8, rested: true },
        ],
      },
      { characters: [VAN.littleOars, VAN.thatch] },
    );
    attack(g, g.find('p2', 'characters', VAN.littleOars), g.find('p1', 'characters', V.sweetpea));
    noDefence(g);
    settleYes(g, 'p1');
    expect(g.life('p2')).toBe(3);
    attack(g, g.find('p2', 'characters', VAN.thatch), g.find('p1', 'characters', V.kuja8));
    noDefence(g);
    settleYes(g, 'p1');
    expect(sortedIds(g, 'p1', 'characters')).toEqual([]);
    expect(g.life('p2')).toBe(3);
    expect(zoneCards(g, 'p2', 'hand')).toEqual([TR.speed]);
  });

  it('"one of your" Characters: the opponent’s Kuja Character K.O.’d does nothing', () => {
    const g = myTurn(
      side({ card: HANCOCK, don: 1 }, BLUE, { characters: [VAN.littleOars] }),
      side(LEAD.luffy, RED, { characters: [{ card: V.kuja8, rested: true }] }),
    );
    attack(g, g.find('p1', 'characters', VAN.littleOars), g.find('p2', 'characters', V.kuja8));
    passBlock(g);
    passCounter(g);
    expect(sortedIds(g, 'p2', 'characters')).toEqual([]);
    expect(g.life('p2')).toBe(4);
  });
});
