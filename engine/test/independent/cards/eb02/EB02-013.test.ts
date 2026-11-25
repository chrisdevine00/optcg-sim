/**
 * EB02-013 Carrot (Character, Green, cost 1, 0 power, Counter +2000, {Minks}).
 *
 * Card text: "[On Play] If you have 3 or more DON!! cards on your field, look at 7 cards from the top
 * of your deck; reveal up to 1 [Zou] and add it to your hand. Then, place the rest at the bottom of
 * your deck in any order and play up to 1 [Zou] from your hand."
 *
 * [Zou] is OP08-039 (Stage, cost 3). The decoy is OP03-075 Galley-La Company (Stage, cost 3).
 * Rules: "up to" (CR 8-4-4-1/-2); "DON!! cards on your field" counts the cost area (active and
 * rested) and DON!! given to cards; effect plays cost nothing.
 */
import { describeLookPlay } from './kit-eb02a.ts';

describeLookPlay({ id: 'EB02-013', named: 'OP08-039', decoy: 'OP03-075' });
