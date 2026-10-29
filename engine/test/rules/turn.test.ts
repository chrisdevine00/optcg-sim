/** CR 6: turn structure, DON!!, and every modifier duration tier (rulings section C). */
import { describe, expect, it } from 'vitest';
import { queries } from '../../src/index.ts';
import { internals } from '../../src/testing.ts';
import { scenario } from '../fixtures/index.ts';
import {
  endTurn,
  give,
  KAIDO,
  LUFFY,
  op,
  PUR_1,
  RED_1,
  RED_5,
  startedGame,
  times,
  types,
} from '../support/game.ts';

const deck = times(10, RED_1);
const pdeck = times(10, PUR_1);

describe('first turns (RL-28)', () => {
  it('CR 6-3-1: the first player does not draw on turn 1; the second player draws on turn 2', () => {
    const g = startedGame(21);
    expect(g.zone('p1', 'hand')).toHaveLength(5);
    endTurn(g);
    expect(queries.turn(g.state)).toMatchObject({ number: 2, activePlayer: 'p2', phase: 'main' });
    expect(g.zone('p2', 'hand')).toHaveLength(6);
  });

  it('CR 6-4-1: 1 DON!! for the first player on turn 1, then 2 per turn', () => {
    const g = startedGame(21);
    expect(queries.don(g.state, 'p1')).toEqual({ deck: 9, active: 1, rested: 0, given: 0 });
    endTurn(g);
    expect(queries.don(g.state, 'p2')).toEqual({ deck: 8, active: 2, rested: 0, given: 0 });
    endTurn(g);
    expect(queries.don(g.state, 'p1')).toMatchObject({ deck: 7, active: 3 });
  });

  it('CR 6-5-6-1: neither player can battle on their first turn; turn 3 can', () => {
    const g = startedGame(21);
    expect(g.legal().some((a) => a.type === 'attack')).toBe(false);
    expect(
      g.isLegal({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2'), player: 'p1' }),
    ).toBe(false);
    endTurn(g);
    expect(g.legal().some((a) => a.type === 'attack')).toBe(false);
    endTurn(g);
    expect(g.legal()).toContainEqual({
      type: 'attack',
      attacker: g.leader('p1'),
      target: g.leader('p2'),
      player: 'p1',
    });
  });
});

describe('DON!! Phase edge cases', () => {
  it('CR 6-4-2 / 6-4-3: 1 DON!! placed when 1 remains, none when 0 remain', () => {
    const g = scenario({
      turn: 4,
      activePlayer: 'p2',
      phase: 'refresh',
      p1: { leader: LUFFY, deck },
      p2: { leader: KAIDO, deck: pdeck, donDeck: 1, costArea: { active: 0, rested: 9 } },
    });
    expect(queries.don(g.state, 'p2')).toEqual({ deck: 0, active: 10, rested: 0, given: 0 });
    const h = scenario({
      turn: 4,
      activePlayer: 'p2',
      phase: 'don',
      p1: { leader: LUFFY, deck },
      p2: { leader: KAIDO, deck: pdeck, donDeck: 0, costArea: { active: 3, rested: 7 } },
    });
    expect(queries.don(h.state, 'p2')).toEqual({ deck: 0, active: 3, rested: 7, given: 0 });
  });
});

describe('Refresh Phase (CR 6-2)', () => {
  it('CR 6-2-3 / 6-2-4: given DON!! return rested, then every rested card of the turn player becomes active', () => {
    const g = scenario({
      turn: 2,
      activePlayer: 'p2',
      p1: { leader: LUFFY, deck },
      p2: {
        leader: { card: KAIDO, rested: true, don: 2 },
        characters: [{ card: PUR_1, rested: true, don: 1 }],
        deck: pdeck,
        costArea: { active: 0, rested: 4 },
      },
    });
    const ev = [...endTurn2(g)];
    // p1's turn 3 refresh refreshes p1 only; check p2 at p2's turn 4.
    expect(ev.length).toBeGreaterThan(0);
    endTurn(g);
    expect(queries.turn(g.state).activePlayer).toBe('p2');
    expect(queries.don(g.state, 'p2')).toEqual({ deck: 1, active: 9, rested: 0, given: 0 });
    expect(g.card(g.leader('p2')).rested).toBe(false);
    expect(g.zone('p2', 'characters')[0]).toMatchObject({ rested: false, don: 0 });
    const order = types(g.events);
    const back = order.lastIndexOf('DonReturned');
    const refreshed = order.lastIndexOf('Refreshed');
    expect(back).toBeLessThan(refreshed);
  });

  it("CR 6-2-4: only the turn player's cards become active", () => {
    const g = scenario({
      turn: 2,
      activePlayer: 'p2',
      p1: { leader: { card: LUFFY, rested: true }, deck, costArea: { active: 0, rested: 2 } },
      p2: { leader: KAIDO, deck: pdeck },
    });
    endTurn(g); // p1's turn 3
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(queries.don(g.state, 'p1')).toMatchObject({ active: 4, rested: 0 });
  });

  it('CR 6-2-1 / 6-2-2: "until the start of your next turn" ends before start-of-turn effects', () => {
    const g = scenario({ p1: { leader: LUFFY, deck }, p2: { leader: KAIDO, deck: pdeck } });
    const leader = g.leader('p1');
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'power',
        target: leader,
        amount: 3000,
        controller: 'p1',
        duration: { kind: 'untilStartOfNextTurn', player: 'p1' },
      },
    });
    give(g, LUFFY, [
      {
        id: 'sot',
        kind: 'auto',
        when: ['startOfYourTurn'],
        effect: [{ op: 'emit', label: 'start' }],
      },
    ]);
    endTurn(g);
    expect(g.power(leader)).toBe(8000); // still on during the opponent's turn 4
    endTurn(g);
    const ev = g.events;
    const expired = ev.findIndex((e) => e.type === 'ModifierExpired' && e.step === '6-2-1');
    const started = ev.findIndex((e) => e.type === 'EffectResolved' && e.label === 'start');
    expect(expired).toBeGreaterThanOrEqual(0);
    expect(expired).toBeLessThan(started);
    expect(g.power(leader)).toBe(5000);
  });
});

