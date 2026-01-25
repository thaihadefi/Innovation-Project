'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

/**
 * Auth Context with sessionStorage caching
 * Benefits:
 * - Single auth check on app load (not per component)
 * - 5-minute cache in sessionStorage
 * - Shared state across all components
 * - Manual refresh capability
 */

interface AuthData {
  isLogin: boolean;
  infoCandidate: any;
  infoCompany: any;
  authLoading: boolean;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthData | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLogin, setIsLogin] = useState(false);
  const [infoCandidate, setInfoCandidate] = useState<any>(null);
  const [infoCompany, setInfoCompany] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchAuth = () => {
    // Check sessionStorage cache first (5 minute TTL)
    const cached = sessionStorage.getItem('auth_data');
    const cacheTime = sessionStorage.getItem('auth_time');
    
    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      // Use cache if less than 5 minutes old
      if (age < 5 * 60 * 1000) {
        try {
          const data = JSON.parse(cached);
          setIsLogin(data.isLogin);
          setInfoCandidate(data.infoCandidate);
          setInfoCompany(data.infoCompany);
          setAuthLoading(false);
          return; // Skip API call!
        } catch {
          // Invalid cache, continue to fetch
        }
      }
    }

    // Fetch from API
    setAuthLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        const authData = {
          isLogin: data.code === "success",
          infoCandidate: data.infoCandidate || null,
          infoCompany: data.infoCompany || null,
        };

        // Cache the result
        sessionStorage.setItem('auth_data', JSON.stringify(authData));
        sessionStorage.setItem('auth_time', Date.now().toString());

        setIsLogin(authData.isLogin);
        setInfoCandidate(authData.infoCandidate);
        setInfoCompany(authData.infoCompany);
        setAuthLoading(false);
      })
      .catch(() => {
        setAuthLoading(false);
      });
  };

  useEffect(() => {
    fetchAuth();
  }, []);

  const refreshAuth = () => {
    // Clear cache and re-fetch
    sessionStorage.removeItem('auth_data');
    sessionStorage.removeItem('auth_time');
    fetchAuth();
  };

  return (
    <AuthContext.Provider value={{ 
      isLogin, 
      infoCandidate, 
      infoCompany, 
      authLoading,
      refreshAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
