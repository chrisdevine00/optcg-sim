/**
 * Invariants (ARCHITECTURE §2.6). Every quantity comes from the game's own setup facts; nothing is
 * hard-coded, so a 6-card DON!! deck (OP15-058 Enel) or a scenario's smaller deck check cleanly.
 */
import type { InstanceId } from './api.ts';
import { MAX_CHARACTERS } from './flow.ts';
import { PLAYERS, type State, type Zone } from './state.ts';

const ZONES = ['deck', 'hand', 'life', 'characters', 'stage', 'trash'] as const;

export function checkInvariants(s: State): string[] {
  const errors: string[] = [];
  const seen = new Map<InstanceId, string>();
  const note = (id: InstanceId, where: string, zone: Zone, owner: string): void => {
    const prev = seen.get(id);
    if (prev) errors.push(`${id} is in two places: ${prev} and ${where}`);
    seen.set(id, where);
    const c = s.cards[id];
    if (!c) {
      errors.push(`${where} holds unknown instance ${id}`);
      return;
    }
    if (c.zone !== zone) errors.push(`${id} is listed in ${where} but records zone ${c.zone}`);
    if (c.owner !== owner) errors.push(`${id} is in ${where} but owned by ${c.owner}`);
  };
  for (const p of PLAYERS) {
    const ps = s.players[p];
    note(ps.leader, `${p}.leader`, 'leader', p);
    for (const z of ZONES) for (const id of ps[z]) note(id, `${p}.${z}`, z, p);
    if (ps.characters.length > MAX_CHARACTERS)
      errors.push(`${p} has ${ps.characters.length} Characters (max 5, CR 3-7-6)`);
    if (ps.stage.length > 1) errors.push(`${p} has ${ps.stage.length} Stages (max 1, CR 3-8-5)`);
    if (ps.donDeck < 0 || ps.donActive < 0 || ps.donRested < 0)
      errors.push(`${p} has a negative DON!! count`);
  }
  for (const id of s.resolving) {
    const c = s.cards[id];
    note(id, 'resolving', 'resolving', c?.owner ?? '?');
  }
  for (const id of Object.keys(s.cards)) {
    if (!seen.has(id)) errors.push(`${id} is in no zone`);
  }
  for (const p of PLAYERS) {
    const ps = s.players[p];
    let owned = 0;
    let given = 0;
    for (const id of Object.keys(s.cards)) {
      const c = s.cards[id]!;
      if (c.owner !== p) continue;
      owned++;
      if (c.don > 0) {
        if (c.zone !== 'leader' && c.zone !== 'characters')
          errors.push(
            `${id} in ${c.zone} has ${c.don} given DON!!; only Leaders and Characters may`,
          );
        given += c.don;
      }
      if (c.rested && !['leader', 'characters', 'stage'].includes(c.zone))
        errors.push(`${id} is rested in ${c.zone}`);
      if (!s.defs[c.card]) errors.push(`${id} has no definition for ${c.card}`);
    }
    const want = s.setup.deckSize[p] + 1;
    if (owned !== want)
      errors.push(`${p} owns ${owned} cards across zones; setup says ${want} (deck + Leader)`);
    const don = ps.donDeck + ps.donActive + ps.donRested + given;
    if (don !== s.setup.donSize[p])
      errors.push(`${p} has ${don} DON!! in total; setup says ${s.setup.donSize[p]}`);
  }
  // Exactly one player owes a decision unless the game is over.
  if (s.result === null && s.decision === null)
    errors.push('No decision is pending and the game is not over');
  if (s.result !== null && s.decision !== null)
    errors.push('The game is over but a decision is pending');
  if (s.decision && s.decision.player !== 'p1' && s.decision.player !== 'p2')
    errors.push(`Decision owner ${String(s.decision.player)} is not a player`);
  if (s.battle && s.phase !== 'main') errors.push(`A battle is open outside the Main Phase`);
  for (const m of s.mods) {
    if (!s.cards[m.target]) errors.push(`Modifier ${m.id} targets missing instance ${m.target}`);
  }
  return errors;
}
