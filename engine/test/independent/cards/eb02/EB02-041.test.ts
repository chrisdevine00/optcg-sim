/**
 * EB02-041 Merry Go (Purple Stage, cost 1, {Straw Hat Crew}).
 *
 * Card text: "[On Play] If your Leader has the "Straw Hat Crew" type, draw 1 card. [Activate: Main] You may
 * rest this Stage: If the number of DON!! cards on your field is equal to or less than the number on
 * your opponent's field, up to 1 of your "Straw Hat Crew" type Characters gains +2 cost until the end
 * of your opponent's next turn."
 *
 * Rules: "DON!! cards on your field" counts the cost area (active and rested) plus given DON!!
 * (CR 3-1-2); the "If" after the colon is an effect condition, so resting the Stage is paid even when
 * the check fails; the cost bonus lasts through the opponent's next turn and ends with it.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  canUseAbility,
  deck,
  hand,
  kind,
  LE,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  SE,
  skipEmptyPick,
  toMyNextMain,
  trash,
  useAbility,
} from './kit-eb02b.ts';

const MERRY = 'EB02-041';

function stageOf(g: ReturnType<typeof mine>) {
  return g.zone('p1', 'stage')[0]!.instance;
}

/** p1 with the Stage on the field and `chars` Characters; `mineDon` and `oppDon` active DON!! (cost area). */
function field(o: { mineDon?: number; oppDon?: number; chars?: string[]; leader?: unknown } = {}) {
  return mine(
    (o.leader as string) ?? LE.luffy,
    {
      stage: MERRY,
      characters: o.chars ?? [SE.chopper4],
      costArea: { active: o.mineDon ?? 5, rested: 0 },
    },
    { costArea: { active: o.oppDon ?? 5, rested: 0 } },
  );
}

describe('EB02-041 Merry Go: [On Play] if the Leader has "Straw Hat Crew", draw 1', () => {
  it('a {Straw Hat Crew} Leader: playing the Stage draws 1 card (and costs 1 DON!!)', () => {
    const g = mine(LE.luffy, { hand: [MERRY], deck: [SE.marco, ...Array(10).fill(SE.mohji)] });
    playRaw(g, MERRY);
    expect(kind(g)).toBe('main');
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([MERRY]);
    expect(hand(g)).toEqual([SE.marco]);
    expect(deck(g)).toHaveLength(10);
    expect(g.card(stageOf(g)).cost).toBe(1);
  });

  it('a Leader without the type: nothing is drawn', () => {
    const g = mine(LE.croc, { hand: [MERRY], deck: [SE.marco, ...Array(10).fill(SE.mohji)] });
    playRaw(g, MERRY);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([MERRY]);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(11);
  });
});

describe('EB02-041 Merry Go: [Activate: Main] rest this Stage: +2 cost to a "Straw Hat Crew" Character if our DON!! <= the opponent\'s', () => {
  it('equal DON!! (5 and 5, boundary): rests the Stage and gives +2 cost (4 becomes 6)', () => {
    const g = field();
    useAbility(g, stageOf(g));
    need(g, 'choose', 'p1');
    pickCards(g, [SE.chopper4]);
    expect(g.card(stageOf(g)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', SE.chopper4)).cost).toBe(6);
  });

  it('fewer DON!! than the opponent (3 and 5): the bonus applies', () => {
    const g = field({ mineDon: 3 });
    useAbility(g, stageOf(g));
    pickCards(g, [SE.chopper4]);
    expect(g.card(g.find('p1', 'characters', SE.chopper4)).cost).toBe(6);
  });

  it('one more DON!! than the opponent (5 and 4, boundary): no bonus, but the Stage is still rested', () => {
    const g = field({ mineDon: 5, oppDon: 4 });
    useAbility(g, stageOf(g));
    skipEmptyPick(g);
    expect(g.card(stageOf(g)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', SE.chopper4)).cost).toBe(4);
  });

  it('rested DON!! count for both sides', () => {
    const g = mine(
      LE.luffy,
      { stage: MERRY, characters: [SE.chopper4], costArea: { active: 2, rested: 3 } },
      { costArea: { active: 1, rested: 4 } },
    );
    useAbility(g, stageOf(g));
    pickCards(g, [SE.chopper4]);
    expect(g.card(g.find('p1', 'characters', SE.chopper4)).cost).toBe(6);
  });

  it('DON!! given to our Leader count as DON!! on our field (3 + 2 given = 5 against 4: no bonus)', () => {
    const g = mine(
      { card: LE.luffy, don: 2 } as never,
      { stage: MERRY, characters: [SE.chopper4], costArea: { active: 3, rested: 0 } },
      { costArea: { active: 4, rested: 0 } },
    );
    useAbility(g, stageOf(g));
    skipEmptyPick(g);
    expect(g.card(g.find('p1', 'characters', SE.chopper4)).cost).toBe(4);
  });

  it('offers only own {Straw Hat Crew} Characters', () => {
    const g = mine(
      LE.luffy,
      {
        stage: MERRY,
        characters: [SE.chopper4, SE.luffyYellow3, SE.holly3],
        costArea: { active: 5, rested: 0 },
      },
      { characters: [SE.sanjiRed1], costArea: { active: 5, rested: 0 } },
    );
    useAbility(g, stageOf(g));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SE.chopper4, SE.luffyYellow3].sort());
    none(g);
  });

  it('"up to 1": may give it to nothing; the Stage stays rested', () => {
    const g = field();
    useAbility(g, stageOf(g));
    need(g, 'choose', 'p1');
    none(g);
    expect(g.card(stageOf(g)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', SE.chopper4)).cost).toBe(4);
  });

  it("lasts through the opponent's next turn and ends with it", () => {
    const g = field();
    useAbility(g, stageOf(g));
    pickCards(g, [SE.chopper4]);
    const c = g.find('p1', 'characters', SE.chopper4);
    expect(g.card(c).cost).toBe(6);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.card(c).cost).toBe(6);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(g.card(c).cost).toBe(4);
  });

  it('a rested Stage cannot be activated again (cannot pay the rest cost); it is active again next turn', () => {
    const g = field();
    useAbility(g, stageOf(g));
    pickCards(g, [SE.chopper4]);
    expect(canUseAbility(g, stageOf(g))).toBe(false);
    toMyNextMain(g);
    expect(canUseAbility(g, stageOf(g))).toBe(true);
  });

  it('can be activated the turn it was played', () => {
    const g = mine(
      LE.luffy,
      { hand: [MERRY], characters: [SE.chopper4], deck: Array(10).fill(SE.mohji) },
      { costArea: { active: 10, rested: 0 } },
    );
    playRaw(g, MERRY);
    expect(canUseAbility(g, stageOf(g))).toBe(true);
    void trash;
  });
});
