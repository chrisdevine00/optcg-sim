import { useEffect } from 'react';

/** M10 WP0: the About page's stub (WP6 writes the content). The heading takes focus on route change. */
export default function AboutRoute() {
  useEffect(() => {
    document.title = 'About · OPTCG Sim';
    document.getElementById('page-title')?.focus();
  }, []);
  return (
    <main className="page" id="main" aria-labelledby="page-title">
      <h1 id="page-title" tabIndex={-1}>
        About
      </h1>
    </main>
  );
}
