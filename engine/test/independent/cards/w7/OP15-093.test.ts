/**
 * OP15-093 The Risky Brothers (Character, Black, cost 1, 2000, Counter +1000, <Slash>, {Rolling
 * Pirates}).
 *
 * Card text: "[Activate: Main] You may trash this Character: If you have 15 or more cards in your
 * trash, up to 1 of your [Monkey.D.Luffy] Characters gains [Rush: Character] and the "Slash"
 * attribute during this turn."
 *
 * Rules used: the cost (trashing this Character) is paid on activation, so this Character is one of
 * the cards in the trash when the "If" is read; the "If" after the colon is an effect condition (the
 * cost is spent when it fails); "up to 1" may be none; [Rush: Character] lets a Character attack
 * Characters (not the Leader) the turn it is played; a granted attribute is read by every card that
 * cares about attributes (here OP12-036 Zoro's "cannot be K.O.'d in battle by <Slash> cards"); the
 * view has no attribute list, so the attribute is observed through that Zoro (API gap noted).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, attackTargets, cardIds } from '../../helpers.ts';
import { abilities, accept, canActivate, choices, decline, kind, offered } from '../kit.ts';
import { canDone, done, fill, mine7, need, now, S7 } from './kit-w7b.ts';

const RISKY = 'OP15-093';
const LUFFY = 'P-041'; // Monkey.D.Luffy, cost 10, 12000, vanilla, <Strike>
const FILLER = S7.marco; // trash filler

/** p1 with Risky Brothers, a Luffy that was played this turn, and `trash` cards in the trash. */
function game(trash: number, p1 = {}, p2 = {}) {
  return mine7(
    S7.slashSupernova,
    {
      characters: [RISKY, { card: LUFFY, playedThisTurn: true }],
      trash: fill(FILLER, trash),
      ...p1,
    },
    { characters: [{ card: S7.kingdew, rested: true }], ...p2 },
  );
}

/** Activate Risky Brothers; pick `targets` (instances) if a pick is asked; otherwise end the pick. */
function run(g: ReturnType<typeof game>, targets: string[] | 'first' = 'first') {
  const risky = g.find('p1', 'characters', RISKY);
  act(g, { type: 'activate', card: risky, ability: abilities(g, risky)[0]! });
  if (offered(g, 'p1')) accept(g);
  if (kind(g) === 'choose') {
    if (targets === 'first') act(g, { type: 'pick', choice: choices(g)[0]! });
    else for (const t of targets) act(g, { type: 'pick', choice: t });
    if (kind(g) === 'choose' && canDone(g)) done(g);
  }
}

const luffy = (g: ReturnType<typeof game>) => g.find('p1', 'characters', LUFFY);

