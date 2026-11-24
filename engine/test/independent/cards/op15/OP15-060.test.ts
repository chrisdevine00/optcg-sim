/**
 * OP15-060 Enel (Character, Purple, cost 6, 8000, {Sky Island}, attribute Special).
 *
 * Card text: "If you have 6 or less DON!! cards on your field, this Character cannot be removed from the
 * field by your opponent's effects and gains +2000 power.
 * [Activate: Main] DON!! -1: This Character gains [Blocker] until the end of your opponent's next End
 * Phase. Then, trash 1 card from your hand."
 *
 * Rules: CR 8-3-3 (condition checked continuously), "DON!! cards on your field" = cost area plus given DON!!
 * (rules-digest 86), RL-16 (a protected Character may still be chosen as a target; the effect then does
 * nothing), RD 109 (battle K.O. is not an effect), CR 8-3-1-6 / 10-2-10-1 (DON!! -X), CR 8-3-1-3 (an
 * unpayable cost), rulings 235-243 (the duration).
 * Scenery: EB01-059 Kingdom Come (cost 6; K.O. up to 1 Character) as the opposing removal.
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, passBlock, passCounter } from '../../helpers.ts';
import {
  at,
  atMain,
  block,
  BLUE,
  canHit,
  choices,
  deck,
  donDeckSize,
  donOnField,
  hand,
  inst,
  kind,
  kws,
  LD15,
  mayChooseNone,
  mine,
  need,
  offeredAbilities,
  payDon,
  pickInst,
  playCard,
  RED,
  SCN,
  side,
  theirTurn,
  toMyNextMain,
  trash,
  useAbility,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ENEL = 'OP15-060';
const KINGDOM_COME = 'EB01-059';
const enel = (g: TestGame) => at(g, 'p1', 'characters', ENEL);

function own(donActive: number, extra: Record<string, unknown> = {}, p2 = {}): TestGame {
  return mine(
    LD15.purple,
    {
      characters: [ENEL],
      costArea: { active: donActive, rested: 0 },
      hand: [BLUE, SCN.c2],
      ...extra,
    },
    p2,
  );
}

/** p2 casts Kingdom Come on Enel; if Enel is offered the pick is made and nothing may happen. */
function koEnel(donActive: number): TestGame {
  const g = theirTurn(
    side(LD15.purple, BLUE, {
      characters: [ENEL, SCN.c3],
      costArea: { active: donActive, rested: 0 },
    }),
    side(LD15.neutral, RED, {
      costArea: { active: 10, rested: 0 },
      hand: [KINGDOM_COME],
      life: Array.from({ length: 4 }, () => SCN.c1),
    }),
  );
  playCard(g, KINGDOM_COME);
  need(g, 'choose', 'p2');
  const target = inst(g, 'p1', 'characters', ENEL);
  if (choices(g).includes(target)) pickInst(g, [target]);
  else if (choices(g).length) pickInst(g, [choices(g)[0]!]);
  return g;
}

