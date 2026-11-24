/**
 * ST34-001 Charlotte Katakuri (Purple Character, cost 5, 7000, no Counter, Strike, {Big Mom Pirates}).
 *
 * Card text: "[Your Turn] [Once Per Turn] When a DON!! card on your field is returned to your DON!! deck, if
 * your Leader has the {Big Mom Pirates} type, add up to 2 DON!! cards from your DON!! deck and rest them.
 * [On K.O.] Play up to 1 Character card with 8000 power or less from your hand."
 *
 * Rules: CR 8-3-3, "Once Per Turn" (CR 8-4-?), E-Q11 ("add up to N DON!!" asks a count), CR 8-1-3
 * ([On K.O.] activates on the field), CR 8-4-4-1 ("up to"). Returns are made by the DON!! −N costs of
 * Tamago (ST34-005, [When Attacking] DON!! −1) and the [Counter] of OP07-076 (DON!! −1).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  activateCounter,
  asksDonCount,
  atMain,
  attack,
  BLUE,
  cardIds,
  choices,
  decision,
  don,
  donCountOptions,
  fill,
  hand,
  kind,
  LDB,
  mine,
  need,
  none,
  noDefence,
  offeredIds,
  passBlock,
  passCounter,
  payDon,
  pickCards,
  SB,
  T,
  takeDon,
  theirs,
  trash,
  yes,
  act,
  eventCounterTargets,
} from './kit-stb5b.ts';

const KAT = T.katakuri;
const TAM = T.tamago;
const SLOW = 'OP07-076'; // Slow-Slow Beam Sword: Event, cost 2, [Counter] DON!! -1: Leader or Character +2000 this battle

function own(leader: string, p1: Partial<PlayerSpec> = {}) {
  return mine(
    leader,
    {
      characters: [KAT, TAM],
      deck: fill(BLUE, 15),
      costArea: { active: 5, rested: 0 },
      ...p1,
    },
    { characters: [SB.c1p2] },
  );
}

/** Tamago attacks and pays DON!! -1; its K.O. is declined; stops at the next decision. */
function returnDon(g: ReturnType<typeof own>) {
  attack(g, g.find('p1', 'characters', TAM), g.leader('p2'));
  yes(g);
  payDon(g, 1);
  none(g);
}

