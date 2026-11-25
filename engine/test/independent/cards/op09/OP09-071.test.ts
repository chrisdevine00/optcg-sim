/**
 * OP09-071 Nico Robin (Character, Purple, cost 2, 2000, Counter +1000, {Straw Hat Crew}).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.)"
 *
 * Rules: CR 10-1-4 ([Blocker]). The printed keyword comes from the verified override.
 */
import { describeVanillaBlocker } from './kit-op09b.ts';

describeVanillaBlocker({ id: 'OP09-071', power: 2000, counter: 1000, cost: 2 });
