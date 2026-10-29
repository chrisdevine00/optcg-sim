/** CR 7-1 (battle), 10-1 (keyword effects) and 10-2-1 (K.O.). RL-17..RL-21. */
import { describe, expect, it } from 'vitest';
import { queries, whyNot } from '../../src/index.ts';
import { scenario } from '../fixtures/index.ts';
import {
  BANISH,
  BLOCKER,
  BLOCKER_LAW,
  DOUBLE,
  give,
  KAIDO,
  LUFFY,
  noDefence,
  op,
  PUR_1,
  PUR_1B,
  RED_1,
  RED_5,
  ROCKS,
  RUSH,
  RUSH_CHAR,
  times,
  types,
} from '../support/game.ts';

const life = times(5, PUR_1);

describe('declaring attacks (CR 7-1, 7-1-1-1, 7-1-1-2, RL-17)', () => {
  it("targets are the opponent's Leader or rested Characters; active Characters cannot be attacked", () => {
    const g = scenario({
      p1: { leader: LUFFY },
      p2: { leader: KAIDO, characters: [PUR_1, { card: PUR_1B, rested: true }] },
    });
    const attacks = g.legal().filter((a) => a.type === 'attack');
    expect(attacks.map((a) => a.type === 'attack' && a.target).sort()).toEqual(
      [g.leader('p2'), g.find('p2', 'characters', PUR_1B)].sort(),
    );
    expect(
      whyNot(g.state, 'p1', {
        type: 'attack',
        attacker: g.leader('p1'),
        target: g.find('p2', 'characters', PUR_1),
      }),
    ).toEqual({
      text: "Active Characters can't be attacked.",
      rule: 'CR 7-1-1-2',
    });
  });

  it('the attacker must be active and is rested to declare (CR 7-1-1-1)', () => {
    const g = scenario({ p1: { leader: { card: LUFFY, rested: true } }, p2: { leader: KAIDO } });
    expect(
      whyNot(g.state, 'p1', { type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') }),
    ).toMatchObject({ rule: 'CR 7-1-1-1' });
    const h = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, life } });
    h.act({ type: 'attack', attacker: h.leader('p1'), target: h.leader('p2') });
    expect(h.card(h.leader('p1')).rested).toBe(true);
    expect(queries.turn(h.state).battleStep).toBe('block');
  });

  it('there is no per-turn attack limit: a card set active again may attack again (RL-17)', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, life } });
    give(g, LUFFY, [
      {
        id: 'again',
        kind: 'auto',
        when: ['endOfBattle'],
        effect: [{ op: 'setActive', target: 'self' }],
      },
    ]);
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    noDefence(g);
    expect(
      g.isLegal({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2'), player: 'p1' }),
    ).toBe(true);
  });
});

