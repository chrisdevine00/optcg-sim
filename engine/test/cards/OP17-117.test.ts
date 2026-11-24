/** OP17-117 Maser Saber. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  dec,
  endCounter,
  expectDecision,
  game,
  hand,
  none,
  option,
  passBlock,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { ENEL, attackP1Leader, throughBattle } from './helpers-robin.ts';
import { LINLIN } from './helpers-op17g3.ts';

const ID = 'OP17-117';

/** p2's 7000 attacker hits p1's Leader; the top Life card is the Event: p1 owes the [Trigger]. */
const trig = (oppHand: string[], oppChars: string[] = [V.c5, V.c6]) => {
  const g = game(
    { leader: ENEL, life: [ID, PURPLE] },
    { leader: PLAIN_BLUE, characters: [V.c7, ...oppChars], hand: oppHand },
    { turn: 4, activePlayer: 'p2' },
  );
  attackP1Leader(g);
  throughBattle(g);
  expectDecision(g, 'trigger', 'p1');
  g.act({ type: 'trigger', activate: true });
  return g;
};

describe('OP17-117 Maser Saber', () => {
  it('[Trigger] the opponent (with 3+ cards in hand) chooses to trash 3 cards: nothing is K.O.d', () => {
    const g = trig([BLUE, BLUE, PURPLE, PURPLE]);
    expectDecision(g, 'choose', 'p2');
    option(g, '0');
    pick(g, [
      g.find('p2', 'hand', PURPLE, 0),
      g.find('p2', 'hand', PURPLE, 1),
      g.find('p2', 'hand', BLUE),
    ]);
    expect(trash(g, 'p2')).toHaveLength(3);
    expect(hand(g, 'p2')).toHaveLength(1);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
  });

  it('[Trigger] if they do not trash, you K.O. up to 1 of their Characters with a cost of 6 or less', () => {
    const g = trig([BLUE, BLUE, PURPLE]);
    expectDecision(g, 'choose', 'p2');
    option(g, '1');
    expectDecision(g, 'choose', 'p1'); // you pick the K.O. target
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(hand(g, 'p2')).toHaveLength(3);
    expect(
      g
        .zone('p2', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([V.c5, V.c7].sort());
  });

  it('a Character with a cost of 7 is not a legal K.O. target; "up to 1" may K.O. nothing', () => {
    const g = trig([BLUE, BLUE, PURPLE], [V.c6]);
    option(g, '1');
    // Legal picks: only the cost-6 Character, not the cost-7 attacker.
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks).toHaveLength(1);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('with fewer than 3 cards in hand the opponent cannot trash: the K.O. happens without a choice', () => {
    const g = trig([BLUE, BLUE]);
    expect(dec(g)?.kind).toBe('choose');
    expect(dec(g)?.player).toBe('p1');
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(hand(g, 'p2')).toHaveLength(2);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('[Counter] up to 1 of your [Charlotte Linlin] gains +3000 power during this battle', () => {
    const g = game(
      { leader: LINLIN, hand: [ID], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c4] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', ID), ability: 'counter' });
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('[Counter] a Leader not named [Charlotte Linlin] gets nothing', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c4] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', ID), ability: 'counter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
