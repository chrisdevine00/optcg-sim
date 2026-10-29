/**
 * Scenario starts for the scripted screen-reader passes (accessibility.md §11.2, §11.3).
 * `/play?scenario=a11y-m3&speed=step&start=1` is the M3 script's position. Every card is a real
 * M4a-scripted card from the Kaido list (cards/effects/), so the effect text the script hears is
 * the printed text. Seeds are fixed so the AI's moves, and so the expected speech, are stable.
 */
import type { ScenarioSpec } from '@optcg/engine';

type Spec = Omit<ScenarioSpec, 'cards'> & { mode: 'ai' | 'hotseat' };

const filler = (id: string, n: number) => Array.from({ length: n }, () => id);

export const A11Y_SCENARIOS: Record<string, Spec> = {
  /**
   * M3 script (§11.3): you (Kaido, OP17-058) against Rookie (Kaido), turn 3, your Main Phase.
   * Turn 3, not 1: on turn 1 no one may attack, so step 7 would hear that reason instead of "it was
   * played this turn". With seed 11 and the script's own moves, Rookie's turn 4 attacks with King
   * (7000) first, then twice for no damage, then its Leader hits and reveals your [Trigger].
   * - Step 5: Black Maria (OP08-074) is a playable Character with no [On Play].
   * - Step 9: your two Kaido (OP17-062) are Blockers; your hand holds Counters: X.Drake +2000,
   *   Nola +2000, Yamato +1000. The AI's King (EB04-031, 7000) attacks your 5000 Leader, so
   *   +2000 ties and a further +1000 survives.
   * - Step 11: every Life card of yours has a [Trigger] (OP09-077, OP07-076, OP17-076).
   * - Step 13: Queen (OP17-065) [On Play] picks up to 2 of the AI's Characters with a cost of 5
   *   or less: Yamato and Basil Hawkins can be chosen; King (cost 6) cannot.
   * - Step 14: a DON!! returned on your turn (Kaido's or Queen's DON!! −1) triggers both of your
   *   Kaido (OP17-062) at once: an `order` decision.
   * - The AI's side has Blockers (Yamato), Counters, a [Trigger] Life card and the same Queen.
   */
  'a11y-m3': {
    mode: 'ai',
    seed: 11,
    turn: 3,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: 'OP17-058',
      life: ['OP09-077', 'OP07-076', 'OP17-076'],
      hand: ['OP08-074', 'OP17-075', 'OP17-074', 'OP15-069', 'OP17-065'],
      characters: ['OP17-062', 'OP17-062'],
      deck: ['OP17-073', 'OP15-078', 'OP17-074', 'EB04-032', 'OP17-075', ...filler('OP15-069', 10)],
      costArea: { active: 6, rested: 2 },
    },
    p2: {
      leader: 'OP17-058',
      life: ['OP09-077', 'OP07-076'],
      hand: ['OP17-065'],
      characters: ['EB04-031', 'OP17-074', 'OP17-073'],
      deck: filler('OP15-069', 12),
      costArea: { active: 0, rested: 0 },
    },
  },
};
