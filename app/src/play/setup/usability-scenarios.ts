/**
 * Scenario starts for the owner's usability session S1 (usability-plan.md §5.2), so every
 * participant sees the same board. `/play?scenario=ub-lethal-1&opp=pirate&start=1`.
 *
 * The participant is always p1. Every card on the board is a scripted card from the Rocks or Kaido
 * lists (cards/effects/), so its printed text is what it does. Life and deck fillers that the task
 * never reaches are vanilla (EB04-007 has no [Trigger]), so no Life card surprises the participant.
 */
import type { ScenarioSpec } from '@optcg/engine';

type Spec = Omit<ScenarioSpec, 'cards'> & { mode: 'ai' | 'hotseat' };

const filler = (id: string, n: number) => Array.from({ length: n }, () => id);

export const USABILITY_SCENARIOS: Record<string, Spec> = {
  /**
   * Task 1.3, "You're being attacked": the opponent's turn 6. Their Rocks Leader (OP17-039) has
   * 3 DON!! given (8000) and nothing else to do (no hand, no Characters, no active DON!!), so its
   * one move is to attack your 5000 Leader; its [When Attacking] needs a card to trash, and it has
   * none. You are at 2 Life. Your hand: two 0-cost [Counter] Events at +2000 (OP17-055, OP17-056),
   * Buckin (+1000 Counter) and Edward.Newgate (no Counter); your Gloriosa (OP17-046, 1000) is a
   * Blocker. The gap is 3000 and the attacker wins ties, so it takes +4000 to survive: both
   * Events. +2000 and +1000 make a 8000 tie, which still hits (the trap the battle panel answers).
   * Blocking with Gloriosa also survives, at the cost of the Character.
   */
  'ub-defend-1': {
    mode: 'ai',
    seed: 21,
    turn: 6,
    activePlayer: 'p2',
    firstPlayer: 'p1',
    p1: {
      leader: 'OP17-039',
      life: filler('EB04-007', 2),
      hand: ['OP17-055', 'OP08-051', 'OP17-056', 'OP17-040'],
      characters: ['OP17-046'],
      deck: filler('EB04-007', 15),
      costArea: { active: 5, rested: 0 },
    },
    p2: {
      leader: { card: 'OP17-039', don: 3 },
      life: filler('EB04-007', 3),
      hand: [],
      deck: filler('EB04-007', 15),
      costArea: { active: 0, rested: 3 },
    },
  },
  /**
   * Task 1.4, "Do you have lethal?": your turn 9 (Kaido, OP17-058) against Rocks at 1 Life with 2
   * hidden cards. You have Kaido (OP17-063, 12000) and 5 active DON!!. Their sourced lists' biggest
   * Counter is +2000 and they run no [Trigger], so 2 cards stop at most +4000, and the first hit
   * adds a third card. Lethal: at least 4 DON!! on the Leader and attack with it first (9000 ties
   * 5000 + 4000, a hit), then Kaido (12000 against at most 11000). Kaido first fails (it hits, but
   * the Leader then meets three cards), and so does any split giving the Leader 3 or fewer. The
   * search proves this against any hand (`app/test/usability-scenarios.test.ts`).
   */
  'ub-lethal-1': {
    mode: 'ai',
    seed: 23,
    turn: 9,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: 'OP17-058',
      characters: ['OP17-063'],
      life: filler('EB04-007', 3),
      hand: [],
      deck: filler('EB04-007', 12),
      costArea: { active: 5, rested: 0 },
    },
    p2: {
      leader: 'OP17-039',
      life: filler('EB04-007', 1),
      hand: ['OP17-056', 'OP17-055'],
      deck: filler('EB04-007', 12),
      costArea: { active: 0, rested: 0 },
    },
  },
  /**
   * Task 1.6, "Play one complete turn using only the keyboard": your turn 5 (Rocks) with 5 active
   * DON!!. Playable: Don Marlon (OP17-052, cost 3, its [On Play] finds nothing in an empty trash)
   * and Streusen (OP17-050, cost 1). Your Captain John (OP17-044, 6000) can attack; their Kaido
   * Leader is at 4 Life with Yamato (OP17-074, a 1000 Blocker). Success needs one play, one DON!!
   * give and one attack.
   */
  'ub-keyboard-1': {
    mode: 'ai',
    seed: 25,
    turn: 5,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: 'OP17-039',
      life: filler('EB04-007', 4),
      hand: ['OP17-052', 'OP17-050', 'OP17-055'],
      characters: ['OP17-044'],
      deck: filler('EB04-007', 15),
      costArea: { active: 5, rested: 0 },
    },
    p2: {
      leader: 'OP17-058',
      life: filler('EB04-007', 4),
      hand: ['OP15-069', 'OP17-075'],
      characters: ['OP17-074'],
      deck: filler('EB04-007', 15),
      costArea: { active: 0, rested: 4 },
    },
  },
};
