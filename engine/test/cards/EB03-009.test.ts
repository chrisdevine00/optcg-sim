/** EB03-009 Makino. */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import {
  activate,
  canPick,
  game,
  inert,
  KEYWORD_ONLY,
  offeredAb,
  pickableCards,
  TRIGGER_ONLY,
  WITH_ON_PLAY,
} from './helpers-w6c1.ts';

const ID = 'EB03-009';

describe('EB03-009 Makino', () => {
  const mk = (others: string[]) => {
    const g = game({ leader: PLAIN_PURPLE, characters: [ID, ...others] }, { leader: PLAIN_BLUE });
    inert(g, WITH_ON_PLAY, TRIGGER_ONLY);
    return g;
  };
  const go = (g: ReturnType<typeof mk>) => activate(g, g.find('p1', 'characters', ID), 'activate');

  it('rests Makino: up to 1 of your Characters with no base effect gains +2000 power this turn', () => {
    const g = mk([V.c2, KEYWORD_ONLY]);
    go(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(g.card(g.find('p1', 'characters', V.c2)).power).toBe(6000);
    // The one not chosen is untouched.
    expect(g.card(g.find('p1', 'characters', KEYWORD_ONLY)).power).toBe(2000);
  });

  it('a Character with only a keyword has no base effect; one with an [On Play], a [Trigger], or Makino herself does', () => {
    const g = mk([V.c2, KEYWORD_ONLY, WITH_ON_PLAY, TRIGGER_ONLY]);
    go(g);
    expect(pickableCards(g).sort()).toEqual([V.c2, KEYWORD_ONLY].sort());
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(false);
  });

  it('the bonus lasts this turn only', () => {
    const g = mk([V.c2]);
    go(g);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', V.c2)).power).toBe(4000);
  });

  it('"up to 1": may choose nobody, and Makino stays rested (the cost is paid)', () => {
    const g = mk([V.c2]);
    go(g);
    none(g);
    expect(g.card(g.find('p1', 'characters', V.c2)).power).toBe(4000);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('must not be offered when Makino is already rested; with no other Character she still rests and nothing is asked', () => {
    const g = mk([]);
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'activate')).toBe(true);
    go(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });
});
