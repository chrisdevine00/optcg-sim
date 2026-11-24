/**
 * OP14-082 Oinkchuck (Character, Black, cost 2, 3000, Counter +1000, {Thriller Bark Pirates}).
 *
 * Card text: "[On K.O.] All of your {Thriller Bark Pirates} type Characters gain +4 cost until the end
 * of your opponent's next End Phase.
 * [Trigger] Play up to 1 {Thriller Bark Pirates} type Character card with a cost of 2 or less from
 * your trash rested."
 *
 * Rules: CR 10-2-17 ([On K.O.]), RL-11 ("until the end of your opponent's next End Phase" ends at
 * step 6-6-1-2 of the opponent's End Phase: created on the opponent's turn it ends at that turn's End
 * Phase), [Trigger] (CR 10-2-12; RL-25: the Trigger card is in no area while it resolves, so it cannot
 * be its own target), "up to 1" may be skipped, a played card enters rested when the text says so.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  backToMain,
  BLUE,
  CAMIE,
  chars,
  chr,
  decision,
  endTurn,
  hand,
  kind,
  koGame,
  LD14,
  mayChooseNone,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  SC14,
  theirs,
  trash,
  attack,
  passBlock,
  act,
} from './kit-op14c.ts';

const ID = 'OP14-082';
const KUMACY = 'OP14-102'; // Black, cost 1, 2000, {Thriller Bark Pirates}, vanilla
const JIGORO = 'OP06-084'; // Black, cost 2, 3000, {Thriller Bark Pirates} (script-free scenery)
const RYUMA = 'OP14-089'; // Black, cost 3, 5000, {Thriller Bark Pirates}: too expensive

describe('OP14-082 Oinkchuck [On K.O.] my {Thriller Bark Pirates} Characters gain +4 cost', () => {
  it('after the K.O. every one of my {Thriller Bark Pirates} Characters costs 4 more', () => {
    const g = koGame(ID, { p1chars: [SC14.tbp4, KUMACY] });
    backToMain(g, 'p2');
    expect(g.card(chr(g, 'p1', SC14.tbp4)).cost).toBe(8);
    expect(g.card(chr(g, 'p1', KUMACY)).cost).toBe(5);
    expect(trash(g)).toEqual([ID]);
  });

  it('only {Thriller Bark Pirates}: my other Characters and their Characters are unchanged', () => {
    const g = koGame(ID, { p1chars: [SC14.tbp4, SC14.c3], p2chars: [SC14.tbp4] });
    expect(g.card(chr(g, 'p1', SC14.c3)).cost).toBe(3);
    expect(g.card(chr(g, 'p2', SC14.tbp4)).cost).toBe(4);
  });

  it('it is mandatory and makes no decision: p2 simply continues', () => {
    const g = koGame(ID, { p1chars: [SC14.tbp4] });
    expect(kind(g)).toBe('main');
    expect(decision(g)?.player).toBe('p2');
  });

  it('it matters: their Camie (rest a Character with cost 6 or less) can no longer pick a boosted Lola', () => {
    const g = theirs(
      LD14.dp,
      {
        characters: [{ card: ID, rested: true }, SC14.tbp4, SC14.c3],
        costArea: { active: 3, rested: 0 },
      },
      { hand: [CAMIE], costArea: { active: 9, rested: 0 } },
    );
    attack(g, g.leader('p2'), at(g, 'p1', 'characters', ID));
    passBlock(g);
    act(g, { type: 'endCounter' });
    playRaw(g, CAMIE);
    need(g, 'choose', 'p2');
    // Lola is cost 8 now, Marco is still cost 3.
    expect(offeredIds(g)).toEqual([SC14.c3]);
  });

  it('the bonus ends at the End Phase of the turn it was made in (RL-11): normal cost on my next turn', () => {
    const g = koGame(ID, { p1chars: [SC14.tbp4] });
    expect(g.card(chr(g, 'p1', SC14.tbp4)).cost).toBe(8);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.card(chr(g, 'p1', SC14.tbp4)).cost).toBe(4);
  });
});

describe('OP14-082 Oinkchuck [Trigger] play up to 1 {Thriller Bark Pirates} cost 2 or less from the trash, rested', () => {
  /** p2's Leader hits my Leader; Oinkchuck is my top Life card. */
  function trigger(trashCards: string[]) {
    const g = theirs(
      LD14.dp,
      { life: [ID, BLUE, BLUE, BLUE], trash: trashCards, characters: [] },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p1');
    return g;
  }

  it('activating it offers {Thriller Bark Pirates} Characters with cost 2 or less in the trash', () => {
    const g = trigger([KUMACY, JIGORO, RYUMA, SC14.c1, SC14.tbp4]);
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KUMACY, JIGORO].sort());
  });

  it('the chosen card is played RESTED from the trash', () => {
    const g = trigger([KUMACY, JIGORO]);
    act(g, { type: 'trigger', activate: true });
    pickInst(g, [at(g, 'p1', 'trash', JIGORO)]);
    expect(chars(g)).toEqual([JIGORO]);
    expect(g.card(chr(g, 'p1', JIGORO)).rested).toBe(true);
    expect(trash(g)).toContain(ID);
    expect(trash(g)).toContain(KUMACY);
  });

  it('"up to 1": may play nothing; with two candidates only one is played', () => {
    const g = trigger([KUMACY, JIGORO]);
    act(g, { type: 'trigger', activate: true });
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(chars(g)).toEqual([]);
    const h = trigger([KUMACY, JIGORO]);
    act(h, { type: 'trigger', activate: true });
    pickInst(h, [at(h, 'p1', 'trash', KUMACY)]);
    expect(chars(h)).toEqual([KUMACY]);
  });

  it('it cannot play itself: Oinkchuck is not in the trash while its Trigger resolves', () => {
    const g = trigger([KUMACY]);
    act(g, { type: 'trigger', activate: true });
    if (kind(g) === 'choose') expect(offeredIds(g)).not.toContain(ID);
  });

  it('declining the [Trigger] adds the card to my hand and plays nothing', () => {
    const g = trigger([KUMACY]);
    act(g, { type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ID]);
    expect(chars(g)).toEqual([]);
  });
});
