/** EB02-021 Gum-Gum Giant Pistol. */
import { describe, expect, it } from 'vitest';
import {
  endCounter,
  expectDecision,
  game,
  none,
  passBlock,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { donArea, SHC, SHC_LEADER } from './helpers-luffyace.ts';

const ID = 'EB02-021';

describe('EB02-021 Gum-Gum Giant Pistol', () => {
  const start = () =>
    game(
      {
        leader: SHC_LEADER,
        hand: [ID],
        characters: [{ card: SHC.franky4, rested: true }, { card: SHC.jinbe2, rested: true }, V.c1],
        ...donArea(3),
      },
      { leader: PLAIN_BLUE },
    );

  it('[Main]: a {Straw Hat Crew} Character gains +6000 power during this turn', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    // Both Straw Hat Crew Characters are candidates; the other type is not.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    const franky = g.find('p1', 'characters', SHC.franky4);
    pick(g, [franky]);
    expect(g.power(franky)).toBe(12000);
    expect(g.power(g.find('p1', 'characters', SHC.jinbe2))).toBe(4000);
  });

  it('[Main]: the selected Character does not become active in your next Refresh Phase; others do', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p1', 'characters', SHC.franky4)]);
    g.act({ type: 'endTurn' });
    // p2's turn: p1's rested Characters stay rested.
    expect(g.decider).toBe('p2');
    g.act({ type: 'endTurn' });
    // p1's next Refresh Phase has run.
    expect(g.decider).toBe('p1');
    expect(g.card(g.find('p1', 'characters', SHC.franky4)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', SHC.jinbe2)).rested).toBe(false);
    // After that one Refresh Phase the restriction is over: the next turn it becomes active.
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', SHC.franky4)).rested).toBe(false);
  });

  it('[Main]: with no Character chosen nothing is held back', () => {
    const g = start();
    play(g, ID);
    none(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.zone('p1', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it("[Trigger]: rest up to 1 of your opponent's Characters with a cost of 4 or less", () => {
    const g = game(
      { leader: SHC_LEADER, life: [ID, PURPLE] },
      { leader: PLAIN_BLUE, characters: [V.c7, V.c3, V.c5] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    // Only the cost-3 Character: the attacker (7) and the cost-5 one are too expensive.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });
});
