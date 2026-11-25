/**
 * PRB02-015 Shiryu (Character, cost 4, 5000, Counter +1000, {Blackbeard Pirates}).
 *
 * Card text: "If your Leader has the "Blackbeard Pirates" type, this Character gains [Blocker] and +4
 * cost. [On K.O.] If your Leader has the "Blackbeard Pirates" type, K.O. up to 1 of your opponent's
 * Characters with a base cost of 4 or less."
 *
 * Rules: a permanent effect (CR 8-1-3-3) gives [Blocker] and +4 cost only while the Leader has the
 * type. [On K.O.] checks its condition when it activates (CR 10-2-17). "Base cost" ignores every
 * cost modifier (rules-digest, base cost). "Up to 1" may be answered with nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  blockers,
  choose,
  kind,
  kw,
  LDP,
  need,
  none,
  noDefence,
  offeredIds,
  opponentKOs,
  decision,
  SP,
  sorted,
  takeMost,
  theirs,
  chr,
} from './kit-prb02sta.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const SH = 'PRB02-015';

function koBoard(
  leader: string,
  p1extra: string[] = [],
  p2chars: string[] = [SP.c4p6, SP.c5p7],
  p2Leader: string = LDP.neutral,
) {
  return theirs(
    leader,
    { characters: [SH, ...p1extra] },
    { characters: p2chars, hand: [SP.lightning], costArea: { active: 10, rested: 0 } },
    p2Leader,
  );
}

function finishLightning(g: TestGame) {
  if (decision(g)?.kind === 'choose' && decision(g)?.player === 'p2') takeMost(g);
}

describe('PRB02-015 Shiryu: with a {Blackbeard Pirates} Leader gains [Blocker] and +4 cost; [On K.O.] K.O. a base cost 4 or less', () => {
  it('without a {Blackbeard Pirates} Leader: cost 4, 5000, Counter +1000, no [Blocker]', () => {
    const g = koBoard(LDP.neutral);
    const i = at(g, 'p1', 'characters', SH);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([4, 5000, 1000]);
    expect(kw(g, i)).not.toContain('Blocker');
  });

  it('with a {Blackbeard Pirates} Leader: gains [Blocker] and its cost is 8', () => {
    const g = koBoard(LDP.bbp);
    const i = at(g, 'p1', 'characters', SH);
    expect(kw(g, i)).toContain('Blocker');
    expect(g.card(i).cost).toBe(8);
  });

  it("with the Leader's type the new [Blocker] can block an attack", () => {
    const g = theirs(LDP.bbp, { characters: [SH] });
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', SH)]);
  });

  it('without the type it cannot block', () => {
    const g = theirs(LDP.neutral, { characters: [SH] });
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    expect(blockers(g)).toEqual([]);
  });

  it("[On K.O.] with the type: K.O.d by an effect, offers only the opponent's Characters with base cost 4 or less", () => {
    const g = koBoard(LDP.bbp, [SP.c1p3], [SP.c4p6, SP.c5p7, SP.c2p4]);
    opponentKOs(g, at(g, 'p1', 'characters', SH));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.c2p4, SP.c4p6].sort());
  });

  it('[On K.O.] K.O.s the chosen opposing Character (cost 4 boundary) and spares the cost-5 one', () => {
    const g = koBoard(LDP.bbp);
    opponentKOs(g, at(g, 'p1', 'characters', SH));
    choose(g, [chr(g, 'p2', SP.c4p6)]);
    finishLightning(g);
    expect(sorted(g, 'p2', 'trash')).toEqual([SP.c4p6, SP.lightning].sort());
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c5p7]);
    expect(sorted(g, 'p1', 'trash')).toEqual([SH]);
  });

  it('"up to 1": choosing nothing K.O.s nothing', () => {
    const g = koBoard(LDP.bbp);
    opponentKOs(g, at(g, 'p1', 'characters', SH));
    need(g, 'choose', 'p1');
    none(g);
    finishLightning(g);
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c4p6, SP.c5p7].sort());
  });

  it('base cost, not current cost: an opposing Shiryu with a {Blackbeard Pirates} Leader (cost 8 now, base 4) IS offered', () => {
    const g = koBoard(LDP.bbp, [], [SH, SP.c5p7], LDP.bbp);
    opponentKOs(g, at(g, 'p1', 'characters', SH));
    need(g, 'choose', 'p1');
    expect(g.card(chr(g, 'p2', SH)).cost).toBe(8);
    expect(offeredIds(g)).toEqual([SH]);
  });

  it('[On K.O.] without the type: nothing is asked and nothing is K.O.d', () => {
    const g = koBoard(LDP.neutral);
    opponentKOs(g, at(g, 'p1', 'characters', SH));
    finishLightning(g);
    expect(kind(g)).toBe('main');
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c4p6, SP.c5p7].sort());
    expect(sorted(g, 'p1', 'trash')).toEqual([SH]);
  });

  it('[On K.O.] also works when Shiryu is K.O.d in battle', () => {
    const g = theirs(
      LDP.bbp,
      { characters: [{ card: SH, rested: true }] },
      { characters: [SP.c6p8, SP.c4p6] },
    );
    attack(g, at(g, 'p2', 'characters', SP.c6p8), at(g, 'p1', 'characters', SH));
    noDefence(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.c4p6]);
  });
});
