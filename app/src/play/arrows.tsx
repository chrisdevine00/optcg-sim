import { Fragment, type ReactNode } from 'react';

/**
 * Screen readers speak "→" as "right arrow" (L-SR7). The glyph is for the eye (`aria-hidden`);
 * the ear gets "to". Used for panel titles, log lines and "5000 → 7000 this turn".
 */
export function Arrows({ text }: { text: string }): ReactNode {
  const parts = text.split('→');
  if (parts.length === 1) return text;
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <>
              <span aria-hidden="true">→</span>
              <span className="sr-only">to</span>
            </>
          )}
          {p}
        </Fragment>
      ))}
    </>
  );
}

/** The same for a plain string (live regions, aria-labels). */
export const spokenArrows = (t: string): string => t.replace(/\s*→\s*/g, ' to ');
