/**
 * Constants and helpers for the wave 7 group 2 card tests (OP12-036, OP12-117, OP13-064, OP13-105,
 * OP14-053, OP14-060, OP15-093, OP16-080, ST15-001, ST20-003). Every card named below is a vanilla,
 * or an unscripted card whose text is inert where the test puts it.
 */
import type { PlayerId } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';

export { PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';

/** {Supernovas} Leader with the <Slash> attribute (Trafalgar Law; its [Activate: Main] is unused). */
export const SLASH_LEADER = 'OP01-002';
/** A Leader with the <Strike> attribute and no {Supernovas} type (Kaido, ST04-001). */
export const STRIKE_LEADER = 'ST04-001';
/** Edward.Newgate Leader, 6000 power (its [End of Your Turn] is unscripted and inert). */
export const NEWGATE = 'OP02-001';
/** Roger Pirates Leader 7000 power with a rule text that is not scripted (inert). */
export const ROGER_LEADER = 'OP13-003';
/** A Leader whose type includes "Roger Pirates" without being exactly that type (Former Roger Pirates). */
export const FORMER_ROGER_LEADER = 'OP12-001';
/** [Crocus] cost 6 / 8000, type {Former Roger Pirates}: a substring match, not the exact type. */
export const FORMER_ROGER = 'EB01-041';
/** <Slash> Characters: [Krieg] cost 4 / 6000 and [Solitaire] cost 3 / 5000; <Ranged> cost 5 / 7000. */
export const SLASH6 = 'OP01-066';
export const SLASH5 = 'OP02-077';
export const RANGED7 = 'OP01-107';
/** Cost 9 (10000) and cost 10 (12000) Characters with no text on the field. */
export const COST9 = 'OP02-004';
export const COST10 = 'P-041';
/** [Monkey.D.Luffy] cost 3 / 5000 <Strike> with no text. */
export const LUFFY = 'ST08-011';
/** {Donquixote Pirates} cost 3 / 5000, and {Blackbeard Pirates} cost 4 / 6000, with no text. */
export const DONQUIXOTE = 'OP05-035';
export const BLACKBEARD = 'OP09-082';
/** A Character whose [Trigger] is "Play this card." (cost 2), and a card with no [Trigger]. */
export const WITH_TRIGGER = 'OP01-009';
export const NO_TRIGGER = 'OP02-084';

export const ids = (g: TestGame, p: PlayerId, zone: Parameters<TestGame['zone']>[1]): string[] =>
  g.zone(p, zone).map((c) => c.card);
