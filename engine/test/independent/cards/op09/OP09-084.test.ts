/**
 * OP09-084 Catarina Devon (Character, Black, cost 5, 6000, Counter +1000, {Blackbeard Pirates}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] If your Leader has the "Blackbeard Pirates" type, this
 * Character gains [Double Attack], [Banish] or [Blocker] until the end of your opponent's next
 * turn."
 *
 * Rules: there is no colon, so the "If" is an effect condition: the ability can be activated and its
 * Once Per Turn is spent even when the check fails (DECISIONS 2026-11-24). "Gains A, B or C" is a
 * choice of one. "Until the end of your opponent's next turn" lasts through the opponent's whole
 * next turn (RL-11, QA-OP09 OP09-093). [Double Attack]: 2 damage; [Banish]: no [Trigger].
 */
import { describe, expect, it } from 'vitest';
import {
  abil,
  actRaw,
  act,
  atMain,
  attack,
  blockers,
  chr,
  endTurn,
  hand,
  kind,
  LD9,
  lifeCards,
  mine,
  need,
  noDefenceAtAll,
  SC9,
  theirs,
  trash,
} from './kit-op09c.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const DEV = 'OP09-084';
const KEYS = ['Double Attack', 'Banish', 'Blocker'];

function modes(g: TestGame): { id: string; label: string }[] {
  return need(g, 'choose', 'p1').options ?? [];
}

function pickMode(g: TestGame, word: string): void {
  const m = modes(g).find((o) => o.label.includes(word));
  if (!m) throw new Error(`No mode with ${word}: ${modes(g).map((o) => o.label)}`);
  act(g, { type: 'pick', choice: { option: m.id } });
}

function board(leader: string = LD9.bbp, p2: Parameters<typeof mine>[2] = {}) {
  return mine(leader, { characters: [DEV, SC9.c4] }, p2);
}

function kws(g: TestGame, who: 'p1' | 'p2' = 'p1', card: string = DEV): string[] {
  return g.card(chr(g, who, card)).keywords.filter((k) => KEYS.includes(k));
}

function grant(g: TestGame, word: string): void {
  actRaw(g, chr(g, 'p1', DEV));
  pickMode(g, word);
}

