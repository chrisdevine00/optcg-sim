/**
 * M6b wave 2, D4: a replacement of damage ("If you would take damage, you may trash this Character
 * instead", EB05-052). The damaged player's own `{ damage: 'you' }` replacement is offered before
 * the Life card moves; applying it ends the whole damage: no Life card is taken, no [Trigger]
 * (CR 4-6-3-1, rules-digest 103; M6b-Q8 stays open as a reading). Planted on vanilla cards.
 */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { applyOp, withAbilities, withKeywords, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  endCounter,
  expectDecision,
  game,
  passBlock,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from '../helpers.ts';
import { errorsOf, expectValid } from '../m6b-w1/probe.ts';

/** The replacement: trash this Character instead (optional), as the card says. */
const gloriosa = (extra: Partial<Ability> = {}): Ability =>
  ({
    id: 'dmg',
    kind: 'replacement',
    replaces: { damage: 'you' },
    optional: true,
    instead: [{ trashSelf: true }],
    ...extra,
  }) as Ability;

/** p1 attacks p2's Leader with a 9000 Character; p2 has `V.c1` carrying the replacement. */
function battle(opts: { life?: number; keywords?: string[]; ability?: Ability } = {}) {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [V.c7] },
    {
      leader: PLAIN_BLUE,
      characters: [V.c1],
      life: Array.from({ length: opts.life ?? 3 }, () => BLUE),
    },
  );
  g.state = withAbilities(g.state, V.c1, [opts.ability ?? gloriosa()]);
  if (opts.keywords) g.state = withKeywords(g.state, V.c7, opts.keywords);
  return g;
}
const attack = (g: ReturnType<typeof battle>) => {
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c7), target: g.leader('p2') });
  passBlock(g);
  endCounter(g);
};
const life = (g: ReturnType<typeof battle>) => g.zone('p2', 'life').length;

describe('D4 replacement on taking damage', () => {
  it('validates, and a malformed damage replacement is refused', () => {
    expectValid([gloriosa()]);
    expect(errorsOf({ ...gloriosa(), replaces: { damage: 'opponent' } })).not.toEqual([]);
    expect(errorsOf({ ...gloriosa(), replaces: { damage: 'you', cause: 'battle' } })).not.toEqual(
      [],
    );
  });

  it('battle damage: accepting trashes the Character and takes no Life card, no [Trigger]', () => {
    const g = battle();
    attack(g);
    expectDecision(g, 'optional', 'p2');
    g.act({ type: 'optional', accept: true });
    expect(life(g)).toBe(3);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V.c1]);
    expect(g.zone('p2', 'hand')).toHaveLength(0);
    expect(g.eventsOfType('TriggerRevealed')).toHaveLength(0);
    const ev = g.eventsOfType('ReplacementApplied');
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ replaced: 'damage', player: 'p2', controller: 'p2' });
  });

  it('declining takes the damage as usual (the Life card goes through the [Trigger] step)', () => {
    const g = battle();
    attack(g);
    g.act({ type: 'optional', accept: false });
    expect(dec(g)?.kind).toBe('trigger');
    g.act({ type: 'trigger', activate: false });
    expect(life(g)).toBe(2);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('battle damage determined against 0 Life can be replaced; if not, the attacker wins', () => {
    const yes = battle({ life: 0 });
    attack(yes);
    yes.act({ type: 'optional', accept: true });
    expect(yes.state && dec(yes)?.kind).toBe('main');
    expect(yes.zone('p2', 'characters')).toHaveLength(0);
    const no = battle({ life: 0 });
    attack(no);
    no.act({ type: 'optional', accept: false });
    expect(queries.result(no.state)).toMatchObject({ winner: 'p1' });
  });

  it('a Double Attack is one damage: one replacement stops both Life cards', () => {
    const g = battle({ keywords: ['Double Attack'] });
    attack(g);
    g.act({ type: 'optional', accept: true });
    expect(life(g)).toBe(3);
    expect(g.eventsOfType('ReplacementApplied')).toHaveLength(1);
  });

  it('effect damage is replaced too, and nothing is offered without the ability', () => {
    const g = battle();
    g.state = applyOp(g.state, { op: 'damage', player: 'p2', n: 1, by: 'p1' }).state;
    expectDecision(g, 'optional', 'p2');
    g.act({ type: 'optional', accept: true });
    expect(life(g)).toBe(3);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    // The same damage on the other player, who has no replacement, is taken.
    const h = battle();
    h.state = applyOp(h.state, { op: 'damage', player: 'p1', n: 1, by: 'p2' }).state;
    expect(dec(h)?.kind).toBe('trigger');
    expect(dec(h)?.player).toBe('p1');
  });

  it('the replacement is only for its own controller (the opponent is not offered it)', () => {
    const g = battle();
    // p1 takes damage: p2's Character does not replace it.
    const step = applyOp(g.state, { op: 'damage', player: 'p1', n: 1, by: 'p2' });
    expect(step.events.filter((e) => e.type === 'ReplacementApplied')).toHaveLength(0);
  });

  it('[Once Per Turn] is spent when applied; a mandatory replacement applies without asking', () => {
    const ability = gloriosa({ oncePerTurn: true, optional: false, instead: [] });
    const g = battle({ ability });
    const first = applyOp(g.state, { op: 'damage', player: 'p2', n: 1, by: 'p1' });
    g.state = first.state;
    // Applied with no decision, an empty payload: the damage is simply prevented.
    expect(life(g)).toBe(3);
    expect(first.events.filter((e) => e.type === 'ReplacementApplied')).toHaveLength(1);
    const second = applyOp(g.state, { op: 'damage', player: 'p2', n: 1, by: 'p1' });
    g.state = second.state;
    expect(dec(g)?.kind).toBe('trigger');
    expect(second.events.filter((e) => e.type === 'ReplacementApplied')).toHaveLength(0);
  });

  it('is not offered when its payload cannot be paid (CR 8-1-3-4-5)', () => {
    const g = battle({ ability: gloriosa({ instead: [{ restDon: 1 }] }) });
    g.state = applyOp(g.state, { op: 'damage', player: 'p2', n: 1, by: 'p1' }).state;
    expect(dec(g)?.kind).toBe('trigger'); // no active DON!!: impossible, so not offered
  });
});
