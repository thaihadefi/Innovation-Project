'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { getServerApiUrl } from '@/utils/get-server-api-url';

interface AuthData {
  isLogin: boolean;
  infoCandidate: any;
  infoCompany: any;
  authLoading: boolean;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthData | undefined>(undefined);

export function AuthProvider({ 
  children,
  initialAuth
}: { 
  children: ReactNode;
  initialAuth?: any;
}) {
  const [isLogin, setIsLogin] = useState<boolean>(!!(initialAuth?.infoCandidate || initialAuth?.infoCompany));
  const [infoCandidate, setInfoCandidate] = useState<any>(initialAuth?.infoCandidate || null);
  const [infoCompany, setInfoCompany] = useState<any>(initialAuth?.infoCompany || null);
  const [authLoading, setAuthLoading] = useState(!initialAuth);

  const fetchAuth = useCallback(() => {
    setAuthLoading(true);
    const apiUrl = getServerApiUrl();
    fetch(`${apiUrl}/auth/check`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        const loggedIn = data.code === "success";
        setIsLogin(loggedIn);
        setInfoCandidate(data.infoCandidate || null);
        setInfoCompany(data.infoCompany || null);
        setAuthLoading(false);
      })
      .catch(() => {
        setAuthLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!initialAuth) {
      fetchAuth();
    }
  }, [initialAuth, fetchAuth]);

  const refreshAuth = useCallback(() => {
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