describe('OP09-084 Catarina Devon: [Activate: Main] [Once Per Turn] gains [Double Attack], [Banish] or [Blocker]', () => {
  it('printed values: cost 5, 6000, Counter +1000, no keyword of its own', () => {
    const g = board();
    const c = g.card(chr(g, 'p1', DEV));
    expect(c.cost).toBe(5);
    expect(c.power).toBe(6000);
    expect(c.counter).toBe(1000);
    expect(kws(g)).toEqual([]);
  });

  it('with a {Blackbeard Pirates} Leader the ability is offered and asks for one of three keywords', () => {
    const g = board();
    expect(abil(g, chr(g, 'p1', DEV))).toHaveLength(1);
    actRaw(g, chr(g, 'p1', DEV));
    const labels = modes(g).map((o) => o.label);
    expect(labels).toHaveLength(3);
    for (const w of KEYS) expect(labels.some((l) => l.includes(w))).toBe(true);
  });

  it('choosing [Double Attack] grants only [Double Attack]', () => {
    const g = board();
    grant(g, 'Double Attack');
    expect(atMain(g)).toBe(true);
    expect(kws(g)).toEqual(['Double Attack']);
  });

  it('choosing [Banish] grants only [Banish]', () => {
    const g = board();
    grant(g, 'Banish');
    expect(kws(g)).toEqual(['Banish']);
  });

  it('choosing [Blocker] grants only [Blocker]', () => {
    const g = board();
    grant(g, 'Blocker');
    expect(kws(g)).toEqual(['Blocker']);
  });

  it('only this Character gains the keyword, not my other Characters or my Leader', () => {
    const g = board();
    grant(g, 'Blocker');
    expect(g.card(chr(g, 'p1', SC9.c4)).keywords).not.toContain('Blocker');
    expect(g.card(g.leader('p1')).keywords).not.toContain('Blocker');
  });

  it('[Once Per Turn]: after one use the ability is not offered again this turn', () => {
    const g = board();
    grant(g, 'Banish');
    expect(abil(g, chr(g, 'p1', DEV))).toEqual([]);
  });

  it('there is no rest cost: Catarina Devon stays active and can attack after the grant', () => {
    const g = board();
    grant(g, 'Double Attack');
    expect(g.card(chr(g, 'p1', DEV)).rested).toBe(false);
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === chr(g, 'p1', DEV))).toBe(
      true,
    );
  });

  it('a Leader without {Blackbeard Pirates}: the ability is still offered, spends its Once Per Turn and grants nothing', () => {
    const g = board(LD9.luffy);
    expect(abil(g, chr(g, 'p1', DEV))).toHaveLength(1);
    actRaw(g, chr(g, 'p1', DEV));
    if (kind(g) === 'choose') act(g, { type: 'done' });
    expect(atMain(g)).toBe(true);
    expect(kws(g)).toEqual([]);
    expect(abil(g, chr(g, 'p1', DEV))).toEqual([]);
  });

  it("[Double Attack] works: attacking the opponent's Leader takes 2 Life cards", () => {
    const g = board(LD9.bbp, { life: [SC9.c2, SC9.c3, SC9.c4, SC9.c5] });
    grant(g, 'Double Attack');
    attack(g, chr(g, 'p1', DEV), g.leader('p2'));
    noDefenceAtAll(g);
    expect(lifeCards(g, 'p2')).toHaveLength(2);
  });

  it('[Banish] works: the Life card goes to the trash and its [Trigger] is not offered', () => {
    const g = board(LD9.bbp, { life: [SC9.triggerSpeed, SC9.c3, SC9.c4, SC9.c5] });
    grant(g, 'Banish');
    attack(g, chr(g, 'p1', DEV), g.leader('p2'));
    noDefenceAtAll(g);
    expect(kind(g)).not.toBe('trigger');
    expect(trash(g, 'p2')).toEqual([SC9.triggerSpeed]);
    expect(lifeCards(g, 'p2')).toHaveLength(3);
  });

  it('without the keyword the same Life card is taken to hand (a trigger decision is asked)', () => {
    const g = board(LD9.bbp, { life: [SC9.triggerSpeed, SC9.c3, SC9.c4, SC9.c5] });
    attack(g, chr(g, 'p1', DEV), g.leader('p2'));
    if (kind(g) === 'block') act(g, { type: 'block', blocker: null });
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p2');
    act(g, { type: 'trigger', activate: false });
    expect(hand(g, 'p2')).toContain(SC9.triggerSpeed);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it("the keyword lasts through the opponent's next turn: [Blocker] can block there", () => {
    const g = board();
    grant(g, 'Blocker');
    endTurn(g);
    need(g, 'main', 'p2');
    expect(kws(g)).toEqual(['Blocker']);
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toContain(chr(g, 'p1', DEV));
  });

  it("the keyword is gone once the opponent's turn is over (my next Main Phase)", () => {
    const g = board();
    grant(g, 'Blocker');
    endTurn(g);
    need(g, 'main', 'p2');
    endTurn(g);
    need(g, 'main', 'p1');
    expect(kws(g)).toEqual([]);
  });

  it('a second use in my next turn is available again (a new turn) and replaces nothing it should keep', () => {
    const g = board();
    grant(g, 'Blocker');
    endTurn(g);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(abil(g, chr(g, 'p1', DEV))).toHaveLength(1);
  });

  it("is not offered during the opponent's turn", () => {
    const g = theirs(LD9.bbp, { characters: [DEV] }, {});
    expect(abil(g, chr(g, 'p1', DEV))).toEqual([]);
  });
});
