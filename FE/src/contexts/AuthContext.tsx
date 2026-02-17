'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

interface AuthData {
  isLogin: boolean;
  infoCandidate: any;
  infoCompany: any;
  authLoading: boolean;
  refreshAuth: () => void;
}

interface InitialAuth {
  infoCandidate: any;
  infoCompany: any;
  candidateUnreadCount?: number;
  companyUnreadCount?: number;
}

interface InitialAuthState {
  isLogin: boolean;
  infoCandidate: any;
  infoCompany: any;
  hasInitialData: boolean;
}

const AuthContext = createContext<AuthData | undefined>(undefined);

// Helper to get initial state from server or sessionStorage (client-side only)
const getInitialAuthState = (initialAuth?: InitialAuth | null): InitialAuthState => {
  if (initialAuth !== undefined) {
    const infoCandidate = initialAuth?.infoCandidate || null;
    const infoCompany = initialAuth?.infoCompany || null;
    return {
      isLogin: !!(infoCandidate || infoCompany),
      infoCandidate,
      infoCompany,
      hasInitialData: true
    };
  }
  
  if (typeof window === 'undefined') {
    return { isLogin: false, infoCandidate: null, infoCompany: null, hasInitialData: false };
  }
  
  try {
    const cached = sessionStorage.getItem('auth_data');
    const cacheTime = sessionStorage.getItem('auth_time');
    
    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      // Use cache if less than 5 minutes old
      if (age < 5 * 60 * 1000) {
        const data = JSON.parse(cached);
        return {
          isLogin: !!data.isLogin,
          infoCandidate: data.infoCandidate || null,
          infoCompany: data.infoCompany || null,
          hasInitialData: true
        };
      }
    }
  } catch {
    // Ignore errors
  }
  
  return { isLogin: false, infoCandidate: null, infoCompany: null, hasInitialData: false };
};

export function AuthProvider({ 
  children,
  initialAuth
}: { 
  children: ReactNode;
  initialAuth?: InitialAuth | null;
}) {
  // Initialize from server or cache to prevent flash on navigation
  const initialState = getInitialAuthState(initialAuth);
  const [isLogin, setIsLogin] = useState(initialState.isLogin);
  const [infoCandidate, setInfoCandidate] = useState<any>(initialState.infoCandidate);
  const [infoCompany, setInfoCompany] = useState<any>(initialState.infoCompany);
  const [authLoading, setAuthLoading] = useState(!initialState.hasInitialData); // Not loading if we have initial data

  const fetchAuth = useCallback(() => {
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
  }, []);

  useEffect(() => {
    if (initialAuth !== undefined) {
      try {
        const authData = {
          isLogin: !!(initialAuth?.infoCandidate || initialAuth?.infoCompany),
          infoCandidate: initialAuth?.infoCandidate || null,
          infoCompany: initialAuth?.infoCompany || null,
        };
        sessionStorage.setItem('auth_data', JSON.stringify(authData));
        sessionStorage.setItem('auth_time', Date.now().toString());
      } catch {
        // Ignore cache errors
      }
      return;
    }
    fetchAuth();
  }, [initialAuth, fetchAuth]);

  const refreshAuth = useCallback(() => {
    // Clear cache and re-fetch
    sessionStorage.removeItem('auth_data');
    sessionStorage.removeItem('auth_time');
    fetchAuth();
  }, [fetchAuth]);

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
