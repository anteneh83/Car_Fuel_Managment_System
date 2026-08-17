'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DriverProfileRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/monitor/dashboard');
  }, [router]);
  return null;
}
