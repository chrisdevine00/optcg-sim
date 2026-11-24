/**
 * OP14-079 Crocodile (Leader, Black, 5000, 5 Life, {Baroque Works}/{The Seven Warlords of the Sea}).
 *
 * Card text: "All of your opponent's Characters cannot be removed from the field by your effects.
 * [Activate: Main] [Once Per Turn] You may K.O. 1 of your Characters with a type including "Baroque
 * Works": Give up to 1 of your opponent's Characters −10 cost during this turn. Then, you may trash 2
 * cards from the top of your deck."
 *
 * Rules: CR 8-3-1 (a cost is paid before the effect; an unpayable cost cannot be paid), RL-14 / RL-16
 * ("cannot be K.O.'d / removed by effects" covers effects, not battle; a K.O. cost is a K.O. and fires
 * [On K.O.]), a cost is floored at 0 outside a calculation (CR 1-3-6-2), CR 10-2-13 ([Once Per Turn]).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  backToMain,
  chars,
  chr,
  decision,
  deck,
  endTurn,
  hand,
  kind,
  LIGHTNING,
  mine,
  need,
  no,
  offeredAbilities,
  offeredIds,
  passBlock,
  payDon,
  pickInst,
  playRaw,
  SC14,
  theirs,
  trash,
  yes,
  none,
  asksCount,
  CAMIE,
} from './kit-op14c.ts';

const ID = 'OP14-079';
const WEDNESDAY = 'OP14-083'; // Black, cost 1, 1000, {Baroque Works}
const GOLDENWEEK = 'OP14-085'; // Black, cost 1, 2000, {Baroque Works}; [On K.O.] draw 2, trash 2
const FORMER_BW = 'OP02-053'; // Blue, cost 5, 7000, {Impel Down}/{Former Baroque Works}
const MR9 = SC14.bw5; // Black, cost 5, 6000, {Baroque Works}

type G = ReturnType<typeof mine>;

function start(
  o: {
    chars?: string[];
    p2chars?: string[];
    hand?: string[];
    deck?: string[];
    active?: number;
  } = {},
): G {
  return mine(
    ID,
    {
      characters: o.chars ?? [MR9, SC14.c3],
      hand: o.hand ?? [],
      ...(o.deck ? { deck: o.deck } : {}),
      costArea: { active: o.active ?? 3, rested: 0 },
    },
    { characters: o.p2chars ?? [SC14.c4] },
  );
}

/** Activate the Leader and pay the K.O. cost with `cost`; stops at the target choice. */
function activate(g: G, cost: string): void {
  const [ability] = offeredAbilities(g, g.leader('p1'));
  if (!ability) throw new Error('Leader ability not offered');
  act(g, { type: 'activate', card: g.leader('p1'), ability });
  // With exactly one candidate the engine pays the cost on its own (forced pick).
  if (kind(g) === 'choose' && decision(g)?.purpose === 'cost') {
    pickInst(g, [at(g, 'p1', 'characters', cost)]);
  }
}

