/** OP12-058 I Will Make Whitebeard the King of the Pirates. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  accept,
  dec,
  decline,
  game,
  hand,
  PLAIN_BLUE,
  PURPLE,
  times,
  trash,
  V,
} from './helpers.ts';
import { damageWith } from './triggers.ts';
import {
  atMain,
  ids,
  WB10,
  WB5,
  WB9,
  WB_ALLY,
  WB_EVENT,
  WB_LEADER,
  OTHER_LEADER,
} from './helpers-w6c2.ts';

const ID = 'OP12-058';
const mk = (top: string, p1: Partial<PlayerSpec> = {}) =>
  game(
    {
      leader: WB_LEADER,
      hand: [ID],
      deck: [top, ...times(9, PURPLE)],
      costArea: { active: 9, rested: 0 },
      ...p1,
    },
    { leader: PLAIN_BLUE },
  );
const cast = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });

describe('OP12-058 I Will Make Whitebeard the King of the Pirates', () => {
  it('[Main]: reveals the top card; a Whitebeard Pirates Character of cost 9 or less may be played and gains [Rush]', () => {
    const g = mk(WB5);
    cast(g);
    expect(g.eventsOfType('CardRevealed').some((e) => e.reason === 'effect')).toBe(true);
    expect(dec(g)?.kind).toBe('optional');
    accept(g);
    expect(atMain(g)).toBe(true);
    const c = g.find('p1', 'characters', WB5);
    expect(g.card(c).keywords).toContain('Rush');
    expect(g.card(c).rested).toBe(false);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(PURPLE);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('boundaries: cost 9 is played, cost 10 is not; a type that merely includes the name counts', () => {
    const nine = mk(WB9);
    cast(nine);
    accept(nine);
    expect(ids(nine, 'p1', 'characters')).toEqual([WB9]);

    const ten = mk(WB10);
    cast(ten);
    // No prompt: a cost 10 card is not a candidate and stays on top.
    expect(atMain(ten)).toBe(true);
    expect(ids(ten, 'p1', 'deck')[0]).toBe(WB10);
    expect(ids(ten, 'p1', 'characters')).toEqual([]);

    const ally = mk(WB_ALLY);
    cast(ally);
    accept(ally);
    expect(ids(ally, 'p1', 'characters')).toEqual([WB_ALLY]);
    expect(ally.card(ally.find('p1', 'characters', WB_ALLY)).keywords).toContain('Rush');
  });

  it('a revealed Event of the type, or a Character of another type, is not played and stays on top', () => {
    for (const top of [WB_EVENT, V.c3]) {
      const g = mk(top);
      cast(g);
      expect(g.eventsOfType('CardRevealed').some((e) => e.reason === 'effect')).toBe(true);
      expect(atMain(g)).toBe(true);
      expect(ids(g, 'p1', 'characters')).toEqual([]);
      expect(ids(g, 'p1', 'deck')[0]).toBe(top);
    }
  });

  it('"you may": declining leaves the card on top and gives no [Rush]', () => {
    const g = mk(WB5, { characters: [V.c1] });
    cast(g);
    decline(g);
    expect(atMain(g)).toBe(true);
    expect(ids(g, 'p1', 'characters')).toEqual([V.c1]);
    expect(g.card(g.find('p1', 'characters', V.c1)).keywords).not.toContain('Rush');
    expect(ids(g, 'p1', 'deck')[0]).toBe(WB5);
  });

  it('[Rush] goes to the played Character only, not to the others', () => {
    const g = mk(WB5, { characters: [V.c1] });
    cast(g);
    accept(g);
    expect(g.card(g.find('p1', 'characters', WB5)).keywords).toContain('Rush');
    expect(g.card(g.find('p1', 'characters', V.c1)).keywords).not.toContain('Rush');
  });

  it('with a Leader that is not Whitebeard Pirates nothing is revealed (the Event is still spent)', () => {
    const g = mk(WB5, { leader: OTHER_LEADER });
    cast(g);
    expect(atMain(g)).toBe(true);
    expect(g.eventsOfType('CardRevealed').filter((e) => e.reason === 'effect')).toHaveLength(0);
    expect(ids(g, 'p1', 'deck')[0]).toBe(WB5);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('[Trigger]: draw 1 card', () => {
    const g = damageWith(ID, { leader: WB_LEADER });
    const before = hand(g, 'p1').length;
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toHaveLength(before + 1);
    expect(trash(g, 'p1')).toEqual([ID]);
  });
});
