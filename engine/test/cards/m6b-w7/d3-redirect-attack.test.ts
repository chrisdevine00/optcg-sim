/**
 * M6b wave 7, D3 (decided 2026-11-23: narrow): `redirectAttack`, "change the attack target to the
 * selected card" (OP14-060 Donquixote Doflamingo, OP16-080 Marshall.D.Teach, ST36-005 Eustass
 * "Captain" Kid). In an [On Your Opponent's Attack], the target of the attack becomes a card the
 * controller chooses among their Leader and Characters, active or rested. The attack was declared
 * once: [When Attacking] and [On Your Opponent's Attack] do not fire again; the Block Step follows
 * with the new target.
 *
 * Official Q&A relied on (docs/research/rulings.md RL-19 and the per-set Q&As under .cache/track-f):
 * QA-OP12 OP12-020 and QA-OP16 OP16-080 (an attack redirected to a Leader is an attack on a Leader),
 * QA-EB01 EB01-029 (the new target may be an active Character), QA-EB01 EB01-038 and QA-ST29
 * ST29-016 (a Blocker redirected to cannot block, an effect may redirect an [Unblockable] attack:
 * changing the target by an effect is not blocking), QA-ST01 and QA-OP03 OP03-001 (a target stays
 * as it was set at the Block Step; "when attacked" is read at the declaration). Planted on vanilla
 * cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { projectEvents } from '@optcg/engine';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  endCounter,
  game,
  hand,
  passBlock,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  pick,
  V,
} from '../helpers.ts';
import { errorsOf, expectValid } from '../m6b-w1/probe.ts';

const redirect = (to: object = {}) => ({
  do: {
    redirectAttack: {
      to: { from: ['leader', 'characters'], owner: 'you', pick: { exactly: 1 }, ...to },
    },
  },
});
const onOppAttack = (effect: unknown[], extra: object = {}): Ability =>
  ({ id: 'r', kind: 'auto', when: ['onOpponentAttack'], effect, ...extra }) as unknown as Ability;
const grantKeyword = (keyword: string): Ability =>
  ({
    id: 'k',
    kind: 'permanent',
    apply: [{ grant: { target: { from: 'self', owner: 'you' }, keyword } }],
  }) as unknown as Ability;

/**
 * p2 (active) attacks p1's rested BLUE with the 6000 V.c4. p1's Leader redirects, and p1 has the
 * active 5000 V.c3 and the active 4000 V.c2.
 */
const mk = (effect: unknown[] = [redirect()], extra: object = {}) => {
  const g = game(
    {
      leader: PLAIN_BLUE,
      characters: [{ card: BLUE, rested: true }, V.c3, V.c2],
      life: [V.c6, V.c6, V.c6],
      ...extra,
    },
    { leader: PLAIN_PURPLE, characters: [V.c4] },
    { activePlayer: 'p2', turn: 4 },
  );
  g.state = withAbilities(g.state, PLAIN_BLUE, [onOppAttack(effect)]);
  return g;
};
const attack = (g: ReturnType<typeof mk>) =>
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', V.c4),
    target: g.find('p1', 'characters', BLUE),
  });
const chars = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);

