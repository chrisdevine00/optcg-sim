/**
 * PRB02-016 Otama (Character, cost 2, 0 power, Counter +2000, {Land of Wano}).
 *
 * Card text: "[Activate: Main] You may rest this Character and add 1 card from the top or bottom of your
 * Life cards to your hand: Up to 1 of your Leader or Character cards gains +3000 power during this
 * turn. [Trigger] Rest up to 1 of your opponent's Characters with a cost of 4 or less."
 *
 * Rules: the text before the colon is the cost (rest this Character, take a Life card from the top
 * or the bottom: the player chooses which); a rested Character cannot pay it and neither can an empty
 * Life area. A Life card added to hand by an effect does not activate its [Trigger]. "Up to 1" may be
 * answered with nothing; the cost stays paid. [Trigger] (CR 10-1-5) activates when this card is taken
 * from Life as damage and its owner chooses to use it; it is trashed after resolving.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  at,
  atMainOf,
  chr,
  declineTrigger,
  hand,
  hitLeader,
  kind,
  LDP,
  leadPow,
  lifeCards,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  SP,
  sorted,
  theirs,
  useAbility,
  choices,
} from './kit-prb02sta.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const OT = 'PRB02-016';
const LIFE = [SP.c1p3, SP.c2p4, SP.c3p5, SP.c4p6];

function board(
  chars: (string | { card: string; rested?: boolean })[] = [OT],
  life: string[] = LIFE,
) {
  return mine(LDP.neutral, { characters: chars, life });
}

/** Activate Otama and take the `which` Life card. The pending decision is then the +3000 target pick. */
function activate(g: TestGame, which: 'top' | 'bottom' = 'top') {
  useAbility(g, at(g, 'p1', 'characters', OT));
  const d = need(g, 'choose', 'p1');
  expect(d.purpose).toBe('mode');
  act(g, { type: 'pick', choice: { option: which } });
}

describe('PRB02-016 Otama: [Activate: Main] rest + Life to hand: +3000; [Trigger] rest a cost 4 or less Character', () => {
  it('printed values: cost 2, 0 power, Counter +2000', () => {
    const g = board();
    const i = at(g, 'p1', 'characters', OT);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([2, 0, 2000]);
  });

  it('top Life card: it goes to hand, Otama is rested and the chosen Leader gets +3000 (5000 -> 8000)', () => {
    const g = board();
    activate(g, 'top');
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(hand(g)).toEqual([SP.c1p3]);
    expect(lifeCards(g)).toEqual([SP.c2p4, SP.c3p5, SP.c4p6]);
    expect(g.card(at(g, 'p1', 'characters', OT)).rested).toBe(true);
    expect(leadPow(g)).toBe(8000);
    expect(atMainOf(g)).toBe(true);
  });

  it('bottom Life card: the LAST Life card goes to hand and the top stays', () => {
    const g = board();
    activate(g, 'bottom');
    pickInst(g, [g.leader('p1')]);
    expect(hand(g)).toEqual([SP.c4p6]);
    expect(lifeCards(g)).toEqual([SP.c1p3, SP.c2p4, SP.c3p5]);
  });

  it('the +3000 can go to a Character: Otama herself (0 -> 3000) or another one', () => {
    const g = board([OT, SP.c3p5]);
    activate(g);
    pickInst(g, [at(g, 'p1', 'characters', SP.c3p5)]);
    expect(g.power(at(g, 'p1', 'characters', SP.c3p5))).toBe(8000);
    expect(leadPow(g)).toBe(5000);
    const g2 = board();
    activate(g2);
    pickInst(g2, [at(g2, 'p1', 'characters', OT)]);
    expect(g2.power(at(g2, 'p1', 'characters', OT))).toBe(3000);
  });

  it("the target pick offers only my Leader and my Characters, never the opponent's", () => {
    const g = mine(
      LDP.neutral,
      { characters: [OT, SP.c3p5], life: LIFE },
      { characters: [SP.c4p6] },
    );
    activate(g);
    need(g, 'choose', 'p1');
    expect([...choices(g)].sort()).toEqual(
      [g.leader('p1'), at(g, 'p1', 'characters', OT), at(g, 'p1', 'characters', SP.c3p5)].sort(),
    );
  });

  it('"up to 1": choosing nothing gives no power, but the cost stays paid (rested, Life card in hand)', () => {
    const g = board();
    activate(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(leadPow(g)).toBe(5000);
    expect(g.card(at(g, 'p1', 'characters', OT)).rested).toBe(true);
    expect(hand(g)).toEqual([SP.c1p3]);
  });

  it('the Life card added by the cost does not activate a [Trigger]: Otama herself on top stays in hand', () => {
    const g = mine(LDP.neutral, {
      characters: [OT],
      life: ['OP01-104', SP.c1p3, SP.c1p3, SP.c1p3],
    });
    activate(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(hand(g)).toEqual(['OP01-104']);
    expect(sorted(g, 'p1', 'characters')).toEqual([OT]);
  });

  it('no Life cards: the cost cannot be paid, [Activate: Main] is not offered', () => {
    const g = board([OT], []);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', OT))).toEqual([]);
  });

  it('a rested Otama cannot pay the rest cost: not offered; and after one use she is rested so a second use is not offered', () => {
    const g = board([{ card: OT, rested: true }]);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', OT))).toEqual([]);
    const g2 = board();
    activate(g2);
    none(g2);
    expect(offeredAbilities(g2, at(g2, 'p1', 'characters', OT))).toEqual([]);
  });

  it('the +3000 lasts this turn only: back to 5000 on my next turn', () => {
    const g = board();
    activate(g);
    pickInst(g, [g.leader('p1')]);
    expect(leadPow(g)).toBe(8000);
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' });
    expect(leadPow(g)).toBe(5000);
  });

  it('[Trigger]: activating it rests an opposing Character with cost 4 or less (cost 4 yes, cost 5 not offered)', () => {
    const g = theirs(
      LDP.neutral,
      { life: [OT, SP.c1p3, SP.c1p3, SP.c1p3] },
      { characters: [SP.c4p6, SP.c5p7, SP.c2p4] },
    );
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.c2p4, SP.c4p6].sort());
    pickInst(g, [chr(g, 'p2', SP.c4p6)]);
    expect(g.card(chr(g, 'p2', SP.c4p6)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', SP.c5p7)).rested).toBe(false);
    expect(sorted(g, 'p1', 'trash')).toEqual([OT]);
  });

  it('[Trigger] "up to 1": choosing nothing rests nothing; declining the [Trigger] adds Otama to hand', () => {
    const g = theirs(
      LDP.neutral,
      { life: [OT, SP.c1p3, SP.c1p3, SP.c1p3] },
      { characters: [SP.c4p6] },
    );
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.card(chr(g, 'p2', SP.c4p6)).rested).toBe(false);
    const g2 = theirs(
      LDP.neutral,
      { life: [OT, SP.c1p3, SP.c1p3, SP.c1p3] },
      { characters: [SP.c4p6] },
    );
    hitLeader(g2);
    declineTrigger(g2);
    expect(hand(g2)).toEqual([OT]);
    expect(g2.card(chr(g2, 'p2', SP.c4p6)).rested).toBe(false);
    expect(kind(g2)).not.toBe('trigger');
  });
});
