/**
 * Every card number in the 36 sourced meta lists (docs/research/meta-lists.json), Leaders included:
 * the M4b coverage scope. Not the same as `verified` (OP05-022 is verified but in no list).
 */
import meta from '../../../docs/research/meta-lists.json';

interface MetaFile {
  archetypes: { leaderId: string; lists: { leader: string; main: { id: string }[] }[] }[];
}

export const META_IDS: ReadonlySet<string> = new Set(
  (meta as unknown as MetaFile).archetypes.flatMap((a) => [
    a.leaderId,
    ...a.lists.flatMap((l) => [l.leader, ...l.main.map((c) => c.id)]),
  ]),
);
