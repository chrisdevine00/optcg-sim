/**
 * EB05-055 Nami (Character, Yellow, cost 5, 6000, no Counter, {Straw Hat Crew}/{East Blue}).
 *
 * Card text: "[Your Turn] [On Play] If your Leader has the "Wisdom" attribute, add up to 1 card from
 * the top of your deck to the top of your Life cards.
 * [Trigger] You may trash 1 card from your hand: If you have 2 or less Life cards, play this card."
 *
 * Rules: [Your Turn] is a condition (CR 8-3-2-4): the [On Play] does nothing when she is played on
 * the opponent's turn, which is exactly what a [Trigger] play during the opponent's attack is.
 * CR 8-3-3 (failed "if"), CR 8-4-4-1 ("up to"), RL-25 (the [Trigger] card is in no area while it
 * resolves, and the damage already removed a Life card).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  BLUE,
  CH,
  chars,
  declineTrigger,
  deck,
  drive,
  fill,
  hand,
  hitLeader,
  kind,
  LD,
  mine,
  outcomes,
  playCard,
  RED,
  side,
  theirTurn,
  trash,
} from './kit-b.ts';

const ID = 'EB05-055';

function play(leader: string, lifeCount = 2) {
  const g = mine(leader, {
    hand: [ID],
    life: fill(RED, lifeCount),
    deck: [CH.marco, CH.sai, ...fill(BLUE, 12)],
  });
  playCard(g, ID);
  return g;
}

describe('EB05-055 Nami [Your Turn] [On Play]: Wisdom Leader: add up to 1 card from my deck to the top of my Life', () => {
  it('Wisdom Leader (OP07-097 Vegapunk): the top deck card becomes my top Life card, face-down', () => {
    const g = play(LD.vegapunk);
    drive(g, 'p1', {});
    expect(g.life('p1')).toBe(3);
    expect(g.zone('p1', 'life')[0]!.card).toBe(CH.marco);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(deck(g)).toHaveLength(13);
    expect(deck(g)[0]).toBe(CH.sai);
  });

  it('CR 8-3-3: a Leader without the Wisdom attribute (ST01-001, Strike): nothing is added', () => {
    const g = play(LD.shc);
    drive(g, 'p1', {});
    expect(g.life('p1')).toBe(2);
    expect(deck(g)).toHaveLength(14);
  });

  it('exactly one card at most: Life goes up by 1, not 2', () => {
    const g = play(LD.vegapunk);
    drive(g, 'p1', {});
    expect(g.life('p1')).toBe(3);
  });

  it('"up to 1": adding no card is a reachable outcome', () => {
    const g = play(LD.vegapunk);
    const lives = outcomes(g, 'p1', (x) => String(x.life('p1')));
    expect(lives.has('2')).toBe(true);
    expect(lives.has('3')).toBe(true);
  });

  it('the Leader’s attribute is what counts: Wisdom on a Character does not (Shaka OP13-107 on my field, Strike Leader)', () => {
    const g = mine(LD.shc, {
      hand: [ID],
      characters: [CH.shaka],
      life: fill(RED, 2),
      deck: [CH.marco, ...fill(BLUE, 13)],
    });
    playCard(g, ID);
    drive(g, 'p1', {});
    expect(g.life('p1')).toBe(2);
  });
});

describe('EB05-055 Nami [Trigger]: you may trash 1 from hand: if 2 or less Life, play this card', () => {
  function hit(lifeBefore: number, handCards: string[] = [CH.mohji]) {
    const g = theirTurn(
      side(LD.vegapunk, BLUE, {
        life: [ID, ...fill(BLUE, lifeBefore - 1)],
        hand: handCards,
        deck: [CH.marco, ...fill(BLUE, 12)],
      }),
      side(LD.shc, RED),
    );
    hitLeader(g, g.leader('p2'));
    return g;
  }

  it('3 Life before the hit (2 after): Nami is played, the trashed card paid the cost', () => {
    const g = hit(3);
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    drive(g, 'p1', {});
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([CH.mohji]);
  });

  it('[Your Turn]: played on the opponent’s turn her [On Play] does nothing, even under a Wisdom Leader', () => {
    const g = hit(3);
    activateTrigger(g);
    drive(g, 'p1', {});
    expect(g.life('p1')).toBe(2);
    expect(deck(g)).toHaveLength(13);
  });

  it('boundary: 4 Life before the hit (3 after): she is not played', () => {
    const g = hit(4);
    activateTrigger(g);
    drive(g, 'p1', {});
    expect(chars(g)).toEqual([]);
  });

  it('declining the Trigger puts Nami in hand', () => {
    const g = hit(3);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID, CH.mohji].sort());
    expect(chars(g)).toEqual([]);
  });

  it('CR 8-3-1-3: with an empty hand the Trigger cannot be activated', () => {
    const g = hit(3, []);
    expect(kind(g)).toBe('trigger');
    expect(g.legal().some((a) => a.type === 'trigger' && a.activate)).toBe(false);
  });
});
