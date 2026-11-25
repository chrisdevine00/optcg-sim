/**
 * M6b wave 6, G52: the cost "place this Character (or Stage) at the bottom of the owner's deck"
 * (OP09-008, OP10-026, OP10-027, OP12-080). The card pays for its own ability by leaving the field
 * through a removal with the cause `cost`, so its given DON!! return and removal watchers see it.
 * Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { applyOp, withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, dec, game, hand, PLAIN_BLUE, PLAIN_PURPLE, PURPLE, V } from '../helpers.ts';
import { errorsOf, main, offered, run } from '../m6b-w1/probe.ts';

const placeSelf = (to: object = { zone: 'deck', position: 'bottom' }, over: object = {}) => ({
  move: { from: 'self', owner: 'you', pick: { exactly: 1 }, ...over },
  to,
});
const draw = { do: { draw: 1 } };
const STAGE = 'EB02-041'; // a Stage; its script is replaced below

const mk = (cost: unknown[] = [placeSelf()], extra: object = {}) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [BLUE], trash: [V.c1, V.c2], ...extra },
    { leader: PLAIN_BLUE },
  );
  g.state = withAbilities(g.state, BLUE, [main([draw] as never, cost as never)]);
  return g;
};

describe('G52 place this card at the bottom of the deck as a cost', () => {
  it('validates, and refuses the nonsense', () => {
    main([draw] as never, [placeSelf()] as never);
    main([draw] as never, [placeSelf({ zone: 'hand' })] as never);
    const bad = (cost: unknown) =>
      errorsOf({ id: 'a', kind: 'activate', when: 'activateMain', cost: [cost], effect: [draw] });
    expect(bad(placeSelf({ zone: 'deck', position: 'topOrBottom' }))).not.toEqual([]);
    expect(bad(placeSelf({ zone: 'life' }))).not.toEqual([]);
    expect(bad(placeSelf(undefined, { owner: 'opponent' }))).not.toEqual([]);
    expect(bad(placeSelf(undefined, { pick: { upTo: 1 } }))).not.toEqual([]);
    expect(bad(placeSelf(undefined, { pick: { exactly: 2 } }))).not.toEqual([]);
    expect(bad(placeSelf(undefined, { filter: { cost: { lte: 3 } } }))).not.toEqual([]);
    expect(bad(placeSelf(undefined, { from: ['self', 'characters'] }))).not.toEqual([]);
    // As a trash cost, or as an effect, "this card" is not implemented (an effect only in a [Trigger]).
    expect(bad({ trash: { from: 'self', owner: 'you', pick: { exactly: 1 } } })).not.toEqual([]);
    expect(
      errorsOf({
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        effect: [{ do: { move: { what: { from: 'self', owner: 'you' }, to: { zone: 'hand' } } } }],
      }),
    ).not.toEqual([]);
  });

  it('the card goes to the bottom of its owner’s deck and the effect resolves', () => {
    const g = mk();
    const deckBefore = g.zone('p1', 'deck').length;
    const handBefore = hand(g, 'p1').length;
    expect(offered(g)).toBe(true);
    run(g);
    expect(dec(g)?.kind).toBe('main'); // the cost is paid by the player who activates it
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    const deck = g.zone('p1', 'deck');
    expect(deck).toHaveLength(deckBefore); // one placed, one drawn
    expect(deck[deck.length - 1]!.card).toBe(BLUE);
    expect(hand(g, 'p1')).toHaveLength(handBefore + 1);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('is a removal with the cause cost: its DON!! return and a removal watcher fires', () => {
    const watcher = {
      id: 'w',
      kind: 'auto',
      when: [{ event: 'removed', owner: 'you', cause: 'yourEffect', to: 'deck' }],
      effect: [{ do: { draw: 1 } }],
    } as Ability;
    // A second Character carries the watcher.
    const g2 = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, PURPLE], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    g2.state = withAbilities(g2.state, BLUE, [main([draw] as never, [placeSelf()] as never)]);
    g2.state = withAbilities(g2.state, PURPLE, [watcher]);
    const handBefore = hand(g2, 'p1').length;
    run(g2);
    expect(g2.zone('p1', 'characters').map((c) => c.card)).toEqual([PURPLE]);
    // The effect's draw and the watcher's draw.
    expect(hand(g2, 'p1')).toHaveLength(handBefore + 2);
    const moved = g2.eventsOfType('CardMoved').find((e) => e.card === BLUE && e.to === 'deck')!;
    expect(moved.cause).toEqual({ kind: 'cost', by: 'p1' });
  });

  it('a Stage pays with itself too (OP12-080 Baratie)', () => {
    const g = game({ leader: PLAIN_PURPLE, stage: STAGE }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, STAGE, [
      { ...main([draw] as never, [placeSelf()] as never), id: 'a' } as Ability,
    ]);
    g.act({ type: 'activate', card: g.find('p1', 'stage', STAGE), ability: 'a' });
    expect(g.zone('p1', 'stage')).toHaveLength(0);
    const deck = g.zone('p1', 'deck');
    expect(deck[deck.length - 1]!.card).toBe(STAGE);
  });

  it('together with another card from the trash (OP10-026 Kin’emon): both go to the bottom', () => {
    const trashed = {
      move: { from: 'trash', owner: 'you', filter: { name: 'x' }, pick: { exactly: 1 } },
      to: { zone: 'deck', position: 'bottom' },
    };
    const g = mk([
      placeSelf(),
      { ...trashed, move: { ...trashed.move, filter: { cost: { lte: 1 } } } },
    ]);
    run(g);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    // In the order paid (M6b-Q73): this Character first, then the trash card below it.
    expect(deck.slice(-2)).toEqual([BLUE, V.c1]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([V.c2]);
  });

  it('is not offered when the other part of the cost cannot be paid, and nothing moves', () => {
    const g = mk([
      placeSelf(),
      {
        move: { from: 'trash', owner: 'you', filter: { cost: { gte: 9 } }, pick: { exactly: 1 } },
        to: { zone: 'deck', position: 'bottom' },
      },
    ]);
    expect(offered(g)).toBe(false);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });

  it('only a card on the field can pay with itself: an [On K.O.] cost finds the card in the trash', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [
      {
        id: 'k',
        kind: 'auto',
        when: ['onKO'],
        cost: [placeSelf()],
        effect: [draw],
      } as unknown as Ability,
    ]);
    const handBefore = hand(g, 'p1').length;
    g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p1', 'characters', BLUE),
      by: 'p2',
    }).state;
    // The cost cannot be paid (the card is in the trash): nothing is asked and nothing happens.
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toHaveLength(handBefore);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([BLUE]);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('to the hand or the trash works the same way (a field cost)', () => {
    const g = mk([placeSelf({ zone: 'hand' })]);
    run(g);
    expect(hand(g, 'p1')).toContain(BLUE);
  });
});
