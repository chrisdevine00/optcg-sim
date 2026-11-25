/**
 * OP09-001 Shanks (Leader, Red, 5000, 5 Life, {The Four Emperors}/{Red-Haired Pirates}).
 *
 * Card text: "[Once Per Turn] This effect can be activated when your opponent attacks. Give up to 1 of
 * your opponent's Leader or Character cards −1000 power during this turn."
 *
 * Rules: CR 10-2-13 ([Once Per Turn]); the effect activates when the opponent declares an attack
 * (Attack Step, before the Block Step, CR 7-1-1-3 / RL-18); "up to 1" may be 0 (CR 8-4-4-1);
 * "during this turn" ends at the End Phase (CR 6-6-1-3, RL-09); a Character at 0 power or below
 * stays on the field (CR 4-12-2). The effect has no "may": whether the engine asks "use?" first is
 * not fixed by the text, so the helper accepts only the target `choose`, after a yes if one is asked.
 */
import { describe, expect, it } from 'vitest';
import type { InstanceId } from '@optcg/engine';
import { act, attack, noDefence } from '../../helpers.ts';
import {
  at,
  canFinish,
  choices,
  endTurn,
  kind,
  L9,
  mine,
  need,
  offeredIds,
  pending,
  type Place,
  S9,
  theirs,
} from './kit-op09a.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const SHANKS = 'OP09-001';

/** p2's turn: p2's `attackers` (5000, 5000 by default) are active; p1 (Shanks) has `mine` Characters. */
function defended(o: { own?: Place[]; p2?: Place[] } = {}): TestGame {
  return theirs(SHANKS, { characters: o.own ?? [] }, { characters: o.p2 ?? [S9.c3, S9.c3] });
}

/** p2's first Marco attacks p1's Leader. */
function hitLeader(g: TestGame): InstanceId {
  const a = g.find('p2', 'characters', S9.c3, 0);
  attack(g, a, g.leader('p1'));
  return a;
}

/** Say yes to a "use this effect?" question if the engine asks one (the text has no "may"). */
function ask(g: TestGame): void {
  if (kind(g) === 'optional') act(g, { type: 'optional', accept: true });
}

describe('OP09-001 Shanks: [Once Per Turn] when the opponent attacks, up to 1 opposing Leader or Character −1000', () => {
  it('printed values: Leader, 5000 power', () => {
    const g = defended();
    expect(g.card(g.leader('p1')).card).toBe(SHANKS);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('when the opponent attacks, I choose an opposing Leader or Character: the attacker gets −1000', () => {
    const g = defended();
    const a = hitLeader(g);
    ask(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([L9.luffy, S9.c3, S9.c3].sort());
    act(g, { type: 'pick', choice: a });
    if (kind(g) === 'choose' && canFinish(g)) act(g, { type: 'done' });
    expect(g.power(a)).toBe(4000);
  });

  it('only the opponent’s Leader and Characters are offered, never my own cards', () => {
    const g = defended({ own: [S9.c4] });
    hitLeader(g);
    ask(g);
    need(g, 'choose', 'p1');
    const offered = choices(g);
    expect(offered).not.toContain(g.leader('p1'));
    expect(offered).not.toContain(at(g, 'p1', 'characters', S9.c4));
    expect(offered).toContain(g.leader('p2'));
  });

  it('the opponent’s Leader can be the one chosen (−1000 on a Leader, 5000 -> 4000)', () => {
    const g = defended();
    hitLeader(g);
    ask(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.leader('p2') });
    if (kind(g) === 'choose' && canFinish(g)) act(g, { type: 'done' });
    expect(g.power(g.leader('p2'))).toBe(4000);
  });

  it('boundary: −1000 on the 5000 attacker makes it lose to my 5000 Leader (no damage); without it the hit lands', () => {
    // Without the effect: 5000 vs 5000 is a hit (attacker wins ties), so I lose a Life card.
    const base = defended();
    hitLeader(base);
    ask(base);
    need(base, 'choose', 'p1');
    act(base, { type: 'done' });
    noDefence(base);
    expect(base.life('p1')).toBeLessThan(4);

    const g = defended();
    const a = hitLeader(g);
    ask(g);
    act(g, { type: 'pick', choice: a });
    if (kind(g) === 'choose' && canFinish(g)) act(g, { type: 'done' });
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });

  it('"up to 1": I may choose nobody; nothing changes power', () => {
    const g = defended();
    const a = hitLeader(g);
    ask(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(g.power(a)).toBe(5000);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('it works against an attack on one of my Characters too ("when your opponent attacks")', () => {
    const g = defended({ own: [{ card: S9.c2, rested: true }] });
    const a = g.find('p2', 'characters', S9.c3, 0);
    attack(g, a, g.find('p1', 'characters', S9.c2));
    ask(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: a });
    if (kind(g) === 'choose' && canFinish(g)) act(g, { type: 'done' });
    expect(g.power(a)).toBe(4000);
  });

  it('[Once Per Turn]: the second attack of the same turn does not ask again, and the first −1000 lasts all turn', () => {
    const g = defended();
    const first = hitLeader(g);
    ask(g);
    act(g, { type: 'pick', choice: first });
    if (kind(g) === 'choose' && canFinish(g)) act(g, { type: 'done' });
    noDefence(g);
    expect(g.power(first)).toBe(4000); // "during this turn": not ended with the battle
    need(g, 'main', 'p2');
    const second = g.find('p2', 'characters', S9.c3, 1);
    attack(g, second, g.leader('p1'));
    // No use question, no target question: the next decision is the Block Step.
    expect(kind(g)).toBe('block');
    expect(g.power(second)).toBe(5000);
  });

  it('"during this turn": the −1000 is gone when my own next turn comes', () => {
    const g = defended();
    const a = hitLeader(g);
    ask(g);
    act(g, { type: 'pick', choice: a });
    if (kind(g) === 'choose' && canFinish(g)) act(g, { type: 'done' });
    noDefence(g);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.power(a)).toBe(5000);
  });

  it('must not happen: my own attack on my own turn does not trigger it, and no [Activate: Main] is offered', () => {
    const g = mine(SHANKS, {}, { characters: [S9.c2] });
    expect(g.legal().some((x) => x.type === 'activate')).toBe(false);
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(kind(g), pending(g)).toBe('block');
    expect(g.decider).toBe('p2');
  });

  it('a 0-power Character can be chosen: it goes to −1000 and stays on the field (CR 4-12-2)', () => {
    const g = defended({ p2: [S9.c3, S9.cobra] });
    hitLeader(g);
    ask(g);
    need(g, 'choose', 'p1');
    const cobra = at(g, 'p2', 'characters', S9.cobra);
    expect(choices(g)).toContain(cobra);
    act(g, { type: 'pick', choice: cobra });
    if (kind(g) === 'choose' && canFinish(g)) act(g, { type: 'done' });
    expect(g.zone('p2', 'characters').map((c) => c.card)).toContain(S9.cobra);
    expect(g.power(cobra)).toBe(-1000);
  });
});
