/** OP16-078 Marineford. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  game,
  hand,
  payDon,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { NAVY1, NAVY4, orderAll, ROSI } from './helpers-hancock-rosi.ts';

describe('OP16-078 Marineford', () => {
  it('[On Play] looks at 5, reveals up to 1 {Navy} card to hand, the rest to the bottom', () => {
    const g = game(
      {
        leader: ROSI,
        hand: ['OP16-078'],
        deck: [V.c1, NAVY1, NAVY4, PURPLE, BLUE, BLUE],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP16-078');
    pick(g, [g.find('p1', 'deck', NAVY4)]);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([NAVY4]);
    expect(g.zone('p1', 'stage')).toHaveLength(1);
    expect(g.zone('p1', 'deck')).toHaveLength(5);
  });

  const withStage = (extra: Partial<Parameters<typeof game>[0]> = {}) =>
    game(
      {
        leader: ROSI,
        stage: 'OP16-078',
        hand: [PURPLE],
        deck: [BLUE, BLUE, BLUE],
        costArea: { active: 1, rested: 0 },
        ...extra,
      },
      { leader: PLAIN_BLUE },
    );
  const stage = (g: ReturnType<typeof withStage>) => g.find('p1', 'stage', 'OP16-078');

  it('[Activate: Main] DON!! −1 and rest this Stage: draw 1, trash 1 card from hand', () => {
    const g = withStage();
    g.act({ type: 'activate', card: stage(g), ability: 'cycle' });
    payDon(g);
    expect(g.card(stage(g)).rested).toBe(true);
    expect(don(g, 'p1').deck).toBe(10);
    expect(hand(g, 'p1').sort()).toEqual([BLUE, PURPLE].sort());
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    expect(trash(g, 'p1')).toEqual([PURPLE]);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('is not offered with no DON!! to return, or when the Stage is already rested', () => {
    const none = withStage({ costArea: { active: 0, rested: 0 } });
    expect(none.legal().some((a) => a.type === 'activate' && a.ability === 'cycle')).toBe(false);
    const rested = withStage({ stage: { card: 'OP16-078', rested: true } });
    expect(rested.legal().some((a) => a.type === 'activate' && a.ability === 'cycle')).toBe(false);
  });

  it('is not offered again once the Stage is rested (no Once Per Turn on the text)', () => {
    const g = withStage();
    g.act({ type: 'activate', card: stage(g), ability: 'cycle' });
    payDon(g);
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    expect(g.legal().some((a) => a.type === 'activate' && a.ability === 'cycle')).toBe(false);
  });
});

// Keep the imports referenced.
void accept;
void decline;
