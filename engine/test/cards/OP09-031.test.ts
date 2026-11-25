/** OP09-031 Donquixote Doflamingo. */
import { describe, expect, it } from 'vitest';
import { dec, V } from './helpers.ts';
import { ids, mk } from './helpers-a09g2.ts';

const ID = 'OP09-031';
const R = (card: string) => ({ card, rested: true });
const endTurn = (g: ReturnType<typeof mk>) => g.act({ type: 'endTurn' });
const rested = (g: ReturnType<typeof mk>, card = ID) =>
  g.card(g.find('p1', 'characters', card)).rested;

describe('OP09-031 Donquixote Doflamingo', () => {
  it('has [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[End of Your Turn] with 2 rested Characters (himself included): sets himself active', () => {
    const g = mk({ characters: [R(ID), R(V.c1)] });
    endTurn(g);
    expect(rested(g)).toBe(false);
    expect(rested(g, V.c1)).toBe(true); // only this Character is set
  });

  it('boundary: only 1 rested Character (himself) leaves him rested', () => {
    const g = mk({ characters: [R(ID), V.c1] });
    endTurn(g);
    expect(rested(g)).toBe(true);
  });

  it('rested Characters of the opponent do not count', () => {
    const g = mk({ characters: [R(ID)] }, { characters: [R(V.c1), R(V.c2)] });
    endTurn(g);
    expect(rested(g)).toBe(true);
  });

  it('an active Doflamingo with 2 rested others stays active and nothing is asked', () => {
    const g = mk({ characters: [ID, R(V.c1), R(V.c2)] });
    endTurn(g);
    expect(rested(g)).toBe(false);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(ids(g, 'p1', 'characters')).toHaveLength(3);
  });
});
