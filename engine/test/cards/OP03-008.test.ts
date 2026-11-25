/** OP03-008 Buggy. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import {
  BLUE,
  dec,
  endCounter,
  expectDecision,
  game,
  hand,
  none,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  play,
  V,
} from './helpers.ts';
import { canPick, GREEN_EVENT, RA_CHAR, RED_EVENT } from './helpers-w5c1.ts';

const ID = 'OP03-008';
/** OP03-021 Kuro Leader: <Slash>, 5000 power, nothing that matters here. */
const SLASH_LEADER = 'OP03-021';

describe('OP03-008 Buggy: cannot be K.O.\'d in battle by "Slash" attribute cards', () => {
  /** The opponent's turn: their `attacker` attacks p1's rested Buggy. */
  const battle = (attacker: 'leader' | string, leader = PLAIN_BLUE) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: ID, rested: true }] },
      { leader, characters: attacker === 'leader' ? [] : [attacker] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: attacker === 'leader' ? g.leader('p2') : g.find('p2', 'characters', attacker),
      target: g.find('p1', 'characters', ID),
    });
    g.act({ type: 'block', blocker: null });
    endCounter(g);
    return g;
  };
  const koed = (g: ReturnType<typeof battle>) => g.zone('p1', 'characters').length === 0;

  it('a <Slash> Character that wins the battle does not K.O. it', () => {
    const g = battle(V.c3); // Blugori/Slash-attribute vanilla, 5000 against 3000
    expect(g.card(g.find('p2', 'characters', V.c3)).power).toBe(5000);
    expect(koed(g)).toBe(false);
    expect(g.eventsOfType('KOPrevented').length).toBeGreaterThan(0);
  });

  it('a <Slash> Leader does not K.O. it either', () => {
    const g = battle('leader', SLASH_LEADER);
    expect(koed(g)).toBe(false);
  });

  it('a <Strike> Character K.O.s it', () => {
    const g = battle(V.c2);
    expect(koed(g)).toBe(true);
  });

  it('an effect K.O. is not stopped, whatever the attribute', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [ID] }, { leader: SLASH_LEADER });
    g.state = applyOp(g.state, { op: 'ko', card: g.find('p1', 'characters', ID), by: 'p2' }).state;
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});

describe('OP03-008 Buggy [On Play]: look at 5, reveal up to 1 red Event, the rest to the bottom', () => {
  const start = (deck: string[]) =>
    game(
      { leader: PLAIN_PURPLE, hand: [ID], deck, costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
  const DECK = [GREEN_EVENT, V.c1, RA_CHAR, RED_EVENT, V.c2, V.c3, V.c4];

  it('takes the red Event to the hand and puts the other 4 at the bottom', () => {
    const g = start(DECK);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    g.act({
      type: 'pick',
      choice: g.zone('p1', 'deck').find((c) => c.card === RED_EVENT)!.instance,
    });
    // The owner orders the 4 left (the last one needs no answer).
    expectDecision(g, 'order', 'p1');
    for (const c of [V.c2, GREEN_EVENT, RA_CHAR]) {
      const first = g.zone('p1', 'deck').find((x) => x.card === c)!.instance;
      g.act({ type: 'order', first });
    }
    expect(hand(g, 'p1')).toEqual([RED_EVENT]);
    // The 6th and 7th cards stay on top, the 4 others are below them in the order chosen.
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual([
      V.c3,
      V.c4,
      V.c2,
      GREEN_EVENT,
      RA_CHAR,
      V.c1,
    ]);
  });

  it('only a red Event can be taken: a green Event and a red Character cannot', () => {
    const g = start(DECK);
    play(g, ID);
    const inDeck = (c: string) => g.zone('p1', 'deck').find((x) => x.card === c)!.instance;
    expect(canPick(g, inDeck(RED_EVENT))).toBe(true);
    expect(canPick(g, inDeck(GREEN_EVENT))).toBe(false);
    expect(canPick(g, inDeck(RA_CHAR))).toBe(false);
    expect(canPick(g, inDeck(V.c1))).toBe(false);
  });

  it('"up to 1": taking nothing leaves all 5 at the bottom', () => {
    const g = start(DECK);
    play(g, ID);
    none(g);
    while (dec(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
    expect(hand(g, 'p1')).toEqual([]);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck.slice(0, 2)).toEqual([V.c3, V.c4]);
    expect(deck.slice(2).sort()).toEqual([GREEN_EVENT, V.c1, RA_CHAR, RED_EVENT, V.c2].sort());
  });

  it('the red Event must be among the top 5: the 6th card is not looked at', () => {
    const g = start([GREEN_EVENT, V.c1, V.c2, V.c3, V.c4, RED_EVENT, BLUE]);
    play(g, ID);
    // Nothing among the 5 qualifies: the pick is asked at 0 or skipped, never offering the 6th card.
    const d = dec(g);
    if (d?.kind === 'choose') {
      expect(canPick(g, g.zone('p1', 'deck').find((x) => x.card === RED_EVENT)!.instance)).toBe(
        false,
      );
    }
    while (dec(g)?.kind === 'choose' || dec(g)?.kind === 'order')
      g.act(g.legal().find((a) => a.type === 'pick' || a.type === 'done' || a.type === 'order')!);
    expect(hand(g, 'p1')).toEqual([]);
  });
});
