/**
 * EB04-013 Carrot (Character, cost 8, 9000, no Counter, {Minks}).
 *
 * Card text: "[On Play] If your Leader has the {Minks} type, set up to 2 of your {Minks} type
 * Characters and your Leader as active."
 *
 * Rules: CR 8-4-4-1 ("up to 2"), the condition is on the Leader's type, only {Minks} Characters of
 * mine are candidates. The Leader is named without "up to": it is set active.
 * Reading note: whether "up to 2" also covers the Leader (2 picks in all) is not settled; the tests
 * only assert what both readings share (a Leader-only case, the 2-Character cap).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  choices,
  decision,
  kind,
  LE,
  mine,
  need,
  offeredIds,
  pickInst,
  playRaw,
  SN,
} from './kit-eb04a.ts';

const CARROT = 'EB04-013';
const rest = (card: string) => ({ card, rested: true });

/** Play Carrot, then pick the given Character instances; ends any remaining "up to" prompt. */
function resolve(g: ReturnType<typeof mine>, picks: string[]) {
  playRaw(g, CARROT);
  const leaderIn = () => kind(g) === 'choose' && choices(g).includes(g.leader('p1'));
  let guard = 0;
  while (kind(g) === 'choose' && guard++ < 6) {
    const want = choices(g).find((i) => picks.includes(i));
    if (want) {
      act(g, { type: 'pick', choice: want });
    } else if (leaderIn()) {
      act(g, { type: 'pick', choice: g.leader('p1') });
    } else {
      act(g, { type: 'done' });
    }
  }
}

describe('EB04-013 Carrot: [On Play] with a {Minks} Leader, set up to 2 {Minks} Characters and the Leader active', () => {
  it('printed values: cost 8, 9000', () => {
    const g = mine(LE.minks, { hand: [CARROT] }, {});
    const c = g.card(g.find('p1', 'hand', CARROT));
    expect(c.cost).toBe(8);
    expect(c.power).toBe(9000);
  });

  it('a rested {Minks} Leader and 2 rested {Minks} Characters: all become active', () => {
    const g = mine(
      { card: LE.minks, rested: true },
      { hand: [CARROT], characters: [rest(SN.tristan), rest(SN.bb)] },
      {},
    );
    const picks = [at(g, 'p1', 'characters', SN.tristan), at(g, 'p1', 'characters', SN.bb)];
    resolve(g, picks);
    expect(kind(g)).toBe('main');
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(g.card(picks[0]!).rested).toBe(false);
    expect(g.card(picks[1]!).rested).toBe(false);
  });

  it('only a rested Leader: it is set active (nothing else to do)', () => {
    const g = mine({ card: LE.minks, rested: true }, { hand: [CARROT] }, {});
    resolve(g, []);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(kind(g)).toBe('main');
  });

  it('cap: 3 rested {Minks} Characters, at most 2 of them can be set active', () => {
    const g = mine(
      LE.minks,
      { hand: [CARROT], characters: [rest(SN.tristan), rest(SN.bb), rest(SN.pekoms)] },
      {},
    );
    const picks = [
      at(g, 'p1', 'characters', SN.tristan),
      at(g, 'p1', 'characters', SN.bb),
      at(g, 'p1', 'characters', SN.pekoms),
    ];
    resolve(g, picks);
    const active = picks.filter((i) => !g.card(i).rested);
    expect(active).toHaveLength(2);
  });

  it('"up to 2": choosing only 1 leaves the other rested', () => {
    const g = mine(LE.minks, { hand: [CARROT], characters: [rest(SN.tristan), rest(SN.bb)] }, {});
    playRaw(g, CARROT);
    need(g, 'choose');
    expect(decision(g)!.min).toBe(0);
    const t = at(g, 'p1', 'characters', SN.tristan);
    pickInst(g, [t]);
    expect(kind(g)).toBe('main');
    expect(g.card(t).rested).toBe(false);
    expect(g.card(at(g, 'p1', 'characters', SN.bb)).rested).toBe(true);
  });

  it('only {Minks} Characters of mine are candidates: other types and the opponent Minks are not offered', () => {
    const g = mine(
      LE.minks,
      { hand: [CARROT], characters: [rest(SN.tristan), rest(SN.c2), rest(SN.jinbe4)] },
      { characters: [rest(SN.bb)] },
    );
    playRaw(g, CARROT);
    need(g, 'choose');
    const offered = offeredIds(g);
    expect(offered).toContain(SN.tristan);
    expect(offered).not.toContain(SN.c2);
    expect(offered).not.toContain(SN.jinbe4);
    expect(offered).not.toContain(SN.bb);
  });

  it('must not happen: a Leader without {Minks} makes the whole effect fail (Minks Characters stay rested)', () => {
    const g = mine(
      { card: LE.luffy, rested: true },
      { hand: [CARROT], characters: [rest(SN.tristan)] },
      {},
    );
    playRaw(g, CARROT);
    expect(kind(g)).toBe('main');
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(g.card(at(g, 'p1', 'characters', SN.tristan)).rested).toBe(true);
  });

  it('a Minks Leader whose Characters are all active: the prompt can be ended and the rested Leader is set active', () => {
    const g = mine(
      { card: LE.minks, rested: true },
      { hand: [CARROT], characters: [SN.tristan] },
      {},
    );
    resolve(g, []);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(g.card(at(g, 'p1', 'characters', SN.tristan)).rested).toBe(false);
  });
});
