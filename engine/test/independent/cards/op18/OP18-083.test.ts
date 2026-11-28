/**
 * OP18-083 Saint Killingham (Character, Black, cost 5, 6000, Counter +1000, {Celestial Dragons}/
 * {Holy Knights of God}).
 *
 * Card text (cards/data):
 *   "[Your Turn] [On Play] Play up to 1 [Sleeptids] from your trash.
 *    [On K.O.] You may trash 2 cards from your hand: Play this Character card from your trash."
 *
 * Rules: "[Your Turn]" restricts the [On Play] to my own turn; [Sleeptids] is a card NAME (OP18-093,
 * cost 9, 3000, [Blocker]); the play from the trash is free; "up to 1" may pick none. The [On K.O.]
 * is an optional cost-effect: trash 2 cards from hand (all or nothing), then Killingham returns to
 * the field from the trash.
 *
 * Scenery: OP18-093 Sleeptids (Black, cost 9, 3000, [Blocker]); OP01-012 Sai, OP01-023 Marco
 * (vanilla fodder); OP02-007 Thatch (8000) attacks and K.O.s Killingham.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, attack, passBlock, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  cardIds,
  CH,
  choiceCards,
  choices,
  decline,
  kind,
  kw,
  LEAD,
  LDR,
  mine,
  need,
  offered,
  RED,
  side,
  theirTurn,
  VAN,
} from './kit-d.ts';

const KILL = 'OP18-083';
const SLEEP = 'OP18-093';

describe('OP18-083 Saint Killingham: [Your Turn] [On Play] play up to 1 [Sleeptids] from your trash', () => {
  const game = (trash: string[]): TestGame => {
    const g = mine(LEAD.kaido, { hand: [KILL], trash });
    play(g, g.find('p1', 'hand', KILL));
    return g;
  };

  it('plays [Sleeptids] from the trash for free (cost 9 is not paid)', () => {
    const g = game([SLEEP, VAN.sai]);
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).toEqual([SLEEP]);
    act(g, { type: 'pick', choice: g.find('p1', 'trash', SLEEP) });
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([KILL, SLEEP].sort());
    expect(cardIds(g, 'p1', 'trash')).toEqual([VAN.sai]);
    expect(kw(g, g.find('p1', 'characters', SLEEP))).toContain('Blocker');
    expect(kind(g)).toBe('main');
  });

  it('only a card named [Sleeptids] qualifies: other Characters in the trash are not offered', () => {
    const g = game([VAN.sai, VAN.marco]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(cardIds(g, 'p1', 'characters')).toEqual([KILL]);
  });

  it('"up to 1": picking none plays nothing', () => {
    const g = game([SLEEP]);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(cardIds(g, 'p1', 'trash')).toEqual([SLEEP]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([KILL]);
  });

  it('only 1 is played even with two [Sleeptids] in the trash', () => {
    const g = game([SLEEP, SLEEP]);
    act(g, { type: 'pick', choice: g.find('p1', 'trash', SLEEP, 0) });
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'trash')).toEqual([SLEEP]);
  });
});

describe('OP18-083 Saint Killingham: [On K.O.] you may trash 2 cards from hand: play this Character from the trash', () => {
  /** p2's Thatch (8000) attacks p1's rested Killingham (6000); the K.O. prompt is pending. */
  function ko(p1: Partial<PlayerSpec> = {}): TestGame {
    const g = theirTurn(
      side(LDR.luffy, RED, {
        characters: [{ card: KILL, rested: true }],
        hand: [VAN.sai, VAN.marco, VAN.gordon],
        trash: [SLEEP],
        ...p1,
      }),
      side(LDR.luffy, RED, { characters: [CH.thatch6] }),
    );
    attack(g, g.find('p2', 'characters', CH.thatch6), g.find('p1', 'characters', KILL));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  }

  it('trashing 2 cards from hand plays it again from the trash (active)', () => {
    const g = ko();
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.marco) });
    expect(cardIds(g, 'p1', 'characters')).toEqual([KILL]);
    expect(g.card(g.find('p1', 'characters', KILL)).rested).toBe(false);
    expect(cardIds(g, 'p1', 'hand')).toEqual([VAN.gordon]);
    expect(cardIds(g, 'p1', 'trash').sort()).toEqual([SLEEP, VAN.marco, VAN.sai].sort());
  });

  it('declining: it stays in the trash and the hand is untouched', () => {
    const g = ko();
    decline(g);
    expect(cardIds(g, 'p1', 'trash').sort()).toEqual([KILL, SLEEP].sort());
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(3);
  });

  it('with only 1 card in hand the cost (2 cards) cannot be paid', () => {
    const g = ko({ hand: [VAN.sai] });
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(cardIds(g, 'p1', 'trash')).toContain(KILL);
    expect(cardIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
  });

  it('"[Your Turn]": replayed on the opponent’s turn its [On Play] does not fetch [Sleeptids]', () => {
    const g = ko();
    accept(g);
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.marco) });
    expect(kind(g)).toBe('main');
    expect(g.decider).toBe('p2');
    expect(cardIds(g, 'p1', 'trash')).toContain(SLEEP);
  });
});
