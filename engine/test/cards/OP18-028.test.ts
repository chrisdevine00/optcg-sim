/** OP18-028 Chimney. */
import { describe, expect, it } from 'vitest';
import { dec, pick } from './helpers.ts';
import { activate, offeredAb } from './helpers-w3s.ts';
import { LUFFY_L, mk, PLAIN_PURPLE } from './helpers-op18-g1.ts';

const ID = 'OP18-028';
const GONBE = 'OP18-025';
const A = 'activate';

const board = (leader: string, extra: string[] = [GONBE]) =>
  mk({ leader: { card: leader, rested: true }, characters: [ID, ...extra] });
const use = (g: ReturnType<typeof mk>) => {
  activate(g, g.find('p1', 'characters', ID), A);
  if (dec(g)?.kind === 'choose') pick(g, [g.find('p1', 'characters', GONBE)]);
};

describe('OP18-028 Chimney', () => {
  it('[Activate: Main] rest [Gonbe] and this Character: set your [Monkey.D.Luffy] Leader as active', () => {
    const g = board(LUFFY_L);
    use(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', GONBE)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('a Leader with another name is not set active (the cost is still paid)', () => {
    const g = board(PLAIN_PURPLE);
    use(g);
    expect(g.card(g.find('p1', 'characters', GONBE)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('not offered without a [Gonbe]', () => {
    const g = board(LUFFY_L, []);
    expect(offeredAb(g, g.find('p1', 'characters', ID), A)).toBe(false);
  });

  it('not offered when [Gonbe] is already rested', () => {
    const g = mk({
      leader: { card: LUFFY_L, rested: true },
      characters: [ID, { card: GONBE, rested: true }],
    });
    expect(offeredAb(g, g.find('p1', 'characters', ID), A)).toBe(false);
  });

  it('not offered when Chimney is rested', () => {
    const g = mk({
      leader: { card: LUFFY_L, rested: true },
      characters: [{ card: ID, rested: true }, GONBE],
    });
    expect(offeredAb(g, g.find('p1', 'characters', ID), A)).toBe(false);
  });
});
