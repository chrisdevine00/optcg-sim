import type { MouseEvent, ReactNode } from 'react';

/** The Vite base (`/optcg-sim`), the way the router builds its hrefs. */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** `/rules/cr/7-1-4-1` for a CR number, kept in one place so links and tests agree. */
export const rulePath = (cr: string): string => `/rules/cr/${cr}`;

/**
 * A citation of one Comprehensive Rules number. It opens the reference in a new tab so a lesson, a
 * tutorial step or a drill is not lost (flows F2 step 1), and says so in its name (WCAG 3.2.5):
 * `<RuleLink cr="7-1-4-1">Rule: CR 7-1-4-1</RuleLink>` is read "Rule: CR 7-1-4-1 (opens in a new tab)".
 */
export function RuleLink({
  cr,
  children,
  onOpen,
  className,
}: {
  /** `7-1-4-1`, without the `CR` and without a slash. */
  cr: string;
  children?: ReactNode;
  /** Called when the link is followed (the tutorial counts it as an explanation opened). */
  onOpen?: (e: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}) {
  return (
    <a
      className={className ?? 'rule-link'}
      href={BASE + rulePath(cr)}
      target="_blank"
      rel="noopener"
      onClick={onOpen}
    >
      {children ?? `CR ${cr}`}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
