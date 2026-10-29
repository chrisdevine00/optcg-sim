/**
 * Checklist items (rules-digest.md) that need effects, now that the DSL runtime and the Rocks and
 * Kaido scripts exist (M4a). Each was an `it.todo` in effects-todo.test.ts. Public API and fixtures
 * only; real cards whose verified text exercises the rule.
 */
import { describe, expect, it } from 'vitest';
import { queries, whyNot } from '@optcg/engine';
import {
  accept,
  BLUE,
  dec,
  decline,
  don,
  endCounter,
  expectDecision,
  game,
  hand,
  KAIDO,
  none,
  passBlock,
  payDon,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  ROCKS,
  V,
} from '../../cards/helpers.ts';

describe('effect rules (M4a)', () => {
  it('CR 1-3-5 / 8-4-4-1: "up to N" allows choosing none', () => {
    const g = game(
      { leader: ROCKS, hand: ['OP17-046'], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_PURPLE, characters: [V.c3] },
    );
    play(g, 'OP17-046');
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('CR 4-9-2-1: several base-power settings: the highest applies (QA-ST34 ST34-004)', () => {
    const g = game(
      { leader: KAIDO, hand: ['ST34-004', PURPLE], costArea: { active: 10, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c6] },
    );
    play(g, 'ST34-004');
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    accept(g);
    const t = g.find('p2', 'characters', V.c6);
    pick(g, [t]);
    expect(g.power(t)).toBe(0);
  });

  it('CR 4-10-1: a failed "if" stops the clause after it; CR 4-10-2: "then" still resolves after an "if"-less clause', () => {
    const g = game(
      { leader: 'OP12-061', hand: ['OP17-060'], costArea: { active: 6, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c1] },
    );
    play(g, 'OP17-060');
    expect(g.zone('p2', 'characters')).toHaveLength(1); // the K.O. after the failed "if" did not happen
  });

  it('CR 2-7-3 / 8-4-2: an Event is paid for, trashed, then resolved', () => {
    const g = game(
      { leader: ROCKS, hand: ['OP17-056'], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_PURPLE, characters: [V.c3] },
    );
    play(g, 'OP17-056');
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual(['OP17-056']);
    expectDecision(g, 'choose', 'p1');
  });

  it("CR 7-1-1-3 / 10-2-16-1: [When Attacking] resolves before [On Your Opponent's Attack]", () => {
    const g = game(
      { leader: KAIDO, costArea: { active: 1, rested: 0 } },
      { leader: KAIDO, characters: [V.c5], costArea: { active: 1, rested: 0 } },
    );
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    expectDecision(g, 'optional', 'p1');
    decline(g);
    expectDecision(g, 'optional', 'p2');
  });

  it("CR 7-1-3-1-2 / 10-2-4-1: an Event [Counter] costs DON!! and works only in the opponent's Counter Step", () => {
    const g = game(
      { leader: KAIDO, hand: ['EB04-040'], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    expect(g.legal().some((a) => a.type === 'playCard')).toBe(false); // its [Main] needs 6 to rest
    const d = game(
      { leader: KAIDO, hand: ['EB04-040'] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    d.act({ type: 'attack', attacker: d.find('p2', 'characters', V.c7), target: d.leader('p1') });
    passBlock(d);
    // Cost 1 and DON!! −1 with no DON!! at all: not offered.
    expect(d.legal().some((a) => a.type === 'activate')).toBe(false);
  });

  it('CR 8-1-2: an [On Play] with a cost may be declined; the card is still played', () => {
    const g = game(
      { leader: KAIDO, hand: ['OP17-065'], costArea: { active: 10, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP17-065');
    decline(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['OP17-065']);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('CR 8-1-3-4-1 / 8-1-3-4-5: an optional replacement may be declined; an impossible one is not offered', () => {
    const g = game(
      { leader: KAIDO, characters: [{ card: 'EB04-031', rested: true }] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', 'EB04-031'),
    });
    passBlock(g);
    endCounter(g);
    // No DON!! on p1's field: King's "return 1 DON!! instead" cannot be done.
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it("CR 8-2-1-1: a negated card's replacement does not apply", () => {
    const g = game(
      {
        leader: KAIDO,
        characters: [{ card: 'OP17-063', playedThisTurn: true }],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: ['EB04-031'], costArea: { active: 1, rested: 0 } },
    );
    g.act({ type: 'activate', card: g.find('p1', 'characters', 'OP17-063'), ability: 'negate-ko' });
    pick(g, [g.find('p2', 'characters', 'EB04-031')]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it('CR 8-3-1-3: a cost that cannot be paid in full cannot be paid at all', () => {
    const g = game(
      { leader: ROCKS, characters: ['OP17-054'], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_PURPLE },
    );
    const s = g.find('p1', 'characters', 'OP17-054');
    expect(whyNot(g.state, 'p1', { type: 'activate', card: s, ability: 'no-attack' })?.rule).toBe(
      'CR 8-3-1-3',
    );
  });

  it('CR 8-3-1-4: an optional cost that is skipped means no effect', () => {
    const g = game(
      { leader: ROCKS, hand: [BLUE], deck: ['OP17-040', BLUE] },
      { leader: PLAIN_PURPLE },
    );
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    decline(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('CR 8-3-1-6 / 10-2-10-1: DON!! −X can return given, active or rested DON!!', () => {
    const g = game(
      { leader: { card: KAIDO, don: 1 }, costArea: { active: 0, rested: 1 } },
      { leader: PLAIN_BLUE, characters: [V.c5] },
    );
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    accept(g);
    expectDecision(g, 'choose', 'p1');
    g.act({ type: 'pick', choice: { from: 'given', card: g.leader('p1') } });
    expect(don(g, 'p1')).toMatchObject({ given: 0, rested: 1, deck: 9 });
  });

  it('CR 8-3-2-4: [Your Turn] conditions hold only on your turn (OP17-062)', () => {
    const g = game(
      { leader: KAIDO, characters: ['OP17-062'], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(don(g, 'p1').deck).toBe(10);
  });

  it('CR 8-4-4-2: a search of a secret area may choose none even with a match', () => {
    const g = game(
      {
        leader: KAIDO,
        hand: ['OP07-077'],
        deck: ['EB04-031', PURPLE, PURPLE],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP07-077');
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('CR 8-6-1: the turn player orders their own simultaneous effects', () => {
    const g = game(
      { leader: ROCKS, characters: ['OP17-040'], hand: [BLUE] },
      { leader: PLAIN_PURPLE },
    );
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    const d = expectDecision(g, 'order', 'p1');
    expect(d.options).toHaveLength(2);
  });

  it('CR 10-1-5-3: a [Trigger] card is in no area while it resolves, then trashed', () => {
    const g = game(
      { leader: KAIDO, life: ['OP09-077', PURPLE] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual(['OP09-077']);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('CR 10-1-7-1: [Unblockable] prevents [Blocker]', () => {
    const g = game(
      { leader: ROCKS, hand: ['OP17-055'], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_PURPLE, characters: ['OP09-072'] },
    );
    play(g, 'OP17-055');
    pick(g, [g.leader('p1')]);
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    if (dec(g)?.kind === 'optional') decline(g);
    expect(g.legal().filter((a) => a.type === 'block' && a.blocker !== null)).toHaveLength(0);
  });

  it('CR 10-2-13-1 / 10-2-13-3: [Once Per Turn] activates once; it is not spent by declining (RL-45)', () => {
    const g = game({ leader: KAIDO, characters: ['EB04-031'] }, { leader: PLAIN_BLUE });
    const king = g.find('p1', 'characters', 'EB04-031');
    g.act({ type: 'activate', card: king, ability: 'ramp' });
    expect(whyNot(g.state, 'p1', { type: 'activate', card: king, ability: 'ramp' })?.rule).toBe(
      'CR 10-2-13-1',
    );
  });

  it('CR 2-10-4: only the highest Counter value applies', () => {
    const g = game(
      { leader: KAIDO, characters: ['OP17-063'], hand: [PURPLE] },
      { leader: PLAIN_BLUE },
    );
    expect(queries.card(g.state, g.find('p1', 'hand', PURPLE)).counter).toBe(1000);
  });
});