describe('Attack Step order (CR 7-1-1-3, 10-2-16-1)', () => {
  it("[When Attacking] resolves before [On Your Opponent's Attack], before the Block Step", () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, life } });
    give(g, LUFFY, [
      {
        id: 'wa',
        kind: 'auto',
        when: ['whenAttacking'],
        effect: [{ op: 'emit', label: 'attacker' }],
      },
    ]);
    give(g, KAIDO, [
      {
        id: 'oa',
        kind: 'auto',
        when: ['onOpponentAttack'],
        effect: [{ op: 'emit', label: 'defender' }],
      },
    ]);
    const ev = g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    expect(ev.filter((e) => e.type === 'EffectResolved').map((e) => e.label)).toEqual([
      'attacker',
      'defender',
    ]);
    expect(queries.decision(g.state)).toMatchObject({ kind: 'block', player: 'p2' });
  });

  it('CR 7-1-1-4: if the target leaves during the Attack Step, the battle skips to its end (RL-34)', () => {
    const g = scenario({
      p1: { leader: LUFFY },
      p2: { leader: KAIDO, characters: [{ card: PUR_1, rested: true }] },
    });
    const t = g.find('p2', 'characters', PUR_1);
    give(g, LUFFY, [
      { id: 'wa', kind: 'auto', when: ['whenAttacking'], effect: [{ op: 'ko', target: t }] },
    ]);
    give(g, KAIDO, [
      {
        id: 'oa',
        kind: 'auto',
        when: ['onOpponentAttack'],
        effect: [{ op: 'emit', label: 'still-fires' }],
      },
    ]);
    const ev = g.act({ type: 'attack', attacker: g.leader('p1'), target: t });
    expect(ev.some((e) => e.type === 'EffectResolved' && e.label === 'still-fires')).toBe(true);
    expect(types(ev)).toContain('BattleEnded');
    expect(types(ev)).not.toContain('DamageStep');
    expect(queries.decision(g.state)).toMatchObject({ kind: 'main', player: 'p1' });
  });

  it('CR 7-1-2-3: if the attacker leaves during the Block Step, the battle skips to its end', () => {
    const g = scenario({
      p1: { leader: LUFFY, characters: [RED_5] },
      p2: { leader: KAIDO, characters: [BLOCKER], life },
    });
    const a = g.find('p1', 'characters', RED_5);
    give(g, BLOCKER, [
      { id: 'ob', kind: 'auto', when: ['onBlock'], effect: [{ op: 'ko', target: a }] },
    ]);
    g.act({ type: 'attack', attacker: a, target: g.leader('p2') });
    const ev = g.act({ type: 'block', blocker: g.find('p2', 'characters', BLOCKER) });
    expect(types(ev)).toContain('BattleEnded');
    expect(types(ev)).not.toContain('DamageStep');
    expect(g.life('p2')).toBe(5);
  });

  it('CR 7-1-3-1-3: if the target leaves during the Counter Step, there is no Damage Step', () => {
    const g = scenario({
      p1: { leader: LUFFY, characters: [RED_5] },
      p2: { leader: KAIDO, characters: [{ card: PUR_1, rested: true }] },
    });
    const t = g.find('p2', 'characters', PUR_1);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', RED_5), target: t });
    g.act({ type: 'block', blocker: null });
    op(g, { op: 'bounce', card: t, by: 'p2' });
    const ev = g.act({ type: 'endCounter' });
    expect(types(ev)).not.toContain('DamageStep');
  });
});

