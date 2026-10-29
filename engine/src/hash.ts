/**
 * Semantic hash (ARCHITECTURE §2.9, ADR 0004). It hashes a canonical *game summary*: card ids per
 * zone in order, card states, given DON!!, DON!! counts, modifiers by kind and amount, turn, phase,
 * battle, decision, pending effects and interpreter frames, result and the RNG state. Instance ids are replaced by board positions, so a
 * refactor that changes id allocation or field names, but not the game, keeps every golden hash.
 */
import type { InstanceId } from './api.ts';
import { PLAYERS, type State } from './state.ts';

const ZONES = ['leader', 'characters', 'stage', 'hand', 'deck', 'life', 'trash'] as const;

export function summary(s: State): unknown {
  const pos = new Map<InstanceId, string>();
  const players: Record<string, unknown> = {};
  for (const p of PLAYERS) {
    const ps = s.players[p];
    const z: Record<string, unknown> = {};
    for (const zone of ZONES) {
      const ids = zone === 'leader' ? [ps.leader] : ps[zone];
      z[zone] = ids.map((id, i) => {
        pos.set(id, `${p}.${zone}.${i}`);
        const c = s.cards[id]!;
        const parts: (string | number)[] = [c.card];
        if (c.rested) parts.push('R');
        if (c.faceUp && (zone === 'life' || zone === 'deck' || zone === 'hand')) parts.push('U');
        if (c.don) parts.push(`D${c.don}`);
        if (c.played === s.turn && (zone === 'characters' || zone === 'stage')) parts.push('P');
        return parts.join(':');
      });
    }
    z.don = [ps.donDeck, ps.donActive, ps.donRested];
    players[p] = z;
  }
  s.resolving.forEach((id, i) => pos.set(id, `resolving.${i}`));
  // Replace every instance id anywhere in a value with its board position (M2-08).
  const canon = (v: unknown): unknown => {
    if (typeof v === 'string') return ID.test(v) ? (pos.get(v) ?? 'gone') : v;
    if (Array.isArray(v)) return v.map(canon);
    if (v && typeof v === 'object')
      return Object.fromEntries(
        Object.keys(v)
          .sort()
          .map((k) => [k, canon((v as Record<string, unknown>)[k])]),
      );
    return v;
  };
  const mods = s.mods
    .map((m) => {
      const { id: _id, ...rest } = m;
      return JSON.stringify(canon(rest));
    })
    .sort();
  const dec = s.decision;
  return {
    turn: s.turn,
    active: s.active,
    first: s.first,
    phase: s.phase,
    players,
    resolving: s.resolving.map((id) => s.cards[id]!.card),
    battle: canon(s.battle),
    decision: dec && canon({ ...dec, prompt: undefined }),
    // Pending obligations: remaining damage, play steps, queued auto effects (M2-08).
    stack: canon(s.stack),
    pending: canon(s.pending),
    mods,
    oncePerTurn: s.oncePerTurn.map((k) => {
      const [id, ab] = k.split('/');
      return `${canon(id)}/${ab}`;
    }),
    result: s.result,
    rng: s.rng,
  };
}

/** Engine instance ids (`Draft.newId`). Card numbers never match. */
const ID = /^c[a-z0-9]{7}$/;

/** 53-bit string hash (cyrb53), run twice with different seeds for a 106-bit digest. */
function cyrb53(str: string, seed: number): string {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

export function hashString(str: string): string {
  return cyrb53(str, 0) + cyrb53(str, 0x9e3779b9);
}

export function summaryHash(s: State): string {
  return hashString(JSON.stringify(summary(s)));
}
