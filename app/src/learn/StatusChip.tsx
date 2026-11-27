import { STATUS_WORD, type LessonStatus } from '../progress/derive.ts';

/** A lesson's status as a shape and a word, never colour alone (accessibility §3.16). */
const GLYPH: Record<LessonStatus, string> = {
  'not-started': '○',
  'in-progress': '◐',
  read: '◆',
  passed: '✓',
  'passed-timed': '✓✓',
};

export function StatusChip({ status, note }: { status: LessonStatus; note?: string }) {
  return (
    <span className={`chip outline lesson-status st-${status}`}>
      <span aria-hidden="true">{GLYPH[status]} </span>
      {STATUS_WORD[status]}
      {note ? ` (${note})` : ''}
    </span>
  );
}
