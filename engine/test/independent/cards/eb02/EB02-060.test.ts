/**
 * EB02-060 Merry Go (Yellow Stage, cost 2, {Straw Hat Crew}).
 *
 * Card text: "[Activate: Main] You may rest this Stage and turn 1 card from the top of your Life cards
 * face-up: Up to 1 of your "Straw Hat Crew" type Characters gains +1000 power until the end of your
 * opponent's next turn."
 *
 * Rules: the cost is two parts (rest this Stage, turn the TOP Life card face-up); Life is a secret zone
 * but its count is public, so an empty Life makes the cost unpayable; turning a card face-up does not
 * remove it from Life; the boost lasts through the opponent's next turn ("up to 1" may be 0).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  canUseAbility,
  kind,
  LE,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  SE,
  toMyNextMain,
  useAbility,
  no,
  unusable,
} from './kit-eb02b.ts';

const MERRY = 'EB02-060';

function field(o: { life?: number; chars?: string[]; stageRested?: boolean } = {}) {
  return mine(LE.luffy, {
    stage: o.stageRested ? { card: MERRY, rested: true } : MERRY,
    characters: o.chars ?? [SE.chopper4],
    life: Array(o.life ?? 4).fill(SE.mohji),
  });
}

const stageOf = (g: ReturnType<typeof mine>) => g.zone('p1', 'stage')[0]!.instance;

describe('EB02-060 Merry Go: [Activate: Main] rest this Stage and turn the top Life face-up: a "Straw Hat Crew" Character gains +1000', () => {
  it('printed cost 2', () => {
    const g = field();
    expect(g.card(stageOf(g)).cost).toBe(2);
  });

  it('rests the Stage, turns the top Life card face-up and gives +1000 power (6000 becomes 7000)', () => {
    const g = field();
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    useAbility(g, stageOf(g));
    need(g, 'choose', 'p1');
    pickCards(g, [SE.chopper4]);
    expect(g.card(stageOf(g)).rested).toBe(true);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.zone('p1', 'life')[1]!.faceUp).toBe(false);
    expect(g.power(g.find('p1', 'characters', SE.chopper4))).toBe(7000);
  });

  it('turning a Life card face-up does not remove it: the Life count is unchanged', () => {
    const g = field();
    useAbility(g, stageOf(g));
    pickCards(g, [SE.chopper4]);
    expect(g.life('p1')).toBe(4);
  });

  it('with exactly 1 Life card the cost is payable', () => {
    const g = field({ life: 1 });
    expect(canUseAbility(g, stageOf(g))).toBe(true);
    useAbility(g, stageOf(g));
    pickCards(g, [SE.chopper4]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.power(g.find('p1', 'characters', SE.chopper4))).toBe(7000);
  });

  it('unpayable: with no Life cards the Stage is not rested and nothing is boosted', () => {
    const g = field({ life: 0 });
    if (canUseAbility(g, stageOf(g))) {
      useAbility(g, stageOf(g));
      unusable(g, 'p1');
    }
    expect(g.card(stageOf(g)).rested).toBe(false);
    expect(g.power(g.find('p1', 'characters', SE.chopper4))).toBe(6000);
  });

  it('a rested Stage cannot be activated (the rest cost cannot be paid)', () => {
    const g = field({ stageRested: true });
    expect(canUseAbility(g, stageOf(g))).toBe(false);
  });

  it('offers only own {Straw Hat Crew} Characters', () => {
    const g = mine(
      LE.luffy,
      {
        stage: MERRY,
        characters: [SE.chopper4, SE.luffyYellow3, SE.holly3],
        life: Array(4).fill(SE.mohji),
      },
      { characters: [SE.sanjiRed1] },
    );
    useAbility(g, stageOf(g));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SE.chopper4, SE.luffyYellow3].sort());
    none(g);
  });

  it('"up to 1": choosing nobody still pays the cost (Stage rested, Life face-up)', () => {
    const g = field();
    useAbility(g, stageOf(g));
    need(g, 'choose', 'p1');
    none(g);
    expect(g.card(stageOf(g)).rested).toBe(true);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.power(g.find('p1', 'characters', SE.chopper4))).toBe(6000);
  });

  it('gives +1000 to one Character only', () => {
    const g = field({ chars: [SE.chopper4, SE.luffyYellow3] });
    useAbility(g, stageOf(g));
    pickCards(g, [SE.luffyYellow3]);
    expect(kind(g)).toBe('main');
    expect(g.power(g.find('p1', 'characters', SE.luffyYellow3))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', SE.chopper4))).toBe(6000);
  });

  it("lasts through the opponent's next turn and is gone on our next turn", () => {
    const g = field();
    useAbility(g, stageOf(g));
    pickCards(g, [SE.chopper4]);
    const c = g.find('p1', 'characters', SE.chopper4);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(c)).toBe(7000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(g.power(c)).toBe(6000);
  });

  it('must not: a second use in the same turn is impossible (the Stage is rested)', () => {
    const g = field();
    useAbility(g, stageOf(g));
    pickCards(g, [SE.chopper4]);
    expect(canUseAbility(g, stageOf(g))).toBe(false);
  });

  it('next turn the Stage is active again, but the top Life card is already face-up: turning it face-up is not performed (CR 1-3-2-1), so the cost cannot be paid', () => {
    const g = field();
    useAbility(g, stageOf(g));
    pickCards(g, [SE.chopper4]);
    toMyNextMain(g);
    expect(g.card(stageOf(g)).rested).toBe(false);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(canUseAbility(g, stageOf(g))).toBe(false);
    void no;
  });
});