describe('OP15-093 The Risky Brothers: trash this Character: with 15+ cards in the trash a [Monkey.D.Luffy] Character gains [Rush: Character] and <Slash> this turn', () => {
  it('printed values: cost 1, 2000 power, Counter +1000', () => {
    const g = game(0);
    const r = g.card(g.find('p1', 'characters', RISKY));
    expect(r.cost).toBe(1);
    expect(r.power).toBe(2000);
    expect(r.counter).toBe(1000);
  });

  it('14 cards already in the trash + this Character = 15: Luffy gains [Rush: Character] and can attack a Character the turn it was played, not the Leader', () => {
    const g = game(14);
    expect(attackTargets(g, luffy(g))).toEqual([]);
    run(g);
    expect(g.card(luffy(g)).keywords).toContain('Rush: Character');
    expect(cardIds(g, 'p1', 'trash').length).toBe(15);
    expect(cardIds(g, 'p1', 'characters')).toEqual([LUFFY]);
    const targets = attackTargets(g, luffy(g));
    expect(targets).toEqual([g.find('p2', 'characters', S7.kingdew)]);
    expect(targets).not.toContain(g.leader('p2'));
  });

  it('13 cards + this Character = 14: the cost is paid, nothing is granted', () => {
    const g = game(13);
    run(g);
    expect(cardIds(g, 'p1', 'trash').length).toBe(14);
    expect(g.card(luffy(g)).keywords).not.toContain('Rush: Character');
    expect(attackTargets(g, luffy(g))).toEqual([]);
  });

  it('more than 15 also works', () => {
    const g = game(20);
    run(g);
    expect(g.card(luffy(g)).keywords).toContain('Rush: Character');
  });

  it('the granted <Slash> attribute counts: a <Slash> Luffy does not K.O. a Zoro (OP12-036) with a <Slash> Leader', () => {
    const g = game(
      14,
      {},
      { leader: S7.slashSupernova, characters: [{ card: 'OP12-036', rested: true }] },
    );
    run(g);
    attack(g, luffy(g), g.find('p2', 'characters', 'OP12-036'));
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    expect(cardIds(g, 'p2', 'characters')).toEqual(['OP12-036']);
  });

  it('control: without the grant a Luffy (<Strike>) that may attack does K.O. that Zoro', () => {
    const g = mine7(
      S7.slashSupernova,
      { characters: [LUFFY] },
      { leader: S7.slashSupernova, characters: [{ card: 'OP12-036', rested: true }] },
    );
    attack(g, g.find('p1', 'characters', LUFFY), g.find('p2', 'characters', 'OP12-036'));
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
  });

  it('it lasts this turn only: the keyword is gone in my next turn', () => {
    const g = game(14);
    run(g);
    expect(g.card(luffy(g)).keywords).toContain('Rush: Character');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(g.card(luffy(g)).keywords).not.toContain('Rush: Character');
  });

  it('"up to 1": choosing nothing still pays the cost (Risky Brothers is trashed) and grants nothing', () => {
    const g = game(14);
    const risky = g.find('p1', 'characters', RISKY);
    act(g, { type: 'activate', card: risky, ability: abilities(g, risky)[0]! });
    if (offered(g, 'p1')) accept(g);
    need(g, 'choose', 'p1');
    expect(canDone(g)).toBe(true);
    done(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([LUFFY]);
    expect(g.card(luffy(g)).keywords).not.toContain('Rush: Character');
    expect(cardIds(g, 'p1', 'trash').length).toBe(15);
  });

  it("only [Monkey.D.Luffy] Characters are offered: not other Characters, not my Leader named Luffy, not the opponent's Luffy", () => {
    const g = mine7(
      S7.luffyLeader,
      {
        characters: [RISKY, { card: LUFFY, playedThisTurn: true }, S7.marco],
        trash: fill(FILLER, 14),
      },
      { characters: [LUFFY] },
    );
    const risky = g.find('p1', 'characters', RISKY);
    act(g, { type: 'activate', card: risky, ability: abilities(g, risky)[0]! });
    if (offered(g, 'p1')) accept(g);
    expect(choices(g)).toEqual([g.find('p1', 'characters', LUFFY)]);
  });

  it('two [Monkey.D.Luffy] Characters: only one of them gets it', () => {
    const g = mine7(
      S7.slashSupernova,
      {
        characters: [
          RISKY,
          { card: LUFFY, playedThisTurn: true },
          { card: LUFFY, playedThisTurn: true },
        ],
        trash: fill(FILLER, 14),
      },
      { characters: [{ card: S7.kingdew, rested: true }] },
    );
    run(g, 'first');
    const rushers = g
      .zone('p1', 'characters')
      .filter((c) => g.card(c.instance).keywords.includes('Rush: Character'));
    expect(rushers.length).toBe(1);
  });

  it('with no [Monkey.D.Luffy] Character on my field the ability can still be activated and only the cost is paid', () => {
    const g = mine7(S7.slashSupernova, { characters: [RISKY, S7.marco], trash: fill(FILLER, 14) });
    const risky = g.find('p1', 'characters', RISKY);
    expect(canActivate(g, risky)).toBe(true);
    act(g, { type: 'activate', card: risky, ability: abilities(g, risky)[0]! });
    if (offered(g, 'p1')) accept(g);
    if (kind(g) === 'choose' && canDone(g)) done(g);
    expect(kind(g), now(g)).toBe('main');
    expect(cardIds(g, 'p1', 'characters')).toEqual([S7.marco]);
  });

  it('it can be used the turn Risky Brothers is played (an [Activate: Main] has no rest cost)', () => {
    const g = game(14, {
      characters: [
        { card: RISKY, playedThisTurn: true },
        { card: LUFFY, playedThisTurn: true },
      ],
    });
    expect(canActivate(g, g.find('p1', 'characters', RISKY))).toBe(true);
  });

  it('declining where the engine offers a "you may" question: nothing is trashed', () => {
    const g = game(14);
    const risky = g.find('p1', 'characters', RISKY);
    act(g, { type: 'activate', card: risky, ability: abilities(g, risky)[0]! });
    if (offered(g, 'p1')) {
      decline(g);
      expect(cardIds(g, 'p1', 'characters').sort()).toEqual([LUFFY, RISKY].sort());
      expect(cardIds(g, 'p1', 'trash').length).toBe(14);
    } else {
      // No question: choosing to activate is choosing to pay (the cost is already paid).
      expect(cardIds(g, 'p1', 'trash').length).toBe(15);
    }
  });
});
