/**
 * OP15-033 Hody Jones (Character, Green, cost 4, 5000, Counter +1000, {Fish-Man}/{New Fish-Man
 * Pirates}/{Fish-Man Island}).
 *
 * Card text: "[On Play] Set your {Fish-Man} type Leader as active. Then, add 1 card from the top of
 * your Life cards to your hand."
 *
 * Rules: CR 8-1-2 (mandatory), CR 4-6-3 / 10-1-5 (a Life card added to hand by an effect does not
 * activate its [Trigger]), "Then" continues whether or not the first part changed anything.
 */
import { describe, expect, it } from 'vitest';
import { canHit } from './kit-op15a.ts';
import {
  at,
  BLUE,
  hand,
  kind,
  lifeCards,
  LD15,
  mine,
  need,
  playRaw,
  RED,
  SCN,
  side,
  myTurn,
} from './kit-op15a.ts';
import { TRIGGER_SPEED } from '../../helpers.ts';

const HODY = 'OP15-033';

function board(
  leader: string | { card: string; rested?: boolean },
  life: string[] = [SCN.c3, BLUE, BLUE, BLUE],
) {
  return myTurn(
    side(typeof leader === 'string' ? leader : leader.card, BLUE, {
      hand: [HODY],
      life,
      costArea: { active: 10, rested: 0 },
      ...(typeof leader === 'string' ? {} : { leader }),
    }),
    side(LD15.luffy, RED),
  );
}

describe('OP15-033 Hody Jones: [On Play] set a {Fish-Man} Leader active, then add the top Life card to hand', () => {
  it('a rested {Fish-Man} Leader becomes active', () => {
    const g = board({ card: LD15.fishMan, rested: true });
    expect(g.card(g.leader('p1')).rested).toBe(true);
    playRaw(g, HODY);
    need(g, 'main', 'p1');
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('the Leader can attack again after being set active', () => {
    const g = board({ card: LD15.fishMan, rested: true });
    expect(canHit(g, g.leader('p1'), g.leader('p2'))).toBe(false);
    playRaw(g, HODY);
    expect(canHit(g, g.leader('p1'), g.leader('p2'))).toBe(true);
  });

  it('a Leader without the {Fish-Man} type stays rested', () => {
    const g = board({ card: LD15.luffy, rested: true });
    playRaw(g, HODY);
    need(g, 'main', 'p1');
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('the top Life card (and only it) goes to my hand: 4 Life become 3', () => {
    const g = board(LD15.fishMan);
    playRaw(g, HODY);
    need(g, 'main', 'p1');
    expect(hand(g)).toEqual([SCN.c3]);
    expect(g.life('p1')).toBe(3);
    expect(lifeCards(g)).toEqual([BLUE, BLUE, BLUE]);
  });

  it('"Then": the Life card is added even when the Leader is not {Fish-Man} and nothing was set active', () => {
    const g = board({ card: LD15.luffy, rested: true });
    playRaw(g, HODY);
    expect(hand(g)).toEqual([SCN.c3]);
    expect(g.life('p1')).toBe(3);
  });

  it('an active {Fish-Man} Leader stays active and the Life card is still added', () => {
    const g = board(LD15.fishMan);
    playRaw(g, HODY);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(g.life('p1')).toBe(3);
  });

  it('a Life card with a [Trigger] added this way does not activate it', () => {
    const g = board(LD15.fishMan, [TRIGGER_SPEED, BLUE, BLUE, BLUE]);
    playRaw(g, HODY);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([TRIGGER_SPEED]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([HODY]);
  });

  it('with 0 Life cards nothing is added, nothing is lost, and the Leader is still set active', () => {
    const g = board({ card: LD15.fishMan, rested: true }, []);
    playRaw(g, HODY);
    need(g, 'main', 'p1');
    expect(g.life('p1')).toBe(0);
    expect(hand(g)).toEqual([]);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('Hody Jones itself is on the field with its printed 5000 power', () => {
    const g = board(LD15.fishMan);
    playRaw(g, HODY);
    expect(g.power(at(g, 'p1', 'characters', HODY))).toBe(5000);
    void mine;
  });
});
