/** OP13-021 Gum-Gum Gatling Gun. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, none, pick, play, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { ACE_CHAR, LUFFY_CHAR, LUFFY_LEADER, mk, PLAIN_BLUE } from './helpers-op13g1.ts';

const ID = 'OP13-021';

describe('OP13-021 Gum-Gum Gatling Gun', () => {
  const start = (p1 = {}, p2 = {}) =>
    mk({ hand: [ID], characters: [LUFFY_CHAR], ...p1 }, { characters: [V.c4], ...p2 });

  it('[Main]: gives up to 1 rested DON!! to 1 of your [Monkey.D.Luffy] cards, then an opposing Character gets -2000', () => {
    const g = start();
    play(g, ID);
    const luffy = g.find('p1', 'characters', LUFFY_CHAR);
    pick(g, [luffy]);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(luffy).don).toBe(1);
    expect(g.power(luffy)).toBe(6000);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(4000);
    expect(don(g, 'p1')).toMatchObject({ given: 1, rested: 0 });
  });

  it('your Leader may take the DON!! (it is a [Monkey.D.Luffy] card); [Portgas.D.Ace] cards are not offered', () => {
    const g = start({ characters: [LUFFY_CHAR, ACE_CHAR] });
    play(g, ID);
    const offered = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(offered.sort()).toEqual([g.leader('p1'), g.find('p1', 'characters', LUFFY_CHAR)].sort());
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('"up to 1": the DON!! may be skipped and the -2000 still applies; and the -2000 may be skipped', () => {
    const g = start();
    play(g, ID);
    none(g);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(don(g, 'p1')).toMatchObject({ given: 0 });
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(4000);

    const h = start();
    play(h, ID);
    pick(h, [h.find('p1', 'characters', LUFFY_CHAR)]);
    none(h);
    expect(h.power(h.find('p2', 'characters', V.c4))).toBe(6000);
  });

  it('"Then" is not "if you do": with no [Monkey.D.Luffy] card, nothing is given but the -2000 still applies', () => {
    const g = start({ leader: PLAIN_BLUE, characters: [ACE_CHAR] });
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(don(g, 'p1')).toMatchObject({ given: 0 });
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(4000);
  });

  it('only RESTED DON!! are given: the Event paid for with the single DON!! it costs', () => {
    const g = start({ costArea: { active: 3, rested: 0 } });
    play(g, ID);
    pick(g, [g.leader('p1')]);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 0, given: 1 });
  });

  it("[Trigger]: gives up to 1 of your opponent's Characters -2000 power (no DON!! given)", () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER }, { characters: [V.c4] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(4000);
    expect(don(g, 'p1')).toMatchObject({ given: 0 });
    expectDecision(g, 'main', 'p2');
  });
});
