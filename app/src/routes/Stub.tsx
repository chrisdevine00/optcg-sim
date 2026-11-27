import { useEffect } from 'react';

/**
 * M9 WP0: what every new route renders until its package replaces the page. The heading takes focus
 * on route change (accessibility §3.1), the title follows it. A package deletes its stub's use of this
 * component; nothing else imports it.
 */
export function StubPage({
  title,
  note,
  full = false,
  path,
}: {
  title: string;
  note: string;
  /** A full-screen route (a drill run, a rules demo) has no shell around it. */
  full?: boolean;
  /** The route's path, kept on the page for tests and for the package that replaces the stub. */
  path?: string;
}) {
  useEffect(() => {
    document.title = `${title} · OPTCG Sim`;
    document.getElementById('page-title')?.focus();
  }, [title]);
  return (
    <main
      className={full ? 'page page-full' : 'page'}
      id="main"
      aria-labelledby="page-title"
      data-path={path}
    >
      <h1 id="page-title" tabIndex={-1}>
        {title}
      </h1>
      <p>{note}</p>
    </main>
  );
}
