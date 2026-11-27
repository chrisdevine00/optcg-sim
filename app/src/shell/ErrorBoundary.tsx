import { Component, type ReactNode } from 'react';

/**
 * M10 WP0: the wiring point for a route's error boundary. App.tsx mounts it around the shell and
 * around every route, so WP6 can fill in the failure page (heading, Reload, Copy details, a link
 * home) without touching App.tsx. Until then it renders its children and rethrows nothing: this stub
 * has no error state, so WP6 replaces the class body, keeping the props.
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Which part of the app this boundary guards ("shell" or a route name); WP6 shows it in the details. */
  scope?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps> {
  override render(): ReactNode {
    return this.props.children;
  }
}