describe('Block Step (CR 7-1-2, 10-1-4-1, RL-18, RL-19)', () => {
  const mk = () =>
    scenario({
      p1: { leader: LUFFY, characters: [RED_5] },
      p2: {
        leader: KAIDO,
        characters: [BLOCKER, { card: BLOCKER_LAW, rested: true }, PUR_1],
        life,
      },
    });

  it('only an active card with [Blocker], other than the target, may block; declining is allowed', () => {
    const g = mk();
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', RED_5), target: g.leader('p2') });
    const blocks = g.legal().filter((a) => a.type === 'block');
    expect(blocks).toEqual([
      { type: 'block', blocker: g.find('p2', 'characters', BLOCKER), player: 'p2' },
      { type: 'block', blocker: null, player: 'p2' },
    ]);
    expect(
      whyNot(g.state, 'p2', { type: 'block', blocker: g.find('p2', 'characters', BLOCKER_LAW) }),
    ).toMatchObject({ rule: 'CR 10-1-4-1' });
    expect(
      whyNot(g.state, 'p2', { type: 'block', blocker: g.find('p2', 'characters', PUR_1) })!.text,
    ).toMatch(/doesn't have \[Blocker\]/);
  });

  it('the Blocker rests and becomes the target; [On Block] activates (CR 7-1-2-2, 10-2-15-1)', () => {
    const g = mk();
    give(g, BLOCKER, [
      { id: 'ob', kind: 'auto', when: ['onBlock'], effect: [{ op: 'emit', label: 'blocked' }] },
    ]);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', RED_5), target: g.leader('p2') });
    const b = g.find('p2', 'characters', BLOCKER);
    const ev = g.act({ type: 'block', blocker: b });
    expect(types(ev)).toEqual(expect.arrayContaining(['BlockerActivated', 'EffectResolved']));
    expect(g.card(b).rested).toBe(true);
    g.act({ type: 'endCounter' });
    // 6000 vs 5000: the blocker is K.O.'d, the Leader untouched.
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([BLOCKER]);
    expect(g.life('p2')).toBe(5);
  });

  it('CR 7-1-2-1: one Blocker per battle; the Block Step does not come back', () => {
    const g = mk();
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', RED_5), target: g.leader('p2') });
    g.act({ type: 'block', blocker: null });
    expect(queries.decision(g.state)!.kind).toBe('counter');
    expect(g.legal().some((a) => a.type === 'block')).toBe(false);
  });

  it('the card being attacked cannot use its own [Blocker]', () => {
    const g = scenario({
      p1: { leader: LUFFY, characters: [RED_5] },
      p2: { leader: KAIDO, characters: [{ card: BLOCKER, rested: true }], life },
    });
    const b = g.find('p2', 'characters', BLOCKER);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', RED_5), target: b });
    expect(whyNot(g.state, 'p2', { type: 'block', blocker: b })!.text).toMatch(/own \[Blocker\]/);
  });

  it('CR 10-1-7-1: [Unblockable] stops [Blocker]', () => {
    const g = mk();
    const a = g.find('p1', 'characters', RED_5);
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'grant',
        keyword: 'Unblockable',
        target: a,
        controller: 'p1',
        duration: { kind: 'thisTurn', turn: 3 },
      },
    });
    g.act({ type: 'attack', attacker: a, target: g.leader('p2') });
    expect(g.legal().filter((x) => x.type === 'block')).toEqual([
      { type: 'block', blocker: null, player: 'p2' },
    ]);
    expect(
      whyNot(g.state, 'p2', { type: 'block', blocker: g.find('p2', 'characters', BLOCKER) }),
    ).toMatchObject({ rule: 'CR 10-1-7-1' });
  });

  it('RL-19: a Leader with [Blocker] (OP05-022) can block an attack on a Character, and takes damage', () => {
    const g = scenario({
      turn: 4,
      activePlayer: 'p2',
      p1: {
        leader: 'OP05-022',
        characters: [{ card: 'OP03-052', rested: true }],
        life: times(4, 'OP03-052'),
      },
      p2: { leader: KAIDO, characters: [{ card: 'OP15-062', don: 0 }] },
    });
    const att = g.zone('p2', 'characters')[0]!.instance; // 6000
    g.act({ type: 'attack', attacker: att, target: g.find('p1', 'characters', 'OP03-052') });
    g.act({ type: 'block', blocker: g.leader('p1') });
    expect(g.card(g.leader('p1')).rested).toBe(true);
    g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(3);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });
});

describe('Counter Step (CR 7-1-3-1-1, RL-08)', () => {
  it("a Character Counter from hand is free, may target any of the defender's cards, and lasts the battle", () => {
    const g = scenario({
      p1: { leader: LUFFY },
      p2: {
        leader: KAIDO,
        hand: ['OP02-080', PUR_1],
        characters: [{ card: PUR_1B, rested: true }],
        life,
      },
    });
    const z = g.find('p2', 'characters', PUR_1B);
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    g.act({ type: 'block', blocker: null });
    const c = g.find('p2', 'hand', PUR_1);
    const ev = g.act({ type: 'counter', card: c, target: z });
    expect(types(ev)).toEqual(
      expect.arrayContaining(['CardMoved', 'PowerModified', 'CounterPlayed']),
    );
    expect(g.power(z)).toBe(4000);
    expect(queries.don(g.state, 'p2').rested).toBe(0);
    g.act({ type: 'endCounter' });
    expect(g.life('p2')).toBe(4); // 5000 vs 5000: attacker wins ties
    expect(g.power(z)).toBe(3000); // expired at End of the Battle
  });

  it('only the defender acts, only from hand, and only cards with a Counter value', () => {
    const g = scenario({
      p1: { leader: LUFFY, hand: [PUR_1] },
      p2: { leader: KAIDO, hand: ['OP17-065'], characters: [PUR_1B], life },
    });
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    g.act({ type: 'block', blocker: null });
    expect(g.legal().filter((a) => a.type === 'counter')).toEqual([]);
    expect(
      whyNot(g.state, 'p2', {
        type: 'counter',
        card: g.find('p2', 'hand', 'OP17-065'),
        target: g.leader('p2'),
      }),
    ).toMatchObject({ rule: 'CR 7-1-3-1-1' });
    expect(
      whyNot(g.state, 'p2', {
        type: 'counter',
        card: g.find('p2', 'characters', PUR_1B),
        target: g.leader('p2'),
      })!.text,
    ).toMatch(/from your hand/);
  });

  it('counter boosts on the Leader end with the battle (RL-08 second case)', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, hand: [PUR_1], life } });
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'counter', card: g.find('p2', 'hand', PUR_1), target: g.leader('p2') });
    g.act({ type: 'endCounter' });
    expect(g.life('p2')).toBe(5); // 5000 < 6000
    expect(g.power(g.leader('p2'))).toBe(5000);
  });
});

