/** OP13-014 Portgas.D.Rouge. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { ACE_CHAR, ACE_LEADER, LUFFY_LEADER } from './helpers-op13g1.ts';

const ID = 'OP13-014';

describe('OP13-014 Portgas.D.Rouge', () => {
  it('[Trigger]: up to 1 of your [Portgas.D.Ace] cards gains +3000 power this turn (a Character)', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER, characters: [ACE_CHAR, V.c3] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'characters', ACE_CHAR)]);
    expect(g.power(g.find('p1', 'characters', ACE_CHAR))).toBe(9000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
  });

  it('an [Ace] Leader is a candidate too; only [Portgas.D.Ace] cards are offered', () => {
    const g = damageGame(ID, { leader: ACE_LEADER, characters: [ACE_CHAR, V.c3] });
    g.act({ type: 'trigger', activate: true });
    const offered = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(offered.sort()).toEqual([g.leader('p1'), g.find('p1', 'characters', ACE_CHAR)].sort());
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('"up to 1": may choose nothing; and only 1 card gets the bonus', () => {
    const g = damageGame(ID, { leader: ACE_LEADER, characters: [ACE_CHAR] });
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(g.power(g.find('p1', 'characters', ACE_CHAR))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("the +3000 lasts this turn only (the opponent's turn here), not the next one", () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER, characters: [ACE_CHAR] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'characters', ACE_CHAR)]);
    expect(g.power(g.find('p1', 'characters', ACE_CHAR))).toBe(9000);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', ACE_CHAR))).toBe(6000);
  });

  it('must not fire when the trigger is declined, and has no [Ace] to pick without one', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER, characters: [ACE_CHAR] });
    g.act({ type: 'trigger', activate: false });
    expect(g.power(g.find('p1', 'characters', ACE_CHAR))).toBe(6000);

    const none_ = damageGame(ID, { leader: LUFFY_LEADER, characters: [V.c3] });
    none_.act({ type: 'trigger', activate: true });
    expect(none_.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    expectDecision(none_, 'main', 'p2');
  });
});
