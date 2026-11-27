import { useEffect } from 'react';
import { Link, usePath } from '../router.tsx';
import '../styles/about.css';

/** The page for an address no route handles: its heading takes focus, and four links lead on. */
export function NotFound() {
  const path = usePath();
  useEffect(() => {
    document.title = 'Page not found - OPTCG Sim';
    document.getElementById('page-title')?.focus();
  }, [path]);
  return (
    <main className="page not-found" id="main" aria-labelledby="page-title">
      <h1 id="page-title" tabIndex={-1}>
        Page not found
      </h1>
      <p>There is nothing at this address.</p>
      <ul className="not-found-links">
        {(
          [
            ['/', 'Home'],
            ['/play', 'Play'],
            ['/learn', 'Learn'],
            ['/cards', 'Cards'],
          ] as const
        ).map(([to, label]) => (
          <li key={to}>
            <Link className="btn" to={to}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
