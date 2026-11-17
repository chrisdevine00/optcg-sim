/**
 * OP15-114 Wyper (Character, Yellow, cost 5, 6000, Counter +1000, {Sky Island}/{Shandian Warrior}).
 *
 * Card text: "[On Play] You may turn 1 card from the top of your Life cards face-up: Give all of your
 * opponent's Characters -2000 power during this turn. Then, K.O. all of your opponent's Characters with
 * 0 power or less.
 * [Activate: Main] [Once Per Turn] Give up to 1 rested DON!! card to 1 of your {Sky Island} type Leader or
 * Character cards."
 *
 * Rules: CR 8-3-1-3/-4 (costs), CR 1-3-2-1 (a card already face-up cannot be "turned face-up"), RL-09
 * ("during this turn"), CR 10-2-1 (K.O.), CR 10-2-13 ([Once Per Turn]).
 */
import { describe, expect, it } from 'vitest';
import { endTurn } from '../../helpers.ts';
import {
  abilities,
  accept,
  activate,
  canActivate,
  cardOf,
  chars,
  choiceCards,
  choices,
  choose,
  decline,
  don,
  kind,
  mine,
  outcomes,
  offered,
  playCard,
  RED,
  SC,
  settleYes,
  skipUnusable,
  trash,
  VAN,
  YL,
} from './kit-a.ts';

const FLAMPE = SC.flampe; // 1000
const STREUSEN = SC.streusen; // 2000
const SUNNY = VAN.sunny; // 3000
const MARCO = VAN.marco; // 5000

function played(life: (string | { card: string; faceUp: boolean })[] = [RED, RED, RED, RED]) {
  const g = mine(
    YL.sky,
    { hand: ['OP15-114'], life, characters: [FLAMPE] },
    { characters: [FLAMPE, STREUSEN, SUNNY, MARCO] },
  );
  playCard(g, 'OP15-114');
  return g;
}

describe('OP15-114 Wyper: [On Play] turn the top Life card face-up: opponent’s Characters -2000, then K.O. those at 0 or less', () => {
  it('paying: the top Life card is face-up; Characters at 2000 or less (1000 and exactly 2000) are K.O.’d; others lose 2000', () => {
    const g = played();
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    settleYes(g, 'p1');
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.zone('p1', 'life').filter((c) => c.faceUp)).toHaveLength(1);
    expect(chars(g, 'p2')).toEqual([SUNNY, MARCO].sort());
    expect(trash(g, 'p2')).toEqual([FLAMPE, STREUSEN].sort());
    expect(g.power(g.find('p2', 'characters', SUNNY))).toBe(1000);
    expect(g.power(g.find('p2', 'characters', MARCO))).toBe(3000);
  });

  it('"all": no targets are chosen, and my own Characters are not affected', () => {
    const g = played();
    accept(g);
    expect(kind(g)).not.toBe('choose');
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([FLAMPE, 'OP15-114'].sort());
    expect(g.power(g.find('p1', 'characters', FLAMPE))).toBe(1000);
  });

  it('the -2000 ends with the turn (the survivors are back to full power next turn)', () => {
    const g = played();
    accept(g);
    settleYes(g, 'p1');
    endTurn(g);
    expect(g.power(g.find('p2', 'characters', SUNNY))).toBe(3000);
    expect(g.power(g.find('p2', 'characters', MARCO))).toBe(5000);
  });

  it('CR 8-3-1-4: declining the cost changes nothing', () => {
    const g = played();
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(chars(g, 'p2')).toHaveLength(4);
    expect(g.zone('p1', 'life').some((c) => c.faceUp)).toBe(false);
    expect(g.power(g.find('p2', 'characters', MARCO))).toBe(5000);
  });

  it('CR 1-3-2-1: with the top Life card already face-up the cost cannot be paid', () => {
    const g = played([{ card: RED, faceUp: true }, RED, RED]);
    skipUnusable(g, 'p1');
    expect(chars(g, 'p2')).toHaveLength(4);
    expect(g.power(g.find('p2', 'characters', MARCO))).toBe(5000);
  });

  it('with 0 Life the cost cannot be paid', () => {
    const g = played([]);
    skipUnusable(g, 'p1');
    expect(chars(g, 'p2')).toHaveLength(4);
  });

  it('CR 6-5-5-2: DON!! given to an opposing Character add no power on my turn, so a 2000 Character with a DON!! is still K.O.’d', () => {
    const g = mine(
      YL.sky,
      { hand: ['OP15-114'], life: [RED, RED] },
      {
        characters: [
          { card: STREUSEN, don: 1 },
          { card: SUNNY, don: 1 },
        ],
      },
    );
    playCard(g, 'OP15-114');
    accept(g);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toEqual([SUNNY]);
    expect(g.power(g.find('p2', 'characters', SUNNY))).toBe(1000);
  });

  it('a Character already at 0 power or less is also K.O.’d by the sweep (no Characters survive at exactly 2000)', () => {
    const g = mine(
      YL.sky,
      { hand: ['OP15-114'], life: [RED, RED] },
      { characters: [STREUSEN, STREUSEN] },
    );
    playCard(g, 'OP15-114');
    accept(g);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toEqual([]);
  });
});