describe('OP14-079 Crocodile [Activate: Main] K.O. a Baroque Works Character: −10 cost, then may trash 2', () => {
  it('the K.O. cost offers only Characters with a type including "Baroque Works" (not other Characters)', () => {
    const g = start({ chars: [MR9, FORMER_BW, SC14.c3, WEDNESDAY] });
    const [ability] = offeredAbilities(g, g.leader('p1'));
    act(g, { type: 'activate', card: g.leader('p1'), ability: ability! });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([MR9, FORMER_BW, WEDNESDAY].sort());
  });

  it('paying it K.O.s my Character, then −10 cost goes on the chosen opposing Character (shown as 0)', () => {
    const g = start();
    activate(g, MR9);
    expect(trash(g)).toEqual([MR9]);
    need(g, 'choose', 'p1');
    expect(g.card(chr(g, 'p2', SC14.c4)).cost).toBe(4);
    pickInst(g, [chr(g, 'p2', SC14.c4)]);
    expect(g.card(chr(g, 'p2', SC14.c4)).cost ?? 0).toBeLessThanOrEqual(0);
    expect(chars(g, 'p2')).toEqual([SC14.c4]);
  });

  it('the cost reduction lasts this turn only: the printed cost is back on their turn', () => {
    const g = start();
    activate(g, MR9);
    pickInst(g, [chr(g, 'p2', SC14.c4)]);
    if (kind(g) === 'optional') no(g, 'p1');
    expect(g.card(chr(g, 'p2', SC14.c4)).cost ?? 0).toBeLessThanOrEqual(0);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(chr(g, 'p2', SC14.c4)).cost).toBe(4);
  });

  it('then "you may trash 2 cards from the top of your deck": yes trashes exactly 2, no trashes none', () => {
    const top = [SC14.c1, SC14.c2, SC14.c3, SC14.c4];
    const yesG = start({ deck: [...top, ...Array.from({ length: 8 }, () => SC14.c1)] });
    activate(yesG, MR9);
    pickInst(yesG, [chr(yesG, 'p2', SC14.c4)]);
    need(yesG, 'optional', 'p1');
    yes(yesG, 'p1');
    backToMain(yesG, 'p1');
    expect(trash(yesG)).toEqual([MR9, SC14.c1, SC14.c2].sort());
    expect(deck(yesG)).toHaveLength(10);
    expect(deck(yesG)[0]).toBe(SC14.c3);

    const noG = start({ deck: [...top, ...Array.from({ length: 8 }, () => SC14.c1)] });
    activate(noG, MR9);
    pickInst(noG, [chr(noG, 'p2', SC14.c4)]);
    need(noG, 'optional', 'p1');
    no(noG, 'p1');
    backToMain(noG, 'p1');
    expect(trash(noG)).toEqual([MR9]);
    expect(deck(noG)).toHaveLength(12);
  });

  it('"up to 1": the target may be skipped, the cost stays paid', () => {
    const g = start();
    activate(g, MR9);
    none(g);
    if (kind(g) === 'optional') no(g, 'p1');
    expect(trash(g)).toEqual([MR9]);
    expect(g.card(chr(g, 'p2', SC14.c4)).cost).toBe(4);
  });

  it('the K.O. cost is a real K.O.: [On K.O.] fires (Miss.Goldenweek draws 2 and trashes 2)', () => {
    const g = start({ chars: [GOLDENWEEK], hand: [SC14.c1, SC14.c2] });
    activate(g, GOLDENWEEK);
    // Goldenweek's [On K.O.] is queued; settle everything by drawing and trashing.
    for (let i = 0; i < 12 && kind(g) !== 'main'; i++) {
      const d =
        g.legal().find((a) => a.type === 'pick') ?? g.legal().find((a) => a.type === 'done');
      const o = g.legal().find((a) => a.type === 'optional' && !a.accept);
      if (kind(g) === 'optional' && o) g.act(o);
      else if (d) g.act(d);
      else break;
    }
    expect(trash(g)).toContain(GOLDENWEEK);
    expect(g.zone('p1', 'trash').length).toBe(3);
    expect(hand(g)).toHaveLength(2);
  });

  it('[Once Per Turn]: a second activation in the same turn is not offered; it is back next turn', () => {
    const g = start({ chars: [MR9, WEDNESDAY, SC14.c3] });
    activate(g, MR9);
    pickInst(g, [chr(g, 'p2', SC14.c4)]);
    if (kind(g) === 'optional') no(g, 'p1');
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
    endTurn(g);
    need(g, 'main', 'p2');
    endTurn(g);
    need(g, 'main', 'p1');
    expect(offeredAbilities(g, g.leader('p1'))).toHaveLength(1);
  });

  it('without a Baroque Works Character the cost cannot be paid: nothing can be activated', () => {
    const g = start({ chars: [SC14.c3, SC14.c4] });
    const offered = offeredAbilities(g, g.leader('p1'));
    if (offered.length) {
      act(g, { type: 'activate', card: g.leader('p1'), ability: offered[0]! });
      // A cost pick with no candidates cannot be completed.
      expect(offeredIds(g)).toEqual([]);
    }
    expect(chars(g, 'p2')).toEqual([SC14.c4]);
  });
});

