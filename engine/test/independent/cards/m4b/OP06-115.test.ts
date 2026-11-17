/**
 * OP06-115 You're the One Who Should Disappear. (Event, Yellow, cost 0; Sky Island).
 *
 * Card text:
 *   "[Counter] You may trash 1 card from your hand: Up to 1 of your Leader or Character cards gains
 *    +3000 power during this battle.
 *    [Trigger] If you have 0 Life cards, you may add up to 1 card from the top of your deck to the top
 *    of your Life cards. Then, trash 1 card from your hand."
 *
 * Rules: CR 8-3-1-4 optional cost; RL-08 / CR 7-1-5-3 "during this battle"; CR 10-1-5-3 the Life card
 * being activated is in no area, so after taking the last Life card the player has 0 Life; CR 4-10-1
 * a false "if" resolves nothing (the following "Then" too); Trigger: rules digest Q8 (no cost paid).
 * Scenery: OP02-060 Mohji / OP01-010 Komachiyo / OP01-012 Sai (hand and deck fillers).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  attack,
  passBlock,
  accept,
  activateTrigger,
  BLUE,
  canCounterWith,
  chooseIfAsked,
  decline,
  hitLeader,
  kind,
  LD,
  LEAD,
  offered,
  payWith,
  RED,
  rep,
  side,
  sortedIds,
  theirTurn,
  useCounter,
  VAN,
  zoneCards,
  passCounter,
  choose,
  decider,
} from './kit-d.ts';

const EVENT = 'OP06-115';

function counterGame(p1: Partial<PlayerSpec> = {}) {
  const g = theirTurn(
    side(LD.navy, BLUE, { hand: [EVENT, VAN.komachiyo], ...p1 }),
    side(LEAD.luffy, RED),
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  passBlock(g);
  return g;
}

describe('OP06-115 [Counter]: you may trash 1 card from hand: +3000 power this battle', () => {
  it('trashing a card gives the Leader +3000 (8000), which stops a 5000 attack', () => {
    const g = counterGame();
    expect(canCounterWith(g, g.find('p1', 'hand', EVENT))).toBe(true);
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    payWith(g, [g.find('p1', 'hand', VAN.komachiyo)]);
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EVENT, VAN.komachiyo].sort());
  });

  it('the target may be a Character: its power rises by 3000 and the Leader’s does not', () => {
    const g = theirTurn(
      side(LD.navy, BLUE, {
        hand: [EVENT, VAN.komachiyo],
        characters: [{ card: VAN.sai, rested: true }],
      }),
      side(LEAD.luffy, RED),
    );
    const sai = g.find('p1', 'characters', VAN.sai);
    attack(g, g.leader('p2'), sai);
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', EVENT), sai);
    payWith(g, [g.find('p1', 'hand', VAN.komachiyo)]);
    chooseIfAsked(g, [sai]);
    expect(g.power(sai)).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 8-3-1-4: declining the trash gives no boost and keeps the hand card', () => {
    const g = counterGame();
    useCounterNoPay(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.komachiyo]);
  });

  it('"during this battle": the +3000 is gone after the battle', () => {
    const g = counterGame();
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    payWith(g, [g.find('p1', 'hand', VAN.komachiyo)]);
    chooseIfAsked(g, [g.leader('p1')]);
    passCounter(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with no other card in hand there is nothing to trash, so no boost', () => {
    const g = counterGame({ hand: [EVENT] });
    if (canCounterWith(g, g.find('p1', 'hand', EVENT))) {
      useCounterNoPay(g);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

/** Activate the Event but do not (or cannot) pay: say no if asked. */
function useCounterNoPay(g: ReturnType<typeof counterGame>) {
  const card = g.find('p1', 'hand', EVENT);
  const options = g.legal().filter((a) => a.type === 'activate' && a.card === card);
  if (!options.length) return;
  g.act(options[0]!);
  if (offered(g, 'p1')) decline(g);
  if (kind(g) === 'choose' && decider(g) === 'p1') {
    // No cost was paid: any remaining choose must be declined or empty.
    const done = g.legal().find((a) => a.type === 'done');
    if (done) g.act(done);
  }
}

describe('OP06-115 [Trigger]: with 0 Life, add the top card of the deck to Life, then trash 1 from hand', () => {
  function trig(life: string[], p1: Partial<PlayerSpec> = {}) {
    const g = theirTurn(
      side(LD.navy, BLUE, {
        life,
        hand: [VAN.komachiyo, VAN.sai],
        deck: [VAN.marco, ...rep(BLUE, 10)],
        ...p1,
      }),
      side(LEAD.luffy, RED),
    );
    hitLeader(g);
    activateTrigger(g);
    return g;
  }

  it('0 Life after taking the card: deck top becomes the only Life card, then 1 hand card is trashed', () => {
    const g = trig([EVENT]);
    if (offered(g, 'p1')) accept(g);
    expect(zoneCards(g, 'p1', 'life')).toEqual([VAN.marco]);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
    // "Then, trash 1 card from your hand": mandatory.
    choose(g, [g.find('p1', 'hand', VAN.komachiyo)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EVENT, VAN.komachiyo].sort());
    expect(kind(g)).toBe('main');
    expect(decider(g)).toBe('p2');
  });

  it('CR 4-10-1: with 1 Life card left the condition fails: nothing is added or trashed', () => {
    const g = trig([EVENT, VAN.mohji]);
    expect(zoneCards(g, 'p1', 'life')).toEqual([VAN.mohji]);
    expect(g.zone('p1', 'deck')).toHaveLength(11);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.komachiyo, VAN.sai].sort());
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EVENT]);
    expect(kind(g)).toBe('main');
  });

  it('"you may": declining adds nothing to Life', () => {
    const g = trig([EVENT]);
    if (offered(g, 'p1')) decline(g);
    expect(g.life('p1')).toBe(0);
    expect(g.zone('p1', 'deck')).toHaveLength(11);
  });
});
