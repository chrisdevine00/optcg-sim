/** OP13-046 Vista. */
import { describe, expect, it } from 'vitest';
import { applyOp, withAbilities, type Ability } from '../../src/testing.ts';
import { BLUE, PURPLE, V, dec, endCounter, hand, passBlock, pick, trash } from './helpers.ts';
import { mk } from './helpers-w4sa.ts';

const ID = 'OP13-046';
const WB = 'OP02-003'; // vanilla {Whitebeard Pirates}, cost 4
const OTHER = V.c1; // not {Whitebeard Pirates}

describe('OP13-046 Vista', () => {
  /** p2 owns Vista; p1 is the player whose effects and attacks hit it. */
  const start = (p2Hand: string[] = [WB, OTHER]) =>
    mk(
      { characters: [V.c7, BLUE] },
      { characters: [{ card: ID, rested: true }], hand: p2Hand as never },
    );
  type G = ReturnType<typeof start>;
  const vista = (g: G) => g.find('p2', 'characters', ID);
  const asked = (g: G) => dec(g)?.kind === 'optional' && dec(g)?.purpose === 'replacement';
  const koEffect = (g: G, by: 'p1' | 'p2' = 'p1') =>
    (g.state = applyOp(g.state, { op: 'ko', card: vista(g), by }).state);
  const alive = (g: G) => g.zone('p2', 'characters').some((c) => c.card === ID);

  it('K.O. by an opponent’s effect: accept trashes a {Whitebeard Pirates} card and Vista stays', () => {
    const g = start();
    koEffect(g);
    expect(asked(g)).toBe(true);
    g.act({ type: 'optional', accept: true });
    // The only matching card is the one candidate.
    if (dec(g)?.kind === 'choose') pick(g, [g.find('p2', 'hand', WB)]);
    expect(alive(g)).toBe(true);
    expect(trash(g, 'p2')).toEqual([WB]);
    expect(hand(g, 'p2')).toEqual([OTHER]);
  });

  it('declining lets Vista be K.O.’d and costs nothing', () => {
    const g = start();
    koEffect(g);
    g.act({ type: 'optional', accept: false });
    expect(alive(g)).toBe(false);
    expect(hand(g, 'p2').sort()).toEqual([WB, OTHER].sort());
  });

  it('only a card with a type including "Whitebeard Pirates" pays: with none in hand only declining is legal', () => {
    const g = start([OTHER, PURPLE]);
    koEffect(g);
    // The offer is made, but accepting is not legal (the cost cannot be paid): only decline.
    expect(asked(g)).toBe(true);
    expect(g.legal().filter((a) => a.type === 'optional')).toEqual([
      { type: 'optional', accept: false, player: 'p2' },
    ]);
    g.act({ type: 'optional', accept: false });
    expect(alive(g)).toBe(false);
  });

  it('is Once Per Turn: a second K.O. the same turn is not replaced', () => {
    const g = start([WB, WB, OTHER]);
    koEffect(g);
    g.act({ type: 'optional', accept: true });
    if (dec(g)?.kind === 'choose') pick(g, [g.find('p2', 'hand', WB)]);
    expect(alive(g)).toBe(true);
    koEffect(g);
    expect(asked(g)).toBe(false);
    expect(alive(g)).toBe(false);
  });

  it('a K.O. in battle is replaced too (the K.O. entry has no cause)', () => {
    const g = start();
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c7), target: vista(g) });
    passBlock(g);
    endCounter(g);
    expect(asked(g)).toBe(true);
    g.act({ type: 'optional', accept: true });
    if (dec(g)?.kind === 'choose') pick(g, [g.find('p2', 'hand', WB)]);
    expect(alive(g)).toBe(true);
  });

  describe('removal from the field', () => {
    // BLUE of the active player has a real [Activate: Main] that returns Vista to its owner's hand.
    const bounce = {
      id: 'b',
      kind: 'activate',
      when: 'activateMain',
      effect: [
        {
          do: {
            move: {
              what: { from: 'characters', owner: 'opponent', filter: { name: 'Vista' } },
              to: { zone: 'hand' },
            },
          },
        },
      ],
    } as unknown as Ability;

    it('by the opponent’s effect: offered, and once per turn is shared with the K.O. case', () => {
      const g = start();
      g.state = withAbilities(g.state, BLUE, [bounce]);
      g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'b' });
      expect(asked(g)).toBe(true);
      g.act({ type: 'optional', accept: true });
      if (dec(g)?.kind === 'choose') pick(g, [g.find('p2', 'hand', WB)]);
      expect(alive(g)).toBe(true);
      koEffect(g); // the other event, the same turn: the one use is gone
      expect(asked(g)).toBe(false);
      expect(alive(g)).toBe(false);
    });

    it('by your own effect is not covered', () => {
      // p2's own BLUE bounces its own Vista on p2's turn.
      const own = mk({}, { characters: [ID, BLUE], hand: [WB] as never });
      own.act({ type: 'endTurn' });
      own.state = withAbilities(own.state, BLUE, [
        {
          ...bounce,
          effect: [
            {
              do: {
                move: {
                  what: { from: 'characters', owner: 'you', filter: { name: 'Vista' } },
                  to: { zone: 'hand' },
                },
              },
            },
          ],
        } as unknown as Ability,
      ]);
      own.act({ type: 'activate', card: own.find('p2', 'characters', BLUE), ability: 'b' });
      expect(asked(own)).toBe(false);
      expect(own.zone('p2', 'hand').some((c) => c.card === ID)).toBe(true);
    });
  });

  it('[Double Attack]: an unblocked attack on the Leader takes 2 Life', () => {
    const g = mk({}, { characters: [ID] });
    g.act({ type: 'endTurn' });
    // p2's turn: Vista was on the field at its start, so it may attack.
    g.act({ type: 'attack', attacker: vista(g), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    while (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
    expect(g.zone('p1', 'life')).toHaveLength(1);
  });
});
