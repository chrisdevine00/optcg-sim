/**
 * OP10-099 Eustass"Captain"Kid (Leader, Yellow, 5000, 5 Life, {Kid Pirates}/{Supernovas}).
 *
 * Card text: "[End of Your Turn] You may turn 1 card from the top of your Life cards face-up: Set up
 * to 1 of your "Supernovas" type Characters with a cost of 3 to 8 as active. That Character gains
 * [Blocker] until the end of your opponent's next turn."
 *
 * Rules: a "you may" cost, paid by turning the top Life card face-up (it needs a face-down top
 * card; DECISIONS M6b-Q59 records the engine's reading for the mirror case). An unpayable cost
 * cannot be paid at all (CR 8-3-1-3). "Until the end of your opponent's next turn" created on my own
 * turn covers the whole of the opponent's next turn (RL-11). A rested Character set active can
 * block.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  blockers,
  canUse,
  cardIds,
  endTurn,
  kind,
  mine,
  need,
  no,
  offeredIds,
  pickInst,
  skipPick,
  theirs,
  unusable,
  V10,
  VAN,
  yes,
  decision,
} from './kit-op10a.ts';

const KID = 'OP10-099';
/** OP14-009 Trafalgar Law: Red, cost 9, 10000, {Supernovas}. Only used as a cost-9 candidate that must not be offered. */
const LAW9 = 'OP14-009';
/** ST02-003 Urouge: Green, cost 2, 3000, {Supernovas}. Only a [DON!! x1] power bonus (inert here). */
const UROUGE2 = 'ST02-003';
/** OP01-051 Eustass"Captain"Kid: Green, cost 8, 8000, {Supernovas}. Only a [DON!! x1] effect (inert here). */
const KID8 = 'OP01-051';

const faceUps = (g: ReturnType<typeof mine>, who: 'p1' | 'p2' = 'p1') =>
  g.zone(who, 'life').map((c) => c.faceUp);

/** End my turn with `chars` on my board (those listed rested), 5 face-down Life. */
function board(chars: (string | { card: string; rested?: boolean })[], opp = {}) {
  return mine(
    KID,
    {
      characters: chars,
      life: [VAN.sai, VAN.sai, VAN.sai, VAN.sai, VAN.sai],
    },
    opp,
  );
}

