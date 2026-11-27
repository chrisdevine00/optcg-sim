import { Link, usePath } from './router.tsx';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/play', label: 'Play' },
  { to: '/learn', label: 'Learn' },
  { to: '/meta', label: 'Meta' },
  { to: '/decks', label: 'Decks' },
  { to: '/cards', label: 'Cards' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/progress', label: 'Progress' },
  { to: '/settings', label: 'Settings' },
];

/** M9: drills and the rules reference sit under Learn, so their paths keep Learn current. */
const ALSO: Record<string, string[]> = { '/learn': ['/drills', '/rules'] };

export const navItems = NAV;
export const isCurrent = (path: string, to: string): boolean =>
  [to, ...(ALSO[to] ?? [])].some((t) => path === t || (t !== '/' && path.startsWith(t + '/')));

export function Header() {
  const path = usePath();
  return (
    <header className="app-header">
      <Link to="/" className="wordmark">
        <span className="wordmark-mark" aria-hidden="true" />
        OPTCG Sim
      </Link>
      <nav aria-label="Main" className="app-nav">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} aria-current={isCurrent(path, n.to) ? 'page' : undefined}>
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
