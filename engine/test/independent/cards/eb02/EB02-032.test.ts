/**
 * EB02-032 Iceburg (Character, Purple, cost 1, 0 power, Counter +2000, {Galley-La Company}/{Water Seven}).
 *
 * Card text: "[On Play] If you have 3 or more DON!! cards on your field, look at 7 cards from the top
 * of your deck; reveal up to 1 [Galley-La Company] and add it to your hand. Then, place the rest at
 * the bottom of your deck in any order and play up to 1 [Galley-La Company] from your hand."
 *
 * Reading: the bracketed text is a card name, as in the sibling Carrot (EB02-013): the Stage
 * OP03-075 Galley-La Company. The decoy is OP08-039 Zou (Stage, cost 3).
 * Rules: "up to" (CR 8-4-4-1/-2); "DON!! cards on your field" counts the cost area and given DON!!.
 */
import { describeLookPlay } from './kit-eb02a.ts';

describeLookPlay({ id: 'EB02-032', named: 'OP03-075', decoy: 'OP08-039' });
