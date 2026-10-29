/** Projection (ARCHITECTURE §2.7, ADR 0005): CR 3-1-4, 3-2-2, 3-3-2, 3-4-3, 3-5-2, 3-10-2, 3-10-2-1. */
import { describe, expect, it } from 'vitest';
import {
  actionFromView,
  project,
  projectEvents,
  reduce,
  type GameEvent,
  type ProjectedView,
} from '../../src/index.ts';
import { internals } from '../../src/testing.ts';
import { scenario } from '../fixtures/index.ts';
import { KAIDO, LUFFY, newGame, op, PUR_1, RED_1, RED_5, startedGame } from '../support/game.ts';

const mk = () =>
  scenario({
    p1: {
      leader: LUFFY,
      hand: [RED_5, RED_1],
      deck: [RED_1, RED_1],
      life: [RED_1, { card: RED_5, faceUp: true }],
      characters: [RED_1],
      costArea: { active: 2, rested: 0 },
    },
    p2: { leader: KAIDO, hand: [PUR_1, PUR_1], deck: [PUR_1], life: [PUR_1], trash: [PUR_1] },
  });

describe('what each player sees', () => {
  it("CR 3-1-4: every zone's size is public", () => {
    const g = mk();
    const v = project(g.state, 'p2');
    expect(v.zones.p1.hand).toHaveLength(2);
    expect(v.zones.p1.deck).toHaveLength(2);
    expect(v.zones.p1.life).toHaveLength(2);
    expect(v.don.p1).toEqual({ deck: 8, active: 2, rested: 0, given: 0 });
  });

  it("CR 3-2-2 / 3-4-3 / 3-10-2: deck, the opponent's hand and face-down Life show no card", () => {
    const g = mk();
    const v = project(g.state, 'p2');
    expect(v.zones.p1.hand.every((c) => c.card === null)).toBe(true);
    expect(v.zones.p1.deck.every((c) => c.card === null)).toBe(true);
    expect(v.zones.p1.life[0]!.card).toBeNull();
    expect(v.zones.p2.hand.map((c) => c.card)).toEqual([PUR_1, PUR_1]); // own hand visible
    expect(v.zones.p2.deck[0]!.card).toBeNull(); // own deck hidden too
  });

  it('CR 3-10-2-1: a face-up Life card is visible to both players', () => {
    const v = project(mk().state, 'p2');
    expect(v.zones.p1.life[1]).toMatchObject({ card: RED_5, faceUp: true });
  });

  it('CR 3-5-2 / 3-3-2: trash contents and DON!! counts are visible to both', () => {
    const v = project(mk().state, 'p1');
    expect(v.zones.p2.trash.map((c) => c.card)).toEqual([PUR_1]);
    expect(v.don.p2).toEqual({ deck: 10, active: 0, rested: 0, given: 0 });
  });

  it('a view never contains an engine instance id; handles differ per viewer', () => {
    const g = mk();
    const ids = Object.keys(internals(g.state).cards);
    for (const p of ['p1', 'p2'] as const) {
      const json = JSON.stringify(project(g.state, p));
      for (const id of ids) expect(json).not.toContain(`"${id}"`);
    }
    const a = project(g.state, 'p1').zones.p1.leader[0]!.handle;
    const b = project(g.state, 'p2').zones.p1.leader[0]!.handle;
    expect(a).not.toBe(b);
  });

  it('view actions use handles and map back to the engine action', () => {
    const g = mk();
    const v = project(g.state, 'p1');
    expect(v.actions.length).toBe(g.legal().length);
    for (let i = 0; i < v.actions.length; i++) {
      expect(actionFromView(g.state, 'p1', v.actions[i]!)).toEqual(g.legal()[i]);
    }
    expect(project(g.state, 'p2').actions).toEqual([]);
  });

  it('a visible card keeps its handle while it stays visible', () => {
    const g = mk();
    const before = project(g.state, 'p2').zones.p1.characters[0]!.handle;
    g.act({ type: 'giveDon', target: g.find('p1', 'characters', RED_1) });
    expect(project(g.state, 'p2').zones.p1.characters[0]!.handle).toBe(before);
  });

  it('re-keyed on shuffle: no handle from before a redraw appears after it', () => {
    const g = newGame(31);
    g.act({ type: 'chooseFirst', goFirst: true });
    const before = (project(g.state, 'p1') as ProjectedView).zones.p1.hand.map((c) => c.handle);
    g.act({ type: 'mulligan', redraw: true });
    const after = JSON.stringify(project(g.state, 'p1'));
    for (const h of before) expect(after).not.toContain(h);
  });

  it('a card that goes back to a hidden zone cannot be linked when it comes out again', () => {
    const g = mk();
    const ch = g.find('p1', 'characters', RED_1);
    const seen = project(g.state, 'p2').zones.p1.characters[0]!.handle;
    op(g, { op: 'bounce', card: ch, by: 'p2' });
    const handNow = g.zone('p1', 'hand').at(-1)!.instance;
    g.act({ type: 'playCard', card: handNow });
    const again = project(g.state, 'p2').zones.p1.characters.at(-1)!.handle;
    expect(again).not.toBe(seen);
  });

  it("the non-decider sees a generic prompt for the decider's choice", () => {
    const v = project(mk().state, 'p2');
    expect(v.decision).toMatchObject({ kind: 'main', player: 'p1' });
    expect(v.decision!.prompt).toMatch(/opponent/);
  });
});

describe('projected events', () => {
  it('a draw shows the card to its owner only; the opponent sees a face-down move with no handle', () => {
    const g = startedGame(17);
    const step = reduce(g.state, { type: 'endTurn', player: 'p1' });
    const draw = (evs: GameEvent[]) =>
      evs.find((e) => e.type === 'CardMoved' && e.reason === 'draw')!;
    const mine = draw(projectEvents(step.events, 'p2'));
    const theirs = draw(projectEvents(step.events, 'p1'));
    expect(mine.card).toBeDefined();
    expect(mine.newInstance).toBeDefined();
    expect(mine.instance).toBeUndefined();
    expect(theirs).toMatchObject({ from: 'deck', to: 'hand', owner: 'p2' });
    expect(theirs.card).toBeUndefined();
    expect(theirs.newInstance).toBeUndefined();
    const ids = Object.keys(internals(step.state).cards);
    const json = JSON.stringify(projectEvents(step.events, 'p1'));
    for (const id of ids) expect(json).not.toContain(`"${id}"`);
  });
});
