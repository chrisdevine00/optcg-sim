/** OP16-096 Yamato (cost 8). */
import { describe, expect, it } from 'vitest';
import { game, none, pick, PLAIN_BLUE, V } from './helpers.ts';
import { koByBattle, names, OTHER_LEADER, YAMATO_5, YAMATO_6, YAMATO_8 } from './helpers-op16g4.ts';

const ID = 'OP16-096';

describe('OP16-096 Yamato', () => {
  it('has [Unblockable]', () => {
    const g = game({ leader: PLAIN_BLUE, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Unblockable');
  });

  it('[On K.O.] plays a [Yamato] with cost 6 or less from the trash', () => {
    const g = koByBattle({ leader: OTHER_LEADER, trash: [YAMATO_5, V.c1] }, ID);
    pick(g, [g.find('p1', 'trash', YAMATO_5)]);
    expect(names(g, 'p1', 'characters')).toEqual([YAMATO_5]);
    expect(names(g, 'p1', 'trash').sort()).toEqual([ID, V.c1].sort());
  });

  it('a cost 6 [Yamato] qualifies ("6 or less")', () => {
    const g = koByBattle({ leader: OTHER_LEADER, trash: [YAMATO_6] }, ID);
    pick(g, [g.find('p1', 'trash', YAMATO_6)]);
    expect(names(g, 'p1', 'characters')).toEqual([YAMATO_6]);
  });

  it('must not fire on a cost 8 [Yamato], a non-[Yamato] card, or itself (it is in the trash with cost 8)', () => {
    const g = koByBattle({ leader: OTHER_LEADER, trash: [YAMATO_8, V.c1] }, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(names(g, 'p1', 'characters')).toEqual([]);
  });

  it('"up to 1": may decline to play anything', () => {
    const g = koByBattle({ leader: OTHER_LEADER, trash: [YAMATO_5] }, ID);
    none(g);
    expect(names(g, 'p1', 'characters')).toEqual([]);
  });
});
