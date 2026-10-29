/**
 * OP17-062 Kaido (Character, Purple, cost 10, 12000, no Counter, [Blocker], types Animal Kingdom
 * Pirates / The Four Emperors).
 *
 * Card text (cards/data, override keywords ["Blocker"]):
 *   "[Blocker]
 *    [Your Turn] [Once Per Turn] When a DON!! card on your field is returned to your DON!! deck, add
 *    up to 1 DON!! card as active from your DON!! deck. Then, set up to 1 of your DON!! cards as
 *    active."
 *
 * Rules: CR 10-1-4-1 [Blocker]; CR 8-3-2-4 / 10-2-11-1 [Your Turn]; CR 10-2-13 [Once Per Turn];
 * CR 8.6.3 / RL-03 (an effect triggered by paying a cost waits for that activation to resolve);
 * RL-23 (DON!! −X returns DON!! to the DON!! deck); QA-GR (effects cannot set given DON!! active).
 * The trigger source used here is OP17-058 Kaido's DON!! −1 and OP15-078 Mamaragan's DON!! −2.
 */
import { describe, expect, it } from 'vitest';
import { type InstanceId, type PlayerSpec } from '@optcg/engine';
import { act, attack, blockers, decision } from '../helpers.ts';
import {
  accept,
  AKP,
  canFinish,
  choices,
  choose,
  decider,
  donChoices,
  donOf,
  kind,
  LEAD,
  myTurn,
  offered,
  payDon,
  PURPLE,
  RED,
  side,
  theirTurn,
  VAN,
} from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

/**
 * Answer every p1 decision the way the test wants: yes to optionals, `target` when offered, rested
 * DON!! for DON!! picks (so "set up to 1 of your DON!! cards as active" turns a rested one active).
 */
function resolveForP1(g: TestGame, target?: InstanceId): void {
  for (let i = 0; i < 20; i++) {
    const d = decision(g);
    if (!d || d.player !== 'p1') return;
    if (d.kind === 'optional') act(g, { type: 'optional', accept: true });
    else if (d.kind === 'choose') {
      if (target && choices(g).includes(target)) choose(g, [target]);
      else if (donChoices(g).length) {
        const rested = donChoices(g).find((c) => c.from === 'costRested');
        act(g, { type: 'pick', choice: rested ?? donChoices(g)[0]! });
      } else if (canFinish(g)) act(g, { type: 'done' });
      else return;
    } else if (d.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
    else return;
  }
}

function kaidoAttacks(p1: Partial<PlayerSpec>) {
  const g = myTurn(
    side(LEAD.kaido, PURPLE, { characters: [AKP.kaido10Blocker], ...p1 }),
    side(LEAD.luffy, RED, { characters: [VAN.marco] }),
  );
  const marco = g.find('p2', 'characters', VAN.marco);
  attack(g, g.leader('p1'), g.leader('p2'));
  accept(g);
  payDon(g, 1, 'costRested');
  resolveForP1(g, marco);
  return { g, marco };
}

describe('OP17-062 Kaido: [Blocker]', () => {
  it('CR 10-1-4-1: printed [Blocker] works on the opponent’s turn', () => {
    const g = theirTurn(
      side(LEAD.shanks, PURPLE, { characters: [AKP.kaido10Blocker] }),
      side(LEAD.luffy, RED),
    );
    const kaido = g.find('p1', 'characters', AKP.kaido10Blocker);
    expect(g.card(kaido).keywords).toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([kaido]);
  });
});

describe('OP17-062 Kaido: [Your Turn] [Once Per Turn] when a DON!! is returned → +1 active DON!!, set 1 active', () => {
  it('happy path: OP17-058’s DON!! −1 on your turn → add 1 active DON!! and set 1 rested DON!! active', () => {
    // Before: 1 active, 4 rested, DON!! deck 5. DON!! −1 (a rested one): 1 / 3 / 6.
    // Add 1 active: 2 / 3 / 5. Set 1 active: 3 / 2 / 5.
    const { g, marco } = kaidoAttacks({ costArea: { active: 1, rested: 4 } });
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 2, deck: 5 });
    // RL-03: the Leader's effect still resolved in full.
    expect(g.power(marco)).toBe(3000);
    // The battle goes on.
    expect(decider(g)).toBe('p2');
  });

  it('CR 10-2-13: [Once Per Turn]: a second return in the same turn (OP15-078 Mamaragan DON!! −2) adds nothing', () => {
    const { g } = kaidoAttacks({ costArea: { active: 1, rested: 4 }, hand: [AKP.mamaragan] });
    // Finish the battle without defence.
    while (decider(g) === 'p2') {
      const d = decision(g);
      if (d?.kind === 'block') act(g, { type: 'block', blocker: null });
      else if (d?.kind === 'counter') act(g, { type: 'endCounter' });
      else if (d?.kind === 'trigger') act(g, { type: 'trigger', activate: false });
      else break;
    }
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 2, deck: 5 });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.mamaragan) });
    if (offered(g, 'p1')) accept(g);
    payDon(g, 2, 'costRested');
    // Mamaragan's "rest up to 1 … 5000 power or less": choose nothing.
    if (kind(g) === 'choose' && canFinish(g)) act(g, { type: 'done' });
    expect(kind(g)).toBe('main');
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 0, deck: 7 });
  });

  it('CR 8-3-2-4 [Your Turn]: OP17-058’s DON!! −1 on the opponent’s turn adds nothing', () => {
    const g = theirTurn(
      side(LEAD.kaido, PURPLE, {
        characters: [AKP.kaido10Blocker],
        costArea: { active: 0, rested: 3 },
      }),
      side(LEAD.luffy, RED, { characters: [VAN.marco] }),
    );
    const marco = g.find('p2', 'characters', VAN.marco);
    attack(g, g.leader('p2'), g.leader('p1'));
    accept(g); // OP17-058 [On Your Opponent's Attack]
    payDon(g, 1, 'costRested');
    choose(g, [marco]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 2, deck: 8 });
    // Next is the Block Step (Kaido is an active [Blocker]), not another optional.
    expect(offered(g, 'p1')).toBe(false);
    expect(kind(g)).toBe('block');
  });

  it('the trigger needs Kaido on the field: OP17-062 in hand does nothing (CR 2-8-2)', () => {
    const g = myTurn(
      side(LEAD.kaido, PURPLE, { hand: [AKP.kaido10Blocker], costArea: { active: 1, rested: 4 } }),
      side(LEAD.luffy, RED, { characters: [VAN.marco] }),
    );
    attack(g, g.leader('p1'), g.leader('p2'));
    accept(g);
    payDon(g, 1, 'costRested');
    choose(g, [g.find('p2', 'characters', VAN.marco)]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 3, deck: 6 });
  });
});
