/**
 * OP17-079 Monkey.D.Luffy (Leader, Black, 5000, 5 Life; Straw Hat Crew / The Four Emperors / Elbaph).
 *
 * Card text: "All of your Characters with a cost of 12 or more gain [Blocker]."
 *
 * Rules / rulings: RL-43 (QA-OP17 OP17-079): the check uses the Character's current cost, on the
 * field, continuously (CR 8-1-3-3); normal Blocker rules apply (active, one per battle, CR 10-1-4).
 * Scenery: OP17-089 Jaguar.D.Saul (cost 4, "This Character gains +12 cost" => 16 on the field; named DORRY below for brevity),
 * OP17-094 Rodo (cost 1, +12 with an {Elbaph} Leader => 13), OP17-088 Hajrudin (cost 7, vanilla).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, blockers, decision, noDefence } from '../../helpers.ts';
import { BLUE, LD, RED, V, LEAD, myTurn, side, theirTurn } from './kit-d.ts';

const DORRY = 'OP17-089';
const RODO = 'OP17-094';

describe('OP17-079: Characters with cost 12 or more gain [Blocker]', () => {
  it('a Character at cost 16 (Saul) is offered as a blocker and shows the keyword', () => {
    const g = theirTurn(side(LD.elbaph, BLUE, { characters: [DORRY] }), side(LEAD.luffy, RED));
    const dorry = g.find('p1', 'characters', DORRY);
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(decision(g)).toMatchObject({ kind: 'block', player: 'p1' });
    expect(blockers(g)).toEqual([dorry]);
    expect(g.card(dorry).keywords).toContain('Blocker');
  });

  it('blocking with it redirects the attack: the Leader loses no Life', () => {
    const g = theirTurn(side(LD.elbaph, BLUE, { characters: [DORRY] }), side(LEAD.luffy, RED));
    const dorry = g.find('p1', 'characters', DORRY);
    attack(g, g.leader('p2'), g.leader('p1'));
    act(g, { type: 'block', blocker: dorry });
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });

  it('a Character below cost 12 (Hajrudin, cost 7) does not gain it; only the cost-12+ one is offered', () => {
    const g = theirTurn(
      side(LD.elbaph, BLUE, { characters: [V.hajrudin7, DORRY] }),
      side(LEAD.luffy, RED),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', DORRY)]);
    expect(g.card(g.find('p1', 'characters', V.hajrudin7)).keywords).not.toContain('Blocker');
  });

  it('with only a cost-7 Character there is no Block Step at all', () => {
    const g = theirTurn(
      side(LD.elbaph, BLUE, { characters: [V.hajrudin7] }),
      side(LEAD.luffy, RED),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('CR 8-1-3-3: Rodo (cost 1) reaches 13 under this Leader (Elbaph) and gains [Blocker]', () => {
    const g = theirTurn(side(LD.elbaph, BLUE, { characters: [RODO] }), side(LEAD.luffy, RED));
    const rodo = g.find('p1', 'characters', RODO);
    expect(g.card(rodo).cost).toBe(13);
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([rodo]);
  });

  it('a rested cost-12+ Character cannot block (normal Blocker rules)', () => {
    const g = theirTurn(
      side(LD.elbaph, BLUE, { characters: [{ card: DORRY, rested: true }] }),
      side(LEAD.luffy, RED),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('only your Characters: the opponent’s cost-16 Saul does not gain [Blocker] from this Leader', () => {
    const g = myTurn(side(LD.elbaph, BLUE), side(LEAD.luffy, RED, { characters: [DORRY] }));
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
    expect(g.card(g.find('p2', 'characters', DORRY)).keywords).not.toContain('Blocker');
  });

  it('it is the Leader that grants: under a Leader without the ability Saul has no [Blocker]', () => {
    const g = theirTurn(side(LD.navy, BLUE, { characters: [DORRY] }), side(LEAD.luffy, RED));
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });
});
