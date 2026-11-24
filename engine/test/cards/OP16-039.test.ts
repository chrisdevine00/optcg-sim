/** OP16-039 Gum-Gum Twin Jet Pistol. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { GREEN_LEADER, IMPEL_LEADER, LUFFY_034, mine, mineOther } from './helpers-op16g2.ts';

const ID = 'OP16-039';

describe('OP16-039 Gum-Gum Twin Jet Pistol', () => {
  it('[Main] up to 1 [Monkey.D.Luffy] gains [Double Attack]; with an {Impel Down} Leader, rests up to 2 opposing Characters with a cost of 3 or less', () => {
    const g = mine({ hand: [ID], characters: [LUFFY_034] }, { characters: [V.c3, V.c2, V.c4] });
    play(g, ID);
    const luffy = g.find('p1', 'characters', LUFFY_034);
    pick(g, [luffy]);
    expect(g.card(luffy).keywords).toContain('Double Attack');
    expect(g.card(g.leader('p1')).keywords).not.toContain('Double Attack');
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks).toHaveLength(2); // cost 4 is not a candidate
    pick(g, [g.find('p2', 'characters', V.c3), g.find('p2', 'characters', V.c2)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(false);
  });

  it('the Leader is a [Monkey.D.Luffy] card too and can take [Double Attack]', () => {
    const g = mine({ hand: [ID] });
    play(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).keywords).toContain('Double Attack');
  });

  it('"up to 2": a single Character may be rested, or none', () => {
    const g = mine({ hand: [ID] }, { characters: [V.c3, V.c2] });
    play(g, ID);
    none(g); // no [Luffy] chosen: the Leader would be the only one, "up to 1"
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
  });

  it('without an {Impel Down} Leader [Double Attack] is still given but nothing is rested', () => {
    const g = mineOther(
      { hand: [ID], characters: [LUFFY_034] },
      { characters: [V.c3] },
      GREEN_LEADER,
    );
    play(g, ID);
    pick(g, [g.find('p1', 'characters', LUFFY_034)]);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p1', 'characters', LUFFY_034)).keywords).toContain('Double Attack');
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });

  it("[Trigger] rests your opponent's Leader", () => {
    const g = damageGame(ID, { leader: IMPEL_LEADER });
    g.act({ type: 'trigger', activate: true });
    expect(g.card(g.leader('p2')).rested).toBe(true);
  });
});
