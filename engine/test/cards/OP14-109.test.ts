/** OP14-109 Victoria Cindry. */
import { describe, expect, it } from 'vitest';
import { V } from './helpers.ts';
import { describeTbpTrigger, OTHER_LEADER, start } from './helpers-op14g4.ts';

const ID = 'OP14-109';

describe('OP14-109 Victoria Cindry', () => {
  it('has [Blocker]', () => {
    const g = start(
      { leader: OTHER_LEADER, characters: [ID] },
      { characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
  });
});

describeTbpTrigger(ID);
