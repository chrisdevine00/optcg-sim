/** ST29-016 Kizaru!! Compared to Two Years Ago We're a Hundred Times Stronger Now!! */
import { describe, expect, it } from 'vitest';
import { endCounter, play, PLAIN_BLUE, V } from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { attackLeader, mk } from './helpers-st29old.ts';

const ID = 'ST29-016';
/** A plain [Blocker] Character ([Brook], scripted as a keyword only). */
const BROOK = 'ST29-011';
const keywords = (g: ReturnType<typeof mk>, id: string) => g.card(id).keywords;

describe('ST29-016 Kizaru!!', () => {
  it('[Main]: your [Monkey.D.Luffy] Leader gains [Unblockable] during this turn: it cannot be blocked', () => {
    const blocker = (g: ReturnType<typeof mk>) =>
      g.isLegal({ type: 'block', blocker: g.find('p2', 'characters', BROOK), player: 'p2' });
    const g = mk({ hand: [ID] }, { characters: [BROOK] });
    play(g, ID);
    expect(keywords(g, g.leader('p1'))).toContain('Unblockable');
    attackLeader(g, g.leader('p1'));
    expect(blocker(g)).toBe(false);
    // Control: without the Event the same Blocker may block.
    const h = mk({ hand: [] }, { characters: [BROOK] });
    attackLeader(h, h.leader('p1'));
    expect(blocker(h)).toBe(true);
  });

  it('the Leader is not Unblockable before the Event is played; the Event goes to the trash', () => {
    const g = mk({ hand: [ID] });
    expect(keywords(g, g.leader('p1'))).not.toContain('Unblockable');
    play(g, ID);
    expect(keywords(g, g.leader('p1'))).toContain('Unblockable');
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it('must not give [Unblockable] to a Leader with another name; the Event is still played', () => {
    const g = mk({ leader: PLAIN_BLUE, hand: [ID] });
    play(g, ID);
    expect(keywords(g, g.leader('p1'))).not.toContain('Unblockable');
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it('must not give [Unblockable] to Characters', () => {
    const g = mk({ hand: [ID], characters: [V.c1] });
    play(g, ID);
    expect(keywords(g, g.find('p1', 'characters', V.c1))).not.toContain('Unblockable');
  });

  it('[Counter]: your Leader gains +3000 power during this battle (any Leader name)', () => {
    const g = counterStep(
      { leader: PLAIN_BLUE, hand: [ID], costArea: { active: 3, rested: 0 } },
      {},
      V.c6,
    );
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000); // Crocodile 5000 + 3000, no choice asked
    endCounter(g);
    expect(g.life('p1')).toBe(3);
  });
});
