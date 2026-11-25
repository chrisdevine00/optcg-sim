/**
 * M6b wave 8 fix round (docs/reviews/m6b-wave8.md, W8-R1 and W8-R3). Each test fails with the fix reverted.
 */
import { describe, expect, it } from 'vitest';
import { internals, withAbilities, type Ability } from '../../../src/testing.ts';
import { summary } from '../../../src/hash.ts';
import { BLUE, dec, endCounter, game, passBlock, PLAIN_BLUE, PLAIN_PURPLE, V } from '../helpers.ts';
import { useCounter } from '../helpers-lfa.ts';

describe('W8-R1 the Main Phase hook allocates a modifier id only when something fires', () => {
  it('EB02-030’s replacement keeps the mod id it had before wave 8 (mod-5, nextMod 6)', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        characters: [{ card: V.c1, rested: true }],
        hand: ['EB02-030', V.c3],
        costArea: { active: 2, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c7] },
    );
    g.act({ type: 'endTurn' });
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', V.c1),
    });
    passBlock(g);
    useCounter(g, 'EB02-030');
    endCounter(g);
    const s = internals(g.state);
    expect(s.mods.filter((m) => m.kind === 'replacement').map((m) => m.ab?.id)).toEqual(['mod-5']);
    expect(s.nextMod).toBe(6);
    expect(JSON.stringify((summary(s) as { mods: unknown }).mods)).toContain('mod-5');
  });
});

describe('W8-R3 the order prompt names the new timing', () => {
  it('two delayed entries at the opponent’s next Main Phase read with their timing word', () => {
    const rest = {
      do: [
        {
          do: {
            rest: {
              from: 'donCostArea',
              owner: 'opponent',
              chooser: 'opponent',
              pick: { exactly: 1 },
            },
          },
        },
      ],
    };
    const mkAb = (id: string) =>
      ({
        id,
        kind: 'activate',
        when: 'activateMain',
        effect: [{ delayed: { at: 'startOfOpponentsNextMainPhase' }, ...rest }],
      }) as unknown as Ability;
    const g = game(
      { leader: PLAIN_BLUE, characters: [BLUE], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_PURPLE, characters: [V.c2], costArea: { active: 5, rested: 0 } },
    );
    g.state = withAbilities(g.state, BLUE, [mkAb('a'), mkAb('b')]);
    const card = g.find('p1', 'characters', BLUE);
    g.act({ type: 'activate', card, ability: 'a' });
    g.act({ type: 'activate', card, ability: 'b' });
    g.act({ type: 'endTurn' });
    const d = dec(g) as { kind: string; options?: { label: string }[] } | undefined;
    expect(d?.kind).toBe('order');
    expect(d?.options?.length).toBe(2);
    for (const o of d?.options ?? []) {
      expect(o.label).toContain("(at the start of the opponent's next Main Phase)");
    }
  });
});
