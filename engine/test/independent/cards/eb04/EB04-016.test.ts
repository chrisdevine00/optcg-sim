/**
 * EB04-016 Bird Neptunian (Character, Green, cost 5, 7000, no Counter, {Neptunian}).
 *
 * Card text: "[Activate: Main] Set up to 1 of your DON!! cards as active. Then, you cannot set DON!!
 * cards as active using Character effects during this turn.
 * [When Attacking] If you have 3 or more {Neptunian} type Characters, rest up to 1 of your
 * opponent's Characters with a cost of 8 or less."
 *
 * Rules: "set up to N DON!! as active" asks a count (most first, "None" last); the lock applies to
 * Character effects only (a Leader effect may still set DON!! active) and ends with the turn;
 * [When Attacking] needs the attack declared; the Character itself counts for the "3 or more";
 * "up to 1" (CR 8-4-4-1); cost is the current cost.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  decision,
  don,
  endTurn,
  kind,
  LE,
  mayChooseNone,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  passBlock,
  passCounter,
  pickInst,
  playRaw,
  SN,
  useAbility,
} from './kit-eb04a.ts';

const BIRD = 'EB04-016';

/** Answer the pending "how many DON!! (up to 1)" count with `n`. */
function count(g: ReturnType<typeof mine>, n: 0 | 1) {
  const d = need(g, 'choose');
  expect(d.purpose).toBe('mode');
  act(g, { type: 'pick', choice: { option: String(n) } });
}

function activateBird(g: ReturnType<typeof mine>, nth = 0, n: 0 | 1 = 1) {
  useAbility(g, at(g, 'p1', 'characters', BIRD, nth));
  count(g, n);
}

describe('EB04-016 Bird Neptunian: [Activate: Main] set up to 1 DON!! active, then no Character effect may set DON!! active', () => {
  it('printed values: cost 5, 7000', () => {
    const g = mine(LE.luffy, { characters: [BIRD] }, {});
    const c = g.card(at(g, 'p1', 'characters', BIRD));
    expect(c.cost).toBe(5);
    expect(c.power).toBe(7000);
  });

  it('sets 1 rested DON!! as active', () => {
    const g = mine(LE.luffy, { characters: [BIRD], costArea: { active: 5, rested: 3 } }, {});
    activateBird(g);
    expect(kind(g)).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 6, rested: 2 });
  });

  it('"up to 1": answering None sets nothing', () => {
    const g = mine(LE.luffy, { characters: [BIRD], costArea: { active: 5, rested: 3 } }, {});
    useAbility(g, at(g, 'p1', 'characters', BIRD));
    expect(
      decision(g)!
        .options!.map((o) => o.id)
        .sort(),
    ).toEqual(['0', '1']);
    count(g, 0);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 3 });
  });

  it('the lock: a second Bird Neptunian cannot set a DON!! as active this turn', () => {
    const g = mine(LE.luffy, { characters: [BIRD, BIRD], costArea: { active: 5, rested: 3 } }, {});
    activateBird(g, 0);
    expect(don(g, 'p1')).toMatchObject({ active: 6, rested: 2 });
    if (offeredAbilities(g, at(g, 'p1', 'characters', BIRD, 1)).length) {
      useAbility(g, at(g, 'p1', 'characters', BIRD, 1));
      if (kind(g) === 'choose') count(g, 1);
    }
    expect(don(g, 'p1')).toMatchObject({ active: 6, rested: 2 });
  });

  it('the lock is for Character effects only: an Event (OP13-038 Gum-Gum Elephant Gun, "set up to 2 DON!! as active at the end of this turn") still sets DON!! active', () => {
    const g = mine(
      LE.luffy,
      { characters: [BIRD], hand: ['OP13-038'], costArea: { active: 5, rested: 3 } },
      { characters: [SN.c3] },
    );
    activateBird(g);
    expect(don(g, 'p1')).toMatchObject({ active: 6, rested: 2 });
    playRaw(g, 'OP13-038');
    // [Main] rest up to 1 opposing Character with cost 5 or less: not the point here.
    if (kind(g) === 'choose') none(g);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 4 });
    endTurn(g);
    let guard = 0;
    while (decision(g)?.player === 'p1' && kind(g) !== 'main' && guard++ < 4) {
      const d = decision(g)!;
      if (d.purpose === 'mode') {
        act(g, { type: 'pick', choice: { option: d.options![0]!.id } });
      } else {
        act(g, { type: 'optional', accept: true });
      }
    }
    expect(don(g, 'p1')).toMatchObject({ active: 6, rested: 2 });
  });

  it('the lock ends with the turn: next turn it can set a DON!! as active again', () => {
    const g = mine(
      LE.luffy,
      { characters: [BIRD], hand: [SN.c2], costArea: { active: 5, rested: 3 } },
      {},
    );
    activateBird(g);
    endTurn(g);
    endTurn(g);
    // Next turn: spend 2 DON!! on a Character so that 2 are rested, then use Bird again.
    playRaw(g, SN.c2);
    expect(don(g, 'p1')).toMatchObject({ rested: 2 });
    const before = don(g, 'p1').active;
    activateBird(g);
    expect(don(g, 'p1')).toMatchObject({ active: before + 1, rested: 1 });
  });
});

describe('EB04-016 Bird Neptunian: [When Attacking] with 3+ {Neptunian} Characters, rest up to 1 opposing Character cost 8 or less', () => {
  const trio = (p2: Parameters<typeof mine>[2] = { characters: [SN.c8, SN.c6, SN.c10] }) =>
    mine(LE.luffy, { characters: [BIRD, SN.nept6, SN.nept8] }, p2);
  const swing = (g: ReturnType<typeof mine>) =>
    attack(g, at(g, 'p1', 'characters', BIRD), g.leader('p2'));

  it('3 {Neptunian} Characters (Bird included): rests the chosen opposing Character; cost 8 is allowed, cost 10 is not offered', () => {
    const g = trio();
    swing(g);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SN.c6, SN.c8].sort());
    const t = at(g, 'p2', 'characters', SN.c8);
    pickInst(g, [t]);
    expect(g.card(t).rested).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', SN.c6)).rested).toBe(false);
    passBlock(g);
    passCounter(g);
  });

  it('"up to 1": may rest nobody', () => {
    const g = trio();
    swing(g);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.card(at(g, 'p2', 'characters', SN.c8)).rested).toBe(false);
  });

  it('boundary: only 2 {Neptunian} Characters: no effect and no prompt', () => {
    const g = mine(
      LE.luffy,
      { characters: [BIRD, SN.nept6, SN.c3] },
      { characters: [SN.c8, SN.c6] },
    );
    swing(g);
    expect(kind(g)).toBe('block');
    expect(g.card(at(g, 'p2', 'characters', SN.c8)).rested).toBe(false);
  });

  it('must not happen: the opponent {Neptunian} Characters do not count toward my 3', () => {
    const g = mine(
      LE.luffy,
      { characters: [BIRD, SN.nept6] },
      { characters: [SN.c8, SN.nept7, SN.nept8] },
    );
    swing(g);
    expect(kind(g)).toBe('block');
    expect(g.card(at(g, 'p2', 'characters', SN.c8)).rested).toBe(false);
  });

  it('a rested {Neptunian} Character still counts toward the 3', () => {
    const g = mine(
      LE.luffy,
      { characters: [BIRD, { card: SN.nept6, rested: true }, SN.nept8] },
      { characters: [SN.c8] },
    );
    swing(g);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SN.c8]);
    none(g);
  });
});
