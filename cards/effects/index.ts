/**
 * The effect-script registry and coverage index (ARCHITECTURE §3, effect-dsl.md E-D1): one typed
 * `CardScript` per card number, from `cards/effects/<SET>/<CARD-ID>.ts`. The engine reads the
 * abilities from here; the app and the coverage report read the set of scripted ids.
 *
 * Coverage (M4a): every card of the Rocks (OP17-039) and Kaido (OP17-058) meta lists, 37 cards.
 */
import type { CardScript } from '../src/dsl.ts';
import { EB01_056 } from './EB-01/EB01-056.ts';
import { EB01_059 } from './EB-01/EB01-059.ts';
import { EB02_052 } from './EB-02/EB02-052.ts';
import { EB04_030 } from './EB-04/EB04-030.ts';
import { EB04_031 } from './EB-04/EB04-031.ts';
import { EB04_032 } from './EB-04/EB04-032.ts';
import { EB04_040 } from './EB-04/EB04-040.ts';
import { EB04_058 } from './EB-04/EB04-058.ts';
import { EB04_059 } from './EB-04/EB04-059.ts';
import { OP05_098 } from './OP-05/OP05-098.ts';
import { OP07_076 } from './OP-07/OP07-076.ts';
import { OP07_077 } from './OP-07/OP07-077.ts';
import { OP08_051 } from './OP-08/OP08-051.ts';
import { OP08_074 } from './OP-08/OP08-074.ts';
import { OP09_062 } from './OP-09/OP09-062.ts';
import { OP09_077 } from './OP-09/OP09-077.ts';
import { OP09_078 } from './OP-09/OP09-078.ts';
import { OP11_106 } from './OP-11/OP11-106.ts';
import { OP12_112 } from './OP-12/OP12-112.ts';
import { OP13_113 } from './OP-13/OP13-113.ts';
import { OP15_069 } from './OP-15/OP15-069.ts';
import { OP15_078 } from './OP-15/OP15-078.ts';
import { OP16_117 } from './OP-16/OP16-117.ts';
import { OP16_119 } from './OP-16/OP16-119.ts';
import { OP17_039 } from './OP-17/OP17-039.ts';
import { OP17_040 } from './OP-17/OP17-040.ts';
import { OP17_042 } from './OP-17/OP17-042.ts';
import { OP17_044 } from './OP-17/OP17-044.ts';
import { OP17_045 } from './OP-17/OP17-045.ts';
import { OP17_046 } from './OP-17/OP17-046.ts';
import { OP17_048 } from './OP-17/OP17-048.ts';
import { OP17_049 } from './OP-17/OP17-049.ts';
import { OP17_050 } from './OP-17/OP17-050.ts';
import { OP17_052 } from './OP-17/OP17-052.ts';
import { OP17_054 } from './OP-17/OP17-054.ts';
import { OP17_055 } from './OP-17/OP17-055.ts';
import { OP17_056 } from './OP-17/OP17-056.ts';
import { OP17_058 } from './OP-17/OP17-058.ts';
import { OP17_060 } from './OP-17/OP17-060.ts';
import { OP17_061 } from './OP-17/OP17-061.ts';
import { OP17_062 } from './OP-17/OP17-062.ts';
import { OP17_063 } from './OP-17/OP17-063.ts';
import { OP17_065 } from './OP-17/OP17-065.ts';
import { OP17_073 } from './OP-17/OP17-073.ts';
import { OP17_074 } from './OP-17/OP17-074.ts';
import { OP17_075 } from './OP-17/OP17-075.ts';
import { OP17_076 } from './OP-17/OP17-076.ts';
import { OP17_077 } from './OP-17/OP17-077.ts';
import { OP17_102 } from './OP-17/OP17-102.ts';
import { OP17_106 } from './OP-17/OP17-106.ts';
import { OP17_107 } from './OP-17/OP17-107.ts';
import { OP17_109 } from './OP-17/OP17-109.ts';
import { OP17_110 } from './OP-17/OP17-110.ts';
import { OP17_111 } from './OP-17/OP17-111.ts';
import { OP17_112 } from './OP-17/OP17-112.ts';
import { OP17_113 } from './OP-17/OP17-113.ts';
import { OP17_114 } from './OP-17/OP17-114.ts';
import { OP17_118 } from './OP-17/OP17-118.ts';
import { ST34_003 } from './ST-34/ST34-003.ts';
import { ST34_004 } from './ST-34/ST34-004.ts';
import { OP08_098 } from './OP-08/OP08-098.ts';
import { EB03_053 } from './EB-03/EB03-053.ts';
import { OP05_117 } from './OP-05/OP05-117.ts';
import { OP08_109 } from './OP-08/OP08-109.ts';
import { OP08_110 } from './OP-08/OP08-110.ts';
import { OP08_115 } from './OP-08/OP08-115.ts';
import { OP12_099 } from './OP-12/OP12-099.ts';
import { OP15_101 } from './OP-15/OP15-101.ts';
import { OP15_108 } from './OP-15/OP15-108.ts';
import { OP15_112 } from './OP-15/OP15-112.ts';
import { OP15_114 } from './OP-15/OP15-114.ts';
import { OP15_119 } from './OP-15/OP15-119.ts';
import { OP05_114 } from './OP-05/OP05-114.ts';
import { OP05_115 } from './OP-05/OP05-115.ts';

const ALL: readonly CardScript[] = [
  EB01_056,
  EB01_059,
  EB02_052,
  EB04_030,
  EB04_031,
  EB04_032,
  EB04_040,
  EB04_058,
  EB04_059,
  OP05_098,
  OP07_076,
  OP07_077,
  OP08_051,
  OP08_074,
  OP09_062,
  OP09_077,
  OP09_078,
  OP11_106,
  OP12_112,
  OP13_113,
  OP15_069,
  OP15_078,
  OP16_117,
  OP16_119,
  OP17_039,
  OP17_040,
  OP17_042,
  OP17_044,
  OP17_045,
  OP17_046,
  OP17_048,
  OP17_049,
  OP17_050,
  OP17_052,
  OP17_054,
  OP17_055,
  OP17_056,
  OP17_058,
  OP17_060,
  OP17_061,
  OP17_062,
  OP17_063,
  OP17_065,
  OP17_073,
  OP17_074,
  OP17_075,
  OP17_076,
  OP17_077,
  OP17_102,
  OP17_106,
  OP17_107,
  OP17_109,
  OP17_110,
  OP17_111,
  OP17_112,
  OP17_113,
  OP17_114,
  OP17_118,
  ST34_003,
  ST34_004,
  OP08_098,
  EB03_053,
  OP05_117,
  OP08_109,
  OP08_110,
  OP08_115,
  OP12_099,
  OP15_101,
  OP15_108,
  OP15_112,
  OP15_114,
  OP15_119,
  OP05_114,
  OP05_115,
];

export const SCRIPTS: Readonly<Record<string, CardScript>> = Object.fromEntries(
  ALL.map((s) => [s.cardId, s]),
);

/** Card numbers with a script, for coverage (`automation`) and the "effect not automated" badges. */
export const SCRIPTED_IDS: ReadonlySet<string> = new Set(Object.keys(SCRIPTS));
