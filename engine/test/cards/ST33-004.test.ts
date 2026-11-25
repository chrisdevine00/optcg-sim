/** ST33-004 Borsalino (Character, cost 6, 6000, [Blocker]). */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../src/testing.ts';
import { game, hand, PLAIN_BLUE, PLAIN_PURPLE, pick, V } from './helpers.ts';

const ID = 'ST33-004';

/** A planted [Activate: Main] on a vanilla Character: it trashes 1 card from the hand of `owner`. */
const trasher = (owner: 'you' | 'opponent'): Ability =>
  ({
    id: 'a',
    kind: 'activate',
    when: 'activateMain',
    effect: [
      {
        do: {
          trashFromHand: {
            from: 'hand',
            owner,
            pick: { exactly: 1 },
            ...(owner === 'opponent' ? { chooser: 'opponent' } : {}),
          },
        },
      },
    ],
  }) as unknown as Ability;
/** The same trash paid as a cost: "trash 1 card from your hand: draw 1". */
const costTrasher: Ability = {
  id: 'a',
  kind: 'activate',
  when: 'activateMain',
  cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
  effect: [{ do: { draw: 1 } }],
} as unknown as Ability;

const mk = (don = 3, activePlayer: 'p1' | 'p2' = 'p1') =>
  game(
    {
      leader: PLAIN_BLUE,
      characters: [V.c1],
      hand: [ID, V.c2, V.c3],
      costArea: { active: don, rested: 0 },
    },
    { leader: PLAIN_PURPLE, characters: [V.c1], hand: [V.c4, V.c5] },
    activePlayer === 'p2' ? { activePlayer: 'p2', turn: 4 } : {},
  );
const costOf = (g: ReturnType<typeof mk>) => g.card(g.find('p1', 'hand', ID)).cost;
const canPlay = (g: ReturnType<typeof mk>) =>
  g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', ID), player: 'p1' });
const use = (g: ReturnType<typeof mk>, who: 'p1' | 'p2' = 'p1') =>
  g.act({ type: 'activate', card: g.find(who, 'characters', V.c1), ability: 'a', player: who });

describe('ST33-004 Borsalino', () => {
  it('costs 6 in hand until a card of your hand is trashed by an effect this turn, then 3', () => {
    const g = mk();
    g.state = withAbilities(g.state, V.c1, [trasher('you')]);
    expect(costOf(g)).toBe(6);
    expect(canPlay(g)).toBe(false); // 3 active DON!! are not enough for 6
    use(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(costOf(g)).toBe(3);
    expect(canPlay(g)).toBe(true);
  });

  it('boundary: 2 DON!! do not pay the reduced cost of 3, and a cost of 3 takes exactly 3 DON!!', () => {
    const two = mk(2);
    two.state = withAbilities(two.state, V.c1, [trasher('you')]);
    use(two);
    pick(two, [two.find('p1', 'hand', V.c2)]);
    expect(canPlay(two)).toBe(false);
    const three = mk(3);
    three.state = withAbilities(three.state, V.c1, [trasher('you')]);
    use(three);
    pick(three, [three.find('p1', 'hand', V.c2)]);
    three.act({ type: 'playCard', card: three.find('p1', 'hand', ID) });
    expect(three.zone('p1', 'characters').map((c) => c.card)).toContain(ID);
    expect(three.card(three.find('p1', 'characters', ID)).cost).toBe(6); // on the field it costs its own 6
  });

  it('a card trashed as a cost counts (M6b-Q87, a cost is part of the effect)', () => {
    const g = mk();
    g.state = withAbilities(g.state, V.c1, [costTrasher]);
    use(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(costOf(g)).toBe(3);
  });

  it('the opponent’s effect on your hand counts; your effect on the opponent’s hand does not', () => {
    const theirs = mk(3, 'p2');
    theirs.state = withAbilities(theirs.state, V.c1, [trasher('opponent')]);
    use(theirs, 'p2');
    pick(theirs, [theirs.find('p1', 'hand', V.c2)]);
    expect(costOf(theirs)).toBe(3);

    const mine = mk();
    mine.state = withAbilities(mine.state, V.c1, [trasher('opponent')]);
    use(mine);
    pick(mine, [mine.find('p2', 'hand', V.c4)]);
    expect(hand(mine, 'p2')).toHaveLength(1);
    expect(costOf(mine)).toBe(6);
  });

  it('a card that leaves the hand some other way (to the deck) does not count', () => {
    const g = mk();
    g.state = withAbilities(g.state, V.c1, [
      {
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        effect: [
          {
            do: {
              move: {
                what: { from: 'hand', owner: 'you', pick: { exactly: 1 } },
                to: { zone: 'deck', position: 'bottom' },
              },
            },
          },
        ],
      } as unknown as Ability,
    ]);
    use(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(costOf(g)).toBe(6);
  });

  it('the reduction is for this turn only: the card costs 6 again on the next turn', () => {
    const g = mk();
    g.state = withAbilities(g.state, V.c1, [trasher('you')]);
    use(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(costOf(g)).toBe(3);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(costOf(g)).toBe(6);
  });
});
