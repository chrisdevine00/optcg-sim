/** OP11-104 Shirley. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  none,
  option,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import {
  canBlockWith,
  canPick,
  FMI_CAMIE,
  finishOrder,
  idsOf,
  SHIRAHOSHI,
  up,
} from './helpers-op11g3.ts';

const ID = 'OP11-104';

describe('OP11-104 Shirley', () => {
  const start = (
    deck: string[],
    leader: string = PLAIN_BLUE,
    life: Parameters<typeof game>[0]['life'] = [up(BLUE), BLUE],
  ) =>
    game(
      {
        leader,
        hand: [ID],
        life,
        deck: [...deck, V.c6, V.c6, V.c6],
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: turn the top Life card face-down: look at 3, reveal up to 1 "Fish-Man Island" card to your hand, place the rest on top or bottom', () => {
    const g = start([V.c1, FMI_CAMIE, V.c2]);
    play(g, ID);
    accept(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', FMI_CAMIE))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'deck', FMI_CAMIE)]);
    expect(hand(g, 'p1')).toEqual([FMI_CAMIE]);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.map((o) => o.id)).toEqual(['top', 'bottom']);
    option(g, 'bottom');
    finishOrder(g);
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p1', 'deck').slice(0, 3)).toEqual([V.c6, V.c6, V.c6]);
    expect(idsOf(g, 'p1', 'deck').slice(3).sort()).toEqual([V.c1, V.c2].sort());
  });

  it('the rest may go back on top', () => {
    const g = start([V.c1, FMI_CAMIE, V.c2]);
    play(g, ID);
    accept(g);
    none(g);
    option(g, 'top');
    finishOrder(g);
    expect(idsOf(g, 'p1', 'deck').slice(0, 3).sort()).toEqual([V.c1, V.c2, FMI_CAMIE].sort());
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('the cost is optional: declining looks at nothing', () => {
    const g = start([FMI_CAMIE, V.c1, V.c2]);
    play(g, ID);
    decline(g);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(idsOf(g, 'p1', 'deck')[0]).toBe(FMI_CAMIE);
  });

  it('works with any Leader (no Leader condition)', () => {
    const g = start([FMI_CAMIE, V.c1, V.c2], SHIRAHOSHI);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'deck', FMI_CAMIE)]);
    expect(hand(g, 'p1')).toEqual([FMI_CAMIE]);
  });

  it('cannot be paid when the top Life card is face-down', () => {
    const g = start([FMI_CAMIE], PLAIN_BLUE, [BLUE, up(BLUE)]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
  });

  it('only the top 3 are looked at', () => {
    const g = start([V.c1, V.c2, V.c3, FMI_CAMIE]);
    play(g, ID);
    accept(g);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
  });

  it('has [Blocker]', () => {
    const g = game(
      { leader: PLAIN_BLUE, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
    expect(canBlockWith(g, g.find('p1', 'characters', ID))).toBe(true);
  });
});
