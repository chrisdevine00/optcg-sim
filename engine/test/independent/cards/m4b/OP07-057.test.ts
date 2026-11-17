/**
 * OP07-057 Perfume Femur (Event, Blue, cost 2; Kuja Pirates / The Seven Warlords of the Sea).
 *
 * Card text:
 *   "[Main] Select up to 1 of your [The Seven Warlords of the Sea] type Leader or Character cards and
 *    that card gains +2000 power during this turn. Then, if the selected card attacks during this
 *    turn, your opponent cannot activate [Blocker].
 *    [Trigger] Draw 1 card."
 *
 * Rules: CR 8-4-4-1 "up to 1"; "during this turn" (CR 6-6-1-3); only the SELECTED card's attacks are
 * protected; [Blocker] CR 10-1-4. Scenery: ST03-001 Crocodile Leader (SWotS), OP02-054 Gecko Moria
 * (Character, SWotS / Thriller Bark, 6000), OP01-023 Marco (no such type), ST01-001 Luffy Leader
 * (no such type), OP09-072 Franky ([Blocker]).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  activateTrigger,
  attack,
  blockers,
  BLUE,
  choiceCards,
  choose,
  chooseNone,
  hitLeader,
  K,
  kind,
  LD,
  LEAD,
  myTurn,
  noDefence,
  passBlock,
  passCounter,
  playFromHand,
  RED,
  rep,
  side,
  theirTurn,
  V,
  VAN,
} from './kit-d.ts';

const FEMUR = 'OP07-057';
const MORIA = V.moria4;

function game(leader: string, p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(leader, BLUE, { hand: [FEMUR], costArea: { active: 2, rested: 0 }, ...p1 }),
    side(LEAD.luffy, RED, { characters: [K.blockerFranky], ...p2 }),
  );
}

describe('OP07-057 Perfume Femur [Main]: +2000 and the opponent cannot activate [Blocker]', () => {
  it('control: without the Event the opponent’s [Blocker] is offered against a Leader attack', () => {
    const g = myTurn(
      side(LD.warlord, BLUE),
      side(LEAD.luffy, RED, { characters: [K.blockerFranky] }),
    );
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toHaveLength(1);
  });

  it('selecting the Leader: 5000 becomes 7000 and its attack cannot be blocked', () => {
    const g = game(LD.warlord);
    playFromHand(g, FEMUR);
    choose(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('selecting a Character: it gains 2000 and its attack cannot be blocked', () => {
    const g = game(LD.navy, { characters: [MORIA] });
    playFromHand(g, FEMUR);
    expect(choiceCards(g)).toEqual([MORIA]); // the Navy Leader is not a Seven Warlords card
    choose(g, [g.find('p1', 'characters', MORIA)]);
    const moria = g.find('p1', 'characters', MORIA);
    expect(g.power(moria)).toBe(8000);
    attack(g, moria, g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('only the selected card is protected: another attacker can still be blocked', () => {
    const g = game(LD.warlord, { characters: [VAN.marco] });
    playFromHand(g, FEMUR);
    choose(g, [g.leader('p1')]);
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    attack(g, g.find('p1', 'characters', VAN.marco), g.leader('p2'));
    expect(blockers(g)).toHaveLength(1);
  });

  it('targets are limited to SWotS Leader or Characters: a plain Character and a non-SWotS Leader are not offered', () => {
    const g = game(LD.warlord, { characters: [VAN.marco, MORIA] });
    playFromHand(g, FEMUR);
    expect(choiceCards(g)).toEqual([LD.warlord, MORIA].sort());
    const g2 = game(LD.luffy, { characters: [VAN.marco] });
    playFromHand(g2, FEMUR);
    expect(kind(g2)).not.toBe('choose');
  });

  it('CR 8-4-4-1: selecting nobody gives no boost and no blocker protection', () => {
    const g = game(LD.warlord);
    playFromHand(g, FEMUR);
    chooseNone(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toHaveLength(1);
    passBlock(g);
    passCounter(g);
  });
});

describe('OP07-057 Perfume Femur [Trigger]: draw 1 card', () => {
  it('activating it from Life draws the top card', () => {
    const g = theirTurn(
      side(LD.navy, BLUE, { life: [FEMUR, ...rep(BLUE, 3)], deck: [VAN.sai, ...rep(BLUE, 10)] }),
      side(LEAD.luffy, RED),
    );
    hitLeader(g);
    activateTrigger(g);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([VAN.sai]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([FEMUR]);
  });
});
