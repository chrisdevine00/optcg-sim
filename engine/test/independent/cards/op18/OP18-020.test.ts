/**
 * OP18-020 Stop Fighting!!! (Red Event, cost 1, {Alabasta}).
 *
 * Card text (cards/data):
 *   "[Counter] You may add all of your Life cards to your hand: If your Leader is [Nefeltari Vivi],
 *    give your opponent's Leader and all of their Characters -5000 power during this turn."
 *
 * Reading (OPEN-QUESTIONS M6b-Q97): the optional cost adds every Life card to hand (not damage, no
 * [Trigger]) and is payable at any Life count, 0 included; the Leader condition is checked after the
 * cost; then the opposing Leader and every opposing Character get -5000 until end of turn.
 *
 * Scenery: OP04-001 Nefeltari Vivi (Leader named [Nefeltari Vivi], 5000), ST01-001 Luffy,
 * OP02-006 Kingdew (7000 attacker), OP02-007 Thatch (8000).
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock } from '../../helpers.ts';
import {
  activateCounter,
  at,
  BLUE,
  endCounter,
  fill,
  hand,
  kind,
  LC,
  need,
  no,
  theirs,
  VC,
  yes,
} from './kit-c.ts';

const STOP = 'OP18-020';

function defend(leader: string = LC.vivi, spec: object = {}) {
  const g = theirs(
    leader,
    { hand: [STOP], costArea: { active: 1, rested: 0 }, ...spec },
    { characters: [VC.kingdew5, { card: VC.thatch6, rested: true }] },
  );
  attack(g, at(g, 'p2', 'characters', VC.kingdew5), g.leader('p1'));
  passBlock(g);
  need(g, 'counter', 'p1');
  activateCounter(g, g.find('p1', 'hand', STOP));
  return g;
}

describe('OP18-020 Stop Fighting!!!: [Counter] add all Life to hand: -5000 to the opposing Leader and Characters', () => {
  it('with a [Nefeltari Vivi] Leader: all Life to hand, opposing Leader and Characters -5000', () => {
    const g = defend();
    yes(g, 'p1');
    expect(g.life('p1')).toBe(0);
    expect(hand(g)).toEqual(fill(BLUE, 4));
    expect(g.power(g.leader('p2'))).toBe(0);
    expect(g.power(at(g, 'p2', 'characters', VC.kingdew5))).toBe(2000);
    expect(g.power(at(g, 'p2', 'characters', VC.thatch6))).toBe(3000);
  });

  it('the attacker is shrunk before damage: a 7000 attack on a 0 Life Leader does not win the game', () => {
    const g = defend();
    yes(g, 'p1');
    endCounter(g);
    expect(kind(g)).toBe('main');
    expect(g.life('p1')).toBe(0);
  });

  it('declining the cost does nothing: Life stays, powers unchanged', () => {
    const g = defend();
    no(g, 'p1');
    expect(g.life('p1')).toBe(4);
    expect(g.power(at(g, 'p2', 'characters', VC.kingdew5))).toBe(7000);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('with a Leader that is not [Nefeltari Vivi] the Life cards are still added but nobody gets -5000', () => {
    const g = defend(LC.luffy);
    yes(g, 'p1');
    expect(g.life('p1')).toBe(0);
    expect(hand(g)).toHaveLength(4);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(g.power(at(g, 'p2', 'characters', VC.kingdew5))).toBe(7000);
  });

  it('a [Nefeltari Vivi] Character does not count: the Leader must be her', () => {
    const g = defend(LC.luffy, { characters: [VC.vivi2] });
    yes(g, 'p1');
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('the cost is payable with 0 Life (M6b-Q97): the effect still happens', () => {
    const g = defend(LC.vivi, { life: [] });
    yes(g, 'p1');
    expect(g.life('p1')).toBe(0);
    expect(g.power(g.leader('p2'))).toBe(0);
    expect(g.power(at(g, 'p2', 'characters', VC.kingdew5))).toBe(2000);
  });

  it('face-up Life cards are added to hand too', () => {
    const g = defend(LC.vivi, { life: [{ card: BLUE, faceUp: true }, ...fill(BLUE, 3)] });
    yes(g, 'p1');
    expect(g.life('p1')).toBe(0);
    expect(hand(g)).toHaveLength(4);
  });

  it('the -5000 lasts the turn, not just the battle', () => {
    const g = defend();
    yes(g, 'p1');
    endCounter(g);
    expect(g.power(at(g, 'p2', 'characters', VC.thatch6))).toBe(3000);
    expect(g.power(g.leader('p2'))).toBe(0);
  });
});