describe('OP10-099 Kid: [End of Your Turn] you may turn the top Life face-up: set a cost 3-8 {Supernovas} active, gains [Blocker]', () => {
  it('ending the turn asks; paying turns the top Life card face-up and sets the rested Supernovas Character active', () => {
    const g = board([{ card: V10.apoo3, rested: true }]);
    expect(g.card(at(g, 'p1', 'characters', V10.apoo3)).rested).toBe(true);
    endTurn(g);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', V10.apoo3)]);
    expect(faceUps(g)).toEqual([true, false, false, false, false]);
    expect(g.card(at(g, 'p1', 'characters', V10.apoo3)).rested).toBe(false);
    expect(kind(g)).toBe('main');
  });

  it('boundaries: cost 3 and cost 8 are offered; cost 2, cost 9 and non-{Supernovas} are not', () => {
    const g = board([
      { card: UROUGE2, rested: true },
      { card: V10.apoo3, rested: true },
      { card: KID8, rested: true },
      { card: LAW9, rested: true },
      { card: VAN.hajrudin, rested: true },
    ]);
    endTurn(g);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V10.apoo3, KID8].sort());
  });

  it("the chosen Character gains [Blocker] and, set active, can block on the opponent's turn", () => {
    const g = theirsAfterKid([{ card: V10.apoo3, rested: true }]);
    const apoo = at(g, 'p1', 'characters', V10.apoo3);
    expect(g.card(apoo).keywords).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', VAN.hajrudin), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([apoo]);
  });

  it("[Blocker] lasts through the whole opponent's next turn and is gone when my next turn begins", () => {
    const g = theirsAfterKid([{ card: V10.apoo3, rested: true }]);
    const apoo = at(g, 'p1', 'characters', V10.apoo3);
    expect(g.card(apoo).keywords).toContain('Blocker');
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.card(at(g, 'p1', 'characters', V10.apoo3)).keywords).not.toContain('Blocker');
  });

  it('declining the cost: the Life stays face-down, nothing is set active, no Blocker', () => {
    const g = board([{ card: V10.apoo3, rested: true }]);
    endTurn(g);
    no(g, 'p1');
    expect(faceUps(g)).toEqual([false, false, false, false, false]);
    need(g, 'main', 'p2');
    const apoo = at(g, 'p1', 'characters', V10.apoo3);
    expect(g.card(apoo).rested).toBe(true);
    expect(g.card(apoo).keywords).not.toContain('Blocker');
  });

  it('"up to 1": after paying the cost the Character may be left alone (the Life stays face-up)', () => {
    const g = board([{ card: V10.apoo3, rested: true }]);
    endTurn(g);
    yes(g, 'p1');
    skipPick(g);
    expect(faceUps(g)).toEqual([true, false, false, false, false]);
    expect(g.card(at(g, 'p1', 'characters', V10.apoo3)).rested).toBe(true);
  });

  it('only my own Characters: an opposing {Supernovas} Character is not offered', () => {
    const g = board([{ card: V10.apoo3, rested: true }], { characters: [V10.urouge5] });
    endTurn(g);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V10.apoo3]);
  });

  it('with no eligible {Supernovas} Character the cost can still be paid and nothing else happens', () => {
    const g = board([VAN.hajrudin]);
    endTurn(g);
    expect(canUse(g)).toBe(true);
    yes(g, 'p1');
    if (kind(g) === 'choose') skipPick(g);
    expect(faceUps(g)).toEqual([true, false, false, false, false]);
  });

  it('must not happen: with every Life card already face-up the cost cannot be paid', () => {
    const g = mine(KID, {
      characters: [{ card: V10.apoo3, rested: true }],
      life: [
        { card: VAN.sai, faceUp: true },
        { card: VAN.sai, faceUp: true },
        { card: VAN.sai, faceUp: true },
      ],
    });
    endTurn(g);
    unusable(g, 'p1');
    need(g, 'main', 'p2');
    expect(g.card(at(g, 'p1', 'characters', V10.apoo3)).rested).toBe(true);
    expect(g.card(at(g, 'p1', 'characters', V10.apoo3)).keywords).not.toContain('Blocker');
  });

  it('must not happen: with no Life cards the cost cannot be paid', () => {
    const g = mine(KID, { characters: [{ card: V10.apoo3, rested: true }], life: [] });
    endTurn(g);
    unusable(g, 'p1');
    need(g, 'main', 'p2');
    expect(cardIds(g, 'p1', 'life')).toEqual([]);
    expect(g.card(at(g, 'p1', 'characters', V10.apoo3)).rested).toBe(true);
  });

  it("it is [End of Your Turn]: at the end of the opponent's turn nothing is asked", () => {
    const g = theirs(KID, {
      characters: [{ card: V10.apoo3, rested: true }],
      life: [VAN.sai, VAN.sai, VAN.sai, VAN.sai],
    });
    endTurn(g);
    expect(decision(g)?.kind).toBe('main');
    expect(decision(g)?.player).toBe('p1');
    expect(g.zone('p1', 'life').map((c) => c.faceUp)).toEqual([false, false, false, false]);
  });
});

/**
 * My turn ends with the effect used on `chars`; returns the game at p2's Main Phase with a p2
 * Character that can attack.
 */
function theirsAfterKid(chars: (string | { card: string; rested?: boolean })[]) {
  const g = board(chars, { characters: [VAN.hajrudin] });
  endTurn(g);
  yes(g, 'p1');
  pickInst(g, [at(g, 'p1', 'characters', V10.apoo3)]);
  need(g, 'main', 'p2');
  return g;
}
