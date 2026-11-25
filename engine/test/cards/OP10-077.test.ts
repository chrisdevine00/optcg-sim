/** OP10-077 Bellamy. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  canAccept,
  dec,
  decline,
  don,
  expectDecision,
  option,
  oppAttack,
  OTHER_LEADER,
  payDon,
} from './helpers-a10g3.ts';

const ID = 'OP10-077';
const start = (active: number, rested = 0) =>
  oppAttack({
    leader: OTHER_LEADER,
    characters: [ID],
    costArea: { active, rested },
  });
const block = (g: ReturnType<typeof start>) => {
  expectDecision(g, 'block', 'p1');
  g.act({ type: 'block', blocker: g.find('p1', 'characters', ID) });
};

describe('OP10-077 Bellamy', () => {
  it('has [Blocker]', () => {
    const g = start(5);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Block] rest 2 DON!!: add 1 DON!! from the DON!! deck as active', () => {
    const g = start(5);
    block(g);
    accept(g);
    payDon(g);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 2, deck: 4 });
  });

  it('"up to 1": the added count may be 0, the DON!! stay rested', () => {
    const g = start(5);
    block(g);
    accept(g);
    payDon(g);
    const d = expectDecision(g, 'choose', 'p1');
    option(g, d.options!.at(-1)!.id);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2, deck: 5 });
  });

  it('exactly 2 active DON!! pay the cost (boundary)', () => {
    const g = start(2);
    block(g);
    accept(g);
    payDon(g);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 2 });
  });

  it('declining the cost adds nothing and rests nothing', () => {
    const g = start(5);
    block(g);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 0, deck: 5 });
  });

  it('must not fire with only 1 active DON!! (rested DON!! cannot pay)', () => {
    const g = start(1, 4);
    block(g);
    if (dec(g)?.kind === 'optional') {
      expect(canAccept(g)).toBe(false);
      decline(g);
    }
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 4 });
  });

  it('does not fire when the attack is not blocked by it', () => {
    const g = start(5);
    expectDecision(g, 'block', 'p1');
    g.act({ type: 'block', blocker: null });
    expect(dec(g)?.kind).not.toBe('optional');
  });
});
