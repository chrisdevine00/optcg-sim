/**
 * Constants and set-ups for the OP-15 group 2 card tests (OP15-047 to OP15-083). Real cards are used
 * as scenery only where their own effect cannot fire (placed on the board or in a zone, never played).
 */
import type { CardId, InstanceId, PlayerSpec } from '@optcg/engine';
import { withAbilities, type Ability } from '../../src/testing.ts';
import { dec, endCounter, game, passBlock, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import type { TestGame } from '../fixtures/index.ts';

/** OP15-002 Lucy Leader (scripted after wave 3; tests that need an inert Leader decline its choices). */
export const LUCY = 'OP15-002';
/** OP15-039 Rebecca Leader ({Dressrosa}, not named Lucy); unscripted, inert. */
export const DRESSROSA_LEADER = 'OP15-039';
/** ST01-001 Luffy Leader ({Straw Hat Crew}); only an [Activate: Main]. */
export const STRAW_LEADER = 'ST01-001';
/** ST03-001 Crocodile Leader (Blue): not Dressrosa, not Straw Hat Crew. */
export const OTHER_LEADER = PLAIN_BLUE;
/** OP15-058 Enel Leader (Purple, {Sky Island}): its own rule shrinks the DON!! deck, so scenes pin `donDeck`. */
export const SKY_LEADER = 'OP15-058';

/** {Dressrosa} vanillas: cost 2 / 4000, cost 3 / 5000, cost 5 / 6000. */
export const DRESS2 = 'OP01-076';
export const DRESS3 = 'OP10-054';
export const DRESS5 = 'OP15-049';
/** An Event and a Stage that sit in a hand (never played). */
export const EVENT = 'ST02-017';
export const EVENT2 = 'ST01-016';
export const STAGE = 'OP04-096';
/** OP15-043 Kelly Funk (scenery: placed, never played). */
export const KELLY = 'OP15-043';
/** Sky Island Characters of this group (scenery). */
export const KOTORI = 'OP15-064';
export const HOTORI = 'OP15-072';
export const SATORI = 'OP15-066';
export const SHURA = 'OP15-067';
export const HEAVENLY = 'OP15-068';
export const YAMA = 'OP15-073';
export const FUZA = 'OP15-070';
/** {Thriller Bark Pirates} cards: [Gecko Moria] 10000 (cost 8) and 9000 (cost 8), 6000 vanilla Moria, a second [Oars] 10000, Perona 6000. */
export const MORIA10 = 'OP14-104';
export const MORIA9 = 'OP06-086';
export const OARS2 = 'OP14-101';
export const TBP4 = 'ST12-005';
export const KUMACY = 'OP14-102';
/** Cost 9 and cost 8 Characters for the "cost 8 or less" boundary. */
export const COST9 = 'ST04-003';
export const COST8 = 'OP14-101';

/** Place a {Thriller Bark Pirates} Absalom (cost 4, 5000 power) in a hand or on a field. */
export const ABSALOM = 'OP15-079';

/** `n` of the same card. */
export const rep = (n: number, card: CardId): CardId[] => Array.from({ length: n }, () => card);

/** p1's turn with a leader, active DON!! and the rest of `p1`. p2 has a plain Blue Leader. */
export function mine(
  leader: CardId,
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  active = 5,
  rested = 0,
): TestGame {
  return game({ leader, costArea: { active, rested }, ...p1 }, { leader: PLAIN_BLUE, ...p2 });
}

/**
 * p2's turn: p2's 9000 attacker (V.c7) attacks p1's rested `target`; nobody blocks or counters and
 * the target is K.O.'d. Returns with p1's [On K.O.] (if any) pending.
 */
export function koedInBattle(
  target: CardId,
  p1: Partial<PlayerSpec> & { leader: CardId },
  p2: Partial<PlayerSpec> = {},
): TestGame {
  const g = game(
    { ...p1, characters: [{ card: target, rested: true }, ...(p1.characters ?? [])] },
    { leader: PLAIN_PURPLE, ...p2, characters: [V.c7, ...(p2.characters ?? [])] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', V.c7),
    target: g.find('p1', 'characters', target),
  });
  passBlock(g);
  endCounter(g);
  return g;
}

/** p2's turn: p2's V.c7 attacks p1's Leader; stops at the first decision afterwards (block or [On Your Opponent's Attack]). */
export function oppAttack(
  p1: Partial<PlayerSpec> & { leader: CardId },
  p2chars: PlayerSpec['characters'] = [V.c7],
): TestGame {
  const g = game(
    p1,
    { leader: PLAIN_PURPLE, characters: p2chars },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  return g;
}

/**
 * Run a planted [Activate: Main] of the active player's Leader that does `action` (a stand-in for a
 * source of effect K.O. or removal that is not one of the group's cards). Returns the game after
 * the activation was requested.
 */
export function plant(g: TestGame, player: 'p1' | 'p2', action: Record<string, unknown>): void {
  const leader = g.leader(player);
  const card = g.card(leader).card;
  g.state = withAbilities(g.state, card, [
    {
      id: 'planted',
      kind: 'activate',
      when: 'activateMain',
      effect: [{ do: action }],
    } as unknown as Ability,
  ]);
  g.act({ type: 'activate', card: leader, ability: 'planted' });
}

/** Instance ids in a zone, by card id. */
export const idsOf = (
  g: TestGame,
  p: 'p1' | 'p2',
  zone: Parameters<TestGame['zone']>[1],
): CardId[] => g.zone(p, zone).map((c) => c.card);

/** Is `attacker` allowed to attack with `blocker` among the legal blocks? */
export const canBlockWith = (g: TestGame, blocker: InstanceId): boolean =>
  g.legal().some((a) => a.type === 'block' && a.blocker === blocker);

/** Finish every pending `order` decision in canonical order. */
export function orderAll(g: TestGame): void {
  while (dec(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
}

/** Does the legal list offer this activation? */
export const canActivate = (g: TestGame, card: InstanceId, ability: string): boolean =>
  g.isLegal({ type: 'activate', card, ability, player: g.decider });
