/** OP12-021 Ipponmatsu. */
import { describe, expect, it } from 'vitest';
import { dec, pick, PLAIN_BLUE, V } from './helpers.ts';
import {
  mine,
  OTHER_LEADER,
  plant,
  plantOpponentEffect,
  SLASH_LEADER,
  theirs,
} from './helpers-lfa.ts';

const ID = 'OP12-021';
type G = ReturnType<typeof theirs>;
const don = (rested: number) => ({ costArea: { active: 0, rested } });
const rest = { rest: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } };

/** p2's turn: p1 over `leader` with Ipponmatsu (and `others`), `rested` rested DON!!; p2's effect rests a Character. */
const hit = (leader: string, rested: number, others: string[] = []) => {
  const g = theirs(leader, { characters: [ID, ...others], ...don(rested) }, { leader: PLAIN_BLUE });
  plantOpponentEffect(g, rest);
  if (dec(g)?.kind === 'choose') pick(g, [g.find('p1', 'characters', ID)]);
  return g;
};
const isRested = (g: G) => g.card(g.find('p1', 'characters', ID)).rested;

describe('OP12-021 Ipponmatsu', () => {
  it("with a <Slash> Leader and 6 rested DON!! your opponent's effects cannot rest him", () => {
    expect(isRested(hit(SLASH_LEADER, 6))).toBe(false);
    expect(isRested(hit(SLASH_LEADER, 10, [V.c1]))).toBe(false);
  });

  it('boundary: 5 rested DON!! is not enough, so he is rested', () => {
    expect(isRested(hit(SLASH_LEADER, 5))).toBe(true);
  });

  it('must not apply with a Leader without <Slash>', () => {
    expect(isRested(hit(OTHER_LEADER, 6))).toBe(true);
  });

  it('active DON!! do not count: 3 rested and 6 active is not 6 rested', () => {
    const g = theirs(
      SLASH_LEADER,
      { characters: [ID], costArea: { active: 6, rested: 3 } },
      { leader: PLAIN_BLUE },
    );
    plantOpponentEffect(g, rest);
    expect(isRested(g)).toBe(true);
  });

  it("only your opponent's effects are stopped: your own effect can rest him", () => {
    const g = mine(SLASH_LEADER, { characters: [ID], ...don(6) });
    plant(g, 'p1', { rest: { from: 'characters', owner: 'you', pick: { exactly: 1 } } });
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('[Blocker]: he can still block (resting to block is not an effect)', () => {
    const g = theirs(SLASH_LEADER, { characters: [ID], ...don(6) }, { characters: [V.c7] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
    g.act({ type: 'block', blocker: g.find('p1', 'characters', ID) });
    expect(isRested(g)).toBe(true);
  });
});
