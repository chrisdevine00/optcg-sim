/**
 * OP18-047 Mr.1(Daz.Bonez) (Character, Blue, cost 2, 3000, Counter +2000, {Cross Guild}/{Former
 * Baroque Works}).
 *
 * Card text (cards/data):
 *   "[On Play] Your Leader with the {Cross Guild} type or a type including "Baroque Works" gains
 *    [Unblockable] during this turn."
 *
 * Rules: [Unblockable] means the opponent cannot activate [Blocker] against this card's attacks.
 * The grant is to the Leader only, only if the Leader has {Cross Guild} or a type including
 * "Baroque Works", and lasts this turn (CR 8-1-3). No "up to": it is automatic.
 *
 * Scenery: ST03-001 Crocodile (Blue Leader, {Baroque Works}); OP09-042 Buggy (Blue Leader,
 * {The Four Emperors}/{Cross Guild}); ST01-001 Luffy (neither); OP09-072 Franky (Purple, [Blocker]).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { attack, blockers, passBlock } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import { cardIds, kind, kw, LDR, mine, play, toMyNextMain, VAN } from './kit-d.ts';

const MR1 = 'OP18-047';
const CROC = 'ST03-001';
const BUGGY = 'OP09-042';
const BLOCKER = 'OP09-072';

function game(leader: string, p1: Partial<PlayerSpec> = {}): TestGame {
  return mine(
    leader,
    { hand: [MR1, VAN.sai], ...p1 },
    { characters: [BLOCKER], life: Array.from({ length: 4 }, () => VAN.gordon) },
  );
}

const playMr1 = (g: TestGame) => play(g, g.find('p1', 'hand', MR1));

describe('OP18-047 Mr.1(Daz.Bonez): [On Play] your {Cross Guild} or "Baroque Works" Leader gains [Unblockable] this turn', () => {
  it('a Leader with a type including "Baroque Works" gains [Unblockable] (no prompt)', () => {
    const g = game(CROC);
    expect(kw(g, g.leader('p1'))).not.toContain('Unblockable');
    playMr1(g);
    expect(kind(g)).toBe('main');
    expect(kw(g, g.leader('p1'))).toContain('Unblockable');
  });

  it('a Leader with the {Cross Guild} type gains it too', () => {
    const g = game(BUGGY);
    playMr1(g);
    expect(kw(g, g.leader('p1'))).toContain('Unblockable');
  });

  it('a Leader with neither type (Luffy) gains nothing', () => {
    const g = game(LDR.luffy);
    playMr1(g);
    expect(kw(g, g.leader('p1'))).not.toContain('Unblockable');
  });

  it('control: without the keyword the opposing [Blocker] may block the Leader’s attack', () => {
    const g = game(CROC);
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toEqual([g.find('p2', 'characters', BLOCKER)]);
  });

  it('with [Unblockable] the opposing [Blocker] cannot block: the attack goes straight to the Counter Step', () => {
    const g = game(CROC);
    playMr1(g);
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
    passBlock(g);
    expect(kind(g)).toBe('counter');
  });

  it('only the Leader gains it: Mr.1 himself and another Character do not', () => {
    const g = game(CROC, { characters: [VAN.marco] });
    playMr1(g);
    expect(kw(g, g.find('p1', 'characters', MR1))).not.toContain('Unblockable');
    expect(kw(g, g.find('p1', 'characters', VAN.marco))).not.toContain('Unblockable');
  });

  it('"during this turn": the Leader no longer has [Unblockable] on its next turn', () => {
    const g = game(CROC);
    playMr1(g);
    toMyNextMain(g);
    expect(kw(g, g.leader('p1'))).not.toContain('Unblockable');
    expect(cardIds(g, 'p1', 'characters')).toContain(MR1);
  });
});
