import { StubPage } from '../routes/Stub.tsx';

/** M9 WP0 stub: the owning package replaces this page. */
export default function ShowMe({ path }: { path: string }) {
  return <StubPage title="Show me" note="WP5 builds the demo board here." path={path} full />;
}