describe('D3 redirect the target of an attack', () => {
  it('validates, and refuses the nonsense', () => {
    expectValid([onOppAttack([redirect()])]);
    const bad = (a: Ability) => errorsOf(a);
    // Only an [On Your Opponent's Attack] has an attack to change.
    expect(bad(onOppAttack([redirect()], { when: ['whenAttacking'] }))).not.toEqual([]);
    expect(bad(onOppAttack([redirect()], { when: ['onPlay'] }))).not.toEqual([]);
    expect(
      bad({ id: 'a', kind: 'activate', when: 'activateMain', effect: [redirect()] } as Ability),
    ).not.toEqual([]);
    // Your own Leader and Characters, one card, chosen.
    expect(bad(onOppAttack([redirect({ owner: 'opponent' })]))).not.toEqual([]);
    expect(bad(onOppAttack([redirect({ from: 'stage' })]))).not.toEqual([]);
    expect(bad(onOppAttack([redirect({ from: 'hand' })]))).not.toEqual([]);
    expect(bad(onOppAttack([redirect({ pick: { upTo: 1 } })]))).not.toEqual([]);
    expect(bad(onOppAttack([redirect({ pick: undefined })]))).not.toEqual([]);
  });

  it('the attack hits the Character chosen instead of the card it was aimed at', () => {
    const g = mk();
    attack(g);
    // Leader, the rested Blue, and the two active Characters can all be chosen.
    expect(dec(g)!.kind).toBe('choose');
    pick(g, [g.find('p1', 'characters', V.c3)]);
    passBlock(g);
    endCounter(g);
    // 6000 against the 5000 V.c3: it is K.O.'d; the original target is untouched.
    expect(chars(g)).toEqual([BLUE, V.c2]);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
    expect(dec(g)?.kind).toBe('main');
  });

  it('redirected to the Leader, it is an attack on the Leader: a Life card is taken', () => {
    const g = mk();
    attack(g);
    pick(g, [g.leader('p1')]);
    passBlock(g);
    endCounter(g);
    expect(dec(g)!.kind).toBe('trigger');
    g.act({ type: 'trigger', activate: false });
    expect(g.life('p1')).toBe(2);
    expect(chars(g)).toEqual([BLUE, V.c3, V.c2]);
  });

  it('choosing the card already attacked changes nothing', () => {
    const g = mk();
    attack(g);
    pick(g, [g.find('p1', 'characters', BLUE)]);
    passBlock(g);
    endCounter(g);
    expect(g.eventsOfType('AttackRedirected')).toHaveLength(0);
    expect(chars(g)).toEqual([V.c3, V.c2]);
  });

  it('neither [When Attacking] nor [On Your Opponent’s Attack] fires again', () => {
    const g = mk([redirect(), { do: { draw: 1 } }]);
    const whenAttacking = {
      id: 'w',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [{ do: { draw: 1 } }],
    } as unknown as Ability;
    g.state = withAbilities(g.state, V.c4, [whenAttacking]);
    const mine = hand(g, 'p1').length;
    const theirs = hand(g, 'p2').length;
    attack(g);
    pick(g, [g.find('p1', 'characters', V.c3)]);
    passBlock(g);
    endCounter(g);
    expect(hand(g, 'p1')).toHaveLength(mine + 1);
    expect(hand(g, 'p2')).toHaveLength(theirs + 1);
  });

  it('a Blocker may still block the new target, but the new target cannot block itself', () => {
    const g = mk();
    g.state = withAbilities(g.state, V.c3, [grantKeyword('Blocker')]);
    g.state = withAbilities(g.state, V.c2, [grantKeyword('Blocker')]);
    attack(g);
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(dec(g)!.kind).toBe('block');
    const blockers = g
      .legal()
      .filter((a) => a.type === 'block' && a.blocker !== null)
      .map((a) => (a.type === 'block' ? a.blocker : null));
    expect(blockers).toEqual([g.find('p1', 'characters', V.c2)]);
    g.act({ type: 'block', blocker: g.find('p1', 'characters', V.c2) });
    endCounter(g);
    // The Blocker (4000) lost to 6000; the redirected target is untouched.
    expect(chars(g)).toEqual([BLUE, V.c3]);
  });

  it('an effect may redirect an [Unblockable] attack, even to a Blocker (QA-ST29 ST29-016)', () => {
    const g = mk();
    g.state = withAbilities(g.state, V.c3, [grantKeyword('Blocker')]);
    g.state = withAbilities(g.state, V.c4, [grantKeyword('Unblockable')]);
    attack(g);
    pick(g, [g.find('p1', 'characters', V.c3)]);
    // The attack cannot be blocked at all, and the new target takes the hit.
    if (dec(g)?.kind === 'block') passBlock(g);
    endCounter(g);
    expect(chars(g)).toEqual([BLUE, V.c2]);
  });

  it('both players see the new target', () => {
    const g = mk();
    attack(g);
    pick(g, [g.find('p1', 'characters', V.c3)]);
    for (const viewer of ['p1', 'p2'] as const) {
      const e = projectEvents(g.events, viewer).find((x) => x.type === 'AttackRedirected')!;
      expect(e.card).toBe(V.c3);
      expect(typeof e.target).toBe('string');
    }
  });

  it('a cost is paid whether or not the target changes (the cost belongs to the use)', () => {
    const g = game(
      {
        leader: PLAIN_BLUE,
        characters: [{ card: BLUE, rested: true }, V.c3],
        costArea: { active: 2, rested: 0 },
      },
      { leader: PLAIN_PURPLE, characters: [V.c4] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, PLAIN_BLUE, [
      onOppAttack([redirect()], { cost: [{ restDon: 1 }], oncePerTurn: true }),
    ]);
    attack(g);
    g.act({ type: 'optional', accept: true });
    pick(g, [g.find('p1', 'characters', V.c3)]);
    passBlock(g);
    endCounter(g);
    expect(chars(g)).toEqual([BLUE]);
    expect(g.eventsOfType('DonRested')).toHaveLength(1);
  });
});
