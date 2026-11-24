/** EB04-035 Hitokiri Kamazo: [Blocker]; [Your Turn] [Once Per Turn] when a DON!! card on your field is returned to your DON!! deck, with a {Kid Pirates} Leader add up to 1 DON!! rested. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, payDon } from './helpers.ts';
import { game, PLAIN_BLUE } from './helpers.ts';
import { KID_LEADER, mine, OTHER_LEADER, plant } from './helpers-eb04g2.ts';

const ID = 'EB04-035';
const RETURN1 = { returnDon: { n: 1 } };

const setup = (leader: string) =>
  mine({ leader, characters: [ID], costArea: { active: 5, rested: 0 } });

/** Plant-and-run "return 1 DON!!", answering the DON!! choice if one is asked. */
const returnOne = (g: ReturnType<typeof setup>) => {
  plant(g, 'p1', RETURN1);
  payDon(g);
};

describe('EB04-035 Hitokiri Kamazo', () => {
  it('has [Blocker]', () => {
    const g = setup(KID_LEADER);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('your turn, {Kid Pirates} Leader: a DON!! returned adds 1 rested DON!!', () => {
    const g = setup(KID_LEADER);
    returnOne(g);
    expectDecision(g, 'choose', 'p1');
    addMost(g);
    // 5 active, one returned (4 active, 6 in the DON!! deck), one added rested (1 rested, 5 in the deck)
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 1, deck: 5 });
  });

  it('once per turn: a second return adds nothing', () => {
    const g = setup(KID_LEADER);
    returnOne(g);
    addMost(g);
    expectDecision(g, 'main', 'p1');
    const before = don(g, 'p1');
    // The Leader ability planted earlier is replaced by the next plant (still an Activate: Main).
    plant(g, 'p1', RETURN1);
    payDon(g);
    expectDecision(g, 'main', 'p1');
    const after = don(g, 'p1');
    expect(after.deck).toBe(before.deck + 1);
    expect(after.active + after.rested).toBe(before.active + before.rested - 1);
  });

  it('"up to 1": the count can be 0', () => {
    const g = setup(KID_LEADER);
    returnOne(g);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options!.map((o) => o.id)).toContain('0');
  });

  it('without a {Kid Pirates} Leader nothing is added', () => {
    const g = setup(OTHER_LEADER);
    returnOne(g);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 0, deck: 6 });
  });

  it("on your opponent's turn nothing is added (a [Your Turn] effect)", () => {
    const g = game(
      { leader: KID_LEADER, characters: [ID], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE, costArea: { active: 5, rested: 0 } },
      { turn: 4, activePlayer: 'p2' },
    );
    plant(g, 'p2', { returnDon: { n: 1, player: 'opponent' } });
    payDon(g);
    expect(don(g, 'p1')).toMatchObject({ rested: 0 });
    expect(don(g, 'p1').deck).toBe(6);
  });

  it("the opponent's DON!! returning does not trigger it on your turn", () => {
    const g = mine(
      { leader: KID_LEADER, characters: [ID], costArea: { active: 5, rested: 0 } },
      { costArea: { active: 5, rested: 0 } },
    );
    plant(g, 'p1', { returnDon: { n: 1, player: 'opponent' } });
    payDon(g);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 0, deck: 5 });
  });
});
