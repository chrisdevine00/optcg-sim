/** `/reviews` (History) and `/reviews/:id` (a saved game's review). Stub pages until WP6. */
export default function ReviewsRoute({ path }: { path: string }) {
  const id = path.startsWith('/reviews/')
    ? decodeURIComponent(path.slice('/reviews/'.length))
    : null;
  return (
    <main className="page" id="main">
      <h1>{id ? 'Review' : 'Reviews'}</h1>
      <p>Coming in M8.</p>
    </main>
  );
}