describe('Damage Step (CR 7-1-4)', () => {
  it('CR 7-1-4-1: the attacker wins ties, including 0 vs 0 and negative vs negative', () => {
    for (const [a, t] of [
      [0, 0],
      [-2000, -2000],
    ] as const) {
      const g = scenario({
        p1: { leader: LUFFY, characters: [RED_1] },
        p2: { leader: KAIDO, characters: [{ card: PUR_1, rested: true }] },
      });
      const at = g.find('p1', 'characters', RED_1);
      const tg = g.find('p2', 'characters', PUR_1);
      op(g, {
        op: 'modifier',
        mod: {
          kind: 'power',
          target: at,
          amount: a - 3000,
          controller: 'p2',
          duration: { kind: 'thisTurn', turn: 3 },
        },
      });
      op(g, {
        op: 'modifier',
        mod: {
          kind: 'power',
          target: tg,
          amount: t - 3000,
          controller: 'p1',
          duration: { kind: 'thisTurn', turn: 3 },
        },
      });
      expect(g.power(at)).toBe(a);
      g.act({ type: 'attack', attacker: at, target: tg });
      noDefence(g);
      expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([PUR_1]);
    }
  });

  it('CR 1-3-6-1: power can be negative and the card stays on the field', () => {
    const g = scenario({ p1: { leader: LUFFY, characters: [RED_5] }, p2: { leader: KAIDO } });
    const c = g.find('p1', 'characters', RED_5);
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'power',
        target: c,
        amount: -10000,
        controller: 'p2',
        duration: { kind: 'thisTurn', turn: 3 },
      },
    });
    expect(g.power(c)).toBe(-4000);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    // QA-GR: one DON!! on a -4000 card makes it -3000.
    const h = scenario({
      p1: { leader: LUFFY, characters: [{ card: RED_5, don: 1 }] },
      p2: { leader: KAIDO },
    });
    const d = h.find('p1', 'characters', RED_5);
    op(h, {
      op: 'modifier',
      mod: {
        kind: 'power',
        target: d,
        amount: -10000,
        controller: 'p2',
        duration: { kind: 'thisTurn', turn: 3 },
      },
    });
    expect(h.power(d)).toBe(-3000);
  });

  it('CR 7-1-4-2: an attacker with less power does nothing', () => {
    const g = scenario({ p1: { leader: LUFFY, characters: [RED_1] }, p2: { leader: KAIDO, life } });
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', RED_1), target: g.leader('p2') });
    const ev = [...g.act({ type: 'block', blocker: null }), ...g.act({ type: 'endCounter' })];
    expect(ev.find((e) => e.type === 'DamageStep')).toMatchObject({ attackerWins: false });
    expect(g.life('p2')).toBe(5);
  });

  it('CR 7-1-4-1-1-2: a Leader hit moves the top Life card to hand', () => {
    const g = scenario({
      p1: { leader: LUFFY },
      p2: { leader: KAIDO, life: [PUR_1, PUR_1B, PUR_1] },
    });
    const top = g.zone('p2', 'life')[0]!.instance;
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    noDefence(g);
    expect(g.card(top).zone).toBe('hand');
    expect(g.life('p2')).toBe(2);
  });

  it('CR 7-1-4-1-1-1: damage determined against 0 Life wins the game', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO } });
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    noDefence(g);
    expect(queries.result(g.state)).toEqual({ winner: 'p1', reason: 'damage at 0 Life' });
    expect(queries.decision(g.state)).toBeNull();
  });

  it("CR 7-1-4-1-2: a Character that loses is K.O.'d to its owner's trash", () => {
    const g = scenario({
      p1: { leader: LUFFY },
      p2: { leader: KAIDO, characters: [{ card: PUR_1, rested: true }] },
    });
    const t = g.find('p2', 'characters', PUR_1);
    g.act({ type: 'attack', attacker: g.leader('p1'), target: t });
    const ev = [...g.act({ type: 'block', blocker: null }), ...g.act({ type: 'endCounter' })];
    expect(ev.find((e) => e.type === 'KO')).toMatchObject({
      instance: t,
      cause: { kind: 'battle', by: 'p1' },
    });
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([PUR_1]);
  });

  it('CR 7-1-5-1..7-1-5-5: end-of-battle effects see battle boosts; then they expire, then Main resumes', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, hand: [PUR_1], life } });
    give(g, KAIDO, [
      { id: 'eob', kind: 'auto', when: ['endOfBattle'], effect: [{ op: 'emit', label: 'eob' }] },
    ]);
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'counter', card: g.find('p2', 'hand', PUR_1), target: g.leader('p2') });
    const ev = g.act({ type: 'endCounter' });
    const t = types(ev);
    expect(t.indexOf('EffectResolved')).toBeLessThan(t.indexOf('ModifierExpired'));
    expect(t.indexOf('ModifierExpired')).toBeLessThan(t.indexOf('BattleEnded'));
    expect(ev.find((e) => e.type === 'ModifierExpired')).toMatchObject({ step: '7-1-5-3' });
    expect(queries.turn(g.state)).toMatchObject({ phase: 'main', battleStep: null });
  });
});