describe('ST34-001 Katakuri: [Your Turn] [Once Per Turn] DON!! returned: add up to 2 rested DON!!; [On K.O.] play a Character of 8000 power or less', () => {
  it('BMP Leader: when Tamago returns 1 DON!!, up to 2 DON!! are added rested', () => {
    const g = own(LDB.bmp);
    returnDon(g);
    expect(asksDonCount(g)).toBe(true);
    expect(donCountOptions(g)).toEqual(['2', '1', '0']);
    takeDon(g, 2);
    expect(don(g)).toMatchObject({ deck: 4, active: 4, rested: 2 });
    expect(kind(g)).toBe('block');
  });

  it('"up to 2": 1 is allowed', () => {
    const g = own(LDB.bmp);
    returnDon(g);
    takeDon(g, 1);
    expect(don(g)).toMatchObject({ deck: 5, active: 4, rested: 1 });
  });

  it('"up to 2": 0 is allowed', () => {
    const g = own(LDB.bmp);
    returnDon(g);
    takeDon(g, 0);
    expect(don(g)).toMatchObject({ deck: 6, active: 4, rested: 0 });
  });

  it('CR 8-3-3: a Leader without the {Big Mom Pirates} type: nothing is added', () => {
    const g = own(LDB.strike);
    returnDon(g);
    expect(asksDonCount(g)).toBe(false);
    expect(kind(g)).toBe('block');
    expect(don(g)).toMatchObject({ deck: 6, active: 4, rested: 0 });
  });

  it('control: without Katakuri on the field the return adds nothing', () => {
    const g = own(LDB.bmp, { characters: [TAM] });
    returnDon(g);
    expect(asksDonCount(g)).toBe(false);
    expect(don(g)).toMatchObject({ deck: 6, active: 4, rested: 0 });
  });

  it('[Once Per Turn]: a second DON!! return in the same turn adds nothing', () => {
    const g = own(LDB.bmp, { characters: [KAT, TAM, TAM] });
    returnDon(g);
    takeDon(g, 1);
    noDefence(g);
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ deck: 5, active: 4, rested: 1 });
    // The second Tamago returns a second DON!! in the same turn: nothing is added this time.
    attack(g, g.find('p1', 'characters', TAM, 1), g.leader('p2'));
    yes(g);
    payDon(g, 1);
    none(g);
    expect(asksDonCount(g)).toBe(false);
    expect(kind(g)).toBe('block');
    expect(don(g)).toMatchObject({ deck: 6, active: 3, rested: 1 });
  });

  it('[Once Per Turn] renews: on the next own turn a new return adds DON!! again', () => {
    const g = own(LDB.bmp, { characters: [KAT, TAM] });
    returnDon(g);
    takeDon(g, 1);
    noDefence(g);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    returnDon(g);
    expect(asksDonCount(g)).toBe(true);
  });

  it('[Your Turn]: a DON!! returned on the opponent turn (a [Counter] DON!! -1) adds nothing', () => {
    const g = theirs(
      LDB.bmp,
      { characters: [KAT], hand: [SLOW], costArea: { active: 5, rested: 0 } },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    expect(eventCounterTargets(g, g.find('p1', 'hand', SLOW)).length).toBeGreaterThan(0);
    activateCounter(g, g.find('p1', 'hand', SLOW));
    // Pay DON!! -1 and answer the target of the +2000; no DON!! count question may appear.
    for (let i = 0; i < 6 && decision(g)?.player === 'p1' && kind(g) !== 'counter'; i++) {
      const d = decision(g);
      if (d?.kind === 'optional') act(g, { type: 'optional', accept: true });
      else if (d?.kind === 'choose' && d.purpose === 'mode') break;
      else if (d?.kind === 'choose')
        act(
          g,
          g.legal().find((a) => a.type === 'pick')!,
        );
      else break;
    }
    expect(asksDonCount(g)).toBe(false);
    expect(don(g).deck).toBe(6);
  });

  it('[On K.O.]: K.O.ed in battle, play a Character of 8000 power or less from hand', () => {
    const g = theirs(
      LDB.strike,
      {
        characters: [{ card: KAT, rested: true }],
        hand: [SB.c6p8, SB.c7p9, 'OP09-077'],
      },
      { characters: [SB.c5p7] },
    );
    attack(g, g.find('p2', 'characters', SB.c5p7), g.find('p1', 'characters', KAT));
    passBlock(g);
    passCounter(g);
    need(g, 'choose', 'p1');
    // 8000 qualifies, 9000 does not, an Event is not a Character card.
    expect(offeredIds(g)).toEqual([SB.c6p8]);
    pickCards(g, [SB.c6p8]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([SB.c6p8]);
    expect(trash(g, 'p1')).toEqual([KAT]);
  });

  it('[On K.O.] "up to 1": the player may play nothing', () => {
    const g = theirs(
      LDB.strike,
      {
        characters: [{ card: KAT, rested: true }],
        hand: [SB.c6p8],
      },
      { characters: [SB.c5p7] },
    );
    attack(g, g.find('p2', 'characters', SB.c5p7), g.find('p1', 'characters', KAT));
    passBlock(g);
    passCounter(g);
    none(g);
    expect(hand(g)).toEqual([SB.c6p8]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('[On K.O.] has no Leader condition and finds nothing when only a 9000 card is in hand', () => {
    const g = theirs(
      LDB.strike,
      {
        characters: [{ card: KAT, rested: true }],
        hand: [SB.c7p9],
      },
      { characters: [SB.c5p7] },
    );
    attack(g, g.find('p2', 'characters', SB.c5p7), g.find('p1', 'characters', KAT));
    passBlock(g);
    passCounter(g);
    expect(choices(g)).toEqual([]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });
});
