/** ST29-012 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { dec, expectDecision, pick, PLAIN_BLUE, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import {
  activate,
  canPick,
  cardsIn,
  LUFFY_C,
  LUFFY_LEADER,
  mk,
  pickable,
} from './helpers-st29old.ts';

const ID = 'ST29-012';
const start = (active: number, rested: number, chars: string[] = [ID, V.c1]) =>
  mk({ characters: chars, costArea: { active, rested } });

describe('ST29-012 Monkey.D.Luffy', () => {
  it('[Activate: Main] [Once Per Turn]: gives 1 rested DON!! to a [Monkey.D.Luffy] Leader', () => {
    const g = start(3, 2);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ active: 3, rested: 1, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('only [Monkey.D.Luffy] cards are targets: this Character and the Leader, not another Character', () => {
    const g = start(3, 2, [ID, V.c1, LUFFY_C]);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    expect(pickable(g).sort()).toEqual(
      [g.leader('p1'), g.find('p1', 'characters', ID), g.find('p1', 'characters', LUFFY_C)].sort(),
    );
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
  });

  it('with another Leader the only target is a [Monkey.D.Luffy] Character (itself here)', () => {
    const g = mk({
      leader: PLAIN_BLUE,
      characters: [ID, V.c1],
      costArea: { active: 3, rested: 2 },
    });
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.card(g.find('p1', 'characters', ID)).don).toBe(1);
  });

  it('only a RESTED DON!! is given: with none rested nothing happens', () => {
    const g = start(5, 0);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    expect(queries.don(g.state, 'p1')).toMatchObject({ active: 5, rested: 0, given: 0 });
    expect(dec(g)?.kind).toBe('main');
  });

  it('Once Per Turn: a second activation is not offered', () => {
    const g = start(1, 4);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    pick(g, [g.leader('p1')]);
    expect(
      g.legal().some((a) => a.type === 'activate' && a.card === g.find('p1', 'characters', ID)),
    ).toBe(false);
  });

  it('[Trigger]: plays this card (no condition)', () => {
    const g = damageGame(ID, { leader: PLAIN_BLUE });
    g.act({ type: 'trigger', activate: true });
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    const h = damageGame(ID, { leader: LUFFY_LEADER });
    h.act({ type: 'trigger', activate: false });
    expect(cardsIn(h, 'p1', 'hand')).toEqual([ID]);
  });
});
