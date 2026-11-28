/**
 * Helpers for the OP-18 group-A independent card tests (OP18-021, -026, -027, -031, -034, -038,
 * -061, -066). Public API, frozen fixtures and the earlier kits only. Scenery stats are noted next
 * to each constant; tests repeat the ones they rely on. None of the scenery below has a script that
 * fires in these positions.
 */
export * from '../op10/kit-op10a.ts';

/** Stages used as scenery (none is scripted; Stage text is inert unless a test says otherwise). */
export const STG = {
  /** OP03-075 Galley-La Company: Purple Stage, cost 3, {Galley-La Company}/{Water Seven}. */
  galley: 'OP03-075',
  /** OP03-020 Striker: Red Stage, cost 1, {Whitebeard Pirates}. */
  striker: 'OP03-020',
  /** OP05-040 Birdcage: Blue Stage, cost 5, type NULL. */
  birdcage: 'OP05-040',
  /** OP06-041 The Ark Noah: Blue Stage, cost 6, {Fish-Man Island}. */
  ark: 'OP06-041',
  /** EB02-060 Merry Go: Stage, cost 2, {Straw Hat Crew}. Scripted [Activate: Main] only. */
  merry: 'EB02-060',
} as const;

/** Characters used as scenery (all vanilla). */
export const CH = {
  /** OP02-028 Usopp: Green, cost 3, 5000, Counter +1000, {FILM}/{Straw Hat Crew}. */
  usopp3: 'OP02-028',
  /** OP02-043 Roronoa Zoro: Green, cost 4, 6000, Counter +1000, {FILM}/{Straw Hat Crew}/{Supernovas}. */
  zoro4: 'OP02-043',
  /** OP02-039 Franky: Green, cost 5, 7000, Counter +1000, {FILM}/{Straw Hat Crew}. */
  franky5: 'OP02-039',
  /** OP10-014 Franky: Red, cost 6, 8000, Counter +1000, {Animal}/{Straw Hat Crew}/{Punk Hazard}. */
  franky6: 'OP10-014',
  /** OP03-061 Kiwi & Mozu: Purple, cost 2, 4000, Counter +1000, {Water Seven}/{The Franky Family}. */
  kiwi2: 'OP03-061',
  /** OP05-065 San-Gorou: Purple, cost 6, 8000, Counter +1000, {Straw Hat Crew}. */
  sanGorou6: 'OP05-065',
  /** OP02-033 Jinbe: Green, cost 2, 4000, Counter +1000, {FILM}/{Fish-Man}/{Straw Hat Crew}. */
  jinbe2: 'OP02-033',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, no relevant type. */
  marco3: 'OP01-023',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000, no relevant type. */
  thatch6: 'OP02-007',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000, no relevant type. */
  kingdew5: 'OP02-006',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000, no relevant type. */
  hajrudin4: 'OP01-018',
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, {Buggy Pirates}. */
  mohji1: 'OP02-060',
} as const;

/** Leaders used as scenery. */
export const LDR = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. Own [Activate: Main] only. */
  luffy: 'ST01-001',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life, {Supernovas}/{Kid Pirates}. Own [Activate: Main] only. */
  kid: 'ST02-001',
  /** ST04-001 Kaido: Purple, 5000, 5 Life, {Animal Kingdom Pirates}/{The Four Emperors}. Own [Activate: Main] only. */
  kaido: 'ST04-001',
  /** OP17-058 Kaido: Purple, 5000, 5 Life, used by the OP17 tests as the DON!! -2 opponent. */
  kaido17: 'OP17-058',
} as const;

/** OP09-077 Gum-Gum Lightning: Purple Event, cost 2, "[Main] DON!! -2: K.O. up to 1 of your opponent's Characters with 6000 power or less". */
export const LIGHTNING = 'OP09-077';
