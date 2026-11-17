/**
 * OP17-114 Sweet 3 Generals (Character, Yellow, cost 6, 4000, Counter +1000, {Big Mom Pirates}).
 *
 * Card text: "[Your Turn] [On Play] You may rest 2 of your DON!! cards: Draw 1 card and add up to 1 card
 * from the top of your deck to the top of your Life cards. Then, give up to 2 of your opponent's
 * Characters -3000 power during this turn. [Trigger] Play this card."
 *
 * Rules: CR 8-3-2-4 ([Your Turn]), CR 8-3-1-3/-4 (costs), CR 8-4-4-1 ("up to" allows 0),
 * CR 10-1-5 ([Trigger]), RL-09 ("during this turn" ends at the end of the turn).
 */
import { describe, expect, it } from 'vitest';
import { endTurn, fill } from '../../helpers.ts';
import {
  accept,
  activateTrigger,
  BLUE,
  cardOf,
  chars,
  choices,
  choose,
  chooseNone,
  decline,
  deck,
  don,
  hand,
  hitLeader,
  kind,
  lifeCards,
  mine,
  offered,
  playCard,
  reachablePickSets,
  RED,
  SC,
  settleYes,
  skipUnusable,
  theirs,
  VAN,
  YL,
} from './kit-a.ts';

const OPP = [VAN.marco, VAN.kingdew, VAN.thatch];

function played(active = 8) {
  const g = mine(
    YL.bmp,
    {
      hand: ['OP17-114'],
      costArea: { active, rested: 0 },
      life: fill(RED, 3),
      deck: [SC.bobbin, SC.opera, ...fill(BLUE, 10)],
    },
    { characters: OPP },
  );
  playCard(g, 'OP17-114');
  return g;
}

/** Say yes to the optional and to any non-target step until the choice of opposing Characters. */
function toTargets(g: ReturnType<typeof played>) {
  for (let i = 0; i < 10; i++) {
    if (kind(g) === 'optional') accept(g);
    else if (kind(g) === 'choose' && choices(g).some((c) => g.card(c).owner === 'p2')) return;
    else if (kind(g) === 'choose') {
      const first = choices(g)[0];
      if (first) choose(g, [first]);
      else chooseNone(g);
    } else return;
  }
}

const power = (g: ReturnType<typeof played>, card: string) =>
  g.power(g.find('p2', 'characters', card));

describe('OP17-114 Sweet 3 Generals: [Your Turn] [On Play] rest 2 DON!!, draw 1 and add to Life, then -3000 to up to 2', () => {
  it('paying: draw 1, deck top to Life top, 2 DON!! rest, two chosen opposing Characters get -3000', () => {
    const g = played();
    expect(offered(g, 'p1')).toBe(true);
    toTargets(g);
    expect(hand(g)).toEqual([SC.bobbin]);
    expect(lifeCards(g)[0]).toBe(SC.opera);
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(10);
    expect(don(g)).toMatchObject({ active: 0, rested: 8 });
    const ids = (cs: string[]) => cs.map((c) => choices(g).find((i) => cardOf(g, i) === c)!);
    choose(g, ids([VAN.marco, VAN.thatch]));
    settleYes(g, 'p1');
    expect(power(g, VAN.marco)).toBe(2000);
    expect(power(g, VAN.thatch)).toBe(5000);
    expect(power(g, VAN.kingdew)).toBe(7000);
  });

  it('at most 2 Characters can be chosen out of 3, and 1 or 0 is allowed', () => {
    const g = played();
    toTargets(g);
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    }
    choose(g, [choices(g).find((i) => cardOf(g, i) === VAN.kingdew)!]);
    settleYes(g, 'p1');
    expect(power(g, VAN.kingdew)).toBe(4000);
    expect(power(g, VAN.marco)).toBe(5000);
  });

  it('only the opponent’s Characters are candidates (not her own side)', () => {
    const g = played();
    toTargets(g);
    expect(choices(g).every((i) => g.card(i).owner === 'p2')).toBe(true);
    expect(chars(g)).toEqual(['OP17-114']);
  });

  it('"up to": may give -3000 to nobody', () => {
    const g = played();
    toTargets(g);
    chooseNone(g);
    settleYes(g, 'p1');
    for (const c of OPP)
      expect(power(g, c)).toBe({ [VAN.marco]: 5000, [VAN.kingdew]: 7000, [VAN.thatch]: 8000 }[c]);
  });

  it('the -3000 ends with the turn', () => {
    const g = played();
    toTargets(g);
    choose(g, [choices(g).find((i) => cardOf(g, i) === VAN.marco)!]);
    settleYes(g, 'p1');
    expect(power(g, VAN.marco)).toBe(2000);
    endTurn(g);
    expect(power(g, VAN.marco)).toBe(5000);
  });

  it('CR 8-3-1-4: declining the cost does nothing', () => {
    const g = played();
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(hand(g)).toEqual([]);
    expect(g.life('p1')).toBe(3);
    expect(don(g)).toMatchObject({ active: 2, rested: 6 });
    expect(power(g, VAN.marco)).toBe(5000);
  });

  it('CR 8-3-1-3: with fewer than 2 active DON!! left the cost cannot be paid', () => {
    const g = played(7);
    skipUnusable(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(power(g, VAN.marco)).toBe(5000);
  });
});

describe('OP17-114 Sweet 3 Generals: [Trigger] play this card, not [Your Turn]', () => {
  it('played by [Trigger] on the opponent’s turn she enters but her [On Play] does not run', () => {
    const g = theirs(
      YL.bmp,
      {
        life: ['OP17-114', ...fill(RED, 3)],
        costArea: { active: 2, rested: 0 },
        deck: fill(BLUE, 10),
      },
      { characters: [VAN.marco] },
    );
    hitLeader(g);
    activateTrigger(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual(['OP17-114']);
    expect(hand(g)).toEqual([]);
    expect(g.life('p1')).toBe(3);
    expect(power(g, VAN.marco)).toBe(5000);
    expect(don(g)).toMatchObject({ active: 2, rested: 0 });
  });
});
