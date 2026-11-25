/** OP10-043 Moocy. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { DR_LEADER, DR_STAGE, LUFFY, mk, PLAIN_STAGE, restedCard } from './helpers-a10g2.ts';

const ID = 'OP10-043';

const start = (p1: Parameters<typeof mk>[0] = {}) =>
  mk({ leader: DR_LEADER, hand: [ID], characters: [LUFFY, V.c3], ...p1 }, {});
const banish = (g: ReturnType<typeof mk>, card: string) =>
  g.card(g.find('p1', 'characters', card)).keywords.includes('Banish');

describe('OP10-043 Moocy', () => {
  it('[On Play] rest your {Dressrosa} Leader: [Monkey.D.Luffy] gains [Banish] during this turn', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', LUFFY)]);
    expect(banish(g, LUFFY)).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expectDecision(g, 'main', 'p1');
  });

  it('rests a {Dressrosa} Stage when the Leader is not {Dressrosa}', () => {
    const g = start({ leader: 'ST01-001', stage: DR_STAGE });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', LUFFY)]);
    expect(banish(g, LUFFY)).toBe(true);
    expect(g.card(g.find('p1', 'stage', DR_STAGE)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('only a [Monkey.D.Luffy] Character is a target (not other Characters)', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(canPick(g, g.find('p1', 'characters', LUFFY))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false);
    none(g);
    expect(banish(g, LUFFY)).toBe(false);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('"You may": declining rests nothing and gives no [Banish]', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(banish(g, LUFFY)).toBe(false);
  });

  it('must not be payable with a non-{Dressrosa} Leader and Stage, or a rested {Dressrosa} Leader', () => {
    const a = start({ leader: 'ST01-001', stage: PLAIN_STAGE });
    play(a, ID);
    expectDecision(a, 'main', 'p1'); // the cost cannot be paid: nothing is offered
    expect(banish(a, LUFFY)).toBe(false);

    const b = start({ leader: { card: DR_LEADER, rested: true } });
    play(b, ID);
    expectDecision(b, 'main', 'p1');
    expect(dec(b)?.kind).toBe('main');
    expect(banish(b, LUFFY)).toBe(false);
  });

  it('a rested [Monkey.D.Luffy] is still a target', () => {
    const g = start({ characters: [restedCard(LUFFY)] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', LUFFY)]);
    expect(banish(g, LUFFY)).toBe(true);
  });
});