describe('OP14-079 Crocodile: the opponent’s Characters cannot be removed from the field by my effects', () => {
  it('my Gum-Gum Lightning (K.O. 6000 or less) cannot K.O. their Character', () => {
    const g = mine(
      ID,
      { hand: [LIGHTNING], characters: [], costArea: { active: 5, rested: 0 } },
      { characters: [SC14.c4] },
    );
    playRaw(g, LIGHTNING);
    yes(g, 'p1');
    payDon(g, 2, 'costRested');
    if (kind(g) === 'choose') {
      const pick = g.legal().find((a) => a.type === 'pick');
      if (pick) g.act(pick);
      else none(g);
    }
    expect(chars(g, 'p2')).toEqual([SC14.c4]);
    expect(asksCount(g)).toBe(false);
  });

  it('it covers every removal, not only K.O.: my Rocks Pirates (return to hand) cannot move their Character', () => {
    // OP17-056: [Main] rest 5 of your DON!!: return up to 1 Character with a cost of 6 or less to hand.
    const g = mine(
      ID,
      { hand: ['OP17-056'], characters: [], costArea: { active: 8, rested: 0 } },
      { characters: [SC14.c4] },
    );
    playRaw(g, 'OP17-056');
    for (let i = 0; i < 8 && kind(g) !== 'main'; i++) {
      const o = g.legal().find((a) => a.type === 'optional' && a.accept);
      const pay = g
        .legal()
        .find((a) => a.type === 'pick' && typeof a.choice === 'object' && 'from' in a.choice);
      const pick = g.legal().find((a) => a.type === 'pick');
      if (o) g.act(o);
      else if (pay) g.act(pay);
      else if (pick) g.act(pick);
      else if (g.legal().some((a) => a.type === 'done')) act(g, { type: 'done' });
      else break;
    }
    expect(chars(g, 'p2')).toEqual([SC14.c4]);
    expect(hand(g, 'p2')).not.toContain(SC14.c4);
  });

  it('resting is not removal: my own Camie can still rest their Character', () => {
    const g = mine(
      ID,
      { hand: [CAMIE], costArea: { active: 3, rested: 0 } },
      { characters: [SC14.c4] },
    );
    playRaw(g, CAMIE);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', SC14.c4)]);
    expect(g.card(chr(g, 'p2', SC14.c4)).rested).toBe(true);
  });

  it('it is not an effect-only shield: my battle K.O. of their rested Character still works', () => {
    const g = mine(
      ID,
      { costArea: { active: 3, rested: 0 } },
      { characters: [{ card: SC14.c1, rested: true }] },
    );
    attack(g, g.leader('p1'), at(g, 'p2', 'characters', SC14.c1));
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(chars(g, 'p2')).toEqual([]);
  });

  it('it does not protect MY Characters from their effects', () => {
    const g = theirs(
      ID,
      { characters: [SC14.c4], costArea: { active: 3, rested: 0 } },
      { hand: [LIGHTNING], costArea: { active: 9, rested: 0 } },
    );
    act(g, { type: 'playCard', card: at(g, 'p2', 'hand', LIGHTNING) });
    for (let i = 0; i < 6 && kind(g) !== 'main'; i++) {
      const o = g.legal().find((a) => a.type === 'optional' && a.accept);
      const p = g
        .legal()
        .find(
          (a) =>
            a.type === 'pick' &&
            (a.choice === at(g, 'p1', 'characters', SC14.c4) ||
              (typeof a.choice === 'object' &&
                'from' in a.choice &&
                a.choice.from === 'costRested')),
        );
      const q = g.legal().find((a) => a.type === 'pick');
      if (o) g.act(o);
      else if (p) g.act(p);
      else if (q) g.act(q);
      else break;
    }
    expect(trash(g)).toEqual([SC14.c4]);
  });
});
