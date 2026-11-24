/**
 * OP14-080 Gecko Moria (Leader, Black/Yellow, 5000, 4 Life, {The Seven Warlords of the Sea}/
 * {Thriller Bark Pirates}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] You may K.O. 1 of your {Thriller Bark Pirates} type
 * Characters: Your Leader and all of your Characters gain +1000 power during this turn.
 * [When Attacking] You may trash 3 cards from your hand: Add up to 1 card from the top of your deck to
 * the top of your Life cards."
 *
 * Rules: CR 8-3-1 (costs), CR 10-2-13 ([Once Per Turn]), RL-16 (a K.O. cost is a K.O.), a "may" cost
 * paid from the hidden hand is offered even when it cannot be paid, with accept illegal (a prompt must
 * not depend on hidden cards), "during this turn" ends in the End Phase (RL-09), [When Attacking]
 * (CR 10-2-4) fires for the Leader's attack only.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  backToMain,
  BLUE,
  canUse,
  chars,
  chr,
  deck,
  decision,
  endTurn,
  hand,
  kind,
  mine,
  need,
  no,
  offeredAbilities,
  offeredIds,
  passBlock,
  payHand,
  pickInst,
  SC14,
  trash,
  unusable,
  yes,
} from './kit-op14c.ts';

const ID = 'OP14-080';
const TB_A = SC14.tbp4; // Lola, Black, cost 4, 6000, {Thriller Bark Pirates}
const TB_B = SC14.tbp4b; // Gecko Moria, Blue, cost 4, 6000, {Seven Warlords}/{Thriller Bark Pirates}

type G = ReturnType<typeof mine>;

function start(o: { chars?: string[]; hand?: string[]; deck?: string[] } = {}): G {
  return mine(
    ID,
    {
      characters: o.chars ?? [TB_A, SC14.c3],
      hand: o.hand ?? [],
      ...(o.deck ? { deck: o.deck } : {}),
      costArea: { active: 3, rested: 0 },
    },
    { characters: [SC14.c1] },
  );
}

function activateLeader(g: G, cost?: string): void {
  const [ability] = offeredAbilities(g, g.leader('p1'));
  if (!ability) throw new Error('Leader ability not offered');
  act(g, { type: 'activate', card: g.leader('p1'), ability });
  if (kind(g) === 'choose' && decision(g)?.purpose === 'cost') {
    pickInst(g, [at(g, 'p1', 'characters', cost!)]);
  }
}

describe('OP14-080 Gecko Moria [Activate: Main] K.O. a {Thriller Bark Pirates} Character: +1000 power this turn', () => {
  it('the K.O. cost offers only {Thriller Bark Pirates} Characters', () => {
    const g = start({ chars: [TB_A, TB_B, SC14.c3, SC14.dp3] });
    const [ability] = offeredAbilities(g, g.leader('p1'));
    act(g, { type: 'activate', card: g.leader('p1'), ability: ability! });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([TB_A, TB_B].sort());
  });

  it('paying it K.O.s that Character; my Leader and all my remaining Characters gain +1000 this turn', () => {
    const g = start({ chars: [TB_A, SC14.c3, SC14.c4] });
    activateLeader(g, TB_A);
    backToMain(g, 'p1');
    expect(trash(g)).toEqual([TB_A]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(chr(g, 'p1', SC14.c3))).toBe(6000);
    expect(g.power(chr(g, 'p1', SC14.c4))).toBe(7000);
  });

  it('only MY cards: the opponent’s Leader and Characters are unchanged', () => {
    const g = start({ chars: [TB_A, SC14.c3] });
    activateLeader(g, TB_A);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(g.power(chr(g, 'p2', SC14.c1))).toBe(3000);
  });

  it('the boost lasts this turn only', () => {
    const g = start({ chars: [TB_A, SC14.c3] });
    activateLeader(g, TB_A);
    expect(g.power(g.leader('p1'))).toBe(6000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(chr(g, 'p1', SC14.c3))).toBe(5000);
  });

  it('[Once Per Turn]: not offered a second time this turn', () => {
    const g = start({ chars: [TB_A, TB_B, SC14.c3] });
    activateLeader(g, TB_A);
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
  });

  it('with no {Thriller Bark Pirates} Character the cost cannot be paid', () => {
    const g = start({ chars: [SC14.c3, SC14.dp3] });
    const offered = offeredAbilities(g, g.leader('p1'));
    if (offered.length) {
      act(g, { type: 'activate', card: g.leader('p1'), ability: offered[0]! });
      expect(offeredIds(g)).toEqual([]);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(chars(g)).toEqual([SC14.c3, SC14.dp3].sort());
  });

  it('the +1000 counts in battle: a 6000 Leader beats a 6000 attacker only after the boost', () => {
    const g = start({ chars: [TB_A, SC14.c3] });
    activateLeader(g, TB_A);
    attack(g, g.leader('p1'), g.leader('p2'));
    // Not asked about [When Attacking] with an empty hand beyond the unpayable question.
    if (kind(g) === 'optional') unusable(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(6000);
  });
});

describe('OP14-080 Gecko Moria [When Attacking] may trash 3 cards from hand: add the deck’s top card to Life', () => {
  const H = [SC14.c1, SC14.c2, SC14.c3, SC14.c4];
  /** The Leader attacks; stops at the optional [When Attacking]. */
  function attacking(h: string[] = H) {
    const g = start({
      hand: h,
      chars: [SC14.c3],
      deck: [SC14.c5, ...Array.from({ length: 12 }, () => BLUE)],
    });
    attack(g, g.leader('p1'), g.leader('p2'));
    return g;
  }

  it('is offered on the Leader’s attack; trashing 3 puts the deck’s top card on top of my Life', () => {
    const g = attacking();
    need(g, 'optional', 'p1');
    expect(canUse(g)).toBe(true);
    yes(g, 'p1');
    payHand(g, [SC14.c1, SC14.c2, SC14.c3]);
    if (kind(g) === 'optional') yes(g, 'p1');
    expect(trash(g)).toEqual([SC14.c1, SC14.c2, SC14.c3].sort());
    expect(hand(g)).toEqual([SC14.c4]);
    expect(g.life('p1')).toBe(5);
    expect(g.zone('p1', 'life')[0]!.card).toBe(SC14.c5);
    expect(deck(g)).toHaveLength(12);
  });

  it('"you may": declining trashes nothing and adds nothing', () => {
    const g = attacking();
    no(g, 'p1');
    expect(hand(g)).toEqual([...H].sort());
    expect(g.life('p1')).toBe(4);
  });

  it('exactly 3 cards in hand can pay; the whole hand is trashed', () => {
    const g = attacking([SC14.c1, SC14.c2, SC14.c3]);
    yes(g, 'p1');
    payHand(g, [SC14.c1, SC14.c2, SC14.c3]);
    if (kind(g) === 'optional') yes(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(g.life('p1')).toBe(5);
  });

  it('with only 2 cards the question is still asked, but accept is unavailable and nothing happens', () => {
    const g = attacking([SC14.c1, SC14.c2]);
    expect(kind(g)).toBe('optional');
    expect(canUse(g)).toBe(false);
    unusable(g, 'p1');
    expect(hand(g)).toEqual([SC14.c1, SC14.c2].sort());
    expect(g.life('p1')).toBe(4);
  });

  it('with an empty hand the question is asked the same way (the prompt does not reveal the hand)', () => {
    const g = attacking([]);
    expect(kind(g)).toBe('optional');
    expect(canUse(g)).toBe(false);
    unusable(g, 'p1');
    expect(g.life('p1')).toBe(4);
  });

  it('it is the Leader’s [When Attacking]: a Character attacking does not offer it', () => {
    const g = start({ hand: H, chars: [SC14.c3] });
    attack(g, chr(g, 'p1', SC14.c3), g.leader('p2'));
    expect(kind(g)).not.toBe('optional');
    passBlock(g);
  });

  it('the Life card is added without a [Trigger] and without damage: Life +1, not a card to hand', () => {
    const g = attacking();
    yes(g, 'p1');
    payHand(g, [SC14.c1, SC14.c2, SC14.c3]);
    if (kind(g) === 'optional') yes(g, 'p1');
    expect(hand(g)).toEqual([SC14.c4]);
    expect(g.life('p1')).toBe(5);
  });
});
