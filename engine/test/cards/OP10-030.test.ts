/** OP10-030 Smoker. */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../src/testing.ts';
import { don, expectDecision, option, V } from './helpers.ts';
import { activate, mk } from './helpers-a10g1.ts';

const ID = 'OP10-030';
const setOne = { do: { setActive: { from: 'donCostArea', owner: 'you', pick: { upTo: 1 } } } };

const start = (extra: Parameters<typeof mk>[0] = {}) =>
  mk({ characters: [ID], costArea: { active: 2, rested: 3 }, ...extra });
const smoker = (g: ReturnType<typeof start>) => g.find('p1', 'characters', ID);

describe('OP10-030 Smoker', () => {
  it('printed [Banish]: a damage dealt to the Leader trashes the Life card instead of adding it to the hand', () => {
    const g = start({ characters: [ID] });
    expect(g.card(smoker(g)).keywords).toContain('Banish');
    g.act({ type: 'attack', attacker: smoker(g), target: g.leader('p2') });
    while (g.legal().some((a) => a.type === 'block' || a.type === 'endCounter')) {
      g.act(g.legal().find((a) => a.type === 'block' || a.type === 'endCounter')!);
    }
    expect(g.zone('p2', 'life')).toHaveLength(2);
    expect(g.zone('p2', 'trash')).toHaveLength(1);
    expect(g.zone('p2', 'hand')).toHaveLength(0);
  });

  it('[Activate: Main]: sets up to 1 of your DON!! as active (a rested one becomes active)', () => {
    const g = start();
    activate(g, smoker(g), 'activate');
    expectDecision(g, 'choose', 'p1');
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
  });

  it('"up to 1": none may be chosen (and the restriction still applies afterwards)', () => {
    const g = start();
    activate(g, smoker(g), 'activate');
    option(g, '0');
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 3 });
  });

  it('then your Character effects cannot set DON!! as active this turn (a second Smoker or the same one used again)', () => {
    const g = start({ characters: [ID, V.c1] });
    g.state = withAbilities(g.state, V.c1, [
      { id: 'b', kind: 'activate', when: 'activateMain', effect: [setOne] } as Ability,
    ]);
    activate(g, smoker(g), 'activate');
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
    // No Once Per Turn and no rest cost: Smoker can be used again, and sets nothing.
    activate(g, smoker(g), 'activate');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
    g.act({ type: 'activate', card: g.find('p1', 'characters', V.c1), ability: 'b' });
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
  });

  it('must not stop a Leader effect from setting DON!! as active, and the lock ends with the turn', () => {
    const g = start({ characters: [ID, V.c1] });
    g.state = withAbilities(g.state, g.card(g.leader('p1')).card, [
      { id: 'l', kind: 'activate', when: 'activateMain', effect: [setOne] } as Ability,
    ]);
    activate(g, smoker(g), 'activate');
    option(g, '0');
    g.act({ type: 'activate', card: g.leader('p1'), ability: 'l' });
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
    // Next own turn: the restriction has expired and the Character effect works again.
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    g.state = withAbilities(g.state, V.c1, [
      {
        id: 'c',
        kind: 'activate',
        when: 'activateMain',
        cost: [{ restDon: 2 }],
        effect: [setOne],
      } as Ability,
    ]);
    const before = don(g, 'p1').active;
    g.act({ type: 'activate', card: g.find('p1', 'characters', V.c1), ability: 'c' });
    option(g, '1');
    expect(don(g, 'p1').active).toBe(before - 2 + 1);
  });
});
