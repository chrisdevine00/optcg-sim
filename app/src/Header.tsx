import { Link, usePath } from './router.tsx';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/play', label: 'Play' },
  { to: '/cards', label: 'Cards' },
];

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
          <Link key={n.to} to={n.to} aria-current={path === n.to ? 'page' : undefined}>
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
