'use client';

import { ErrorBoundary } from '@/app/components/ui/ErrorBoundary';
import { DashboardPage } from '@/app/components/pages';

export default function Home() {
  return (
    <ErrorBoundary>
      <DashboardPage />
    </ErrorBoundary>
  );
}