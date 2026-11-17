/** OP17-110 Charlotte Perospero: [Your Turn] [On Play] play a {Big Mom Pirates} Character cost 6 or less from hand, then this gains [Rush]; [Trigger] play this card. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, hand, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { BMP, BMP6, ENEL, ids, triggerHit, YELLOW8 } from './helpers-robin.ts';

const PERO = 'OP17-110';
/** Charlotte Compote: Big Mom Pirates, cost 7. */
const COMPOTE = 'EB01-055';

const onPlay = () =>
  game(
    {
      leader: ENEL,
      hand: [PERO, BMP, BMP6, YELLOW8, COMPOTE, V.c1],
      costArea: { active: 7, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );

describe('OP17-110 Charlotte Perospero', () => {
  it('[On Play] plays a {Big Mom Pirates} Character with cost 6 or less from hand, and gains [Rush]', () => {
    const g = onPlay();
    const me = g.find('p1', 'hand', PERO);
    play(g, PERO);
    expectDecision(g, 'choose', 'p1');
    // Not offered: Oars (not Big Mom Pirates), Compote (cost 7), the vanilla non-Big Mom card.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'hand', BMP6)]);
    expect(ids(g, 'p1', 'characters').sort()).toEqual([PERO, BMP6].sort());
    expect(g.card(me).keywords).toContain('Rush');
    expect(hand(g, 'p1')).toEqual([BMP, YELLOW8, COMPOTE, V.c1]);
  });

  it('[On Play] "Then": it gains [Rush] even when no card is played', () => {
    const g = onPlay();
    const me = g.find('p1', 'hand', PERO);
    play(g, PERO);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([PERO]);
    expect(g.card(me).keywords).toContain('Rush');
  });

  it('[Trigger] plays this card; on the opponent turn there is no [On Play] and no [Rush] play', () => {
    const g = triggerHit(PERO, { hand: [BMP] });
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'characters')).toEqual([PERO]);
    expect(hand(g, 'p1')).toEqual([BMP]);
    expectDecision(g, 'main', 'p2');
  });
});