describe('keywords (CR 10-1)', () => {
  it('CR 10-1-1-1: [Rush] may attack on the turn it is played', () => {
    const g = scenario({
      p1: { leader: LUFFY, characters: [{ card: RUSH, playedThisTurn: true }] },
      p2: { leader: KAIDO },
    });
    expect(
      g.isLegal({
        type: 'attack',
        attacker: g.find('p1', 'characters', RUSH),
        target: g.leader('p2'),
        player: 'p1',
      }),
    ).toBe(true);
  });

  it("RL-28: [Rush] still cannot attack on the player's first turn", () => {
    const g = scenario({
      turn: 2,
      activePlayer: 'p2',
      p1: { leader: LUFFY },
      p2: { leader: KAIDO, characters: [{ card: RUSH, playedThisTurn: true }] },
    });
    expect(
      whyNot(g.state, 'p2', {
        type: 'attack',
        attacker: g.find('p2', 'characters', RUSH),
        target: g.leader('p1'),
      }),
    ).toMatchObject({ rule: 'CR 6-5-6-1' });
  });

  it('CR 10-1-6-1: [Rush: Character] may attack Characters but not the Leader the turn it is played', () => {
    const g = scenario({
      p1: { leader: ROCKS, characters: [{ card: RUSH_CHAR, playedThisTurn: true }] },
      p2: { leader: KAIDO, characters: [{ card: PUR_1, rested: true }] },
    });
    const a = g.find('p1', 'characters', RUSH_CHAR);
    expect(
      g.isLegal({
        type: 'attack',
        attacker: a,
        target: g.find('p2', 'characters', PUR_1),
        player: 'p1',
      }),
    ).toBe(true);
    expect(
      whyNot(g.state, 'p1', { type: 'attack', attacker: a, target: g.leader('p2') }),
    ).toMatchObject({ rule: 'CR 10-1-6-1' });
  });

  it('CR 7-1-4-1-1-3 / 10-1-2-1: [Double Attack] deals 2; against 1 Life it does not win (RL-20)', () => {
    const g = scenario({
      p1: { leader: 'OP13-001', characters: [DOUBLE] },
      p2: { leader: KAIDO, life: times(3, PUR_1) },
    });
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', DOUBLE), target: g.leader('p2') });
    noDefence(g);
    expect(g.life('p2')).toBe(1);
    const h = scenario({
      p1: { leader: 'OP13-001', characters: [DOUBLE] },
      p2: { leader: KAIDO, life: [PUR_1] },
    });
    h.act({ type: 'attack', attacker: h.find('p1', 'characters', DOUBLE), target: h.leader('p2') });
    noDefence(h);
    expect(h.life('p2')).toBe(0);
    expect(queries.result(h.state)).toBeNull();
  });

  it("RL-20: Double Attack stays 2 even if the attacker leaves during the first point's [Trigger]", () => {
    const g = scenario({
      p1: { leader: 'OP13-001', characters: [DOUBLE] },
      p2: { leader: KAIDO, life: [PUR_1B, PUR_1, PUR_1] },
    });
    const a = g.find('p1', 'characters', DOUBLE);
    give(g, PUR_1B, [{ id: 't', kind: 'trigger', effect: [{ op: 'ko', target: a }] }]);
    g.act({ type: 'attack', attacker: a, target: g.leader('p2') });
    noDefence(g);
    expect(queries.decision(g.state)).toMatchObject({ kind: 'trigger', player: 'p2' });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.life('p2')).toBe(1);
  });

  it('CR 10-1-3-1: [Banish] trashes the Life card with no [Trigger]; with Double Attack, both (RL-21)', () => {
    const g = scenario({
      p1: { leader: KAIDO, characters: [BANISH] },
      p2: { leader: LUFFY, life: [RED_1, RED_1, RED_1], hand: [] },
    });
    give(g, RED_1, [{ id: 't', kind: 'trigger', effect: [] }]);
    const a = g.find('p1', 'characters', BANISH);
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'grant',
        keyword: 'Double Attack',
        target: a,
        controller: 'p1',
        duration: { kind: 'thisTurn', turn: 3 },
      },
    });
    g.act({ type: 'attack', attacker: a, target: g.leader('p2') });
    const ev = [...g.act({ type: 'block', blocker: null }), ...g.act({ type: 'endCounter' })];
    expect(ev.filter((e) => e.type === 'CardMoved' && e.reason === 'banish')).toHaveLength(2);
    expect(g.life('p2')).toBe(1);
    expect(g.zone('p2', 'hand')).toHaveLength(0);
    expect(g.zone('p2', 'trash')).toHaveLength(2);
  });
});

