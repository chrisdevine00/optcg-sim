/**
 * Helpers for the EB-05 group-B independent card tests (EB05-030 .. EB05-061). Public API, frozen
 * fixtures and the earlier kits only. Scenery stats are noted next to each constant; tests repeat
 * the ones they rely on.
 */
import type { PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { decision } from '../../helpers.ts';
import { accept, donChoices, payDon } from '../kit.ts';

export * from '../m4b/kit-a.ts';
export {
  canCounter,
  counterEvent,
  drive,
  mainEvent,
  offeredCardIds,
  pickMixed,
  settleOrder,
  type Script,
} from '../m4b/kit-b.ts';
export {
  act,
  attack,
  attackTargets,
  blockers,
  canAttack,
  cardIds,
  decision,
  endTurn,
  fill,
  noDefence,
  passBlock,
  passCounter,
  play,
  takeDamage,
} from '../../helpers.ts';

/** Leaders used as scenery (5000 power unless noted). */
export const LD = {
  /** OP03-040 Nami: Blue, 5 Life, {East Blue}, Wisdom. Only a [DON!! x1] attack rider. */
  nami: 'OP03-040',
  /** P-117 Nami: Blue, 5 Life, {East Blue}, Wisdom. Deck rule and a [DON!! x1] attack rider. */
  nami2: 'P-117',
  /** ST01-001 Monkey.D.Luffy: Red, 5 Life, {Straw Hat Crew}, Strike. [Activate: Main] only. */
  shc: 'ST01-001',
  /** OP02-093 Smoker: Black, 5 Life, {Navy}, Special. [DON!! x1] [Activate: Main] only. */
  navy: 'OP02-093',
  /** OP05-022 Donquixote Rosinante: Blue/Green, 4 Life, {Donquixote Pirates}/{Navy}, [Blocker]. */
  donqNavy: 'OP05-022',
  /** OP12-041 Sanji: Blue/Purple, 4 Life, {Straw Hat Crew}/{The Vinsmoke Family}, Strike. */
  vinsmoke: 'OP12-041',
  /** OP01-060 Donquixote Doflamingo: Blue, 5 Life, {Donquixote Pirates}/{Seven Warlords}, Special. */
  donq: 'OP01-060',
  /** ST03-001 Crocodile: Blue, 5 Life, {Baroque Works}/{Seven Warlords}, Special. */
  bw: 'ST03-001',
  /** OP09-062 Nico Robin: Purple/Yellow, 4 Life, {Straw Hat Crew}, Strike, [Banish]. */
  robin: 'OP09-062',
  /** OP07-097 Vegapunk: Yellow, 2 Life, {Scientist}/{Egghead}, Wisdom. Cannot attack. */
  vegapunk: 'OP07-097',
  /** ST09-001 Yamato: Yellow, 5 Life, {Land of Wano}, Strike. */
  neutral: 'ST09-001',
} as const;

/** Scenery Characters (no relevant text unless noted). */
export const CH = {
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, Wisdom. */
  mohji: 'OP02-060',
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000, Strike. */
  komachiyo: 'OP01-010',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. */
  sai: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. */
  marco: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. */
  hajrudin: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000, Wisdom. */
  thatch: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. */
  littleOars: 'OP02-020',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000. */
  shiki: 'OP12-005',
  /** OP02-077 Solitaire: Purple, cost 3, 5000, {Animal Kingdom Pirates}/{SMILE}. */
  solitaire: 'OP02-077',
  /** OP02-080 Dobon: Purple, cost 2, 4000, {Animal Kingdom Pirates}/{SMILE}. */
  dobon: 'OP02-080',
  /** ST04-009 Ginrummy: Purple, cost 1, 3000, {Animal Kingdom Pirates}/{SMILE}. */
  ginrummy: 'ST04-009',
  /** OP01-107 Babanuki: Purple, cost 5, 7000, {Animal Kingdom Pirates}/{SMILE}. */
  babanuki: 'OP01-107',
  /** OP14-095 Mr.9: Black, cost 5, 6000, Counter +2000, {Baroque Works}. */
  mr9: 'OP14-095',
  /** OP02-053 Crocodile: Blue, cost 5, 7000, {Impel Down}/{Former Baroque Works}. */
  formerBw: 'OP02-053',
  /** OP02-054 Gecko Moria: Blue, cost 4, 6000, {Seven Warlords}/{Thriller Bark Pirates}. */
  moria: 'OP02-054',
  /** OP06-094 Lola: Black, cost 4, 6000, {Thriller Bark Pirates}. */
  lola: 'OP06-094',
  /** OP13-107 Shaka: Yellow, cost 5, 7000, {Scientist}/{Egghead}, Wisdom. */
  shaka: 'OP13-107',
  /** OP07-108 Vega Force 01: Yellow, cost 4, 6000, {Egghead}. */
  vegaForce: 'OP07-108',
  /** OP03-103 Bobbin the Disposer: Yellow, cost 2, 4000, {Big Mom Pirates}. */
  bobbin: 'OP03-103',
  /** ST07-006 Charlotte Flampe: Yellow, cost 2, 4000, {Big Mom Pirates}. */
  flampe: 'ST07-006',
  /** ST07-002 Charlotte Anana: Yellow, cost 1, 3000, {Big Mom Pirates}, Wisdom. */
  anana: 'ST07-002',
  /** OP03-106 Charlotte Opera: Yellow, cost 4, 6000, {Big Mom Pirates}. */
  opera: 'OP03-106',
  /** OP17-107 Charlotte Daifuku: Yellow, cost 3, 4000, {Big Mom Pirates}, [Trigger] Play this card. */
  daifuku: 'OP17-107',
  /** OP01-104 Speed: Purple, cost 2, 3000, [Trigger] Play this card. */
  trigSpeed: 'OP01-104',
  /** OP01-009 Carrot: Red, cost 2, 3000, [Trigger] Play this card. */
  trigCarrot: 'OP01-009',
  /** OP16-105 Gecko Moria: Yellow, cost 6, 7000, a [Trigger] needing 1 or less Life. */
  trig7000: 'OP16-105',
  /** OP02-081 Domino: Purple, cost 2, 2000, [Blocker]. */
  domino: 'OP02-081',
  /** OP17-074 Yamato: Purple, cost 3, 1000, [Blocker] (keyword present in the card data). */
  blocker3: 'OP17-074',
  /** OP09-072 Franky: Purple, cost 4, 5000, [Blocker]; [On Play] only when played. */
  blocker4: 'OP09-072',
  /** OP04-026 Senor Pink: Green, cost 3, 5000, [When Attacking] only. */
  pink: 'OP04-026',
  /** OP10-067 Senor Pink: Purple, cost 5, 6000, [On Play] only. */
  pink2: 'OP10-067',
} as const;

/** Events used as scenery. Only cards with a script in cards/effects can do anything when played. */
export const EV = {
  /** EB05-049 Special Hollow: Black Event, cost 1, [Main] may K.O. 1 own {Thriller Bark Pirates}: opposing Character -3 cost this turn. Used only to make a cost-0 Character. */
  hollow: 'EB05-049',
  /** OP06-058 Gravity Blade Raging Tiger: Blue Event, cost 7, [Main] place up to 2 Characters (cost <= 6) at the bottom of the owner's deck. */
  gravity: 'OP06-058',
  /** EB01-059 Kingdom Come: Yellow Event, cost 6, [Main] K.O. up to 1 opposing Character, then trash Life down to 1. */
  kingdom: 'EB01-059',
  /** OP07-077 Purple Event, cost 1, has a [Trigger]. */
  trigEvent: 'OP07-077',
} as const;

/**
 * Say yes to the "use this cost?" question and pay any DON!! cost, stopping at the first other
 * decision (the effect's own choices) so a test can inspect it.
 */
export function beginUse(g: TestGame, player: PlayerId = 'p1'): void {
  for (let i = 0; i < 12; i++) {
    const d = decision(g);
    if (!d || d.player !== player) return;
    if (d.kind === 'optional') accept(g);
    else if (d.kind === 'choose' && d.purpose === 'cost' && donChoices(g).length) payDon(g, 1);
    else return;
  }
}

/** A deck filler that is NOT Wisdom (the kit fillers BLUE/RED/PURPLE are all Wisdom). */
export const STRIKE_FILL = CH.komachiyo;
