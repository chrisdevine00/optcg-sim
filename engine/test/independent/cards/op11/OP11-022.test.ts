/**
 * OP11-022 Shirahoshi (Leader, Green/Yellow, 5000, 5 Life, {Merfolk}/{Fish-Man Island}).
 *
 * Card text: "This Leader cannot attack. [Activate: Main] [Once Per Turn] You may rest 1 of your DON!!
 * cards and turn 1 card from the top of your Life cards face-up: Play up to 1 "Neptunian" type
 * Character card or "Megalo" with a cost equal to or less than the number of DON!! cards on your
 * field from your hand."
 *
 * Rules: the costs are paid first (CR 8-3-1): an ACTIVE DON!! is rested and the top Life card is
 * turned face-up (it stays in Life). The number of DON!! on the field counts the cost area (active
 * and rested) and given DON!!. The card is played from the HAND, active. "Up to 1" may be none.
 * [Once Per Turn] is once per turn (CR 8-1-3-2).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  BLUE,
  canHit,
  decision,
  donOf,
  fill,
  hand,
  ids,
  kind,
  L11,
  mine,
  N11,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  chr,
  canAttackAnything,
} from './kit-op11a.ts';
import { choices } from '../kit.ts';

const SHIRA = L11.shirahoshi;
/** EB04-018 Megalo: Yellow, cost 4, 4000, {Animal}/{Fish-Man Island}; also named "Megalo". */
const MEGALO4 = 'EB04-018';

function board(
  active: number,
  rested = 0,
  handCards: string[] = [N11.nept6, N11.megalo, N11.fish3],
) {
  return mine(SHIRA, {
    hand: handCards,
    costArea: { active, rested },
    life: fill(BLUE, 4),
    deck: fill(BLUE, 10),
  });
}

/** Activate and pay the costs (accept a "you may", pay with an active DON!!), stopping at the first non-cost prompt. */
function activate(g: ReturnType<typeof board>) {
  act(g, {
    type: 'activate',
    card: g.leader('p1'),
    ability: offeredAbilities(g, g.leader('p1'))[0]!,
  });
  for (let i = 0; i < 8; i++) {
    const d = decision(g);
    if (d?.kind === 'optional' && g.legal().some((a) => a.type === 'optional' && a.accept)) {
      act(g, { type: 'optional', accept: true });
    } else if (d?.kind === 'choose' && d.purpose === 'cost') {
      const p = g.legal().find((a) => a.type === 'pick');
      if (!p) break;
      g.act(p);
    } else break;
  }
}

describe('OP11-022 Shirahoshi: cannot attack', () => {
  it('printed values: 5000 power, 5 Life', () => {
    const g = board(5);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the Leader has no legal attack, even with an opposing Character rested', () => {
    const g = mine(
      SHIRA,
      { costArea: { active: 5, rested: 0 } },
      { characters: [{ card: N11.marco, rested: true }] },
    );
    expect(canAttackAnything(g, g.leader('p1'))).toBe(false);
    expect(canHit(g, g.leader('p1'), g.leader('p2'))).toBe(false);
  });
});

describe('OP11-022 Shirahoshi: [Activate: Main] [Once Per Turn] rest DON!!, turn Life face-up: play Neptunian or Megalo', () => {
  it('pays the costs and plays the chosen Neptunian Character from hand, active', () => {
    const g = board(6);
    activate(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'hand', N11.nept6)]);
    expect(ids(g, 'p1', 'characters')).toEqual([N11.nept6]);
    expect(g.card(chr(g, 'p1', N11.nept6)).rested).toBe(false);
    expect(hand(g)).not.toContain(N11.nept6);
  });

  it('rests 1 DON!! and turns the top Life card face-up (Life stays at 4)', () => {
    const g = board(6);
    activate(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'hand', N11.megalo)]);
    const don = donOf(g, 'p1');
    expect(don.rested).toBe(1);
    expect(don.active).toBe(5);
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.zone('p1', 'life')[1]!.faceUp).toBe(false);
  });

  it('cost limit is the DON!! on the field: 6 DON!! plays a cost-6 Neptunian, 5 DON!! does not (boundary)', () => {
    const a = board(6);
    activate(a);
    need(a, 'choose', 'p1');
    expect(offeredIds(a)).toEqual([N11.megalo, N11.nept6].sort());
    const b = board(5);
    activate(b);
    need(b, 'choose', 'p1');
    expect(offeredIds(b)).toEqual([N11.megalo]);
  });

  it('the rested DON!! still counts toward the limit (4 active + 2 rested = 6)', () => {
    const g = board(4, 2);
    activate(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(N11.nept6);
  });

  it('DON!! given to my Characters count as DON!! on the field (3 in the cost area + 3 given = 6)', () => {
    const g = mine(SHIRA, {
      hand: [N11.nept6, N11.megalo],
      characters: [{ card: N11.navy3, don: 3 }],
      costArea: { active: 3, rested: 0 },
      life: fill(BLUE, 4),
      deck: fill(BLUE, 10),
    });
    activate(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(N11.nept6);
  });

  it('offers "Megalo" by name (including another card named Megalo) but not other Characters', () => {
    const g = board(6, 0, [N11.megalo, MEGALO4, N11.fish3, N11.merfolk3]);
    activate(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([MEGALO4, N11.megalo].sort());
  });

  it('only from the hand: a Neptunian in the trash or deck is not offered', () => {
    const g = mine(SHIRA, {
      hand: [N11.fish3],
      trash: [N11.nept6],
      deck: [N11.nept6b, ...fill(BLUE, 9)],
      life: fill(BLUE, 4),
      costArea: { active: 6, rested: 0 },
    });
    activate(g);
    if (kind(g) === 'choose') expect(choices(g)).toEqual([]);
    if (kind(g) === 'choose') none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('"up to 1": the costs are paid and no Character need be played', () => {
    const g = board(6);
    activate(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(donOf(g, 'p1').rested).toBe(1);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
  });

  it('[Once Per Turn]: not offered again this turn', () => {
    const g = board(8);
    activate(g);
    pickInst(g, [at(g, 'p1', 'hand', N11.megalo)]);
    need(g, 'main', 'p1');
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
  });

  it('cannot be activated with no active DON!! to rest', () => {
    const g = board(0, 6);
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
  });

  it('cannot be activated with no Life card to turn face-up', () => {
    const g = mine(SHIRA, { hand: [N11.megalo], life: [], costArea: { active: 6, rested: 0 } });
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
  });
});
