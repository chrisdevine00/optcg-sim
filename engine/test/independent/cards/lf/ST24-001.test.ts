/**
 * ST24-001 Capone"Gang"Bege (Character, Green, cost 2, 1000, Counter +1000, {Firetank Pirates}/{Supernovas}).
 *
 * Card text:
 *   [Blocker]
 *   [On Play] If you have 6 or more rested cards, draw 1 card and trash 1 card from your hand.
 *
 * "Rested cards" is M6b-Q25-adjacent: whether rested DON!! count is open. The tests count only
 * rested Leader / Characters / Stage (which every reading includes) and keep the DON!! total on
 * the same side of 6 under both readings: playing Bege rests 2 DON!!, so a position with 6 such
 * rested cards fires either way and one with 3 stays at 5 at most either way.
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock } from '../../helpers.ts';
import { BLUE, deck, hand, kw, mine, theirs, trash } from '../op17/kit-op17b.ts';
import {
  atMain,
  blockers,
  choices,
  handInstances,
  inst,
  kind,
  LC,
  need,
  playRaw,
  pickStrict,
  SCL,
} from './kit-lfc.ts';

const BEGE = 'ST24-001';
const STAGE = 'OP05-021';

/** Red Stage, cost 1 (only an [Activate: Main]); used as a rested non-Character card. */
function start(
  o: {
    restedChars?: number;
    leaderRested?: boolean;
    stageRested?: boolean;
    hand?: string[];
    deck?: string[];
    p2?: Parameters<typeof mine>[2];
  } = {},
) {
  const rc = o.restedChars ?? 0;
  const chars = [SCL.c2, SCL.c3, SCL.c4, SCL.c5]
    .slice(0, rc)
    .map((card) => ({ card, rested: true }));
  return mine(
    { card: LC.nova, rested: o.leaderRested ?? false },
    {
      hand: o.hand ?? [BEGE, SCL.c2, SCL.c3],
      deck: o.deck ?? [BLUE, BLUE, BLUE, BLUE, BLUE],
      characters: chars,
      ...(o.stageRested === undefined ? {} : { stage: { card: STAGE, rested: o.stageRested } }),
      costArea: { active: 2, rested: 0 },
    },
    o.p2 ?? {},
  );
}

describe('ST24-001 Capone"Gang"Bege: [Blocker]; [On Play] with 6+ rested cards, draw 1 and trash 1', () => {
  it('has [Blocker] and can block an attack on my Leader', () => {
    const g = theirs(
      LC.nova,
      { characters: [BEGE] },
      { characters: [], costArea: { active: 2, rested: 0 } },
    );
    expect(kw(g, inst(g, 'p1', 'characters', BEGE))).toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([inst(g, 'p1', 'characters', BEGE)]);
    passBlock(g);
  });

  it('with 6 rested cards (Leader, Stage, 4 Characters): draws 1 and trashes 1 of 3 hand cards', () => {
    const g = start({ restedChars: 4, leaderRested: true, stageRested: true });
    const before = handInstances(g);
    playRaw(g, BEGE);
    need(g, 'choose', 'p1');
    // The drawn card is one of the candidates.
    const drawn = handInstances(g).filter((i) => !before.includes(i));
    expect(drawn).toHaveLength(1);
    pickStrict(g, inst(g, 'p1', 'hand', SCL.c2));
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCL.c3, BLUE].sort());
    expect(trash(g)).toEqual([SCL.c2]);
    expect(deck(g)).toHaveLength(4);
  });

  it('the card to trash may be the card just drawn', () => {
    const g = start({ restedChars: 4, leaderRested: true, stageRested: true });
    const before = handInstances(g);
    playRaw(g, BEGE);
    need(g, 'choose', 'p1');
    const drawn = handInstances(g).find((i) => !before.includes(i))!;
    pickStrict(g, drawn);
    expect(hand(g)).toEqual([SCL.c2, SCL.c3].sort());
    expect(trash(g)).toEqual([BLUE]);
  });

  it('with only 3 rested cards (Leader and 2 Characters): nothing is drawn or trashed and no prompt appears', () => {
    const g = start({ restedChars: 2, leaderRested: true });
    playRaw(g, BEGE);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCL.c2, SCL.c3].sort());
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(5);
  });

  it('with nothing rested except the DON!! paid for Bege: nothing happens', () => {
    const g = start();
    playRaw(g, BEGE);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(5);
  });

  it('only my own rested cards count: 6 rested cards on the opponent side do not fire it', () => {
    const g = start({
      p2: {
        leader: { card: LC.plain, rested: true },
        characters: [SCL.c2, SCL.c3, SCL.c4, SCL.c5, SCL.c6].map((card) => ({
          card,
          rested: true,
        })),
      },
    });
    playRaw(g, BEGE);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(5);
  });

  it('when Bege is the only hand card, the one drawn card is the only one that can be trashed', () => {
    const g = start({
      restedChars: 4,
      leaderRested: true,
      stageRested: true,
      hand: [BEGE],
      deck: [SCL.c6, BLUE, BLUE, BLUE],
    });
    playRaw(g, BEGE);
    // One candidate: the engine may resolve the pick itself or ask it (see API-GAPS-c.md).
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(1);
      pickStrict(g, choices(g)[0]!);
    }
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([SCL.c6]);
  });

  it('there is no "may": the effect is not optional and asks no yes/no question', () => {
    const g = start({ restedChars: 4, leaderRested: true, stageRested: true });
    playRaw(g, BEGE);
    expect(kind(g)).toBe('choose');
    expect(kind(g)).not.toBe('optional');
  });
});
