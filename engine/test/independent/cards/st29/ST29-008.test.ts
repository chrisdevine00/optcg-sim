/**
 * ST29-008 Nami (Character, Yellow, cost 3, 1000, Counter +1000, {Straw Hat Crew}/{Egghead}).
 *
 * Card text: "If your {Egghead} type Character would be K.O.'d by your opponent's effect, you may turn 1
 * card from the top of your Life cards face-up instead.
 * [Trigger] If your Leader is [Monkey.D.Luffy], play this card."
 *
 * Rules: a replacement effect (CR 8-1-3-4) applies only to the event it names: a K.O. caused by the
 * OPPONENT's EFFECT (not battle, not my own effects) of an {Egghead} Character of mine. It is
 * optional ("you may"); if declined the K.O. happens. It cannot be applied when impossible: no Life
 * card, or the top Life card already face-up (QA-OP13, OP13-109 Bonney, CR 8-1-3-4-5).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  C29,
  decision,
  describeLuffyTrigger,
  fill,
  ids29,
  inst,
  isMain,
  kind,
  L29,
  need,
  offered,
  opponentKingdomCome,
  theirs,
} from './kit-st29a.ts';

const NAMI = 'ST29-008';
const EGG = C29.brook; // ST29-011 Brook: {Straw Hat Crew}/{Egghead}, cost 2, 2000

describeLuffyTrigger({ id: NAMI, cost: 3, power: 1000, counter: 1000 });

/** p2's Main Phase: p2 holds Kingdom Come (6+ active DON!!); p1 has these Characters and Life. */
function pos(
  chars: (string | { card: string; rested?: boolean })[],
  life: (string | { card: string; faceUp?: boolean })[] = fill(C29.c1, 4),
) {
  return theirs(
    L29.croc,
    { characters: chars, life },
    { hand: [C29.kingdomCome], life: fill(C29.c1, 4) },
  );
}

describe('ST29-008 Nami: turn a Life card face-up instead of an {Egghead} Character being K.O.d by an opponent effect', () => {
  it('an opponent effect K.O. of my {Egghead} Character asks ME (the owner) about the replacement', () => {
    const g = pos([NAMI, EGG]);
    opponentKingdomCome(g, inst(g, 'p1', 'characters', EGG));
    const d = decision(g);
    expect(d?.player).toBe('p1');
    expect(kind(g)).not.toBe('main');
  });

  it('accepting turns the top Life card face-up and the Egghead Character stays', () => {
    const g = pos([NAMI, EGG]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    opponentKingdomCome(g, inst(g, 'p1', 'characters', EGG));
    need(g, 'optional', 'p1');
    expect(offered(g, 'p1')).toBe(true);
    act(g, { type: 'optional', accept: true });
    expect(ids29(g, 'p1', 'characters')).toEqual([EGG, NAMI].sort());
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.zone('p1', 'life').filter((c) => c.faceUp)).toHaveLength(1);
    expect(g.life('p1')).toBe(4);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('declining lets the K.O. happen: the Character goes to the trash and no Life card is turned', () => {
    const g = pos([NAMI, EGG]);
    opponentKingdomCome(g, inst(g, 'p1', 'characters', EGG));
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: false });
    expect(ids29(g, 'p1', 'characters')).toEqual([NAMI]);
    expect(ids29(g, 'p1', 'trash')).toEqual([EGG]);
    expect(g.zone('p1', 'life').some((c) => c.faceUp)).toBe(false);
  });

  it('Nami herself is an {Egghead}: she can be saved the same way', () => {
    const g = pos([NAMI]);
    opponentKingdomCome(g, inst(g, 'p1', 'characters', NAMI));
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    expect(ids29(g, 'p1', 'characters')).toEqual([NAMI]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
  });

  it('a Character without the {Egghead} type is K.O.d without any question', () => {
    const g = pos([NAMI, C29.c3]);
    opponentKingdomCome(g, inst(g, 'p1', 'characters', C29.c3));
    expect(isMain(g, 'p2')).toBe(true);
    expect(ids29(g, 'p1', 'characters')).toEqual([NAMI]);
    expect(ids29(g, 'p1', 'trash')).toEqual([C29.c3]);
    expect(g.zone('p1', 'life').some((c) => c.faceUp)).toBe(false);
  });

  it('without Nami on my field an {Egghead} Character is simply K.O.d', () => {
    const g = pos([EGG]);
    opponentKingdomCome(g, inst(g, 'p1', 'characters', EGG));
    expect(isMain(g, 'p2')).toBe(true);
    expect(ids29(g, 'p1', 'characters')).toEqual([]);
    expect(ids29(g, 'p1', 'trash')).toEqual([EGG]);
  });

  it("battle K.O. is not replaced: p2's Leader beats my rested {Egghead} Character in battle", () => {
    const g = pos([NAMI, { card: EGG, rested: true }]);
    act(g, { type: 'attack', attacker: g.leader('p2'), target: inst(g, 'p1', 'characters', EGG) });
    // p1 neither blocks nor counters.
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    expect(ids29(g, 'p1', 'characters')).toEqual([NAMI]);
    expect(ids29(g, 'p1', 'trash')).toEqual([EGG]);
    expect(g.zone('p1', 'life').some((c) => c.faceUp)).toBe(false);
  });

  it('if the top Life card is already face-up the replacement cannot be applied: the K.O. happens', () => {
    const g = pos([NAMI, EGG], [{ card: C29.c1, faceUp: true }, ...fill(C29.c1, 3)]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    opponentKingdomCome(g, inst(g, 'p1', 'characters', EGG));
    expect(isMain(g, 'p2')).toBe(true);
    expect(ids29(g, 'p1', 'characters')).toEqual([NAMI]);
    expect(ids29(g, 'p1', 'trash')).toEqual([EGG]);
  });

  it('with 0 Life cards there is nothing to turn: the K.O. happens', () => {
    const g = pos([NAMI, EGG], []);
    opponentKingdomCome(g, inst(g, 'p1', 'characters', EGG));
    expect(isMain(g, 'p2')).toBe(true);
    expect(ids29(g, 'p1', 'characters')).toEqual([NAMI]);
    expect(ids29(g, 'p1', 'trash')).toEqual([EGG]);
  });
});