describe('OP15-060 Enel: with 6 or less DON!! on my field protected from opposing effects and +2000; [Activate: Main] DON!! -1: [Blocker], then trash 1', () => {
  it('6 DON!! on my field (boundary): 8000 + 2000 = 10000', () => {
    const g = own(6);
    expect(g.power(enel(g))).toBe(10000);
  });

  it('7 DON!! on my field: no bonus, 8000', () => {
    const g = own(7);
    expect(g.power(enel(g))).toBe(8000);
  });

  it('given DON!! count as DON!! on my field: 6 in the cost area + 1 given = 7, so no bonus', () => {
    const g = mine(LD15.purple, {
      characters: [{ card: ENEL, don: 1 }],
      costArea: { active: 6, rested: 0 },
    });
    expect(donOnField(g)).toBe(7);
    expect(g.power(enel(g))).toBe(8000 + 1000);
  });

  it('6 DON!!: an opposing K.O. effect does not remove Enel', () => {
    const g = koEnel(6);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(ENEL);
    expect(g.zone('p1', 'trash').map((c) => c.card)).not.toContain(ENEL);
  });

  it('7 DON!!: the same K.O. effect removes Enel', () => {
    const g = koEnel(7);
    expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(ENEL);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(ENEL);
  });

  it('must not: protection is from effects only, a battle K.O. still removes Enel', () => {
    const g = theirTurn(
      side(LD15.purple, BLUE, {
        characters: [{ card: ENEL, rested: true }],
        costArea: { active: 3, rested: 0 },
      }),
      side(LD15.neutral, RED, { characters: [SCN.c8] }),
    );
    expect(g.power(enel(g))).toBe(10000);
    attack(g, inst(g, 'p2', 'characters', SCN.c8), enel(g));
    passBlock(g);
    passCounter(g);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ENEL]);
  });

  it('[Activate: Main] DON!! -1: gains [Blocker] and one DON!! goes back to the DON!! deck, then 1 card is trashed', () => {
    const g = own(5);
    const donBefore = donOnField(g);
    const deckBefore = donDeckSize(g);
    useAbility(g, enel(g));
    payDon(g, 1);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', SCN.c2)]);
    expect(atMain(g)).toBe(true);
    expect(kws(g, enel(g))).toContain('Blocker');
    expect(donOnField(g)).toBe(donBefore - 1);
    expect(donDeckSize(g)).toBe(deckBefore + 1);
    expect(trash(g)).toEqual([SCN.c2]);
    expect(hand(g)).toEqual([BLUE]);
  });

  it('exactly one card is trashed from hand, even with several', () => {
    const g = own(5, { hand: [BLUE, SCN.c2, SCN.c3] });
    useAbility(g, enel(g));
    payDon(g, 1);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', SCN.c3)]);
    expect(hand(g)).toEqual([BLUE, SCN.c2].sort());
    expect(trash(g)).toEqual([SCN.c3]);
  });

  it('with an empty hand the [Blocker] is still gained and nothing is trashed', () => {
    const g = own(5, { hand: [] });
    useAbility(g, enel(g));
    payDon(g, 1);
    expect(atMain(g)).toBe(true);
    expect(kws(g, enel(g))).toContain('Blocker');
    expect(trash(g)).toEqual([]);
  });

  it('paying DON!! -1 from 7 brings Enel under the limit: protected and 10000 afterwards', () => {
    const g = own(7);
    useAbility(g, enel(g));
    payDon(g, 1);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', SCN.c2)]);
    expect(donOnField(g)).toBe(6);
    expect(g.power(enel(g))).toBe(10000);
  });

  it('CR 8-3-1-3: with no DON!! on my field the ability is not offered', () => {
    const g = mine(LD15.purple, {
      characters: [ENEL],
      costArea: { active: 0, rested: 0 },
      hand: [BLUE],
    });
    expect(offeredAbilities(g, enel(g))).toEqual([]);
  });

  it('the [Blocker] lasts through the opponent’s turn and can block there', () => {
    const g = own(5, {}, { characters: [SCN.c3] });
    useAbility(g, enel(g));
    payDon(g, 1);
    pickInst(g, [inst(g, 'p1', 'hand', SCN.c2)]);
    g.act({ type: 'endTurn' });
    need(g, 'main', 'p2');
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([enel(g)]);
    block(g, enel(g));
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('the [Blocker] is gone after the opponent’s End Phase', () => {
    const g = own(5);
    useAbility(g, enel(g));
    payDon(g, 1);
    pickInst(g, [inst(g, 'p1', 'hand', SCN.c2)]);
    toMyNextMain(g);
    expect(kws(g, enel(g))).not.toContain('Blocker');
  });

  it('"Then, trash 1 card from your hand" is mandatory: the choice cannot be skipped', () => {
    const g = own(5);
    useAbility(g, enel(g));
    payDon(g, 1);
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(false);
    expect(choices(g)).toHaveLength(2);
  });

  it('DON!! -1 may take a DON!! given to my Leader (given DON!! qualify), with an empty cost area', () => {
    const g = mine(
      { card: LD15.purple, don: 2 },
      { characters: [ENEL], costArea: { active: 0, rested: 0 }, hand: [BLUE] },
    );
    expect(donOnField(g)).toBe(2);
    useAbility(g, enel(g));
    payDon(g, 1, 'given', g.leader('p1'));
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', BLUE)]);
    expect(donOnField(g)).toBe(1);
    expect(kws(g, enel(g))).toContain('Blocker');
  });
});

void canHit;
void deck;
void kind;
