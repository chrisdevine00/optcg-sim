/**
 * ST29-009 Nico Robin (Character, Yellow, cost 4, 2000, Counter +2000, {Straw Hat Crew}/{Egghead}).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.)
 * [Trigger] If your Leader is [Monkey.D.Luffy], play this card."
 *
 * Rules: [Blocker] (CR 10-1-1) is used in the Block Step by resting an active Blocker; the Trigger
 * fires only when taken as damage and its "If" looks at my own Leader's name.
 */
import { describeBlocker, describeLuffyTrigger } from './kit-st29a.ts';

const ID = 'ST29-009';

describeBlocker({ id: ID, cost: 4, power: 2000, counter: 2000 });
describeLuffyTrigger({ id: ID, cost: 4, power: 2000, counter: 2000 });
