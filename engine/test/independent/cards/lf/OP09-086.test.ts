/**
 * OP09-086 Jesus Burgess (Character, Black, cost 4, 5000, Counter +1000, Strike, {Blackbeard Pirates}).
 *
 * Card text: "This Character cannot be K.O.'d by your opponent's effects. If your Leader has the
 * "Blackbeard Pirates" type, this Character gains +1000 power for every 4 cards in your trash."
 *
 * Rules: "cannot be K.O.'d by your opponent's effects" stops opposing K.O. effects only, not a
 * battle loss and not my own effects (RL-14; QA-OP04 OP04-079); a permanent boost is recomputed
 * from the trash size ("for every 4" rounds down); the type is read on my Leader; only my own
 * trash counts. The data quotes the type, which the card data treats as an exact type.
 * Scenery: OP16-080 Teach ({Blackbeard Pirates} Leader, its text removed by the scenery),
 * ST01-001 Luffy and ST03-001 Crocodile (not Blackbeard), OP01-018 Hajrudin (6000), OP02-007 Thatch (8000).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  chars,
  fill,
  KINGDOM_COME,
  LD_LF,
  mine,
  noDefence,
  opponentKingdomCome,
  theirs,
  trash,
  VAN_LF,
} from './kit-lfa.ts';

const BURGESS = 'OP09-086';
const { marco, hajrudin, thatch, mohji, pizarro } = VAN_LF;
const pile = (n: number) => fill(marco, n);

function powerWith(leader: string, trashSize: number, p2trash = 0): number | null {
  const g = mine(
    leader,
    { characters: [BURGESS], trash: pile(trashSize) },
    { trash: fill(mohji, p2trash) },
  );
  return g.power(at(g, 'p1', 'characters', BURGESS));
}

describe('OP09-086 Jesus Burgess', () => {
  it('printed values: cost 4, 5000 power, Counter +1000', () => {
    const g = mine(LD_LF.teach, { characters: [BURGESS] });
    const b = at(g, 'p1', 'characters', BURGESS);
    expect(g.card(b).cost).toBe(4);
    expect(g.card(b).counter).toBe(1000);
    expect(g.power(b)).toBe(5000);
  });

  it('{Blackbeard Pirates} Leader: +1000 for every 4 cards in the trash (0 to 3 give nothing)', () => {
    expect(powerWith(LD_LF.teach, 0)).toBe(5000);
    expect(powerWith(LD_LF.teach, 3)).toBe(5000);
    expect(powerWith(LD_LF.teach, 4)).toBe(6000);
  });

  it('boundaries of the second and third step: 7 -> +1000, 8 -> +2000, 12 -> +3000', () => {
    expect(powerWith(LD_LF.teach, 7)).toBe(6000);
    expect(powerWith(LD_LF.teach, 8)).toBe(7000);
    expect(powerWith(LD_LF.teach, 11)).toBe(7000);
    expect(powerWith(LD_LF.teach, 12)).toBe(8000);
  });

  it('a Leader without the {Blackbeard Pirates} type gives no bonus, however large the trash', () => {
    expect(powerWith(LD_LF.luffy, 8)).toBe(5000);
    expect(powerWith(LD_LF.croc, 12)).toBe(5000);
  });

  it('a {Blackbeard Pirates} Character on my field does not replace the Leader condition', () => {
    const g = mine(LD_LF.luffy, { characters: [BURGESS, pizarro], trash: pile(8) });
    expect(g.power(at(g, 'p1', 'characters', BURGESS))).toBe(5000);
  });

  it("only my own trash counts: the opponent's 8 trash cards give nothing", () => {
    expect(powerWith(LD_LF.teach, 0, 8)).toBe(5000);
    expect(powerWith(LD_LF.teach, 3, 8)).toBe(5000);
  });

  it("the bonus follows the trash: a Character K.O.'d during the turn takes it from 3 to 4 cards", () => {
    const g = theirs(
      LD_LF.teach,
      { characters: [BURGESS, { card: marco, rested: true }], trash: pile(3) },
      { characters: [thatch] },
    );
    const b = at(g, 'p1', 'characters', BURGESS);
    expect(g.power(b)).toBe(5000);
    attack(g, at(g, 'p2', 'characters', thatch), at(g, 'p1', 'characters', marco));
    noDefence(g);
    expect(trash(g)).toHaveLength(4);
    expect(g.power(b)).toBe(6000);
  });

  it("cannot be K.O.'d by the opponent's effects: Kingdom Come on Burgess does nothing", () => {
    const g = theirs(
      LD_LF.teach,
      { characters: [BURGESS, marco] },
      { hand: [KINGDOM_COME], life: [mohji, mohji, mohji, mohji] },
    );
    opponentKingdomCome(g, at(g, 'p1', 'characters', BURGESS));
    expect(chars(g)).toEqual([BURGESS, marco].sort());
    expect(trash(g)).toEqual([]);
  });

  it('the protection is the same with a non-Blackbeard Leader and with a large trash', () => {
    const g = theirs(
      LD_LF.croc,
      { characters: [BURGESS], trash: pile(9) },
      { hand: [KINGDOM_COME], life: [mohji, mohji, mohji, mohji] },
    );
    opponentKingdomCome(g, at(g, 'p1', 'characters', BURGESS));
    expect(chars(g)).toEqual([BURGESS]);
  });

  it("a rested Burgess is protected too (no [Opponent's Turn] or active condition)", () => {
    const g = theirs(
      LD_LF.teach,
      { characters: [{ card: BURGESS, rested: true }] },
      { hand: [KINGDOM_COME], life: [mohji, mohji, mohji, mohji] },
    );
    opponentKingdomCome(g, at(g, 'p1', 'characters', BURGESS));
    expect(chars(g)).toEqual([BURGESS]);
  });

  it("the protection is about Burgess only: my other Character is K.O.'d by the same effect", () => {
    const g = theirs(
      LD_LF.teach,
      { characters: [BURGESS, hajrudin] },
      { hand: [KINGDOM_COME], life: [mohji, mohji, mohji, mohji] },
    );
    opponentKingdomCome(g, at(g, 'p1', 'characters', hajrudin));
    expect(chars(g)).toEqual([BURGESS]);
    expect(trash(g)).toEqual([hajrudin]);
  });

  it("a K.O. in battle is not an effect: a rested Burgess that loses a battle is K.O.'d", () => {
    const g = theirs(
      LD_LF.teach,
      { characters: [{ card: BURGESS, rested: true }] },
      { characters: [thatch] },
    );
    attack(g, at(g, 'p2', 'characters', thatch), at(g, 'p1', 'characters', BURGESS));
    noDefence(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([BURGESS]);
  });

  it('the bonus decides a battle: with 8 trash cards (7000) he survives a 6000 attacker, with 4 (6000) he does not', () => {
    const run = (n: number) => {
      const g = theirs(
        LD_LF.teach,
        { characters: [{ card: BURGESS, rested: true }], trash: pile(n) },
        { characters: [hajrudin] },
      );
      attack(g, at(g, 'p2', 'characters', hajrudin), at(g, 'p1', 'characters', BURGESS));
      noDefence(g);
      return chars(g);
    };
    expect(run(8)).toEqual([BURGESS]);
    expect(run(4)).toEqual([]);
  });
});