function endTurn2(g: ReturnType<typeof scenario>) {
  endTurn(g);
  return g.events;
}

describe('Main Phase (CR 6-5)', () => {
  it('CR 6-5-1: start-of-Main-Phase effects activate before the Main Phase decision', () => {
    const g = scenario({
      phase: 'refresh',
      p1: { leader: LUFFY, deck },
      p2: { leader: KAIDO, deck: pdeck },
    });
    expect(queries.turn(g.state).phase).toBe('main');
    const h = scenario({
      turn: 2,
      activePlayer: 'p2',
      p1: { leader: LUFFY, deck },
      p2: { leader: KAIDO, deck: pdeck },
    });
    give(h, LUFFY, [
      {
        id: 'm',
        kind: 'auto',
        when: ['startOfMainPhase'],
        effect: [{ op: 'emit', label: 'main' }],
      },
    ]);
    endTurn(h);
    const i = h.events.findIndex((e) => e.type === 'EffectResolved' && e.label === 'main');
    const p = h.events.findIndex(
      (e) => e.type === 'PhaseChanged' && e.phase === 'main' && e.turn === 3,
    );
    expect(p).toBeLessThan(i);
  });

  it('CR 6-5-2-1: ending the Main Phase moves to the End Phase', () => {
    const g = scenario({ p1: { leader: LUFFY, deck }, p2: { leader: KAIDO, deck: pdeck } });
    const ev = g.act({ type: 'endTurn' });
    expect(ev.find((e) => e.type === 'PhaseChanged' && e.phase === 'end')).toBeTruthy();
  });

  it('CR 6-5-5-1 / 6-5-5-3: giving needs an active cost-area DON!!, and repeats freely', () => {
    const g = scenario({
      p1: { leader: LUFFY, characters: [RED_1], costArea: { active: 2, rested: 1 } },
      p2: { leader: KAIDO },
    });
    const ch = g.find('p1', 'characters', RED_1);
    g.act({ type: 'giveDon', target: ch });
    g.act({ type: 'giveDon', target: ch });
    expect(g.card(ch).don).toBe(2);
    expect(g.legal().some((a) => a.type === 'giveDon')).toBe(false);
    expect(queries.don(g.state, 'p1')).toEqual({ deck: 7, active: 0, rested: 1, given: 2 });
  });

  it("CR 6-5-5-2: each given DON!! is +1000 on its owner's turn only (RL-13)", () => {
    const g = scenario({
      p1: { leader: LUFFY, characters: [{ card: RED_5, don: 2 }], deck },
      p2: { leader: KAIDO, deck: pdeck },
    });
    const ch = g.find('p1', 'characters', RED_5);
    expect(g.power(ch)).toBe(8000);
    endTurn(g);
    expect(g.card(ch)).toMatchObject({ don: 2, power: 6000 });
  });
});

