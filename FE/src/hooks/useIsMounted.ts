import { useState, useEffect } from 'react';

/**
 * Hook to detect if component has mounted on the client
 * Essential for preventing hydration flashes in SSR/Next.js
 */
export const useIsMounted = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
};
