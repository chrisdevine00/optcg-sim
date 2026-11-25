/** OP13-106 Conney. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { withAbilities, type Ability } from '../../src/testing.ts';
import { dec, endCounter, game, hand, passBlock, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import { atTrigger, ids, OTHER_LEADER, trigGame } from './helpers-w6c2.ts';

const ID = 'OP13-106';
const trigger = { id: 't', kind: 'trigger', effect: [{ do: { draw: 1 } }] } as Ability;

/** p2 attacks p1's Leader with V.c5; p1 (Conney on the field) has a planted [Trigger] on top of Life. */
const mk = (p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) => {
  const g = game(
    { leader: OTHER_LEADER, characters: [ID], life: [PURPLE, V.c1, V.c1], ...p1 },
    { leader: PLAIN_BLUE, ...p2, characters: [V.c5, ...(p2.characters ?? [])] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.state = withAbilities(g.state, PURPLE, [trigger]);
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c5), target: g.leader('p1') });
  passBlock(g);
  endCounter(g);
  atTrigger(g);
  return g;
};
const conney = (g: ReturnType<typeof mk>) => g.find('p1', 'characters', ID);

describe('OP13-106 Conney', () => {
  it("[Opponent's Turn]: when a [Trigger] activates, this Character gains [Blocker] during this turn", () => {
    const g = mk();
    expect(g.card(conney(g)).keywords).not.toContain('Blocker');
    g.act({ type: 'trigger', activate: true });
    expect(g.card(conney(g)).keywords).toContain('Blocker');
  });

  it('declining the [Trigger] (adding the card to the hand) is not an activation', () => {
    const g = mk();
    g.act({ type: 'trigger', activate: false });
    expect(g.card(conney(g)).keywords).not.toContain('Blocker');
    expect(hand(g, 'p1')).toContain(PURPLE);
  });

  it('the [Blocker] lasts for the rest of the turn: a second attack can be blocked by it', () => {
    const g = mk({}, { characters: [V.c4] });
    g.act({ type: 'trigger', activate: true });
    // Finish the first attack, then p2 attacks with the other Character.
    while (dec(g)?.kind !== 'main') {
      if (dec(g)?.kind === 'block') passBlock(g);
      else if (dec(g)?.kind === 'counter') endCounter(g);
      else g.act({ type: 'trigger', activate: false });
    }
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
    expect(g.legal().some((a) => a.type === 'block' && a.blocker === conney(g))).toBe(true);
  });

  it('only on the opponent’s turn: a [Trigger] on your own turn gives no [Blocker]', () => {
    // p1's turn: p1 attacks p2, whose Life card has a [Trigger] (the opponent's [Trigger] counts only on their turn).
    const g = game(
      { leader: OTHER_LEADER, characters: [ID, V.c5] },
      { leader: PLAIN_BLUE, life: [PURPLE, V.c1, V.c1] },
    );
    g.state = withAbilities(g.state, PURPLE, [trigger]);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c5), target: g.leader('p2') });
    passBlock(g);
    endCounter(g);
    atTrigger(g, 'p2');
    g.act({ type: 'trigger', activate: true });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Blocker');
  });

  it('[Trigger]: play this card (declined, it goes to the hand)', () => {
    const g = trigGame(ID);
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([]);

    const d = trigGame(ID);
    d.act({ type: 'trigger', activate: false });
    expect(hand(d, 'p1')).toEqual([ID]);
  });

  it('the Character played by its own [Trigger] was not on the field when the [Trigger] activated', () => {
    const g = trigGame(ID);
    g.act({ type: 'trigger', activate: true });
    // M6b-Q72: the watcher is queued at the activation; a Conney that arrives with it gets no [Blocker].
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Blocker');
  });
});
