/**
 * OP14-033 Perona (Character, cost 5, 6000, Counter +1000, {Thriller Bark Pirates}/{Muggy Kingdom}).
 *
 * Card text: "[On Play] Up to 2 of your opponent's Characters with a cost of 5 or less cannot be rested
 * until the end of your opponent's next End Phase.
 * [On K.O.] You may rest 1 of your cards: Play up to 1 green Character card with a cost of 5 or less
 * from your hand."
 *
 * Rules: a card that "cannot be rested" cannot attack, cannot be rested by any effect (rules-digest
 * 57, QA-GR). "Until the end of your opponent's next End Phase" covers the opponent's whole next
 * turn (RL-11). "Up to 2" may be 0, 1 or 2 targets. The On K.O. cost is optional ("you may"); if it
 * is not paid the effect does not happen (CR 8-3-1). A played card is placed active, its cost not
 * paid. Only green Character cards qualify.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  attackers,
  blockers,
  swing,
  chars,
  chr,
  endTurn,
  hand,
  kind,
  LD14,
  mine,
  need,
  no,
  none,
  offeredIds,
  passBlock,
  passCounter,
  payDonStrict,
  payRest,
  pickInst,
  playRaw,
  reachablePickSets,
  S14,
  settleEmpty,
  skipEmpty,
  theirs,
  unusable,
  yes,
} from './kit-op14a.ts';

const PERONA = 'OP14-033';
const REST_EVENT = 'OP17-038';

function playPerona(p2chars: string[], hand: string[] = []) {
  const g = mine(LD14.luffy, { hand: [PERONA, ...hand] }, { characters: p2chars });
  playRaw(g, PERONA);
  return g;
}

describe('OP14-033 Perona: [On Play] up to 2 opposing Characters with cost 5 or less cannot be rested', () => {
  it('printed values: cost 5, 6000, Counter +1000', () => {
    const g = mine(LD14.luffy, { hand: [PERONA] });
    const c = g.card(g.find('p1', 'hand', PERONA));
    expect(c.cost).toBe(5);
    expect(c.power).toBe(6000);
    expect(c.counter).toBe(1000);
  });

  it('offers exactly the opposing Characters with cost 5 or less (not cost 6)', () => {
    const g = playPerona([S14.marco, S14.kingdew, S14.thatch]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S14.kingdew, S14.marco].sort());
  });

  it('chooses up to 2: never 3 even with 3 candidates, and 0 or 1 are allowed', () => {
    const sets = reachablePickSets(playPerona([S14.marco, S14.kingdew, S14.sai]));
    expect(sets.has('')).toBe(true);
    expect([...sets].some((s) => s.split('+').filter(Boolean).length === 2)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
  });

  it('the two chosen Characters cannot attack on the opponent turn; the unchosen one can', () => {
    const g = playPerona([S14.marco, S14.kingdew, S14.sai]);
    pickInst(g, [chr(g, 'p2', S14.marco), chr(g, 'p2', S14.kingdew)]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(attackers(g)).toContain(chr(g, 'p2', S14.sai));
    expect(attackers(g)).not.toContain(chr(g, 'p2', S14.marco));
    expect(attackers(g)).not.toContain(chr(g, 'p2', S14.kingdew));
  });

  it('they cannot be rested by my own effect this turn either (OP17-038), an unchosen one can', () => {
    const g = mine(
      LD14.luffy,
      { hand: [PERONA, REST_EVENT], costArea: { active: 10, rested: 0 } },
      { characters: [S14.marco, S14.sai] },
    );
    playRaw(g, PERONA);
    pickInst(g, [chr(g, 'p2', S14.marco)]);
    playRaw(g, REST_EVENT);
    yes(g, 'p1');
    payDonStrict(g, 4);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', S14.sai)]);
    expect(g.card(chr(g, 'p2', S14.sai)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', S14.marco)).rested).toBe(false);
  });

  it("the lock ends with the opponent's End Phase: they can attack on their following turn", () => {
    const g = playPerona([S14.marco]);
    pickInst(g, [chr(g, 'p2', S14.marco)]);
    endTurn(g);
    need(g, 'main', 'p2');
    endTurn(g);
    need(g, 'main', 'p1');
    endTurn(g);
    need(g, 'main', 'p2');
    expect(attackers(g)).toContain(chr(g, 'p2', S14.marco));
  });

  it('a locked [Blocker] cannot rest to block: during my attack this turn it is not a legal blocker (control: unlocked it is)', () => {
    const locked = mine(
      LD14.luffy,
      { hand: [PERONA], characters: [S14.marco] },
      { characters: [S14.killer2] },
    );
    playRaw(locked, PERONA);
    pickInst(locked, [chr(locked, 'p2', S14.killer2)]);
    swing(locked, S14.marco);
    need(locked, 'block', 'p2');
    expect(blockers(locked)).toEqual([]);

    const free = mine(
      LD14.luffy,
      { hand: [PERONA], characters: [S14.marco] },
      { characters: [S14.killer2] },
    );
    playRaw(free, PERONA);
    none(free);
    swing(free, S14.marco);
    need(free, 'block', 'p2');
    expect(blockers(free)).toEqual([chr(free, 'p2', S14.killer2)]);
  });

  it('"up to 2": choosing nothing locks nobody', () => {
    const g = playPerona([S14.marco]);
    need(g, 'choose', 'p1');
    none(g);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(attackers(g)).toContain(chr(g, 'p2', S14.marco));
  });

  it('a Character with cost 6 is not locked (it is not even offered) and can attack', () => {
    const g = playPerona([S14.thatch]);
    settleEmpty(g);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(attackers(g)).toContain(chr(g, 'p2', S14.thatch));
  });
});

/** p2 K.O.s the rested Perona in battle; p1 holds `hand`; `rest` = whether p1 has cards left to rest. */
function koPerona(hand: string[], active = 2) {
  const g = theirs(
    LD14.luffy,
    { hand, costArea: { active, rested: 0 }, characters: [{ card: PERONA, rested: true }] },
    { characters: [S14.thatch] },
  );
  attack(g, at(g, 'p2', 'characters', S14.thatch), at(g, 'p1', 'characters', PERONA));
  passBlock(g);
  passCounter(g);
  return g;
}

