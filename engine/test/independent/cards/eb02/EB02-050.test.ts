/**
 * EB02-050 Kokoro no Chizu (Music Event, cost 2).
 *
 * Card text: "[Main] Look at 4 cards from the top of your deck; reveal up to 1 card with a cost of 4 or
 * more and add it to your hand. Then, place the rest at the bottom of your deck in any order.
 * [Trigger] Activate this card's [Main] effect."
 *
 * Rules: look at exactly the top 4 (CR 11-3); "up to 1" may be 0; the added card is revealed because it
 * moves from a secret area to a secret area (CR 11-2-1); the rest go to the bottom in the owner's order;
 * a [Trigger] activation runs the [Main] effect without paying the cost.
 */
import { describeMusic } from './kit-eb02b.ts';

describeMusic({ id: 'EB02-050', name: 'Kokoro no Chizu' });