describe('K.O. (CR 10-2-1)', () => {
  it('CR 10-2-1-3: trashing a Character by effect is not a K.O.; no KO event, no [On K.O.]', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, characters: [PUR_1] } });
    give(g, PUR_1, [
      { id: 'k', kind: 'auto', when: ['onKO'], effect: [{ op: 'emit', label: 'onKO' }] },
    ]);
    const ev = op(g, { op: 'trashFromField', card: g.find('p2', 'characters', PUR_1), by: 'p1' });
    expect(types(ev)).not.toContain('KO');
    expect(types(ev)).not.toContain('EffectResolved');
    expect(ev.find((e) => e.type === 'CardMoved')).toMatchObject({
      to: 'trash',
      cause: { kind: 'effect', by: 'p1' },
    });
  });

  it("CR 10-2-1-2 / 10-2-17-2: a K.O. by effect goes to the owner's trash and [On K.O.] resolves from there", () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, characters: [PUR_1] } });
    give(g, PUR_1, [
      { id: 'k', kind: 'auto', when: ['onKO'], effect: [{ op: 'emit', label: 'onKO' }] },
    ]);
    const t = g.find('p2', 'characters', PUR_1);
    const ev = op(g, { op: 'ko', card: t, by: 'p1' });
    const res = ev.find((e) => e.type === 'EffectResolved')!;
    const trashId = g.zone('p2', 'trash')[0]!.instance;
    expect(res).toMatchObject({ label: 'onKO', instance: trashId, player: 'p2' });
    expect(ev.find((e) => e.type === 'KO')).toMatchObject({ cause: { kind: 'effect', by: 'p1' } });
  });

  it('RL-14: "cannot be K.O.\'d" stops a battle K.O.; the Character stays', () => {
    const g = scenario({
      p1: { leader: LUFFY, characters: [RED_5] },
      p2: { leader: KAIDO, characters: [{ card: PUR_1, rested: true }] },
    });
    const t = g.find('p2', 'characters', PUR_1);
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'cannotBeKOd',
        target: t,
        controller: 'p2',
        duration: { kind: 'thisTurn', turn: 3 },
      },
    });
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', RED_5), target: t });
    const ev = [...g.act({ type: 'block', blocker: null }), ...g.act({ type: 'endCounter' })];
    expect(types(ev)).toContain('KOPrevented');
    expect(types(ev)).not.toContain('KO');
    expect(g.card(t).zone).toBe('characters');
  });
});
