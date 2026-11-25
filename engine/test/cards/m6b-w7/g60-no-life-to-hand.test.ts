/**
 * M6b wave 7, G60: "you cannot add Life cards to your hand using your own effects during this
 * turn" (ST15-001 Atmos). A restriction on the player, like `cannotDrawByOwnEffects`: it stops the
 * effects of the player (a cost included, M6b-Q31) that take a Life card of theirs into their hand.
 * Damage, the opponent's Life, and the opponent's effects are not stopped. Planted on vanilla
 * cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, game, hand, PLAIN_BLUE, PLAIN_PURPLE, PURPLE, V } from '../helpers.ts';
import { errorsOf, main } from '../m6b-w1/probe.ts';

const lock = {
  do: {
    restrict: { target: 'you', what: 'cannotAddLifeToHandByOwnEffects', duration: 'thisTurn' },
  },
};
const topToHand = (owner = 'you') => ({
  do: { move: { what: { from: 'lifeTop', owner, pick: { exactly: 1 } }, to: { zone: 'hand' } } },
});
const eitherEnd = {
  do: {
    move: {
      what: { from: 'lifeTopOrBottom', owner: 'you', pick: { exactly: 1 } },
      to: { zone: 'hand' },
    },
  },
};
const withId = (a: Ability, id: string): Ability => ({ ...a, id }) as Ability;

/** p1 has BLUE (the lock), PURPLE (a Life move per ability) and the Life cards V.c1..V.c3. */
const mk = () => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [BLUE, PURPLE], life: [V.c1, V.c2, V.c3] },
    { leader: PLAIN_BLUE, life: [V.c4, V.c5, V.c6] },
  );
  g.state = withAbilities(g.state, BLUE, [main([lock] as never)]);
  g.state = withAbilities(g.state, PURPLE, [
    withId(main([topToHand()] as never), 'a'),
    withId(main([topToHand('opponent')] as never), 'b'),
    withId(main([eitherEnd] as never), 'c'),
    withId(main([{ do: { draw: 1 } }] as never, [{ lifeToHand: { from: 'top', n: 1 } }]), 'd'),
  ]);
  return g;
};
const lockIt = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'a' });
const use = (g: ReturnType<typeof mk>, ability: string) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', PURPLE), ability });
const offered = (g: ReturnType<typeof mk>, ability: string) =>
  g
    .legal()
    .some(
      (a) =>
        a.type === 'activate' &&
        a.ability === ability &&
        a.card === g.find('p1', 'characters', PURPLE),
    );

describe('G60 cannot add Life cards to your hand using your own effects', () => {
  it('validates, and refuses the nonsense', () => {
    const bad = (restrict: unknown) =>
      errorsOf({ id: 'a', kind: 'activate', when: 'activateMain', effect: [{ do: { restrict } }] });
    expect(
      bad({ target: 'you', what: 'cannotAddLifeToHandByOwnEffects', duration: 'thisTurn' }),
    ).toEqual([]);
    // It is a restriction on the player who is barred from their own effects.
    expect(
      bad({ target: 'opponent', what: 'cannotAddLifeToHandByOwnEffects', duration: 'thisTurn' }),
    ).not.toEqual([]);
    expect(
      bad({
        target: { from: 'characters', owner: 'you', pick: { exactly: 1 } },
        what: 'cannotAddLifeToHandByOwnEffects',
        duration: 'thisTurn',
      }),
    ).not.toEqual([]);
    expect(
      errorsOf({
        id: 'p',
        kind: 'permanent',
        apply: [
          {
            restrict: {
              target: { from: 'self', owner: 'you' },
              what: 'cannotAddLifeToHandByOwnEffects',
            },
          },
        ],
      }),
    ).not.toEqual([]);
  });

  it('with no restriction, the Life card goes to the hand', () => {
    const g = mk();
    const before = hand(g, 'p1').length;
    use(g, 'a');
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toHaveLength(before + 1);
  });

  it('with the restriction, your own effect takes no Life card to your hand', () => {
    const g = mk();
    lockIt(g);
    const before = hand(g, 'p1').length;
    use(g, 'a');
    expect(g.life('p1')).toBe(3);
    expect(hand(g, 'p1')).toHaveLength(before);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('the "top or bottom" form is stopped too', () => {
    const g = mk();
    lockIt(g);
    use(g, 'c');
    expect(g.life('p1')).toBe(3);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('a cost that adds a Life card to your hand is part of the effect: it cannot be paid', () => {
    const g = mk();
    expect(offered(g, 'd')).toBe(true);
    lockIt(g);
    expect(offered(g, 'd')).toBe(false);
  });

  it('the opponent’s Life is not yours: it still goes to its owner’s hand', () => {
    const g = mk();
    lockIt(g);
    const before = hand(g, 'p2').length;
    use(g, 'b');
    expect(g.life('p2')).toBe(2);
    expect(hand(g, 'p2')).toHaveLength(before + 1);
  });

  it('damage is not an effect of yours: you take it as usual', () => {
    const g = mk();
    lockIt(g);
    g.act({ type: 'endTurn' });
    // p2 attacks p1's Leader; the damage still takes a Life card.
    const atk = g.find('p2', 'leader', PLAIN_BLUE);
    g.act({ type: 'attack', attacker: atk, target: g.leader('p1') });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    while (g.decider === 'p1' && g.legal().some((x) => x.type === 'trigger'))
      g.act({ type: 'trigger', activate: false });
    expect(g.life('p1')).toBe(2);
  });

  it('it ends with the turn', () => {
    const g = mk();
    lockIt(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.eventsOfType('ModifierExpired').length).toBeGreaterThan(0);
    use(g, 'a');
    expect(g.life('p1')).toBe(2);
  });
});
