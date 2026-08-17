'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DriverMyTransactionsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/monitor/transactions');
  }, [router]);
  return null;
}
