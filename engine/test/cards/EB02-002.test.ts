/** EB02-002 Sabo. */
import { describe, expect, it } from 'vitest';
import { activate, canPick, mk, offeredAb, pick, RA2, RA3, SHC } from './helpers-aeb2g1.ts';
import { dec, none } from './helpers.ts';

const ID = 'EB02-002';
const A = 'power';

describe('EB02-002 Sabo', () => {
  it('rests itself and gives +2000 to another {Revolutionary Army} Character for this turn only', () => {
    const g = mk({ characters: [ID, RA2, RA3] });
    const koala = g.find('p1', 'characters', RA2);
    activate(g, g.find('p1', 'characters', ID), A);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    pick(g, [koala]);
    expect(g.power(koala)).toBe(6000); // 4000 + 2000
    expect(g.power(g.find('p1', 'characters', RA3))).toBe(5000); // untouched
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(koala)).toBe(4000);
  });

  it("offers only {Revolutionary Army} Characters other than [Sabo]: not another [Sabo], not this one, not a non-RA, not the opponent's", () => {
    const g = mk({ characters: [ID, ID, RA2, SHC.sanji1] }, { characters: [RA3] });
    activate(g, g.find('p1', 'characters', ID, 0), A);
    expect(canPick(g, g.find('p1', 'characters', RA2))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ID, 0))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', ID, 1))).toBe(false); // also named [Sabo]
    expect(canPick(g, g.find('p1', 'characters', SHC.sanji1))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', RA3))).toBe(false);
    expect(canPick(g, g.leader('p1'))).toBe(false);
  });

  it('"up to 1": may pick nothing (the Sabo is still rested)', () => {
    const g = mk({ characters: [ID, RA2] });
    activate(g, g.find('p1', 'characters', ID), A);
    none(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(g.power(g.find('p1', 'characters', RA2))).toBe(4000);
    expect(dec(g)?.kind).toBe('main');
  });

  it('with no other {Revolutionary Army} Character the cost is still paid and nothing is picked', () => {
    const g = mk({ characters: [ID, SHC.sanji1] });
    activate(g, g.find('p1', 'characters', ID), A);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(dec(g)?.kind).not.toBe('choose'); // nothing to pick: the effect finds no target
  });

  it('cannot be activated while rested', () => {
    const g = mk({ characters: [{ card: ID, rested: true }, RA2] });
    expect(offeredAb(g, g.find('p1', 'characters', ID), A)).toBe(false);
  });
});
