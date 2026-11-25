/** ST16-005 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { V } from './helpers.ts';
import { FILM_LEADER, mk } from './helpers-prbst.ts';

const ID = 'ST16-005';
/** OP01-005 Uta (a Character named [Uta], unscripted: no effects in these positions). */
const UTA = 'OP01-005';

describe('ST16-005 Monkey.D.Luffy', () => {
  const power = (g: ReturnType<typeof mk>) => g.power(g.find('p1', 'characters', ID));

  it('with a rested [Uta] Character it has +1000 power', () => {
    const g = mk({ characters: [ID, { card: UTA, rested: true }] });
    expect(power(g)).toBe(4000);
  });

  it('must not fire: an active [Uta] gives nothing', () => {
    const g = mk({ characters: [ID, UTA] });
    expect(power(g)).toBe(3000);
  });

  it('must not fire: a different rested Character gives nothing', () => {
    const g = mk({ characters: [ID, { card: V.c1, rested: true }] });
    expect(power(g)).toBe(3000);
  });

  it("must not fire: the opponent's rested [Uta] does not count", () => {
    const g = mk({ characters: [ID] }, { characters: [{ card: UTA, rested: true }] });
    expect(power(g)).toBe(3000);
  });

  it('the bonus follows the Uta: it is gone when she is active again', () => {
    const g = mk({ characters: [ID, { card: UTA, rested: true }] });
    expect(power(g)).toBe(4000);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    // The Refresh Phase set her active.
    expect(g.power(g.find('p1', 'characters', ID))).toBe(3000);
  });

  it('reading: a rested Leader named [Uta] counts as a rested [Uta] too', () => {
    const g = mk({ leader: { card: 'OP06-001', rested: true }, characters: [ID] });
    expect(power(g)).toBe(4000);
    void FILM_LEADER;
  });
});
