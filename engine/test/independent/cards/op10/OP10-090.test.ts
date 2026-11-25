/**
 * OP10-090 Franky (Character, Black, cost 4, 5000, Counter +1000, {Straw Hat Crew}/{Dressrosa}).
 *
 * Card text: "[Blocker] [On K.O.] Play up to 1 "Dressrosa" type Character card with a cost of 3 or
 * less from your trash rested."
 *
 * Rules: CR 10-2-17 ([On K.O.] resolves with the card in the trash; it activates for a battle or an
 * effect K.O.); "up to 1" may choose none; "rested" means the played card enters rested.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  blockers,
  chr,
  choices,
  koBattle,
  koGame,
  LD10,
  need,
  none,
  offeredIds,
  passCounter,
  pickInst,
  playRaw,
  SC10,
  SC14,
  skipEmpty,
  theirs,
  trash,
  zoneIds,
  kind,
} from './kit-op10c.ts';

const ID = 'OP10-090';

const TRASH = [SC10.dr2, SC10.dr3, SC10.dr5, SC14.c2];

function ko(trashCards: string[] = TRASH, p1chars: string[] = []) {
  return koGame(ID, { leader: LD10.plain, p1: { trash: trashCards }, p1chars });
}

describe('OP10-090 Franky [Blocker] / [On K.O.] play a Dressrosa cost <= 3 from the trash, rested', () => {
  it('after a battle K.O., offers exactly the {Dressrosa} Characters of cost 3 or less in the trash', () => {
    const g = ko();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC10.dr2, SC10.dr3].sort());
  });

  it('the chosen Character is played rested', () => {
    const g = ko();
    pickInst(g, [g.find('p1', 'trash', SC10.dr3)]);
    need(g, 'main', 'p2');
    const c = chr(g, 'p1', SC10.dr3);
    expect(g.card(c).rested).toBe(true);
    expect(trash(g)).toEqual([ID, SC10.dr2, SC10.dr5, SC14.c2].sort());
  });

  it('a Character of cost 5 and a non-{Dressrosa} Character of cost 2 are not offered', () => {
    const g = ko();
    expect(offeredIds(g)).not.toContain(SC10.dr5);
    expect(offeredIds(g)).not.toContain(SC14.c2);
  });

  it('Franky himself (cost 4) is not offered from the trash', () => {
    const g = ko([]);
    expect(choices(g)).toEqual([]);
  });

  it('"up to 1": may play nothing', () => {
    const g = ko();
    none(g);
    need(g, 'main', 'p2');
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g)).toHaveLength(5);
  });

  it('plays at most 1 even when several qualify', () => {
    const g = ko();
    pickInst(g, [g.find('p1', 'trash', SC10.dr2)]);
    need(g, 'main', 'p2');
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SC10.dr2]);
  });

  it('with nothing eligible in the trash nothing is played (no card of cost <= 3 {Dressrosa})', () => {
    const g = ko([SC10.dr5, SC14.c1]);
    skipEmpty(g);
    need(g, 'main', 'p2');
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('works with a full Character area: Franky leaves first, so no Character has to be trashed', () => {
    const g = ko(TRASH, [SC14.c1, SC14.c2, SC14.c3, SC14.c4]);
    pickInst(g, [g.find('p1', 'trash', SC10.dr3)]);
    need(g, 'main', 'p2');
    expect(g.zone('p1', 'characters')).toHaveLength(5);
    expect(trash(g)).toEqual([ID, SC10.dr2, SC10.dr5, SC14.c2].sort());
  });

  it('a K.O. by an effect also triggers it', () => {
    const g = theirs(
      LD10.plain,
      { characters: [ID], trash: TRASH },
      { hand: ['OP09-077'], costArea: { active: 10, rested: 0 } },
    );
    playRaw(g, 'OP09-077');
    for (let i = 0; i < 6; i++) {
      const o = g.legal().find((a) => a.type === 'optional' && a.accept);
      const p = g.legal().find((a) => a.type === 'pick');
      const next = o ?? p;
      if (!next || (kind(g) === 'choose' && g.decider === 'p1')) break;
      act(g, next as never);
    }
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC10.dr2, SC10.dr3].sort());
  });

  it("as a Blocker it can block, and being K.O.'d while blocking triggers the effect", () => {
    const g = theirs(LD10.plain, { characters: [ID], trash: TRASH }, { characters: [SC14.c5] });
    attack(g, g.find('p2', 'characters', SC14.c5), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    passCounter(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC10.dr2, SC10.dr3].sort());
    void koBattle;
  });
});
