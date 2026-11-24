/**
 * EB05-024 Little Sadi (Character, Blue, cost 1, 0, Counter +1000, {Impel Down}, Wisdom).
 *
 * Card text: "If your Leader has the {Impel Down} type, this Character gains [Blocker] and +2 cost.
 * (After your opponent declares an attack, you may rest this card to make it the new target of the
 * attack.)"
 *
 * Rules: CR 8-1-3-3 (permanent effect, applies while its condition holds), CR 10-1-4 ([Blocker]),
 * CR 7-1-2 (Block Step), CR 2-8 (cost).
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, fill, passBlock } from '../../helpers.ts';
import { act, don, EL, kind, mine, playCard, RED, theirs, VAN } from './kit-eb05a.ts';

const SADI = 'EB05-024';
/** OP02-049 Emporio.Ivankov: Blue, 5000, 5 Life, {Revolutionary Army}/{Impel Down}. */
const IVANKOV = 'OP02-049';

const sadi = (g: ReturnType<typeof mine>) => g.find('p1', 'characters', SADI);

describe('EB05-024 Little Sadi: with an {Impel Down} Leader this Character gains [Blocker] and +2 cost', () => {
  it('Impel Down Leader: Sadi has [Blocker] and cost 3 (1 + 2)', () => {
    const g = mine(EL.magellan, { characters: [SADI] });
    expect(g.card(sadi(g)).keywords).toContain('Blocker');
    expect(g.card(sadi(g)).cost).toBe(3);
  });

  it('another Leader: no [Blocker] and the printed cost 1', () => {
    const g = mine(EL.croc, { characters: [SADI] });
    expect(g.card(sadi(g)).keywords).not.toContain('Blocker');
    expect(g.card(sadi(g)).cost).toBe(1);
  });

  it('a Leader with {Impel Down} among several types also counts', () => {
    const g = mine(IVANKOV, { characters: [SADI] });
    expect(g.card(sadi(g)).keywords).toContain('Blocker');
    expect(g.card(sadi(g)).cost).toBe(3);
  });

  it('the +2 cost is not paid when playing: Sadi costs her printed 1 DON!! from hand', () => {
    const g = mine(EL.magellan, { hand: [SADI] });
    playCard(g, SADI);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
    expect(g.card(sadi(g)).cost).toBe(3);
  });

  it('as a Blocker she rests and becomes the new target of the attack', () => {
    const g = theirs(
      EL.magellan,
      { characters: [SADI], life: fill(RED, 4) },
      { characters: [VAN.kingdew] },
    );
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.leader('p1'));
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([sadi(g)]);
    act(g, { type: 'block', blocker: sadi(g) });
    expect(g.card(sadi(g)).rested).toBe(true);
    g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
  });

  it('without an {Impel Down} Leader she cannot block', () => {
    const g = theirs(
      EL.croc,
      { characters: [SADI], life: fill(RED, 4) },
      { characters: [VAN.kingdew] },
    );
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
    passBlock(g);
  });

  it('a rested Sadi cannot block even with an {Impel Down} Leader', () => {
    const g = theirs(
      EL.magellan,
      { characters: [{ card: SADI, rested: true }], life: fill(RED, 4) },
      { characters: [VAN.kingdew] },
    );
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('the effect works on the opponent’s turn too (it is permanent, not [Your Turn])', () => {
    const g = theirs(EL.magellan, { characters: [SADI] }, {});
    expect(g.card(sadi(g)).keywords).toContain('Blocker');
    expect(g.card(sadi(g)).cost).toBe(3);
  });

  it('only Sadi herself is affected: another Character of mine gains neither [Blocker] nor cost', () => {
    const g = mine(EL.magellan, { characters: [SADI, VAN.marco] });
    const marco = g.find('p1', 'characters', VAN.marco);
    expect(g.card(marco).keywords).not.toContain('Blocker');
    expect(g.card(marco).cost).toBe(3);
  });
});
