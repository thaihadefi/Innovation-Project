'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import type { CandidateInfo, CompanyInfo, ServerAuth } from '@/types/auth';

interface AuthData {
  isLogin: boolean;
  infoCandidate: CandidateInfo | null;
  infoCompany: CompanyInfo | null;
  authLoading: boolean;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthData | undefined>(undefined);

export function AuthProvider({ 
  children,
  initialAuth
}: { 
  children: ReactNode;
  initialAuth?: ServerAuth;
}) {
  const [isLogin, setIsLogin] = useState<boolean>(!!(initialAuth?.infoCandidate || initialAuth?.infoCompany));
  const [infoCandidate, setInfoCandidate] = useState<CandidateInfo | null>(initialAuth?.infoCandidate || null);
  const [infoCompany, setInfoCompany] = useState<CompanyInfo | null>(initialAuth?.infoCompany || null);
  const [authLoading, setAuthLoading] = useState(!initialAuth);

  const fetchAuth = useCallback(async () => {
    setAuthLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check`, {
        credentials: "include",
      });
      const data: { code?: string; infoCandidate?: CandidateInfo; infoCompany?: CompanyInfo } = await res.json();
      setIsLogin(data.code === "success");
      setInfoCandidate(data.infoCandidate || null);
      setInfoCompany(data.infoCompany || null);
    } catch {
      // leave existing auth state untouched on a network error
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialAuth) {
      void fetchAuth();
    }
  }, [initialAuth, fetchAuth]);

  const refreshAuth = useCallback(() => {
    void fetchAuth();
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
