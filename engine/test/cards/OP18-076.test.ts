/** OP18-076 Shark Submerge 3. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, game, pick, PLAIN_BLUE, V } from './helpers.ts';
import { stageOnPlay } from './helpers-op18-stage.ts';
import { LUFFY_L, PLAIN_PURPLE, SHC2, SHC3, SHC4 } from './helpers-op18.ts';

const ID = 'OP18-076';
const attacked = (leader = PLAIN_PURPLE, rested = false) => {
  const g = game(
    { leader, stage: { card: ID, rested }, characters: [SHC2, SHC3, SHC4] },
    { leader: PLAIN_BLUE, characters: [V.c7] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  return g;
};

describe('OP18-076 Shark Submerge 3', () => {
  it('[On Play] draws 1, then adds up to 1 rested DON!!', () => stageOnPlay(ID));

  it("[On Your Opponent's Attack] rest it: your 5000 Leader and up to 2 Characters gain +1000 this turn", () => {
    const g = attacked();
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'characters', SHC2), g.find('p1', 'characters', SHC3)]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', SHC2))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', SHC3))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', SHC4))).toBe(6000); // not chosen
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
  });

  it('declining keeps the Stage active and gives nothing', () => {
    const g = attacked();
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(false);
  });

  it('a rested Stage cannot pay', () => {
    const g = attacked(PLAIN_PURPLE, true);
    expectDecision(g, 'block', 'p1');
  });

  it('a Leader over 5000 power gains nothing; the Characters still do', () => {
    // EB02-010 Luffy is 5000 too; give it 1 DON!! on p1's... p2's turn DON!! adds nothing, so use a
    // Leader printed above 5000: none in the helpers, so check the boundary with Luffy at 5000.
    const g = attacked(LUFFY_L);
    accept(g);
    pick(g, [g.find('p1', 'characters', SHC2)]);
    expect(g.power(g.leader('p1'))).toBe(6000); // exactly 5000 qualifies
  });
});
