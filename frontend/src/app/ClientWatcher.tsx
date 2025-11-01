'use client';

import { useEffect } from 'react';
import { startAuthWatcher } from '@/utils/authWatcher';

export default function ClientWatcher() {
  useEffect(() => {
    startAuthWatcher();
  }, []);

  return null; // não renderiza nada visualmente
}
