/**
 * EB03-045 Perona (Character, Black, cost 4, 6000, no Counter, {Thriller Bark Pirates}/{Muggy Kingdom}).
 *
 * Card text: "[Blocker]
 * [On Play] Give up to 1 rested DON!! card to your Leader or 1 of your Characters. Then, if you
 * have 10 or more cards in your trash, play up to 1 {Thriller Bark Pirates} type Character card
 * with a cost of 2 or less from your trash rested."
 *
 * Rules: CR 4-8-1 ("up to"), CR 6-5 (DON!! given to a card: +1000 power on its owner's turn),
 * CR 4-10-2 (a "Then" clause is still resolved if the clause before it did nothing, unless an
 * "if" failed), "rested" play (CR 3-7-4), CR 2-4-3 (exact type).
 */
import { describe, expect, it } from 'vitest';
import { act, attack } from '../../helpers.ts';
import {
  atMain,
  BLUE,
  blockers,
  C14,
  canFinish,
  chars,
  donSum,
  kind,
  LB,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  put,
  theirs,
  trash,
} from './kit-eb03b.ts';

const ID = 'EB03-045';
const KUMACY = 'OP14-102'; // {Thriller Bark Pirates}, cost 1, 2000, vanilla (a [Trigger] only)
const CERBERUS = 'OP06-087'; // {Thriller Bark Pirates}, cost 2, 2000, [Blocker]
const VICTORIA3 = 'OP14-109'; // {Thriller Bark Pirates}, cost 3, 1000, [Blocker]
const LOLA4 = 'OP06-094'; // {Thriller Bark Pirates}, cost 4, 6000, vanilla
const MARCO = C14.marco; // cost 3, no type of interest
const MOHJI = 'OP02-060'; // cost 1, not {Thriller Bark Pirates}

/** p1 plays Perona with `trashCards` in the trash (padded with fillers to `size`). */
function start(o: { trash?: string[]; size?: number; mine?: string[] }) {
  const named = o.trash ?? [];
  const size = o.size ?? 10;
  const pad = Array.from({ length: Math.max(0, size - named.length) }, () => BLUE);
  return mine(LB.luffy, {
    hand: [ID],
    characters: o.mine ?? [],
    trash: [...named, ...pad],
    costArea: { active: 10, rested: 0 },
  });
}

/** Give the rested DON!! to this instance (the target pick must be pending). */
function giveTo(g: ReturnType<typeof start>, target: string) {
  need(g, 'choose', 'p1');
  act(g, { type: 'pick', choice: target });
}

describe('EB03-045 Perona: [Blocker]; [On Play] give up to 1 rested DON!! to my Leader or a Character; then with 10+ in trash, play a cheap {Thriller Bark Pirates} from trash rested', () => {
  it('gives 1 rested DON!! to my Leader: the Leader gains the DON!! (+1000 on my turn) and the rested pool shrinks by 1', () => {
    const g = start({ size: 9 });
    put(g, ID);
    giveTo(g, g.leader('p1'));
    expect(atMain(g)).toBe(true);
    const d = donSum(g);
    expect(d.given).toBe(1);
    expect(d.rested).toBe(3);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('gives it to one of my Characters instead', () => {
    const g = start({ size: 9, mine: [MARCO] });
    put(g, ID);
    giveTo(g, g.find('p1', 'characters', MARCO));
    expect(donSum(g).given).toBe(1);
    expect(g.power(g.find('p1', 'characters', MARCO))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("may give it to Perona herself (she is one of my Characters); never to the opponent's cards", () => {
    const g = mine(
      LB.luffy,
      {
        hand: [ID],
        characters: [MARCO],
        trash: Array.from({ length: 9 }, () => BLUE),
        costArea: { active: 10, rested: 0 },
      },
      { characters: [C14.sai] },
    );
    put(g, ID);
    need(g, 'choose', 'p1');
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(offered).toContain(g.leader('p1'));
    expect(offered).toContain(g.find('p1', 'characters', MARCO));
    expect(offered).toContain(g.find('p1', 'characters', ID));
    expect(offered).not.toContain(g.leader('p2'));
    expect(offered).not.toContain(g.find('p2', 'characters', C14.sai));
  });

  it('"up to 1": may give nothing, and then the DON!! stay rested', () => {
    const g = start({ size: 9 });
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(atMain(g)).toBe(true);
    expect(donSum(g).given).toBe(0);
    expect(donSum(g).rested).toBe(4);
  });

  it('with 10 cards in the trash: plays a {Thriller Bark Pirates} Character of cost 2 or less from the trash, rested', () => {
    const g = start({ trash: [CERBERUS, KUMACY] });
    put(g, ID);
    giveTo(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CERBERUS, KUMACY].sort());
    pickCards(g, [CERBERUS]);
    expect(atMain(g)).toBe(true);
    expect(chars(g).sort()).toEqual([CERBERUS, ID].sort());
    expect(g.card(g.find('p1', 'characters', CERBERUS)).rested).toBe(true);
    expect(trash(g)).toHaveLength(9);
  });

  it('candidates: cost 3 and 4 {Thriller Bark Pirates} cards and a non-{Thriller Bark Pirates} cost-1 card are not offered', () => {
    const g = start({ trash: [KUMACY, VICTORIA3, LOLA4, MOHJI, MARCO] });
    put(g, ID);
    giveTo(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KUMACY]);
  });

  it('with 9 cards in the trash nothing is played and nothing is asked after the give', () => {
    const g = start({ trash: [CERBERUS], size: 9 });
    put(g, ID);
    giveTo(g, g.leader('p1'));
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toHaveLength(9);
  });

  it('"Then" is not gated by the give: after choosing to give nothing, 10+ cards in the trash still allow the play', () => {
    const g = start({ trash: [KUMACY] });
    put(g, ID);
    none(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KUMACY]);
    pickCards(g, [KUMACY]);
    expect(chars(g).sort()).toEqual([ID, KUMACY].sort());
  });

  it('"up to 1": the play from the trash may be declined', () => {
    const g = start({ trash: [KUMACY] });
    put(g, ID);
    giveTo(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toHaveLength(10);
  });

  it('[Blocker]: it can block an attack on my Leader', () => {
    const g = theirs(LB.luffy, { characters: [ID] });
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', ID)]);
    void kind;
  });
});
