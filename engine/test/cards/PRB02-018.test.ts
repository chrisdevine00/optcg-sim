/** PRB02-018 Portgas.D.Ace. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, game, hand, none, pick, play, PLAIN_BLUE, trash, V } from './helpers.ts';
import { ACE2, canPick, LUFFY2, LUFFY3, NOT_BM_LEADER, SABO2 } from './helpers-w5c2.ts';

const ID = 'PRB02-018';
const up = (card: string) => ({ card, faceUp: true });

const mk = (
  life: unknown[],
  h: string[] = [ID, SABO2, LUFFY3],
  t: string[] = [LUFFY2, ACE2, V.c2],
) =>
  game(
    {
      leader: NOT_BM_LEADER,
      hand: h,
      trash: t,
      life: life as never,
      costArea: { active: 5, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );
const chars = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);

describe('PRB02-018 Portgas.D.Ace', () => {
  it('[On Play] with a face-up Life card: play [Sabo], [Portgas.D.Ace] or [Monkey.D.Luffy] of cost 2 from the hand or trash', () => {
    const g = mk([up(BLUE), BLUE, BLUE]);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'hand', SABO2))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', LUFFY2))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', ACE2))).toBe(true);
    pick(g, [g.find('p1', 'hand', SABO2)]);
    expect(chars(g)).toEqual([ID, SABO2]);
    expect(hand(g, 'p1')).toEqual([LUFFY3]);
    const t = mk([up(BLUE)]);
    play(t, ID);
    pick(t, [t.find('p1', 'trash', LUFFY2)]);
    expect(chars(t)).toEqual([ID, LUFFY2]);
    expect(trash(t, 'p1')).toEqual([ACE2, V.c2]);
  });

  it('offers only cost 2 and only those three names (cost 3 [Monkey.D.Luffy] and a cost-2 other name are not)', () => {
    const g = mk([up(BLUE)]);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'hand', LUFFY3))).toBe(false);
    expect(canPick(g, g.find('p1', 'trash', V.c2))).toBe(false);
  });

  it('with no face-up Life card nothing is asked and nothing is played', () => {
    const g = mk([BLUE, BLUE, BLUE]);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(chars(g)).toEqual([ID]);
    const none0 = mk([]);
    play(none0, ID);
    expect(dec(none0)?.kind).toBe('main');
    expect(chars(none0)).toEqual([ID]);
  });

  it('any one face-up Life card is enough, wherever it lies; face-down cards on top do not hide it', () => {
    const g = mk([BLUE, BLUE, up(BLUE)]);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'hand', SABO2))).toBe(true);
  });

  it('"up to 1": plays nothing when declined, and never more than one', () => {
    const g = mk([up(BLUE)]);
    play(g, ID);
    none(g);
    expect(chars(g)).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([SABO2, LUFFY3]);

    const h = mk([up(BLUE)]);
    play(h, ID);
    h.act({ type: 'pick', choice: h.find('p1', 'hand', SABO2) });
    // Raw: a second pick would still be open if it were "up to 2".
    expect(dec(h)?.kind).toBe('main');
    expect(chars(h)).toHaveLength(2);
  });
});