const GREEN = [S14.alvida, S14.usoppG3, S14.tashigiG5];

describe('OP14-033 Perona: [On K.O.] may rest 1 of my cards: play a green Character with cost 5 or less', () => {
  it('after accepting and resting a card, offers exactly the green Characters with cost 5 or less', () => {
    const g = koPerona([...GREEN, S14.kuro6, S14.marco, S14.mohji]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payRest(g, [], 1);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([...GREEN].sort());
  });

  it('plays the chosen Character for free, active; one DON!! was rested', () => {
    const g = koPerona(GREEN);
    yes(g, 'p1');
    payRest(g, [], 1);
    pickInst(g, [g.find('p1', 'hand', S14.tashigiG5)]);
    expect(chars(g)).toEqual([S14.tashigiG5]);
    expect(g.card(at(g, 'p1', 'characters', S14.tashigiG5)).rested).toBe(false);
    expect(hand(g)).toEqual([S14.alvida, S14.usoppG3].sort());
  });

  it('boundary: cost 5 qualifies, cost 6 (a green Kuro) does not', () => {
    const g = koPerona([S14.tashigiG5, S14.kuro6]);
    yes(g, 'p1');
    payRest(g, [], 1);
    expect(offeredIds(g)).toEqual([S14.tashigiG5]);
  });

  it('"you may": declining rests nothing and plays nothing', () => {
    const g = koPerona(GREEN);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([...GREEN].sort());
  });

  it('"up to 1": after paying, may play nothing', () => {
    const g = koPerona(GREEN);
    yes(g, 'p1');
    payRest(g, [], 1);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([]);
  });

  it('plays only one when several qualify', () => {
    const g = koPerona(GREEN);
    yes(g, 'p1');
    payRest(g, [], 1);
    pickInst(g, [g.find('p1', 'hand', S14.alvida)]);
    expect(chars(g)).toEqual([S14.alvida]);
    expect(hand(g)).toHaveLength(2);
  });

  it('no leak: with no green Character in hand the cost is still asked, and the empty "up to 1" pick is still asked', () => {
    const g = koPerona([S14.marco, S14.kuro6, S14.mohji]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payDonStrict(g, 1);
    skipEmpty(g);
    expect(chars(g)).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('unpayable: with nothing left to rest the effect cannot be used and nothing is played', () => {
    const g = theirs(
      { card: LD14.luffy, rested: true } as unknown as string,
      {
        hand: GREEN,
        costArea: { active: 0, rested: 2 },
        characters: [{ card: PERONA, rested: true }],
      },
      { characters: [S14.thatch] },
    );
    attack(g, at(g, 'p2', 'characters', S14.thatch), at(g, 'p1', 'characters', PERONA));
    passBlock(g);
    passCounter(g);
    unusable(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(kind(g)).toBe('main');
  });
});
