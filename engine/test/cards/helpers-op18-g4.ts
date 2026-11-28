/** Set-ups shared by the OP-18 group g4 tests (CP and {Holy Knights of God} cards). */
import type { PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import { trigGame } from './helpers-op11g1.ts';

/** OP03-076 Rob Lucci: a Leader with the type {CP9} ("type includes CP"). */
export const CP_L = 'OP03-076';
/** OP03-087 Nero: a vanilla {CP9} Character, cost 3. */
export const CP_CHAR = 'OP03-087';
/** OP18-105 Spandam: a {CP9} Character, cost 1; its only text is a [Trigger]. */
export const SPANDAM = 'OP18-105';
/** Vanilla Characters: cost 8 (10000) and cost 10 (12000). */
export const COST8 = 'EB02-004';
export const COST10 = 'P-041';
/** OP18-085 Cerberus: {Holy Knights of God}, cost 1, only an [Activate: Main]. */
export const HK1 = 'OP18-085';
/** OP18-119 Saint Shamrock: {Holy Knights of God}, cost 8. */
export const HK8 = 'OP18-119';

/** p2 attacks p1's Leader (a {CP} Leader unless `p1.leader` says otherwise); stops at the [Trigger] of `top`. */
export const trig = (
  top: string,
  p1: Partial<PlayerSpec> = {},
  p2chars: NonNullable<PlayerSpec['characters']> = [],
): TestGame => trigGame(top, { leader: CP_L, ...p1 }, p2chars);

/** The cards of a zone in order (the deck's first is its top). */
export const zoneOf = (g: TestGame, p: 'p1' | 'p2', zone: Parameters<TestGame['zone']>[1]) =>
  g.zone(p, zone).map((c) => c.card);
