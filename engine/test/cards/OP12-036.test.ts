/** OP12-036 Roronoa Zoro (Character, cost 4, 5000, <Slash>). */
import { describe, expect, it } from 'vitest';
import { applyOp, withAbilities } from '../../src/testing.ts';
import { BLUE, dec, endCounter, game, hand, PLAIN_BLUE, PLAIN_PURPLE, pick, V } from './helpers.ts';
import { main, run } from './m6b-w1/probe.ts';
import { RANGED7, SLASH6, SLASH_LEADER, STRIKE_LEADER } from './helpers-w7c2.ts';

const ID = 'OP12-036';

const playSmall = {
  do: {
    play: {
      what: { from: 'hand', owner: 'you', filter: { cost: { lte: 4 } }, pick: { upTo: 1 } },
    },
  },
};

describe('OP12-036 Roronoa Zoro: this card in your hand cannot be played by effects', () => {
  /** p1 holds Zoro and a vanilla cost 1; BLUE plays a Character of cost 4 or less from the hand. */
  const mk = (hand: string[] = [ID, V.c1]) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], hand, costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [main([playSmall] as never)]);
    return g;
  };

  it('an effect that plays from the hand cannot choose it', () => {
    const g = mk();
    run(g);
    expect(dec(g)!.kind).toBe('choose');
    const offered = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(offered).toEqual([g.find('p1', 'hand', V.c1)]);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toEqual([ID]);
  });

  it('with only Zoro in the hand the effect has nothing to play', () => {
    const g = mk([ID]);
    run(g);
    if (dec(g)?.kind === 'choose') g.act({ type: 'done' });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([BLUE]);
    expect(hand(g, 'p1')).toEqual([ID]);
  });

  it('a normal play from the hand is legal', () => {
    const g = mk();
    expect(
      g.legal().some((a) => a.type === 'playCard' && a.card === g.find('p1', 'hand', ID)),
    ).toBe(true);
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(ID);
  });

  it('only while in the hand: an effect may play it from the trash', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], trash: [ID] },
      { leader: PLAIN_BLUE },
    );
    const fromTrash = {
      do: {
        play: {
          what: { from: 'trash', owner: 'you', filter: { cost: { lte: 4 } }, pick: { upTo: 1 } },
        },
      },
    };
    g.state = withAbilities(g.state, BLUE, [main([fromTrash] as never)]);
    run(g);
    pick(g, [g.find('p1', 'trash', ID)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(ID);
  });
});

describe('OP12-036 Roronoa Zoro: with a <Slash> Leader, not K.O.d in battle by <Slash> cards, +1000', () => {
  /** p2's turn: `attacker` hits p1's rested Zoro; p1's Leader is `leader`. */
  const battle = (leader: string, attacker: string, p2Leader = PLAIN_BLUE) => {
    const g = game(
      { leader, characters: [{ card: ID, rested: true }] },
      { leader: p2Leader, characters: attacker === 'leader' ? [] : [attacker] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: attacker === 'leader' ? g.leader('p2') : g.find('p2', 'characters', attacker),
      target: g.find('p1', 'characters', ID),
    });
    g.act({ type: 'block', blocker: null });
    endCounter(g);
    return g;
  };
  const alive = (g: ReturnType<typeof battle>) => g.zone('p1', 'characters').length === 1;

  it('+1000 power only with a <Slash> Leader (boundary: 6000 against 5000)', () => {
    const a = game({ leader: SLASH_LEADER, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(a.power(a.find('p1', 'characters', ID))).toBe(6000);
    const b = game({ leader: STRIKE_LEADER, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(b.power(b.find('p1', 'characters', ID))).toBe(5000);
  });

  it('a <Slash> Character that beats its power does not K.O. it', () => {
    const g = battle(SLASH_LEADER, SLASH6); // 6000 against 6000
    expect(alive(g)).toBe(true);
    expect(g.eventsOfType('KOPrevented').length).toBeGreaterThan(0);
  });

  it('a <Slash> Leader does not K.O. it either', () => {
    const g = battle(SLASH_LEADER, 'leader', SLASH_LEADER);
    expect(alive(g)).toBe(true);
  });

  it('a non-<Slash> Character still K.O. it (7000 against 6000)', () => {
    const g = battle(SLASH_LEADER, RANGED7);
    expect(alive(g)).toBe(false);
  });

  it('without a <Slash> Leader neither the protection nor the power applies', () => {
    const g = battle(STRIKE_LEADER, SLASH6); // 6000 against 5000
    expect(alive(g)).toBe(false);
  });

  it('an effect K.O. is not stopped', () => {
    const g = game({ leader: SLASH_LEADER, characters: [ID] }, { leader: SLASH_LEADER });
    g.state = applyOp(g.state, { op: 'ko', card: g.find('p1', 'characters', ID), by: 'p2' }).state;
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});
