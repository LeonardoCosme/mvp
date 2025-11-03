'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import ResetPasswordInner from './ResetPasswordInner';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando…</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}