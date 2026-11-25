/** OP16-080 Marshall.D.Teach (Leader, 5000, Life 4). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  dec,
  decline,
  endCounter,
  expectDecision,
  game,
  hand,
  passBlock,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';
import { BLACKBEARD, NO_TRIGGER, WITH_TRIGGER } from './helpers-w7c2.ts';

const ID = 'OP16-080';

describe('OP16-080 Marshall.D.Teach [Opponent’s Turn] All of your Characters gain +1 cost', () => {
  const mk = (turn: 'p1' | 'p2') =>
    game(
      { leader: ID, characters: [BLUE, BLACKBEARD] },
      { leader: PLAIN_BLUE, characters: [V.c2] },
      turn === 'p1' ? {} : { activePlayer: 'p2', turn: 4 },
    );

  it("in your opponent's turn each of your Characters costs 1 more", () => {
    const g = mk('p2');
    expect(g.card(g.find('p1', 'characters', BLUE)).cost).toBe(2);
    expect(g.card(g.find('p1', 'characters', BLACKBEARD)).cost).toBe(5);
  });

  it('in your own turn they cost what they print, and the opponent’s Characters never change', () => {
    const g = mk('p1');
    expect(g.card(g.find('p1', 'characters', BLUE)).cost).toBe(1);
    const h = mk('p2');
    expect(h.card(h.find('p2', 'characters', V.c2)).cost).toBe(2);
  });
});

describe('OP16-080 Marshall.D.Teach [On Your Opponent’s Attack] [Once Per Turn] trash a [Trigger] card', () => {
  /** p2 (turn 4) attacks `target` with its 7000 V.c5; p1 holds a [Trigger] card and a card without one. */
  const mk = (hand = [WITH_TRIGGER, NO_TRIGGER]) =>
    game(
      {
        leader: ID,
        characters: [{ card: BLUE, rested: true }, BLACKBEARD],
        hand,
        life: [V.c1, V.c2, V.c3, V.c4],
      },
      { leader: PLAIN_BLUE, characters: [V.c5, V.c4] },
      { turn: 4, activePlayer: 'p2' },
    );
  const attack = (
    g: ReturnType<typeof mk>,
    who: 'leader' | 'blue' = 'leader',
    attacker: string = V.c5,
  ) =>
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', attacker),
      target: who === 'leader' ? g.leader('p1') : g.find('p1', 'characters', BLUE),
    });
  const finish = (g: ReturnType<typeof mk>) => {
    passBlock(g);
    endCounter(g);
    while (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
  };
  const offeredCards = (g: ReturnType<typeof mk>) =>
    g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
  const mine = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);

  /** Accept the optional cost and trash the [Trigger] card. */
  const payTrigger = (g: ReturnType<typeof mk>) => {
    accept(g);
    expectDecision(g, 'choose', 'p1');
    g.act({ type: 'pick', choice: g.find('p1', 'hand', WITH_TRIGGER) });
  };

  it('trashes a card with a [Trigger] and redirects the attack from the Leader to a {Blackbeard Pirates} Character', () => {
    const g = mk();
    attack(g);
    payTrigger(g);
    expect(trash(g, 'p1')).toEqual([WITH_TRIGGER]);
    expect(offeredCards(g)).toContain(g.find('p1', 'characters', BLACKBEARD));
    g.act({ type: 'pick', choice: g.find('p1', 'characters', BLACKBEARD) });
    finish(g);
    expect(mine(g)).toEqual([BLUE]); // 7000 against 6000
    expect(g.life('p1')).toBe(4);
  });

  it('only a card with a [Trigger] can be trashed', () => {
    const g = mk();
    attack(g);
    accept(g);
    expect(offeredCards(g)).toEqual([g.find('p1', 'hand', WITH_TRIGGER)]);
  });

  it('may redirect to this Leader or a {Blackbeard Pirates} Character, not to another Character', () => {
    const g = mk();
    attack(g, 'blue');
    payTrigger(g);
    const offered = offeredCards(g);
    expect(offered).toHaveLength(2);
    expect(offered).toContain(g.leader('p1'));
    expect(offered).toContain(g.find('p1', 'characters', BLACKBEARD));
    expect(offered).not.toContain(g.find('p1', 'characters', BLUE));
  });

  it('an attack on a Character redirected to the Leader is an attack on the Leader', () => {
    const g = mk();
    attack(g, 'blue');
    payTrigger(g);
    g.act({ type: 'pick', choice: g.leader('p1') });
    finish(g);
    expect(g.life('p1')).toBe(3);
    expect(mine(g)).toEqual([BLUE, BLACKBEARD]);
  });

  it('declining trashes nothing and the attack stays', () => {
    const g = mk();
    attack(g);
    decline(g);
    expect(hand(g, 'p1')).toEqual([WITH_TRIGGER, NO_TRIGGER]);
    finish(g);
    expect(g.life('p1')).toBe(3);
  });

  it('with no card with a [Trigger] in hand it is asked all the same (the hand stays hidden) but cannot be accepted', () => {
    const g = mk([NO_TRIGGER, NO_TRIGGER]);
    attack(g);
    expectDecision(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    decline(g);
    finish(g);
    expect(g.life('p1')).toBe(3);
  });

  it('Once Per Turn: a second attack in the same turn is not offered', () => {
    const g = mk([WITH_TRIGGER, WITH_TRIGGER]);
    attack(g);
    payTrigger(g);
    g.act({ type: 'pick', choice: g.find('p1', 'characters', BLACKBEARD) });
    finish(g);
    attack(g, 'leader', V.c4);
    expect(dec(g)?.kind).toBe('block');
  });
});
