/**
 * OP15-075 El Thor (Event, Purple, cost 0, {Sky Island}).
 *
 * Card text:
 *   "[Main] DON!! −1: If your Leader is [Enel], up to 1 of your Leader or Character cards gains
 *    +1000 power during this turn. Then, K.O. up to 1 of your opponent's Characters with 3000
 *    power or less.
 *    [Counter] Up to 1 of your [Enel] cards gains +2000 power during this battle."
 *
 * Rules: CR 4-10-1 / 4-10-2 (after a failed "if" the "Then" clause cannot resolve: with a
 * non-Enel Leader nothing is K.O.'d. Ambiguity noted: the "if" could be read as covering only the
 * +1000, but CR 4-10-2 says a "then" after a failed "if" does not resolve); CR 8-4-4-1 ("up to");
 * CR 10-2-1 (K.O.); CR 6-6-1-3 ("during this turn").
 */
import { describe, expect, it } from 'vitest';
import { endTurn } from '../../helpers.ts';
import { donOf, kind, myTurn } from '../kit.ts';
import {
  C,
  drive,
  enelCounterSuite,
  FILLER,
  ids,
  offeredCards,
  playCard,
  side,
  V,
} from './kit-c.ts';

const ID = 'OP15-075';

function game(leader: string = C.enel) {
  return myTurn(
    side(leader, FILLER, {
      hand: [ID],
      characters: [V.sai],
      costArea: { active: 2, rested: 0 },
      ...(leader === C.enel ? { donDeck: 4 } : {}),
    }),
    side(C.luffy, FILLER, { characters: [V.sunny, V.sai, V.kingdew] }),
  );
}

describe('OP15-075 El Thor: [Main] DON!! −1 → (Enel) +1000 then K.O. a Character with 3000 power or less', () => {
  it("Enel Leader: the chosen own card gets +1000 this turn and a 3000-power Character is K.O.'d", () => {
    const g = game();
    const sai = g.find('p1', 'characters', V.sai);
    const sunny = g.find('p2', 'characters', V.sunny);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [sai, sunny], don: 'costActive' });
    expect(g.power(sai)).toBe(5000);
    expect(ids(g, 'p2', 'characters').sort()).toEqual([V.kingdew, V.sai].sort());
    expect(ids(g, 'p2', 'trash')).toEqual([V.sunny]);
    expect(donOf(g, 'p1').deck).toBe(5);
  });

  it('the +1000 can go to the Leader instead', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', {
      targets: [g.leader('p1'), g.find('p2', 'characters', V.sunny)],
      don: 'costActive',
    });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('K.O. candidates are only opponent Characters with 3000 power or less (4000 and 7000 are not offered)', () => {
    const g = game();
    playCard(g, 'p1', ID);
    // Settle DON!! −1 and the +1000 target, then stop at the K.O. choice.
    drive(g, 'p1', { targets: [g.find('p1', 'characters', V.sai)], don: 'costActive' }, 0);
    for (let i = 0; i < 6; i++) {
      if (kind(g) === 'choose' && offeredCards(g).includes(V.sunny)) break;
      if (kind(g) === 'optional') g.act({ type: 'optional', accept: true });
      else if (kind(g) === 'choose') {
        const dons = g
          .legal()
          .filter((a) => a.type === 'pick' && typeof a.choice === 'object' && 'from' in a.choice);
        g.act(dons[0] ?? g.legal().find((a) => a.type === 'pick')!);
      }
    }
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual([V.sunny]);
  });

  it('"up to 1": may K.O. nobody (the +1000 still applies)', () => {
    const g = game();
    const sai = g.find('p1', 'characters', V.sai);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [sai], don: 'costActive' });
    expect(g.power(sai)).toBe(5000);
    expect(ids(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('non-Enel Leader: DON!! −1 is paid, but there is no +1000 and (CR 4-10-2) no K.O.', () => {
    const g = game(C.shanks);
    const sai = g.find('p1', 'characters', V.sai);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [sai, g.find('p2', 'characters', V.sunny)], don: 'costActive' });
    expect(g.power(sai)).toBe(4000);
    expect(ids(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('CR 8-3-1-4: declining DON!! −1 does nothing', () => {
    const g = game();
    const sai = g.find('p1', 'characters', V.sai);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false, targets: [sai, g.find('p2', 'characters', V.sunny)] });
    expect(g.power(sai)).toBe(4000);
    expect(ids(g, 'p2', 'characters')).toHaveLength(3);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, deck: 4 });
  });

  it('"during this turn": the +1000 is gone on the opponent\'s turn', () => {
    const g = game();
    const sai = g.find('p1', 'characters', V.sai);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [sai], don: 'costActive' });
    expect(g.power(sai)).toBe(5000);
    endTurn(g);
    expect(g.power(sai)).toBe(4000);
  });
});

describe('OP15-075 El Thor: the condition looks at the Leader', () => {
  it('only the LEADER matters: a non-Enel Leader with an [Enel] Character on the field does not satisfy the "if"', () => {
    const g = myTurn(
      side(C.shanks, FILLER, {
        hand: [ID],
        characters: [C.enelChar, V.sai],
        costArea: { active: 2, rested: 0 },
      }),
      side(C.luffy, FILLER, { characters: [V.kingdew] }),
    );
    playCard(g, 'p1', ID);
    drive(g, 'p1', {
      targets: [g.find('p1', 'characters', V.sai), g.find('p2', 'characters', V.kingdew)],
      don: 'costActive',
    });
    expect(g.power(g.find('p1', 'characters', V.sai))).toBe(4000);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });
});

enelCounterSuite(ID);
