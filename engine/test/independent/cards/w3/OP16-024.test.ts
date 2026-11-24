/**
 * OP16-024 Inazuma (Character, Green, cost 2, 1000, Counter +1000, {Revolutionary Army}/{Impel Down}).
 *
 * Card text: "When this Character is K.O.'d by your opponent's effect, rest up to 1 of your
 * opponent's Characters. [Blocker]"
 *
 * Rules: [On K.O.]-style trigger limited by the cause of the K.O.: a battle K.O. and a return to
 * the hand are not "K.O.'d by your opponent's effect"; "up to" allows 0 (CR 8-4-4-1); [Blocker]
 * CR 10-1-4; a rested Character cannot attack (CR 6-5-3).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  attackers,
  blockers,
  choices,
  endUpTo,
  kind,
  need,
  passBlock,
  pickInst,
  theirs,
  W3C,
  W3L,
  yes,
} from './kit-w3.ts';

const INAZUMA = 'OP16-024';

type P2 = Parameters<typeof theirs>[2];
/** p2's turn; p2 plays Impact Dial (K.O. up to 1 Character with cost 4 or less) on Inazuma. */
function koedByEffect(p2: P2 = {}) {
  const g = theirs(
    W3L.kid,
    { characters: [INAZUMA] },
    { hand: [W3C.impactDial], characters: [W3C.thatch, W3C.sai], ...p2 },
  );
  act(g, { type: 'playCard', card: g.find('p2', 'hand', W3C.impactDial) });
  pickInst(g, [g.find('p1', 'characters', INAZUMA)]);
  const first = (c: string) =>
    g.zone('p2', 'characters').find((x) => x.card === c)?.instance as string;
  return { g, thatch: first(W3C.thatch), sai: first(W3C.sai) };
}

describe("OP16-024 Inazuma: when K.O.'d by the opponent's effect, rest up to 1 of their Characters", () => {
  it("K.O.'d by their effect: I rest the Character I choose", () => {
    const { g, thatch, sai } = koedByEffect();
    need(g, 'choose', 'p1');
    pickInst(g, [thatch]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.card(thatch).rested).toBe(true);
    expect(g.card(sai).rested).toBe(false);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it("the candidates are the opponent's Characters: not their Leader, not my cards", () => {
    const { g, thatch, sai } = koedByEffect();
    need(g, 'choose', 'p1');
    expect(choices(g).sort()).toEqual([thatch, sai].sort());
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('"up to 1": may rest none', () => {
    const { g, thatch, sai } = koedByEffect();
    endUpTo(g);
    expect(g.card(thatch).rested).toBe(false);
    expect(g.card(sai).rested).toBe(false);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('rests only one Character', () => {
    const { g, thatch, sai } = koedByEffect();
    pickInst(g, [sai]);
    expect(g.card(sai).rested).toBe(true);
    expect(g.card(thatch).rested).toBe(false);
  });

  it('the rested Character cannot attack this turn', () => {
    const { g, thatch, sai } = koedByEffect();
    pickInst(g, [thatch]);
    expect(attackers(g)).toEqual([sai, g.leader('p2')].sort());
  });

  it("K.O.'d in battle (not by an effect): nothing is rested", () => {
    const g = theirs(
      W3L.kid,
      { characters: [{ card: INAZUMA, rested: true }] },
      { characters: [W3C.thatch, W3C.sai] },
    );
    attack(g, g.find('p2', 'characters', W3C.thatch), g.find('p1', 'characters', INAZUMA));
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(kind(g)).toBe('main');
    expect(g.card(g.find('p2', 'characters', W3C.sai)).rested).toBe(false);
  });

  it('returned to the hand by their effect (not a K.O.): nothing is rested', () => {
    const g = theirs(
      W3L.kid,
      { characters: [INAZUMA] },
      { hand: [W3C.bounce], characters: [W3C.sai], costArea: { active: 10, rested: 0 } },
    );
    act(g, { type: 'playCard', card: g.find('p2', 'hand', W3C.bounce) });
    yes(g, 'p2');
    pickInst(g, [g.find('p1', 'characters', INAZUMA)]);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([INAZUMA]);
    expect(kind(g)).toBe('main');
    expect(g.card(g.find('p2', 'characters', W3C.sai)).rested).toBe(false);
  });

  it('with no opposing Character the effect finds nothing and the game moves on', () => {
    const { g } = koedByEffect({ characters: [] });
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      endUpTo(g);
    }
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('has [Blocker]: it can block an attack on my Leader', () => {
    const g = theirs(W3L.kid, { characters: [INAZUMA] }, { characters: [W3C.thatch] });
    const inazuma = g.find('p1', 'characters', INAZUMA);
    expect(g.card(inazuma).keywords).toContain('Blocker');
    attack(g, g.find('p2', 'characters', W3C.thatch), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([inazuma]);
    act(g, { type: 'block', blocker: inazuma });
    expect(g.life('p1')).toBe(4);
  });
});