describe('End Phase (CR 6-6)', () => {
  const mk = () =>
    scenario({
      p1: { leader: LUFFY, characters: [RED_5], deck },
      p2: { leader: KAIDO, characters: [PUR_1], deck: pdeck },
    });

  it("CR 6-6-1-1: [End of Your Turn] (turn player) resolves before [End of Your Opponent's Turn]", () => {
    const g = mk();
    give(g, LUFFY, [
      { id: 'e', kind: 'auto', when: ['endOfYourTurn'], effect: [{ op: 'emit', label: 'mine' }] },
    ]);
    give(g, KAIDO, [
      {
        id: 'e',
        kind: 'auto',
        when: ['endOfOpponentsTurn'],
        effect: [{ op: 'emit', label: 'theirs' }],
      },
    ]);
    const ev = g.act({ type: 'endTurn' });
    expect(ev.filter((e) => e.type === 'EffectResolved').map((e) => e.label)).toEqual([
      'mine',
      'theirs',
    ]);
  });

  it('CR 6-6-1-2 then 6-6-1-3: "until end of turn" expires before "during this turn", after end triggers (RL-09)', () => {
    const g = mk();
    const ch = g.find('p1', 'characters', RED_5);
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'power',
        target: ch,
        amount: 2000,
        controller: 'p1',
        duration: { kind: 'thisTurn', turn: 3 },
      },
    });
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'power',
        target: ch,
        amount: 1000,
        controller: 'p1',
        duration: { kind: 'untilEndOfTurn', turn: 3 },
      },
    });
    give(g, LUFFY, [
      { id: 'e', kind: 'auto', when: ['endOfYourTurn'], effect: [{ op: 'emit', label: 'end' }] },
    ]);
    expect(g.power(ch)).toBe(9000);
    const ev = g.act({ type: 'endTurn' });
    const iEnd = ev.findIndex((e) => e.type === 'EffectResolved');
    const steps = ev.filter((e) => e.type === 'ModifierExpired').map((e) => e.step);
    expect(steps).toEqual(['6-6-1-2', '6-6-1-3']);
    expect(iEnd).toBeLessThan(ev.findIndex((e) => e.type === 'ModifierExpired'));
    expect(g.power(ch)).toBe(6000);
  });

  it("CR 6-6-1-2: the turn player's modifiers expire before the non-turn player's", () => {
    const g = mk();
    const mine = g.find('p1', 'characters', RED_5);
    const theirs = g.find('p2', 'characters', PUR_1);
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'power',
        target: theirs,
        amount: -1000,
        controller: 'p2',
        duration: { kind: 'untilEndOfTurn', turn: 3 },
      },
    });
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'power',
        target: mine,
        amount: 1000,
        controller: 'p1',
        duration: { kind: 'untilEndOfTurn', turn: 3 },
      },
    });
    const ev = g.act({ type: 'endTurn' });
    expect(ev.filter((e) => e.type === 'ModifierExpired').map((e) => e.target)).toEqual([
      mine,
      theirs,
    ]);
  });

  it('CR 6-6-1-4: the turn passes and Once Per Turn marks reset', () => {
    const g = mk();
    const ev = g.act({ type: 'endTurn' });
    expect(types(ev)).toContain('TurnEnded');
    expect(queries.turn(g.state)).toMatchObject({ number: 4, activePlayer: 'p2' });
    expect(internals(g.state).oncePerTurn).toEqual([]);
  });

  it('RL-11: "until the end of your opponent\'s next End Phase" ends at 6-6-1-2 (2) of that turn', () => {
    const g = mk();
    const leader = g.leader('p1');
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'basePower',
        target: leader,
        amount: 6000,
        controller: 'p1',
        duration: { kind: 'untilEndOfOpponentsNextEndPhase', player: 'p1', after: 3 },
      },
    });
    give(g, KAIDO, [
      { id: 'e', kind: 'auto', when: ['endOfYourTurn'], effect: [{ op: 'emit', label: 'p2-end' }] },
    ]);
    expect(g.power(leader)).toBe(6000);
    endTurn(g); // p1's End Phase: still on
    expect(g.power(leader)).toBe(6000);
    const ev = g.act({ type: 'endTurn' }); // p2's End Phase: ends at 6-6-1-2 after p2's end trigger
    const iTrig = ev.findIndex((e) => e.type === 'EffectResolved' && e.label === 'p2-end');
    const iExp = ev.findIndex((e) => e.type === 'ModifierExpired' && e.step === '6-6-1-2');
    expect(iTrig).toBeLessThan(iExp);
    expect(g.power(leader)).toBe(5000);
  });

  it('RL-11 / D-2: "until the end of your next turn" (untilEndOfTurn with a later turn) lasts through it', () => {
    const g = mk();
    const ch = g.find('p1', 'characters', RED_5);
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'power',
        target: ch,
        amount: 1000,
        controller: 'p1',
        duration: { kind: 'untilEndOfTurn', turn: 5 },
      },
    });
    endTurn(g);
    endTurn(g);
    expect(g.power(ch)).toBe(7000); // turn 5, still on
    endTurn(g);
    expect(g.power(ch)).toBe(6000);
  });

  it('whileSource: a modifier lasts only while its source stays on the field (RL-12 permanent case)', () => {
    const g = scenario({
      p1: { leader: LUFFY, characters: [RED_1, RED_5] },
      p2: { leader: KAIDO },
    });
    const src = g.find('p1', 'characters', RED_1);
    const ch = g.find('p1', 'characters', RED_5);
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'power',
        target: ch,
        amount: 1000,
        controller: 'p1',
        source: src,
        duration: { kind: 'whileSource', source: src },
      },
    });
    expect(g.power(ch)).toBe(7000);
    op(g, { op: 'trashFromField', card: src, by: 'p2' });
    expect(g.power(ch)).toBe(6000);
  });

  it('RL-12: a resolved "during this turn" boost outlives its source leaving the field', () => {
    const g = scenario({ p1: { leader: LUFFY, characters: [RED_1] }, p2: { leader: KAIDO } });
    const src = g.find('p1', 'characters', RED_1);
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'power',
        target: g.leader('p1'),
        amount: 2000,
        controller: 'p1',
        source: src,
        duration: { kind: 'thisTurn', turn: 3 },
      },
    });
    op(g, { op: 'bounce', card: src, by: 'p2' });
    expect(g.power(g.leader('p1'))).toBe(7000);
  });
});
