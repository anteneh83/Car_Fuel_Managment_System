'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DriverNewTransactionRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/monitor/new-request');
  }, [router]);
  return null;
}
