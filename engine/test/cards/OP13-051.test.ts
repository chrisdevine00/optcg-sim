/** OP13-051 Boa Hancock. */
import { describe, expect, it } from 'vitest';
import { hand, PLAIN_BLUE } from './helpers.ts';
import { HANCOCK, HANCOCK_MONO, koBy, mk, MULTI_LEADER, V } from './helpers-op13g2.ts';

const ID = 'OP13-051';

const ko = (leader: string) => {
  const g = mk({ leader, characters: [ID], hand: [V.c1] });
  koBy(g, 'p1', ID, 'p2');
  return g;
};

describe('OP13-051 Boa Hancock', () => {
  it('[On K.O.]: with a multicolored [Boa Hancock] Leader, draws 2', () => {
    expect(hand(ko(HANCOCK), 'p1')).toHaveLength(3);
  });

  it('a mono-colored [Boa Hancock] Leader draws 2', () => {
    expect(hand(ko(HANCOCK_MONO), 'p1')).toHaveLength(3);
  });

  it('a multicolored Leader that is not [Boa Hancock] draws 2', () => {
    expect(hand(ko(MULTI_LEADER), 'p1')).toHaveLength(3);
  });

  it('must not draw with a mono-colored Leader that is not [Boa Hancock]', () => {
    expect(hand(ko(PLAIN_BLUE), 'p1')).toHaveLength(1);
  });

  it('must not draw when played, only when K.O.ed', () => {
    const g = mk({ leader: HANCOCK, hand: [ID] });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    expect(hand(g, 'p1')).toHaveLength(0);
  });
});
