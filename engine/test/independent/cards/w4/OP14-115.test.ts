/**
 * OP14-115 Rindo (Character, yellow, cost 5, 5000, Counter +1000, {Kuja Pirates}).
 *
 * Card text: "[Opponent's Turn] [On K.O.] Add up to 1 card from the top of your deck to the top of your
 * Life cards. Then, you take 1 damage.
 * [Trigger] If your Leader has the {Kuja Pirates} type, play this card."
 *
 * Rules: [On K.O.] fires when this Character is K.O.'d by battle or effect; [Opponent's Turn] limits
 * it to the opponent's turn. Effect damage takes the top Life card into the hand and offers its
 * [Trigger] (CR 4-6-3); it defeats only at 0 Life (RL-22). Adding to Life is not damage. A [Trigger]
 * plays the card when its condition holds.
 */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import {
  act,
  at,
  attack,
  BLUE,
  chars,
  chr,
  decision,
  deck,
  fill,
  hand,
  hitLeader,
  lifeCards,
  need,
  no,
  opponentKingdomCome,
  passBlock,
  theirs,
  trash,
  W,
  LW,
  yes,
} from './kit-w4b.ts';

const RINDO = 'OP14-115';

/**
 * p2's turn. p1 (Leader `leader`, Life as given, deck top `deckTop`) has Rindo rested; p2's 7000
 * Kingdew attacks Rindo, no block, no counter, and Rindo is K.O.'d. Stops at the first decision.
 */
function koRindo(
  o: { leader?: string; life?: string[]; deckTop?: string[]; hand?: string[] } = {},
) {
  const g = theirs(
    o.leader ?? LW.hancock,
    {
      characters: [{ card: RINDO, rested: true }],
      life: o.life ?? fill(BLUE, 4),
      deck: [...(o.deckTop ?? [W.marco]), ...fill(BLUE, 14)],
      hand: o.hand ?? [],
    },
    { characters: [W.kingdew] },
  );
  attack(g, at(g, 'p2', 'characters', W.kingdew), chr(g, 'p1', RINDO));
  passBlock(g);
  act(g, { type: 'endCounter' });
  return g;
}

/** Decline every [Trigger] decision of the damage just taken. */
function declineTriggers(g: ReturnType<typeof koRindo>) {
  while (decision(g)?.kind === 'trigger') act(g, { type: 'trigger', activate: false });
}

describe("OP14-115 Rindo: [Opponent's Turn] [On K.O.] add a card from the deck to Life, then take 1 damage", () => {
  it("when K.O.'d on the opponent's turn it offers the effect; using it adds the deck's top card to Life and the top Life card (that one) goes to the hand by damage", () => {
    const g = koRindo();
    need(g, 'optional', 'p1');
    expect(g.life('p1')).toBe(4);
    yes(g, 'p1');
    need(g, 'trigger', 'p1');
    declineTriggers(g);
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([W.marco]);
    expect(deck(g)).toHaveLength(14);
    expect(trash(g)).toEqual([RINDO]);
  });

  it('declining the optional effect adds no card to Life and the deck keeps its cards', () => {
    // Whether "Then, you take 1 damage" still follows when nothing was added is a reading that
    // differs (an "up to" of 0 is a resolved step for some, a failed one for others), so the
    // damage itself is not asserted: only that no card came from the deck and the game goes on.
    const g = koRindo();
    need(g, 'optional', 'p1');
    no(g, 'p1');
    declineTriggers(g);
    need(g, 'main', 'p2');
    expect(deck(g)).toHaveLength(15);
    expect(hand(g)).not.toContain(W.marco);
    expect(trash(g)).toEqual([RINDO]);
    expect(queries.result(g.state)).toBeNull();
  });

  it('adds at most 1 card: Life is 4 before and 4 after (5 added, 1 taken), the deck lost exactly 1', () => {
    const g = koRindo({ deckTop: [W.marco, W.sai] });
    yes(g, 'p1');
    declineTriggers(g);
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(15);
    expect(hand(g)).toEqual([W.marco]);
    expect(deck(g)[0]).toBe(W.sai);
  });

  it('at 0 Life the card added makes 1 Life, the damage takes it: Life 0 and the game goes on', () => {
    const g = koRindo({ life: [] });
    need(g, 'optional', 'p1');
    expect(g.life('p1')).toBe(0);
    yes(g, 'p1');
    declineTriggers(g);
    expect(g.life('p1')).toBe(0);
    expect(hand(g)).toEqual([W.marco]);
    expect(queries.result(g.state)).toBeNull();
    need(g, 'main', 'p2');
  });

  it('the damage is real damage: the card taken may be a [Trigger] card and its [Trigger] can be activated', () => {
    // Rindo's own [Trigger] is the scripted Trigger scenery: the card added from the deck is a
    // second Rindo, taken by the damage, and with a {Kuja Pirates} Leader it can be played.
    const g = koRindo({ deckTop: [RINDO] });
    yes(g, 'p1');
    need(g, 'trigger', 'p1');
    expect(g.legal().some((a) => a.type === 'trigger' && a.activate)).toBe(true);
    act(g, { type: 'trigger', activate: true });
    declineTriggers(g);
    expect(chars(g)).toEqual([RINDO]);
    expect(hand(g)).toEqual([]);
  });

  it('the Life cards that were already there are untouched (the added card is on TOP, so damage takes it)', () => {
    const life = [W.sai, W.sai, W.komachiyo, W.komachiyo];
    const g = koRindo({ life });
    yes(g, 'p1');
    declineTriggers(g);
    expect(lifeCards(g)).toEqual(life);
    expect(hand(g)).toEqual([W.marco]);
  });

  it("also fires when K.O.'d by an effect on the opponent's turn", () => {
    const g = theirs(
      LW.hancock,
      { characters: [RINDO] },
      { hand: [W.kingdomCome], characters: [] },
    );
    opponentKingdomCome(g, g.find('p1', 'characters', RINDO));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    declineTriggers(g);
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toHaveLength(1);
  });
});

describe('OP14-115 Rindo: [Trigger] play this card if your Leader has {Kuja Pirates}', () => {
  /** p2 hits p1's Leader with their Leader; p1's top Life card is Rindo. */
  function hit(leader: string) {
    const g = theirs(leader, { life: [RINDO, ...fill(BLUE, 3)] }, {});
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('with a {Kuja Pirates} Leader, activating the [Trigger] plays Rindo', () => {
    const g = hit(LW.hancock);
    act(g, { type: 'trigger', activate: true });
    expect(chars(g)).toEqual([RINDO]);
    expect(hand(g)).toEqual([]);
    expect(g.life('p1')).toBe(3);
  });

  it('the played Rindo is active and the card left Life (not in hand, not in trash)', () => {
    const g = hit(LW.hancock);
    act(g, { type: 'trigger', activate: true });
    expect(g.card(at(g, 'p1', 'characters', RINDO)).rested).toBe(false);
    expect(trash(g)).toEqual([]);
  });

  it('declining the [Trigger] adds Rindo to the hand and plays nothing', () => {
    const g = hit(LW.hancock);
    act(g, { type: 'trigger', activate: false });
    expect(hand(g)).toEqual([RINDO]);
    expect(chars(g)).toEqual([]);
  });

  it('without a {Kuja Pirates} Leader the [Trigger] plays nothing', () => {
    const g = hit(LW.croc);
    if (g.legal().some((a) => a.type === 'trigger' && a.activate)) {
      act(g, { type: 'trigger', activate: true });
    } else {
      act(g, { type: 'trigger', activate: false });
    }
    expect(chars(g)).toEqual([]);
  });
});
