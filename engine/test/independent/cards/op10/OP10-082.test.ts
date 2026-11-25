/**
 * OP10-082 Kuzan (Character, Black, cost 5, 5000, no Counter, {Blackbeard Pirates}/{Former Navy}).
 *
 * Card text: "This Character cannot be removed from the field by your opponent's effects.
 * [Activate: Main] You may trash this Character: Draw 1 card. Then, play up to 1 "Blackbeard
 * Pirates" type Character card with a cost of 5 or less other than [Kuzan] from your trash."
 *
 * Rules: CR 1-3-2 (an effect that cannot happen is ignored; the target may still be chosen),
 * removal by battle is not an effect, CR 8-3-1-4 (the trash is a cost), "up to" (CR 8-4-4-1).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  BLUE,
  chr,
  choices,
  deck,
  hand,
  kind,
  LD10,
  koBattle,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  rawActivate,
  SC10,
  SC14,
  theirs,
  trash,
  zoneIds,
} from './kit-op10c.ts';

const ID = 'OP10-082';

function game(trashCards: string[], o: { chars?: string[]; deckTop?: string } = {}) {
  return mine(LD10.plain, {
    characters: [ID, ...(o.chars ?? [])],
    trash: trashCards,
    deck: [o.deckTop ?? SC10.dr3, BLUE, BLUE],
  });
}

function kuzan(g: ReturnType<typeof game>) {
  return g.find('p1', 'characters', ID);
}

describe('OP10-082 Kuzan: untouchable by opposing effects; [Activate: Main] trash self, draw, play {Blackbeard Pirates}', () => {
  it('activating trashes Kuzan, draws 1, then plays the chosen {Blackbeard Pirates} cost-4 Character from the trash', () => {
    const g = game([SC10.bbp4, SC10.dr2]);
    rawActivate(g, kuzan(g));
    expect(hand(g)).toEqual([SC10.dr3]);
    expect(offeredIds(g)).toEqual([SC10.bbp4]);
    pickInst(g, [g.find('p1', 'trash', SC10.bbp4)]);
    need(g, 'main', 'p1');
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SC10.bbp4]);
    expect(g.card(chr(g, 'p1', SC10.bbp4)).rested).toBe(false);
    expect(trash(g)).toEqual([ID, SC10.dr2].sort());
  });

  it('boundary: cost 5 is allowed, cost 6 is not', () => {
    const g = game([SC10.bbp5, SC10.bbp6]);
    rawActivate(g, kuzan(g));
    expect(offeredIds(g)).toEqual([SC10.bbp5]);
  });

  it('only {Blackbeard Pirates} Characters: a Dressrosa Character of cost 3 is not offered', () => {
    const g = game([SC10.dr3, SC10.bbp4]);
    rawActivate(g, kuzan(g));
    expect(offeredIds(g)).toEqual([SC10.bbp4]);
  });

  it('"other than [Kuzan]": a second [Kuzan] in the trash is not offered, nor is the one just trashed', () => {
    const g = game([SC10.kuzan, SC10.bbp4]);
    rawActivate(g, kuzan(g));
    expect(offeredIds(g)).toEqual([SC10.bbp4]);
    expect(zoneIds(g, 'p1', 'trash')).toEqual([ID, SC10.kuzan, SC10.bbp4].sort());
  });

  it('"up to 1": may play nothing; the card was still drawn and Kuzan stays trashed', () => {
    const g = game([SC10.bbp4]);
    rawActivate(g, kuzan(g));
    none(g);
    need(g, 'main', 'p1');
    expect(hand(g)).toEqual([SC10.dr3]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g)).toEqual([ID, SC10.bbp4].sort());
  });

  it('draws even with nothing to play, and plays at most 1 when two qualify', () => {
    const g = game([]);
    rawActivate(g, kuzan(g));
    expect(hand(g)).toEqual([SC10.dr3]);
    if (kind(g) === 'choose') none(g);
    need(g, 'main', 'p1');
    const h = game([SC10.bbp4, SC10.bbp5]);
    rawActivate(h, kuzan(h));
    expect(choices(h)).toHaveLength(2);
    pickInst(h, [h.find('p1', 'trash', SC10.bbp5)]);
    need(h, 'main', 'p1');
    expect(zoneIds(h, 'p1', 'characters')).toEqual([SC10.bbp5]);
    expect(trash(h)).toEqual([ID, SC10.bbp4].sort());
  });

  it('with 5 Characters including Kuzan, trashing him frees the slot: no Character has to be trashed', () => {
    const g = game([SC10.bbp4], { chars: [SC14.c1, SC14.c2, SC14.c3, SC14.c4] });
    rawActivate(g, kuzan(g));
    pickInst(g, [g.find('p1', 'trash', SC10.bbp4)]);
    need(g, 'main', 'p1');
    expect(g.zone('p1', 'characters')).toHaveLength(5);
    expect(zoneIds(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('an opposing K.O. effect cannot remove Kuzan', () => {
    const g = theirs(
      LD10.plain,
      { characters: [ID] },
      { hand: ['OP09-077'], costArea: { active: 10, rested: 0 } },
    );
    const before = zoneIds(g, 'p1', 'characters');
    playRaw(g, 'OP09-077');
    // Cost DON!! -2, then (maybe) a target. Whatever is asked, taking Kuzan must not remove him.
    for (let i = 0; i < 6 && kind(g) !== 'main'; i++) {
      const pick = g.legal().find((a) => a.type === 'pick');
      const opt = g.legal().find((a) => a.type === 'optional' && a.accept);
      const a = opt ?? pick ?? g.legal().find((x) => x.type === 'done');
      if (!a) break;
      act(g, a as never);
    }
    expect(zoneIds(g, 'p1', 'characters')).toEqual(before);
    expect(trash(g)).toEqual([]);
    expect(trash(g, 'p2')).toEqual(['OP09-077']); // the Event really resolved
  });

  it('an opposing "place at the bottom of the deck" effect cannot remove Kuzan', () => {
    const g = theirs(
      LD10.plain,
      { characters: [ID] },
      { hand: ['OP10-060'], costArea: { active: 10, rested: 0 } },
    );
    playRaw(g, 'OP10-060');
    if (kind(g) === 'choose' && choices(g).includes(kuzan(g))) pickInst(g, [kuzan(g)]);
    for (let i = 0; i < 4 && kind(g) === 'choose'; i++) {
      const a = g.legal().find((x) => x.type === 'done');
      if (!a) break;
      act(g, a as never);
    }
    expect(zoneIds(g, 'p1', 'characters')).toEqual([ID]);
    expect(deck(g)).toHaveLength(15);
    expect(trash(g, 'p2')).toEqual(['OP10-060']); // the Event really resolved
  });

  it("battle is not an effect: Kuzan can still be K.O.'d by an attack", () => {
    const g = theirs(
      LD10.plain,
      { characters: [{ card: ID, rested: true }] },
      { characters: [SC14.c5] },
    );
    koBattle(g, kuzan(g), g.find('p2', 'characters', SC14.c5));
    expect(trash(g)).toEqual([ID]);
  });
});
