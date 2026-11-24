/**
 * OP14-086 Miss Doublefinger(Zala) (Character, Black, cost 5, 6000, Counter +1000, {Baroque Works}).
 *
 * Card text: "If you have 7 or more cards in your trash, this Character gains +1000 power, and all of
 * your Characters with a type including "Baroque Works" gain +2 cost."
 *
 * Rules: a permanent effect applies while its condition holds and stops the moment it does not
 * (CR 8-1-3-3), on both players' turns; "type including" is a substring match; the trash count is
 * the number of cards in MY trash; a cost effect changes the current cost (derive), which matters for
 * cost-limited effects.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  backToMain,
  CAMIE,
  chr,
  LD14,
  mine,
  need,
  offeredAbilities,
  offeredIds,
  playRaw,
  SC14,
  theirs,
} from './kit-op14c.ts';

const ID = 'OP14-086';
const WEDNESDAY = 'OP14-083'; // Black, cost 1, 1000, {Baroque Works}; [Activate: Main] may trash this: ...
const MR9 = SC14.bw5; // Black, cost 5, 6000, {Baroque Works}
const FORMER1 = 'OP02-063'; // Blue, cost 1, 1000, {Impel Down}/{Former Baroque Works}
const junk = (n: number) => Array.from({ length: n }, () => SC14.c1);

function game(trashN: number, p1chars: string[] = [ID], p2chars: string[] = []) {
  return mine(
    LD14.bw,
    { characters: p1chars, trash: junk(trashN), costArea: { active: 3, rested: 0 } },
    { characters: p2chars },
  );
}

describe('OP14-086 Miss Doublefinger: with 7+ cards in my trash it gains +1000 and my Baroque Works Characters +2 cost', () => {
  it('7 cards in the trash: +1000 power on itself (6000 -> 7000)', () => {
    const g = game(7);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(7000);
  });

  it('boundary: 6 cards in the trash is not enough: 6000 power, cost 5', () => {
    const g = game(6);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(6000);
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(5);
  });

  it('with 7+: all my Baroque Works Characters gain +2 cost, itself included (5 -> 7), Mr.9 too', () => {
    const g = game(7, [ID, MR9, WEDNESDAY]);
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(7);
    expect(g.card(at(g, 'p1', 'characters', MR9)).cost).toBe(7);
    expect(g.card(at(g, 'p1', 'characters', WEDNESDAY)).cost).toBe(3);
  });

  it('with 6 the costs are the printed ones (the +2 needs the same condition)', () => {
    const g = game(6, [ID, MR9, WEDNESDAY]);
    expect(g.card(at(g, 'p1', 'characters', MR9)).cost).toBe(5);
    expect(g.card(at(g, 'p1', 'characters', WEDNESDAY)).cost).toBe(1);
  });

  it('"type including": a {Former Baroque Works} Character gains the +2 cost; a non-Baroque one does not', () => {
    const g = game(7, [ID, FORMER1, SC14.c3]);
    expect(g.card(at(g, 'p1', 'characters', FORMER1)).cost).toBe(3);
    expect(g.card(at(g, 'p1', 'characters', SC14.c3)).cost).toBe(3);
  });

  it('only itself gains the power: my other Baroque Works Characters keep their power', () => {
    const g = game(7, [ID, MR9]);
    expect(g.power(at(g, 'p1', 'characters', MR9))).toBe(6000);
  });

  it('only MY Characters and MY trash: their Baroque Works Character is unchanged, their trash does not count', () => {
    const g = mine(
      LD14.bw,
      { characters: [ID], trash: junk(6) },
      { characters: [MR9], trash: junk(9) },
    );
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(6000);
    expect(g.card(chr(g, 'p2', MR9)).cost).toBe(5);
    const h = game(7, [ID], [MR9]);
    expect(h.card(chr(h, 'p2', MR9)).cost).toBe(5);
  });

  it('it is a permanent effect: it stops the moment the trash count changes, and starts when it reaches 7', () => {
    // 6 cards + Ms. Wednesday trashing itself (her own cost) makes 7.
    const g = game(6, [ID, WEDNESDAY]);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(6000);
    const [ability] = offeredAbilities(g, at(g, 'p1', 'characters', WEDNESDAY));
    act(g, { type: 'activate', card: at(g, 'p1', 'characters', WEDNESDAY), ability: ability! });
    if (g.decider === 'p1' && g.legal().some((a) => a.type === 'done')) act(g, { type: 'done' });
    backToMain(g, 'p1');
    expect(g.zone('p1', 'trash')).toHaveLength(7);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(7000);
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(7);
  });

  it('it applies on the opponent’s turn too', () => {
    const g = theirs(LD14.bw, { characters: [ID, MR9], trash: junk(7) }, {});
    expect(g.card(at(g, 'p1', 'characters', MR9)).cost).toBe(7);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(7000);
  });

  it('it matters for cost-limited effects: their Camie (cost 6 or less) can rest Mr.9 with 6 cards but not with 7', () => {
    const six = theirs(LD14.bw, { characters: [ID, MR9], trash: junk(6) }, { hand: [CAMIE] });
    playRaw(six, CAMIE);
    need(six, 'choose', 'p2');
    expect(offeredIds(six)).toEqual([ID, MR9].sort());
    const seven = theirs(LD14.bw, { characters: [ID, MR9], trash: junk(7) }, { hand: [CAMIE] });
    playRaw(seven, CAMIE);
    if (seven.legal().some((a) => a.type === 'pick')) {
      expect(offeredIds(seven)).toEqual([]);
    }
  });
});
