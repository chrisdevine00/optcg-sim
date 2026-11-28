/**
 * OP18-080 Van Augur (Character, Black, cost 4, 5000, Counter +1000, {Egghead}/{Blackbeard Pirates}).
 *
 * Card text (cards/data):
 *   "[Your Turn] [Once Per Turn] When a card is trashed from your hand by your [Marshall.D.Teach]
 *    Leader's effect, if you have no other [Van Augur], draw 1 card.
 *    [On K.O.] Draw 1 Card."
 *
 * Readings (docs/research/m6b-audit/OP-18.md Q6): a cost trash counts as "by the Leader's effect";
 * "no other [Van Augur]" is read on my Characters, this one excluded. The first clause works on my
 * turn only.
 *
 * Teach Leaders: OP09-081 (its [Activate: Main] "You may trash 1 card from your hand: ..." is the
 * only way to trigger the first clause on my turn) has NO script in the engine, so the clause cannot
 * be driven by a real play: that test is kept as it.fails (see DISAGREEMENTS-d.md). OP16-080 trashes
 * a card on the OPPONENT's turn, so the [Your Turn] clause must stay silent for it.
 *
 * Scenery: OP01-104 Speed (Purple, has a [Trigger], paid by OP16-080), OP01-012 Sai, OP01-023 Marco,
 * OP02-007 Thatch (8000, attacker), OP18-079 Spandam (a non-Teach Leader that trashes from hand).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock } from '../../helpers.ts';
import {
  accept,
  at,
  BLUE,
  cardIds,
  CH,
  fill,
  KO_EVENT,
  LDR,
  LEAD,
  lightningKo,
  myTurn,
  need,
  offered,
  offeredAbilities,
  PURPLE,
  RED,
  side,
  strike,
  theirTurn,
  VAN,
  decline,
} from './kit-d.ts';

const AUGUR = 'OP18-080';
const TEACH_ACT = 'OP09-081';
const TEACH_OPP = 'OP16-080';
const SPEED = 'OP01-104';
const TOP = 'OP01-010';

describe('OP18-080 Van Augur: [On K.O.] draw 1 card', () => {
  it('K.O.’d in battle: its owner draws 1 card', () => {
    const g = theirTurn(
      side(LDR.luffy, RED, {
        characters: [{ card: AUGUR, rested: true }],
        deck: [TOP, VAN.sai, VAN.sai],
      }),
      side(LDR.luffy, RED, { characters: [CH.thatch6] }),
    );
    strike(g, g.find('p2', 'characters', CH.thatch6), g.find('p1', 'characters', AUGUR));
    expect(cardIds(g, 'p1', 'trash')).toEqual([AUGUR]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([TOP]);
  });

  it('K.O.’d by an opponent’s effect: it draws 1 as well', () => {
    const g = theirTurn(
      side(LDR.luffy, RED, { characters: [AUGUR], deck: [TOP, VAN.sai, VAN.sai] }),
      side(LEAD.kaido, PURPLE, { hand: [KO_EVENT], costArea: { active: 4, rested: 0 } }),
    );
    lightningKo(g, g.find('p1', 'characters', AUGUR));
    expect(cardIds(g, 'p1', 'hand')).toEqual([TOP]);
  });

  it('it draws only when K.O.’d: an attack it survives draws nothing', () => {
    const g = theirTurn(
      side(LDR.luffy, RED, { characters: [{ card: AUGUR, rested: true }], deck: [TOP, VAN.sai] }),
      side(LDR.luffy, RED, { characters: [VAN.sunny] }),
    );
    strike(g, g.find('p2', 'characters', VAN.sunny), g.find('p1', 'characters', AUGUR));
    expect(cardIds(g, 'p1', 'characters')).toEqual([AUGUR]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
  });
});

describe('OP18-080 Van Augur: [Your Turn] [Once Per Turn] a card trashed from hand by my [Marshall.D.Teach] Leader’s effect: draw 1', () => {
  it.fails(
    'with OP09-081 Teach, trashing a card for its [Activate: Main] cost draws 1 (the Leader has no script, so no activation exists)',
    () => {
      const g = myTurn(
        side(TEACH_ACT, BLUE, {
          characters: [AUGUR],
          hand: [VAN.sai, VAN.marco],
          deck: [TOP, VAN.sunny, VAN.sunny, VAN.sunny],
        }),
        side(LDR.luffy, RED),
      );
      const [ability] = offeredAbilities(g, g.leader('p1'));
      expect(ability).toBeTruthy();
      act(g, { type: 'activate', card: g.leader('p1'), ability: ability! });
      if (offered(g, 'p1')) accept(g);
      need(g, 'choose', 'p1');
      act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
      expect(cardIds(g, 'p1', 'hand')).toContain(TOP);
    },
  );

  it('a Leader that is not [Marshall.D.Teach] trashing from hand (OP18-079 Spandam’s cost) draws nothing', () => {
    const g = myTurn(
      side('OP18-079', BLUE, {
        characters: [AUGUR],
        hand: ['OP03-082', VAN.sai],
        deck: [TOP, ...fill(VAN.sunny, 6)],
        costArea: { active: 5, rested: 0 },
      }),
      side(LDR.luffy, RED),
    );
    const leader = g.leader('p1');
    act(g, { type: 'activate', card: leader, ability: offeredAbilities(g, leader)[0]! });
    act(g, { type: 'pick', choice: g.find('p1', 'hand', 'OP03-082') });
    decline(g);
    expect(cardIds(g, 'p1', 'trash')).toEqual(['OP03-082']);
    expect(cardIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
    expect(at(g, 'p1', 'characters', AUGUR)).toBeTruthy();
  });

  it('"[Your Turn]": OP16-080 Teach trashes a [Trigger] card on the OPPONENT’s turn, and Van Augur draws nothing', () => {
    const g = theirTurn(
      side(TEACH_OPP, BLUE, {
        characters: [AUGUR],
        hand: [SPEED, VAN.sai],
        deck: [TOP, ...fill(VAN.sunny, 6)],
      }),
      side(LDR.luffy, RED, { characters: [CH.thatch6] }),
    );
    attack(g, g.find('p2', 'characters', CH.thatch6), g.leader('p1'));
    // OP16-080: [On Your Opponent's Attack] [Once Per Turn] trash 1 card with a [Trigger]: change the target.
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    act(g, { type: 'pick', choice: g.find('p1', 'hand', SPEED) });
    expect(cardIds(g, 'p1', 'trash')).toContain(SPEED);
    passBlock(g);
    expect(cardIds(g, 'p1', 'hand')).not.toContain(TOP);
  });
});
