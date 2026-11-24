/**
 * OP14-084 Ms. All Sunday (Character, Black, cost 7, 8000, no Counter, {Baroque Works}).
 *
 * Card text: "[On Play] If your Leader's type includes "Baroque Works", play up to 1 Character card with
 * a type including "Baroque Works" and a cost of 4 or less and up to 1 Character card with a type
 * including "Baroque Works" and a cost of 1 from your trash."
 *
 * Rules: [On Play] (CR 10-2-2), the "If" reads my Leader when the effect resolves, "type including"
 * is a substring match ("Former Baroque Works" qualifies), two independent "up to 1" picks from the
 * trash (a card cannot be played twice), cards played by an effect enter active unless the text says
 * rested, the Character area holds 5 (RL-05).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  backToMain,
  chars,
  chr,
  decision,
  kind,
  LD14,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  SC14,
  trash,
} from './kit-op14c.ts';

const ID = 'OP14-084';
const BW4 = 'OP04-067'; // Black, cost 4, 4000, {Baroque Works}, [Blocker]
const BW2 = 'OP04-066'; // Black, cost 2, 2000, {Baroque Works}
const BW1 = 'OP05-075'; // Black, cost 1, 1000, {Baroque Works}
const BW1b = 'OP14-085'; // Black, cost 1, 2000, {Baroque Works}
const FORMER1 = 'OP02-063'; // Blue, cost 1, 1000, {Impel Down}/{Former Baroque Works}
const BW5 = SC14.bw5; // Black, cost 5, 6000, {Baroque Works}: too expensive

type G = ReturnType<typeof mine>;

function start(
  trashCards: string[],
  o: { leader?: string; chars?: string[]; hand?: string[] } = {},
): G {
  const g = mine(o.leader ?? LD14.bw, {
    hand: [ID, ...(o.hand ?? [])],
    characters: o.chars ?? [],
    trash: trashCards,
    costArea: { active: 10, rested: 0 },
  });
  playRaw(g, ID);
  return g;
}

describe('OP14-084 Ms. All Sunday [On Play] play Baroque Works Characters from the trash', () => {
  it('plays one cost-4-or-less and one cost-1 Baroque Works Character, both from the trash', () => {
    const g = start([BW4, BW1, SC14.c1]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'trash', BW4)]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'trash', BW1)]);
    backToMain(g, 'p1');
    expect(chars(g)).toEqual([ID, BW4, BW1].sort());
    expect(trash(g)).toEqual([SC14.c1]);
  });

  it('the first pick offers Baroque Works Characters of cost 4 or less: cost 5 and non-Baroque cards are not offered', () => {
    const g = start([BW4, BW2, BW1, BW5, SC14.c2, SC14.c4]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BW4, BW2, BW1].sort());
  });

  it('the second pick offers only cost-1 Baroque Works Characters (cost 2 is not offered)', () => {
    const g = start([BW4, BW2, BW1]);
    pickInst(g, [at(g, 'p1', 'trash', BW4)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BW1]);
  });

  it('"type including": a {Former Baroque Works} cost-1 Character qualifies', () => {
    const g = start([FORMER1]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([FORMER1]);
    pickInst(g, [at(g, 'p1', 'trash', FORMER1)]);
    expect(chars(g)).toContain(FORMER1);
  });

  it('a card is never played twice: a lone cost-1 card fills one slot only', () => {
    const g = start([BW1]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'trash', BW1)]);
    if (kind(g) === 'choose') expect(offeredIds(g)).toEqual([]);
    if (kind(g) === 'choose') none(g);
    backToMain(g, 'p1');
    expect(chars(g)).toEqual([ID, BW1].sort());
  });

  it('two cost-1 cards can fill both slots', () => {
    const g = start([BW1, BW1b]);
    pickInst(g, [at(g, 'p1', 'trash', BW1)]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'trash', BW1b)]);
    backToMain(g, 'p1');
    expect(chars(g)).toEqual([ID, BW1, BW1b].sort());
  });

  it('"up to 1" twice: both picks may be skipped', () => {
    const g = start([BW4, BW1]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    if (kind(g) === 'choose') none(g);
    backToMain(g, 'p1');
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([BW4, BW1].sort());
  });

  it('the played Characters enter ACTIVE (not rested)', () => {
    const g = start([BW4, BW1]);
    pickInst(g, [at(g, 'p1', 'trash', BW4)]);
    pickInst(g, [at(g, 'p1', 'trash', BW1)]);
    expect(g.card(chr(g, 'p1', BW4)).rested).toBe(false);
    expect(g.card(chr(g, 'p1', BW1)).rested).toBe(false);
  });

  it('the Leader must be Baroque Works: with another Leader nothing is played', () => {
    const g = start([BW4, BW1], { leader: LD14.plain });
    backToMain(g, 'p1');
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([BW4, BW1].sort());
  });

  it('only the trash is a source: Baroque Works Characters in hand are not played', () => {
    const g = start([], { hand: [BW4] });
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
      if (kind(g) === 'choose') none(g);
    }
    backToMain(g, 'p1');
    expect(chars(g)).toEqual([ID]);
  });

  it('with a full Character area the engine asks which Character to trash to make room (RL-05)', () => {
    const g = start([BW4, BW1], { chars: [SC14.c1, SC14.c2, SC14.c3, SC14.c4] });
    // 4 Characters plus Ms. All Sunday: the area is full. Playing from the trash asks for room.
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'trash', BW4)]);
    expect(decision(g)?.purpose).toBe('characterLimit');
  });
});