describe('OP15-114 Wyper: [Activate: Main] [Once Per Turn] give up to 1 rested DON!! to a {Sky Island} Leader or Character', () => {
  function board(leader: string = YL.sky) {
    return mine(leader, {
      characters: ['OP15-114', SC.genbo, SC.bobbin],
      costArea: { active: 2, rested: 2 },
    });
  }

  it('candidates: {Sky Island} Leader and Characters only (not a {Big Mom Pirates} Character)', () => {
    const g = board();
    const wyper = g.find('p1', 'characters', 'OP15-114');
    expect(canActivate(g, wyper)).toBe(true);
    activate(g, wyper);
    expect(kind(g)).toBe('choose');
    const cards = choices(g).map((i) => (g.card(i).zone === 'leader' ? 'LEADER' : cardOf(g, i)));
    expect(cards.sort()).toEqual(['LEADER', SC.genbo, 'OP15-114'].sort());
  });

  it('gives one rested DON!! to the chosen Character: it is attached, taken from the rested DON!!', () => {
    const g = board();
    activate(g, g.find('p1', 'characters', 'OP15-114'));
    const genbo = g.find('p1', 'characters', SC.genbo);
    choose(g, [genbo]);
    settleYes(g, 'p1');
    expect(g.card(genbo).don).toBe(1);
    expect(don(g)).toMatchObject({ active: 2, rested: 1, given: 1 });
  });

  it('can be given to the {Sky Island} Leader', () => {
    const g = board();
    activate(g, g.find('p1', 'characters', 'OP15-114'));
    choose(g, [g.leader('p1')]);
    settleYes(g, 'p1');
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('a Leader without the {Sky Island} type is not a candidate', () => {
    const g = board(YL.neutral);
    activate(g, g.find('p1', 'characters', 'OP15-114'));
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(choiceCards(g).sort()).toEqual([SC.genbo, 'OP15-114'].sort());
  });

  // DISAGREEMENTS-a.md A-2: the engine insists on a recipient and gives the DON!!.
  it('CR 8-4-4-1: "up to 1" rested DON!!: may give nothing', () => {
    const g = board();
    activate(g, g.find('p1', 'characters', 'OP15-114'));
    const reached = outcomes(g, 'p1', (b) => String(don(b).given));
    expect(reached.has('0')).toBe(true);
  });

  it('[Once Per Turn]: after using it, it is not offered again this turn', () => {
    const g = board();
    const wyper = g.find('p1', 'characters', 'OP15-114');
    activate(g, wyper);
    choose(g, [g.find('p1', 'characters', SC.genbo)]);
    settleYes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(abilities(g, wyper)).toEqual([]);
  });
});
