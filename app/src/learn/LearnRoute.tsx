import { StubPage } from '../routes/Stub.tsx';

/** M9 WP0 stub: the owning package replaces this page. */
export default function LearnRoute({ path }: { path: string }) {
  return <StubPage title="Learn" note="WP6 builds the course hub here." path={path} />;
}
