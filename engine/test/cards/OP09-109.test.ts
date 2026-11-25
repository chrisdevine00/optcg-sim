/** OP09-109 Jaguar.D.Saul. */
import { describe, expect, it } from 'vitest';
import { handIds, hitWith, idsOf, mk, OTHER_LEADER, ROBIN_LEADER } from './helpers-a09g3.ts';

const ID = 'OP09-109';

describe('OP09-109 Jaguar.D.Saul', () => {
  it('has [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[Trigger] with a [Nico Robin] Leader, it is played', () => {
    const g = hitWith(ID, ROBIN_LEADER);
    g.act({ type: 'trigger', activate: true });
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(handIds(g, 'p1')).toEqual([]);
  });

  it('must not be played without a [Nico Robin] Leader: it is trashed', () => {
    const g = hitWith(ID, OTHER_LEADER);
    g.act({ type: 'trigger', activate: true });
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('declining the [Trigger] adds it to the hand', () => {
    const g = hitWith(ID, ROBIN_LEADER);
    g.act({ type: 'trigger', activate: false });
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(handIds(g, 'p1')).toEqual([ID]);
  });
});
